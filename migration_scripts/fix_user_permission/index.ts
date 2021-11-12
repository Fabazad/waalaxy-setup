import dotEnv from 'dotenv';
import { Connection, Schema } from 'mongoose';
import { loginToDatabase } from '../../mongoose';
import { printStartScript } from '../scriptHelper';
import { ProspectModel, UserModel, UserPermissionsModel } from '../v1.0.13/refactor_duplicated_prospects/schemas';

const PAUSE_BETWEEN_BATCH = 0;
const BATCH_SIZE = 1000;

dotEnv.config();

const countUsers = (c: Connection) => UserModel(c).countDocuments().exec();

const getUsers = (c: Connection, start: number) => UserModel(c).find({}).skip(start).limit(BATCH_SIZE).select({ _id: 1, memberId: 1 }).lean().exec();

const getUserPermission = (c: Connection, user: string) =>
    UserPermissionsModel(c).findOne({
        user,
    });

const getUserPermissions = (c: Connection, memberId: string) =>
    UserPermissionsModel(c).find({
        'userData.memberId': memberId,
    });

const updateUserPermissionsUser = (c: Connection, _id: string, user: string) => UserPermissionsModel(c).updateOne({ _id }, { user });

const getProspects = (c: Connection, user: Schema.Types.ObjectId) => ProspectModel(c).findOne({ user });

const deleteUser = (c: Connection, user: Schema.Types.ObjectId) =>
    UserModel(c).deleteOne({
        _id: user.toString(),
    });

const deleteUserPermissions = (c: Connection, ids: Array<string>) =>
    UserPermissionsModel(c).deleteMany({
        _id: { $in: ids },
    });

export const fixUserWithoutPermission = async () => {
    printStartScript('Starting fixUserWithoutPermission');
    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    let processedUsers = 0;
    let usersWithoutPermission = 0;
    let userWithMoreThanOneUserPermissions = [];
    let userWithWrongUserPermission = 0;
    let userWithWrongUserPermissionButProspect = 0;
    let usersWithoutPermissionButProspect = 0;
    const usersCount = await countUsers(stargateDatabase);
    console.log(`Found ${usersCount} users`);

    while (processedUsers < usersCount) {
        const users = await getUsers(stargateDatabase, processedUsers);
        await Promise.all(
            users.map(async (user) => {
                const userPermissions = await getUserPermissions(bouncerDatabase, user.memberId);
                const prospect = await getProspects(goulagDatabase, user._id);
                if (userPermissions.length === 0) {
                    if (prospect) {
                        usersWithoutPermissionButProspect += 1;
                    } else {
                        usersWithoutPermission += 1;
                        // await deleteUser(stargateDatabase, user._id);
                    }
                } else if (userPermissions.length > 1) {
                    const validUserPermissions = userPermissions.filter((permission) => permission.user.toString() === user._id.toString());
                    const userPermissionInUse = await getUserPermission(bouncerDatabase, user._id);
                    const userPermissionInUseIsValid = userPermissionInUse ? userPermissionInUse.user.toString() === user._id.toString() : 'none';
                    userWithMoreThanOneUserPermissions.push({
                        valid: validUserPermissions.length,
                        invalid: userPermissions.length - validUserPermissions.length,
                        userPermissionInUseIsValid,
                        hasProspect: !!prospect,
                    });
                    if (!prospect) {
                        if (userPermissionInUseIsValid === 'none') {
                            // await deleteUserPermissions(
                            //     bouncerDatabase,
                            //     userPermissions.map((up) => up._id.toString()),
                            // );
                            // await deleteUser(stargateDatabase, user._id);
                        } else if (userPermissionInUseIsValid) {
                            const invalidUserPermissions = userPermissions.filter((permission) => permission.user.toString() !== user._id.toString());
                            // await deleteUserPermissions(
                            //     bouncerDatabase,
                            //     invalidUserPermissions.map((up) => up._id.toString()),
                            // );
                        } else {
                            console.warn('Panic!');
                        }
                    }
                } else if (userPermissions[0].user.toString() !== user._id.toString()) {
                    if (prospect) {
                        userWithWrongUserPermissionButProspect += 1;
                    } else {
                        // await updateUserPermissionsUser(bouncerDatabase, userPermissions[0]._id, user._id);
                        userWithWrongUserPermission += 1;
                    }
                }
            }),
        );
        processedUsers += BATCH_SIZE;
        console.log(processedUsers);
    }

    console.log(`userWithMoreThanOneUserPermissions: ${JSON.stringify(userWithMoreThanOneUserPermissions, null, 2)}`);

    console.log(`Found ${usersWithoutPermission}/${usersCount} with no permissions`);
    console.log(`Found ${usersWithoutPermissionButProspect}/${usersCount} with no permissions but prospects`);

    console.log(`Found ${userWithWrongUserPermission}/${usersCount} with invalid user permissions`);
    console.log(`Found ${userWithWrongUserPermissionButProspect}/${usersCount} with invalid user permissions but prospects`);

    console.log('exiting');

    process.exit(1);
};

fixUserWithoutPermission();
