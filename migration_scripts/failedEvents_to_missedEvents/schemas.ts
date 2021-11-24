import mongoose, { Connection } from 'mongoose';
import { DistributedEventSchema } from '../../back/services/otto/src/entities/DistributedEvent/persistance/DistributedEvent.model';
import { serviceNames } from '../../back/services/otto/src/helpers/serviceNames';
import { IFailedEvent } from '../../back/services/otto/src/entities/FailedEvent/persistance/FailedEvent.interfaces';
import { IMissedEvent } from '../../back/services/otto/src/entities/MissedEvent/persistance/MissedEvent.interfaces';

const FailedEventSchema = new mongoose.Schema(
    {
        event: { type: DistributedEventSchema, required: true },
        service: {
            type: String,
            enum: serviceNames,
            required: true,
        },
        status: { type: String, enum: ['waiting', 'success'], required: true },
        reason: { type: String, required: true },
    },
    { timestamps: true },
);

export const FailedEventModel = (c: Connection) => c.model<IFailedEvent & mongoose.Document>('FailedEvent', FailedEventSchema);

const MissedEventSchema = new mongoose.Schema(
    {
        event: { type: DistributedEventSchema, required: true },
        service: {
            type: String,
            enum: serviceNames,
            required: true,
        },
        reason: { type: String, required: true },
    },
    { timestamps: true },
);

export const MissedEventModel = (c: Connection) => c.model<IMissedEvent & mongoose.Document>('MissedEvent', MissedEventSchema);