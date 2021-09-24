import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { EventEmitter } from 'stream';
import { HistoryItemMap } from '../../../back/packages/goulag-client/src/types/prospects.types';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
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
            'history.name': 'message_replied',
        })
        .exec();

const getProspects = (c: Connection): EventEmitter =>
    ProspectModel(c)
        .collection.find(
            {
                'history.1': {
                    $exists: true,
                },
                'history.name': 'message_replied',
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
    const reversedHistory = [...history].reverse();

    const { history: newReversedHistory, hasBeenUpdated } = reversedHistory.reduce<{
        history: Prospect['history'];
        hasBeenUpdated: boolean;
        checking?: HistoryItemMap['message_replied'];
    }>(
        (acc, curr) => {
            if (curr.name === 'message_replied') return { ...acc, checking: curr };
            if (
                acc.checking !== undefined &&
                (curr.name === 'linkedin_message_request' || curr.name === 'linkedin_connect' || curr.name === 'linkedin_message')
            ) {
                if (curr.name === 'linkedin_message') return { ...acc, history: [...acc.history, curr], checking: undefined };

                return {
                    history: [
                        ...acc.history,
                        curr,
                        {
                            name: curr.name === 'linkedin_message_request' ? 'linkedin_message_request_replied' : 'connect_replied',
                            params: acc.checking.params,
                            executionDate: acc.checking.executionDate,
                        },
                    ],
                    checking: undefined,
                    hasBeenUpdated: true,
                };
            }
            return { ...acc, history: [...acc.history, curr] };
        },
        { history: [], checking: undefined, hasBeenUpdated: false },
    );

    const newHistory = newReversedHistory.sort((a, b) => new Date(a.executionDate).getTime() - new Date(b.executionDate).getTime());
    return { data: newHistory, hasBeenUpdated };
};

export const handleMessageRequestAndConnectReplied = async () => {
    printStartScript('Starting handleMessageRequestAndConnectReplied');
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

        if (prospectsUpdates.length >= BATCH_SIZE) {
            bulkUpdateProspects(GoulagDatabase, prospectsUpdates.splice(0, BATCH_SIZE)).then(({ modifiedCount = 0 }) => {
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
