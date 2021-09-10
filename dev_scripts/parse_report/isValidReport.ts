import { ImportReport } from './types';

export const isValidReport = (arg: unknown): arg is ImportReport =>
    //@ts-ignore
    arg !== null &&
    //@ts-ignore
    typeof arg === 'object' &&
    //@ts-ignore
    'report' in arg &&
    //@ts-ignore
    'status' in arg &&
    //@ts-ignore
    Array.isArray(arg['report']) &&
    //@ts-ignore
    arg['report'].every((i) => 'page' in i && 'status' in i && 'prospects' in i);
