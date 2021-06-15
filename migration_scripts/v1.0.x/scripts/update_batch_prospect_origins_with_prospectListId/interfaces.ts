import { Schema } from 'mongoose';

export interface ProspectList {
    _id: Schema.Types.ObjectId | string;
    name: string;
    user: Schema.Types.ObjectId | string;
}

export interface Company {
    name?: string;
    linkedinUrl?: string;
    website?: string;
}

export interface Birthday {
    day?: string;
    month?: string;
}

export const historyNamesRecord = {
    LINKEDIN_MESSAGE: 'linkedin_message',
    LINKEDIN_CONNECT: 'linkedin_connect',
    LINKEDIN_VISIT: 'linkedin_visit',
    LINKEDIN_FOLLOW: 'linkedin_follow',
    MESSAGE_SEEN: 'message_seen',
    MESSAGE_REPLIED: 'message_replied',
    LINKEDIN_CONNECTION: 'linkedin_connection',
    EMAIL_SENT: 'email_sent',
    EMAIL_REPLIED: 'email_replied',
    EMAIL_BOUNCED: 'email_bounced',
};

export type HistoryItemBase = {
    executionDate: string;
};

export type HistoryItemMap = {
    linkedin_message: HistoryItemBase & {
        action: string;
        name: 'linkedin_message';
        params: {
            messageContent: string;
            messageId: string;
        };
    };
    linkedin_connect: HistoryItemBase & {
        action: string;
        name: 'linkedin_connect';
        params: {
            messageContent?: string;
        };
    };
    linkedin_visit: HistoryItemBase & {
        action: string;
        name: 'linkedin_visit';
    };
    linkedin_follow: HistoryItemBase & {
        action: string;
        name: 'linkedin_follow';
    };
    email_sent: HistoryItemBase & {
        name: 'email_sent';
        params: {
            emailId: string;
            text: string;
            subject: string;
            sentAt: Date;
        };
    };
    email_replied: HistoryItemBase & {
        name: 'email_replied';
        params: {
            emailId: string;
        };
    };
    email_bounced: HistoryItemBase & {
        name: 'email_bounced';
        params: {
            emailId: string;
        };
    };
    message_seen: HistoryItemBase & {
        name: 'message_seen';
        params: {
            messageId: string;
        };
    };
    message_replied: HistoryItemBase & {
        name: 'message_replied';
        params: {
            messageId: string;
        };
    };
    relationship_connection: HistoryItemBase & {
        name: 'relationship_connection';
        params: {
            connectedAt: number;
        };
    };
};

export type HistoryItem = HistoryItemMap[keyof HistoryItemMap];

export type Origin = { name: 'regular_import' | 'sales_import' | 'csv' } | { name: 'trigger'; trigger: string };

export interface Prospect {
    _id: Schema.Types.ObjectId | string;
    user?: Schema.Types.ObjectId | string;
    prospectList: Schema.Types.ObjectId;
    distance?: 'DISTANCE_1' | 'DISTANCE_2' | 'DISTANCE_3' | 'OUT_OF_NETWORK';
    status?: 'connected' | 'pending' | 'not_connected';
    connectedAt?: number;
    oneToOneConversationId?: string;
    isRepliedMonitored?: boolean;
    isSeenMonitored?: boolean;
    history?: Array<HistoryItem>;
    hasBeenEnriched?: boolean;
    contactEmail?: string;
    tags?: Array<Schema.Types.ObjectId | string>;
    origin?: Origin;
}

export interface ConversationToMonitor {
    prospect: string;
    oneToOneConversationId: string;
    messageId: string;
}

export type BaseOrigin = {
    _id: Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
    travelerCount: number;
};

export type ProspectBatchOrigin = {
    origin: 'prospect_batch';
    prospectList: string;
} & BaseOrigin;

export type TriggerOrigin = {
    origin: 'trigger';
    trigger: string;
} & BaseOrigin;

export declare type IOrigin = ProspectBatchOrigin | TriggerOrigin;

export declare type StopStatus = { value: 'failed' | 'waiting_for_validation' | 'validated'; reason?: string };

export declare type Stop = {
    id: string;
    waypoint: string;
    type: string;
    params?: Record<string, unknown>;
    arrivalDate: string;
    status: StopStatus;
};

export type TravelStatesItem<B = Schema.Types.ObjectId> = {
    stops: Array<Stop>;
    paths: Array<string>;
    world: B;
    arrivalDate: string;
    leaveDate?: string;
};

export const TRAVELER_STATUSES = ['traveling', 'paused', 'stopped', 'error', 'finished'] as const;

export type TravelerStatus = { value: typeof TRAVELER_STATUSES[number]; reason?: string };

export declare type ITraveler<A = Schema.Types.ObjectId, B = Schema.Types.ObjectId, C = Schema.Types.ObjectId, D = string> = {
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
    _id: Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};
