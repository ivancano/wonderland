// Description: This file contains the ABIs for the contracts in the Wonderland Lambda system.

export const sequencerABI = [
    'function numJobs() external view returns (uint256)',
    'function numNetworks() external view returns (uint256)',
    'function jobAt(uint256 index) public view returns (address)',
    'function networkAt(uint256 index) public view returns (bytes32)',
    'function windows(bytes32 network) public view returns (tuple(uint256 start, uint256 length))',
    'function getNextJobs(bytes32 network) external returns (tuple(address job, bool canWork, bytes args)[])',
    'function getMaster() external view returns (bytes32)',
];

export const jobABI = [
    'function workable(bytes32 network) external view override returns (bool, bytes memory)',
    'function work(bytes32 network, bytes calldata) external',
];
