/* eslint-disable camelcase */
import { Schema } from 'mongoose';

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
    LINKEDIN_CONNECTION: 'relationship_connection',
    EMAIL_SENT: 'email_sent',
    EMAIL_REPLIED: 'email_replied',
    EMAIL_BOUNCED: 'email_bounced',
    PROSPECT_ENRICHED: 'prospect_enriched',
    CAMPAIGN_PLAY: 'campaign_play',
    CAMPAIGN_START: 'campaign_start',
    CAMPAIGN_ERROR: 'campaign_error',
    CAMPAIGN_PAUSE: 'campaign_pause',
    CAMPAIGN_EXIT: 'campaign_exit',
    CAMPAIGN_FINISH: 'campaign_finish',
};

export type HistoryItemBase = {
    executionDate: string;
};

export type HistoryItemMap = {
    linkedin_message: HistoryItemBase & {
        action: string;
        name: 'linkedin_message';
        params: {
            contentReference: string;
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
    prospect_enriched: HistoryItemBase & {
        name: 'prospect_enriched';
        params: {
            email?: string;
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
            fromMessageId?: string;
        };
    };
    relationship_connection: HistoryItemBase & {
        name: 'relationship_connection';
        params: {
            connectedAt: number;
        };
    };
    campaign_play: HistoryItemBase & {
        name: 'campaign_play';
        params: {
            campaignId: string;
            reason?: string;
        };
    };
    campaign_start: HistoryItemBase & {
        name: 'campaign_start';
        params: {
            campaignId: string;
            reason?: string;
        };
    };
    campaign_error: HistoryItemBase & {
        name: 'campaign_error';
        params: {
            campaignId: string;
            reason?: string;
        };
    };
    campaign_pause: HistoryItemBase & {
        name: 'campaign_pause';
        params: {
            campaignId: string;
            reason?: string;
        };
    };
    campaign_exit: HistoryItemBase & {
        name: 'campaign_exit';
        params: {
            campaignId: string;
            reason?: string;
        };
    };
    campaign_finish: HistoryItemBase & {
        name: 'campaign_finish';
        params: {
            campaignId: string;
            reason?: string;
        };
    };
};

export type HistoryItem = HistoryItemMap[keyof HistoryItemMap];
export const trustedOrigin = ['regular_import', 'sales_import', 'trigger', 'csv'];
export const untrustedOrigin = ['prospectin'];
export type Origin =
    | { name: 'regular_import' | 'sales_import' | 'csv' | 'prospectin' }
    | { name: 'trigger'; trigger: string }
    | { name: 'group_import'; group: Pick<Group, 'id' | 'name'> };

export type ProfessionalEvent = {
    id: string;
    name: string;
    logo?: string;
};

export type Group = {
    id: string;
    name: string;
    logo?: string;
};

export interface Prospect<P = any> {
    _id: Schema.Types.ObjectId | string;
    profile: P;
    customProfile?: any;
    user: string;
    prospectList: string | any;
    distance?: 'DISTANCE_1' | 'DISTANCE_2' | 'DISTANCE_3' | 'OUT_OF_NETWORK' | 'DISTANCE_-1';
    status?: 'connected' | 'pending' | 'not_connected' | 'unknown';
    connectedAt?: number;
    customData?: { [key: string]: string };
    oneToOneConversationId?: string;
    isRepliedMonitored?: boolean;
    isSeenMonitored?: boolean;
    history: Array<HistoryItem>;
    hasBeenEnriched?: boolean;
    contactEmail?: string;
    enrichedEmail?: string;
    tags: Array<any>;
    origin?: Origin;
    countTryFetchStatus?: number;
    sharedProfessionalEvents: Array<ProfessionalEvent>;
    sharedGroups: Array<Group>;
}

export interface ConversationToMonitor {
    prospect: string;
    oneToOneConversationId: string;
    messageId: string;
}
