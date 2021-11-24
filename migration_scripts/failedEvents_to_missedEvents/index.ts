import dotEnv from 'dotenv';
import { loginToDatabase } from '../../mongoose';
import { printProgress, printStartScript } from '../scriptHelper';
import { MissedEventModel, FailedEventModel } from './schemas';
import { IFailedEvent } from '../../back/services/otto/src/entities/FailedEvent/persistance/FailedEvent.interfaces';

const BATCH_SIZE = 1000;
dotEnv.config();

async function handleFailedEvent(MissedEvent: ReturnType<typeof MissedEventModel>, failedEvent: IFailedEvent) {
    return MissedEvent.create({
        event: failedEvent.event,
        reason: failedEvent.reason,
        service: failedEvent.service
    });
}

export const fixUserWithoutPermission = async () => {
    printStartScript('Starting fixUserWithoutPermission');
    const ottoDatabase = await loginToDatabase(process.env.OTTO_DATABASE!);

    const FailedEvent = FailedEventModel(ottoDatabase);
    const MissedEvent = MissedEventModel(ottoDatabase);
    const conditions = { reason: "timeout" };
    const failedEventsMatchingCount = await FailedEvent.countDocuments(conditions);
    const startTime = Date.now();
    let hasMore = failedEventsMatchingCount > 0;
    let processed = 0;
    while (hasMore) {
        const failedEventsMatching = await FailedEvent.find(conditions).limit(BATCH_SIZE);
        hasMore = failedEventsMatching.length > 0;

        await Promise.all(failedEventsMatching.map(failedEvent => {
            return handleFailedEvent(MissedEvent, failedEvent);
        }));

        await FailedEvent.deleteMany({_id: {$in: failedEventsMatching.map(failedEvent => failedEvent._id)}});
        processed += failedEventsMatching.length;
        printProgress(processed, failedEventsMatchingCount, startTime);
    }

    console.log('exiting');

    process.exit(1);
};

fixUserWithoutPermission();
