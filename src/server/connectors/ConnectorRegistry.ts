import { BrokerConnector, PlatformType } from './types.ts';
import { MT5Connector } from './mt5/MT5Connector.ts';
import { CTraderConnector } from './ctrader/CTraderConnector.ts';
import { DXtradeConnector } from './dxtrade/DXtradeConnector.ts';
import { MatchTraderConnector } from './matchtrader/MatchTraderConnector.ts';
import { BrokerApiConnector } from './broker-api/BrokerApiConnector.ts';
import { CSVConnector } from './csv/CSVConnector.ts';

export interface PlatformMetadata {
  id: PlatformType;
  name: string;
  category: 'Terminal' | 'Prop-Firm Engine' | 'Broker API' | 'File Import';
  description: string;
  authMethod: 'INVESTOR_PASSWORD' | 'OAUTH_TOKEN' | 'API_KEY_SECRET' | 'FILE_UPLOAD';
  supportsHistoricalImport: boolean;
  supportsRealtimeSync: boolean;
  requiresMasterPassword: boolean; // Always FALSE - TradeForge is strictly read-only
  badgeColor: string;
  icon: string;
  popularServers?: string[];
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password' | 'select' | 'textarea';
    placeholder?: string;
    required: boolean;
    helpText?: string;
    options?: Array<{ label: string; value: string }>;
  }>;
}

export class ConnectorRegistry {
  private static instances: Map<PlatformType, BrokerConnector> = new Map();

  public static getConnector(platform: PlatformType): BrokerConnector {
    if (!this.instances.has(platform)) {
      switch (platform) {
        case 'MT5':
          this.instances.set(platform, new MT5Connector());
          break;
        case 'CTRADER':
          this.instances.set(platform, new CTraderConnector());
          break;
        case 'DXTRADE':
          this.instances.set(platform, new DXtradeConnector());
          break;
        case 'MATCH_TRADER':
          this.instances.set(platform, new MatchTraderConnector());
          break;
        case 'BROKER_API':
          this.instances.set(platform, new BrokerApiConnector());
          break;
        case 'CSV':
          this.instances.set(platform, new CSVConnector());
          break;
        default:
          throw new Error(`Unsupported connector platform: ${platform}`);
      }
    }
    return this.instances.get(platform)!;
  }

  public static isSupported(platform: string): boolean {
    const supported: PlatformType[] = ['MT5', 'CTRADER', 'DXTRADE', 'MATCH_TRADER', 'BROKER_API', 'CSV'];
    return supported.includes(platform as PlatformType);
  }

  public static getAllPlatformMetadata(): PlatformMetadata[] {
    return this.getSupportedPlatforms();
  }

