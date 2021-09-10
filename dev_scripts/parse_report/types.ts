export type ImportReport = {
    report: {
        page: number;
        status: string;
        prospects: (({ status: 'success' } | { status: 'error'; reason?: string }) & {
            data: {
                profile: {
                    firstName: string;
                    lastName: string;
                    publicIdentifier: string | null;
                    memberId: string;
                    salesMemberId: string | null;
                    __typename: 'Profile';
                };
                __typename: 'Prospect';
            };
        })[];
    }[];
    status: 'reached_end' | 'done';
};
