import { SubWorldTypes } from './interfaces';

export const CAMPAIGN_STATES = ['paused', 'running', 'stopped'] as const;
export const BASE_CAMPAIGN_PRIORITY = 5;

export const TRAVELER_STATUSES = ['traveling', 'paused', 'stopped', 'hasReplied', 'error', 'finished'] as const;

export const SUBWORLD_TYPES: SubWorldTypes[] = ['onReply'];
