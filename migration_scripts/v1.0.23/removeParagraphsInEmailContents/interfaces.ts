export declare type IContent = PossibleContents & {
    _id: string;
    name: string;
    user: string;
    createdAt?: string;
    updatedAt?: string;
};

export type PossibleContents = LinkedinMessageContent | LinkedinConnectContent | MailContent;

export type LinkedinMessageContent = {
    channel: 'linkedin';
    type: 'message';
    params: {
        messageContent: string;
    };
};

export type LinkedinConnectContent = {
    channel: 'linkedin';
    type: 'connect';
    params: {
        noteContent: string;
    };
};

export type MailContent = {
    channel: 'email';
    type: 'email';
    params: {
        emailSubject: string;
        emailContent: string;
    };
};
