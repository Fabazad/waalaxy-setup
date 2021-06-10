/* eslint-disable camelcase */
import { Schema } from 'mongoose';
export type Tag = {
    _id: Schema.Types.ObjectId | string;
    name: string;
    color: string;
    user: Schema.Types.ObjectId | string;
};

export interface ProspectList {
    _id: Schema.Types.ObjectId | string;
    name: string;
    user: Schema.Types.ObjectId | string;
}

export interface DropContactInterface {
    enrichmentDate: string;
    civility?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: Array<{ email?: string; qualification?: string }>;
    phone?: string;
    mobile_phone?: string;
    company?: string;
    website?: string;
    linkedin?: string;
    company_infogreffe?: string;
    siren?: string;
    siret?: string;
    vat?: string;
    nb_employees?: string;
    naf5_code?: string;
    naf5_des?: string;
    siret_address?: string;
    siret_zip?: string;
    siret_city?: string;
    company_linkedin?: string;
    company_turnover?: string;
    company_results?: string;
}

export interface PhoneNumber {
    type: string;
    number: string;
}

export interface Profile {
    _id: Schema.Types.ObjectId | string;
    firstName?: string;
    lastName?: string;
    occupation?: string;
    publicIdentifier?: string;
    linkedinId?: number;
    memberId?: string;
    salesMemberId?: string;
    profilePicture?: string;
    influencer?: boolean;
    jobSeeker?: boolean;
    openLink?: boolean;
    premium?: boolean;
    profileUrl?: string;
    region?: string;
    company?: {
        name?: string;
        linkedinUrl?: string;
        website?: string;
    };
    birthday?: {
        month: number;
        day: number;
    };
    address?: string;
    email?: string;
    phoneNumbers?: PhoneNumber[];
    dropContactEnrichment?: DropContactInterface;
}

export interface ProspectCustomProfile {
    firstName?: string;
    lastName?: string;
    occupation?: string;
    company?: {
        name?: string;
        linkedinUrl?: string;
        website?: string;
    };
    email?: string;
    phoneNumbers?: Array<PhoneNumber>;
    region?: string;
    birthday?: Birthday;
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

export interface Prospect<P = Profile> {
    _id: Schema.Types.ObjectId | string;
    profile: P;
    customProfile?: ProspectCustomProfile;
    user?: Schema.Types.ObjectId | string;
    prospectList?: Schema.Types.ObjectId | string | ProspectList;
    distance?: 'DISTANCE_1' | 'DISTANCE_2' | 'DISTANCE_3' | 'OUT_OF_NETWORK';
    status?: 'connected' | 'pending' | 'not_connected';
    connectedAt?: number;
    customData?: { [key: string]: string };
    oneToOneConversationId?: string;
    isRepliedMonitored?: boolean;
    isSeenMonitored?: boolean;
    history?: Array<HistoryItem>;
    hasBeenEnriched?: boolean;
    contactEmail?: string;
    tags?: Array<Schema.Types.ObjectId | string | Tag | Omit<Tag, '_id'>>;
    origin?: Origin;
}
