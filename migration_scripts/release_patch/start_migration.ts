import { changeProfileOccupationUndefined } from './scripts/changeProfileOccupationUndefined';
import { changeEveryoneToFreeTrial } from './scripts/change_everyone_to_free_trial';
import { cleanStargate } from './scripts/clean_stargate';
import { cleanProspectsConversationMonitored } from './scripts/is_monitored_conversation';
import { restartTravelers } from './scripts/restart_travelers';
import { setDateToUserWithProspect } from './scripts/setDateToUserWithProspect';
import { updateCampaignWithTagPlan } from './scripts/updateCampaignWithWorldTag';
import { updateWorldTemplateWithTagPlan } from './scripts/updateWorldTemplateWithTagPlan';
import { updateWorldWithTagPlan } from './scripts/updateWorldWithTagPlan';
import { updateTravelersPathsAndStops } from './scripts/update_traveler_paths_and_stops';
import { updatDraftCampaignWithTagPlan } from './scripts/updateDraftCampaignTagPlan';

const isLive = !!process.argv[2];

(async () => {
    /*

        Maintenance:
            - mystique
            - stargate
        
        Push sur master tout les services
        Lancer les scripts
        Publier l'extension

    */

    // await sendDiscountCodeToPayers(isLive);
    await changeEveryoneToFreeTrial(isLive);
    await cleanStargate(isLive);
    await updateTravelersPathsAndStops();
    await restartTravelers();
    await cleanProspectsConversationMonitored(isLive);
    await updatDraftCampaignWithTagPlan()
    await updateWorldTemplateWithTagPlan();
    await updateWorldWithTagPlan();
    await updateCampaignWithTagPlan();
    await setDateToUserWithProspect();
    await changeProfileOccupationUndefined();
})();
