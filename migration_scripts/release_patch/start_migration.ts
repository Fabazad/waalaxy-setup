import { restartTravelers } from './scripts/restart_travelers';
import { updateTravelersPathsAndStops } from './scripts/update_traveler_paths_and_stops';

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
    // await changeEveryoneToFreeTrial(isLive);
    // await cleanStargate(isLive);
    // await cleanProspectsConversationMonitored(isLive);
    // await updateDraftCampaignWithTagPlan();
    // await updateWorldTemplateWithTagPlan();
    // await updateWorldWithTagPlan();
    // await updateCampaignWithTagPlan();
    // await setDateToUserWithProspect();
    // await changeProfileOccupationUndefined();
    await updateTravelersPathsAndStops();
    await restartTravelers();
})();
