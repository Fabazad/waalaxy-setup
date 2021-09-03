import { Schema } from 'mongoose';
import { AllPossibleWaypointsType } from '@waapi/zeus';

export declare type IWorldTemplate = {
    name: string;
    description: string;
    shortDescription: string;
    image: string;
    complexity: number;
    badges: Array<{ name: string }>;
    relatedTemplates: Array<string>;
    tags: Array<string>;
    startingPoint: { id: string; type: string; params?: Record<string, string> };
    waypoints: Array<{ id: string; type: string; params?: Record<string, string> }>;
    paths: Array<{ id: string; to: string; from: string; condition: Record<string, string> }>;
    waypointCounts: Array<{ type: AllPossibleWaypointsType; count: number }>;
} & {
    _id: Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};
