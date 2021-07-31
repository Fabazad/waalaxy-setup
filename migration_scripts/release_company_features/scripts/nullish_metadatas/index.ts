import Axios from 'axios';
import dayjs from 'dayjs';
import dotEnv from 'dotenv';
import { printProgress, printStartScript } from '../../../scriptHelper';
import { SEARCH_QUERY, SLACK_BATCH_SIZE, SLACK_PAUSE_BETWEEN_BATCH } from './constants';
import { NullishMetadatas } from './types';

dotEnv.config();

const searchMessages = async ({ count, page }: { count: number; page: number }) =>
    Axios.get('https://slack.com/api/search.messages', {
        params: { count, page: page, query: SEARCH_QUERY },
        headers: { Authorization: `Bearer ${process.env.SLACK_USER_TOKEN}` },
    });

const countNullishMetadatasMessages = async (): Promise<number> => {
    const { data } = await searchMessages({ count: 1, page: 1 });
    if (data.ok === false) return -1;

    return data.messages.total;
};

const getNullishMetadatasMessages = async ({ start }: { start: number }): Promise<Array<any>> => {
    const { data } = await searchMessages({ page: Math.ceil(start / SLACK_BATCH_SIZE), count: SLACK_BATCH_SIZE });
    if (data.ok === false) return [];

    return data.messages.matches;
};

const nullishMetadatas = async () => {
    printStartScript('Nullish metadatas');
    if (!process.env.SLACK_USER_TOKEN) {
        console.log('Error: no SLACK_USER_TOKEN in .env');
        process.exit(1);
    }

    const count = await countNullishMetadatasMessages();
    if (count === -1) {
        console.log('Error: Could not get count of nullish metadatas');
        process.exit(1);
    }

    const startTime = Date.now();
    const result: NullishMetadatas = {};
    let processed = 0;

    while (processed < count) {
        const messages = await getNullishMetadatasMessages({ start: processed });
        messages.forEach((message) => {
            const { text, ts } = message;
            const user = text.split(SEARCH_QUERY)[0].split('user ')[1].trim();
            if (!user) return;

            if (result[user])
                result[user] = {
                    count: result[user].count + 1,
                    firstDate: dayjs(result[user].firstDate).isBefore(dayjs(ts)) ? result[user].firstDate : dayjs.unix(ts).toISOString(),
                };
            else result[user] = { count: 1, firstDate: dayjs.unix(ts).toISOString() };
        });

        await new Promise((r) => {
            setTimeout(r, SLACK_PAUSE_BETWEEN_BATCH);
        });

        processed += messages.length;
        printProgress(processed, count, startTime);
    }

    const errored = Object.entries(result)
        .filter(([user]) => result[user].count > 1)
        .map(([user, data]) => ({ user, ...data }));
    console.log(errored);

    process.exit(1);
};

nullishMetadatas();
