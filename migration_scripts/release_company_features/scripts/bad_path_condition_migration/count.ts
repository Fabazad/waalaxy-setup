import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import {
    AllPossibleConditions,
    AllPossibleWaypoints,
    BooleanExpression,
    ComplexBooleanExpression,
    ConditionSearch,
    IWorld,
    Path,
} from './interfaces';
import { WorldModel } from './schemas';
dotEnv.config();

const BATCH_SIZE = 200;
const PAUSE_BETWEEN_BATCH = 100; /* Milliseconds */

/**
 * @param condition : condition or nested conditions
 * @param lookingFor : condition search params
 * @param replaceWith : condition replacing entity
 * @returns true if condition have matched
 */
const isMatchingCondition = ({
    condition,
    lookingFor,
}: {
    condition: BooleanExpression<AllPossibleConditions>;
    lookingFor: ConditionSearch;
}): boolean => {
    // Atomic condition
    if (condition.isAtomic)
        return (
            (lookingFor.type ? condition.entity.type === lookingFor.type : true) &&
            (lookingFor.params ? JSON.stringify(condition.entity.params) === JSON.stringify(lookingFor.params) : true)
        );

    // Complex condition
    const left = isMatchingCondition({
        condition: (condition as ComplexBooleanExpression<AllPossibleConditions>).leftOperand,
        lookingFor,
    });
    const right = isMatchingCondition({
        condition: (condition as ComplexBooleanExpression<AllPossibleConditions>).rightOperand,
        lookingFor,
    });

    return left || right;
};

/**
 *
 * @param paths : paths of a specific waypoint (from)
 * @param lookingFor : condition search params
 * @param replaceWith : condition replacing entity
 * @returns true if at least one path have matched condition
 */
const hasChangeDetectedInPaths = ({ paths, lookingFor }: { paths: Path<AllPossibleConditions>[]; lookingFor: ConditionSearch }): boolean => {
    return paths.reduce<boolean>((result, path) => {
        const conditionChanged = isMatchingCondition({
            condition: path.condition,
            lookingFor,
        });
        return result || conditionChanged;
    }, false);
};

/**
 *
 * @param world : world to lookup
 * @param condition : waypoint type condition
 * @param sawCondition : to keep track of first condition
 * @param currentWaypointId : current waypoint id
 * @param lookingFor : condition search params
 * @param replaceWith : condition replacing entity
 * @returns true if condition detected in current waypoint paths
 */

const hasChangeDetectedInWorld = ({
    world,
    condition,
    sawCondition = false,
    currentWaypointId = world.startingPoint.id,
    lookingFor,
}: {
    world: IWorld;
    condition: AllPossibleWaypoints[keyof AllPossibleWaypoints];
    sawCondition?: boolean;
    currentWaypointId?: string;
    lookingFor: ConditionSearch;
}): boolean => {
    const nextWaypointsIds = world.paths.filter((path) => path.from === currentWaypointId).map((path) => path.to);

    if (nextWaypointsIds.length === 0) return false;

    sawCondition = sawCondition || world.waypoints.find((wp) => wp.id === currentWaypointId)?.type === condition;

    // Next Waypoints
    const nextHaveChanged = nextWaypointsIds.reduce<boolean>((resultHasChanged, waypointId) => {
        const changed = hasChangeDetectedInWorld({
            world,
            condition,
            lookingFor,
            currentWaypointId: waypointId,
            sawCondition,
        });
        return resultHasChanged || changed;
    }, false);

    // Current Waypoint
    const hasChanged = hasChangeDetectedInPaths({
        paths: world.paths.filter((path) => path.from === currentWaypointId),
        lookingFor,
    });

    return nextHaveChanged || (sawCondition && hasChanged);
};

const countWorldsToProcess = (c: Connection) => WorldModel(c).countDocuments().exec();
const findWorldBatch = (c: Connection, skip: number) => WorldModel(c).find().skip(skip).limit(BATCH_SIZE).lean().exec();

const countPathsBadConditions = async () => {
    const connection = await loginToDatabase(process.env.PROFESOR_DATABASE!);

    const worldsToProcess = await countWorldsToProcess(connection);

    printStartScript('Count bad conditions in world paths');

    let processedWorlds = 0;
    let countWorldWithMistake = 0;
    const startTime = Date.now();

    while (processedWorlds < worldsToProcess) {
        const worldsBatch: IWorld[] = await findWorldBatch(connection, processedWorlds);

        worldsBatch.forEach(async (world) => {
            const changeDetected = hasChangeDetectedInWorld({
                world,
                condition: 'connectLinkedin',
                lookingFor: { type: 'isNotConnected' },
            });
            if (changeDetected) countWorldWithMistake += 1;
        });

        processedWorlds = Math.min(processedWorlds + BATCH_SIZE, worldsToProcess);

        await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_BATCH));

        printProgress(processedWorlds, worldsToProcess, startTime);
    }

    console.log(`${countWorldWithMistake} worlds with mistakes found`);
    await connection.close();
    process.exit(1);
};

countPathsBadConditions();
