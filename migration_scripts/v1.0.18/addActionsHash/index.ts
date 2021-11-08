import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { EventEmitter } from 'stream';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { IAction } from './interfaces';
import { ActionModel } from './schemas';
import { generateActionHash } from './utils';

dotEnv.config();

const BATCH_SIZE = 1000;

const countActions = (c: Connection): Promise<number> =>
    ActionModel(c)
        .count({
            hash: {
                $exists: false,
            },
        })
        .exec();

const getActions = (c: Connection): EventEmitter =>
    ActionModel(c)
        .collection.find(
            {
                hash: {
                    $exists: false,
                },
            },
            { timeout: false },
        )
        .project({
            _id: 1,
        })
        .batchSize(BATCH_SIZE)
        .stream();

const bulkUpdateActions = (c: Connection, updates: { updateOne: { filter: Record<string, unknown>; update: { $set: { hash: string } } } }[]) =>
    ActionModel(c).bulkWrite(updates);

export const addActionsHash = async () => {
    printStartScript('Starting addActionsHash');
    const startDate = Date.now();
    const ShivaDatabase = await loginToDatabase(process.env.SHIVA_DATABASE!);

    const actionsCount = await countActions(ShivaDatabase);

    console.log(`Found ${actionsCount} actions to update`);

    const actionsUpdates: { updateOne: { filter: Record<string, unknown>; update: { $set: { hash: string } } } }[] = [];
    let processedActions = 0;
    let updatedActions = 0;

    const eventEmitter = getActions(ShivaDatabase);

    eventEmitter.on('data', (action: IAction) => {
        actionsUpdates.push({
            updateOne: {
                filter: {
                    _id: action._id,
                },
                update: {
                    $set: {
                        hash: generateActionHash(),
                    },
                },
            },
        });

        if (actionsUpdates.length >= 1000) {
            bulkUpdateActions(ShivaDatabase, actionsUpdates.splice(0, 1000)).then(({ modifiedCount = 0 }) => {
                updatedActions += modifiedCount;
            });
        }
        processedActions += 1;

        printProgress(processedActions, actionsCount, startDate);
    });

    return await new Promise<'OK'>((resolve, reject) => {
        eventEmitter.on('end', async () => {
            if (actionsUpdates.length) {
                const { modifiedCount = 0 } = await bulkUpdateActions(ShivaDatabase, actionsUpdates.splice(0));
                updatedActions += modifiedCount;
            }
            console.log(`\n${updatedActions} Updated actions`);

            await disconnectFromDatabase();
            console.log('Exiting');
            resolve('OK');
        });

        eventEmitter.on('error', async (err: Error) => {
            console.warn(err);
            console.log(`\n${updatedActions} Updated actions`);

            await disconnectFromDatabase();
            console.log('Exiting');
            reject(err);
        });
    });
};

addActionsHash();
