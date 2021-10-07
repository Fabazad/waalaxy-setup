import dotEnv from 'dotenv';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { CAMPAIGNS_UPDATE_BATCH_SIZE, ORIGINS_BATCH_SIZE, TRAVELERS_UPDATE_BATCH_SIZE, WORLDS_BATCH_SIZE } from './constants';
import { DenormalizeFunctionParams } from './interfaces';
import {
    buildCampaignOriginsUpdate,
    buildCampaignSubWorldsUpdate,
    buildCampaignWorldUpdate,
    buildTravelerOriginUpdate,
    buildTravelerTravelStatesWorldUpdate,
    buildTravelerWorldUpdate,
    BulkUpdate,
    bulkUpdateCampaigns,
    bulkUpdateTravelers,
    countNotUpdatedCampaigns,
    countNotUpdatedTravelers,
    countOrigins,
    countWorlds,
    getOrigins,
    getWorlds,
} from './persistance/dao';
import { Campaign, OldCampaign, OldTraveler, Origin, Traveler, World } from './persistance/interfaces';
import { sleep } from './utils';

dotEnv.config();

const denormalize = async <Data extends World | Origin>({
    connection,
    eventEmitter,
    buildCampaignUpdate,
    buildTravelerUpdate,
    onProcess,
}: DenormalizeFunctionParams<Data>) => {
    const travelersUpdates: BulkUpdate<Traveler | OldTraveler> = [];
    const campaignsUpdates: BulkUpdate<Campaign | OldCampaign> = [];

    let processed = 0;

    eventEmitter.on('data', (data: Data) => {
        travelersUpdates.push(...buildTravelerUpdate(data));
        campaignsUpdates.push(...buildCampaignUpdate(data));

        if (travelersUpdates.length >= TRAVELERS_UPDATE_BATCH_SIZE) {
            bulkUpdateTravelers(connection, travelersUpdates.splice(0, TRAVELERS_UPDATE_BATCH_SIZE));
        }

        if (campaignsUpdates.length >= CAMPAIGNS_UPDATE_BATCH_SIZE) {
            bulkUpdateCampaigns(connection, campaignsUpdates.splice(0, CAMPAIGNS_UPDATE_BATCH_SIZE));
        }

        processed += 1;
        onProcess(processed);
    });

    return new Promise<void>((resolve, reject) => {
        eventEmitter.on('end', async () => {
            if (travelersUpdates.length) {
                await bulkUpdateTravelers(connection, travelersUpdates.splice(0));
            }

            if (campaignsUpdates.length) {
                await bulkUpdateCampaigns(connection, campaignsUpdates.splice(0));
            }

            resolve();
        });

        eventEmitter.on('error', reject);
    });
};

export const denormalizeWorldsAndOrigins = async () => {
    printStartScript('Starting denormalizeWorldsAndOrigins');
    const ProfesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);

    const worldsCount = await countWorlds(ProfesorDatabase);
    const originsCount = await countOrigins(ProfesorDatabase);

    console.log(`\nGoing to denormalize ${worldsCount} worlds and ${originsCount} origins`);

    // Sleep to prevent previous console.log to be erased by printProgress
    await sleep(3000);

    try {
        const worldsStartDate = Date.now();
        await denormalize<World>({
            connection: ProfesorDatabase,
            eventEmitter: getWorlds(ProfesorDatabase, WORLDS_BATCH_SIZE),
            buildTravelerUpdate: (world) => [buildTravelerWorldUpdate(world), buildTravelerTravelStatesWorldUpdate(world)],
            buildCampaignUpdate: (world) => [buildCampaignWorldUpdate(world), ...buildCampaignSubWorldsUpdate(world)],
            onProcess: (processed) => printProgress(processed, worldsCount, worldsStartDate),
        });

        const originsStartDate = Date.now();
        await denormalize<Origin>({
            connection: ProfesorDatabase,
            eventEmitter: getOrigins(ProfesorDatabase, ORIGINS_BATCH_SIZE),
            buildTravelerUpdate: (origin) => [buildTravelerOriginUpdate(origin)],
            buildCampaignUpdate: (origin) => [buildCampaignOriginsUpdate(origin)],
            onProcess: (processed) => printProgress(processed, originsCount, originsStartDate),
        });
    } catch (err) {
        console.log(err);
    }

    const notUpdatedTravelers = await countNotUpdatedTravelers(ProfesorDatabase);
    const notUpdatedCampaigns = await countNotUpdatedCampaigns(ProfesorDatabase);
    if (notUpdatedCampaigns > 0 || notUpdatedTravelers > 0)
        console.log(`\nNot updated: ${notUpdatedCampaigns} campaigns and ${notUpdatedTravelers} travelers`);

    await disconnectFromDatabase();
    process.exit(1);
};
