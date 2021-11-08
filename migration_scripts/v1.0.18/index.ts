import { addActionsHash } from './addActionsHash/index';
import { createAllProspectReplies } from './createAllProspectReplies/index';
import { createConnectRepliedStats } from './createConnectRepliedStats/index';
import { retrieveActionStatsProspects } from './retrieveActionStatsProspects/index';

const maintenanceRequired = async () => {
    console.log('Debut');
    console.time('Script for maintenance');

    // await denormalizeWorldsAndOrigins();
    await addActionsHash();
    await retrieveActionStatsProspects();

    console.timeEnd('Script for maintenance');

    nonMaintenanceRequired();
};

const nonMaintenanceRequired = async () => {
    await createConnectRepliedStats();
    await createAllProspectReplies();
};

maintenanceRequired();
