import { Connection, Document, Schema } from 'mongoose';
import { IVoltaireContent, IVoltaireMetadata } from './interfaces';

const VoltaireContentSchema = new Schema(
    {
        type: { type: String, required: true },
        user: { type: String, required: true },
    },
    { timestamps: true },
);

const VoltaireMetadataSchema = new Schema(
    {
        user: { type: String, required: true },
        firstLinkedinMessageTemplateCreatedAt: { type: Date },
        firstLinkedinConnectTemplateCreatedAt: { type: Date },
        firstEmailTemplateCreatedAt: { type: Date },
    },
    { timestamps: true },
);

export const VoltaireContentModel = (c: Connection) => c.model<IVoltaireContent & Document>('Content', VoltaireContentSchema);

export const VoltaireMetadataModel = (c: Connection) => c.model<IVoltaireMetadata & Document>('Metadata', VoltaireMetadataSchema);
