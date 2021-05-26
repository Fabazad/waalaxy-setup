import { changeEveryoneToFreeTrial } from './scripts/change_everyone_to_free_trial';
import { cleanStargate } from './scripts/clean_stargate';
import { cleanProspectsConversationMonitored } from './scripts/is_monitored_conversation';
import { restartTravelers } from './scripts/restart_travelers';
import { sendDiscountCodeToPayers } from './scripts/send_discount_code_payers';
import { updateTravelersPathsAndStops } from './scripts/update_traveler_paths_and_stops';
import { updateWorldTemplateWithTagPlan } from './scripts/updateWorldTemplateWithTagPlan';
import { updateWorldWithTagPlan } from './scripts/updateWorldWithTagPlan';
import { updateCampaignWithTagPlan } from './scripts/updateCampaignWithWorldTag';
import { setDateToUserWithProspect } from './scripts/setDateToUserWithProspect';
import { changeProfileOccupationUndefined } from './scripts/changeProfileOccupationUndefined';

const isLive = !!process.argv[2];

(async () => {
    await sendDiscountCodeToPayers(isLive);
    await changeEveryoneToFreeTrial(isLive);
    await cleanStargate(isLive);
    await updateTravelersPathsAndStops();
    await restartTravelers();
    await cleanProspectsConversationMonitored(isLive);
    await updateWorldTemplateWithTagPlan()
    await updateWorldWithTagPlan()
    await updateCampaignWithTagPlan()
    await setDateToUserWithProspect()
    await changeProfileOccupationUndefined()
})();
