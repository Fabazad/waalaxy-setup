import MirageClient from '@waapi/mirage';
import OnuClient from '@waapi/onu';
import mongoose from 'mongoose';
import { loginToDatabase } from '../../../mongoose';

type PlanName = 'freemium' | 'staff' | 'pro' | 'advanced' | 'business';

export const SEAT_STATUSES = {
    EMPTY: 'EMPTY',
    PENDING: 'PENDING',
    USED: 'USED',
} as const;
export const seatStatuses = Object.values(SEAT_STATUSES);
export type SeatStatuses = typeof seatStatuses[number];

export const EMPTY_SEAT_STATUSES = {
    [SEAT_STATUSES.EMPTY]: SEAT_STATUSES.EMPTY,
};
export const emptySeatStatuses = Object.values(EMPTY_SEAT_STATUSES);
export type EmptySeatStatuses = typeof emptySeatStatuses[number];

export const USED_SEAT_STATUSES = {
    [SEAT_STATUSES.PENDING]: SEAT_STATUSES.PENDING,
    [SEAT_STATUSES.USED]: SEAT_STATUSES.USED,
};
export const usedSeatStatuses = Object.values(USED_SEAT_STATUSES);
export type UsedSeatStatuses = typeof usedSeatStatuses[number];

export declare type EmptySeat = {
    status: EmptySeatStatuses;
};

export declare type UsedSeat = {
    status: UsedSeatStatuses;
    user: string;
};

export interface Plan<PlanName extends string> {
    name: PlanName;
    expirationDate: string | null;
    startDate: string;
    periodicity: Periodicity;
}

export type Periodicity = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifeTime';

export declare type BaseSeat = {
    _id: mongoose.Schema.Types.ObjectId | string;
    plan: Plan<PlanName>;
};

export declare type Seat = BaseSeat & (EmptySeat | UsedSeat);

export declare type ICompany = {
    name: string;
    owner: string;
    seats: Array<Seat>;
    waapiId: string;
} & {
    _id: mongoose.Schema.Types.ObjectId | string;
    createdAt?: string;
    updatedAt?: string;
};

export const PlanSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        expirationDate: { type: Date },
        startDate: { type: Date, required: true },
        periodicity: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifeTime', 'weekly'], required: true },
    },
    { _id: false },
);

const SeatSchema = new mongoose.Schema(
    {
        plan: PlanSchema,
        status: { type: String, enum: seatStatuses, required: true },
        user: { type: String },
    },
    { timestamps: true, _id: true },
);

const CompanySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        owner: { type: String, required: true, unique: true },
        seats: { type: [SeatSchema], required: true },
        waapiId: String,
    },
    { timestamps: true, _id: true },
);

const UserPermissionSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, unique: true },
        waapiId: { type: String, required: true, unique: true },
        paymentWaapiId: { type: String, required: true },
        permissions: {
            included: {
                type: [
                    {
                        name: { type: String, required: true },
                        params: { type: Object },
                    },
                ],
                required: true,
            },
            excluded: {
                type: [
                    {
                        name: { type: String, required: true },
                        params: { type: Object },
                    },
                ],
                required: true,
            },
        },
        plan: {
            name: { type: String, required: true },
            expirationDate: { type: Date },
            startDate: { type: Date, required: true },
            periodicity: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifeTime', 'weekly'], required: true },
        },
    },
    { timestamps: true },
);

const main = async () => {
    const mirage = new MirageClient(process.env.MIRAGE_TOKEN!, true);
    const onuClient = new OnuClient('waalaxy', `Bearer ${process.env.WAAPI_API_TOKEN}`);

    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const UserPermission = bouncerDatabase.model<any & mongoose.Document>('UserPermission', UserPermissionSchema);
    const Companies = bouncerDatabase.model<ICompany & mongoose.Document>('Company', CompanySchema);

    const companies = await Companies.find({
        _id: {
            $in: [
                '60df0b8e44d211002078570b',
                '60df0f2f44d211002078570e',
                '60df1c7c44d2110020785710',
                '60df38e42c245b002084ec62',
                '60df3af7833ea800207e5e57',
                '60df942d2c245b002084ec6f',
                '60e16f18c3a351002057eaab',
            ],
        },
    });

    console.log(companies.length);

    let i = 0;
    for (const company of companies) {
        const { owner, waapiId } = company;
        const userPermission = await UserPermission.findOne({ user: owner });
        if (userPermission === null) {
            console.log('Error', company._id);
            continue;
        }

        if (company._id.toString() !== '60e16f18c3a351002057eaab') {
            const { stripeCustomerId } = await mirage.fetchClient(waapiId);
            await mirage.intervertPaymentData(stripeCustomerId!, userPermission.paymentWaapiId);
        }

        await Companies.deleteOne({ _id: company._id });
        await UserPermission.updateOne({ user: company.owner }, { $unset: { company: 1 } });

        console.log(`${++i}/${companies.length}`);
    }
    console.log('End');
    process.exit(1);
};

main();
