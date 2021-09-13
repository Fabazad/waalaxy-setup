import { getMaxWaypointCounts, Path } from '@waapi/gaia';
import { AllPossibleConditions } from '@waapi/zeus';
import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../mongoose';
import { printStartScript } from '../../scriptHelper';
import { IWorldTemplate } from './interfaces';
import { NewWorldTemplateModel, OldWorldTemplateModel } from './schemas';

const getWorldTemplates = (c: Connection): Promise<Pick<IWorldTemplate, '_id' | 'paths' | 'startingPoint' | 'waypoints'>[]> =>
    OldWorldTemplateModel(c)
        .find({})
        .select({
            _id: 1,
            waypoints: 1,
            startingPoint: 1,
            paths: 1,
        })
        .lean()
        .exec();

const bulkUpdateTemplates = (
    c: Connection,
    updates: { updateOne: { filter: Record<string, unknown>; update: { $set: { waypointCounts: Array<Record<string, unknown>> } } } }[],
) => NewWorldTemplateModel(c).bulkWrite(updates);

const isValid = <T extends unknown>(elem: T): elem is NonNullable<T> => typeof elem !== 'undefined' && elem !== null;

export const addTemplatesWaypointCounts = async () => {
    printStartScript('Starting addTemplatesWaypointCounts');
    const ProfesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);

    const oldTemplates = await getWorldTemplates(ProfesorDatabase);

    console.log(`Found ${oldTemplates.length} templates to update`);

    const templateUpdates = oldTemplates.map((template) => {
        const { startingPoint, paths, waypoints, _id } = template;

        return {
            updateOne: {
                filter: { _id },
                update: {
                    $set: {
                        waypointCounts: Object.values(
                            getMaxWaypointCounts({
                                startingPoint,
                                paths: paths as unknown as Path<AllPossibleConditions>[],
                                waypoints,
                                ignoredWaypointsTypes: ['entry', 'goal', 'end', 'failed'],
                            }),
                        ).filter(isValid),
                    },
                },
            },
        };
    });

    const { modifiedCount } = await bulkUpdateTemplates(ProfesorDatabase, templateUpdates);

    console.log(`Update ${modifiedCount} templates`);

    console.log('Exiting');
};
