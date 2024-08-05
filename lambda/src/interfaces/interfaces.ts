export interface JobEvents {
    address: string;
    blockNumber: number;
    transactionHash: string;
}

export interface WorkableStatus {
    canWork: boolean;
    events: JobEvents[];
    jobAddress: string;
    network: string;
}
