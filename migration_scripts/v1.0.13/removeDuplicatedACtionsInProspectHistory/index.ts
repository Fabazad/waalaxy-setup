import dayjs from 'dayjs';
import dotEnv from 'dotenv';
import _ from 'lodash';
import { Connection, Document, QueryCursor } from 'mongoose';
import { EventEmitter } from 'stream';
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
        })
        .exec();

const getProspects = (c: Connection): EventEmitter =>
    ProspectModel(c)
        .collection.find(
            {
                'history.1': {
                    $exists: true,
                },
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

const sanitizeProspectHistory = (history: Prospect['history']): Prospect['history'] =>
    history.reduce<Prospect['history']>((acc, item, currentIndex) => {
        const nextItem = history[currentIndex + 1];
        if (
            !nextItem ||
            nextItem.name !== item.name ||
            (nextItem.name === item.name && !dayjs(nextItem.executionDate).isSame(item.executionDate, 'minute'))
        ) {
            return [...acc, item];
        }
        return acc;
    }, []);

export const removeDuplicatedActionsInProspectHistory = async () => {
    printStartScript('Starting removeDuplicatedActionsInProspectHistory');
    const startDate = Date.now();
    const GoulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const prospectsCount = await countProspects(GoulagDatabase);

    console.log(`Found ${prospectsCount} prospects to update`);

    const prospectsUpdates: { updateOne: { filter: Record<string, unknown>; update: { $set: { history: Array<Record<string, unknown>> } } } }[] = [];
    let processedProspects = 0;
    let updatedProspects = 0;

    const eventEmitter = getProspects(GoulagDatabase);

    eventEmitter.on('data', (prospect: Prospect) => {
        prospectsUpdates.push({
            updateOne: {
                filter: {
                    _id: prospect._id,
                },
                update: {
                    $set: {
                        history: sanitizeProspectHistory(prospect.history),
                    },
                },
            },
        });

        if (prospectsUpdates.length >= 1000) {
            bulkUpdateProspects(GoulagDatabase, prospectsUpdates.splice(0, 1000)).then(({ modifiedCount = 0 }) => {
                updatedProspects += modifiedCount;
            });
        }
        processedProspects += 1;

        printProgress(processedProspects, prospectsCount, startDate);
    });

    eventEmitter.on('end', async () => {
        if (prospectsUpdates.length) {
            const { modifiedCount = 0 } = await bulkUpdateProspects(GoulagDatabase, prospectsUpdates.splice(0));
            updatedProspects += modifiedCount;
        }
        console.log(`\n${updatedProspects} Updated prospects`);

        await disconnectFromDatabase();
        console.log('Exiting');
        process.exit(1);
    });

    eventEmitter.on('error', async (err: Error) => {
        console.warn(err);
        console.log(`\n${updatedProspects} Updated prospects`);

        await disconnectFromDatabase();
        console.log('Exiting');
        process.exit(1);
    });
};

removeDuplicatedActionsInProspectHistory();
