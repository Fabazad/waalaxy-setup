import { Connection, Document, Schema } from 'mongoose';
import { IWorldTemplate } from './interfaces';

const OldWorldTemplateSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        shortDescription: { type: String, required: true },
        image: { type: String, required: true },
        complexity: { type: Number, required: true },
        relatedTemplates: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'WorldTemplate',
                    required: true,
                },
            ],
            required: true,
        },
        badges: {
            type: [
                {
                    name: { type: String, required: true },
                },
            ],
            required: true,
        },
        tags: { type: [{ type: String, required: true }], required: true },
        startingPoint: {
            id: { type: String, required: true },
            type: { type: String, required: true },
            params: {},
        },
        waypoints: {
            type: [
                {
                    id: { type: String, required: true },
                    type: { type: String, required: true },
                    params: {},
                },
            ],
            required: true,
        },
        paths: {
            type: [
                {
                    id: { type: String, required: true },
                    to: { type: String, required: true },
                    from: { type: String, required: true },
                    condition: {},
                },
            ],
            required: true,
        },
    },
    { timestamps: true },
);

export const OldWorldTemplateModel = (c: Connection) =>
    c.model<IWorldTemplate & Document>('OldWorldTemplate', OldWorldTemplateSchema, 'worldtemplates');

const NewWorldTemplateSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        shortDescription: { type: String, required: true },
        image: { type: String, required: true },
        complexity: { type: Number, required: true },
        relatedTemplates: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'WorldTemplate',
                    required: true,
                },
            ],
            required: true,
        },
        badges: {
            type: [
                {
                    name: { type: String, required: true },
                },
            ],
            required: true,
        },
        tags: { type: [{ type: String, required: true }], required: true },
        startingPoint: {
            id: { type: String, required: true },
            type: { type: String, required: true },
            params: {},
        },
        waypoints: {
            type: [
                {
                    id: { type: String, required: true },
                    type: { type: String, required: true },
                    params: {},
                },
            ],
            required: true,
        },
        paths: {
            type: [
                {
                    id: { type: String, required: true },
                    to: { type: String, required: true },
                    from: { type: String, required: true },
                    condition: {},
                },
            ],
            required: true,
        },
        waypointCounts: {
            type: [
                {
                    type: { type: String, required: true },
                    count: { type: Number, required: true, min: 0 },
                },
            ],
            _id: false,
            required: true,
        },
    },
    { timestamps: true },
);

export const NewWorldTemplateModel = (c: Connection) =>
    c.model<IWorldTemplate & Document>('NewWorldTemplate', NewWorldTemplateSchema, 'worldtemplates');
