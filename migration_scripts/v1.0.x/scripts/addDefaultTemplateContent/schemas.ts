import { Connection, Document, Schema } from 'mongoose';
import { IDefaultTemplateContent } from './interfaces';

const DefaultTemplateContentSchema = new Schema(
    {
        language: { type: String, required: true },
        noteContentValues: {
            name: { type: String, required: true },
            noteContent: { type: String, required: true },
        },
        messageContentValues: {
            name: { type: String, required: true },
            messageContent: { type: String, required: true },
        },
    },
    { timestamps: true },
);

export const DefaultTemplateContentModel = (c: Connection) =>
    c.model<IDefaultTemplateContent & Document>('DefaultTemplateContent', DefaultTemplateContentSchema);
