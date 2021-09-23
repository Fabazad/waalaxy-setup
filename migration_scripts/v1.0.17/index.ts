import { addIsActiveInCampaign } from './addIsActiveInCampaign';
import { changeMessageRepliedByConnectRepliedWhenNecessary } from './change_messageReplied_by_connectReplied_when_necessary';

const maintenanceRequired = async () => {
    console.log('Debut');
    console.time('Script for maintenance');

    await addIsActiveInCampaign();

    console.timeEnd('Script for maintenance');
};

const nonMaintenanceRequired = async () => {
    await changeMessageRepliedByConnectRepliedWhenNecessary();
};

maintenanceRequired();
