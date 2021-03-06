import dotEnv from 'dotenv';
import { Connection, Schema } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { printProgress } from '../../../scriptHelper';
import { IOldTraveler, Stop, TravelerStatus } from './interfaces';
import { NewTravelerModel, OldTravelerModel } from './schemas';
dotEnv.config();

const BATCH_SIZE = 1000;
const PAUSE_BETWEEN_BATCH = 0;

const countTravelersToUpdate = (c: Connection): Promise<number> =>
    OldTravelerModel(c)
        .countDocuments({
            'status.value': {
                $in: ['traveling', 'paused'],
            },
            'travelStates.0': { $exists: true },
            travelStates: {
                $elemMatch: {
                    status: { $exists: false },
                },
            },
        })
        .exec();

const getAllTravelersIdsToUpdate = async (c: Connection): Promise<Schema.Types.ObjectId[]> => {
    const r = await OldTravelerModel(c)
        .find({
            'status.value': {
                $in: ['traveling', 'paused'],
            },
            'travelStates.0': { $exists: true },
            travelStates: {
                $elemMatch: {
                    status: { $exists: false },
                },
            },
        })
        .select({ _id: 1 })
        .lean()
        .exec();
    return r.map<Schema.Types.ObjectId>((t) => t._id);
};

const getTravelersBatch = (c: Connection): Promise<IOldTraveler[]> =>
    OldTravelerModel(c)
        .find({
            'status.value': {
                $in: ['traveling', 'paused'],
            },
            'travelStates.0': { $exists: true },
            travelStates: {
                $elemMatch: {
                    status: { $exists: false },
                },
            },
        })
        .limit(BATCH_SIZE)
        .sort({ _id: -1 })
        .select({
            _id: 1,
            status: 1,
            currentStop: 1,
            world: 1,
        })
        .lean()
        .exec();

const bulkUpdateTravelers = (
    c: Connection,
    updates: {
        travelerId: Schema.Types.ObjectId;
        worldId: Schema.Types.ObjectId;
        status: TravelerStatus;
        currentStop?: Stop;
        previousWorldIndex?: number;
    }[],
) => {
    // console.log(updates);
    return NewTravelerModel(c).bulkWrite(
        updates.map(({ travelerId, worldId, status, currentStop, previousWorldIndex }) => ({
            updateOne: {
                filter: {
                    _id: travelerId,
                    world: worldId,
                    'travelStates.world': worldId,
                },
                update: {
                    $set: {
                        'travelStates.$.status': status,
                        'travelStates.$.currentStop': currentStop,
                        ...(typeof previousWorldIndex === 'number' ? { 'travelStates.$.previousTravelState': previousWorldIndex } : {}),
                    },
                },
            },
        })),
        {
            ordered: false,
        },
    );
};
const hasPreviousWorld = (traveler: IOldTraveler): boolean => traveler.travelStates?.length > 1;

const getPreviousWorldIndex = (traveler: IOldTraveler): number => traveler.travelStates?.length - 1;

export const updateTravelersTravelStates = async () => {
    console.log('Running updateTravelersTravelStates');
    const profesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const now = Date.now();

    const travelersToUpdateCount = await countTravelersToUpdate(profesorDatabase);

    console.log(`Found: ${travelersToUpdateCount} to update`);

    let processedTravelers = 0;
    let updatedTravelers = 0;

    // await getAllTravelersIdsToUpdate(profesorDatabase);
    while (processedTravelers < travelersToUpdateCount) {
        const travelersBatch = await getTravelersBatch(profesorDatabase);
        const result = await bulkUpdateTravelers(
            profesorDatabase,
            travelersBatch.map((t) => ({
                travelerId: t._id,
                currentStop: t.currentStop,
                worldId: t.world,
                status: t.status,
                previousWorldIndex: hasPreviousWorld(t) ? getPreviousWorldIndex(t) : undefined,
            })),
        );

        console.log(result);

        updatedTravelers += result.modifiedCount ?? 0;

        console.log(`\nUpdated ${result.modifiedCount} travelers`);

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedTravelers = BATCH_SIZE + processedTravelers > travelersToUpdateCount ? travelersToUpdateCount : processedTravelers + BATCH_SIZE;

        printProgress(processedTravelers, travelersToUpdateCount, now);
        console.log('updated', updatedTravelers);
    }

    console.log('Done !');

    process.exit();
};

updateTravelersTravelStates();
