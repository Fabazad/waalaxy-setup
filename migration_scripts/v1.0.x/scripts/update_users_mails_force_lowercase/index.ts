import dotEnv from 'dotenv';
import { Connection, Schema } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { printProgress } from '../../../scriptHelper';
import { IUser } from './interfaces';
import { UserModel } from './schemas';
dotEnv.config();

const BATCH_SIZE = 1000;
const PAUSE_BETWEEN_BATCH = 250;

const countUsers = (c: Connection): Promise<number> => UserModel(c).countDocuments({}).exec();

const getUsersBatch = (c: Connection, start: number): Promise<IUser[]> =>
    UserModel(c)
        .find()
        .skip(start)
        .limit(BATCH_SIZE)
        .select({
            _id: 1,
            email: 1,
            emailContact: 1,
        })
        .lean()
        .exec();

const bulkUpdateUsers = (
    c: Connection,
    updates: {
        userId: Schema.Types.ObjectId;
        email?: string;
        emailContact?: string;
    }[],
) => {
    // console.log(updates);
    return UserModel(c).bulkWrite(
        updates
            .filter(({ email, emailContact }) => !!(email || emailContact))
            .map(({ userId, email, emailContact }) => ({
                updateOne: {
                    filter: {
                        _id: userId,
                    },
                    update: {
                        $set: {
                            ...(email ? { email } : {}),
                            ...(emailContact ? { emailContact } : {}),
                        },
                    },
                },
            })),
        {
            ordered: false,
        },
    );
};

export const updateUsersEmailsForceLowercase = async () => {
    console.log('Running updateUsersEmailsForceLowercase');
    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const now = Date.now();

    const travelersToUpdateCount = await countUsers(stargateDatabase);

    console.log(`Found: ${travelersToUpdateCount} users to update`);

    let processedUsers = 0;
    let updatedUsers = 0;

    // await getAllTravelersIdsToUpdate(stargateDatabase);
    while (processedUsers < travelersToUpdateCount) {
        const userBatch = await getUsersBatch(stargateDatabase, processedUsers);
        const result = await bulkUpdateUsers(
            stargateDatabase,
            userBatch.map(({ _id, email, emailContact }) => ({
                userId: _id,
                email: email?.toLowerCase(),
                emailContact: emailContact?.toLowerCase(),
            })),
        );

        updatedUsers += result.modifiedCount ?? 0;

        console.log(`\nUpdated ${result.modifiedCount} users`);

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedUsers = BATCH_SIZE + processedUsers > travelersToUpdateCount ? travelersToUpdateCount : processedUsers + BATCH_SIZE;

        printProgress(processedUsers, travelersToUpdateCount, now);
        console.log('updated', updatedUsers);
    }

    console.log('Done !');

    process.exit();
};

updateUsersEmailsForceLowercase();
