import dotEnv from 'dotenv';
import { Connection, Types } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { Profile, UsersRegroupment } from './interfaces';
import { ProfileModel, ProspectModel, UserModel, UserPermissionsModel, UsersRegroupmentModel } from './schemas';

const PAUSE_BETWEEN_BATCH = 0;
const BATCH_SIZE = 1000;
const companiesToCreate: Record<string, Array<string>> = {};

dotEnv.config();

const getUsers = (c: Connection, start: number) => UserModel(c).find({}).skip(start).limit(BATCH_SIZE).lean().exec();

const getUserPermissions = (c: Connection, users: Array<string>) =>
    UserPermissionsModel(c)
        .find({ user: { $in: users } })
        .lean()
        .exec();

const findOrCreateUsersRegroupment = async (c: Connection, user: string) => {
    const usersRegroupment = await UsersRegroupmentModel(c).findOne({ users: user }).lean().exec();
    if (usersRegroupment) return usersRegroupment;
    return UsersRegroupmentModel(c).create({ users: [user], duplicatedProspects: [] });
};

const createOrUpdateCompanyUsersRegroupment = async (
    c: Connection,
    users: Array<string>,
    company: string,
    duplicatedProspects: UsersRegroupment['duplicatedProspects'],
) => {
    const usersRegroupment = await UsersRegroupmentModel(c).findOne({ company }).lean().exec();
    if (usersRegroupment)
        return UsersRegroupmentModel(c).updateOne({ _id: usersRegroupment._id.toString() }, { $set: { duplicatedProspects, users } });
    return UsersRegroupmentModel(c).create({ company, users, duplicatedProspects });
};

const getDuplicatedProspects = async ({
    c,
    users,
}: {
    c: Connection;
    users: Array<string>;
}): Promise<Array<{ profile: Profile; prospects: Array<{ _id: string; owner: string }> }>> => {
    const result: Array<{
        _id: string;
        profile: Pick<Profile, '_id'>;
        prospects: Array<{ _id: string; owner: string }>;
        count: number;
    }> = await ProspectModel(c).aggregate([
        { $project: { _id: 1, expiresAt: 1, user: 1, profile: { _id: 1 } } },
        { $match: { expiresAt: { $exists: false }, user: { $in: users.map((u) => Types.ObjectId(u)) } } },
        {
            $group: {
                _id: '$profile._id',
                prospects: { $push: { _id: '$_id', owner: '$user' } },
                profile: { $first: '$profile' },
                count: { $sum: 1 },
            },
        },
        { $match: { count: { $gt: 1 } } },
    ]);

    const duplicates = result.map(({ profile, prospects }) => ({ profile, prospects }));
    const profiles = (await Promise.all(duplicates.map(({ profile }) => ProfileModel(c).findOne({ _id: profile._id }).lean().exec()))).filter(
        (p) => !!p,
    ) as Array<Profile>;
    return duplicates.map(({ profile, prospects }) => ({
        profile: profiles.find((p) => p._id.toString() === profile._id.toString()) ?? profile,
        prospects,
    }));
};

export const createUsersRegroupment = async () => {
    console.log('Starting createUsersRegroupment');
    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const usersCount = await UserModel(stargateDatabase).countDocuments();
    console.log(`Found ${usersCount} users`);
    let processedUsers = 0;
    const SKIP = 0;

    while (processedUsers < usersCount - SKIP) {
        let usersInCompany = 0;

        const usersBatch = await getUsers(stargateDatabase, processedUsers + SKIP);
        const permissionsBatch = await getUserPermissions(
            bouncerDatabase,
            usersBatch.map((u) => u._id.toString()),
        );

        await Promise.all(
            usersBatch.map(async (user) => {
                const permissions = permissionsBatch.find((p) => p.user.toString() === user._id.toString());

                if (!permissions || !permissions.company) await findOrCreateUsersRegroupment(goulagDatabase, user._id.toString());
                else {
                    const companyId = permissions.company._id.toString();
                    companiesToCreate[companyId] = [...(companiesToCreate[companyId] || []), user._id.toString()];
                    usersInCompany += 1;
                }
            }),
        );

        processedUsers += BATCH_SIZE;

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        console.log(`${usersInCompany} users in company`);

        console.log(
            `Processed ${processedUsers}/${usersCount} users. (${Math.min(Math.round((processedUsers / usersCount) * 100 * 100) / 100, 100)}%)`,
        );
    }

    console.log(`Going to check duplicates for ${Object.keys(companiesToCreate).length} companies`);

    const awaitableCompaniesToCreate = Object.entries(companiesToCreate).map(([company, users]) => ({ company, users }));
    let processedCompanies = 0;

    for (const companyToCreate of awaitableCompaniesToCreate) {
        const { company, users } = companyToCreate;
        const duplicatedProspects = await getDuplicatedProspects({ c: goulagDatabase, users });
        await createOrUpdateCompanyUsersRegroupment(goulagDatabase, users, company, duplicatedProspects);
        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedCompanies += 1;
        console.log(
            `Processed ${processedCompanies}/${Object.keys(companiesToCreate).length} companies. (${Math.min(
                Math.round((processedCompanies / Object.keys(companiesToCreate).length) * 100 * 100) / 100,
                100,
            )}%)`,
        );
    }

    console.log('exiting');

    process.exit(1);
};

createUsersRegroupment();
