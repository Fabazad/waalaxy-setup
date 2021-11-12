import * as mongoose from 'mongoose';

// Stargate

export declare type IUser = {
    firstName: string;
    lastName: string;
    occupation: string | null;
    publicIdentifier: string;
    memberId: string;
    linkedinId: string;
    profilePicture?: string;
    birthday?: { month: number; day: number };
    address?: string;
    email: string | null;
    emailContact?: string;
    phoneNumbers?: Array<{ type: string; number: string }>;
    language: string;
    isTestUser?: boolean;
    origins: Array<{ date: string; content: string }>;
    waapiId?: string;
    extensionState?: {
        isInstalled: boolean;
        dateUninstall?: Date | null;
    };
    hasBypass?: boolean;
    freeTrial?: {
        startDate: Date;
        endDate: Date;
    };
} & {
    _id: mongoose.Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};

// Bouncer

export type PlanName = 'freemium' | 'staff' | 'pro' | 'advanced' | 'business';

export type PermissionGroupName = 'freemium_role' | 'staff_role' | 'pro_role' | 'advanced_role' | 'business_role' | 'category_tags';

export type Periodicity = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifeTime';

export type MetadataType = 'resume_free_trial' | 'new_free_trial';

export type PermissionName =
    | 'reach_crm'
    | 'execute_actions'
    | 'execute_triggers'
    | 'check_for_new_connections'
    | 'monitor_conversations'
    | 'monitor_emails'
    | 'send_emails'
    | 'create_world_templates'
    | 'contact_distant_extension'
    | 'login_as'
    | 'crm_export'
    | 'enrich_prospect'
    | 'create_campaign'
    | 'edit_campaign'
    | 'pause_play_campaign'
    | 'execute_webhook_action'
    | 'add_prospect_batch'
    | 'create_company';

export type SequenceComplexityPermission = {
    name: 'sequence_complexity';
    params: { values: Array<number> };
};

export type SequenceTagPermission = {
    name: 'sequence_tag';
    params: { tags: Array<string> };
};

export type LinkedPermission = SequenceComplexityPermission | SequenceTagPermission;

export interface Plan<PlanName extends string> {
    name: PlanName;
    expirationDate: string | null;
    startDate: string;
    periodicity: Periodicity;
}

export interface MetadataPermission {
    date: Date;
    type: MetadataType;
}

export type IPermission<PermissionName> =
    | {
          name: PermissionName;
      }
    | LinkedPermission;

export interface IPermissionGroup<PermGroupName = PermissionGroupName> {
    name: PermGroupName;
}

export type Trial<GPlanName extends string = PlanName> = {
    planName: GPlanName;
    startDate: string;
    expirationDate: string;
};

export declare type IUserPermission<PermissionName extends string, PermissionGroupName extends string, PlanName extends string> = {
    user: string;
    waapiId: string;
    paymentWaapiId: string;
    permissions: {
        included: Array<IPermissionGroup<PermissionGroupName> | IPermission<PermissionName>>;
        excluded: Array<IPermissionGroup<PermissionGroupName> | IPermission<PermissionName>>;
    };
    metadatas?: Array<MetadataPermission>;
    plan: Plan<PlanName>;
    trial: Trial<PlanName> | null;
    hasPaidAtLeastOnce?: boolean;
    subscriptionState?: {
        isActive?: boolean;
        stoppedAt?: string;
    };
    company?: {
        _id: mongoose.Schema.Types.ObjectId | string;
        plan: Plan<PlanName>;
        isOwner: boolean;
    };
} & {
    _id: mongoose.Schema.Types.ObjectId | string;
    createdAt?: string;
    updatedAt?: string;
};

export const SEAT_STATUSES = {
    EMPTY: 'EMPTY',
    PENDING: 'PENDING',
    USED: 'USED',
} as const;
export const seatStatuses = Object.values(SEAT_STATUSES);
export type SeatStatuses = typeof seatStatuses[number];

export const EMPTY_SEAT_STATUSES = {
    [SEAT_STATUSES.EMPTY]: SEAT_STATUSES.EMPTY,
};
export const emptySeatStatuses = Object.values(EMPTY_SEAT_STATUSES);
export type EmptySeatStatuses = typeof emptySeatStatuses[number];

export const USED_SEAT_STATUSES = {
    [SEAT_STATUSES.PENDING]: SEAT_STATUSES.PENDING,
    [SEAT_STATUSES.USED]: SEAT_STATUSES.USED,
};
export const usedSeatStatuses = Object.values(USED_SEAT_STATUSES);
export type UsedSeatStatuses = typeof usedSeatStatuses[number];

export declare type EmptySeat = {
    status: EmptySeatStatuses;
};

export declare type UsedSeat = {
    status: UsedSeatStatuses;
    user: string;
};

export declare type BaseSeat = {
    _id: mongoose.Schema.Types.ObjectId | string;
    plan: Plan<PlanName>;
};

export declare type Seat = BaseSeat & (EmptySeat | UsedSeat);

export declare type ICompany = {
    name: string;
    owner: string;
    seats: Array<Seat>;
} & {
    _id: mongoose.Schema.Types.ObjectId | string;
    createdAt?: string;
    updatedAt?: string;
};

// Goulag

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
    _id: mongoose.Schema.Types.ObjectId | string;
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

export interface Birthday {
    day?: string;
    month?: string;
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
    phoneNumbers?: Profile['phoneNumbers'];
    region?: string;
    birthday?: Birthday;
}

export interface ProspectList {
    _id: mongoose.Schema.Types.ObjectId | string;
    name: string;
    user: mongoose.Schema.Types.ObjectId | string;
}

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

export type Tag = any;

export type Origin = any;

export interface Prospect<P = Profile> {
    _id: mongoose.Schema.Types.ObjectId | string;
    profile: P;
    customProfile?: ProspectCustomProfile;
    user?: mongoose.Schema.Types.ObjectId | string;
    prospectList?: mongoose.Schema.Types.ObjectId | string | ProspectList;
    distance?: 'DISTANCE_1' | 'DISTANCE_2' | 'DISTANCE_3' | 'OUT_OF_NETWORK' | 'DISTANCE_-1';
    status?: 'connected' | 'pending' | 'not_connected' | 'unknown';
    connectedAt?: number;
    customData?: { [key: string]: string };
    oneToOneConversationId?: string;
    isRepliedMonitored?: boolean;
    isSeenMonitored?: boolean;
    history?: Array<HistoryItem>;
    hasBeenEnriched?: boolean;
    contactEmail?: string;
    tags?: Array<mongoose.Schema.Types.ObjectId | string | Tag | Omit<Tag, '_id'>>;
    origin?: Origin;
    countTryFetchStatus?: number;
}

export interface UsersRegroupment {
    _id: mongoose.Schema.Types.ObjectId | string;
    users: Array<string>;
    company?: string;
}

export interface DuplicatedProspect {
    _id: mongoose.Schema.Types.ObjectId | string;
    profile: Profile;
    prospects: Array<{ user: string; _id: mongoose.Schema.Types.ObjectId | string }>;
}

export interface IProspectList {
    _id: mongoose.Types.ObjectId;
    name: string;
    user: mongoose.Types.ObjectId;
}
