var readline = require('readline');

const getTime = (start) => {
    let seconds = Math.floor(Math.abs(Date.now() - start) / 1000);
    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * 60 * 60;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    return `\x1b[1mTime:\x1b[0m\t\x1b[37m${hours}:${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}s\x1b[0m`;
};

function getCount(processed, total) {
    return `\x1b[1mCount:\x1b[0m\t\x1b[37m${processed}\x1b[0m/\x1b[90m${total}\x1b[0m`;
}

function getPercent(processed, total) {
    const percent = Math.min(100, Math.floor(Math.round((processed / total) * 100 * 100) / 100));
    const before = new Array(percent).join(' ');
    const after = new Array(100 - percent).join(' ');
    const styledPercent = `\x1b[90m ${percent}%\x1b[0m`;
    const styledDone = `\x1b[1m\x1b[92m done!\x1b[0m`;
    return `\x1b[102m${before}\x1b[100m${after}\x1b[0m${percent < 100 ? styledPercent : styledDone}`;
}

export function printProgress(processed, total, startTime) {
    const count = getCount(processed, total);
    const percent = getPercent(processed, total);
    const time = getTime(startTime);
    if (processed > 0) cleanConsole();
    process.stdout.write(`${time}\n${count}\n${percent}`);
}

function cleanConsole() {
    readline.moveCursor(process.stdout, 0, -2);
    readline.cursorTo(process.stdout, 0);
    readline.clearScreenDown(process.stdout);
    readline.cursorTo(process.stdout, 0);
}

const test = async () => {
    const batch = 50;
    const worldsToProcess = 6000;
    let processedWorlds = 0;
    console.log(`Found ${worldsToProcess} Worlds to process`);
    const start = Date.now();
    while (processedWorlds <= worldsToProcess) {
        printProgress(processedWorlds, worldsToProcess, start);
        await new Promise((r) => {
            setTimeout(r, 100);
        });
        processedWorlds += batch;
    }
    console.log('\n');
};
test();
