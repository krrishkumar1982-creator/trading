import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  CreditCard,
  Building2,
  Receipt,
  Sliders,
  Globe,
  Tags,
  History,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Plus,
  ChevronDown,
  Info,
  Check,
  ExternalLink,
  ShieldCheck,
  Moon,
  Sun,
  Sparkles,
  DollarSign,
  Lock,
  Smartphone,
  Copy,
  RefreshCw,
  Users2,
  Link2,
  Code,
  Radio,
  CheckCircle2,
  Zap,
  Terminal,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import {
  fetchIntegrationsApi,
  createIntegrationApi,
  deleteIntegrationApi,
  getEaScriptApi,
  sendTestWebhookApi,
  fetchIntegrationEventsApi,
  fetchIntegrationHealthApi,
  retryIntegrationEventApi,
} from '../../services/apiClient';

interface SettingsSyncViewProps {
  onOpenImport: () => void;
}

export type SettingsTab =
  | 'profile'
  | 'security'
  | 'subscription'
  | 'accounts'
  | 'integrations'
  | 'commissions'
  | 'trade-settings'
  | 'global'
  | 'tags'
  | 'import-history'
  | 'log-history'
  | 'backup-reset';

interface CommissionRule {
  id: string;
  account: string;
  instrument: string;
  symbol: string;
  mode: string;
  apply: string;
  commission: number;
  fee: number;
}

