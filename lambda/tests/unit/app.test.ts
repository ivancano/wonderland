import { handler } from '../../src/app';
import { ethers, InfuraProvider } from 'ethers';
import { MulticallProvider } from "@ethers-ext/provider-multicall";
import { getWorkableJobStatus } from '../../src/job';
import { sendDiscordAlert } from '../../src/discord';

// Mock dependencies
jest.mock('ethers', () => {
  return {
    ethers: {
      Contract: jest.fn()
    },
    InfuraProvider: jest.fn()
  }
});
jest.mock('@ethers-ext/provider-multicall', () => {
  return {
    MulticallProvider: jest.fn()
  }
});
jest.mock('../../src/job', () => {
  return {
    getWorkableJobStatus: jest.fn()
  }
});
jest.mock('../../src/discord', () => {
  return {
    sendDiscordAlert: jest.fn()
  }
});

describe('Lambda Handler', () => {
  let mockProvider: any;
  let mockMulticallProvider: any;
  let mockContract: any;

  beforeEach(() => {
    mockProvider = {
      getBlockNumber: jest.fn().mockResolvedValue(123456)
    };

    mockMulticallProvider = {};

    mockContract = {
      numJobs: jest.fn().mockResolvedValue('2'),
      numNetworks: jest.fn().mockResolvedValue('2'),
      jobAt: jest.fn()
        .mockResolvedValueOnce('0xJobAddress1')
        .mockResolvedValueOnce('0xJobAddress2'),
      networkAt: jest.fn()
        .mockResolvedValueOnce('network1')
        .mockResolvedValueOnce('network2')
    };

    (InfuraProvider as unknown as jest.Mock).mockImplementation(() => mockProvider);
    (MulticallProvider as jest.Mock).mockImplementation(() => mockMulticallProvider);
    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should execute successfully when there are no errors', async () => {
    (getWorkableJobStatus as jest.Mock).mockResolvedValue({
      canWork: true,
      events: []
    });

    const response = await handler({});

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(JSON.stringify('Lambda handler executed successfully'));
    expect(mockProvider.getBlockNumber).toHaveBeenCalledTimes(1);
    expect(mockContract.numJobs).toHaveBeenCalledTimes(1);
    expect(mockContract.numNetworks).toHaveBeenCalledTimes(1);
    expect(mockContract.jobAt).toHaveBeenCalledTimes(2);
    expect(mockContract.networkAt).toHaveBeenCalledTimes(2);
    expect(getWorkableJobStatus).toHaveBeenCalledTimes(4);
    expect(sendDiscordAlert).toHaveBeenCalledTimes(4);
  });

  it('should return 500 when an error occurs', async () => {
    (mockContract.numJobs as jest.Mock).mockRejectedValue(new Error('Test Error'));

    const response = await handler({});

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe('Test Error');
  });
});
