export declare type IConnectStat = { user: string; action: string; date: string; campaign: string; status: 'sent' | 'accepted' } & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export declare type IEmailStat = { user: string; emailId: string; action?: string; date: string; campaign: string; status: 'sent' } & {
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
