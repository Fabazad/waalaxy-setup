import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { AllPossibleConditions, BooleanExpression, ComplexBooleanExpression, ConditionReplace, ConditionSearch, IWorld, Path } from './interfaces';
import { WorldModel } from './schemas';
import { printProgress, printStartScript } from './scriptHelper';
dotEnv.config();

const BATCH_SIZE = 200;
const PAUSE_BETWEEN_BATCH = 100; /* Milliseconds */

/**
 * @param condition : condition or nested conditions
 * @param lookingFor : condition search params
 * @param replaceWith : condition replacing entity
 * @returns new condition with replaced entity or null if no condition match
 */
const replaceMatchingConditions = ({
    condition,
    lookingFor,
    replaceWith,
}: {
    condition: BooleanExpression<AllPossibleConditions>;
    lookingFor: ConditionSearch;
    replaceWith: ConditionReplace;
}): BooleanExpression<AllPossibleConditions> | null => {
    if (condition.isAtomic) {
        if (
            (lookingFor.type && lookingFor.params && condition.entity === lookingFor) ||
            (lookingFor.type && !lookingFor.params && condition.entity.type === lookingFor.type) ||
            (!lookingFor.type && lookingFor.params && condition.entity.params === lookingFor.params)
        )
            return { ...condition, entity: replaceWith };
        return null;
    }

    const left = replaceMatchingConditions({
        condition: (condition as ComplexBooleanExpression<AllPossibleConditions>).leftOperand,
        lookingFor,
        replaceWith,
    });
    const right = replaceMatchingConditions({
        condition: (condition as ComplexBooleanExpression<AllPossibleConditions>).rightOperand,
        lookingFor,
        replaceWith,
    });

    if (left !== null || right !== null)
        return {
            ...condition,
            leftOperand: left !== null ? left : (condition as ComplexBooleanExpression<AllPossibleConditions>).leftOperand,
            rightOperand: right !== null ? right : (condition as ComplexBooleanExpression<AllPossibleConditions>).rightOperand,
        } as BooleanExpression<AllPossibleConditions>;
    return null;
};

/**
 *
 * @param paths : paths of a specific waypoint (from)
 * @param lookingFor : condition search params
 * @param replaceWith : condition replacing entity
 * @returns paths with updated conditions or null if paths have not changed
 */
const replaceMatchingPaths = ({
    paths,
    lookingFor,
    replaceWith,
}: {
    paths: Path<AllPossibleConditions>[];
    lookingFor: ConditionSearch;
    replaceWith: ConditionReplace;
}): Path<AllPossibleConditions>[] | null => {
    const [foundMistake, updatedPaths] = paths.reduce<[boolean, Path<AllPossibleConditions>[]]>(
        (result, path) => {
            const updatedCondition = replaceMatchingConditions({
                condition: path.condition,
                lookingFor,
                replaceWith,
            });
            const [foundMistake, updatedPaths] = result;
            return updatedCondition === null
                ? [foundMistake, [...updatedPaths, path]]
                : [true, [...updatedPaths, { ...path, condition: updatedCondition }]];
        },
        [false, []],
    );
    return foundMistake ? updatedPaths : null;
};

const replaceWorldPaths = async (
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
        const processedPaths = replaceMatchingPaths({
            paths: world.paths.filter((path) => path.from === waypoint),
            lookingFor: { type: 'isNotConnected' },
            replaceWith: { type: 'isPending', params: undefined },
        });

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
            result || (await replaceWorldPaths(connection, world, connectLinkedin, waypointId)),
        new Promise((resolve) => resolve(false)),
    );
};

const countWorldsToProcess = (c: Connection) => WorldModel(c).countDocuments().exec();
const findWorldBatch = (c: Connection, skip: number) => WorldModel(c).find({}).skip(skip).limit(BATCH_SIZE).lean().exec();

export const replaceIsNotConnectedWithIsPendingInBadConditions = async () => {
    const connection = await loginToDatabase(process.env.PROFESOR_DATABASE!);

    const worldsToProcess = await countWorldsToProcess(connection);

    printStartScript('Replace bad conditions in world paths');

    let processedWorlds = 0;
    let countWorldWithMistake = 0;
    const startTime = Date.now();

    while (processedWorlds < worldsToProcess) {
        const worldsBatch: IWorld[] = await findWorldBatch(connection, processedWorlds);

        countWorldWithMistake += (await Promise.all(worldsBatch.map((world: IWorld) => replaceWorldPaths(connection, world)))).reduce<number>(
            (result, current) => (current ? result + 1 : result),
            0,
        );

        processedWorlds = Math.min(processedWorlds + BATCH_SIZE, worldsToProcess);
        printProgress(processedWorlds, worldsToProcess, startTime);

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });
    }

    console.log(`${countWorldWithMistake} worlds with mistakes found`);
    await connection.close();
    process.exit(1);
};

replaceIsNotConnectedWithIsPendingInBadConditions();
