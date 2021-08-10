import { Connection, Document, Schema } from 'mongoose';
import { ICorrectProspectList, IInvalidProspectList } from './interfaces';

const InvalidProspectListSchema = new Schema(
    {
        user: Schema.Types.Mixed,
        name: String,
        expiresAt: { type: Date, index: { expires: 0 } },
    },
    { timestamps: true },
);

const CorrectProspectListSchema = new Schema(
    {
        user: String,
        name: String,
        expiresAt: { type: Date, index: { expires: 0 } },
    },
    { timestamps: true },
);

export const CorrectProspectListModel = (c: Connection) =>
    c.model<ICorrectProspectList & Document>('ProspectList', CorrectProspectListSchema, 'prospectlists');

export const InvalidProspectListModel = (c: Connection) =>
    c.model<IInvalidProspectList & Document>('ProspectList', InvalidProspectListSchema, 'prospectlists');
