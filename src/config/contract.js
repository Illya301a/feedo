export const AMOY_CHAIN_ID = 80002
export const AMOY_CHAIN_ID_HEX = '0x13882'
export const AMOY_RPC_URL =
  import.meta.env.VITE_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/'
export const AMOY_EXPLORER_URL = 'https://amoy.polygonscan.com'
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''
export const CONTRACT_START_BLOCK = Number(
  import.meta.env.VITE_CONTRACT_START_BLOCK || 0,
)

export const IS_CONTRACT_CONFIGURED = /^0x[a-fA-F0-9]{40}$/.test(
  CONTRACT_ADDRESS,
)

// Replace event definitions if the deployed contract uses a different shape.
export const FEEDO_ABI = [
  'function consumers(address consumer) view returns (uint256)',
  'function subsidyPoolBalance() view returns (uint256)',
  'function subsidyPool() view returns (uint256)',
  'function Deposit() payable',
  'function deposit() payable',
  'event PackagePurchased(address indexed consumer, uint256 amount, uint256 queryCredits, uint256 whaleTax)',
  'event RewardsDistributed(address indexed consumer, uint256 totalAmount, uint256 whaleTax, uint256 providerCount)',
]

export const MOCK_STATS = {
  tvl: 2841.76,
  subsidyPool: 142.09,
  totalQueries: 1847293,
}

export const MOCK_TRANSACTIONS = [
  {
    type: 'PAYOUT',
    description: 'AI Agent 0x71C...8D2 paid 0.0084 POL to 4 Data Providers',
    whaleTax: '0.00042',
    hash: '0x3a7cb9a12290d855b2e6603e8b07ea417472d70976e16405cbb8315ff0318a0d',
    time: '12 seconds ago',
  },
  {
    type: 'DEPOSIT',
    description: 'Consumer 0x9F2...1A7 purchased 2,000 query credits',
    whaleTax: '0.00500',
    hash: '0x94c7242f40d39bb45c87d0af445b3a3525c5a242fb03e95a7c85f3b5f520da1b',
    time: '34 seconds ago',
  },
  {
    type: 'PAYOUT',
    description: 'AI Agent 0x4B8...C91 paid 0.0041 POL to 3 Data Providers',
    whaleTax: '0.00020',
    hash: '0xa7b441e870a237d36842651410524e2fe470c8f56917987b8e325f340781af20',
    time: '1 minute ago',
  },
  {
    type: 'DEPOSIT',
    description: 'Consumer 0x2E5...7F4 purchased 10,000 query credits',
    whaleTax: '0.02500',
    hash: '0x8c9641d0938c55b14b4a2e0907424db0dffcd8258ca6144f1ec26c512b174de9',
    time: '3 minutes ago',
  },
]
