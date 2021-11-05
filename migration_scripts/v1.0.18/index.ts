import { addDefaultTemplateContent } from '../v1.0.x/scripts/addDefaultTemplateContent';
import { addActionsHash } from './addActionsHash/index';
import { createAllProspectReplies } from './createAllProspectReplies/index';
import { createConnectRepliedStats } from './createConnectRepliedStats/index';
import { retrieveActionStatsProspects } from './retrieveActionStatsProspects/index';

const maintenanceRequired = async () => {
    console.log('Debut');
    console.time('Script for maintenance');

    // await denormalizeWorldsAndOrigins();
    await addActionsHash();
    await addDefaultTemplateContent();
    await retrieveActionStatsProspects();

    console.timeEnd('Script for maintenance');
};

const nonMaintenanceRequired = async () => {
    await createConnectRepliedStats();
    await createAllProspectReplies();
};

maintenanceRequired();
