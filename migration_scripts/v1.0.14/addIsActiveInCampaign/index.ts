import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
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
            isActiveInCampaign: {
                $exists: false,
            },
        })
        .exec();

const getProspects = (c: Connection): EventEmitter =>
    ProspectModel(c)
        .collection.find(
            {
                isActiveInCampaign: {
                    $exists: false,
                },
            },
            { timeout: false },
        )
        .project({
            _id: 1,
            history: 1,
            isActiveInCampaign: 1,
        })
        .batchSize(BATCH_SIZE)
        .stream();

const bulkUpdateProspects = (
    c: Connection,
    updates: { updateOne: { filter: Record<string, unknown>; update: { $set: { isActiveInCampaign: boolean } } } }[],
) => ProspectModel(c).bulkWrite(updates);

const prospectIsActiveInCampaign = (prospect: Prospect): { isActiveInCampaign: boolean; toAdd: boolean } => {
    const { history, isActiveInCampaign } = prospect;
    if (isActiveInCampaign) return { isActiveInCampaign, toAdd: false };
    if (history.length === 0) return { isActiveInCampaign: false, toAdd: true };
    const isCampaignNameActive = ['campaign_start', 'campaign_play'];
    const isCampaignNameNotActive = ['campaign_error', 'campaign_exit', 'campaign_finish', 'campaign_pause'];

    let isTravelling = false;
    let notRunning = false;
    let index = 0;
    const historyReverse = history.reverse();

    while (!isTravelling && !notRunning && index < historyReverse.length) {
        if (isCampaignNameActive.includes(historyReverse[index].name)) isTravelling = true;
        if (isCampaignNameNotActive.includes(historyReverse[index].name)) notRunning = true;
        index += 1;
    }

    return { isActiveInCampaign: isTravelling, toAdd: true };
};

export const addIsActiveInCampaign = async () => {
    printStartScript('Starting addIsActiveInCampaign');
    const startDate = Date.now();
    const GoulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const prospectsCount = await countProspects(GoulagDatabase);

    console.log(`Found ${prospectsCount} prospects to update`);

    const prospectsUpdates: { updateOne: { filter: Record<string, unknown>; update: { $set: { isActiveInCampaign: boolean } } } }[] = [];
    let processedProspects = 0;
    let updatedProspects = 0;

    const eventEmitter = getProspects(GoulagDatabase);

    eventEmitter.on('data', (prospect: Prospect) => {
        const newIsActiveInCampaign = prospectIsActiveInCampaign(prospect);
        if (newIsActiveInCampaign.toAdd) {
            prospectsUpdates.push({
                updateOne: {
                    filter: {
                        _id: prospect._id,
                    },
                    update: {
                        $set: {
                            isActiveInCampaign: newIsActiveInCampaign.isActiveInCampaign,
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
