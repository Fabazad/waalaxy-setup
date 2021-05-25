import { changeEveryoneToFreeTrial } from './scripts/change_everyone_to_free_trial';
import { cleanStargate } from './scripts/clean_stargate';
import { restartTravelers } from './scripts/restart_travelers';
import { sendDiscountCodeToPayers } from './scripts/send_discount_code_payers';

const isLive = !!process.argv[2];

(async () => {
    await sendDiscountCodeToPayers(isLive);
    await changeEveryoneToFreeTrial(isLive);
    await cleanStargate(isLive);
    await restartTravelers();
})();
