import { Schema } from 'mongoose';

export interface Tag {
    _id: Schema.Types.ObjectId | string;
    name: string;
    color: string;
    user: Schema.Types.ObjectId | string;
}

export interface Prospect {
    _id: Schema.Types.ObjectId | string;
    user: string;
    tags?: Array<Tag | Schema.Types.ObjectId>;
}
