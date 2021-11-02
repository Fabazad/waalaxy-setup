import { Connection } from 'mongoose';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { IConnectStat, ITraveler } from '../retrieveActionStatsProspects/interfaces';
import { IMessageRequestStat, IMessageStat } from './interfaces';
import { ConnectStatModel, MessageRequestStatModel, MessageStatModel, TravelerModel } from './schemas';

const BATCH_SIZE = 100;
const DELAY_AFTER_BATCH = 1000;

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
                $in: ['connectLinkedin', 'messageLinkedin', 'messageRequestLinkedin'],
            },
            'status.value': 'hasReplied',
            'status.reason': 'linkedin_reply',
            prospect: {
                $exists: true,
            },
            campaign: {
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
): Promise<{
    connects: IConnectStat[];
    messages: IMessageStat[];
    messageRequests: IMessageRequestStat[];
}> => {
    /** gets travelers stats data */
    const travelersWithStats = await Promise.all<
        [Pick<ITraveler, '_id' | 'history' | 'campaign' | 'prospect'>, [IConnectStat[], IMessageRequestStat[], IMessageStat[]]]
    >(
        travelersWithRepliedStatus.map(async (traveler) => [
            traveler,
            await Promise.all([
                ConnectStatModel(c)
                    .find({
                        status: { $in: ['sent', 'replied'] },
                        prospect: traveler.prospect,
                        campaign: traveler.campaign,
                    })
                    .lean(),
                MessageRequestStatModel(c)
                    .find({
                        status: { $in: ['sent', 'replied'] },
                        prospect: traveler.prospect,
                        campaign: traveler.campaign,
                    })
                    .lean()
                    .exec(),
                MessageStatModel(c)
                    .find({
                        status: { $in: ['sent', 'replied'] },
                        prospect: traveler.prospect,
                        campaign: traveler.campaign,
                    })
                    .lean()
                    .exec(),
            ]),
        ]),
    );

    /** filters already replied and non existing sent actions */
    const sentStatsWithNoExistingReplies = travelersWithStats.reduce<
        [
            { connect: IConnectStat | null; messages: IMessageStat[]; messageRequests: IMessageRequestStat[] },
            Pick<ITraveler, '_id' | 'history' | 'campaign' | 'prospect'>,
        ][]
    >((acc, [currentTraveler, [connectStats, messageRequestStats, messageStats]]) => {
        const sentConnectStat = connectStats.find((stat) => stat.status === 'sent');

        let connectReplied = false;
        if (sentConnectStat && connectStats.find((stat) => stat.status === 'replied' && stat.action === sentConnectStat.action)) {
            connectReplied = true;
        }

        let messageRequestReplied = false;
        let messageRequestRepliesToCreate: IMessageRequestStat[] = [];
        if (messageRequestReplied && messageRequestStats.some((stat) => stat.status === 'replied')) {
            messageRequestReplied = true;
            /** filter stat that already have a reply */
            messageRequestRepliesToCreate = messageRequestStats.filter(
                (stat) => !messageRequestStats.find((reply) => reply.status === 'replied' && stat.action === reply.action),
            );
        }

        let messageReplied = false;
        let messageRepliesToCreate: IMessageStat[] = [];
        if (messageReplied && messageStats.some((stat) => stat.status === 'replied')) {
            messageReplied = true;
            /** filter stat that already have a reply */
            messageRepliesToCreate = messageStats.filter(
                (stat) => !messageStats.find((reply) => reply.status === 'replied' && stat.action === reply.action),
            );
        }

        if (!connectReplied && !messageRequestReplied && !messageReplied) {
            return acc;
        }

        return [
            ...acc,
            [
                {
                    connect: !connectReplied ? sentConnectStat : null,
                    messages: messageRepliesToCreate,
                    messageRequests: messageRequestRepliesToCreate,
                },
                currentTraveler,
            ],
        ];
    }, []);

    return sentStatsWithNoExistingReplies.reduce<{
        connects: IConnectStat[];
        messages: IMessageStat[];
        messageRequests: IMessageRequestStat[];
    }>(
        ({ connects, messageRequests, messages }, [travelerStats]) => {
            return {
                messageRequests: [
                    ...messageRequests,
                    ...travelerStats.messageRequests.map<IMessageRequestStat>((stat) => ({
                        ...stat,
                        status: 'replied',
                        _id: undefined,
                    })),
                ],
                messages: [
                    ...messages,
                    ...travelerStats.messages.map<IMessageStat>((stat) => ({
                        ...stat,
                        status: 'replied',
                        _id: undefined,
                    })),
                ],
                connects: travelerStats.connect ? [...connects, { ...travelerStats.connect, status: 'replied', _id: undefined }] : connects,
            };
        },
        {
            connects: [],
            messages: [],
            messageRequests: [],
        },
    );
};

const bulkInsertReplyStats = (
    c: Connection,
    type: 'connects' | 'messages' | 'messageRequests',
    updates: {
        insertOne: {
            document: Omit<IConnectStat | IMessageStat | IMessageRequestStat, 'status'> & { status: 'replied' };
        };
    }[],
) => {
    if (type === 'connects') {
        return ConnectStatModel(c).bulkWrite(updates, { ordered: false });
    }
    if (type === 'messageRequests') {
        return MessageRequestStatModel(c).bulkWrite(updates, { ordered: false });
    }
    if (type === 'messages') {
        return MessageStatModel(c).bulkWrite(updates, { ordered: false });
    }
};

export const createAllProspectReplies = async () => {
    printStartScript('Starting createAllProspectReplies');
    const startDate = Date.now();
    const ProfesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const HawkingDatabase = await loginToDatabase(process.env.HAWKING_DATABASE!);

    const travelersCount = await countTravelers(ProfesorDatabase);
    console.log(`Found ${travelersCount} Travelers with at hasReply status`);

    let processedTravelers = 0;
    let createdRepliesCount = 0;

    while (processedTravelers < travelersCount) {
        const statsToCreate = await getReplyStatsToCreate(
            HawkingDatabase,
            await getHasRepliedTravelersBatch(HawkingDatabase, processedTravelers, BATCH_SIZE),
        );

        const res = await Promise.all<{ nInserted: number }>(
            (Object.keys(statsToCreate) as (keyof typeof statsToCreate)[]).map(async (statType) =>
                statsToCreate[statType].length
                    ? bulkInsertReplyStats(
                          HawkingDatabase,
                          statType,
                          statsToCreate[statType].map((toCreate) => ({
                              insertOne: {
                                  document: toCreate,
                              },
                          })),
                      )
                    : Promise.resolve({
                          nInserted: 0,
                      }),
            ),
        );

        createdRepliesCount += res.reduce<number>((acc, result) => acc + result.nInserted, 0);
        processedTravelers += BATCH_SIZE;

        printProgress(processedTravelers, travelersCount, startDate);

        await new Promise((resolve) => {
            setTimeout(resolve, DELAY_AFTER_BATCH);
        });
    }

    console.log(`\n\r Created ${createdRepliesCount} replies`);

    await disconnectFromDatabase();

    console.log('Exiting');
};

createAllProspectReplies();
