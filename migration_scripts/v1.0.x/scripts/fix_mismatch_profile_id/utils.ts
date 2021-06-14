import _ from 'lodash';
import { Profile } from './interfaces';

export const mergeProfiles = (profiles: Array<Profile | Omit<Profile, '_id'>>): Profile | undefined => {
    return profiles.reduce<Profile | undefined>((acc, curr) => {
        if (acc === undefined) return curr;
        return _.mergeWith(JSON.parse(JSON.stringify(acc)), curr, (obj1, obj2) => {
            if (Array.isArray(obj1) && Array.isArray(obj2)) {
                if (obj1.every((o) => !!o.number) && obj2.every((o) => !!o.number))
                    return [...obj1, ...obj2.filter((p) => !obj1.some((p1) => p1.number === p.number))];
                if (obj1.every((o) => !!o.email) && obj2.every((o) => !!o.email))
                    return [...obj1, ...obj2.filter((p) => !obj1.some((p1) => p1.email === p.email))];
            }
            return undefined;
        });
    }, undefined);
};
