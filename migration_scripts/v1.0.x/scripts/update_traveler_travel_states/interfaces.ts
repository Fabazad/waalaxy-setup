import { Schema } from 'mongoose';

export declare type StopStatus = { value: 'failed' | 'waiting_for_validation' | 'validated'; reason?: string };

export declare type Stop = {
    id: string;
    waypoint: string;
    type: string;
    params?: Record<string, unknown>;
    arrivalDate: string;
    status: StopStatus;
};

export type OldTravelStatesItem<B = Schema.Types.ObjectId> = {
    stops: Array<Stop>;
    paths: Array<string>;
    world: B;
    arrivalDate: string;
    leaveDate?: string;
};

export type NewTravelStatesItem<B = Schema.Types.ObjectId> = {
    stops: Array<Stop>;
    paths: Array<string>;
    world: B;
    arrivalDate: string;
    leaveDate?: string;
    status: TravelerStatus;
    previousTravelState: null | number;
    currentStop?: Stop;
};

export const TRAVELER_STATUSES = ['traveling', 'paused', 'stopped', 'hasReplied', 'error', 'finished'] as const;

export type TravelerStatus = { value: typeof TRAVELER_STATUSES[number]; reason?: string };

export declare type IOldTraveler<A = Schema.Types.ObjectId, B = Schema.Types.ObjectId, C = Schema.Types.ObjectId, D = string> = {
    campaign: A;
    world: B;
    origin: C;
    user: string;
    prospect: D;
    currentStop?: Stop;
    status: TravelerStatus;
    history: Array<any>;
    travelStates: Array<OldTravelStatesItem<B>>;
} & {
    _id: Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};

export declare type INewTraveler<A = Schema.Types.ObjectId, B = Schema.Types.ObjectId, C = Schema.Types.ObjectId, D = string> = {
    campaign: A;
    world: B;
    origin: C;
    user: string;
    prospect: D;
    currentStop?: Stop;
    status: TravelerStatus;
    history: Array<any>;
    travelStates: Array<NewTravelStatesItem<B>>;
} & {
    _id: Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};
