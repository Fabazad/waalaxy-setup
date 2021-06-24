import dayjs from 'dayjs';
import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { IUser } from './interfaces';
import { UserModel } from './schemas';
dotEnv.config();

const BATCH_SIZE = 500;
const PAUSE_BETWEEN_BATCH = 5000;

const countUsers = (c: Connection) =>
    UserModel(c)
        .countDocuments({ origin: { $exists: true } })
        .exec();

const findUserBatch = (c: Connection, skip: number) =>
    UserModel(c)
        .find({ origin: { $exists: true } })
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean()
        .exec();

export const uniformizeUsersOrigins = async () => {
    console.log('Starting uniformizeUsersOrigins');
    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const totalUsersCount = await countUsers(stargateDatabase);

    console.log(`Found ${totalUsersCount} Users`);

    let processedUsers = 0;

    while (processedUsers < totalUsersCount) {
        const users: Array<IUser> = await findUserBatch(stargateDatabase, processedUsers);

        await UserModel(stargateDatabase).bulkWrite(
            users.map((user) => {
                const { origins = [], origin } = user;
                if (origin) {
                    origins.push({ content: origin, date: dayjs(user.createdAt).toISOString() });
                }

                return {
                    updateOne: {
                        filter: { _id: user._id },
                        update: {
                            $set: { origins },
                            $unset: { origin: '' },
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

uniformizeUsersOrigins();
