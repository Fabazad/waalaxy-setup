export const ACTION_STATUSES = {
    SUCCESS: 'success',
    FAIL: 'fail',
    WAITING: 'waiting',
    DELIVERED: 'delivered',
    RETRY: 'retry',
    FROZEN: 'frozen',
} as const;

export const RESTRICTIONS_TYPES = {
    DESKTOP_CONNECT_RESTRICTED: 'DESKTOP_CONNECT_RESTRICTED',
    MOBILE_CONNECT_RESTRICTED: 'MOBILE_CONNECT_RESTRICTED',
    EMAIL_BATCH_CONNECT_RESTRICTED: 'EMAIL_BATCH_CONNECT_RESTRICTED',
    MESSAGE_REQUEST_RESTRICTED: 'MESSAGE_REQUEST_RESTRICTED',
} as const;

export const SCHEDULE_DAYS = {
    TODAY: 'today',
    ANOTHER_DAY: 'another_day',
} as const;

export const ACTION_TYPES = {
    FOLLOW_LINKEDIN: 'followLinkedin',
    MESSAGE_LINKEDIN: 'messageLinkedin',
    VISIT_LINKEDIN: 'visitLinkedin',
    CONNECT_LINKEDIN: 'connectLinkedin',
    MESSAGE_REQUEST_LINKEDIN: 'messageRequestLinkedin',
} as const;

export const actionTypes = Object.values(ACTION_TYPES);

export const restrictionTypes = Object.values(RESTRICTIONS_TYPES);
export const scheduleDays = Object.values(SCHEDULE_DAYS);
export const actionStatuses = Object.values(ACTION_STATUSES);

export type ActionStatus = typeof actionStatuses[number];

export type ScheduleDay = typeof scheduleDays[number];

export type RestrictionTypes = typeof restrictionTypes[number];

export type ActionParamsUnion =
    | { type: typeof ACTION_TYPES.CONNECT_LINKEDIN; params: { note?: string; contentReference?: string; prospectHasEmail?: boolean } }
    | {
          type: typeof ACTION_TYPES.MESSAGE_LINKEDIN;
          params: { message: string; contentReference?: string };
          result: {
              messageId: string;
          };
      }
    | {
          type: typeof ACTION_TYPES.MESSAGE_REQUEST_LINKEDIN;
          params: { message: string; contentReference?: string };
          result: {
              messageId: string;
          };
      }
    | {
          type: typeof ACTION_TYPES.FOLLOW_LINKEDIN;
          params: undefined;
      }
    | { type: typeof ACTION_TYPES.VISIT_LINKEDIN; params?: undefined };

export type BaseAction = {
    hash: string;
    user: string;
    priority: number;
    prospect: string;
    position?: number;
    scheduleDay?: ScheduleDay;
    status: ActionStatus;
    wasMovedByUser?: boolean;
    campaign: string;
    nextTry?: Date;
    executionDate?: Date;
    statusCode?: number;
    failReason?: unknown;
    deliveredDate?: Date;
    frozenReason?: string;
    metadata?: Record<string, unknown>;
} & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
};

export declare type IAction = BaseAction & ActionParamsUnion;

export type ActionExecutionReportType =
    | {
          status: 'success';
          result?: Record<string, unknown>;
          unrestrictType?: RestrictionTypes;
      }
    | {
          status: 'fail';
          statusCode: number;
          failReason?: unknown;
          restrictions?: Array<string>;
      }
    | {
          status: 'retry';
          nextTry: Date;
      };

export declare type ActionCreationData = Omit<IAction, '_id' | 'hash'> & Partial<Pick<IAction, 'hash'>>;
