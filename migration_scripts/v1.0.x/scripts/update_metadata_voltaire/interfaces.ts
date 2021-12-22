import { Schema } from 'mongoose';

export interface IVoltaireContent {
    _id: Schema.Types.ObjectId;
    type: 'message' | 'connect' | 'email';
    user: string;
    name: string;
    createdAt?: string;
}

export interface IVoltaireMetadata {
    _id: Schema.Types.ObjectId;
    user: string;
    firstLinkedinMessageTemplateCreatedAt?: string;
    firstLinkedinConnectTemplateCreatedAt?: string;
    firstEmailTemplateCreatedAt?: string;
}
