import { Connection } from 'mongoose';
import { MetadataGoulagModel, MetadataHermesModel, MetadataShivaModel, UserBouncerModel, UserLilithModel, UserStargateModel } from './schemas';
import { printProgress, printStartScript } from '../../scriptHelper';
import { loginToDatabase } from '../../../mongoose';
import { IMetadataGoulag, IMetadataHermes, IMetadataShiva, IUserBouncer, IUserLilith } from './interfaces';
import dayjs from 'dayjs';

const PAUSE_BETWEEN_BATCH = 1000;
const PAUSE_BETWEEN_UPDATE = 1000;
const BATCH_SIZE = 100;

const getBaseUsers = (c: Connection, start: number) => UserStargateModel(c).find().skip(start).limit(BATCH_SIZE).lean().exec();
const getUsersBouncer = (c: Connection, users: Array<string>) =>
    UserBouncerModel(c)
        .find({ user: { $in: users } })
        .lean<IUserBouncer<any, any, any>>()
        .exec();
const getMetadatasHermes = (c: Connection, users: Array<string>): Promise<Array<IMetadataHermes>> =>
    MetadataHermesModel(c)
        .find({ user: { $in: users } })
        .lean<IMetadataHermes>()
        .exec();
const getMetadatasShiva = (c: Connection, users: Array<string>): Promise<Array<IMetadataShiva>> =>
    MetadataShivaModel(c)
        .find({ user: { $in: users } })
        .lean<IMetadataHermes>()
        .exec();
const getMetadatasGoulag = (c: Connection, users: Array<string>): Promise<Array<IMetadataGoulag>> =>
    MetadataGoulagModel(c)
        .find({ user: { $in: users } })
        .lean<IMetadataHermes>()
        .exec();
const createOrUpdateFinalUser = (c: Connection, user: IUserLilith): Promise<IUserLilith | null> => {
    const { user: userId } = user;
    return UserLilithModel(c)
        .findOneAndUpdate(
            {
                user: userId,
            },
            {
                ...user,
            },
        )
        .setOptions({ upsert: true })
        .exec();
};

async function updateUserLilith() {
    printStartScript('Update user lilith');

    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const lilithDatabase = await loginToDatabase(process.env.LILITH_DATABASE!);
    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const shivaDatabase = await loginToDatabase(process.env.SHIVA_DATABASE!);
    const hermesDatabase = await loginToDatabase(process.env.HERMES_DATABASE!);
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const usersCount = await UserStargateModel(stargateDatabase).countDocuments();
    console.log(`Found ${usersCount} users`);

    let processedUsers = 0;
    const SKIP = 0;
    const startTime = Date.now();

    while (processedUsers < usersCount - SKIP) {
        const usersBatch = await getBaseUsers(stargateDatabase, processedUsers + SKIP);

        const usersBatchIds = usersBatch.map((userBatch) => userBatch._id.toString());
        const [usersBouncer, metadatasHermes, metadatasShiva, metadatasGoulag] = await Promise.all([
            await getUsersBouncer(bouncerDatabase, usersBatchIds),
            await getMetadatasHermes(hermesDatabase, usersBatchIds),
            await getMetadatasShiva(shivaDatabase, usersBatchIds),
            await getMetadatasGoulag(goulagDatabase, usersBatchIds),
        ]);

        usersBatch.forEach(async (userBase, i) => {
            if (i % 10 === 0) {
                await new Promise((r) => {
                    setTimeout(r, PAUSE_BETWEEN_UPDATE);
                });
            }

            let userLilith: Partial<IUserLilith> = {
                user: userBase._id.toString(),
                firstName: userBase.firstName,
                lastName: userBase.lastName,
                occupation: userBase.occupation,
                publicIdentifier: userBase.publicIdentifier,
                memberId: userBase.memberId,
                linkedinId: userBase.linkedinId,
                profilePicture: userBase?.profilePicture,
                birthday: userBase?.birthday,
                address: userBase?.address,
                email: userBase.email,
                emailContact: userBase?.emailContact,
                phoneNumbers: userBase?.phoneNumbers,
                language: userBase.language,
                origins: userBase.origins,
                hasBypass: userBase?.hasBypass,
                isPremiumSubscriber: userBase?.isPremiumSubscriber,
                hasExtensionInstalled: userBase?.extensionState?.isInstalled || false,
                dateExtensionUninstall: userBase?.extensionState?.dateUninstall,
            };

            const userBouncer = usersBouncer.find((ub) => ub.user === userLilith.user);
            if (userBouncer) {
                userLilith = {
                    ...userLilith,
                    waapiId: userBouncer.waapiId,
                    paymentWaapiId: userBouncer.paymentWaapiId,
                    ...(userBouncer?.trial ? { trial: userBouncer.trial } : {}),
                    hasPaidAtLeastOnce: userBouncer?.hasPaidAtLeastOnce,
                    firstPaidAt: userBouncer?.firstPaidAt,
                    lastPaidAt: userBouncer?.lastPaidAt,
                    subscriptionState: userBouncer?.subscriptionState,
                    // @ts-ignore
                    plan:
                        userBouncer?.company?.plan?.expirationDate && dayjs(userBouncer?.company?.plan?.expirationDate).isBefore(dayjs())
                            ? userBouncer?.plan
                            : userBouncer?.company?.plan,
                };
            }

            const metadataShiva = metadatasShiva.find((ms) => ms.user === userLilith.user);
            if (metadataShiva) {
                userLilith = {
                    ...userLilith,
                    ...(metadataShiva?.firstLinkedInActionDate ? { kpi: { firstLinkedInActionDate: metadataShiva.firstLinkedInActionDate } } : {}),
                };
            }

            const metadataHermes = metadatasHermes.find((mh) => mh.user === userLilith.user);
            if (metadataHermes) {
                userLilith = {
                    ...userLilith,
                    ...(metadataHermes?.firstMailDate ? { kpi: { firstMailDate: metadataHermes.firstMailDate } } : {}),
                };
            }

            const metadataGoulag = metadatasGoulag.find((mg) => mg.user === userLilith.user);
            if (metadataGoulag) {
                userLilith = {
                    ...userLilith,
                    ...(metadataGoulag?.firstProspectCreatedDate
                        ? { kpi: { firstProspectCreatedDate: metadataGoulag.firstProspectCreatedDate } }
                        : {}),
                };
            }

            await createOrUpdateFinalUser(lilithDatabase, userLilith as IUserLilith);
        });

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedUsers += BATCH_SIZE;
        printProgress(processedUsers, usersCount, startTime);
    }

    process.exit(1);
}

updateUserLilith();
