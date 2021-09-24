import { addIsActiveInCampaign } from './addIsActiveInCampaign';
import { handleMessageRequestAndConnectReplied } from './handleMessageRequestAndConnectReplied';

const maintenanceRequired = async () => {
    console.log('Debut');
    console.time('Script for maintenance');

    await addIsActiveInCampaign();

    console.timeEnd('Script for maintenance');
};

const nonMaintenanceRequired = async () => {
    await handleMessageRequestAndConnectReplied();
};

maintenanceRequired();