  public static getSupportedPlatforms(): PlatformMetadata[] {
    return [
      {
        id: 'MT5',
        name: 'MetaTrader 5',
        category: 'Terminal',
        description: 'Auto-sync executions directly from MT5 broker/prop-firm server using read-only investor credentials.',
        authMethod: 'INVESTOR_PASSWORD',
        supportsHistoricalImport: true,
        supportsRealtimeSync: true,
        requiresMasterPassword: false,
        badgeColor: '#2563FF',
        icon: 'Terminal',
        popularServers: [
          'FTMO-Demo',
          'FTMO-Server',
          'FundedNext-Demo',
          'FundedNext-Server',
          'ICMarketsSC-Live',
          'ICMarketsSC-Demo',
          'Pepperstone-Live01',
          'Pepperstone-Demo01',
          'Topstep-Server',
          'MyForexFunds-Server',
          'Eightcap-Real',
          'Eightcap-Demo',
          'FXTM-Live',
          'MetaQuotes-Demo',
        ],
        fields: [
          {
            name: 'server',
            label: 'Server Name',
            type: 'text',
            placeholder: 'e.g. FTMO-Server, ICMarketsSC-Live',
            required: true,
            helpText: 'Select or type the exact server name shown on your MT5 terminal login screen.',
          },
          {
            name: 'accountNumber',
            label: 'Account Number / Login',
            type: 'text',
            placeholder: 'e.g. 10294812',
            required: true,
            helpText: 'Your MT5 account numerical login.',
          },
          {
            name: 'investorPassword',
            label: 'Read-Only / Investor Password',
            type: 'password',
            placeholder: '••••••••••••',
            required: true,
            helpText: 'TradeForge ONLY requires your read-only investor password. Master trading password is never needed.',
          },
          {
            name: 'nickname',
            label: 'Account Nickname',
            type: 'text',
            placeholder: 'e.g. FTMO 100k Challenge 1',
            required: false,
          },
        ],
      },
      {
        id: 'CTRADER',
        name: 'cTrader',
        category: 'Terminal',
        description: 'Connect Spotware cTrader accounts via cTID Open API token with real-time deal sync.',
        authMethod: 'OAUTH_TOKEN',
        supportsHistoricalImport: true,
        supportsRealtimeSync: true,
        requiresMasterPassword: false,
        badgeColor: '#00D6A3',
        icon: 'Activity',
        fields: [
          {
            name: 'accountId',
            label: 'cTrader Account ID (cTID)',
            type: 'text',
            placeholder: 'e.g. 5182910',
            required: true,
            helpText: 'Your numerical cTrader account ID.',
          },
          {
            name: 'accessToken',
            label: 'Open API Access Token',
            type: 'password',
            placeholder: 'Bearer token from Spotware Open API portal',
            required: true,
            helpText: 'Read-only access token generated from cTrader Open API.',
          },
          {
            name: 'broker',
            label: 'Broker Name',
            type: 'text',
            placeholder: 'e.g. IC Markets, Pepperstone, FxPro',
            required: false,
          },
        ],
      },
      {
        id: 'DXTRADE',
        name: 'DXtrade',
        category: 'Prop-Firm Engine',
        description: 'Connect DXtrade prop-firm trading platforms (FTMO DXtrade, FundedNext, Alpha Capital, etc.).',
        authMethod: 'INVESTOR_PASSWORD',
        supportsHistoricalImport: true,
        supportsRealtimeSync: true,
        requiresMasterPassword: false,
        badgeColor: '#A855F7',
        icon: 'Cpu',
        fields: [
          {
            name: 'serverUrl',
            label: 'DXtrade Server URL / Domain',
            type: 'text',
            placeholder: 'e.g. dxtrade.ftmo.com or live.dx.trade',
            required: true,
            helpText: 'The web address where you log in to your DXtrade platform.',
          },
          {
            name: 'username',
            label: 'DXtrade Username / Login ID',
            type: 'text',
            placeholder: 'e.g. DX109283',
            required: true,
          },
          {
            name: 'password',
            label: 'Read-Only / Web Session Password',
            type: 'password',
            placeholder: '••••••••••••',
            required: true,
          },
        ],
      },
      {
        id: 'MATCH_TRADER',
        name: 'Match-Trader',
        category: 'Prop-Firm Engine',
        description: 'Connect modern Match-Trader platform accounts used across global prop trading firms.',
        authMethod: 'INVESTOR_PASSWORD',
        supportsHistoricalImport: true,
        supportsRealtimeSync: true,
        requiresMasterPassword: false,
        badgeColor: '#EC4899',
        icon: 'Layers',
        fields: [
          {
            name: 'server',
            label: 'Server Endpoint',
            type: 'text',
            placeholder: 'e.g. matchtrader.propfirm.com',
            required: true,
          },
          {
            name: 'login',
            label: 'Match-Trader Login ID',
            type: 'text',
            placeholder: 'e.g. MT910293',
            required: true,
          },
          {
            name: 'password',
            label: 'Investor / API Password',
            type: 'password',
            placeholder: '••••••••••••',
            required: true,
          },
        ],
      },
      {
        id: 'BROKER_API',
        name: 'Broker Direct API',
        category: 'Broker API',
        description: 'Connect institutional & retail brokers directly (Interactive Brokers, Alpaca, Tradovate, Binance, etc.).',
        authMethod: 'API_KEY_SECRET',
        supportsHistoricalImport: true,
        supportsRealtimeSync: true,
        requiresMasterPassword: false,
        badgeColor: '#F5B82E',
        icon: 'Key',
        fields: [
          {
            name: 'provider',
            label: 'Broker / Exchange',
            type: 'select',
            required: true,
            options: [
              { label: 'Interactive Brokers (Client Portal / Gateway)', value: 'Interactive Brokers' },
              { label: 'Alpaca Securities', value: 'Alpaca' },
              { label: 'Tradovate API', value: 'Tradovate' },
              { label: 'Binance Futures / Spot', value: 'Binance' },
              { label: 'OANDA v20 API', value: 'OANDA' },
              { label: 'Generic REST Broker', value: 'Generic Broker' },
            ],
          },
          {
            name: 'apiKey',
            label: 'Read-Only API Key',
            type: 'text',
            placeholder: 'e.g. PK_LIVE_...',
            required: true,
          },
          {
            name: 'apiSecret',
            label: 'API Secret / Private Token',
            type: 'password',
            placeholder: '••••••••••••••••',
            required: true,
          },
          {
            name: 'accountId',
            label: 'Account ID (Optional)',
            type: 'text',
            placeholder: 'e.g. U1829104',
            required: false,
          },
        ],
      },
      {
        id: 'CSV',
        name: 'CSV File / Manual Import',
        category: 'File Import',
        description: 'Import trade history files from any broker, platform, or spreadsheet with intelligent header mapping.',
        authMethod: 'FILE_UPLOAD',
        supportsHistoricalImport: true,
        supportsRealtimeSync: false,
        requiresMasterPassword: false,
        badgeColor: '#6B7280',
        icon: 'FileSpreadsheet',
        fields: [
          {
            name: 'broker',
            label: 'Broker / Prop Firm Name',
            type: 'text',
            placeholder: 'e.g. FTMO, Topstep, MyBroker',
            required: true,
          },
          {
            name: 'accountNumber',
            label: 'Account Number / Label',
            type: 'text',
            placeholder: 'e.g. CSV_ACC_01',
            required: true,
          },
          {
            name: 'csvContent',
            label: 'Paste CSV Data (or upload file in modal)',
            type: 'textarea',
            placeholder: 'Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit\n1001,2026-08-01 10:00,buy,1.0,EURUSD,1.0820,1.0790,1.0880,2026-08-01 14:30,1.0870,-3.5,0.0,500.0',
            required: true,
          },
        ],
      },
    ];
  }
}
