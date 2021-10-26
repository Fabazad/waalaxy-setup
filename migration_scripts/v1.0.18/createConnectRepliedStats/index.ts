import { Connection } from 'mongoose';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { IConnectStat, ITraveler } from '../retrieveActionStatsProspects/interfaces';
import { ConnectStatModel, TravelerModel } from './schemas';

const BATCH_SIZE = 100;
const DELAY_AFTER_BATCH = 1000;

const getReplyDate = (traveler: Pick<ITraveler, '_id' | 'history' | 'campaign' | 'prospect'>, defaultDate: string): string => {
    const connectIndex = traveler.history.findIndex((item) => item.type === 'queued_action' && item.action.type === 'connectLinkedin');

    if (connectIndex === -1) return defaultDate;

    const nextHistoryElement = traveler.history[connectIndex + 1];
    if (!nextHistoryElement || nextHistoryElement.type !== 'validates_stop') return defaultDate;

    return nextHistoryElement.time;
};

const countTravelers = (c: Connection) =>
    TravelerModel(c)
        .countDocuments({
            'history.type': 'queued_action',
            'history.action.type': {
                $in: ['connectLinkedin', 'messageLinkedin', 'messageRequestLinkedin'],
            },
            'status.value': 'hasReplied',
            'status.reason': 'linkedin_reply',
            prospect: {
                $exists: true,
            },
        })
        .exec();

const getHasRepliedTravelersBatch = (
    c: Connection,
    start: number,
    limit: number,
): Promise<Pick<ITraveler, '_id' | 'history' | 'campaign' | 'prospect'>[]> =>
    TravelerModel(c)
        .find({
            'history.type': 'queued_action',
            'history.action.type': {
                $in: ['connectLinkedin'],
            },
            'status.value': 'hasReplied',
            'status.reason': 'linkedin_reply',
            prospect: {
                $exists: true,
            },
        })
        .select({
            campaign: true,
            prospect: true,
            history: true,
        })
        .skip(start)
        .limit(limit)
        .lean()
        .exec();

const getReplyStatsToCreate = async (
    c: Connection,
    travelersWithRepliedStatus: Pick<ITraveler, '_id' | 'history' | 'campaign' | 'prospect'>[],
): Promise<
    {
        insertOne: {
            document: Omit<IConnectStat, 'status'> & { status: 'replied' };
        };
    }[]
> => {
    /** gets travelers stats data */
    const travelersWithStats = await Promise.all<[Pick<ITraveler, '_id' | 'history' | 'campaign' | 'prospect'>, IConnectStat[]]>(
        travelersWithRepliedStatus.map(async (traveler) => [
            traveler,
            await ConnectStatModel(c)
                .find({
                    status: { $in: ['sent', 'replied'] },
                    prospect: traveler.prospect,
                    campaign: traveler.campaign,
                })
                .lean()
                .exec(),
        ]),
    );

    /** filters already replied and non existing sent actions */
    const sentStatsWithNoExistingReplies = travelersWithStats.reduce<[IConnectStat, Pick<ITraveler, '_id' | 'history' | 'campaign' | 'prospect'>][]>(
        (acc, [currentTraveler, travelerStats]) => {
            const sentStat = travelerStats.find((stat) => stat.status === 'sent');

            if (!sentStat || travelerStats.find((stat) => stat.status === 'replied' && stat.action === sentStat.action)) return acc;

            return [...acc, [sentStat, currentTraveler]];
        },
        [],
    );

    return sentStatsWithNoExistingReplies.map(([stat, traveler]) => ({
        insertOne: {
            document: { ...stat, status: 'replied', date: getReplyDate(traveler, stat.date), _id: undefined },
        },
    }));
};

const bulkInsertReplyStats = (
    c: Connection,
    updates: {
        insertOne: {
            document: Omit<IConnectStat, 'status'> & { status: 'replied' };
        };
    }[],
) => ConnectStatModel(c).bulkWrite(updates, { ordered: false });

export const createConnectRepliedStats = async () => {
    printStartScript('Starting createConnectRepliedStats');
    const startDate = Date.now();
    const ProfesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const HawkingDatabase = await loginToDatabase(process.env.HAWKING_DATABASE!);

    const travelersCount = await countTravelers(ProfesorDatabase);
    console.log(`Found ${travelersCount} Travelers with at least`);

    let processedTravelers = 0;
    let createdRepliesCount = 0;

    while (processedTravelers < travelersCount) {
        const inserts = await getReplyStatsToCreate(
            HawkingDatabase,
            await getHasRepliedTravelersBatch(ProfesorDatabase, processedTravelers, BATCH_SIZE),
        );

        const result = await bulkInsertReplyStats(HawkingDatabase, inserts);

        createdRepliesCount += result.insertedCount ?? 0;

        processedTravelers += BATCH_SIZE;

        printProgress(processedTravelers, travelersCount, startDate);

        await new Promise((resolve) => {
            setTimeout(resolve, DELAY_AFTER_BATCH);
        });
    }

    console.log(`\n\r Created ${createdRepliesCount} connect replies`);

    await disconnectFromDatabase();

    console.log('Exiting');
};
