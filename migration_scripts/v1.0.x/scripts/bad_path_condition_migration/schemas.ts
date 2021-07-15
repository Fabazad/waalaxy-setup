import mongoose, { Connection, Document } from 'mongoose';
import { IWorld } from './interfaces';

const waypoint = new mongoose.Schema(
    {
        id: { type: String, required: true },
        type: { type: String, required: true },
        params: {},
    },
    { _id: false },
);

const path = new mongoose.Schema(
    {
        id: { type: String, required: true },
        to: { type: String, required: true },
        from: { type: String, required: true },
        condition: {},
    },
    { _id: false },
);

const WorldSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        userId: { type: String, required: true },
        startingPoint: waypoint,
        waypoints: {
            type: [waypoint],
            required: true,
        },
        paths: {
            type: [path],
            required: true,
        },
        complexity: { type: Number, required: true },
        tags: { type: [String], required: true },
    },
    { timestamps: true },
);

export const WorldModel = (c: Connection) => c.model<IWorld & Document>('World', WorldSchema);
