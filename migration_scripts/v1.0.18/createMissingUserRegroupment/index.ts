import dotEnv from 'dotenv';
import _ from 'lodash';
import { Connection, Schema, Types } from 'mongoose';
import { loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { UserModel, UserPermissionsModel, CompanyModel, UsersRegroupmentModel } from './schemas';

const PAUSE_BETWEEN_BATCH = 0;
const BATCH_SIZE = 1000;
const companiesToCreate: Record<string, Array<string>> = {};

dotEnv.config();

const countUsers = (c: Connection) => UserModel(c).countDocuments().exec();

const getUsers = (c: Connection, start: number) => UserModel(c).find({}).skip(start).limit(BATCH_SIZE).select({ _id: 1 }).lean().exec();

const getCompanyRegroupment = (c: Connection, company: string) =>
    UsersRegroupmentModel(c)
        .findOne({
            company,
        })
        .lean()
        .exec();

const getUserRegroupment = (c: Connection, user: Schema.Types.ObjectId) =>
    UsersRegroupmentModel(c)
        .findOne({
            users: user.toString(),
        })
        .lean()
        .exec();

const createUserRegroupment = (c: Connection, user: Schema.Types.ObjectId, company?: string) =>
    UsersRegroupmentModel(c).create({
        users: [user.toString()],
        ...(company ? { company } : {}),
    });

const getUserCompany = (c: Connection, userId: string) => CompanyModel(c).findOne({ user: userId }).lean().exec();

const addUserToCompanyRegroupment = (c: Connection, company: string, userId: string) =>
    UsersRegroupmentModel(c)
        .updateOne(
            {
                company,
            },
            {
                $addToSet: {
                    users: userId,
                },
            },
        )
        .lean()
        .exec();

export const findUsersWithoutUserRegroupments = async () => {
    printStartScript('Starting findUsersWithoutUserRegroupments');
    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);
    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);

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
                    const userCompany = await getUserCompany(bouncerDatabase, user._id);
                    if (userCompany) {
                        const companyRegroupment = await getCompanyRegroupment(goulagDatabase, userCompany._id.toString());
                        if (companyRegroupment) await addUserToCompanyRegroupment(goulagDatabase, userCompany._id.toString(), user._id.toString());
                        else await createUserRegroupment(goulagDatabase, user._id, userCompany._id.toString());
                    } else {
                        await createUserRegroupment(goulagDatabase, user._id);
                    }
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
