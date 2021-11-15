import { Connection, Document, Schema } from 'mongoose';
import { IContent } from './interfaces';

const ContentSchema = new Schema(
    {
        name: { type: String, required: true },
        channel: { type: String, required: true },
        type: { type: String, required: true },
        user: { type: String, required: true },
        params: {
            noteContent: { type: String, required: false },
            messageContent: { type: String, required: false },
            emailSubject: { type: String, required: false },
            emailContent: { type: String, required: false },
        },
    },
    { timestamps: true },
);

export const ContentModel = (c: Connection) => c.model<IContent & Document>('Content', ContentSchema);
