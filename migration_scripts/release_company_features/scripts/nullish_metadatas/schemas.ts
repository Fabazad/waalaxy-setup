import { Connection, Document, Schema } from 'mongoose';
import { Metadata } from './types';

// Goulag

const MetadataSchema = new Schema(
    {
        user: String,
        latestRecordedConnectionTime: String,
        latestMonitoredConversationTime: String,
        firstProspectCreatedDate: {
            type: String,
            required: false,
            default: undefined,
        },
    },
    { timestamps: true },
);

export const MetadataModel = (c: Connection) => c.model<Metadata & Document>('Metadata', MetadataSchema);
