import * as mongoose from 'mongoose';

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
export type PermissionGroupName = 'freemium_role' | 'staff_role' | 'pro_role' | 'advanced_role' | 'business_role' | 'category_tags';

interface BaseSeat {
    plan: string;
    periodicity: Periodicity;
    startDate: string;
    expirationDate: string;
}

type AvailableSeat = BaseSeat & {
    status: 'available';
};

type TakenSeat = BaseSeat & {
    user: string;
    status: 'accepted' | 'pending';
};

type Seat = AvailableSeat | TakenSeat;

type BasePermission<PermName> = PermName;

export type SequenceComplexityPermission = {
    name: 'sequence_complexity';
    params: { values: Array<number> };
};

export type SequenceTagPermission = {
    name: 'sequence_tag';
    params: { tags: Array<string> };
};

export type LinkedPermission = SequenceComplexityPermission | SequenceTagPermission;

export type Permission<PermissionName> = BasePermission<PermissionName> | LinkedPermission;

export type Periodicity = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifeTime';

export interface Plan<PlanName extends string> {
    name: PlanName;
    expirationDate: string | null;
    startDate: string;
    periodicity: Periodicity;
}

export type PlanName = 'freemium' | 'staff' | 'pro' | 'advanced' | 'business';

export interface IPermissionGroup<PermGroupName = PermissionGroupName> {
    name: PermGroupName;
}

export type IPermission<PermissionName> =
    | {
          name: PermissionName;
      }
    | LinkedPermission;

export type Trial<GPlanName extends string = PlanName> = {
    planName: GPlanName;
    startDate: string;
    expirationDate: string;
};

export type ProductNickname =
    | 'waalaxy_monthly_pro'
    | 'waalaxy_quarterly_pro'
    | 'waalaxy_yearly_pro'
    | 'waalaxy_monthly_advanced'
    | 'waalaxy_quarterly_advanced'
    | 'waalaxy_yearly_advanced'
    | 'waalaxy_monthly_business'
    | 'waalaxy_quarterly_business'
    | 'waalaxy_yearly_business'
    | 'waalaxy_monthly_pro_old'
    | 'waalaxy_quarterly_pro_old'
    | 'waalaxy_yearly_pro_old'
    | 'waalaxy_monthly_advanced_old'
    | 'waalaxy_quarterly_advanced_old'
    | 'waalaxy_yearly_advanced_old'
    | 'waalaxy_monthly_pro_old_2'
    | 'waalaxy_quarterly_pro_old_2'
    | 'waalaxy_yearly_pro_old_2'
    | 'waalaxy_monthly_advanced_old_2'
    | 'waalaxy_quarterly_advanced_old_2'
    | 'waalaxy_yearly_advanced_old_2';

export interface Product {
    id: string;
    nickname: ProductNickname;
    planName: PlanName;
    periodicity: Periodicity;
    mostPopular: boolean;
    monthlyPrice: number;
    saving: number;
    priority: number;
    display: boolean;
}

export type UserStargateData = {
    firstName: string;
    lastName: string;
    occupation: string;
    publicIdentifier: string;
    memberId: string;
    profilePicture?: string;
    birthday?: { month: number; day: number };
    address?: string;
    email: string | null;
    phoneNumbers?: Array<{ type: string; number: string }>;
    language: string;
    linkedinId: string;
    isTestUser: boolean;
    origins: Array<{ date: string; content: string }>;
};

export declare type IUserPermission<PermissionName extends string, PermissionGroupName extends string, PlanName extends string> = {
    user: string;
    waapiId: string;
    permissions: {
        included: Array<IPermissionGroup<PermissionGroupName> | IPermission<PermissionName>>;
        excluded: Array<IPermissionGroup<PermissionGroupName> | IPermission<PermissionName>>;
    };
    company?: string;
    plan: Plan<PlanName>;
    trial: Trial<PlanName> | null;
    hasPaidAtLeastOnce?: boolean;
    subscriptionState?: {
        isActive?: boolean;
        stoppedAt?: string;
    };
    userData: UserStargateData;
} & {
    _id: mongoose.Schema.Types.ObjectId | string;
    createdAt?: string;
    updatedAt?: string;
};
