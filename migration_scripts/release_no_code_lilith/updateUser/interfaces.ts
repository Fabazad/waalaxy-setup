import mongoose from 'mongoose';

/**
 * User Lilith
 */
export declare type IUserLilith = {
    user: string;
    firstName: string;
    lastName: string;
    occupation: string | null;
    publicIdentifier: string;
    memberId: string;
    linkedinId: string;
    profilePicture?: string;
    birthday?: { month?: number; day?: number };
    address?: string;
    email: string | null;
    emailContact?: string;
    phoneNumbers?: Array<{ type: string; number: string }>;
    language: string;
    origins: Array<{ date: string; content: string }>;
    hasBypass?: boolean;
    hasExtensionInstalled?: boolean;
    dateExtensionUninstall?: Date | null;
    isPremiumSubscriber?: boolean;
    kpi: { firstProspectCreatedDate?: string; firstLinkedInActionDate?: string; firstMailDate?: string };
    waapiId?: string;
    paymentWaapiId?: string;
    plan?: { name: string; expirationDate: string; startDate: string; periodicity: 'monthly' | 'quarterly' | 'yearly' | 'lifeTime' | 'weekly' };
    trial?: { planName: string; expirationDate: string; startDate: string };
    hasPaidAtLeastOnce: boolean;
    firstPaidAt?: string;
    lastPaidAt?: string;
    subscriptionState?: { isActive?: boolean; stoppedAt?: string };
} & {
    _id: mongoose.Schema.Types.ObjectId | string;
    createdAt?: string;
    updatedAt?: string;
};

/**
 * User Stargate
 */
export declare type IUserStargate = {
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
    isPremiumSubscriber?: boolean;
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

/**
 * UserPermission Bouncer
 */
export type Periodicity = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifeTime';

export interface Plan<PlanName extends string> {
    name: PlanName;
    expirationDate: string | null;
    startDate: string;
    periodicity: Periodicity;
}

export type PlanName = 'freemium' | 'staff' | 'pro' | 'advanced' | 'business';

export type Trial<GPlanName extends string = PlanName> = {
    planName: GPlanName;
    startDate: string;
    expirationDate: string;
};

export declare type IUserBouncer<PN extends string, PGN extends string, PLN extends string> = {
    user: string;
    waapiId: string;
    paymentWaapiId: string;
    plan: Plan<PlanName>;
    trial: Trial<PLN> | null;
    hasPaidAtLeastOnce?: boolean;
    lastPaidAt?: string;
    firstPaidAt?: string;
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

/**
 * Metadata Shiva
 */
export declare type IMetadataShiva = { user: string; firstLinkedInActionDate?: string } & {
    _id: mongoose.Schema.Types.ObjectId | string;
    createdAt?: string;
    updatedAt?: string;
};

/**
 * Metadata Hermes
 */
export declare type IMetadataHermes = { user: string; firstMailDate?: string } & {
    _id: mongoose.Schema.Types.ObjectId | string;
    createdAt?: string;
    updatedAt?: string;
};

/**
 * Metadata Goulag
 */
export declare type IMetadataGoulag = { user: string; firstProspectCreatedDate?: string } & {
    _id: mongoose.Schema.Types.ObjectId | string;
    createdAt?: string;
    updatedAt?: string;
};