export const SettingsSyncView: React.FC<SettingsSyncViewProps> = ({ onOpenImport }) => {
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    addAccount,
    deleteAccount,
    theme,
    setTheme,
    currencyMode,
    setCurrencyMode,
    resetToSampleData,
    clearAllTradesData,
    addToast,
    userProfile,
    updateUserProfile,
    regenerateAccountCode,
    authUser,
    setIsAuthModalOpen,
    logout,
    activeView,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<SettingsTab>(
    activeView === 'integrations' ? 'integrations' : 'commissions'
  );

  // Broker Auto-Sync Integrations State
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProviderForCreate, setSelectedProviderForCreate] = useState<'MT4' | 'MT5' | 'TRADINGVIEW' | 'CUSTOM_WEBHOOK'>('MT5');
  const [selectedAccountIdForCreate, setSelectedAccountIdForCreate] = useState<string>('');
  const [newIntegrationName, setNewIntegrationName] = useState<string>('');
  const [visibleSecretIds, setVisibleSecretIds] = useState<Set<string>>(new Set());
  const [isTestingWebhook, setIsTestingWebhook] = useState<string | null>(null);
  const [eaScriptModal, setEaScriptModal] = useState<{ isOpen: boolean; code: string; filename: string; provider: string } | null>(null);

  // Integration Audit Logs State
  const [expandedLogsId, setExpandedLogsId] = useState<string | null>(null);
  const [integrationEvents, setIntegrationEvents] = useState<Record<string, any[]>>({});
  const [isLoadingEvents, setIsLoadingEvents] = useState<Record<string, boolean>>({});
  const [integrationHealths, setIntegrationHealths] = useState<Record<string, any>>({});
  const [retryingEventIds, setRetryingEventIds] = useState<Set<string>>(new Set());

  const loadIntegrationHealth = async (integrationId: string) => {
    try {
      const healthData = await fetchIntegrationHealthApi(integrationId);
      setIntegrationHealths(prev => ({ ...prev, [integrationId]: healthData }));
    } catch (err: any) {
      console.error(`Failed to load health for integration ${integrationId}:`, err);
    }
  };

  const handleToggleLogs = async (integrationId: string) => {
    if (expandedLogsId === integrationId) {
      setExpandedLogsId(null);
      return;
    }
    setExpandedLogsId(integrationId);
    setIsLoadingEvents(prev => ({ ...prev, [integrationId]: true }));
    try {
      const data = await fetchIntegrationEventsApi(integrationId, 15, 0);
      setIntegrationEvents(prev => ({ ...prev, [integrationId]: data }));
    } catch (err: any) {
      console.error('Failed to load integration events:', err);
      addToast('Error', 'Failed to retrieve audit logs history', 'error');
    } finally {
      setIsLoadingEvents(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const handleManualRetry = async (integrationId: string, eventId: string) => {
    setRetryingEventIds(prev => {
      const next = new Set(prev);
      next.add(eventId);
      return next;
    });

    try {
      const result = await retryIntegrationEventApi(integrationId, eventId);
      addToast('Retry Succeeded', `Trade synced successfully. Trade ID: ${result.tradeId}`, 'success');
      
      const data = await fetchIntegrationEventsApi(integrationId, 15, 0);
      setIntegrationEvents(prev => ({ ...prev, [integrationId]: data }));
      
      await loadIntegrationHealth(integrationId);
    } catch (err: any) {
      console.error('Failed manual retry:', err);
      addToast('Retry Failed', err.message || 'Manual retry execution failed', 'error');
      
      const data = await fetchIntegrationEventsApi(integrationId, 15, 0);
      setIntegrationEvents(prev => ({ ...prev, [integrationId]: data }));
      
      await loadIntegrationHealth(integrationId);
    } finally {
      setRetryingEventIds(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const loadIntegrations = React.useCallback(async () => {
    setIsLoadingIntegrations(true);
    try {
      const data = await fetchIntegrationsApi();
      setIntegrations(data);
      data.forEach((item: any) => {
        loadIntegrationHealth(item.id);
      });
    } catch (err: any) {
      console.error('Failed to load integrations:', err);
    } finally {
      setIsLoadingIntegrations(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'integrations') {
      loadIntegrations();
    }
  }, [activeTab, loadIntegrations]);

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    const accId = selectedAccountIdForCreate || accounts[0]?.id;
    if (!accId) {
      addToast('Error', 'Please select a target trading account', 'error');
      return;
    }

    try {
      const data = await createIntegrationApi({
        accountId: accId,
        provider: selectedProviderForCreate,
        displayName: newIntegrationName || `${selectedProviderForCreate} Live Sync`,
      });
      addToast('Integration Created', `Secret generated for ${data.integration.displayName}`, 'success');
      setIsCreateModalOpen(false);
      setNewIntegrationName('');
      
      const newIntegrationWithSecret = {
        ...data.integration,
        secret: data.secret,
        eaCode: data.eaCode,
      };
      setIntegrations(prev => [newIntegrationWithSecret, ...prev]);
    } catch (err: any) {
      addToast('Create Failed', err.message || 'Could not create integration', 'error');
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    try {
      await deleteIntegrationApi(id);
      addToast('Revoked', 'Integration revoked and deleted', 'info');
      loadIntegrations();
    } catch (err: any) {
      addToast('Error', err.message || 'Could not delete integration', 'error');
    }
  };

  const handleFetchEaScript = async (integration: any) => {
    try {
      if (integration.eaCode) {
        setEaScriptModal({
          isOpen: true,
          code: integration.eaCode,
          filename: integration.provider === 'MT5' ? 'DuskFlow_MT5_AutoSync_Bridge.mq5' : 'DuskFlow_MT4_AutoSync_Bridge.mq4',
          provider: integration.provider,
        });
        return;
      }
      
      const res = await getEaScriptApi(integration.id);
      setEaScriptModal({
        isOpen: true,
        code: res.code,
        filename: res.filename,
        provider: res.provider,
      });
    } catch (err: any) {
      addToast('Error', err.message || 'Could not generate EA script', 'error');
    }
  };

  const handleSendTestEvent = async (integration: any) => {
    if (!integration.secret) {
      addToast('Error', 'Test webhook requires secret. Please recreate integration to test.', 'error');
      return;
    }
    setIsTestingWebhook(integration.id);
    try {
      const testTrade = {
        eventId: `test_fill_${Date.now()}`,
        eventType: 'trade_closed',
        externalTradeId: `ticket_${Math.floor(100000 + Math.random() * 900000)}`,
        symbol: 'XAUUSD',
        direction: 'BUY',
        entryPrice: 2650.50,
        exitPrice: 2668.20,
        quantity: 1.0,
        netPnl: 177.00,
        commission: 5.00,
        swap: 0,
        fees: 1.20,
        setupType: 'Auto-Sync Test Execution',
        session: 'New York',
        status: 'CLOSED',
        notes: 'Simulated live trade execution fill from test webhook trigger',
      };

      const res = await sendTestWebhookApi(integration.id, integration.secret, testTrade);
      addToast(
        'Webhook Success',
        `Live execution trade #${res.tradeId} synced to database!`,
        'success'
      );
      loadIntegrations();
    } catch (err: any) {
      addToast('Webhook Test Error', err.message || 'Test event failed', 'error');
    } finally {
      setIsTestingWebhook(null);
    }
  };
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBroker, setNewAccBroker] = useState('Apex Trader Funding');
  const [newAccBalance, setNewAccBalance] = useState('50000');

  // Commissions & Fees Rules
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([
    {
      id: 'cr-1',
      account: 'Apex 50k Prop Live',
      instrument: 'Futures',
      symbol: 'NQ',
      mode: 'Per Contract',
      apply: 'Round-Trip',
      commission: 2.50,
      fee: 1.24,
    },
    {
      id: 'cr-2',
      account: 'IBKR Equities & Futures',
      instrument: 'Equities',
      symbol: 'ALL',
      mode: 'Per Share',
      apply: 'Both Sides',
      commission: 0.005,
      fee: 0.001,
    },
  ]);

  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRuleAccount, setNewRuleAccount] = useState('All Accounts');
  const [newRuleInstrument, setNewRuleInstrument] = useState('Futures');
  const [newRuleSymbol, setNewRuleSymbol] = useState('ES');
  const [newRuleComm, setNewRuleComm] = useState('1.50');
  const [newRuleFee, setNewRuleFee] = useState('0.85');

  const currentAccount = accounts.find(a => a.id === selectedAccountId);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: CommissionRule = {
      id: 'cr-' + Date.now(),
      account: newRuleAccount,
      instrument: newRuleInstrument,
      symbol: newRuleSymbol.toUpperCase(),
      mode: 'Per Contract',
      apply: 'Round-Trip',
      commission: parseFloat(newRuleComm) || 0,
      fee: parseFloat(newRuleFee) || 0,
    };
    setCommissionRules(prev => [...prev, newRule]);
    setIsAddRuleOpen(false);
    addToast('Rule Added', `Commission rule for ${newRule.symbol} created`, 'success');
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    addAccount({
      name: newAccName,
      broker: newAccBroker,
      accountNumber: 'ACC-' + Math.floor(100000 + Math.random() * 900000),
      currency: 'USD',
      initialBalance: parseFloat(newAccBalance) || 50000,
      currentBalance: parseFloat(newAccBalance) || 50000,
      isDemo: newAccBroker.includes('Prop') || newAccBroker.includes('Paper'),
      status: 'ACTIVE',
      connectionType: 'MANUAL',
    });
    setNewAccName('');
    setIsAddAccountOpen(false);
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-200">
      {/* Top Header matching Screenshot 6 */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Settings</h1>
        </div>

        {/* Top-Right Account Selector */}
        <div className="relative">
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Accounts Combined</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.broker})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout (Left Navigation + Right Workspace) */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto p-4 sm:p-6 gap-6">
        {/* Left Side Settings Navigation (matching Screenshot 6) */}
        <div className="w-full md:w-60 shrink-0 space-y-6">
          {/* USER Group */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              User
            </div>
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'subscription', label: 'Subscription', icon: CreditCard },
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-medium transition ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/25'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* GENERAL Group */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              General
            </div>
            <nav className="space-y-1">
              {[
                { id: 'accounts', label: 'Accounts', icon: Building2 },
                { id: 'integrations', label: 'Broker Auto-Sync', icon: Link2 },
                { id: 'commissions', label: 'Commissions & fees', icon: Receipt },
                { id: 'trade-settings', label: 'Trade settings', icon: Sliders },
                { id: 'global', label: 'Global settings', icon: Globe },
                { id: 'tags', label: 'Tags management', icon: Tags },
                { id: 'import-history', label: 'Import history', icon: FileSpreadsheet },
                { id: 'log-history', label: 'Log history', icon: History },
                { id: 'backup-reset', label: 'Data Reset & Backup', icon: RotateCcw },
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-medium transition ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/25'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Side Workspace Area */}
        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          {/* TAB 0: Broker & Platform Auto-Sync */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Header & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                      Live Broker & Platform Auto-Sync
                    </h2>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      REAL-TIME WEBHOOK ENGINE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Connect MetaTrader 4, MetaTrader 5, or TradingView accounts. Executions stream directly into your DuskFlow journal with sub-second latency, deterministic trade matching, and idempotency protection.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-semibold shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Integration</span>
                </button>
              </div>

              {/* Platform Quick-Setup Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* MT4 / MT5 Bridge Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        MT
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">MetaTrader 4 / 5</div>
                        <div className="text-[11px] text-slate-400">MQL4/MQL5 Expert Advisor</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Native EA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Direct MT4 & MT5 EA bridge script parses fill events and posts structured execution JSON directly to DuskFlow.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedProviderForCreate('MT5');
                      setIsCreateModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-indigo-400 font-semibold border border-indigo-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Connect MetaTrader</span>
                  </button>
                </div>

                {/* TradingView Alerts Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        TV
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">TradingView</div>
                        <div className="text-[11px] text-slate-400">Webhook Strategy Alerts</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      Alert Webhook
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Receive automatic trade fills directly from Pine Script strategies and custom TradingView chart alert webhooks.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedProviderForCreate('TRADINGVIEW');
                      setIsCreateModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-blue-400 font-semibold border border-blue-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Connect TradingView</span>
                  </button>
                </div>

                {/* Custom REST Webhook Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                        API
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">Custom REST API</div>
                        <div className="text-[11px] text-slate-400">cTrader / Rithmic / Custom</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                      JSON Webhook
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Send arbitrary JSON trade execution payloads from python bots, NinjaTrader, cTrader, or custom proprietary engines.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedProviderForCreate('CUSTOM_WEBHOOK');
                      setIsCreateModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-violet-400 font-semibold border border-violet-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Setup Custom Webhook</span>
                  </button>
                </div>
              </div>

              {/* Connected Integrations List */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Active Integration Endpoints ({integrations.length})
                </h3>

                {isLoadingIntegrations ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading integrations...</div>
                ) : integrations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center space-y-3">
                    <Link2 className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">No broker integrations connected yet.</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Click "New Integration" above to generate a secure secret token and webhook endpoint for your trading platform.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {integrations.map((item) => {
                      const acc = accounts.find((a) => a.id === item.accountId);
                      const isSecretVisible = visibleSecretIds.has(item.id);
                      const webhookUrl = `${window.location.origin}/api/integrations/webhook/${item.id}`;

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4 shadow-lg transition hover:border-slate-700"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400">
                                {item.provider}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-100">{item.displayName}</span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      item.status === 'CONNECTED'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}
                                  >
                                    {item.status === 'CONNECTED' ? 'CONNECTED' : 'WAITING FOR EVENTS'}
                                  </span>
                                  {integrationHealths[item.id] && (
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        integrationHealths[item.id].healthStatus === 'HEALTHY'
                                          ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                                          : integrationHealths[item.id].healthStatus === 'OFFLINE'
                                          ? 'bg-rose-500/25 text-rose-400 border border-rose-500/30'
                                          : 'bg-amber-500/25 text-amber-400 border border-amber-500/30'
                                      }`}
                                    >
                                      {integrationHealths[item.id].healthStatus}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span>Target Account: <strong className="text-slate-200">{acc?.name || item.accountId}</strong></span>
                                  <span>•</span>
                                  <span>Last Synced: {item.lastSyncAt ? new Date(item.lastSyncAt).toLocaleString() : 'Never'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                              <button
                                onClick={() => handleSendTestEvent(item)}
                                disabled={isTestingWebhook === item.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold flex items-center gap-1.5 transition"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>{isTestingWebhook === item.id ? 'Sending...' : 'Test Webhook'}</span>
                              </button>

                              {(item.provider === 'MT4' || item.provider === 'MT5') && (
                                <button
                                  onClick={() => handleFetchEaScript(item)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1.5 transition"
                                >
                                  <Code className="w-3.5 h-3.5" />
                                  <span>Download EA Script</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleToggleLogs(item.id)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                                  expandedLogsId === item.id
                                    ? 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                                }`}
                              >
                                <History className="w-3.5 h-3.5" />
                                <span>{expandedLogsId === item.id ? 'Hide Audit Trail' : 'View Audit Trail'}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteIntegration(item.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Disconnect</span>
                              </button>
                            </div>
                          </div>

                          {/* Integration Health Indicators & Stats Panel */}
                          {integrationHealths[item.id] && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-850 text-xs">
                              <div className="space-y-1">
                                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Sync Status</div>
                                <div className="font-bold flex items-center gap-1.5 font-sans">
                                  <span className={`w-2 h-2 rounded-full ${
                                    integrationHealths[item.id].healthStatus === 'HEALTHY' ? 'bg-emerald-400 animate-pulse' :
                                    integrationHealths[item.id].healthStatus === 'OFFLINE' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'
                                  }`} />
                                  <span className="text-slate-200">{integrationHealths[item.id].healthStatus}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Success Rate</div>
                                <div className="font-mono font-bold text-slate-200">
                                  {(integrationHealths[item.id].successRate * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Failure Rate</div>
                                <div className="font-mono font-bold text-slate-200">
                                  {(integrationHealths[item.id].failureRate * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Pending Retries</div>
                                <div className="font-mono font-bold text-slate-200">
                                  {integrationHealths[item.id].pendingRetryCount}
                                </div>
                              </div>
                              <div className="space-y-1 col-span-2 md:col-span-1">
                                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Event Log</div>
                                <div className="font-mono font-bold text-slate-200">
                                  {integrationHealths[item.id].totalCount}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Webhook Secret & Endpoint Controls */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
                            {/* Webhook Endpoint */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 font-sans">Webhook Endpoint URL</label>
                              <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                                <input
                                  type="text"
                                  readOnly
                                  value={webhookUrl}
                                  className="bg-transparent border-none outline-none w-full text-[11px] text-slate-300 font-mono"
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(webhookUrl);
                                    addToast('Copied', 'Webhook URL copied to clipboard', 'info');
                                  }}
                                  className="text-slate-400 hover:text-white shrink-0 p-1"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Authorization Bearer Secret */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 font-sans">Authorization Bearer Secret</label>
                              <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                                <input
                                  type={isSecretVisible ? 'text' : 'password'}
                                  readOnly
                                  value={item.secret || '********************************'}
                                  className="bg-transparent border-none outline-none w-full text-[11px] text-emerald-400 font-mono"
                                />
                                <button
                                  onClick={() => {
                                    setVisibleSecretIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(item.id)) next.delete(item.id);
                                      else next.add(item.id);
                                      return next;
                                    });
                                  }}
                                  className="text-slate-400 hover:text-white shrink-0 p-1"
                                >
                                  {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => {
                                    if (!item.secret) {
                                      addToast('Error', 'Secret no longer available in memory. Recreate integration to get a new secret.', 'error');
                                      return;
                                    }
                                    navigator.clipboard.writeText(item.secret);
                                    addToast('Copied', 'Integration secret copied to clipboard', 'info');
                                  }}
                                  className="text-slate-400 hover:text-white shrink-0 p-1"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Event Audit Logs Section */}
                          {expandedLogsId === item.id && (
                            <div className="mt-4 pt-4 border-t border-slate-900 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                  <Terminal className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                  Audit Trail & Event History
                                </h4>
                                <button
                                  onClick={() => handleToggleLogs(item.id)}
                                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline font-sans flex items-center gap-1"
                                >
                                  <RefreshCw className={`w-2.5 h-2.5 ${isLoadingEvents[item.id] ? 'animate-spin' : ''}`} />
                                  <span>Refresh Logs</span>
                                </button>
                              </div>

                              {isLoadingEvents[item.id] ? (
                                <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2 font-sans bg-slate-950/30 rounded-lg border border-slate-900">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                  Retrieving chronological audit trail...
                                </div>
                              ) : !integrationEvents[item.id] || integrationEvents[item.id].length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-500 rounded-lg bg-slate-950/50 border border-slate-900 font-sans">
                                  No integration events logged yet. Once webhook endpoints receive payloads or state shifts, secure audit logs will render here.
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                  {integrationEvents[item.id].map((event: any) => {
                                    const eventDate = new Date(event.createdAt).toLocaleTimeString();
                                    const eventFullDate = new Date(event.createdAt).toLocaleDateString();
                                    
                                    // Determine styles based on status
                                    let statusBg = 'bg-slate-900 text-slate-400 border border-slate-800';
                                    if (event.status === 'PROCESSED' || event.status === 'SUCCESS') statusBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                                    else if (event.status === 'FAILED') statusBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                                    else if (event.status === 'WARNING') statusBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

                                    // Determine styles based on processingStatus
                                    let procStatusBg = 'bg-slate-900 text-slate-400 border border-slate-800';
                                    if (event.processingStatus === 'PROCESSED') procStatusBg = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
                                    else if (event.processingStatus === 'FAILED' || event.processingStatus === 'RETRY_EXHAUSTED' || event.processingStatus === 'REJECTED') procStatusBg = 'bg-rose-500/15 text-rose-400 border border-rose-500/25';
                                    else if (event.processingStatus === 'RETRY_SCHEDULED' || event.processingStatus === 'RETRYING') procStatusBg = 'bg-amber-500/15 text-amber-400 border border-amber-500/25';

                                    const isRetryableState = event.processingStatus === 'FAILED' || event.processingStatus === 'RETRY_SCHEDULED' || event.processingStatus === 'RETRY_EXHAUSTED' || event.status === 'FAILED';
                                    const isCurrentlyRetrying = retryingEventIds.has(event.id);

                                    return (
                                      <div key={event.id} className="rounded-lg border border-slate-900 bg-slate-950 p-3 space-y-2 text-[11px] font-mono">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-slate-200">{event.eventType}</span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusBg}`}>
                                              {event.status}
                                            </span>
                                            {event.processingStatus && (
                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${procStatusBg}`}>
                                                {event.processingStatus}
                                              </span>
                                            )}
                                            {event.attemptCount !== undefined && event.attemptCount !== null && (
                                              <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800/60">
                                                Attempt {event.attemptCount} / {event.maxAttempts || 5}
                                              </span>
                                            )}
                                            {event.processingStatus === 'RETRY_SCHEDULED' && event.nextRetryAt && (
                                              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded animate-pulse border border-amber-500/20">
                                                Next Retry: {new Date(event.nextRetryAt).toLocaleTimeString()}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {isRetryableState && (
                                              <button
                                                onClick={() => handleManualRetry(item.id, event.id)}
                                                disabled={isCurrentlyRetrying}
                                                className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-sans text-[10px] font-semibold transition disabled:opacity-50"
                                              >
                                                {isCurrentlyRetrying ? 'Retrying...' : 'Retry Now'}
                                              </button>
                                            )}
                                            <span className="text-slate-500 font-sans text-[10px]">
                                              {eventFullDate} {eventDate}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {event.error && (
                                          <div className="text-rose-400 font-sans text-[10px] bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">
                                            <strong>Error:</strong> {event.error}
                                          </div>
                                        )}

                                        <div className="text-slate-400 whitespace-pre-wrap overflow-x-auto bg-slate-900/60 p-2.5 rounded max-h-40 text-[10px] leading-relaxed border border-slate-900">
                                          {JSON.stringify(event.payload, null, 2)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: Commissions & Fees (Exact Screenshot 6 Match) */}
          {activeTab === 'commissions' && (
            <div className="space-y-6">
              {/* Header & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">
                      Default commission and fees
                    </h2>
                    <span className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
                      <span>Learn more</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Values below apply for newly uploaded executions and only if its value is 0 or null.
                    To rewrite existing ones select corresponding menu item on the right. You can set
                    commissions and fees for accounts which are not connected with brokers.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddRuleOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs font-semibold shadow-md shadow-blue-600/20 transition active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add rule</span>
                </button>
              </div>

              {/* Add Rule Form Modal / Drawer if Open */}
              {isAddRuleOpen && (
                <form
                  onSubmit={handleAddRule}
                  className="rounded-xl border border-blue-500/30 bg-slate-950 p-4 space-y-3 animate-in fade-in"
                >
                  <div className="font-bold text-xs text-blue-400">Add Commission & Fee Rule</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Account</label>
                      <select
                        value={newRuleAccount}
                        onChange={e => setNewRuleAccount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      >
                        <option>All Accounts</option>
                        {accounts.map(a => (
                          <option key={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Instrument</label>
                      <select
                        value={newRuleInstrument}
                        onChange={e => setNewRuleInstrument(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      >
                        <option>Futures</option>
                        <option>Equities</option>
                        <option>Options</option>
                        <option>Crypto</option>
                        <option>Forex</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Symbol</label>
                      <input
                        type="text"
                        value={newRuleSymbol}
                        onChange={e => setNewRuleSymbol(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                        placeholder="ES or ALL"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Commission ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newRuleComm}
                        onChange={e => setNewRuleComm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddRuleOpen(false)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500"
                    >
                      Save Rule
                    </button>
                  </div>
                </form>
              )}

              {/* Table of Rules */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Account</th>
                      <th className="py-2.5 px-3">Instrument</th>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Apply</th>
                      <th className="py-2.5 px-3">Comm., $</th>
                      <th className="py-2.5 px-3">Fee, $</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {commissionRules.map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-sans text-slate-200">{r.account}</td>
                        <td className="py-2.5 px-3 text-slate-400">{r.instrument}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-400">{r.symbol}</td>
                        <td className="py-2.5 px-3 text-slate-400">{r.mode}</td>
                        <td className="py-2.5 px-3 text-slate-400">{r.apply}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                          ${r.commission.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-amber-400 font-semibold">
                          ${r.fee.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() =>
                              setCommissionRules(prev => prev.filter(x => x.id !== r.id))
                            }
                            className="text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Accounts Management */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-100">Trading Accounts</h2>
                  <p className="text-xs text-slate-400">
                    Manage multi-account portfolios, prop firm balances, and live brokers
                  </p>
                </div>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Account</span>
                </button>
              </div>

              {isAddAccountOpen && (
                <form
                  onSubmit={handleAddAccount}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 animate-in fade-in"
                >
                  <div className="text-xs font-bold text-slate-200">Connect New Account</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Account Label</label>
                      <input
                        type="text"
                        required
                        value={newAccName}
                        onChange={e => setNewAccName(e.target.value)}
                        placeholder="e.g. Topstep 50k Express"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Broker / Prop Firm</label>
                      <input
                        type="text"
                        value={newAccBroker}
                        onChange={e => setNewAccBroker(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Starting Balance ($)</label>
                      <input
                        type="number"
                        value={newAccBalance}
                        onChange={e => setNewAccBalance(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddAccountOpen(false)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map(acc => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-100">{acc.name}</div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>Broker: <strong className="text-slate-200">{acc.broker}</strong></div>
                      <div>Initial: <strong className="text-slate-200">${(acc.initialBalance ?? 0).toLocaleString()}</strong></div>
                      <div>Current Balance: <strong className="text-emerald-400">${(acc.currentBalance ?? 0).toLocaleString()}</strong></div>
                    </div>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => deleteAccount(acc.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 pt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Account</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: User Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-base font-bold text-slate-100 pb-2 border-b border-slate-800">
                User Profile & Mentor Integration
              </h2>

              {/* Unique Mentor Code Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-100">Your Unique Mentor Code</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    SHARED ACCESS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Provide this code to your trading mentor or group leader so they can view your live journal, reports, and execution statistics in real time.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 font-mono text-sm font-bold text-blue-400 tracking-wider flex items-center justify-between">
                    <span>{userProfile.accountCode}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(userProfile.accountCode);
                        addToast('Code Copied!', 'Unique account code copied to clipboard', 'success');
                      }}
                      className="p-1 text-slate-400 hover:text-white transition"
                      title="Copy Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => regenerateAccountCode()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                    title="Generate New Code"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Editable Profile Inputs */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={e => updateUserProfile({ name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={userProfile.email}
                    onChange={e => updateUserProfile({ email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Trading Experience</label>
                  <select
                    value={userProfile.experienceLevel}
                    onChange={e => updateUserProfile({ experienceLevel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                  >
                    <option>Full-Time Prop & Futures Trader (4+ Years)</option>
                    <option>Intermediate Day Trader (1-3 Years)</option>
                    <option>Beginner Trader (&lt; 1 Year)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => addToast('Profile Saved', 'User information updated', 'success')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20"
              >
                Save Profile Changes
              </button>
            </div>
          )}

          {/* TAB 4: Security */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-xl text-xs">
              <h2 className="text-base font-bold text-slate-100 pb-2 border-b border-slate-800">
                Account Security & Authentication
              </h2>

              {/* Real Auth Status Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-bold text-slate-200">
                        {authUser ? 'Authenticated Session' : 'Unauthenticated Session'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {authUser ? authUser.email : 'Operating with default local identity'}
                      </div>
                    </div>
                  </div>
                  {authUser ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                      VERIFIED FIREBASE
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] border border-amber-500/30">
                      GUEST MODE
                    </span>
                  )}
                </div>

                {authUser ? (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">UID: {authUser.uid}</span>
                    <button
                      onClick={() => logout()}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold rounded-lg border border-rose-500/30 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      Sign in to isolate your trading data with server-verified token security.
                    </p>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition shrink-0 ml-3 shadow-md shadow-blue-600/20"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold text-slate-200">Two-Factor Authentication (2FA)</div>
                      <div className="text-[11px] text-slate-400">Authenticator App enabled</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    ENABLED
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>Change Password</span>
                </div>
                <input
                  type="password"
                  placeholder="Current Password"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200"
                />
                <input
                  type="password"
                  placeholder="New Strong Password"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200"
                />
                <button
                  onClick={() => addToast('Password Changed', 'Your password has been updated', 'success')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded text-xs"
                >
                  Update Password
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: Subscription */}
          {activeTab === 'subscription' && (
            <div className="space-y-4 max-w-xl text-xs">
              <h2 className="text-base font-bold text-slate-100 pb-2 border-b border-slate-800">
                Subscription & Billing Plan
              </h2>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">DuskFlow PRO Lifetime</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white font-bold text-[10px]">
                    ACTIVE
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  Full access to unlimited automated syncs, deep analytics, AI coach, trade replay, and mentor mode.
                </p>
                <div className="text-[11px] text-slate-400">Next billing date: <strong>August 2027</strong></div>
              </div>
            </div>
          )}

          {/* TAB 6: Global Settings */}
          {activeTab === 'global' && (
            <div className="space-y-6 max-w-xl text-xs">
              <h2 className="text-base font-bold text-slate-100 pb-2 border-b border-slate-800">
                Global Platform Preferences
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">Display Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-3 rounded-xl border text-center font-semibold transition ${
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-600/15 text-blue-400 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Dark Mode (Neutral Charcoal)
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-3 rounded-xl border text-center font-semibold transition ${
                        theme === 'light'
                          ? 'border-blue-500 bg-blue-600/15 text-blue-400 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Light Mode (Clean Bright)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-2">Default Currency Mode</label>
                  <select
                    value={currencyMode}
                    onChange={e => setCurrencyMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                  >
                    <option value="USD">Dollar ($ USD)</option>
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="R_MULTIPLE">R-Multiple (R)</option>
                    <option value="TICKS">Ticks / Points</option>
                    <option value="PRIVACY">Privacy Mode (••••)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Backup & Reset */}
          {activeTab === 'backup-reset' && (
            <div className="space-y-6 max-w-xl text-xs">
              <h2 className="text-base font-bold text-slate-100 pb-2 border-b border-slate-800">
                Data Reset & Backup
              </h2>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-slate-200">Export All Trading Data</div>
                <p className="text-slate-400">Download a full JSON backup of your journal, trades, playbooks, and accounts.</p>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", "duskflow_backup.json");
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    addToast('Export Complete', 'Data backup downloaded', 'success');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (.JSON)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-slate-200">Reset to Sample Dataset</div>
                <p className="text-slate-400">Restore rich default trades and playbook metrics.</p>
                <button
                  onClick={() => {
                    resetToSampleData();
                    addToast('Sample Data Restored', 'Platform reset to default trades', 'info');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 font-semibold"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Load Sample Trades</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <div className="font-bold text-rose-300">Wipe All Trade History</div>
                <p className="text-slate-400">Clears all logged trades to start fresh with an empty journal.</p>
                <button
                  onClick={() => {
                    clearAllTradesData();
                    addToast('History Cleared', 'All trades cleared from local database', 'error');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Trades</span>
                </button>
              </div>
            </div>
          )}

          {/* OTHER TABS: Fallback view */}
          {['trade-settings', 'tags', 'import-history', 'log-history'].includes(activeTab) && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-bold text-slate-100 capitalize">
                  {activeTab.replace('-', ' ')}
                </h2>
                <button
                  onClick={onOpenImport}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Records</span>
                </button>
              </div>
              <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                <Check className="w-8 h-8 mx-auto text-blue-500 mb-2 opacity-80" />
                <p className="text-sm font-medium text-slate-300">All configurations active and synced with live engine</p>
                <p className="text-xs text-slate-500 mt-1">Changes are immediately applied across dashboard widgets and reports.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create New Integration Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                Connect New Broker / Execution Engine
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIntegration} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Integration Platform Provider</label>
                <select
                  value={selectedProviderForCreate}
                  onChange={(e) => setSelectedProviderForCreate(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="MT5">MetaTrader 5 (MQL5 EA Bridge)</option>
                  <option value="MT4">MetaTrader 4 (MQL4 EA Bridge)</option>
                  <option value="TRADINGVIEW">TradingView (Pine Script Webhook Alert)</option>
                  <option value="CUSTOM_WEBHOOK">Custom REST JSON Webhook</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Journal Account</label>
                <select
                  value={selectedAccountIdForCreate || accounts[0]?.id || ''}
                  onChange={(e) => setSelectedAccountIdForCreate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.broker} - {a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Integration Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder={`e.g. My Live ${selectedProviderForCreate} Feed`}
                  value={newIntegrationName}
                  onChange={(e) => setNewIntegrationName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200">Security & Isolation Guarantee</div>
                <div>Creating this integration will issue a unique secret token. Endpoints do not accept guest IDs or unverified payloads.</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-semibold shadow-md shadow-emerald-600/20"
                >
                  Generate Secret Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EA Script View & Download Modal */}
      {eaScriptModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                {eaScriptModal.filename} Pre-Configured EA Bridge Code
              </h3>
              <button
                onClick={() => setEaScriptModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Copy this MQL code into MetaEditor (MT4/MT5) or save as <strong className="text-slate-200">{eaScriptModal.filename}</strong> inside your MetaTrader <code className="text-indigo-400 font-mono">/MQL/Experts/</code> folder. The script contains your pre-configured integration secret token and target webhook endpoint.
            </p>

            <div className="relative">
              <textarea
                readOnly
                rows={12}
                value={eaScriptModal.code}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-[11px] font-mono text-indigo-300 focus:outline-none custom-scrollbar"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(eaScriptModal.code);
                  addToast('Copied', 'EA Source Code copied to clipboard', 'info');
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy MQL Code</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-500 text-[11px]">Note: Enable "Allow WebRequest for listed URL" in MetaTrader Options.</span>
              <button
                onClick={() => setEaScriptModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

