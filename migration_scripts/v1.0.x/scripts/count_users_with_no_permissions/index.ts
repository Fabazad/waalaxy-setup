import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { UserModel, UserPermissionModel } from './schemas';
import { IUser } from './interfaces';
dotEnv.config();

const BATCH_SIZE = 1000;
const PAUSE_BETWEEN_BATCH = 0;

const countUsers = (c: Connection) => UserModel(c).countDocuments().exec();

const findUserBatch = (c: Connection, skip: number) => UserModel(c).find({}).skip(skip).limit(BATCH_SIZE).lean().exec();

const findUserPermissionsByUserIds = (c: Connection, userIds: string[]) =>
    UserPermissionModel(c)
        .find({
            user: {
                $in: userIds,
            },
        })
        .lean()
        .exec();

export const countUsersWithNoPermissions = async () => {
    console.log('Starting countUsersWithNoPermissions');
    const [bouncerDatabase, stargateDatabase] = await Promise.all([
        loginToDatabase(process.env.BOUNCER_DATABASE!),
        loginToDatabase(process.env.STARGATE_DATABASE!),
    ]);

    const totalUsersCount = await countUsers(stargateDatabase);

    console.log(`Found ${totalUsersCount} Users`);

    let processedUsers = 0;
    let userWithNoPermissionsCount = 0;

    while (processedUsers < totalUsersCount) {
        const usersBatch: Pick<IUser, '_id'>[] = await findUserBatch(stargateDatabase, processedUsers);

        const usersBatchPermissions = await findUserPermissionsByUserIds(
            bouncerDatabase,
            usersBatch.map(({ _id }) => _id.toString()),
        );

        const userWithNoPermissions = usersBatch.reduce((acc, val) => {
            if (!usersBatchPermissions.find(({ user }) => user === val._id.toString())) {
                acc.push(val._id.toString());
            }

            return acc;
        }, [] as string[]);

        userWithNoPermissionsCount += userWithNoPermissions.length;

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedUsers = Math.min(processedUsers + BATCH_SIZE, totalUsersCount);

        console.log(`${processedUsers}/${totalUsersCount} processed users (${Math.round((processedUsers / totalUsersCount) * 100 * 100) / 100}%)`);
    }

    console.log(`${userWithNoPermissionsCount} users with no permission found`);
    console.log('exiting');
    await Promise.all([bouncerDatabase.close(), stargateDatabase.close()]);

    process.exit(1);
};

countUsersWithNoPermissions();
