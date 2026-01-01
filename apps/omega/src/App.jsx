import React, { useState, useEffect, useCallback } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import * as api from './api';

const OMEGA_PASSWORD = import.meta.env.VITE_OMEGA_ACCESS_CODE || 'dynasty2026';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === OMEGA_PASSWORD) {
      sessionStorage.setItem('omega_auth', 'true');
      onLogin();
    } else {
      setError('Access denied. Invalid credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128081;</div>
        <h1 className="login-title">Omega Portal</h1>
        <p className="login-subtitle">Borders Dynasty Command Center</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Access Code</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter omega access code"
              autoFocus
            />
          </div>
          {error && <div className="alert alert-warning">{error}</div>}
          <button type="submit" className="btn btn-primary login-btn">
            Access Command Center
          </button>
        </form>
      </div>
    </div>
  );
}

function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '&#128200;' },
    { path: '/intel', label: 'Live Intel', icon: '&#128225;' },
    { path: '/loads', label: 'Loads', icon: '&#128230;' },
    { path: '/drivers', label: 'Drivers', icon: '&#128666;' },
    { path: '/contracts', label: 'Contracts', icon: '&#128196;' },
    { path: '/treasury', label: 'Treasury', icon: '&#128176;' },
    { path: '/ops', label: 'Ops Control', icon: '&#9881;' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">&#128081;</div>
        <span className="logo-text">OMEGA</span>
      </div>
      <nav className="nav-section">
        <div className="nav-section-title">Command</div>
        {navItems.map(item => (
          <Link key={item.path} href={item.path}>
            <a className={`nav-item ${location === item.path ? 'active' : ''}`}>
              <span dangerouslySetInnerHTML={{ __html: item.icon }} />
              {item.label}
            </a>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function AIHelper({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome, Sovereign. I am your AI advisor for Dynasty operations. How may I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isOpen && !data) {
      Promise.all([
        api.fetchOmegaView(),
        api.fetchOpsStatus(),
        api.fetchLoads()
      ]).then(([omega, ops, loads]) => {
        setData({ omega, ops, loads });
      });
    }
  }, [isOpen, data]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    let response = '';

    if (userMsg.includes('status') || userMsg.includes('overview')) {
      const omega = data?.omega;
      response = `Current status:\n- Total loads: ${omega?.loadStats?.total || 0}\n- Escrow balance: $${omega?.treasuryStats?.escrowBalance || 0}\n- Active credit lines: ${omega?.creditStats?.activeLines || 0}\n- Available credit: $${omega?.creditStats?.totalAvailable || 0}`;
    } else if (userMsg.includes('suggest') || userMsg.includes('driver')) {
      const loads = data?.loads || [];
      const unassigned = loads.filter(l => l.status === 'CREATED');
      if (unassigned.length > 0) {
        const suggestions = await api.fetchDispatchSuggestions(unassigned[0].id);
        if (suggestions.topPick) {
          response = `For load ${unassigned[0].origin} to ${unassigned[0].destination}, I recommend ${suggestions.topPick.driverName} (score: ${suggestions.topPick.score}). Reason: ${suggestions.topPick.factors.map(f => f.factor).join(', ')}`;
        } else {
          response = 'No driver suggestions available. Register more drivers first.';
        }
      } else {
        response = 'No unassigned loads at this time.';
      }
    } else if (userMsg.includes('launch') || userMsg.includes('activate')) {
      const ops = data?.ops;
      const inactiveRegions = Object.entries(ops?.regions || {}).filter(([_, v]) => !v.active).map(([k]) => k);
      response = `Launch readiness:\n- Inactive regions: ${inactiveRegions.join(', ') || 'All activated'}\n- Use the Ops Control panel to activate regions or trigger staged launch.`;
    } else if (userMsg.includes('credit') || userMsg.includes('advance')) {
      response = 'Credit system is active. Drivers can request advances up to 40% of their credit limit. All advances are auto-repaid from delivery payouts.';
    } else {
      response = 'I can help with: system status, driver suggestions, launch planning, and credit management. What would you like to know?';
    }

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
  };

  if (!isOpen) return null;

  return (
    <div className={`ai-panel ${isOpen ? 'open' : ''}`}>
      <div className="ai-header">
        <div className="ai-title">
          <span>&#129302;</span> AI Advisor
        </div>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role}`}>
            {msg.content.split('\n').map((line, j) => <div key={j}>{line}</div>)}
          </div>
        ))}
      </div>
      <div className="ai-input-area">
        <input
          className="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask your AI advisor..."
        />
      </div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [omega, ops, health] = await Promise.all([
        api.fetchOmegaView(),
        api.fetchOpsView(),
        api.fetchHealth()
      ]);
      setData({ omega, ops, health });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) return <div className="main-content"><p>Loading command center...</p></div>;

  const { omega, ops } = data || {};

  return (
    <div className="main-content">
      <div className="header">
        <h1 className="page-title">Dynasty Command Center</h1>
        <div className="header-actions">
          <span className="status-badge status-active">LIVE</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Loads</div>
          <div className="stat-value">{omega?.loadStats?.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Escrow Balance</div>
          <div className="stat-value">${omega?.treasuryStats?.escrowBalance || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Credit Lines</div>
          <div className="stat-value">{omega?.creditStats?.activeLines || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Available Credit</div>
          <div className="stat-value">${omega?.creditStats?.totalAvailable || 0}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/loads">
              <a className="quick-action">
                <div className="action-icon">&#128230;</div>
                <div className="action-text">
                  <h4>Manage Loads</h4>
                  <p>View and dispatch freight</p>
                </div>
              </a>
            </Link>
            <Link href="/drivers">
              <a className="quick-action">
                <div className="action-icon">&#128666;</div>
                <div className="action-text">
                  <h4>Driver Command</h4>
                  <p>Manage fleet and credit</p>
                </div>
              </a>
            </Link>
            <Link href="/ops">
              <a className="quick-action">
                <div className="action-icon">&#127759;</div>
                <div className="action-text">
                  <h4>Launch Control</h4>
                  <p>Activate modes and regions</p>
                </div>
              </a>
            </Link>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">System Alerts</h3>
          </div>
          {ops?.alerts?.length > 0 ? (
            ops.alerts.slice(0, 5).map((alert, i) => (
              <div key={i} className={`alert alert-${alert.level.toLowerCase()}`}>
                {alert.message}
              </div>
            ))
          ) : (
            <div className="alert alert-success">All systems nominal</div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Mode Status</h3>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {Object.entries(ops?.opsStatus?.modes || {}).map(([mode, status]) => (
            <div key={mode} className="mode-toggle">
              <span>{mode}</span>
              <div className={`toggle-switch ${status.active ? 'active' : ''}`} />
              <span style={{ fontSize: '12px', color: status.ready ? '#10b981' : '#6b7280' }}>
                {status.ready ? 'Ready' : 'Not Ready'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadsPage() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchLoads().then(data => {
      setLoads(data);
      setLoading(false);
    });
  }, []);

  const handleDelivered = async (loadId) => {
    await api.markDelivered(loadId);
    const updated = await api.fetchLoads();
    setLoads(updated);
  };

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="header">
        <h1 className="page-title">Load Management</h1>
      </div>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Route</th>
              <th>Mode</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loads.map(load => (
              <tr key={load.id}>
                <td>{load.id.slice(0, 8)}</td>
                <td>{load.origin} → {load.destination}</td>
                <td>{load.mode}</td>
                <td>${load.budgetAmount}</td>
                <td><span className={`status-badge status-${load.status.toLowerCase().replace('_', '-')}`}>{load.status}</span></td>
                <td>
                  {load.status === 'IN_TRANSIT' && (
                    <button className="btn btn-primary" onClick={() => handleDelivered(load.id)}>
                      Mark Delivered
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {loads.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No loads yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [creditLines, setCreditLines] = useState([]);

  useEffect(() => {
    Promise.all([
      api.fetchDrivers(),
      api.fetchCreditLines()
    ]).then(([d, c]) => {
      setDrivers(d || []);
      setCreditLines(c || []);
    });
  }, []);

  return (
    <div className="main-content">
      <div className="header">
        <h1 className="page-title">Driver Command</h1>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Drivers</div>
          <div className="stat-value">{drivers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Credit Lines</div>
          <div className="stat-value">{creditLines.filter(c => c.status === 'ACTIVE').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Credit Limit</div>
          <div className="stat-value">${creditLines.reduce((sum, c) => sum + c.limit, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Credit Available</div>
          <div className="stat-value">${creditLines.reduce((sum, c) => sum + c.available, 0)}</div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Driver Fleet</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Home Base</th>
              <th>Equipment</th>
              <th>Loads Completed</th>
              <th>Credit Tier</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => {
              const credit = creditLines.find(c => c.driverId === driver.driverId);
              return (
                <tr key={driver.driverId}>
                  <td>{driver.driverId}</td>
                  <td>{driver.name}</td>
                  <td>{driver.homeBase}</td>
                  <td>{driver.equipment}</td>
                  <td>{driver.loadsCompleted}</td>
                  <td><span className="status-badge status-active">{credit?.tier || 'STANDARD'}</span></td>
                </tr>
              );
            })}
            {drivers.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No drivers registered</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContractsPage() {
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    api.fetchContracts().then(setContracts);
  }, []);

  return (
    <div className="main-content">
      <div className="header">
        <h1 className="page-title">Contracts</h1>
      </div>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Load</th>
              <th>Driver</th>
              <th>Amount</th>
              <th>Dynasty Fee</th>
              <th>Driver Payout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.loadId.slice(0, 8)}</td>
                <td>{c.driverId}</td>
                <td>${c.amount}</td>
                <td>${c.dynastyFee}</td>
                <td>${c.driverPayout}</td>
                <td><span className={`status-badge status-${c.status.toLowerCase()}`}>{c.status}</span></td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No contracts yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TreasuryPage() {
  const [treasury, setTreasury] = useState(null);

  useEffect(() => {
    api.fetchTreasury().then(setTreasury);
  }, []);

  return (
    <div className="main-content">
      <div className="header">
        <h1 className="page-title">Treasury</h1>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Escrow Balance</div>
          <div className="stat-value">${treasury?.escrowBalance || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Dynasty Revenue</div>
          <div className="stat-value">${treasury?.dynastyRevenue || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Payouts Issued</div>
          <div className="stat-value">{treasury?.payoutCount || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">BSC Contract</div>
          <div className="stat-value" style={{ fontSize: '14px' }}>0x12ef...817c</div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Treasury Configuration</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '4px' }}>Dynasty Fee</div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>5%</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '4px' }}>Driver Share</div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>95%</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '4px' }}>Escrow Wallet</div>
            <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>0xE89fDED72D0D83De3421C6642FA035ebE197804f</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '4px' }}>Network</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>Sepolia Testnet</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntelPage() {
  const [intel, setIntel] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadIntel = useCallback(async () => {
    try {
      const [allIntel, alertData] = await Promise.all([
        api.fetchAllIntel(),
        api.fetchIntelAlerts(20)
      ]);
      setIntel(allIntel);
      setAlerts(alertData.alerts || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load intel', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntel();
    const interval = setInterval(loadIntel, 30000);
    return () => clearInterval(interval);
  }, [loadIntel]);

  if (loading) return <div className="main-content"><p>Loading live intelligence...</p></div>;

  const marketIntel = intel?.intel?.['freight-rates'];
  const fuelIntel = intel?.intel?.['fuel-prices'];
  const weatherIntel = intel?.intel?.['weather'];
  const trafficIntel = intel?.intel?.['traffic'];
  const portIntel = intel?.intel?.['port-status'];
  const demandIntel = intel?.intel?.['demand-signals'];
  const partnerIntel = intel?.intel?.['partner-boards'];
  const status = intel?.status;

  return (
    <div className="main-content">
      <div className="header">
        <h1 className="page-title">Live Intelligence</h1>
        <div className="header-actions">
          <span className="status-badge status-active">LIVE</span>
          <span style={{ marginLeft: '12px', fontSize: '12px', color: '#6b7280' }}>
            Last update: {lastUpdate}
          </span>
          <button className="btn btn-secondary" onClick={loadIntel} style={{ marginLeft: '12px' }}>
            Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Orchestrator Runs</div>
          <div className="stat-value">{status?.runCount || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Sources</div>
          <div className="stat-value">{Object.keys(status?.sourceHealth || {}).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Alerts</div>
          <div className="stat-value">{alerts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cache Age</div>
          <div className="stat-value">{marketIntel?.cacheAge || 0}s</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Active Alerts</h3>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {alerts.slice(0, 10).map((alert, i) => (
              <div key={i} className={`alert alert-${alert.severity?.toLowerCase() === 'warning' ? 'warning' : 'info'}`}>
                <strong>[{alert.sourceId}]</strong> {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Freight Rates</h3>
          </div>
          {marketIntel?.metrics?.rates ? (
            <table className="table">
              <thead>
                <tr><th>Region</th><th>Ground</th><th>Air</th><th>Ocean</th><th>Courier</th></tr>
              </thead>
              <tbody>
                {Object.entries(marketIntel.metrics.rates).map(([region, modes]) => (
                  <tr key={region}>
                    <td>{region.replace('_', ' ')}</td>
                    <td style={{ color: modes.GROUND?.trend === 'UP' ? '#ef4444' : modes.GROUND?.trend === 'DOWN' ? '#10b981' : '#6b7280' }}>
                      ${modes.GROUND?.current} {modes.GROUND?.trend === 'UP' ? '\u2191' : modes.GROUND?.trend === 'DOWN' ? '\u2193' : '-'}
                    </td>
                    <td style={{ color: modes.AIR?.trend === 'UP' ? '#ef4444' : modes.AIR?.trend === 'DOWN' ? '#10b981' : '#6b7280' }}>
                      ${modes.AIR?.current} {modes.AIR?.trend === 'UP' ? '\u2191' : modes.AIR?.trend === 'DOWN' ? '\u2193' : '-'}
                    </td>
                    <td style={{ color: modes.OCEAN?.trend === 'UP' ? '#ef4444' : modes.OCEAN?.trend === 'DOWN' ? '#10b981' : '#6b7280' }}>
                      ${modes.OCEAN?.current} {modes.OCEAN?.trend === 'UP' ? '\u2191' : modes.OCEAN?.trend === 'DOWN' ? '\u2193' : '-'}
                    </td>
                    <td style={{ color: modes.COURIER?.trend === 'UP' ? '#ef4444' : modes.COURIER?.trend === 'DOWN' ? '#10b981' : '#6b7280' }}>
                      ${modes.COURIER?.current} {modes.COURIER?.trend === 'UP' ? '\u2191' : modes.COURIER?.trend === 'DOWN' ? '\u2193' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No rate data available</p>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Fuel Prices</h3>
          </div>
          {fuelIntel?.metrics?.prices ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {Object.entries(fuelIntel.metrics.prices).map(([fuel, data]) => (
                <div key={fuel} style={{ padding: '16px', background: '#1e1e3f', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{fuel}</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: data.trend === 'UP' ? '#ef4444' : data.trend === 'DOWN' ? '#10b981' : '#fff' }}>
                    ${data.current}
                    <span style={{ fontSize: '14px', marginLeft: '8px' }}>
                      {data.trend === 'UP' ? '\u2191' : data.trend === 'DOWN' ? '\u2193' : '-'} {data.change24h}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No fuel data available</p>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Partner Loadboards</h3>
          </div>
          {partnerIntel?.metrics?.partners ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {partnerIntel.metrics.partners.map((partner, i) => (
                <div key={i} style={{ padding: '12px', background: '#1e1e3f', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{partner.name}</div>
                  <div className={`status-badge status-${partner.status.toLowerCase()}`} style={{ marginTop: '4px' }}>
                    {partner.status}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '600', marginTop: '8px' }}>{partner.contractsAvailable}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>contracts</div>
                </div>
              ))}
            </div>
          ) : (
            <p>No partner data available</p>
          )}
          <div style={{ marginTop: '16px', textAlign: 'center', color: '#6b7280' }}>
            Total Contracts Available: <strong style={{ color: '#fff' }}>{partnerIntel?.metrics?.totalContracts || 0}</strong>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Market Demand</h3>
          </div>
          {demandIntel?.metrics?.demand ? (
            <table className="table">
              <thead>
                <tr><th>Region</th><th>Ground</th><th>Air</th><th>Ocean</th><th>Courier</th></tr>
              </thead>
              <tbody>
                {Object.entries(demandIntel.metrics.demand).map(([region, modes]) => (
                  <tr key={region}>
                    <td>{region.replace('_', ' ')}</td>
                    {['GROUND', 'AIR', 'OCEAN', 'COURIER'].map(mode => (
                      <td key={mode}>
                        <div style={{ 
                          width: '100%', 
                          height: '8px', 
                          background: '#2a2a4a', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${modes[mode]?.demandScore || 0}%`,
                            height: '100%',
                            background: modes[mode]?.demandScore > 70 ? '#10b981' : modes[mode]?.demandScore > 40 ? '#fbbf24' : '#ef4444'
                          }} />
                        </div>
                        <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '2px' }}>{modes[mode]?.demandScore || 0}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No demand data available</p>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Port Status</h3>
        </div>
        {portIntel?.metrics?.ports ? (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {Object.entries(portIntel.metrics.ports).map(([region, ports]) => (
              <div key={region} style={{ flex: '1', minWidth: '200px' }}>
                <h4 style={{ marginBottom: '12px', color: '#6b7280' }}>{region.replace('_', ' ')}</h4>
                {ports.slice(0, 3).map((port, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2a2a4a' }}>
                    <span>{port.name}</span>
                    <span className={`status-badge status-${port.status === 'CONGESTED' ? 'warning' : port.status === 'BUSY' ? 'pending' : 'active'}`}>
                      {port.status} ({port.waitTime}d wait)
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p>No port data available</p>
        )}
      </div>
    </div>
  );
}

function OpsPage() {
  const [ops, setOps] = useState(null);
  const [launching, setLaunching] = useState(false);

  const loadOps = async () => {
    const data = await api.fetchOpsStatus();
    setOps(data);
  };

  useEffect(() => {
    loadOps();
  }, []);

  const toggleMode = async (mode, active) => {
    if (active) {
      await api.deactivateMode(mode);
    } else {
      await api.activateMode(mode);
    }
    loadOps();
  };

  const handleActivateRegion = async (region) => {
    await api.activateRegion(region);
    loadOps();
  };

  const handleStagedLaunch = async (stage) => {
    setLaunching(true);
    await api.stagedLaunch(stage);
    await loadOps();
    setLaunching(false);
  };

  if (!ops) return <div className="main-content"><p>Loading ops...</p></div>;

  const activeModesCount = Object.values(ops.modes || {}).filter(m => m.active).length;
  const activeRegionsCount = Object.values(ops.regions || {}).filter(r => r.active).length;

  return (
    <div className="main-content">
      <div className="header">
        <h1 className="page-title">Ops Control</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => handleStagedLaunch('GLOBAL')} disabled={launching}>
            {launching ? 'Launching...' : 'Global Launch'}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Modes</div>
          <div className="stat-value">{activeModesCount}/4</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Regions</div>
          <div className="stat-value">{activeRegionsCount}/4</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">System Status</div>
          <div className="stat-value" style={{ color: '#10b981' }}>ONLINE</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Launch Stage</div>
          <div className="stat-value">{activeRegionsCount === 4 ? 'GLOBAL' : activeRegionsCount >= 2 ? 'NATIONWIDE' : 'LOCAL'}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Transport Modes</h3>
          </div>
          {Object.entries(ops.modes || {}).map(([mode, status]) => (
            <div key={mode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #2a2a4a' }}>
              <div>
                <div style={{ fontWeight: '600' }}>{mode}</div>
                <div style={{ fontSize: '12px', color: status.ready ? '#10b981' : '#6b7280' }}>
                  {status.ready ? 'Ready' : 'Not Ready'}
                </div>
              </div>
              <div
                className={`toggle-switch ${status.active ? 'active' : ''}`}
                onClick={() => toggleMode(mode, status.active)}
              />
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Regions</h3>
          </div>
          {Object.entries(ops.regions || {}).map(([region, status]) => (
            <div key={region} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #2a2a4a' }}>
              <div>
                <div style={{ fontWeight: '600' }}>{region.replace('_', ' ')}</div>
                <div style={{ fontSize: '12px', color: status.ready ? '#10b981' : '#ef4444' }}>
                  {status.ready ? 'Ready' : 'Not Ready'}
                </div>
              </div>
              {status.active ? (
                <span className="status-badge status-active">ACTIVE</span>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleActivateRegion(region)}
                  disabled={!status.ready}
                >
                  Activate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Staged Launch</h3>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={() => handleStagedLaunch('LOCAL')} disabled={launching}>
            LOCAL (Home Base)
          </button>
          <button className="btn btn-secondary" onClick={() => handleStagedLaunch('NATIONWIDE')} disabled={launching}>
            NATIONWIDE (NA + EU)
          </button>
          <button className="btn btn-primary" onClick={() => handleStagedLaunch('GLOBAL')} disabled={launching}>
            GLOBAL (All Regions)
          </button>
        </div>
        <div className="launch-progress" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Launch Progress</span>
            <span>{Math.round((activeModesCount + activeRegionsCount) / 8 * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(activeModesCount + activeRegionsCount) / 8 * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(sessionStorage.getItem('omega_auth') === 'true');
  const [aiOpen, setAiOpen] = useState(false);

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="portal">
      <Sidebar />
      <div style={{ flex: 1, marginRight: aiOpen ? '400px' : '0', transition: 'margin-right 0.3s' }}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/intel" component={IntelPage} />
          <Route path="/loads" component={LoadsPage} />
          <Route path="/drivers" component={DriversPage} />
          <Route path="/contracts" component={ContractsPage} />
          <Route path="/treasury" component={TreasuryPage} />
          <Route path="/ops" component={OpsPage} />
        </Switch>
        <button
          onClick={() => setAiOpen(!aiOpen)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: aiOpen ? '424px' : '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
            transition: 'right 0.3s'
          }}
          title="AI Advisor"
        >
          &#129302;
        </button>
      </div>
      <AIHelper isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
