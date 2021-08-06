export type NullishMetadatas = Record<string, { count: number; firstDate: string }>;
export type Metadata = {
    _id: string;
    user: string;
    latestRecordedConnectionTime: string;
    firstProspectCreatedDate: string;
    latestMonitoredConversationTime: string;
};
