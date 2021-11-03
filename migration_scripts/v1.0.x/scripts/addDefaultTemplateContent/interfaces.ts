export declare type IDefaultTemplateContent = ContentTemplateDefault & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export type IDefaultTemplateContentCreationData = Omit<IDefaultTemplateContent, '_id' | 'createdAt' | 'updatedAt'>;

export interface ContentTemplateDefault {
    language: string;
    noteContentValues: {
        name: string;
        noteContent: string;
    };
    messageContentValues: {
        name: string;
        messageContent: string;
    };
}
