// getWorkableJobStatus.test.ts
import { ethers } from 'ethers';
import { getWorkableJobStatus } from '../../src/job';
import { jobABI } from '../../src/abis/abis';
import { WorkableStatus } from '../../src/interfaces/interfaces';

// Mocking ethers
jest.mock('ethers', () => {
    const originalModule = jest.requireActual('ethers');
    const mockProvider = {
        getLogs: jest.fn(),
    };
    const mockContract = {
        workable: jest.fn(),
    };

    return {
        ...originalModule,
        ethers: {
            ...originalModule.ethers,
            JsonRpcProvider: jest.fn(() => mockProvider),
            Contract: jest.fn(() => mockContract),
        },
    };
});

describe('getWorkableJobStatus', () => {
    let provider: ethers.JsonRpcProvider;
    let contract: ethers.Contract;

    const jobAddress = '0xJobAddress';
    const network = 'mainnet';
    const currentBlock = 1000;

    beforeEach(() => {
        provider = new ethers.JsonRpcProvider();
        contract = new ethers.Contract(jobAddress, jobABI, provider);
    });

    it('should return workable status as true with events if job is workable and events are found', async () => {
        (contract.workable as unknown as jest.Mock).mockResolvedValue([true]);
        (provider.getLogs as jest.Mock).mockResolvedValue([
            {
                address: jobAddress,
                blockNumber: currentBlock - 1,
                transactionHash: '0xHash1',
            },
        ]);

        const result: WorkableStatus = await getWorkableJobStatus(jobAddress, network, currentBlock);

        expect(result.canWork).toBe(true);
        expect(result.events).toHaveLength(1);
        expect(result.events[0]).toEqual({
            address: jobAddress,
            blockNumber: currentBlock - 1,
            transactionHash: '0xHash1',
        });
    });

    it('should return workable status as false if job is not workable', async () => {
        const workableMock = contract.workable as unknown as jest.Mock;
        workableMock.mockResolvedValue([false]);

        const result: WorkableStatus = await getWorkableJobStatus(jobAddress, network, currentBlock);

        expect(result.canWork).toBe(false);
        expect(result.events).toHaveLength(0);
    });

    it('should return workable status as true with no events if job is workable but no events found', async () => {
        const workableMock = contract.workable as unknown as jest.Mock;
        workableMock.mockResolvedValue([true]);

        const getLogsMock = provider.getLogs as jest.Mock;
        getLogsMock.mockResolvedValue([]);

        const result: WorkableStatus = await getWorkableJobStatus(jobAddress, network, currentBlock);

        expect(result.canWork).toBe(true);
        expect(result.events).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
        const workableMock = contract.workable as unknown as jest.Mock;
        workableMock.mockRejectedValue(new Error('Mocked error'));

        console.error = jest.fn();

        const result: WorkableStatus = await getWorkableJobStatus(jobAddress, network, currentBlock);

        expect(result.canWork).toBe(false);
        expect(result.events).toHaveLength(0);
        expect(console.error).toHaveBeenCalledWith('Error checking if job can work:', expect.any(Error));
    });
});
