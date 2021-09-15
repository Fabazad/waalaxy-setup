import * as mongoose from 'mongoose';
import { Stop } from '../../back/services/profesor/src/entities/Traveler/subEntities/Stop/interfaces';
import { HistoryItem } from '../../back/services/profesor/src/entities/Traveler/subEntities/ItemHistory/interfaces';
import { TravelStatesItem } from '../../back/services/profesor/src/entities/Traveler/subEntities/TravelStatesItem/interfaces';

export const TRAVELER_STATUSES = ['traveling', 'paused', 'stopped', 'hasReplied', 'error', 'finished'] as const;

export type TravelerStatus = { value: typeof TRAVELER_STATUSES[number]; reason?: string };
export const MONITORED_EMAIL_STATUSES = {
    MONITORED: 'monitored',
    REPLIED: 'replied',
    BOUNCED: 'bounced',
} as const;
export const monitoredEmailStatuses = Object.values(MONITORED_EMAIL_STATUSES);
export type MonitoredEmailStatuses = typeof monitoredEmailStatuses[number];

export declare type IMonitoredEmail = {
    status: MonitoredEmailStatuses;
    emailId: string;
    sentAt: Date;
    to: string;
    providerId: string;
    providerType: 'SMTP' | 'OAuth2';
    prospect: string;
    user: string;
} & {
    _id: mongoose.Schema.Types.ObjectId | string;
    createdAt?: string;
    updatedAt?: string;
};

export declare type ITraveler<
    A = mongoose.Schema.Types.ObjectId,
    B = mongoose.Schema.Types.ObjectId,
    C = mongoose.Schema.Types.ObjectId,
    D = string
    > = {
    campaign: A;
    world: B;
    origin: C;
    user: string;
    prospect: D;
    currentStop?: Stop;
    status: TravelerStatus;
    history: Array<HistoryItem>;
    travelStates: Array<TravelStatesItem<B>>;
} & {
    _id: mongoose.Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};