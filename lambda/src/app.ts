import { ethers, InfuraProvider } from 'ethers';
import { MulticallProvider } from "@ethers-ext/provider-multicall";
import { infuraApi, sequencerAddress } from './config/config';
import { sequencerABI } from './abis/abis';
import { getWorkableJobStatus } from './job';
import { sendDiscordAlert } from './discord';

/**
 * Lambda handler that checks the workable status of each job on each network.
 * 
 * @param event - The Lambda event object.
 * @returns A promise that resolves to the Lambda response object.
 */
export const handler = async (event: any) => {
  try {
    const provider = new InfuraProvider('mainnet', infuraApi);
    const multicaller = new MulticallProvider(provider as any);

    // Create a sequencer contract instance
    const sequencerContract = new ethers.Contract(sequencerAddress, sequencerABI, multicaller);

    // Get the number of jobs and networks
    const [ numJobs, numNetworks ] = await Promise.all([
        await sequencerContract.numJobs(),
        await sequencerContract.numNetworks()
    ]);
    console.log(`Checking ${numJobs} jobs`);
    console.log(`Checking ${numNetworks} networks`);

    // Get the current block number
    const currentBlock = await provider.getBlockNumber();

    // Get the job addresses and network names
    const jobs: string[] = await Promise.all(
        Array.from({ length: parseInt(numJobs) }).map((_, i) => sequencerContract.jobAt(i))
    );
    // Get the network names
    const networks: string[] = await Promise.all(
        Array.from({ length: parseInt(numNetworks) }).map((_, i) => sequencerContract.networkAt(i))
    );

    // Loop through each job and network
    for(const job of jobs) {
      // Get the job address
      const jobAddress: string = job;
      console.log(`Checking job ${jobAddress}`);
      for(const network of networks) {
        console.log(`Checking network ${network}`);
        
        // Get the workable status of the job
        const workableStatus = await getWorkableJobStatus(jobAddress, network, currentBlock);
        console.log(`Workable status: ${JSON.stringify(workableStatus)}`);
        
        // Send an alert if the job hasn't been worked for the past 10 consequent blocks
        if(workableStatus && workableStatus.canWork && workableStatus.events.length === 0) {
          console.log(`Job ${jobAddress} hasn’t been worked for the past 10 consequent blocks on network ${network}`)
          await sendDiscordAlert(`Job ${jobAddress} hasn’t been worked for the past 10 consequent blocks on network ${network}`);
        }
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify('Lambda handler executed successfully')
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: (error as Error).message
    }
  }
}
