import mongoose from 'mongoose';

export type PlanName = 'freemium' | 'staff' | 'pro' | 'advanced' | 'business';

export type PermissionGroupName =
    | 'freemium_role'
    | 'staff_role'
    | 'pro_role'
    | 'advanced_role'
    | 'business_role'
    | 'category_tags'
    | 'company_owner_role';

export type Periodicity = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifeTime';

export type MetadataType = 'resume_free_trial' | 'new_free_trial';

/* eslint-disable camelcase */
export enum PermissionNameEnum {
    reach_crm = 'reach_crm',
    execute_actions = 'execute_actions',
    execute_triggers = 'execute_triggers',
    check_for_new_connections = 'check_for_new_connections',
    monitor_conversations = 'monitor_conversations',
    monitor_emails = 'monitor_emails',
    send_emails = 'send_emails',
    create_world_templates = 'create_world_templates',
    contact_distant_extension = 'contact_distant_extension',
    login_as = 'login_as',
    crm_export = 'crm_export',
    enrich_prospect = 'enrich_prospect',
    create_campaign = 'create_campaign',
    edit_campaign = 'edit_campaign',
    pause_play_campaign = 'pause_play_campaign',
    execute_webhook_action = 'execute_webhook_action',
    add_prospect_batch = 'add_prospect_batch',
    create_company = 'create_company',
    see_company_members = 'see_company_members',
    manage_company_members = 'manage_company_members',
    manage_duplicates = 'manage_duplicates',
    import_duplicates = 'import_duplicates',
    manage_company_permissions = 'manage_company_permissions',
}

export type PermissionName = keyof typeof PermissionNameEnum;

export type SequenceComplexityPermission = {
    name: 'sequence_complexity';
    params: { values: Array<number> };
};

export type SequenceTagPermission = {
    name: 'sequence_tag';
    params: { tags: Array<string> };
};

export type ImpersonatePermission = {
    name: 'impersonate';
    params: { users: Array<string> | 'all' };
};

export type ImportInCRMPermission = {
    name: 'import_in_crm';
    params: { users: Array<string> | 'all' };
};

export type CompanyPermission = ImportInCRMPermission | ImpersonatePermission;

export type LinkedPermission = SequenceComplexityPermission | SequenceTagPermission | CompanyPermission;

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
