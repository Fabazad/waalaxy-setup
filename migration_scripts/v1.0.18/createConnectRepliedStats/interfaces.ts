import { TRAVELER_STATUSES } from './constants';
import { IAction as LinkedInAction } from '@waapi/shiva-client';
import { IAction as EmailAction } from '@waapi/hermes-client';

/** ----Profesor Types---- */

export declare type IWorld = {
    name: string;
    userId: string;
    startingPoint: unknown;
    waypoints: Array<unknown>;
    paths: Array<unknown>;
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

export type WebhookAction = {
    _id: string;
    type: 'webhook';
};

export type ValidatesStop = {
    time: string;
    type: 'validates_stop';
    stop: string;
};

export type LeavesStop = {
    time: string;
    type: 'leaves_stop';
    stop: string;
};

export type QueuedAction = {
    time: string;
    type: 'queued_action';
    action: LinkedInAction | WebhookAction | (EmailAction & { type: 'email' });
};

export type ActionCreationRequestedAction = {
    time: string;
    type: 'action_creation_requested';
};

export type ChangeWorld = {
    time: string;
    type: 'change_world';
    from: IWorld['_id'];
    to: IWorld['_id'];
};

export type ErrorItem = {
    time: string;
    type:
        | 'error_linkedin_action_validation_no_history_item'
        | "error_linkedin_action_validation_history_item_doesn't_match"
        | 'error_linkedin_action_validation_no_current_stop'
        | 'world_not_found';
};

export type HistoryItem = LeavesStop | QueuedAction | ValidatesStop | ChangeWorld | ErrorItem | ActionCreationRequestedAction;

export type TravelStatesItem<B = unknown> = {
    stops: Array<Stop>;
    paths: Array<string>;
    world: B;
    arrivalDate: string;
    leaveDate?: string;
    status: TravelerStatus;
    previousTravelState: null | number;
    currentStop?: Stop;
};

export declare type ITraveler<A = unknown, B = unknown, C = unknown, D = string> = {
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

/** ----Hawking Types---- */

export declare type IConnectStat = { user: string; action: string; date: string; campaign: string; status: 'sent' | 'accepted' | 'replied' } & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export declare type IEmailStat = { user: string; action: string; date: string; campaign: string; status: 'sent' } & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export declare type IFollowStat = { user: string; action: string; date: string; campaign: string; status: 'followed' } & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export declare type IMessageRequestStat = { user: string; action: string; date: string; campaign: string; status: 'sent' | 'replied' } & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export declare type IMessageStat = { user: string; action: string; date: string; campaign: string; status: 'sent' | 'replied' } & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export declare type IVisitStat = { user: string; action: string; date: string; campaign: string; status: 'visited' } & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export declare type UpdatableUserKpi = { firstProspect?: Date; firstLinkedInAction?: Date; firstMail?: Date };

export declare type IUserKpi = { user: string } & UpdatableUserKpi & {
        _id: string;
        createdAt?: string;
        updatedAt?: string;
    };
