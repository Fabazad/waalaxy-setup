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
            'history.0': {
                $exists: true,
            },
        })
        .exec();

const getProspects = (c: Connection): EventEmitter =>
    ProspectModel(c)
        .collection.find(
            {
                'history.0': {
                    $exists: true,
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

const prospectIsActiveInCampaign = (prospect: Prospect): { isActiveInCampaign: boolean } => {
    const { history } = prospect;
    const isCampaignNameActive = ['campaign_start', 'campaign_play'];
    const isCampaignNameNotActive = [
        'campaign_error',
        'campaign_exit',
        'campaign_finish',
        'campaign_pause',
        'email_replied',
        'message_replied',
        'connect_replied',
        'linkedin_message_request_replied',
    ];
    const reversedHistory = history.slice().reverse();

    const isActiveInCampaign = reversedHistory.reduce<boolean | 'never_in_a_campaign'>((acc, curr) => {
        if (acc !== 'never_in_a_campaign') return acc;
        if (isCampaignNameActive.includes(curr.name)) return true;
        if (isCampaignNameNotActive.includes(curr.name)) return false;
        return acc;
    }, 'never_in_a_campaign');

    return { isActiveInCampaign: isActiveInCampaign === 'never_in_a_campaign' ? false : isActiveInCampaign };
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
