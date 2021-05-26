import mongoose, { Schema } from 'mongoose';
import { loginToDatabase } from '../../../mongoose';

const TRAVELER_STATUSES = ['traveling', 'paused', 'stopped', 'error', 'finished'] as const;

const stop = new mongoose.Schema(
    {
        id: { type: String, required: true },
        waypoint: { type: String, required: true },
        type: { type: String, required: true },
        params: {},
        arrivalDate: { type: Date, required: true },
        status: {
            value: {
                type: String,
                enum: ['failed', 'waiting_for_validation', 'validated'],
                required: true,
            },
            reason: { type: String },
        },
    },
    { _id: false },
);

const OldTravelerSchema = new mongoose.Schema(
    {
        campaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'campaign',
            required: true,
        },
        world: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'World',
            required: true,
        },
        origin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Origin',
            required: true,
        },
        prospect: { type: Schema.Types.Mixed, required: true },
        user: { type: String, required: true },
        currentStop: stop,
        stops: {
            type: [stop],
            required: true,
        },
        paths: { type: [{ type: String, required: true }], required: true },
        status: {
            value: {
                type: String,
                enum: ['traveling', 'paused', 'stopped', 'error', 'finished'],
                required: true,
            },
            reason: { type: String },
        },
        history: { type: [{}], required: true },
    },
    { timestamps: true },
);

export declare type Stop = {
    id: string;
    waypoint: string;
    type: string;
    params?: Record<string, unknown>;
    arrivalDate: string;
    status: { value: 'failed' | 'waiting_for_validation' | 'validated'; reason?: string };
};

type TravelerStatus = { value: typeof TRAVELER_STATUSES[number]; reason?: string };

export declare type IOldTraveler<
    A = mongoose.Schema.Types.ObjectId,
    B = mongoose.Schema.Types.ObjectId,
    C = mongoose.Schema.Types.ObjectId,
    D = string,
> = {
    campaign: A;
    world: B;
    origin: C;
    prospect: D;
    user: string;
    currentStop?: Stop;
    stops: Array<Stop>;
    paths: Array<string>;
    status: TravelerStatus;
    history: Array<any>;
} & {
    _id: mongoose.Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};

export type TravelStatesItem<B = mongoose.Schema.Types.ObjectId> = {
    stops: Array<Stop>;
    paths: Array<string>;
    world: B;
    arrivalDate: string;
    leaveDate?: string;
};

export declare type ITraveler<
    A = mongoose.Schema.Types.ObjectId,
    B = mongoose.Schema.Types.ObjectId,
    C = mongoose.Schema.Types.ObjectId,
    D = string,
> = {
    campaign: A;
    world: B;
    origin: C;
    user: string;
    prospect: D;
    currentStop?: Stop;
    status: TravelerStatus;
    history: Array<any>;
    travelStates: Array<TravelStatesItem<B>>;
} & {
    _id: mongoose.Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};

const TravelerSchema = new mongoose.Schema(
    {
        campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
        world: { type: mongoose.Schema.Types.ObjectId, ref: 'World', required: true },
        origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Origin', required: true },
        user: { type: String, required: true },
        prospect: { type: mongoose.Schema.Types.Mixed, required: true },
        status: {
            value: { type: String, enum: TRAVELER_STATUSES, required: true },
            reason: { type: String },
        },
        history: { type: [{}], required: true },
        currentStop: stop,
        travelStates: {
            type: [
                {
                    stops: {
                        type: [stop],
                        required: true,
                    },
                    paths: { type: [{ type: String, required: true }], required: true },
                    world: { type: mongoose.Schema.Types.ObjectId, ref: 'World', required: true },
                    arrivalDate: { type: Date, required: true },
                    leaveDate: { type: Date },
                },
            ],
            required: true,
        },
    },
    { timestamps: true },
);

export const updateTravelersPathsAndStops = async () => {
    console.log('running updateTravelersPathsAndStops...');
    const profesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const OldTraveler = profesorDatabase.model<any & mongoose.Document>('OldTraveler', OldTravelerSchema, 'travelers');
    const Traveler = profesorDatabase.model<any & mongoose.Document>('Traveler', TravelerSchema, 'travelers');
    const oldTravelersCount = await OldTraveler.countDocuments({
        stops: {
            $exists: true,
        },
        paths: {
            $exists: true,
        },
        world: {
            $exists: true,
        },
    });

    console.log(`Found ${oldTravelersCount} travelers to update`);

    const bulkSize = 100;
    let processedTravelersCount = 0;
    let endedWithErrors = 0;

    while (processedTravelersCount < oldTravelersCount) {
        console.time();
        const oldTravelers: IOldTraveler[] = await OldTraveler.find(
            {
                stops: {
                    $exists: true,
                },
                paths: {
                    $exists: true,
                },
                world: {
                    $exists: true,
                },
            },
            null,
            {
                skip: processedTravelersCount,
                limit: bulkSize,
            },
        );
        const result = await Promise.allSettled(
            oldTravelers.map(({ _id, stops, paths, world, history, createdAt }) =>
                Promise.all([
                    OldTraveler.updateOne(
                        {
                            _id,
                        },
                        {
                            $unset: {
                                stops: true,
                                paths: true,
                            },
                        },
                    ),
                    Traveler.updateOne(
                        {
                            _id,
                        },
                        {
                            $set: {
                                travelStates: [
                                    {
                                        stops,
                                        paths,
                                        world,
                                        arrivalDate: new Date(history[0]?.time ?? createdAt ?? Date.now()).toISOString(),
                                    },
                                ],
                            },
                        },
                    ),
                ]),
            ),
        );
        processedTravelersCount += bulkSize > result.length ? result.length : bulkSize;
        endedWithErrors += result.filter((v) => v.status === 'rejected').length;
        console.log(`Executed queries ${processedTravelersCount}/${oldTravelersCount} (${(processedTravelersCount / oldTravelersCount) * 100}%)`);
        console.timeEnd();
    }
    console.log(`${processedTravelersCount} processed travelers, ${endedWithErrors} updates ended with errors`);
};
