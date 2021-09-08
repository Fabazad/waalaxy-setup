export const ACTION_TYPES = {
    FOLLOW_LINKEDIN: 'followLinkedin',
    MESSAGE_LINKEDIN: 'messageLinkedin',
    VISIT_LINKEDIN: 'visitLinkedin',
    CONNECT_LINKEDIN: 'connectLinkedin',
} as const;
export const actionTypes = Object.values(ACTION_TYPES);
export type ActionType = typeof actionTypes[number];

export declare type IQuota = {
    user: string;
    type: ActionType;
    value: number;
};

export type UpdateOne = { updateOne: { upsert: true; filter: Record<string, unknown>; update: { $set: { value: number } } } };
