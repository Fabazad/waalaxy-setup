import dotEnv from 'dotenv';
import _ from 'lodash';
import { Connection, Schema, Types } from 'mongoose';
import { loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { DuplicatedProspectModel, ProfileModel, ProspectModel, UserModel, UserPermissionsModel, UsersRegroupmentModel } from './schemas';

const PAUSE_BETWEEN_BATCH = 0;
const BATCH_SIZE = 1000;
const companiesToCreate: Record<string, Array<string>> = {};

dotEnv.config();

const countUsers = (c: Connection) => UserModel(c).countDocuments().exec();

const getUsers = (c: Connection, start: number) => UserModel(c).find({}).skip(start).limit(BATCH_SIZE).select({ _id: 1 }).lean().exec();
const getUserRegroupment = (c: Connection, user: Schema.Types.ObjectId) =>
    UsersRegroupmentModel(c).findOne({
        users: user.toString(),
    });

export const findUsersWithoutUserRegroupments = async () => {
    printStartScript('Starting findUsersWithoutUserRegroupments');
    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    let processedUsers = 0;
    let usersWithoutRegroupment = 0;
    const usersCount = await countUsers(stargateDatabase);
    console.log(`Found ${usersCount} users`);

    while (processedUsers < usersCount) {
        const users = await getUsers(stargateDatabase, processedUsers);
        await Promise.all(
            users.map(async (user) => {
                const userRegroupment = await getUserRegroupment(goulagDatabase, user._id);
                if (!userRegroupment) {
                    usersWithoutRegroupment += 1;
                }
            }),
        );
        processedUsers += BATCH_SIZE;
        console.log(processedUsers);
    }

    console.log(`Found ${usersWithoutRegroupment}/${usersCount} with no regroupment`);

    console.log('exiting');

    process.exit(1);
};

findUsersWithoutUserRegroupments();
