import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  Database,
  ExternalLink,
  Fuel,
  LoaderCircle,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AMOY_EXPLORER_URL, IS_CONTRACT_CONFIGURED } from './config/contract'
import { useFeedoContract } from './hooks/useFeedoContract'

const formatAddress = (address) =>
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

const formatNumber = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)

function Logo() {
  return (
    <a className="brand" href="#" aria-label="Feedo home">
      <span className="brand-mark">
        <img src="/feedo-mark.png" alt="" />
      </span>
      <span>feedo</span>
    </a>
  )
}

function NetworkPill() {
  return (
    <div className="network-pill">
      <span className="status-dot" />
      Polygon Amoy
      <ChevronDown size={14} />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, suffix, detail, accent, loading }) {
  return (
    <article className={`stat-card cursor-glow ${accent}`}>
      <span className="cursor-spotlight" />
      <div className="stat-top">
        <span className="stat-icon">
          <Icon size={20} />
        </span>
        <span className="live-label">
          <span className="live-dot" />
          LIVE
        </span>
      </div>
      <p className="stat-label">{label}</p>
      {loading ? (
        <div className="skeleton stat-skeleton" />
      ) : (
        <h3>
          {value}
          {suffix && <span>{suffix}</span>}
        </h3>
      )}
      <p className="stat-detail">{detail}</p>
      <div className="stat-glow" />
    </article>
  )
}

function InteractiveDataCore() {
  return (
    <div className="interactive-core">
      <div className="core-ambient" />
      <div className="core-orbit core-orbit-one" />
      <div className="core-orbit core-orbit-two" />
      <div className="core-layer core-layer-top" />
      <div className="core-layer core-layer-middle" />
      <div className="core-layer core-layer-bottom" />
      <span className="core-node core-node-one" />
      <span className="core-node core-node-two" />
      <span className="core-node core-node-three" />
      <span className="core-node core-node-four" />
    </div>
  )
}

function Toast({ toast, onClose }) {
  if (!toast) return null

  const success = toast.type === 'success'
  return (
    <div className={`toast ${success ? 'success' : 'error'}`} role="status">
      <span className="toast-icon">
        {success ? <Check size={17} /> : <X size={17} />}
      </span>
      <div>
        <strong>{success ? 'Transaction confirmed' : 'Something went wrong'}</strong>
        <p>{toast.message}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Close notification">
        <X size={16} />
      </button>
    </div>
  )
}

