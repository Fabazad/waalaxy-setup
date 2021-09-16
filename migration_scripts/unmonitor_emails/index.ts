import { loginToDatabase } from '../../mongoose';
import { printProgress, printStartScript } from '../scriptHelper';
import { TravelerModel, MonitoredEmailModel } from './schemas';
import { IMonitoredEmail } from './interfaces';

const PAUSE_BETWEEN_BATCH = 1000;
const BATCH_SIZE = 1000;

async function travelerHasBeenStop(monitoredEmail: IMonitoredEmail, travelerDAO: ReturnType<typeof TravelerModel>): Promise<boolean> {
    const traveler = await travelerDAO.findOne({
        user: monitoredEmail.user,
        prospect: monitoredEmail.prospect,
        $or: [{
            "currentStop.params.monitoredEmailId": monitoredEmail._id.toString(),
        }, {
            "travelStates.stops.params.monitoredEmailId": monitoredEmail._id.toString(),
        }]
    });
    return !traveler || !["traveling", "pause"].includes(traveler.status.value);
}

async function removeUselessMonitoredEmails() {
    printStartScript('Starting removeUselessMonitoredEmails');
    const profesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const hermesDatabase = await loginToDatabase(process.env.HERMES_DATABASE!);

    const monitoredEmailDAO = MonitoredEmailModel(hermesDatabase);
    const travelerDAO = TravelerModel(profesorDatabase);

    const monitoredEmailsTotal = await monitoredEmailDAO.count({});
    console.log(`Found ${monitoredEmailsTotal} monitored Emails`);
    const startTime = Date.now();
    let processedEmails = 0;
    const monitoredEmailsToDelete = [];
    while (processedEmails < monitoredEmailsTotal) {
        const monitoredEmails = await monitoredEmailDAO.find({}, {}, {
            skip: processedEmails,
            limit: BATCH_SIZE
        });

        monitoredEmailsToDelete.push(...(await Promise.all(monitoredEmails.map(async (monitoredEmail) => {
            if (await travelerHasBeenStop(monitoredEmail, travelerDAO)) {
                return monitoredEmail._id;
            }
            return null;
        }))).filter(id => id !== null));

        processedEmails += monitoredEmails.length;
        printProgress(processedEmails, monitoredEmailsTotal, startTime);
        await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_BATCH));
    }


    await monitoredEmailDAO.deleteMany({
        _id: { $in: monitoredEmailsToDelete }
    });

    process.exit(1);
}

removeUselessMonitoredEmails();
