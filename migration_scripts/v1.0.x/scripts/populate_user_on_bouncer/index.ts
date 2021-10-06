import dotEnv from 'dotenv';
import { loginToDatabase } from '../../../../mongoose';
import { Connection } from 'mongoose';
import { UserModel } from './schemas';
import { UserPermissionModel } from './schemas';
import { IUser, UserStargateData } from './interfaces';
dotEnv.config();

const BATCH_SIZE = 500;
const PAUSE_BETWEEN_BATCH = 500;

export const userToUserData = (user: IUser): UserStargateData => {
    return {
        memberId: user.memberId,
        profilePicture: user.profilePicture,
        address: user.address,
        origins: user.origins,
        isTestUser: user.isTestUser || false,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        language: user.language,
        phoneNumbers: user.phoneNumbers,
        occupation: user.occupation || '',
        linkedinId: user.linkedinId,
        birthday: user.birthday,
        publicIdentifier: user.publicIdentifier,
        company: user?.company,
    };
};

const countUsers = (c: Connection) =>
    UserModel(c)
        .countDocuments({ memberId: { $exists: true } })
        .exec();

const findUserBatch = (c: Connection, skip: number): Promise<Array<IUser>> =>
    UserModel(c)
        .find({ memberId: { $exists: true } })
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean()
        .exec();

const populateUserOnBouncer = async () => {
    console.log('Starting populateUserOnBouncer');
    const [bouncerDatabase, stargateDatabase] = await Promise.all([
        loginToDatabase(process.env.BOUNCER_DATABASE!),
        loginToDatabase(process.env.STARGATE_DATABASE!),
    ]);
    const totalUsersCount = await countUsers(stargateDatabase);
    console.log(`Found ${totalUsersCount} Users`);

    let processedUsers = 0;

    while (processedUsers < totalUsersCount) {
        const users = await findUserBatch(stargateDatabase, processedUsers);

        await UserPermissionModel(bouncerDatabase).bulkWrite(
            users.map((user) => {
                return {
                    updateOne: {
                        filter: { user: user._id },
                        update: {
                            $set: { userData: userToUserData(user) },
                        },
                    },
                };
            }),
        );

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedUsers = Math.min(processedUsers + BATCH_SIZE, totalUsersCount);

        console.log(`${processedUsers}/${totalUsersCount} processed users (${Math.round((processedUsers / totalUsersCount) * 100 * 100) / 100}%)`);
    }

    console.log('exiting');
    await stargateDatabase.close();

    process.exit(1);
};

populateUserOnBouncer();
