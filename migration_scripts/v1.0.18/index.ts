import { denormalizeWorldsAndOrigins } from './denormalizeWorldsAndOrigins';

const maintenanceRequired = async () => {
    console.log('Debut');
    console.time('Script for maintenance');

    await denormalizeWorldsAndOrigins();

    console.timeEnd('Script for maintenance');
};

const nonMaintenanceRequired = async () => {};

maintenanceRequired();
