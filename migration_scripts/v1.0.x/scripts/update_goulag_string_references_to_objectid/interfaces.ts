import { Schema } from 'mongoose';

export interface IInvalidProspectList {
    _id: Schema.Types.ObjectId;
    name: string;
    user: string;
}

export interface ICorrectProspectList {
    _id: Schema.Types.ObjectId;
    name: string;
    user: Schema.Types.ObjectId;
}
