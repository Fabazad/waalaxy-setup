import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { AllPossibleConditions, BooleanExpression, IWorld, Path } from './interfaces';
import { WorldModel } from './schemas';
dotEnv.config();

const BATCH_SIZE = 1000;
const PAUSE_BETWEEN_BATCH = 0;

const processNewConditions = (
    condition: BooleanExpression<AllPossibleConditions>,
    lookingFor: string,
): BooleanExpression<AllPossibleConditions> | null => {
    if (condition.isAtomic) return condition.entity.type === lookingFor ? { ...condition, entity: { params: undefined, type: 'isPending' } } : null;

    const left = processNewConditions(condition.leftOperand, lookingFor);
    const right = processNewConditions(condition.rightOperand, lookingFor);

    if (left !== null || right !== null)
        return {
            ...condition,
            leftOperand: left !== null ? left : condition.leftOperand,
            rightOperand: right !== null ? right : condition.rightOperand,
        } as BooleanExpression<AllPossibleConditions>;
    return null;
};

const processNewPaths = (paths: Path<AllPossibleConditions>[]): Path<AllPossibleConditions>[] | null => {
    const [foundMistake, updatedPaths] = paths.reduce(
        (result, path): [boolean, Path<AllPossibleConditions>[]] => {
            const updatedCondition = processNewConditions(path.condition, 'isNotConnected');
            const [r, p] = result;
            return updatedCondition === null ? [r, [...p, path.condition]] : [true, [...p, updatedCondition]];
        },
        [false, []],
    );
    return foundMistake ? updatedPaths : null;
};

const processDetectedMistake = async (
    connection: Connection,
    world: IWorld,
    sawConnectLinkedin = false,
    currentWaypointId: string | null = null,
): Promise<boolean> => {
    // Starting case
    const waypoint = currentWaypointId === null ? world.startingPoint.id : currentWaypointId;

    // Get neighbor waypoints
    const nextWaypointsIds = world.paths.filter((path) => path.from === waypoint).map((path) => path.to);

    // Ending case
    if (nextWaypointsIds.length === 0) return false;

    // Update connectLinkedIn condition
    const connectLinkedin = sawConnectLinkedin || world.waypoints.find((wp) => wp.id === waypoint)?.type === 'connectLinkedin';

    if (connectLinkedin) {
        // Compute new paths
        const processedPaths = processNewPaths(world.paths.filter((path) => path.from === waypoint));

        if (processedPaths !== null) {
            await WorldModel(connection).updateOne(
                { _id: world._id },
                { paths: [...processedPaths, ...world.paths.filter((path) => path.from !== waypoint)] },
            );
            return true;
        }
    }

    // Call recursively neighbors
    return nextWaypointsIds.reduce<Promise<boolean>>(
        async (result: Promise<boolean>, waypointId: string): Promise<boolean> =>
            result || (await processDetectedMistake(connection, world, connectLinkedin, waypointId)),
        new Promise((resolve) => resolve(false)),
    );
};

const countWorldsToProcess = (c: Connection) => WorldModel(c).countDocuments().exec();
const findWorldBatch = (c: Connection, skip: number) => WorldModel(c).find({}).skip(skip).limit(BATCH_SIZE).lean().exec();

export const replaceIsNotConnectedWithIsPendingInBadConditions = async () => {
    console.log('Starting replacing isNotConnected with isPending in bad conditions');
    const connection = await loginToDatabase(process.env.PROFESOR_DATABASE!);

    const worldsToProcess = await countWorldsToProcess(connection);

    console.log(`Found ${worldsToProcess} Worlds to process`);

    let processedWorlds = 0;
    let countWorldWithMistake = 0;

    while (processedWorlds < worldsToProcess) {
        const worldsBatch: IWorld[] = await findWorldBatch(connection, processedWorlds);

        countWorldWithMistake += worldsBatch.reduce((result: number, world: IWorld) => {
            return processDetectedMistake(connection, world) ? result + 1 : result;
        }, 0);

        processedWorlds = Math.min(processedWorlds + BATCH_SIZE, worldsToProcess);
        console.log(`${processedWorlds}/${worldsToProcess} processed users (${Math.round((processedWorlds / worldsToProcess) * 100 * 100) / 100}%)`);

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });
    }

    console.log(`${countWorldWithMistake} worlds with mistakes found`);
    await connection.close();
    process.exit(1);
};

replaceIsNotConnectedWithIsPendingInBadConditions();
