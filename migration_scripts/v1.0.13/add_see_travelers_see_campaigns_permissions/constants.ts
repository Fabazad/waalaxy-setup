import { IPermission } from './interfaces';

export const PERMISSIONS_TO_ADD: Array<IPermission<PermissionName>> = [
    { name: 'see_travelers', params: { users: 'all' } },
    { name: 'see_campaigns', params: { users: 'all' } },
];
