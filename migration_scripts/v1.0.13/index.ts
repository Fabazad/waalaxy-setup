import { addTemplatesWaypointCounts } from './addTemplatesWaypointCounts';
import { addSeeTravelersSeeCampaignsPermissions } from './add_see_travelers_see_campaigns_permissions';
import { initSharedGroupsAndProfessionalEvents } from './init_shared_groups_professional_events';
import { refactorDuplicatedProspects } from './refactor_duplicated_prospects';
import { removeDuplicatedActionsInProspectHistory } from './removeDuplicatedACtionsInProspectHistory';
import { removeDuplicatedActionStats } from './removeDuplicatedActionStats';
import { setDefaultMessageRequestQuota } from './setDefaultMessageRequestQuotas';

const maintenanceRequired = async () => {
    console.time('Script for maintenance');

    await addSeeTravelersSeeCampaignsPermissions();
    await addTemplatesWaypointCounts();
    await setDefaultMessageRequestQuota();
    await initSharedGroupsAndProfessionalEvents();
    await refactorDuplicatedProspects();

    console.timeEnd('Script for maintenance');
};

const nonMaintenanceRequired = async () => {
    await removeDuplicatedActionsInProspectHistory();
    await removeDuplicatedActionStats();
};

maintenanceRequired();
