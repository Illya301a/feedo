import { BrowserProvider, Contract, JsonRpcProvider, formatEther, parseEther } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import {
  AMOY_CHAIN_ID,
  AMOY_CHAIN_ID_HEX,
  AMOY_EXPLORER_URL,
  AMOY_RPC_URL,
  CONTRACT_ADDRESS,
  CONTRACT_START_BLOCK,
  FEEDO_ABI,
  IS_CONTRACT_CONFIGURED,
  MOCK_STATS,
  MOCK_TRANSACTIONS,
} from '../config/contract'

const POL_PER_QUERY = 0.0005

const readConsumerBalance = (result) => {
  if (typeof result === 'bigint') return result
  if (Array.isArray(result)) {
    return result.find((value) => typeof value === 'bigint') ?? 0n
  }
  return 0n
}

const getErrorMessage = (error) => {
  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
    return 'The request was rejected in your wallet.'
  }
  return error?.shortMessage || error?.reason || error?.message || 'Unknown wallet error.'
}

const relativeTime = (timestamp) => {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return `${seconds} seconds ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  return `${Math.floor(seconds / 3600)} hours ago`
}

const normalizeEvent = (log) => {
  const isDeposit = log.fragment?.name === 'PackagePurchased'
  const args = log.args || []
  const consumer = args.consumer || args[0] || '0x0000000000000000000000000000000000000000'
  const amount = args.amount || args.totalAmount || args[1] || 0n
  const whaleTax = args.whaleTax || args[3] || args[2] || 0n
  const providerCount = Number(args.providerCount || args[3] || 0)
  const queryCredits = Number(args.queryCredits || args[2] || 0)
  const shortAddress = `${consumer.slice(0, 5)}...${consumer.slice(-3)}`

  return {
    type: isDeposit ? 'DEPOSIT' : 'PAYOUT',
    description: isDeposit
      ? `Consumer ${shortAddress} purchased ${queryCredits.toLocaleString()} query credits`
      : `AI Agent ${shortAddress} paid ${formatEther(amount)} POL to ${providerCount} Data Providers`,
    whaleTax: Number(formatEther(whaleTax)).toFixed(5),
    hash: log.transactionHash,
    time: 'Just now',
    blockNumber: log.blockNumber,
  }
}

export function useFeedoContract() {
  const [account, setAccount] = useState('')
  const [balance, setBalance] = useState(0)
  const [stats, setStats] = useState(MOCK_STATS)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [toast, setToast] = useState(null)

  const loadPublicData = useCallback(async () => {
    setIsLoading(true)

    if (!IS_CONTRACT_CONFIGURED) {
      await new Promise((resolve) => setTimeout(resolve, 700))
      setStats(MOCK_STATS)
      setTransactions(MOCK_TRANSACTIONS)
      setIsLoading(false)
      return
    }

    try {
      const provider = new JsonRpcProvider(AMOY_RPC_URL, AMOY_CHAIN_ID)
      const contract = new Contract(CONTRACT_ADDRESS, FEEDO_ABI, provider)
      const latestBlock = await provider.getBlockNumber()
      const fromBlock = CONTRACT_START_BLOCK || Math.max(0, latestBlock - 49_999)

      const [contractBalance, rewards, deposits] = await Promise.all([
        provider.getBalance(CONTRACT_ADDRESS),
        contract.queryFilter(contract.filters.RewardsDistributed(), fromBlock),
        contract.queryFilter(contract.filters.PackagePurchased(), fromBlock),
      ])

      let subsidy = 0n
      try {
        subsidy = await contract.subsidyPoolBalance()
      } catch {
        subsidy = await contract.subsidyPool()
      }

      const logs = [...rewards, ...deposits]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, 12)

      const blockTimestamps = new Map()
      const mappedTransactions = await Promise.all(
        logs.map(async (log) => {
          if (!blockTimestamps.has(log.blockNumber)) {
            const block = await provider.getBlock(log.blockNumber)
            blockTimestamps.set(log.blockNumber, Number(block.timestamp) * 1000)
          }
          return {
            ...normalizeEvent(log),
            time: relativeTime(blockTimestamps.get(log.blockNumber)),
          }
        }),
      )

      setStats({
        tvl: Number(formatEther(contractBalance)),
        subsidyPool: Number(formatEther(subsidy)),
        totalQueries: rewards.length,
      })
      setTransactions(mappedTransactions)
    } catch (error) {
      setToast({ type: 'error', message: `Could not read contract data: ${getErrorMessage(error)}` })
      setStats(MOCK_STATS)
      setTransactions(MOCK_TRANSACTIONS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshBalance = useCallback(async (walletAddress, provider) => {
    if (!walletAddress) return

    if (!IS_CONTRACT_CONFIGURED) {
      setBalance(0.62)
      return
    }

    const contract = new Contract(CONTRACT_ADDRESS, FEEDO_ABI, provider)
    const consumer = await contract.consumers(walletAddress)
    setBalance(Number(formatEther(readConsumerBalance(consumer))))
  }, [])

  const ensureAmoyNetwork = async () => {
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
    if (currentChainId === AMOY_CHAIN_ID_HEX) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AMOY_CHAIN_ID_HEX }],
      })
    } catch (error) {
      if (error.code !== 4902) throw error
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: AMOY_CHAIN_ID_HEX,
          chainName: 'Polygon Amoy Testnet',
          nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
          rpcUrls: [AMOY_RPC_URL],
          blockExplorerUrls: [AMOY_EXPLORER_URL],
        }],
      })
    }
  }

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setToast({ type: 'error', message: 'MetaMask was not found. Install the extension to continue.' })
      return
    }

    setIsConnecting(true)
    try {
      await ensureAmoyNetwork()
      const provider = new BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const walletAddress = accounts[0]
      setAccount(walletAddress)
      await refreshBalance(walletAddress, provider)
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsConnecting(false)
    }
  }, [refreshBalance])

  const deposit = useCallback(async (amount) => {
    if (!account || !window.ethereum) return
    if (!amount || Number(amount) <= 0) {
      setToast({ type: 'error', message: 'Enter a valid deposit amount.' })
      return
    }
    if (!IS_CONTRACT_CONFIGURED) {
      setToast({
        type: 'error',
        message: 'Preview mode is active. Add VITE_CONTRACT_ADDRESS to enable deposits.',
      })
      return
    }

    setIsDepositing(true)
    try {
      await ensureAmoyNetwork()
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new Contract(CONTRACT_ADDRESS, FEEDO_ABI, signer)
      let transaction

      try {
        transaction = await contract.Deposit({ value: parseEther(amount) })
      } catch (error) {
        const missingMethod = error?.code === 'CALL_EXCEPTION' && !error?.data
        if (!missingMethod) throw error
        transaction = await contract.deposit({ value: parseEther(amount) })
      }

      await transaction.wait()
      await Promise.all([
        refreshBalance(account, provider),
        loadPublicData(),
      ])
      setToast({
        type: 'success',
        message: `${amount} POL deposited. Approximately ${Math.floor(Number(amount) / POL_PER_QUERY).toLocaleString()} query credits added.`,
      })
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsDepositing(false)
    }
  }, [account, loadPublicData, refreshBalance])

  useEffect(() => {
    const initialLoad = window.setTimeout(loadPublicData, 0)
    return () => window.clearTimeout(initialLoad)
  }, [loadPublicData])

  useEffect(() => {
    if (!window.ethereum) return undefined

    const handleAccountsChanged = async (accounts) => {
      const nextAccount = accounts[0] || ''
      setAccount(nextAccount)
      if (!nextAccount) {
        setBalance(0)
        return
      }
      const provider = new BrowserProvider(window.ethereum)
      await refreshBalance(nextAccount, provider)
    }

    const handleChainChanged = () => window.location.reload()
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [refreshBalance])

  useEffect(() => {
    if (!IS_CONTRACT_CONFIGURED) return undefined
    const interval = window.setInterval(loadPublicData, 20_000)
    return () => window.clearInterval(interval)
  }, [loadPublicData])

  return {
    account,
    balance,
    connectWallet,
    deposit,
    isConnecting,
    isDepositing,
    isLoading,
    stats,
    transactions,
    toast,
    clearToast: () => setToast(null),
  }
}
