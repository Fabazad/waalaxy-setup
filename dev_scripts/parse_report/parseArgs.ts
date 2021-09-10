import { readFileSync } from 'fs';

export const parseArgs = (args: string[]): unknown => {
    const jsonArg = args.findIndex((arg) => arg === '--json');
    const fileArg = args.findIndex((arg) => arg === '--file');

    if (jsonArg < 0 && fileArg < 0) {
        throw new SyntaxError('missing mandatory process argument');
    }

    if (jsonArg > -1) {
        return JSON.parse(args[jsonArg + 1]);
    }
    if (fileArg > -1) {
        return JSON.parse(readFileSync(args[fileArg + 1]).toString());
    }
};
