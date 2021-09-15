import { loginToDatabase } from '../../mongoose';
import { printProgress, printStartScript } from '../scriptHelper';
import { TravelerModel, MonitoredEmailModel } from './schemas';
import { IMonitoredEmail } from './interfaces';

const PAUSE_BETWEEN_BATCH = 1000;
const BATCH_SIZE = 1000;

async function travelerHasBeenStop(monitoredEmail: IMonitoredEmail, travelerDAO: ReturnType<typeof TravelerModel>): Promise<boolean> {
    const traveler = await travelerDAO.findOne({
        $or: [{
            "currentStop.params.monitoredEmailId": monitoredEmail._id.toString(),
        }, {
            "travelStates.stops.params.monitoredEmailId": monitoredEmail._id.toString(),
        }]
    });
    return !traveler || !["traveling", "pause"].includes(traveler.status.value);
}

async function resetRedisQuotaUpdate() {
    printStartScript('Starting refactorDuplicatedProspects');
    const professorDatabase = await loginToDatabase(process.env.PROFESSOR_DATABASE!);
    const hermesDatabase = await loginToDatabase(process.env.HERMES_DATABASE!);

    const monitoredEmailDAO = MonitoredEmailModel(hermesDatabase);
    const travelerDAO = TravelerModel(professorDatabase);

    const monitoredEmailsTotal = await monitoredEmailDAO.count({});
    console.log(`Found ${monitoredEmailsTotal} users`);
    const startTime = Date.now();
    let processedEmails = 0;

    while (processedEmails < monitoredEmailsTotal) {
        const monitoredEmails = await monitoredEmailDAO.find({}, {}, {
            skip: processedEmails,
            limit: BATCH_SIZE
        });

        await Promise.all(monitoredEmails.map(async (monitoredEmail) => {
            if (await travelerHasBeenStop(monitoredEmail, travelerDAO)) {
                await monitoredEmailDAO.deleteOne({
                    _id: monitoredEmail._id
                });
            }
        }));

        processedEmails += monitoredEmails.length;
        printProgress(processedEmails, monitoredEmailsTotal, startTime);
        await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_BATCH));
    }

    process.exit(1);
}

resetRedisQuotaUpdate();
