import * as mongoose from 'mongoose';
export declare type AllPossibleConditions = PossibleConditions | LinkedinSpecificOutboundConditions | MiscellaneaousSpecificOutboundConditions;
export declare type MiscellaneaousSpecificOutboundConditionsMap = RemoveUndefined<SpecificConditionsMap<MiscellaneaousWaypointsDictionnary>>;
export declare type LinkedinPossibleWaypoints = Pick<LinkedinWaypointsDictionnary[keyof LinkedinWaypointsDictionnary], 'type' | 'params'>;
export declare type LinkedinSpecificOutboundConditionsMap = RemoveUndefined<SpecificConditionsMap<LinkedinWaypointsDictionnary>>;
export declare type LinkedinSpecificOutboundConditions = LinkedinSpecificOutboundConditionsMap[keyof LinkedinSpecificOutboundConditionsMap];
export declare type PossibleConditions = ConditionsDictionnary[keyof ConditionsDictionnary];
export declare type MiscellaneaousSpecificOutboundConditions =
    MiscellaneaousSpecificOutboundConditionsMap[keyof MiscellaneaousSpecificOutboundConditionsMap];
export declare type RemoveUndefined<T> = T extends undefined ? never : T;
export declare type SpecificConditionsMap<
    Dictionnary extends {
        [key: string]: {
            specificConditions?: {
                [key: string]: {
                    params: any;
                };
            };
        };
    },
> = Dictionnary[keyof Dictionnary]['specificConditions'];

export declare type ConditionsDictionnary = {
    default: {
        type: 'default';
        params: undefined;
    };
    sleep: {
        type: 'sleep';
        params: {
            time: number;
        };
    };
    isConnected: {
        type: 'isConnected';
        params: undefined;
    };
    isPending: {
        type: 'isPending';
        params: undefined;
    };
    isNotConnected: {
        type: 'isNotConnected';
        params: undefined;
    };
    hasEmail: {
        type: 'hasEmail';
        params: undefined;
    };
    hasNoEmail: {
        type: 'hasNoEmail';
        params: undefined;
    };
};
export declare type LinkedinWaypointsDictionnary = {
    followLinkedin: {
        type: 'followLinkedin';
        params: undefined;
        specificConditions: undefined;
    };
    messageLinkedin: {
        type: 'messageLinkedin';
        params: {
            message: string;
            contentReference?: string;
        };
        specificConditions: {
            wasSeen: {
                type: 'wasSeen';
                params: undefined;
            };
            wasNotSeen: {
                type: 'wasNotSeen';
                params: undefined;
            };
            wasReplied: {
                type: 'wasReplied';
                params: undefined;
            };
            wasNotReplied: {
                type: 'wasNotReplied';
                params: undefined;
            };
        };
    };
    visitLinkedin: {
        type: 'visitLinkedin';
        params: undefined;
        specificConditions: undefined;
    };
    connectLinkedin: {
        type: 'connectLinkedin';
        params: {
            message?: string;
            contentReference?: string;
        };
        specificConditions: undefined;
    };
};
export declare type MiscellaneaousWaypointsDictionnary = {
    webhook: {
        type: 'webhook';
        params: {
            endpoint: string;
        };
        specificConditions: undefined;
    };
    enrichment: {
        type: 'enrichment';
        params: undefined;
        specificConditions: undefined;
    };
    entry: {
        type: 'entry';
        params: undefined;
        specificConditions: undefined;
    };
    goal: {
        type: 'goal';
        params: undefined;
        specificConditions: undefined;
    };
    failed: {
        type: 'failed';
        params: undefined;
        specificConditions: undefined;
    };
    end: {
        type: 'end';
        params: undefined;
        specificConditions: undefined;
    };
    sleep: {
        type: 'sleep';
        params: {
            time: number;
        };
        specificConditions: undefined;
    };
    email: {
        type: 'email';
        params: {
            provider: {
                providerId: string;
                providerType: string;
            };
            contentReference: string;
        };
        specificConditions: {
            emailWasReplied: {
                type: 'emailWasReplied';
                params: undefined;
            };
            emailWasNotReplied: {
                type: 'emailWasNotReplied';
                params: undefined;
            };
        };
    };
};

export declare type AllPossibleWaypoints =
    | Pick<LinkedinWaypointsDictionnary[keyof LinkedinWaypointsDictionnary], 'type' | 'params'>
    | Pick<MiscellaneaousWaypointsDictionnary[keyof MiscellaneaousWaypointsDictionnary], 'type' | 'params'>;
export declare type InstanciatedWaypoint<AllPossibleWaypoints> = AllPossibleWaypoints & {
    id: string;
};
export interface Path<PossibleConditions> {
    id: string;
    to: string;
    from: string;
    condition: BooleanExpression<PossibleConditions>;
}
export declare type IWorld = {
    name: string;
    userId: string;
    startingPoint: InstanciatedWaypoint<AllPossibleWaypoints>;
    waypoints: Array<InstanciatedWaypoint<AllPossibleWaypoints>>;
    paths: Array<Path<AllPossibleConditions>>;
    complexity: number;
    tags: Array<string>;
} & {
    _id: mongoose.Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};
export declare type BooleanExpression<Entity> = ComplexBooleanExpression<Entity> | AtomicBooleanExpression<Entity>;

export declare type ComplexBooleanExpression<Entity> = {
    id: string;
    isAtomic: false;
    comparator: 'AND' | 'OR';
    leftOperand: BooleanExpression<Entity>;
    rightOperand: BooleanExpression<Entity>;
};
export declare type AtomicBooleanExpression<Entity> = {
    id: string;
    isAtomic: true;
    entity: Entity;
};

export declare type ConditionSearch = Partial<ConditionsDictionnary[keyof ConditionsDictionnary]>;
export declare type ConditionReplace = ConditionsDictionnary[keyof ConditionsDictionnary];
