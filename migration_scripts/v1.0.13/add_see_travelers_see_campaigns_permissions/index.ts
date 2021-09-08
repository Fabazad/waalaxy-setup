import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { PERMISSIONS_TO_ADD } from './constants';
import { UserPermissionsModel } from './schemas';

const PAUSE_BETWEEN_BATCH = 500;
const BATCH_SIZE = 1000;

dotEnv.config();

const getUserPermissions = (c: Connection, skip: number) => UserPermissionsModel(c).find({}).skip(skip).limit(BATCH_SIZE).lean().exec();

const bulkUpdatePermissions = async (c: Connection, toUpdate: Array<{ user: string }>) => {
    return UserPermissionsModel(c).bulkWrite(
        toUpdate.map(({ user }) => ({
            updateOne: {
                filter: { user },
                update: {
                    $push: { 'permissions.included': { $each: PERMISSIONS_TO_ADD } },
                },
            },
        })),
    );
};

async function addSeeTravelersSeeCampaignsPermissions() {
    printStartScript('add see travelers see campaigns permissions');

    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const count = await UserPermissionsModel(bouncerDatabase).countDocuments();
    console.log(`Found ${count} user permissions`);
    let processed = 0;
    const startTime = Date.now();

    while (processed < count) {
        const permissionsBatch = await getUserPermissions(bouncerDatabase, processed);
        const toUpdate = permissionsBatch.reduce<Array<{ user: string }>>((acc, permission) => {
            if (!permission.company || permission.company.isOwner) return acc;
            return [...acc, { user: permission.user }];
        }, []);
        await bulkUpdatePermissions(bouncerDatabase, toUpdate);

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processed += permissionsBatch.length;
        printProgress(processed, count, startTime);
    }

    process.exit(1);
}

addSeeTravelersSeeCampaignsPermissions();
