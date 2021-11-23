export type Badge = { name: string; _id: string };

export type Waypoint = any;

export type Path = any;

export type AllPossibleWaypointsType = any;

export declare type IWorldTemplate = {
    name: string;
    description: string;
    shortDescription: string;
    image: string;
    complexity: number;
    badges: Array<Badge>;
    relatedTemplates: Array<string>;
    tags: Array<string>;
    startingPoint: Waypoint;
    waypoints: Array<Waypoint>;
    paths: Array<Path>;
    waypointCounts: Array<{ type: AllPossibleWaypointsType; count: number }>;
    canQuickLaunch?: boolean;
    shortName?: string;
    icon?: string;
    priorityQuickLaunch?: number;
} & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};
