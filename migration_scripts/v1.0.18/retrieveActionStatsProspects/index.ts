import { ACTION_TYPES as EMAIL_ACTION_TYPES, IAction as EmailAction } from '@waapi/hermes-client';
import { ActionType, ACTION_TYPES as LN_ACTION_TYPES, IAction as LinkedInAction } from '@waapi/shiva-client';
import dotEnv from 'dotenv';
import { Connection, Document, Model } from 'mongoose';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printStartScript, printProgress } from '../../scriptHelper';
import { HistoryItem, ITraveler, QueuedAction } from './interfaces';
import {
    ConnectStatModel,
    EmailStatModel,
    FollowStatModel,
    MessageRequestStatModel,
    MessageStatModel,
    TravelerModel,
    VisitStatModel,
} from './schemas';

dotEnv.config();

const isQueuedAction = (item: HistoryItem): item is QueuedAction => item.type === 'queued_action';

const acceptedActionTypes = ['followLinkedin', 'messageLinkedin', 'visitLinkedin', 'connectLinkedin', 'messageRequestLinkedin', 'email'];
const isLnOrMailAction = (
    item: QueuedAction,
): item is Omit<QueuedAction, 'action'> & { action: LinkedInAction | (EmailAction & { type: 'email' }) } =>
    acceptedActionTypes.includes(item.action.type);

const BATCH_SIZE = 1000;

const countTravelers = (c: Connection) =>
    TravelerModel(c)
        .countDocuments({
            'history.type': 'queued_action',
            'history.action.type': {
                $in: [...Object.values(LN_ACTION_TYPES), ...Object.values(EMAIL_ACTION_TYPES)],
            },
            prospect: {
                $exists: true,
            },
        })
        .exec();

const getTravelersBatch = (c: Connection, start: number, limit: number): Promise<Pick<ITraveler, '_id' | 'history' | 'prospect'>[]> =>
    TravelerModel(c)
        .find({
            'history.type': 'queued_action',
            'history.action.type': {
                $in: [...Object.values(LN_ACTION_TYPES), ...Object.values(EMAIL_ACTION_TYPES)],
            },
            prospect: {
                $exists: true,
            },
        })
        .select({
            prospect: true,
            history: true,
        })
        .skip(start)
        .limit(limit)
        .lean()
        .exec();

const bulkUpdateStat = (
    model: Model<Document, {}>,
    updates: { updateMany: { filter: { action: string }; update: { $set: { prospect: string } } } }[],
) => model.bulkWrite(updates, { ordered: false });

const getActionsUpdates = (travelers: Pick<ITraveler, '_id' | 'history' | 'prospect'>[]) =>
    travelers.reduce<Record<ActionType | 'email', { updateMany: { filter: { action: string }; update: { $set: { prospect: string } } } }[]>>(
        (acc, traveler) => {
            const onlyActionHistory = traveler.history.filter(isQueuedAction).filter(isLnOrMailAction);

            let alreadyAddedIds: string[] = [];

            onlyActionHistory.forEach(({ action: { type, _id } }) => {
                if (!alreadyAddedIds.includes(_id)) {
                    acc[type] = [
                        ...acc[type],
                        {
                            updateMany: {
                                filter: {
                                    action: _id,
                                },
                                update: {
                                    $set: {
                                        prospect: traveler.prospect,
                                    },
                                },
                            },
                        },
                    ];
                    alreadyAddedIds.push(_id);
                }
            });

            return acc;
        },
        {
            followLinkedin: [],
            messageLinkedin: [],
            visitLinkedin: [],
            connectLinkedin: [],
            messageRequestLinkedin: [],
            email: [],
        },
    );

export const retrieveActionStatsProspects = async () => {
    printStartScript('Starting retrieveActionStatsProspects');
    const startDate = Date.now();
    const ProfesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const HawkingDatabase = await loginToDatabase(process.env.HAWKING_DATABASE!);

    // const travelersCount = await countTravelers(ProfesorDatabase);
    // console.log(`Found ${travelersCount} Travelers with at least`);

    let hasMore = true;
    let processedTravelers = 0;

    while (hasMore) {
        const batch = await getTravelersBatch(ProfesorDatabase, processedTravelers, BATCH_SIZE);
        hasMore = !!batch.length;
        const updates = getActionsUpdates(batch);

        await Promise.all(
            Object.entries(updates).map(async ([type, updates]) => {
                // @ts-ignore
                const typedType: ActionType | 'email' = type;
                if (updates.length) {
                    switch (typedType) {
                        case 'email':
                            return await bulkUpdateStat(EmailStatModel(HawkingDatabase), updates);
                        case 'visitLinkedin':
                            return await bulkUpdateStat(VisitStatModel(HawkingDatabase), updates);
                        case 'messageLinkedin':
                            return await bulkUpdateStat(MessageStatModel(HawkingDatabase), updates);
                        case 'messageRequestLinkedin':
                            return await bulkUpdateStat(MessageRequestStatModel(HawkingDatabase), updates);
                        case 'followLinkedin':
                            return await bulkUpdateStat(FollowStatModel(HawkingDatabase), updates);
                        case 'connectLinkedin':
                            return await bulkUpdateStat(ConnectStatModel(HawkingDatabase), updates);
                        default:
                            throw new TypeError(`Unrecognized: ${typedType}`);
                    }
                }
            }),
        );

        processedTravelers += BATCH_SIZE;

        printProgress(processedTravelers, 20000000, startDate);
    }

    await disconnectFromDatabase();

    console.log('Exiting');
};

retrieveActionStatsProspects();
