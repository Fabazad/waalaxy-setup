import { Schema } from 'mongoose';

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
    isPremiumSubscriber?: boolean;
} & {
    _id: Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};

export declare type IOldProspectList = {
    _id: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
    name: string;
};

export declare type INewProspectList = {
    _id: Schema.Types.ObjectId;
    user: string;
    name: string;
};
