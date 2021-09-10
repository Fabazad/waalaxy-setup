import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printStartScript } from '../../scriptHelper';
import { UpdateOne } from './interfaces';
import { QuotaModel } from './schemas';

dotEnv.config();

const DEFAULT_QUOTAS = 80;

const getUsers = (c: Connection) => QuotaModel(c).distinct('user');

const bulkUpsertQuota = (c: Connection, updates: UpdateOne[]) => QuotaModel(c).bulkWrite(updates);

export const setDefaultMessageRequestQuota = async () => {
    printStartScript('Starting setDefaultMessageRequestQuota');
    const startDate = Date.now();
    const ShivaDatabase = await loginToDatabase(process.env.SHIVA_DATABASE!);

    const users = await getUsers(ShivaDatabase);

    console.log(`Found ${users.length} users to update`);

    const quotaInserts: UpdateOne[] = users.map((user) => ({
        updateOne: {
            filter: { user, type: 'messageRequestLinkedin' },
            update: { $set: { value: Math.round((1 - Math.random() * 0.2) * DEFAULT_QUOTAS) } },
            upsert: true,
        },
    }));

    await bulkUpsertQuota(ShivaDatabase, quotaInserts);

    await disconnectFromDatabase();
    console.log('Exiting');
    process.exit(1);
};

setDefaultMessageRequestQuota();
