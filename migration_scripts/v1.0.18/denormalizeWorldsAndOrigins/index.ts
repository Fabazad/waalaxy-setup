import dotEnv from 'dotenv';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { ORIGINS_BATCH_SIZE, WORLDS_BATCH_SIZE } from './constants';
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
    count,
    alreadyProcessed = 0,
    getBatch,
    buildCampaignUpdate,
    buildTravelerUpdate,
    onProcess,
}: DenormalizeFunctionParams<Data>) => {
    let processed = alreadyProcessed;

    while (processed < count) {
        const batch = await getBatch(processed);

        const travelersUpdates: BulkUpdate<Traveler | OldTraveler> = batch.map(buildTravelerUpdate).flat();
        const campaignsUpdates: BulkUpdate<Campaign | OldCampaign> = batch.map(buildCampaignUpdate).flat();

        await Promise.all([bulkUpdateTravelers(connection, travelersUpdates), bulkUpdateCampaigns(connection, campaignsUpdates)]);

        processed += batch.length;
        onProcess(processed);
    }
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
        const originsStartDate = Date.now();
        const worldsStartDate = Date.now();

        await Promise.all([
            denormalize<Origin>({
                connection: ProfesorDatabase,
                getBatch: (processed) => getOrigins(ProfesorDatabase, processed, ORIGINS_BATCH_SIZE),
                count: originsCount,
                buildTravelerUpdate: (origin) => [buildTravelerOriginUpdate(origin)],
                buildCampaignUpdate: (origin) => [buildCampaignOriginsUpdate(origin)],
                onProcess: (processed) => printProgress(processed, originsCount, originsStartDate),
            }),
            denormalize<World>({
                connection: ProfesorDatabase,
                getBatch: (processed) => getWorlds(ProfesorDatabase, processed, WORLDS_BATCH_SIZE),
                count: worldsCount,
                buildTravelerUpdate: (world) => [buildTravelerWorldUpdate(world), buildTravelerTravelStatesWorldUpdate(world)],
                buildCampaignUpdate: (world) => [buildCampaignWorldUpdate(world), ...buildCampaignSubWorldsUpdate(world)],
                onProcess: (processed) => printProgress(processed, worldsCount, worldsStartDate),
            }),
        ]);
    } catch (err) {
        console.log(err);
    }

    const [notUpdatedTravelers, notUpdatedCampaigns] = await Promise.all([
        countNotUpdatedTravelers(ProfesorDatabase),
        countNotUpdatedCampaigns(ProfesorDatabase),
    ]);
    if (notUpdatedCampaigns > 0 || notUpdatedTravelers > 0)
        console.log(`\nNot updated: ${notUpdatedCampaigns} campaigns and ${notUpdatedTravelers} travelers`);

    await disconnectFromDatabase();
    process.exit(1);
};
