var readline = require('readline');

export const printStartScript = (scriptName: string): void => {
    const escape = new Array(Math.round((100 - scriptName.length - 6) / 2)).join(' ');
    console.log(`${escape}\x1b[1m\x1b[45m=> ${scriptName} <=\x1b[0m`);
};

const prettyTime = (seconds: number): string => {
    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * 60 * 60;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    return `\x1b[37m${hours}:${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}s\x1b[0m`;
};

const getTime = (start: number): string => {
    const seconds = Math.round(Math.abs(Date.now() - start) / 1000);
    return `\x1b[1mTime:\x1b[0m\t${prettyTime(seconds)}`;
};

const getLeftTime = (processed: number, total: number, start: number): string => {
    const seconds = Math.round((Math.abs(Date.now() - start) * (total / processed - 1)) / 1000);
    return `\x1b[1mLeft:\x1b[0m\t${prettyTime(seconds)}`;
};

const getCount = (processed: number, total: number): string => {
    return `\x1b[1mCount:\x1b[0m\t\x1b[37m${processed}\x1b[0m/\x1b[90m${total}\x1b[0m`;
};

const getPercent = (processed: number, total: number): string => {
    const percent = Math.min(100, Math.floor(Math.round((processed / total) * 100 * 100) / 100));
    const before = new Array(percent).join(' ');
    const after = new Array(100 - percent).join(' ');
    const styledPercent = `\x1b[90m ${percent}%\x1b[0m`;
    const styledDone = `\x1b[1m\x1b[92m done!\x1b[0m`;
    return `\x1b[102m${before}\x1b[100m${after}\x1b[0m${percent < 100 ? styledPercent : styledDone}`;
};

export const printProgress = (processed: number, total: number, startTime: number) => {
    const count = getCount(processed, total);
    const percent = getPercent(processed, total);
    const time = getTime(startTime);
    const leftTime = getLeftTime(processed, total, startTime);
    if (processed > 0) cleanConsole();
    process.stdout.write(`${time}\n${leftTime}\n${count}\n${percent}`);
};

const cleanConsole = () => {
    readline.moveCursor(process.stdout, 0, -3);
    readline.cursorTo(process.stdout, 0);
    readline.clearScreenDown(process.stdout);
};

const test = async () => {
    const batch = 100;
    const entitiesToProcess = 6000;
    let processedEntities = 0;
    printStartScript('Some script name');
    const start = Date.now();
    while (processedEntities <= entitiesToProcess) {
        printProgress(processedEntities, entitiesToProcess, start);
        await new Promise((r) => {
            setTimeout(r, 120);
        });
        processedEntities += batch;
    }
    console.log('\n');
};
// test();
