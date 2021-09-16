import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { EventEmitter } from 'stream';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { HistoryItemMap } from './../../../back/packages/goulag-client/src/types/prospects.types';
import { Prospect } from './interfaces';
import { ProspectModel } from './schemas';

dotEnv.config();

const BATCH_SIZE = 1000;

const countProspects = (c: Connection): Promise<number> =>
    ProspectModel(c)
        .count({
            'history.1': {
                $exists: true,
            },
            $and: [{ 'history.name': 'linkedin_connect' }, { 'history.name': 'message_replied' }],
        })
        .exec();

const getProspects = (c: Connection): EventEmitter =>
    ProspectModel(c)
        .collection.find(
            {
                'history.1': {
                    $exists: true,
                },
                $and: [{ 'history.name': 'linkedin_connect' }, { 'history.name': 'message_replied' }],
            },
            { timeout: false },
        )
        .project({
            _id: 1,
            history: 1,
        })
        .batchSize(BATCH_SIZE)
        .stream();

const bulkUpdateProspects = (
    c: Connection,
    updates: { updateOne: { filter: Record<string, unknown>; update: { $set: { history: Array<Record<string, unknown>> } } } }[],
) => ProspectModel(c).bulkWrite(updates);

const sanitizeProspectHistory = (history: Prospect['history']): { data: Prospect['history']; hasBeenUpdated: boolean } => {
    let linkedinConnectFound = false;
    let hasBeenUpdated = false;
    const newHistory = history.reduce<Prospect['history']>((acc, item) => {
        if (item.name === 'linkedin_connect') {
            linkedinConnectFound = true;
        }
        if (item.name === 'linkedin_message' || item.name === 'linkedin_message_request') {
            linkedinConnectFound = false;
        }
        if (linkedinConnectFound && item.name === 'message_replied') {
            const newItem: HistoryItemMap['connect_replied'] = { name: 'connect_replied', params: item.params, executionDate: item.executionDate };
            hasBeenUpdated = true;
            return [...acc, newItem];
        }
        return [...acc, item];
    }, []);
    return { data: newHistory, hasBeenUpdated };
};

export const changeMessageRepliedByConnectRepliedWhenNecessary = async () => {
    printStartScript('Starting changeMessageRepliedByConnectRepliedWhenNecessary');
    const startDate = Date.now();
    const GoulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const prospectsCount = await countProspects(GoulagDatabase);

    console.log(`Found ${prospectsCount} prospects to update`);

    const prospectsUpdates: { updateOne: { filter: Record<string, unknown>; update: { $set: { history: Array<Record<string, unknown>> } } } }[] = [];
    let processedProspects = 0;
    let updatedProspects = 0;

    const eventEmitter = getProspects(GoulagDatabase);

    eventEmitter.on('data', (prospect: Prospect) => {
        const newHistory = sanitizeProspectHistory(prospect.history);
        if (newHistory.hasBeenUpdated) {
            prospectsUpdates.push({
                updateOne: {
                    filter: {
                        _id: prospect._id,
                    },
                    update: {
                        $set: {
                            history: newHistory.data,
                        },
                    },
                },
            });
        }

        if (prospectsUpdates.length >= 1000) {
            bulkUpdateProspects(GoulagDatabase, prospectsUpdates.splice(0, 1000)).then(({ modifiedCount = 0 }) => {
                updatedProspects += modifiedCount;
            });
        }
        processedProspects += 1;

        printProgress(processedProspects, prospectsCount, startDate);
    });

    return new Promise<void>((resolve, reject) => {
        eventEmitter.on('end', async () => {
            if (prospectsUpdates.length) {
                const { modifiedCount = 0 } = await bulkUpdateProspects(GoulagDatabase, prospectsUpdates.splice(0));
                updatedProspects += modifiedCount;
            }
            console.log(`\n${updatedProspects} Updated prospects`);

            await disconnectFromDatabase();
            console.log('Exiting');
            resolve();
        });

        eventEmitter.on('error', async (err: Error) => {
            console.warn(err);
            console.log(`\n${updatedProspects} Updated prospects`);

            await disconnectFromDatabase();
            console.log('Exiting');
            reject(err);
        });
    });
};
