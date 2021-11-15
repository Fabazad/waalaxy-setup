import dotEnv from 'dotenv';
import { removeParagraphsInEmailContents } from './removeParagraphsInEmailContents';

dotEnv.config();

const maintenanceRequired = async () => {
    console.log('Debut');
    console.time('Script for maintenance');

    console.timeEnd('Script for maintenance');

    nonMaintenanceRequired();
};

const nonMaintenanceRequired = async () => {
    await removeParagraphsInEmailContents();
};

maintenanceRequired();
