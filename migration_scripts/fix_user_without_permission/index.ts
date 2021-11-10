import dotEnv from 'dotenv';
import { Connection, Schema } from 'mongoose';
import { loginToDatabase } from '../../mongoose';
import { printStartScript } from '../scriptHelper';
import { UserModel, UserPermissionsModel } from '../v1.0.13/refactor_duplicated_prospects/schemas';

const PAUSE_BETWEEN_BATCH = 0;
const BATCH_SIZE = 1000;

dotEnv.config();

const countUsers = (c: Connection) => UserModel(c).countDocuments().exec();

const getUsers = (c: Connection, start: number) => UserModel(c).find({}).skip(start).limit(BATCH_SIZE).select({ _id: 1, memberId: 1 }).lean().exec();
const getUserPermissions = (c: Connection, memberId: string) =>
    UserPermissionsModel(c).findOne({
        'userData.memberId': memberId,
    });

// const getProspectList = (c: Connection, user: Schema.Types.ObjectId) => ProspectListModel(c).findOne({ user });

// // const deleteUser = (c: Connection, user: Schema.Types.ObjectId) =>
// //     UserModel(c).deleteOne({
// //         _id: user.toString(),
// //     });

const updateMemberIdUser = (c: Connection, user: Schema.Types.ObjectId, newMemberId: string) =>
    UserModel(c).updateOne({
        filter: {
            _id: user,
        },
        update: {
            $set: {
                memberId: newMemberId,
            },
        },
    });

export const fixUserWithoutPermission = async () => {
    printStartScript('Starting fixUserWithoutPermission');
    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    let processedUsers = 0;
    let usersWithoutPermission = 0;
    let usersWithoutProspectListAndPermission = 0;
    const usersCount = await countUsers(stargateDatabase);
    console.log(`Found ${usersCount} users`);

    while (processedUsers < usersCount) {
        const users = await getUsers(stargateDatabase, processedUsers);
        await Promise.all(
            users.map(async (user) => {
                const userPermissions = await getUserPermissions(bouncerDatabase, user.memberId);
                if (!userPermissions) {
                    usersWithoutPermission += 1;
                    const newMemberId = user.memberId + '-Archived';
                    await updateMemberIdUser(stargateDatabase, user._id, newMemberId);
                }
            }),
        );
        processedUsers += BATCH_SIZE;
        console.log(processedUsers);
    }

    console.log(`Found ${usersWithoutPermission}/${usersCount} with no permissions`);

    console.log(`Found ${usersWithoutProspectListAndPermission}/${usersCount} with no permissions and no prospectList`);

    console.log('exiting');

    process.exit(1);
};

fixUserWithoutPermission();
