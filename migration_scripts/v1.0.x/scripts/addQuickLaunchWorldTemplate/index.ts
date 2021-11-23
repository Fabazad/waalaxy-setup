import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { disconnectFromDatabase, loginToDatabase } from '../../../../mongoose';
import { printStartScript } from '../../../scriptHelper';
import { WorldTemplateModel } from './schemas';

dotEnv.config();

interface PropsQuickLaunch {
    name: string;
    canQuickLaunch: boolean;
    shortName: string;
    icon: string;
    priorityQuickLaunch: number;
}

const QuickLaunchWorldTemplates: Array<PropsQuickLaunch> = [
    {
        name: 'Pluto',
        canQuickLaunch: true,
        shortName: 'templates.pluton.short_name',
        icon: 'email',
        priorityQuickLaunch: 4,
    },
    {
        name: 'Mercure (ex Sherlock)',
        canQuickLaunch: true,
        shortName: 'templates.mercure.short_name',
        icon: 'connectMessage',
        priorityQuickLaunch: 2,
    },
    {
        name: 'Uranus',
        canQuickLaunch: true,
        shortName: 'templates.simple_message.short_name',
        icon: 'message',
        priorityQuickLaunch: 3,
    },
    {
        name: 'Mars',
        canQuickLaunch: true,
        shortName: 'templates.simple_connect.short_name',
        icon: 'connect',
        priorityQuickLaunch: 1,
    },
];

const updateWorldTemplateToQuickLaunchTemplate = (ql: PropsQuickLaunch) => {
    const { name, ...rest } = ql;
    return {
        updateOne: {
            filter: {
                name,
            },
            update: {
                $set: rest,
            },
        },
    };
};

const bulkUpdate = (c: Connection, updates: { updateOne: { filter: Record<string, unknown>; update: { $set: Record<string, any> } } }[]) =>
    WorldTemplateModel(c).bulkWrite(updates);

// Only need for local, already up on prod and staging
export const addQuickLaunchWorldTemplate = async () => {
    printStartScript('Starting addQuickLaunchWorldTemplate');
    const ProfesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const updates = QuickLaunchWorldTemplates.map((QuickLaunchWorldTemplate) => {
        return updateWorldTemplateToQuickLaunchTemplate(QuickLaunchWorldTemplate);
    });
    await bulkUpdate(ProfesorDatabase, updates);
    await disconnectFromDatabase();
    console.log('Exiting');
};
