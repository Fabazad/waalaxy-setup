import { Connection, Document, Schema } from 'mongoose';
import { actionTypes, IQuota } from './interfaces';

const QuotaSchema = new Schema(
    {
        user: { type: String, required: true },
        type: { type: String, enum: actionTypes, required: true },
        value: { type: Number, required: true },
        customMaxValue: { type: Number, required: false },
        hasCustomMaxValueBeenAppliedOnce: { type: Boolean, required: false },
    },
    { timestamps: true },
);

export const QuotaModel = (c: Connection) => c.model<IQuota & Document>('Quota', QuotaSchema);
