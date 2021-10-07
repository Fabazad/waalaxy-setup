import { TRAVELER_STATUSES } from './constants';

// Origin

export type BaseOrigin = {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
    travelerCount: number;
};

export type ProspectBatchOrigin = {
    origin: 'prospect_batch';
    prospectList: string | any;
} & BaseOrigin;

export type TriggerOrigin = {
    origin: 'trigger';
    trigger: string;
} & BaseOrigin;

export declare type IOrigin = ProspectBatchOrigin | TriggerOrigin;

export type Origin = IOrigin;

// World

export type Waypoint = any;

export type Path = any;

export declare type IWorld = {
    name: string;
    userId: string;
    startingPoint: Waypoint;
    waypoints: Array<Waypoint>;
    paths: Array<Path>;
    complexity: number;
    tags: Array<string>;
    worldTemplate?: {
        _id: string;
        name: string;
    };
} & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export type World = IWorld;

// Campaign

export type SubWorldTypes = 'onReply' | 'onGoal' | 'onFailed';

export type SubWorld<W = IWorld> = {
    world: W;
};

export const CAMPAIGN_STATES = ['paused', 'running', 'stopped'] as const;

export declare type ICampaign<World = IWorld, Origin = IOrigin, SubWorldType = IWorld, IconColor extends string = string> = {
    name: string;
    user: string;
    world: World;
    priority: number;
    triggers: Array<string>;
    state: typeof CAMPAIGN_STATES[number];
    origins: Array<Origin>;
    iconColor?: IconColor;
    subWorlds?: {
        [K in SubWorldTypes]?: SubWorld<SubWorldType>;
    };
    worldTags: Array<string>;
    worldComplexity: number;
    frozen?: { reason: string };
} & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export type Campaign = ICampaign;
export type OldCampaign = ICampaign<string, string, string, string>;

// Traveler

export type StopStatus = { value: 'waiting_for_validation' } | { value: 'validated'; validationDate: string } | { value: 'failed'; reason: string };

export declare type Stop = {
    id: string;
    waypoint: string;
    type: string;
    params?: Record<string, unknown>;
    arrivalDate: string;
    status: StopStatus;
};

export type TravelerStatus = { value: typeof TRAVELER_STATUSES[number]; reason?: string };

export type HistoryItem = any;

export type TravelStatesItem<B = IWorld> = {
    stops: Array<Stop>;
    paths: Array<string>;
    world: B;
    arrivalDate: string;
    leaveDate?: string;
    status: TravelerStatus;
    previousTravelState: null | number;
    currentStop?: Stop;
};

export declare type ITraveler<A = string, B = IWorld, C = IOrigin, D = string> = {
    campaign: A;
    world: B;
    origin: C;
    user: string;
    prospect: D;
    currentStop?: Stop;
    status: TravelerStatus;
    history: Array<HistoryItem>;
    travelStates: Array<TravelStatesItem<B>>;
} & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export type Traveler = ITraveler;
export type OldTraveler = ITraveler<string, string, string, string>;
