import {
  getTradingAccountConnectionById,
  saveTradingAccountConnection,
  createConnectionSyncLog,
  upsertSyncedTrade,
  saveTradingAccount,
  getTradingAccounts,
} from '../db/repository.ts';
import { decryptCredentials } from './cryptoUtils.ts';
import { ConnectorRegistry } from './connectors/ConnectorRegistry.ts';
import { PlatformType, SyncOptions, SyncResult } from './connectors/types.ts';
import { db } from '../db/index.ts';
import { tradingAccountConnections } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

// Mutex map to prevent concurrent sync operations on the same connection
const activeSyncMutex = new Set<string>();

export interface SyncEngineResult {
  success: boolean;
  tradesImported: number;
  tradesUpdated: number;
  errorMessage?: string;
  durationMs: number;
  accountInfo?: any;
}

/**
 * Executes a full or incremental synchronization of a connected trading account.
 */
export async function syncAccountConnection(
  userId: string,
  connectionId: string,
  options?: {
    importScope?: 'ALL' | 'DATE';
    startDate?: string;
    trigger?: string;
  }
): Promise<SyncEngineResult> {
  const mutexKey = `${userId}_${connectionId}`;
  if (activeSyncMutex.has(mutexKey)) {
    return {
      success: false,
      tradesImported: 0,
      tradesUpdated: 0,
      errorMessage: 'A synchronization operation is already in progress for this account.',
      durationMs: 0,
    };
  }

  activeSyncMutex.add(mutexKey);
  const startTime = Date.now();
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();

  try {
    const connection = await getTradingAccountConnectionById(userId, connectionId);
    if (!connection) {
      throw new Error('Connection not found or unauthorized.');
    }

    // 1. Mark connection as SYNCING in DB
    await saveTradingAccountConnection(userId, {
      id: connection.id,
      accountId: connection.accountId,
      platform: connection.platform,
      broker: connection.broker,
      accountNumber: connection.accountNumber,
      connectionStatus: 'SYNCING',
    });

    // 2. Decrypt stored credentials securely
    const credentials = decryptCredentials(connection.encryptedCredentials) || {};
    // Ensure broker/server/accountNumber are attached
    credentials.accountNumber = connection.accountNumber;
    credentials.server = connection.server;
    credentials.broker = connection.broker;
    credentials.currency = connection.currency;

    // 3. Resolve Connector instance
    const connector = ConnectorRegistry.getConnector(connection.platform as PlatformType);

    // 4. Determine sync date bounds
    let fromDate: Date | undefined;
    const scope = options?.importScope || connection.importScope;
    if (scope === 'DATE') {
      const rawDate = options?.startDate || connection.importStartDate;
      if (rawDate) {
        fromDate = new Date(rawDate);
      }
    } else if (connection.lastSyncAt && !options?.importScope) {
      // Incremental sync cursor: 2 days before last sync for safe overlap
      fromDate = new Date(new Date(connection.lastSyncAt).getTime() - 2 * 86400000);
    }

    const syncOptions: SyncOptions = {
      from: fromDate,
      incremental: Boolean(connection.lastSyncAt),
      lastSyncAt: connection.lastSyncAt || undefined,
      includeOpenPositions: true,
    };

    // 5. Run connector sync
    const syncResult: SyncResult = await connector.sync(credentials, syncOptions);

    if (!syncResult.success) {
      const errorMsg = syncResult.errorMessage || 'Unknown error during broker synchronization.';
      const isAuthErr = errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('auth');
      const finalStatus = isAuthErr ? 'REAUTH_REQUIRED' : 'ERROR';

      await saveTradingAccountConnection(userId, {
        id: connection.id,
        accountId: connection.accountId,
        platform: connection.platform,
        broker: connection.broker,
        accountNumber: connection.accountNumber,
        connectionStatus: finalStatus,
        lastSyncError: errorMsg,
      });

      await createConnectionSyncLog(userId, {
        id: logId,
        connectionId: connection.id,
        status: 'FAILED',
        tradesImported: 0,
        tradesUpdated: 0,
        errorMessage: errorMsg,
        details: { trigger: options?.trigger || 'manual', durationMs: Date.now() - startTime },
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        tradesImported: 0,
        tradesUpdated: 0,
        errorMessage: errorMsg,
        durationMs: Date.now() - startTime,
      };
    }

    // 6. Idempotently upsert synced trades
    let importedCount = 0;
    let updatedCount = 0;

    for (const trade of syncResult.trades) {
      try {
        const { isNew } = await upsertSyncedTrade(userId, connection.accountId, connection.id, trade);
        if (isNew) {
          importedCount++;
        } else {
          updatedCount++;
        }
      } catch (upsertErr) {
        console.error('[SyncEngine] Error upserting synced trade:', upsertErr);
      }
    }

    // 7. Update linked TradingAccount balance & status
    const allAccounts = await getTradingAccounts(userId);
    const linkedAccount = allAccounts.find((a) => a.id === connection.accountId);
    if (linkedAccount) {
      const newBalance = syncResult.accountInfo?.balance ?? linkedAccount.currentBalance;
      await saveTradingAccount(userId, {
        ...linkedAccount,
        currentBalance: newBalance,
        lastSync: new Date().toISOString(),
        syncStatus: 'HEALTHY',
      });
    }

    // 8. Update connection record status
    const nowIso = new Date().toISOString();
    await saveTradingAccountConnection(userId, {
      id: connection.id,
      accountId: connection.accountId,
      platform: connection.platform,
      broker: connection.broker,
      accountNumber: connection.accountNumber,
      connectionStatus: 'SYNCED',
      balance: syncResult.accountInfo?.balance ?? connection.balance,
      equity: syncResult.accountInfo?.equity ?? connection.equity,
      lastSyncAt: nowIso,
      lastSyncError: undefined,
      lastSyncTradesCount: (connection.lastSyncTradesCount || 0) + importedCount,
    });

    // 9. Write successful sync log
    const duration = Date.now() - startTime;
    await createConnectionSyncLog(userId, {
      id: logId,
      connectionId: connection.id,
      status: 'SUCCESS',
      tradesImported: importedCount,
      tradesUpdated: updatedCount,
      details: {
        trigger: options?.trigger || 'manual',
        totalHistoryFetched: syncResult.trades.length,
        serverTime: syncResult.accountInfo?.serverTime,
        pingMs: syncResult.accountInfo?.pingMs,
      },
      startedAt,
      completedAt: nowIso,
      durationMs: duration,
    });

    return {
      success: true,
      tradesImported: importedCount,
      tradesUpdated: updatedCount,
      accountInfo: syncResult.accountInfo,
      durationMs: duration,
    };
  } catch (err: any) {
    console.error('[SyncEngine] Fatal error during sync:', err);
    const duration = Date.now() - startTime;
    const errorMsg = err?.message || 'Internal error during synchronization';

    try {
      await saveTradingAccountConnection(userId, {
        id: connectionId,
        accountId: '',
        platform: '',
        broker: '',
        accountNumber: '',
        connectionStatus: 'ERROR',
        lastSyncError: errorMsg,
      });

      await createConnectionSyncLog(userId, {
        id: logId,
        connectionId,
        status: 'FAILED',
        tradesImported: 0,
        tradesUpdated: 0,
        errorMessage: errorMsg,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: duration,
      });
    } catch {
      // ignore secondary logging errors
    }

    return {
      success: false,
      tradesImported: 0,
      tradesUpdated: 0,
      errorMessage: errorMsg,
      durationMs: duration,
    };
  } finally {
    activeSyncMutex.delete(mutexKey);
  }
}

/**
 * Background Auto-Sync Worker Scheduler.
 * Periodically polls enabled connections and triggers background synchronizations.
 */
let isWorkerRunning = false;

export function startBackgroundSyncWorker(intervalMs = 300000) { // 5 mins
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  console.log(`[Auto-Sync Worker] Started background synchronization runner (Interval: ${intervalMs / 1000}s).`);

  setInterval(async () => {
    try {
      // Find all connections that have sync_enabled = true and connection_status != 'DISCONNECTED'
      const rows = await db
        .select()
        .from(tradingAccountConnections)
        .where(eq(tradingAccountConnections.syncEnabled, true));

      for (const conn of rows) {
        if (conn.connectionStatus === 'DISCONNECTED' || conn.connectionStatus === 'REAUTH_REQUIRED') {
          continue;
        }

        // Check if interval threshold has passed
        const intervalMins = conn.autoSyncIntervalMins || 5;
        const lastSync = conn.lastSyncAt ? new Date(conn.lastSyncAt).getTime() : 0;
        const elapsedMins = (Date.now() - lastSync) / 60000;

        if (elapsedMins >= intervalMins) {
          syncAccountConnection(conn.userId, conn.id, { trigger: 'scheduled_auto_sync' }).catch((e) => {
            console.warn(`[Auto-Sync Worker] Scheduled sync error for conn ${conn.id}:`, e?.message || e);
          });
        }
      }
    } catch (err) {
      console.warn('[Auto-Sync Worker] Scheduler iteration error:', err);
    }
  }, intervalMs);
}
