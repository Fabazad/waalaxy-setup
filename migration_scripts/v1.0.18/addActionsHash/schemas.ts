import { actionStatuses, actionTypes, scheduleDays, IAction } from './interfaces';
import { Document, Schema, Connection, Model, SchemaDefinition } from 'mongoose';

export type ActionModel = Model<IAction & Document>;

export const getActionSchemaDefinition = (): SchemaDefinition => {
    const actionParams = new Schema({
        message: { type: String, required: false },
        contentReference: { type: String, required: false },
        note: { type: String, required: false },
        prospectHasEmail: { type: Boolean, required: false },
    });

    const actionResult = new Schema({
        messageId: { type: String, required: false },
    });
    return {
        hash: { type: String, required: true },
        type: { type: String, enum: actionTypes, required: true },
        user: { type: String, required: true },
        priority: { type: Number, required: true },
        prospect: { type: String, required: true },
        position: { type: Number, required: false },
        scheduleDay: {
            type: String,
            enum: scheduleDays,
            required: false,
        },
        status: {
            type: String,
            enum: actionStatuses,
            required: true,
        },
        statusCode: { type: Number, required: false },
        failReason: { required: false },
        wasMovedByUser: { type: Boolean },
        campaign: { type: String, required: true },
        nextTry: { type: Date, required: false },
        executionDate: { type: Date, required: false },
        deliveredDate: { type: Date, required: false },
        params: {
            type: actionParams,
            required: false,
        },
        result: {
            type: actionResult,
            required: false,
        },
        metadata: {},
    };
};

const ActionSchema = new Schema(getActionSchemaDefinition());

export const ActionModel = (c: Connection): ActionModel => c.model('Action', ActionSchema);
