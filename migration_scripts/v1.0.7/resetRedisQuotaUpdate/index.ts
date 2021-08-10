import { AsyncRedisClient } from '@waapi/async-redis-client';
import dayjs from 'dayjs';
import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { UserModel } from './schemas';

const PAUSE_BETWEEN_BATCH = 1000;
const BATCH_SIZE = 1000;

const getUsers = (c: Connection, start: number) => UserModel(c).find().skip(start).limit(BATCH_SIZE).lean().exec();

async function resetRedisQuotaUpdate() {
    printStartScript('reset redis quota update');

    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);

    const usersCount = await UserModel(stargateDatabase).countDocuments();
    console.log(`Found ${usersCount} users`);
    let processedUsers = 0;
    const SKIP = 0;
    const startTime = Date.now();

    const redisClient = new AsyncRedisClient();
    await redisClient.loginToRedis(process.env.SHIVA_REDIS_URL!);

    const resetDate = dayjs().subtract(1, 'days').toString();

    while (processedUsers < usersCount - SKIP) {
        const usersBatch = await getUsers(stargateDatabase, processedUsers + SKIP);

        await Promise.all(usersBatch.map((user) => redisClient.set(`lastQuotaUpdate/${user._id.toString()}`, resetDate)));

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedUsers += BATCH_SIZE;
        printProgress(processedUsers, usersCount, startTime);
    }

    process.exit(1);
}

resetRedisQuotaUpdate();
