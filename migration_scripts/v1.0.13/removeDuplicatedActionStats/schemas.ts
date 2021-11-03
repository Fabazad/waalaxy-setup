import { Connection, Document, Model, Schema } from 'mongoose';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { IConnectStat, IEmailStat, IFollowStat, IMessageRequestStat, IMessageStat, IUserKpi, IVisitStat } from './interfaces';

export type ConnectStatModel = Model<IConnectStat & Document>;

let connectStatModel: ConnectStatModel | undefined;

const createConnectStatModel = (c: Connection): ConnectStatModel => {
    const ConnectStatSchema = new Schema(
        {
            user: { type: String, required: true },
            action: { type: String, required: true },
            date: { type: Date, required: true },
            campaign: { type: String, required: true },
            status: { type: String, enum: ['sent', 'accepted'], required: true },
        },
        { timestamps: true },
    )
        .plugin(mongooseLeanGetters)
        .index(
            {
                user: 1,
                action: 1,
                status: 1,
            },
            {
                unique: true,
            },
        );

    return c.model('ConnectStat', ConnectStatSchema);
};

export const getConnectStatModel = (c: Connection) => {
    if (connectStatModel === undefined) connectStatModel = createConnectStatModel(c);
    return connectStatModel;
};

export type EmailStatModel = Model<IEmailStat & Document>;

let emailStatModel: EmailStatModel | undefined;

const createEmailStatModel = (c: Connection): EmailStatModel => {
    const EmailStatSchema = new Schema(
        {
            user: { type: String, required: true },
            emailId: { type: String, required: true },
            action: { type: String, required: false },
            date: { type: Date, required: true },
            campaign: { type: String, required: true },
            status: { type: String, enum: ['sent'], required: true },
        },
        { timestamps: true },
    )
        .plugin(mongooseLeanGetters)
        .index(
            {
                user: 1,
                emailId: 1,
                status: 1,
            },
            {
                unique: true,
            },
        );

    return c.model('EmailStat', EmailStatSchema);
};

export const getEmailStatModel = (c: Connection) => {
    if (emailStatModel === undefined) emailStatModel = createEmailStatModel(c);
    return emailStatModel;
};

export type FollowStatModel = Model<IFollowStat & Document>;

let followStatModel: FollowStatModel | undefined;

const createFollowStatModel = (c: Connection): FollowStatModel => {
    const FollowStatSchema = new Schema(
        {
            user: { type: String, required: true },
            action: { type: String, required: true },
            date: { type: Date, required: true },
            campaign: { type: String, required: true },
            status: { type: String, enum: ['followed'], required: true },
        },
        { timestamps: true },
    )
        .plugin(mongooseLeanGetters)
        .index(
            {
                user: 1,
                action: 1,
                status: 1,
            },
            {
                unique: true,
            },
        );

    return c.model('FollowStat', FollowStatSchema);
};

export const getFollowStatModel = (c: Connection) => {
    if (followStatModel === undefined) followStatModel = createFollowStatModel(c);
    return followStatModel;
};

export type MessageRequestStatModel = Model<IMessageRequestStat & Document>;

let messageRequestStatModel: MessageRequestStatModel | undefined;

const createMessageRequestStatModel = (c: Connection): MessageRequestStatModel => {
    const MessageRequestStatSchema = new Schema(
        {
            user: { type: String, required: true },
            action: { type: String, required: true },
            date: { type: Date, required: true },
            campaign: { type: String, required: true },
            status: { type: String, enum: ['sent', 'replied'], required: true },
        },
        { timestamps: true },
    )
        .plugin(mongooseLeanGetters)
        .index(
            {
                user: 1,
                action: 1,
                status: 1,
            },
            {
                unique: true,
            },
        );

    return c.model('MessageRequestStat', MessageRequestStatSchema);
};

export const getMessageRequestStatModel = (c: Connection) => {
    if (messageRequestStatModel === undefined) messageRequestStatModel = createMessageRequestStatModel(c);
    return messageRequestStatModel;
};

export type MessageStatModel = Model<IMessageStat & Document>;

let messageStatModel: MessageStatModel | undefined;

const createMessageStatModel = (c: Connection): MessageStatModel => {
    const MessageStatSchema = new Schema(
        {
            user: { type: String, required: true },
            action: { type: String, required: true },
            date: { type: Date, required: true },
            campaign: { type: String, required: true },
            status: { type: String, enum: ['sent', 'replied'], required: true },
        },
        { timestamps: true },
    )
        .plugin(mongooseLeanGetters)
        .index(
            {
                user: 1,
                action: 1,
                status: 1,
            },
            {
                unique: true,
            },
        );

    return c.model('MessageStat', MessageStatSchema);
};

export const getMessageStatModel = (c: Connection) => {
    if (messageStatModel === undefined) messageStatModel = createMessageStatModel(c);
    return messageStatModel;
};

export type VisitStatModel = Model<IVisitStat & Document>;

let visitStatModel: VisitStatModel | undefined;

const createVisitStatModel = (c: Connection): VisitStatModel => {
    const VisitStatSchema = new Schema(
        {
            user: { type: String, required: true },
            action: { type: String, required: true },
            date: { type: Date, required: true },
            campaign: { type: String, required: true },
            status: { type: String, enum: ['visited'], required: true },
        },
        { timestamps: true },
    )
        .plugin(mongooseLeanGetters)
        .index(
            {
                user: 1,
                action: 1,
                status: 1,
            },
            {
                unique: true,
            },
        );

    return c.model('VisitStat', VisitStatSchema);
};

export const getVisitStatModel = (c: Connection) => {
    if (visitStatModel === undefined) visitStatModel = createVisitStatModel(c);
    return visitStatModel;
};

export type UserKpiModel = Model<IUserKpi & Document>;

let userKpiModel: UserKpiModel | undefined;

const createUserKpiModel = (c: Connection): UserKpiModel => {
    const UserKpiSchema = new Schema(
        {
            user: { type: String, required: true, unique: true },
            firstProspect: { type: Date, required: false },
            firstLinkedInAction: { type: Date, required: false },
            firstMail: { type: Date, required: false },
        },
        { timestamps: true },
    ).plugin(mongooseLeanGetters);

    return c.model('UserKpi', UserKpiSchema);
};

export const getUserKpiModel = (c: Connection) => {
    if (userKpiModel === undefined) userKpiModel = createUserKpiModel(c);
    return userKpiModel;
};