function App() {
  const [amount, setAmount] = useState('0.05')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const {
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
    clearToast,
  } = useFeedoContract()

  const estimatedQueries = useMemo(() => {
    const parsed = Number(amount)
    return Number.isFinite(parsed) ? Math.floor(parsed / 0.0005) : 0
  }, [amount])

  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.14 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handlePointerMove = (event) => {
      const card = event.target.closest?.('.cursor-glow')
      if (!card) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
      card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
      card.style.setProperty('--spotlight-opacity', '1')
    }

    const handlePointerOut = (event) => {
      const card = event.target.closest?.('.cursor-glow')
      if (card && !card.contains(event.relatedTarget)) {
        card.style.setProperty('--spotlight-opacity', '0')
      }
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerout', handlePointerOut)

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerout', handlePointerOut)
    }
  }, [])

  const handleDeposit = async () => {
    if (!account) {
      await connectWallet()
      return
    }
    await deposit(amount)
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="container nav-wrap">
          <Logo />
          <nav className={mobileMenuOpen ? 'nav-links open' : 'nav-links'}>
            <a className="active" href="#explorer">Explorer</a>
            <a href="#gateway">Gateway</a>
            <a href="#transactions">Transactions</a>
            <a href="https://docs.polygon.technology/" target="_blank" rel="noreferrer">
              Docs <ArrowUpRight size={13} />
            </a>
          </nav>
          <div className="nav-actions">
            <NetworkPill />
            <button className="wallet-button compact" type="button" onClick={connectWallet}>
              {isConnecting ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Wallet size={17} />
              )}
              {account ? formatAddress(account) : 'Connect Wallet'}
            </button>
            <button
              className="menu-button"
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section container" id="explorer">
          <div className="hero-copy">
            <div className="eyebrow">
              <span><Sparkles size={14} /></span>
              The semantic data layer for Web3
            </div>
            <h1>
              Open data.
              <br />
              <span>Shared value.</span>
            </h1>
            <p>
              Explore the live economy powering intelligent data across the
              decentralized web.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#gateway">
                Open Payment Gateway <ArrowUpRight size={17} />
              </a>
              <a className="text-button" href="#transactions">
                <Activity size={17} /> View live activity
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-pulse pulse-one" />
            <div className="visual-pulse pulse-two" />
            <div className="hero-image-wrap">
              <InteractiveDataCore />
              <div className="layer-label label-top">
                <Database size={14} /> Semantic index
              </div>
              <div className="layer-label label-bottom">
                <Zap size={14} /> Live data grid
              </div>
            </div>
            <span className="data-node node-one" />
            <span className="data-node node-two" />
            <span className="data-node node-three" />
            <span className="data-node node-four" />
          </div>
        </section>

        <section className="stats-section container reveal-section" aria-labelledby="network-heading" data-reveal>
          <div className="section-heading">
            <div>
              <p className="section-kicker">Network overview</p>
              <h2 id="network-heading">Protocol at a glance</h2>
            </div>
            <div className="updated-label">
              <Activity size={15} /> Updated live from Polygon
            </div>
          </div>
          <div className="stats-grid">
            <StatCard
              icon={CircleDollarSign}
              label="Total Value Locked"
              value={formatNumber(stats.tvl)}
              suffix="POL"
              detail="Available consumer deposits"
              accent="purple"
              loading={isLoading}
            />
            <StatCard
              icon={ShieldCheck}
              label="Subsidy Pool"
              value={formatNumber(stats.subsidyPool)}
              suffix="POL"
              detail="Funding the next generation"
              accent="blue"
              loading={isLoading}
            />
            <StatCard
              icon={Search}
              label="Queries Processed"
              value={formatNumber(stats.totalQueries)}
              detail="+12.8% over the last 24 hours"
              accent="cyan"
              loading={isLoading}
            />
          </div>
        </section>

        <section className="gateway-section container reveal-section" id="gateway" data-reveal>
          <div className="gateway-panel cursor-glow">
            <span className="cursor-spotlight" />
            <div className="gateway-copy">
              <p className="section-kicker">Payment gateway</p>
              <h2>Power your agents with<br />open intelligence.</h2>
              <p className="gateway-description">
                Deposit POL, receive query credits, and access the decentralized
                data layer. No subscriptions. Pay only for what you use.
              </p>
              <div className="benefit-list">
                <div><Check size={15} /> Instant onchain settlement</div>
                <div><Check size={15} /> Transparent usage pricing</div>
                <div><Check size={15} /> Direct rewards to data providers</div>
              </div>
              <div className="price-note">
                <Fuel size={17} />
                <span><strong>1 query = 0.0005 POL</strong> Network fees excluded</span>
              </div>
            </div>

            <div className="purchase-card cursor-glow">
              <span className="cursor-spotlight" />
              <div className="purchase-header">
                <div>
                  <span>YOUR FEEDO BALANCE</span>
                  {account ? (
                    <h3>{formatNumber(balance)} <small>POL</small></h3>
                  ) : (
                    <h3 className="muted-balance">-- <small>POL</small></h3>
                  )}
                </div>
                <span className="wallet-orb"><Wallet size={20} /></span>
              </div>

              {account && (
                <div className="account-row">
                  <span className="status-dot" />
                  {formatAddress(account)}
                  <span>Connected</span>
                </div>
              )}

              <label htmlFor="deposit-amount">Deposit amount</label>
              <div className="amount-input">
                <input
                  id="deposit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                />
                <span>POL</span>
              </div>
              <div className="quick-amounts">
                {['0.01', '0.05', '0.10', '0.50'].map((quickAmount) => (
                  <button
                    className={amount === quickAmount ? 'selected' : ''}
                    type="button"
                    onClick={() => setAmount(quickAmount)}
                    key={quickAmount}
                  >
                    {quickAmount}
                  </button>
                ))}
              </div>

              <div className="estimate-row">
                <span>Estimated query credits</span>
                <strong>~{formatNumber(estimatedQueries)} queries</strong>
              </div>

              <button
                className="deposit-button"
                type="button"
                onClick={handleDeposit}
                disabled={isConnecting || isDepositing || !Number(amount)}
              >
                {isConnecting || isDepositing ? (
                  <>
                    <LoaderCircle className="spin" size={19} />
                    {isDepositing ? 'Confirming transaction...' : 'Connecting wallet...'}
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    {account ? 'Deposit / Purchase Package' : 'Connect wallet to deposit'}
                  </>
                )}
              </button>
              <p className="secure-note"><ShieldCheck size={14} /> Secured by Polygon Amoy</p>
            </div>
          </div>
        </section>

        <section className="transactions-section container reveal-section" id="transactions" data-reveal>
          <div className="section-heading">
            <div>
              <p className="section-kicker">Onchain transparency</p>
              <h2>Live transaction feed</h2>
            </div>
            <a href={AMOY_EXPLORER_URL} target="_blank" rel="noreferrer">
              View on PolygonScan <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Event description</th>
                  <th>Whale tax</th>
                  <th>Tx hash</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index}>
                      <td><div className="skeleton table-skeleton short" /></td>
                      <td><div className="skeleton table-skeleton long" /></td>
                      <td><div className="skeleton table-skeleton medium" /></td>
                      <td><div className="skeleton table-skeleton short" /></td>
                    </tr>
                  ))
                  : transactions.map((transaction) => (
                    <tr key={transaction.hash}>
                      <td>
                        <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                          {transaction.type === 'DEPOSIT'
                            ? <ArrowUpRight size={13} />
                            : <Zap size={13} />}
                          {transaction.type}
                        </span>
                      </td>
                      <td>
                        <p className="event-description">{transaction.description}</p>
                        <span className="event-time">{transaction.time}</span>
                      </td>
                      <td className="mono">{transaction.whaleTax} POL</td>
                      <td>
                        <a
                          className="hash-link"
                          href={`${AMOY_EXPLORER_URL}/tx/${transaction.hash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {formatAddress(transaction.hash)} <ExternalLink size={13} />
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span><span className="live-dot" /> Listening for new events</span>
            {!IS_CONTRACT_CONFIGURED && <span>Preview data</span>}
          </div>
        </section>
      </main>

      <footer className="reveal-section" data-reveal>
        <div className="container footer-inner">
          <Logo />
          <a
            className="made-by"
            href="https://linkedin.com/in/illiaandreluka"
            target="_blank"
            rel="noreferrer"
          >
            Made with <span className="heart">♥</span> by Andreluka Illia
          </a>
          <div>
            <a href="#explorer">Status</a>
            <a href="https://docs.polygon.technology/" target="_blank" rel="noreferrer">Docs</a>
            <span>© 2026 Feedo</span>
          </div>
        </div>
      </footer>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  )
}

export default App
