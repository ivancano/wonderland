import { ethers } from 'ethers';
import { infuraRpcUrl } from './config/config';
import { jobABI } from './abis/abis';
import { WorkableStatus, JobEvents } from './interfaces/interfaces';

const provider = new ethers.JsonRpcProvider(infuraRpcUrl);

/**
 * Gets the workable status of a job on the specified network.
 *
 * @param jobAddress - The address of the job contract.
 * @param network - The name of the network.
 * @param currentBlock - The current block number.
 * @returns A promise that resolves to the workable status of the job.
 */
export const getWorkableJobStatus = async (
    jobAddress: string,
    network: string,
    currentBlock: number,
): Promise<WorkableStatus> => {
    const jobContract = new ethers.Contract(jobAddress, jobABI, provider);

    // Default result
    const result: { canWork: boolean; events: JobEvents[]; jobAddress: string; network: string } = {
        canWork: false,
        events: [],
        jobAddress,
        network,
    };
    try {
        // Check if the job is workable
        const workable = await jobContract.workable(network);
        if (workable[0]) {
            result.canWork = true;

            // Check if the job has been worked in the last 10 blocks
            const filter = {
                address: jobAddress,
                fromBlock: currentBlock - 10,
                toBlock: currentBlock,
                topics: [ethers.id('Work(bytes32)')],
            };

            // Get the logs
            const events = await provider.getLogs(filter);
            if (events.length) {
                // Parse the events
                result.events = events.map((event) => {
                    const eventParsed: JobEvents = {
                        address: event.address,
                        blockNumber: event.blockNumber,
                        transactionHash: event.transactionHash,
                    };
                    return eventParsed;
                });
            }
        }
    } catch (error) {
        console.error('Error checking if job can work:', error);
    }

    return result;
};
