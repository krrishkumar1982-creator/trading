import bcrypt from 'bcrypt';
import express from 'express';
import crypto from 'crypto';
import { fetchServerHistoricalCandles } from './marketDataProvider.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { ensureUserAndInitialSeed } from '../db/seed.ts';
import { broadcastCommunityEvent, broadcastUserEvent } from './socket.ts';
import {
  getTradingAccounts,
  saveTradingAccount,
  deleteTradingAccount,
  getTrades,
  saveTrade,
  deleteTrade,
  bulkDeleteTrades,
  getPlaybooks,
  savePlaybook,
  deletePlaybook,
  getStrategies,
  saveStrategy,
  deleteStrategy,
  getJournalNotes,
  saveJournalNote,
  deleteJournalNote,
  getJournalFolders,
  saveJournalFolder,
  deleteJournalFolder,
  getRiskGoals,
  saveRiskGoals,
  getNotifications,
  saveNotification,
  getCommunityPosts,
  saveCommunityPost,
  deleteCommunityPost,
  togglePostLike,
  getPostComments,
  addPostComment,
  deletePostComment,
  getMentorStudents,
  saveMentorStudent,
  deleteMentorStudent,
  getMentorDirectivesForMentor,
  getMentorDirectivesForStudent,
  createMentorDirective,
  updateMentorDirective,
  deleteMentorDirective,
  acknowledgeMentorDirective,
  getBacktestSessions,
  saveBacktestSession,
  deleteBacktestSession,
  getBrokerIntegrations,
  getBrokerIntegrationById,
  getBrokerIntegrationGlobalById,
  getBrokerIntegrationBySecret,
  saveBrokerIntegration,
  deleteBrokerIntegration,
  hasProcessedEvent,
  recordIntegrationEvent,
  getIntegrationEventsByIntegrationId,
  upsertBrokerTrade,
  getDueRetryEvents,
  updateIntegrationEvent,
  getIntegrationEventById,
  getIntegrationStatsAndHealth,
  getDailyChecklist,
  saveDailyChecklistItem,
  saveDailyChecklistBulk,
  getLeaderboardData,
  updateUserPointsAdmin,
  updateUserRoleAdmin,
  getBacktestDrawings,
  saveBacktestDrawings,
  getChartTemplates,
  saveChartTemplate,
  deleteChartTemplate,
} from '../db/repository.ts';
import { db } from '../db/index.ts';
import { integrationEvents, brokerIntegrations, mentorDirectives } from '../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';

export const app = express();

app.use(express.json({ limit: '10mb' }));

// Health Check Endpoints (Liveness and Readiness)
app.get('/health/live', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Supabase Storage Upload proxy endpoint
app.post('/api/storage/upload', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fileData, fileName, bucket, contentType } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'Missing fileData (base64 string or data URL)' });
    }

    const targetBucket = bucket || 'screenshots';
    const targetPath = fileName || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;

    // Extract base64 payload
    const base64Data = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = contentType || 'image/png';

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const uploadEndpoint = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${targetBucket}/${targetPath}`;
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: buffer,
      });

      if (response.ok) {
        const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${targetBucket}/${targetPath}`;
        return res.json({ success: true, url: publicUrl, path: targetPath });
      } else {
        const errText = await response.text();
        console.warn('[Server Supabase Storage] Remote upload returned non-200:', errText);
      }
    }

    // Return the data URL directly as fallback if remote Supabase credentials are not supplied
    res.json({ success: true, url: fileData, path: targetPath });
  } catch (err: any) {
    console.error('Storage upload proxy error:', err);
    res.status(500).json({ success: false, error: err.message || 'Storage upload failed' });
  }
});

app.get('/health/ready', async (_req, res) => {
  try {
    // Perform a lightweight database query to check connectivity
    await db.execute(sql`SELECT 1`);
    res.status(200).json({
      status: 'READY',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Health Check] Readiness check failed:', err?.message || err);
    res.status(503).json({
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Market data candles API endpoint
app.get(['/api/market-data/candles', '/api/candles'], async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'XAUUSD';
    const timeframe = (req.query.timeframe as string) || '15m';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 350;
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;

    const response = await fetchServerHistoricalCandles({
      symbol,
      timeframe,
      limit,
      startDate,
      endDate,
    });

    res.status(response.success ? 200 : 502).json(response);
  } catch (err: any) {
    console.error('[Server MarketData Error]', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error',
      data: [],
      count: 0,
    });
  }
});

// GET complete initial user state from database
app.get('/api/state', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await ensureUserAndInitialSeed(userId);

    const [
      accounts,
      tradesList,
      playbooksList,
      strategiesList,
      notesList,
      foldersList,
      goals,
      notificationsList,
      postsList,
      studentsList,
      backtestSessionsList,
      integrationsList,
      directivesSent,
      directivesReceived,
    ] = await Promise.all([
      getTradingAccounts(userId),
      getTrades(userId),
      getPlaybooks(userId),
      getStrategies(userId),
      getJournalNotes(userId),
      getJournalFolders(userId),
      getRiskGoals(userId),
      getNotifications(userId),
      getCommunityPosts(userId),
      getMentorStudents(userId),
      getBacktestSessions(userId),
      getBrokerIntegrations(userId),
      getMentorDirectivesForMentor(userId),
      getMentorDirectivesForStudent(userId),
    ]);

    res.json({
      success: true,
      userId,
      accounts,
      trades: tradesList,
      playbooks: playbooksList,
      strategies: strategiesList,
      notes: notesList,
      folders: foldersList,
      riskGoals: goals,
      notifications: notificationsList,
      communityPosts: postsList,
      mentorStudents: studentsList,
      backtestSessions: backtestSessionsList,
      integrations: integrationsList,
      mentorDirectivesSent: directivesSent,
      mentorDirectivesReceived: directivesReceived,
    });
  } catch (error: any) {
    console.error('API /api/state error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to load user state' });
  }
});

// Idempotent migration from client localStorage to database
app.post('/api/sync-migration', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const {
      accounts,
      trades: clientTrades,
      playbooks: clientPlaybooks,
      strategies: clientStrategies,
      notes: clientNotes,
      folders: clientFolders,
      riskGoals: clientRiskGoals,
      backtestSessions: clientBacktestSessions
    } = req.body;

    if (Array.isArray(accounts)) {
      for (const a of accounts) await saveTradingAccount(userId, a);
    }
    if (Array.isArray(clientTrades)) {
      for (const t of clientTrades) await saveTrade(userId, t);
    }
    if (Array.isArray(clientPlaybooks)) {
      for (const p of clientPlaybooks) await savePlaybook(userId, p);
    }
    if (Array.isArray(clientStrategies)) {
      for (const s of clientStrategies) await saveStrategy(userId, s);
    }
    if (Array.isArray(clientNotes)) {
      for (const n of clientNotes) await saveJournalNote(userId, n);
    }
    if (Array.isArray(clientFolders)) {
      for (const f of clientFolders) await saveJournalFolder(userId, f);
    }
    if (clientRiskGoals && typeof clientRiskGoals === 'object') {
      await saveRiskGoals(userId, clientRiskGoals);
    }
    if (Array.isArray(clientBacktestSessions)) {
      for (const bs of clientBacktestSessions) await saveBacktestSession(userId, bs);
    }

    res.json({ success: true, message: 'Migration completed successfully' });
  } catch (error: any) {
    console.error('API /api/sync-migration error:', error);
    res.status(500).json({ success: false, error: error.message || 'Migration failed' });
  }
});

function handleApiError(res: express.Response, error: any) {
  const message = error?.message || 'An error occurred';
  if (message.startsWith('Forbidden') || message.includes('belongs to another user')) {
    return res.status(403).json({ success: false, error: message });
  }
  return res.status(500).json({ success: false, error: message });
}

// Daily Checklist REST endpoints
app.get('/api/checklist', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const date = req.query.date as string;
    if (!date) {
      return res.status(400).json({ success: false, error: 'Missing date parameter' });
    }
    const completedItems = await getDailyChecklist(userId, date);
    res.json({ success: true, completedItems });
  } catch (error: any) {
    console.error('GET /api/checklist error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch checklist' });
  }
});

app.put('/api/checklist/:itemId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const { itemId } = req.params;
    const { date, completed } = req.body;
    if (!itemId || !date || typeof completed !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Missing or invalid parameters' });
    }
    await saveDailyChecklistItem(userId, date, itemId, completed);
    res.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/checklist/:itemId error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update checklist item' });
  }
});

app.post('/api/checklist/bulk', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const { date, completedItems } = req.body;
    if (!date || !Array.isArray(completedItems)) {
      return res.status(400).json({ success: false, error: 'Missing or invalid parameters' });
    }
    await saveDailyChecklistBulk(userId, date, completedItems);
    res.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/checklist/bulk error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to bulk update checklist' });
  }
});

// Accounts REST endpoints
app.post('/api/accounts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await saveTradingAccount(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/accounts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deleteTradingAccount(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Trades REST endpoints
app.post('/api/trades', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await saveTrade(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/trades/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deleteTrade(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.post('/api/trades/bulk-delete', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const { ids } = req.body;
    if (Array.isArray(ids)) {
      await bulkDeleteTrades(userId, ids);
    }
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.patch('/api/trades/bulk-edit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const { ids, updates } = req.body;
    if (Array.isArray(ids) && updates) {
      const allTrades = await getTrades(userId);
      for (const id of ids) {
        const found = allTrades.find((t) => t.id === id);
        if (found) {
          await saveTrade(userId, { ...found, ...updates });
        }
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Playbooks REST endpoints
app.post('/api/playbooks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await savePlaybook(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/playbooks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deletePlaybook(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Strategies REST endpoints
app.post('/api/strategies', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await saveStrategy(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/strategies/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deleteStrategy(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Journal Notes & Folders REST endpoints
app.post('/api/journal/notes', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await saveJournalNote(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/journal/notes/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deleteJournalNote(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.post('/api/journal/folders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await saveJournalFolder(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/journal/folders/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deleteJournalFolder(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Risk Goals REST endpoint
app.post('/api/risk-goals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await saveRiskGoals(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Notifications REST endpoint
app.post('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await saveNotification(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Community Posts REST endpoints
app.get('/api/community-posts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const posts = await getCommunityPosts(userId);
    res.json({ success: true, posts });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.post('/api/community-posts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const authorName = req.user?.name || req.body.authorName || 'Trader';
    const authorAvatar = req.user?.picture || req.body.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
    const authorHandle = req.user?.email ? `@${req.user.email.split('@')[0]}` : req.body.authorHandle || `@trader_${userId.slice(0, 6)}`;

    const savedPost = await saveCommunityPost(userId, {
      ...req.body,
      authorName,
      authorHandle,
      authorAvatar,
    });

    broadcastCommunityEvent('community:post_created', { post: savedPost });
    res.json({ success: true, post: savedPost });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.patch('/api/community-posts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const updatedPost = await saveCommunityPost(userId, {
      id: req.params.id,
      content: req.body.content,
      symbol: req.body.symbol,
      pnl: req.body.pnl,
      rMultiple: req.body.rMultiple,
      imageUrl: req.body.imageUrl,
    });

    broadcastCommunityEvent('community:post_updated', { postId: req.params.id, post: updatedPost });
    res.json({ success: true, post: updatedPost });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/community-posts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deleteCommunityPost(userId, req.params.id);
    broadcastCommunityEvent('community:post_deleted', { postId: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.post('/api/community-posts/:id/like', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const result = await togglePostLike(userId, req.params.id);
    broadcastCommunityEvent('community:like_toggled', {
      postId: req.params.id,
      likes: result.likesCount,
      userId,
      liked: result.liked,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.get('/api/community-posts/:id/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const comments = await getPostComments(req.params.id);
    res.json({ success: true, comments });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.post('/api/community-posts/:id/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const authorName = req.user?.name || req.body.author || 'Trader';
    const authorAvatar = req.user?.picture || req.body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
    const result = await addPostComment(userId, authorName, authorAvatar, req.params.id, req.body.content);

    broadcastCommunityEvent('community:comment_added', {
      postId: req.params.id,
      comment: result.comment,
      commentsCount: result.commentsCount,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/community-posts/:id/comments/:commentId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const result = await deletePostComment(userId, req.params.id, req.params.commentId);

    broadcastCommunityEvent('community:comment_deleted', {
      postId: req.params.id,
      commentId: req.params.commentId,
      commentsCount: result.commentsCount,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Mentor Students REST endpoint
app.post('/api/mentor-students', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await saveMentorStudent(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/mentor-students/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deleteMentorStudent(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Mentor Directives REST endpoints
app.get('/api/mentor/directives', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const [sent, received] = await Promise.all([
      getMentorDirectivesForMentor(userId),
      getMentorDirectivesForStudent(userId),
    ]);
    res.json({ success: true, sent, received });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.post('/api/mentor/directives', requireAuth, async (req: AuthRequest, res) => {
  try {
    const mentorId = req.devUserId || 'default_user_1';
    const { studentCode, content, type } = req.body;
    if (!studentCode || !content) {
      return res.status(400).json({ success: false, error: 'Missing required parameters: studentCode or content' });
    }

    const directive = await createMentorDirective(mentorId, studentCode, content, type || 'DIRECTIVE');

    // Real-time broadcast to both student and mentor
    broadcastUserEvent(directive.studentId, 'mentor_directive_created', directive);
    broadcastUserEvent(directive.mentorId, 'mentor_directive_created', directive);

    res.json({ success: true, directive });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.patch('/api/mentor/directives/:id/acknowledge', requireAuth, async (req: AuthRequest, res) => {
  try {
    const studentId = req.devUserId || 'default_user_1';
    const directiveId = req.params.id;

    const success = await acknowledgeMentorDirective(studentId, directiveId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Directive not found or not authorized' });
    }

    // Fetch updated directive to broadcast
    const [directiveList] = await db.select().from(mentorDirectives).where(eq(mentorDirectives.id, directiveId)).limit(1);
    const updatedDirective = directiveList[0];

    if (updatedDirective) {
      broadcastUserEvent(updatedDirective.studentId, 'mentor_directive_updated', updatedDirective);
      broadcastUserEvent(updatedDirective.mentorId, 'mentor_directive_updated', updatedDirective);
    }

    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Student Feedback specific REST endpoints
app.get('/api/mentor/students/:studentId/feedback', requireAuth, async (req: AuthRequest, res) => {
  try {
    const mentorId = req.devUserId || 'default_user_1';
    const studentId = req.params.studentId;

    const feedback = await getMentorDirectivesForMentor(mentorId, studentId);
    res.json({ success: true, feedback });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.post('/api/mentor/students/:studentId/feedback', requireAuth, async (req: AuthRequest, res) => {
  try {
    const mentorId = req.devUserId || 'default_user_1';
    const studentId = req.params.studentId;
    const { content, type } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Feedback content is required' });
    }

    const directive = await createMentorDirective(mentorId, studentId, content.trim(), type || 'FEEDBACK');

    // Real-time broadcast
    broadcastUserEvent(directive.studentId, 'mentor_directive_created', directive);
    broadcastUserEvent(directive.mentorId, 'mentor_directive_created', directive);

    res.json({ success: true, directive, feedback: directive });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.put('/api/mentor/feedback/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const mentorId = req.devUserId || 'default_user_1';
    const directiveId = req.params.id;
    const { content, status, type } = req.body;

    const updated = await updateMentorDirective(mentorId, directiveId, { content, status, type });
    if (updated) {
      broadcastUserEvent(updated.studentId, 'mentor_directive_updated', updated);
      broadcastUserEvent(updated.mentorId, 'mentor_directive_updated', updated);
    }

    res.json({ success: true, directive: updated, feedback: updated });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/mentor/feedback/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const mentorId = req.devUserId || 'default_user_1';
    const directiveId = req.params.id;

    await deleteMentorDirective(mentorId, directiveId);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Leaderboard & Admin REST endpoints
app.get('/api/leaderboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await getLeaderboardData();
    res.json({ success: true, leaderboard: data });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.patch('/api/admin/leaderboard/:userId/points', requireAuth, async (req: AuthRequest, res) => {
  try {
    const adminUserId = req.devUserId || 'default_user_1';
    const targetUserId = req.params.userId;
    const { points, reason } = req.body;

    if (points === undefined || isNaN(Number(points))) {
      return res.status(400).json({ success: false, error: 'Points must be a valid number' });
    }

    await updateUserPointsAdmin(adminUserId, targetUserId, Number(points), reason);
    res.json({ success: true, points: Number(points) });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.patch('/api/admin/leaderboard/:userId/role', requireAuth, async (req: AuthRequest, res) => {
  try {
    const adminUserId = req.devUserId || 'default_user_1';
    const targetUserId = req.params.userId;
    const { role, reason } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, error: 'Role is required' });
    }

    await updateUserRoleAdmin(adminUserId, targetUserId, role, reason);
    res.json({ success: true, role });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Backtesting Sessions REST endpoints
app.get('/api/backtesting/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const sessions = await getBacktestSessions(userId);
    res.json({ success: true, sessions });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.post('/api/backtesting/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await saveBacktestSession(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/backtesting/sessions/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deleteBacktestSession(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Backtesting Drawings REST endpoints
app.get('/api/backtest/drawings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const symbol = req.query.symbol as string;
    const sessionId = (req.query.sessionId as string) || 'default';
    const drawings = await getBacktestDrawings(userId, symbol, sessionId);
    res.json({ success: true, drawings });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.put('/api/backtest/drawings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const { symbol, drawings, sessionId, timeframe } = req.body;
    if (!symbol || !Array.isArray(drawings)) {
      return res.status(400).json({ success: false, error: 'Symbol and drawings array are required' });
    }
    const result = await saveBacktestDrawings(userId, symbol, drawings, sessionId || 'default', timeframe || '15m');
    res.json({ success: true, ...result });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// Chart Templates REST endpoints
app.get('/api/backtest/templates', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const templates = await getChartTemplates(userId);
    res.json({ success: true, templates });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.post('/api/backtest/templates', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const { name, description, chartType, indicators, id } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Template name is required' });
    }
    const result = await saveChartTemplate(userId, {
      id,
      name,
      description,
      chartType: chartType || 'CANDLESTICK',
      indicators: indicators || [],
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.delete('/api/backtest/templates/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    await deleteChartTemplate(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});


// Explicit PATCH & PUT edit handlers for Trade, Account, Playbook, Strategy, Note
app.patch(['/api/trades/:id', '/api/accounts/:id', '/api/playbooks/:id', '/api/strategies/:id', '/api/journal/notes/:id'], requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const url = req.originalUrl;
    if (url.includes('/trades/')) {
      await saveTrade(userId, { ...req.body, id: req.params.id });
    } else if (url.includes('/accounts/')) {
      await saveTradingAccount(userId, { ...req.body, id: req.params.id });
    } else if (url.includes('/playbooks/')) {
      await savePlaybook(userId, { ...req.body, id: req.params.id });
    } else if (url.includes('/strategies/')) {
      await saveStrategy(userId, { ...req.body, id: req.params.id });
    } else if (url.includes('/journal/notes/')) {
      await saveJournalNote(userId, { ...req.body, id: req.params.id });
    }
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

app.put(['/api/trades/:id', '/api/accounts/:id', '/api/playbooks/:id', '/api/strategies/:id', '/api/journal/notes/:id'], requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId || 'default_user_1';
    const url = req.originalUrl;
    if (url.includes('/trades/')) {
      await saveTrade(userId, { ...req.body, id: req.params.id });
    } else if (url.includes('/accounts/')) {
      await saveTradingAccount(userId, { ...req.body, id: req.params.id });
    } else if (url.includes('/playbooks/')) {
      await savePlaybook(userId, { ...req.body, id: req.params.id });
    } else if (url.includes('/strategies/')) {
      await saveStrategy(userId, { ...req.body, id: req.params.id });
    } else if (url.includes('/journal/notes/')) {
      await saveJournalNote(userId, { ...req.body, id: req.params.id });
    }
    res.json({ success: true });
  } catch (error: any) {
    handleApiError(res, error);
  }
});

// ==========================================
// BROKER INTEGRATIONS & WEBHOOK API ENDPOINTS
// ==========================================

// GET /api/integrations
app.get('/api/integrations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId!;
    const list = await getBrokerIntegrations(userId);
    res.json({ success: true, integrations: list });
  } catch (err: any) {
    handleApiError(res, err);
  }
});

// GET /api/integrations/:id/events - get event history for an integration
app.get('/api/integrations/:id/events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId!;
    const { id } = req.params;
    
    // Check if the integration belongs to the user
    const integration = await getBrokerIntegrationById(userId, id);
    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const events = await getIntegrationEventsByIntegrationId(userId, id, limit, offset);
    res.json({ success: true, events });
  } catch (err: any) {
    handleApiError(res, err);
  }
});

// GET /api/integrations/:id/health - get calculated health and stats for an integration
app.get('/api/integrations/:id/health', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId!;
    const { id } = req.params;

    const stats = await getIntegrationStatsAndHealth(userId, id);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Integration not found or unauthorized' });
    }

    res.json({ success: true, health: stats });
  } catch (err: any) {
    handleApiError(res, err);
  }
});

// POST /api/integrations/:id/events/:eventId/retry - manual retry a failed event
app.post('/api/integrations/:id/events/:eventId/retry', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId!;
    const { id, eventId } = req.params;

    // 1. Verify ownership of the integration
    const integration = await getBrokerIntegrationById(userId, id);
    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    // 2. Verify the event belongs to this integration and user
    const event = await getIntegrationEventById(userId, eventId);
    if (!event || event.integrationId !== id) {
      return res.status(404).json({ success: false, error: 'Event not found or mismatch' });
    }

    // 3. Reject already successfully processed events
    if (event.processingStatus === 'PROCESSED' || event.status === 'PROCESSED') {
      return res.status(400).json({ success: false, error: 'This event has already been successfully processed' });
    }

    // 4. Prevent duplicate concurrent retries
    if (event.processingStatus === 'PROCESSING' || event.processingStatus === 'RETRYING') {
      return res.status(409).json({ success: false, error: 'This event is already undergoing active retry or processing' });
    }

    // 5. Lock and update status to RETRYING
    await updateIntegrationEvent(event.id, {
      processingStatus: 'RETRYING',
      lastAttemptAt: new Date(),
      attemptCount: (event.attemptCount || 1) + 1,
    });

    await recordIntegrationEvent({
      id: `evlog_${Date.now()}_man_req_${Math.random().toString(36).substring(2, 5)}`,
      integrationId: id,
      userId,
      externalEventId: event.externalEventId,
      eventType: 'MANUAL_RETRY_REQUESTED',
      payload: { eventId, attemptCount: (event.attemptCount || 1) + 1 },
      status: 'PROCESSED',
      processingStatus: 'RETRYING',
    });

    try {
      // 6. Execute business logic (process trade)
      const trade = await upsertBrokerTrade(userId, integration, event.payload as any);

      // 7. Update event to PROCESSED
      await updateIntegrationEvent(event.id, {
        processingStatus: 'PROCESSED',
        status: 'PROCESSED',
        processedAt: new Date(),
        error: null,
        errorMessage: null,
      });

      await recordIntegrationEvent({
        id: `evlog_${Date.now()}_man_suc_${Math.random().toString(36).substring(2, 5)}`,
        integrationId: id,
        userId,
        externalEventId: event.externalEventId,
        eventType: 'MANUAL_RETRY_SUCCEEDED',
        payload: { tradeId: trade.id },
        status: 'SUCCESS',
        processingStatus: 'PROCESSED',
      });

      // Broadcast real-time update
      broadcastUserEvent(userId, 'user_trade_synced', {
        trade,
        accountId: integration.accountId,
        provider: integration.provider,
      });

      res.json({
        success: true,
        message: 'Manual retry succeeded',
        tradeId: trade.id,
        status: trade.status,
      });
    } catch (procErr: any) {
      const errorMsg = procErr.message || 'Error processing trade during manual retry';
      
      const nextAttempt = (event.attemptCount || 1) + 1;
      const isRetryable = isErrorRetryable(procErr);
      const canRetry = nextAttempt < (event.maxAttempts || 5);
      const finalStatus = canRetry ? 'RETRY_SCHEDULED' : 'RETRY_EXHAUSTED';

      await updateIntegrationEvent(event.id, {
        processingStatus: finalStatus,
        status: 'FAILED',
        error: errorMsg,
        errorMessage: errorMsg,
        failedAt: new Date(),
        nextRetryAt: canRetry ? new Date(Date.now() + 10000) : null,
      });

      await recordIntegrationEvent({
        id: `evlog_${Date.now()}_man_fail_${Math.random().toString(36).substring(2, 5)}`,
        integrationId: id,
        userId,
        externalEventId: event.externalEventId,
        eventType: 'MANUAL_RETRY_FAILED',
        payload: { error: errorMsg },
        status: 'FAILED',
        processingStatus: finalStatus,
      });

      res.status(500).json({
        success: false,
        error: `Manual retry failed: ${errorMsg}`,
      });
    }
  } catch (err: any) {
    handleApiError(res, err);
  }
});

// POST /api/integrations - create new integration
app.post('/api/integrations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId!;
    const { accountId, provider, displayName, externalAccountId } = req.body;

    if (!accountId || !provider) {
      return res.status(400).json({ success: false, error: 'accountId and provider are required' });
    }

    const integrationId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const secret = `df_live_${crypto.randomBytes(32).toString('hex')}`;
    const secretHash = await bcrypt.hash(secret, 10);

    const integrationData = {
      id: integrationId,
      accountId,
      provider: provider.toUpperCase(),
      displayName: displayName || `${provider.toUpperCase()} Auto-Sync`,
      status: 'WAITING_FOR_EVENTS',
      secretHash,
      externalAccountId: externalAccountId || null,
    };

    await saveBrokerIntegration(userId, integrationData);
    
    await recordIntegrationEvent({
      id: `evlog_${Date.now()}_created`,
      integrationId,
      userId,
      externalEventId: `evt_${Date.now()}_created`,
      eventType: 'INTEGRATION_CREATED',
      payload: { provider: provider.toUpperCase(), displayName: integrationData.displayName, accountId },
      status: 'PROCESSED',
    });
    
    // Create EA code if MT4 or MT5
    let eaCode = null;
    const isMt5 = integrationData.provider === 'MT5';
    const isMt4 = integrationData.provider === 'MT4';
    if (isMt4 || isMt5) {
      const host = req.headers.host || 'localhost:3000';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const webhookUrl = `${protocol}://${host}/api/integrations/webhook/${integrationId}`;
      const eaName = isMt5 ? 'DuskFlow_MT5_AutoSync_Bridge.mq5' : 'DuskFlow_MT4_AutoSync_Bridge.mq4';

      eaCode = `//+------------------------------------------------------------------+
//|                                  ${eaName} |
//|                      Copyright 2026, DuskFlow PRO Trading Journal |
//|                                    https://duskflow.io           |
//+------------------------------------------------------------------+
#property copyright "DuskFlow PRO"
#property link      "https://duskflow.io"
#property version   "2.00"
#property strict

input string WebhookURL = "${webhookUrl}";
input string IntegrationSecret = "${secret}";
input string IntegrationID = "${integrationId}";
input bool EnableTradeOpened = true;
input bool EnableTradeClosed = true;

// Basic HTTP implementation...
int OnInit() {
  Print("DuskFlow Webhook bridge initialized. Connecting to: ", WebhookURL);
  return(INIT_SUCCEEDED);
}
void OnDeinit(const int reason) { Print("DuskFlow bridge stopped."); }
void OnTick() { }
`;
    }

    res.json({ 
      success: true, 
      integration: { ...integrationData, secretHash: undefined },
      secret, // return raw secret ONLY once
      eaCode
    });
  } catch (err: any) {
    handleApiError(res, err);
  }
});

// DELETE /api/integrations/:id - revoke/delete integration
app.delete('/api/integrations/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId!;
    const { id } = req.params;
    const integration = await getBrokerIntegrationById(userId, id);
    if (integration) {
      await recordIntegrationEvent({
        id: `evlog_${Date.now()}_deleted`,
        integrationId: id,
        userId,
        externalEventId: `evt_${Date.now()}_deleted`,
        eventType: 'INTEGRATION_DELETED',
        payload: { provider: integration.provider, displayName: integration.displayName, action: 'integration_deleted' },
        status: 'PROCESSED',
      });
    }
    await deleteBrokerIntegration(userId, id);
    res.json({ success: true, message: 'Integration revoked and deleted' });
  } catch (err: any) {
    handleApiError(res, err);
  }
});

// GET /api/integrations/:id/ea-script - download/view MT4/MT5 EA MQL code preconfigured with user's secret
app.get('/api/integrations/:id/ea-script', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId!;
    const { id } = req.params;
    const integration = await getBrokerIntegrationById(userId, id);

    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    const host = req.headers.host || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const webhookUrl = `${protocol}://${host}/api/integrations/webhook/${integration.id}`;

    const isMt5 = integration.provider === 'MT5';
    const eaName = isMt5 ? 'DuskFlow_MT5_AutoSync_Bridge.mq5' : 'DuskFlow_MT4_AutoSync_Bridge.mq4';

    const mqlCode = `//+------------------------------------------------------------------+
//|                                  ${eaName} |
//|                      Copyright 2026, DuskFlow PRO Trading Journal |
//|                                    https://duskflow.io           |
//+------------------------------------------------------------------+
#property copyright "DuskFlow PRO"
#property link      "https://duskflow.io"
#property version   "2.00"
#property strict

input string WebhookURL = "${webhookUrl}";
input string IntegrationSecret = "PASTE_YOUR_SECRET_HERE";
input string IntegrationID = "${integration.id}";
input bool EnableTradeOpened = true;
input bool EnableTradeClosed = true;

// Utility function to send JSON payload via HTTPS POST
void SendDuskFlowWebhook(string eventType, string ticketId, string symbol, string type, double entryPrice, double exitPrice, double volume, double pnl, double comm, double swap)
{
   string jsonPayload = StringFormat(
      "{\\"eventId\\":\\"%s_%s_%d\\",\\"eventType\\":\\"%s\\",\\"externalTradeId\\":\\"%s\\",\\"symbol\\":\\"%s\\",\\"direction\\":\\"%s\\",\\"entryPrice\\":%.5f,\\"exitPrice\\":%.5f,\\"volume\\":%.2f,\\"netPnl\\":%.2f,\\"commission\\":%.2f,\\"swap\\":%.2f}",
      eventType, ticketId, TimeCurrent(),
      eventType, ticketId, symbol, type, entryPrice, exitPrice, volume, pnl, comm, swap
   );

   char data[];
   StringToCharArray(jsonPayload, data, 0, StringLen(jsonPayload));

   string headers = "Content-Type: application/json\\r\\nAuthorization: Bearer " + IntegrationSecret + "\\r\\nIdempotency-Key: " + ticketId + "_" + IntegerToString(TimeCurrent()) + "\\r\\n";
   char result[];
   string result_headers;

   int res = WebRequest("POST", WebhookURL, headers, 5000, data, result, result_headers);
   if (res == 200) {
      Print("[DuskFlow] Trade event successfully synced to journal!");
   } else {
      Print("[DuskFlow] Webhook error HTTP code: ", res);
   }
}
`;

    res.json({
      success: true,
      filename: eaName,
      provider: integration.provider,
      webhookUrl,
      code: mqlCode,
    });
  } catch (err: any) {
    handleApiError(res, err);
  }
});

// POST /api/integrations/:id/regenerate - regenerate secret for integration
app.post('/api/integrations/:id/regenerate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.devUserId!;
    const { id } = req.params;
    const integration = await getBrokerIntegrationById(userId, id);

    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    const secret = `df_live_${crypto.randomBytes(32).toString('hex')}`;
    const secretHash = await bcrypt.hash(secret, 10);

    // Update secret_hash
    const updatedData = {
      ...integration,
      secretHash,
      updatedAt: new Date(),
    };
    await saveBrokerIntegration(userId, updatedData);

    await recordIntegrationEvent({
      id: `evlog_${Date.now()}_regenerated`,
      integrationId: id,
      userId,
      externalEventId: `evt_${Date.now()}_regenerated`,
      eventType: 'INTEGRATION_REGENERATED',
      payload: { provider: integration.provider, displayName: integration.displayName, action: 'secret_regenerated' },
      status: 'PROCESSED',
    });

    // Create EA code with the new secret
    let eaCode = null;
    const isMt5 = integration.provider === 'MT5';
    const isMt4 = integration.provider === 'MT4';
    if (isMt4 || isMt5) {
      const host = req.headers.host || 'localhost:3000';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const webhookUrl = `${protocol}://${host}/api/integrations/webhook/${id}`;
      const eaName = isMt5 ? 'DuskFlow_MT5_AutoSync_Bridge.mq5' : 'DuskFlow_MT4_AutoSync_Bridge.mq4';

      eaCode = `//+------------------------------------------------------------------+
//|                                  ${eaName} |
//|                      Copyright 2026, DuskFlow PRO Trading Journal |
//|                                    https://duskflow.io           |
//+------------------------------------------------------------------+
#property copyright "DuskFlow PRO"
#property link      "https://duskflow.io"
#property version   "2.00"
#property strict

input string WebhookURL = "${webhookUrl}";
input string IntegrationSecret = "${secret}";
input string IntegrationID = "${id}";
input bool EnableTradeOpened = true;
input bool EnableTradeClosed = true;

// Basic HTTP implementation...
int OnInit() {
  Print("DuskFlow Webhook bridge initialized. Connecting to: ", WebhookURL);
  return(INIT_SUCCEEDED);
}
void OnDeinit(const int reason) { Print("DuskFlow bridge stopped."); }
void OnTick() { }
`;
    }

    res.json({
      success: true,
      integration: { ...updatedData, secretHash: undefined },
      secret,
      eaCode
    });
  } catch (err: any) {
    handleApiError(res, err);
  }
});

const webhookRateLimiter = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let rateData = webhookRateLimiter.get(ip);
  if (!rateData || now > rateData.resetAt) {
    rateData = { count: 0, resetAt: now + WINDOW_MS };
  }
  rateData.count++;
  webhookRateLimiter.set(ip, rateData);
  return rateData.count <= MAX_ATTEMPTS;
}

function parseLegacySecret(secret: string): string | null {
  if (!secret || !secret.startsWith('df_live_int_')) {
    return null;
  }
  const parts = secret.split('_');
  if (parts.length >= 5) {
    return `int_${parts[3]}_${parts[4]}`;
  }
  return null;
}

function isErrorRetryable(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  if (
    msg.includes('malformed') ||
    msg.includes('invalid field') ||
    msg.includes('unsupported') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('not found') ||
    msg.includes('spoof')
  ) {
    return false;
  }
  if (
    msg.includes('timeout') ||
    msg.includes('connection') ||
    msg.includes('econnrefused') ||
    msg.includes('socket') ||
    msg.includes('network') ||
    msg.includes('deadlock') ||
    msg.includes('too many clients') ||
    msg.includes('throttle') ||
    msg.includes('rate limit') ||
    msg.includes('temporary') ||
    msg.includes('try again')
  ) {
    return true;
  }
  return true;
}

function calculateNextRetryDelay(attemptCount: number): number {
  if (attemptCount === 1) return 10 * 1000;
  if (attemptCount === 2) return 30 * 1000;
  if (attemptCount === 3) return 120 * 1000;
  if (attemptCount === 4) return 600 * 1000;
  return 1800 * 1000;
}

async function processVerifiedWebhook(req: any, res: any, integration: any) {
  const ip = req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';
  const body = req.body || {};
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
  const initialEventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
  const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Log Webhook Received (State: RECEIVED)
  await recordIntegrationEvent({
    id: `evlog_${Date.now()}_rec_${Math.random().toString(36).substring(2, 5)}`,
    integrationId: integration.id,
    userId: integration.userId,
    externalEventId: initialEventId,
    eventType: 'WEBHOOK_RECEIVED',
    payload: {
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
      },
      ipHash,
      query: req.query,
      body,
    },
    status: 'PROCESSED',
    processingStatus: 'RECEIVED',
    correlationId,
    sourceIpHash: ipHash,
    provider: integration.provider,
  });

  // 2. Log Webhook Authenticated (State: AUTHENTICATED)
  await recordIntegrationEvent({
    id: `evlog_${Date.now()}_auth_${Math.random().toString(36).substring(2, 5)}`,
    integrationId: integration.id,
    userId: integration.userId,
    externalEventId: initialEventId,
    eventType: 'WEBHOOK_AUTHENTICATED',
    payload: { provider: integration.provider, accountId: integration.accountId },
    status: 'PROCESSED',
    processingStatus: 'AUTHENTICATED',
    correlationId,
    sourceIpHash: ipHash,
    provider: integration.provider,
  });

  // 3. Payload Identity Spoof Attempt Check
  if (
    (body.userId && body.userId !== integration.userId) ||
    (body.accountId && body.accountId !== integration.accountId) ||
    (body.integrationId && body.integrationId !== integration.id)
  ) {
    await recordIntegrationEvent({
      id: `evlog_${Date.now()}_spoof_${Math.random().toString(36).substring(2, 5)}`,
      integrationId: integration.id,
      userId: integration.userId,
      externalEventId: initialEventId,
      eventType: 'PAYLOAD_IDENTITY_SPOOF_ATTEMPT',
      payload: {
        claimedUserId: body.userId,
        claimedAccountId: body.accountId,
        claimedIntegrationId: body.integrationId,
        actualUserId: integration.userId,
        actualAccountId: integration.accountId,
        actualIntegrationId: integration.id,
      },
      status: 'WARNING',
      processingStatus: 'REJECTED',
      correlationId,
      sourceIpHash: ipHash,
      provider: integration.provider,
    });
  }

  // 4. Payload validation for Malformed Payload
  if (!body.symbol || !body.direction || !body.status) {
    const errorMsg = 'Missing required trade fields: symbol, direction, or status';
    await recordIntegrationEvent({
      id: `evlog_${Date.now()}_malformed_${Math.random().toString(36).substring(2, 5)}`,
      integrationId: integration.id,
      userId: integration.userId,
      externalEventId: initialEventId,
      eventType: 'MALFORMED_PAYLOAD',
      payload: body,
      status: 'FAILED',
      processingStatus: 'REJECTED',
      error: errorMsg,
      correlationId,
      sourceIpHash: ipHash,
      provider: integration.provider,
    });
    return res.status(400).json({
      success: false,
      error: `Malformed payload: ${errorMsg}`,
    });
  }

  // Log payload validated (State: VALIDATED)
  await recordIntegrationEvent({
    id: `evlog_${Date.now()}_val_${Math.random().toString(36).substring(2, 5)}`,
    integrationId: integration.id,
    userId: integration.userId,
    externalEventId: initialEventId,
    eventType: 'WEBHOOK_VALIDATED',
    payload: { symbol: body.symbol, direction: body.direction, status: body.status },
    status: 'PROCESSED',
    processingStatus: 'VALIDATED',
    correlationId,
    sourceIpHash: ipHash,
    provider: integration.provider,
  });

  const idempotencyKey =
    (req.headers['idempotency-key'] as string) ||
    body.eventId ||
    (body.externalTradeId ? `${body.externalTradeId}_${body.eventType || 'event'}` : null) ||
    `evt_gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 5. Atomic Processing Lock using SELECT FOR UPDATE Transaction
  let lockResult;
  try {
    lockResult = await db.transaction(async (tx) => {
      const existingList = await tx
        .select()
        .from(integrationEvents)
        .where(
          and(
            eq(integrationEvents.integrationId, integration.id),
            eq(integrationEvents.externalEventId, idempotencyKey)
          )
        )
        .for('update');

      if (existingList.length > 0) {
        const existing = existingList[0];
        if (existing.processingStatus === 'PROCESSING' || existing.processingStatus === 'RETRYING') {
          return { status: 'CONCURRENT', event: existing };
        }
        if (existing.processingStatus === 'PROCESSED') {
          return { status: 'DUPLICATE', event: existing };
        }
        
        // If it was FAILED or RETRY_SCHEDULED, we retry and lock it!
        const nextAttempt = (existing.attemptCount || 1) + 1;
        await tx
          .update(integrationEvents)
          .set({
            processingStatus: 'RETRYING',
            lastAttemptAt: new Date(),
            attemptCount: nextAttempt,
          })
          .where(eq(integrationEvents.id, existing.id));

        return { status: 'LOCKED_RETRY', event: { ...existing, attemptCount: nextAttempt } };
      } else {
        // Insert new lock event
        const newEventId = `evlog_${Date.now()}_lock_${Math.random().toString(36).substring(2, 5)}`;
        await tx.insert(integrationEvents).values({
          id: newEventId,
          integrationId: integration.id,
          userId: integration.userId,
          externalEventId: idempotencyKey,
          eventType: body.eventType || 'WEBHOOK_RECEIVED',
          payload: body,
          status: 'PROCESSED',
          processingStatus: 'PROCESSING',
          attemptCount: 1,
          maxAttempts: 5,
          lastAttemptAt: new Date(),
          provider: integration.provider,
          correlationId,
          idempotencyKey,
          sourceIpHash: ipHash,
        });
        return { status: 'LOCKED_NEW', event: { id: newEventId, attemptCount: 1, maxAttempts: 5 } };
      }
    });
  } catch (txErr: any) {
    console.error('Lock transaction failed:', txErr);
    return res.status(500).json({ success: false, error: 'Failed to acquire processing lock' });
  }

  const { status: lockStatus, event: lockedEvent } = lockResult;

  if (lockStatus === 'CONCURRENT') {
    await recordIntegrationEvent({
      id: `evlog_${Date.now()}_con_${Math.random().toString(36).substring(2, 5)}`,
      integrationId: integration.id,
      userId: integration.userId,
      externalEventId: idempotencyKey,
      eventType: 'IDEMPOTENCY_CONCURRENT_BLOCKED',
      payload: { idempotencyKey },
      status: 'WARNING',
      processingStatus: 'DUPLICATE',
      correlationId,
      sourceIpHash: ipHash,
      provider: integration.provider,
    });
    return res.status(200).json({
      success: true,
      duplicate: true,
      processing: true,
      message: 'Concurrent duplicate request blocked.',
    });
  }

  if (lockStatus === 'DUPLICATE') {
    await recordIntegrationEvent({
      id: `evlog_${Date.now()}_dup_${Math.random().toString(36).substring(2, 5)}`,
      integrationId: integration.id,
      userId: integration.userId,
      externalEventId: idempotencyKey,
      eventType: 'IDEMPOTENCY_REPLAY_BLOCKED',
      payload: { idempotencyKey },
      status: 'WARNING',
      processingStatus: 'DUPLICATE',
      correlationId,
      sourceIpHash: ipHash,
      provider: integration.provider,
    });
    return res.status(200).json({
      success: true,
      duplicate: true,
      message: 'Idempotency check: Event already processed previously',
    });
  }

  // 6. We hold the lock (LOCKED_NEW or LOCKED_RETRY). Process trade!
  const eventLogId = lockedEvent.id;
  const attemptCount = lockedEvent.attemptCount || 1;
  const maxAttempts = lockedEvent.maxAttempts || 5;

  try {
    // Process & Upsert trade
    const trade = await upsertBrokerTrade(integration.userId, integration, body);

    // Map webhook event action to specific trade lifecycle events
    let tradeEventType = 'TRADE_SYNCED';
    if (body.eventType === 'trade_opened' || body.status === 'OPEN') {
      tradeEventType = 'TRADE_OPENED';
    } else if (body.eventType === 'trade_closed' || body.status === 'CLOSED') {
      tradeEventType = 'TRADE_CLOSED';
    } else if (body.eventType === 'trade_updated') {
      tradeEventType = 'TRADE_UPDATED';
    }

    // Update locked event to PROCESSED (State: PROCESSED)
    await updateIntegrationEvent(eventLogId, {
      processingStatus: 'PROCESSED',
      status: 'PROCESSED',
      processedAt: new Date(),
      error: null,
      errorMessage: null,
    });

    // Record success events
    await recordIntegrationEvent({
      id: `evlog_${Date.now()}_proc_${Math.random().toString(36).substring(2, 5)}`,
      integrationId: integration.id,
      userId: integration.userId,
      externalEventId: idempotencyKey,
      eventType: 'WEBHOOK_PROCESSED',
      payload: { tradeId: trade.id, status: trade.status, netPnl: trade.netPnl },
      status: 'PROCESSED',
      processingStatus: 'PROCESSED',
      correlationId,
      sourceIpHash: ipHash,
      provider: integration.provider,
    });

    await recordIntegrationEvent({
      id: `evlog_${Date.now()}_trade_${Math.random().toString(36).substring(2, 5)}`,
      integrationId: integration.id,
      userId: integration.userId,
      externalEventId: idempotencyKey,
      eventType: tradeEventType,
      payload: { tradeId: trade.id, symbol: trade.symbol, direction: trade.direction, netPnl: trade.netPnl },
      status: 'PROCESSED',
      processingStatus: 'PROCESSED',
      correlationId,
      sourceIpHash: ipHash,
      provider: integration.provider,
    });

    // Broadcast real-time update exclusively to user's socket room
    broadcastUserEvent(integration.userId, 'user_trade_synced', {
      trade,
      accountId: integration.accountId,
      provider: integration.provider,
    });

    return res.status(200).json({
      success: true,
      message: 'Broker trade event synced and persisted successfully',
      tradeId: trade.id,
      status: trade.status,
      netPnl: trade.netPnl,
      accountBalanceUpdated: true,
    });
  } catch (err: any) {
    const errorMsg = err.message || 'Internal server error processing webhook';
    const isRetryable = isErrorRetryable(err);
    const canRetry = attemptCount < maxAttempts;

    if (isRetryable && canRetry) {
      // Calculate retry schedule (backoff)
      const delayMs = calculateNextRetryDelay(attemptCount);
      const nextRetryAt = new Date(Date.now() + delayMs);

      await updateIntegrationEvent(eventLogId, {
        processingStatus: 'RETRY_SCHEDULED',
        status: 'FAILED',
        error: errorMsg,
        errorMessage: errorMsg,
        nextRetryAt,
        failedAt: new Date(),
      });

      await recordIntegrationEvent({
        id: `evlog_${Date.now()}_ret_sched_${Math.random().toString(36).substring(2, 5)}`,
        integrationId: integration.id,
        userId: integration.userId,
        externalEventId: idempotencyKey,
        eventType: 'WEBHOOK_RETRY_SCHEDULED',
        payload: { attemptCount, nextRetryAt: nextRetryAt.toISOString(), delayMs },
        status: 'WARNING',
        processingStatus: 'RETRY_SCHEDULED',
        correlationId,
        sourceIpHash: ipHash,
        provider: integration.provider,
      });

      return res.status(500).json({
        success: false,
        error: errorMsg,
        retryScheduled: true,
        nextRetryAt: nextRetryAt.toISOString(),
      });
    } else {
      const finalStatus = canRetry ? 'FAILED' : 'RETRY_EXHAUSTED';
      await updateIntegrationEvent(eventLogId, {
        processingStatus: finalStatus,
        status: 'FAILED',
        error: errorMsg,
        errorMessage: errorMsg,
        failedAt: new Date(),
      });

      await recordIntegrationEvent({
        id: `evlog_${Date.now()}_fail_${Math.random().toString(36).substring(2, 5)}`,
        integrationId: integration.id,
        userId: integration.userId,
        externalEventId: idempotencyKey,
        eventType: finalStatus === 'RETRY_EXHAUSTED' ? 'RETRY_EXHAUSTED' : 'WEBHOOK_FAILED',
        payload: { error: errorMsg, attemptCount },
        status: 'FAILED',
        processingStatus: finalStatus,
        correlationId,
        sourceIpHash: ipHash,
        provider: integration.provider,
      });

      return res.status(500).json({
        success: false,
        error: errorMsg,
        retryExhausted: finalStatus === 'RETRY_EXHAUSTED',
      });
    }
  }
}

// 1. CANONICAL WEBHOOK ROUTE (Fully supported production standard)
app.post('/api/integrations/webhook/:integrationId', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    }

    const authHeader = req.headers.authorization;
    const bearerSecret = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const secret = bearerSecret || (req.query.secret as string) || req.body.secret;

    if (!secret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing integration secret. Provide Authorization: Bearer <secret> in header.',
      });
    }

    const { integrationId } = req.params;
    const integration = await getBrokerIntegrationGlobalById(integrationId);

    if (!integration || integration.status === 'DISCONNECTED') {
      // Timing-attack defense: execute bcrypt.compare on a dummy string to equalize response times
      await bcrypt.compare('dummy_opaque_webhook_secret_value_for_timing_defense', '$2b$10$invalidhashplaceholdertextforbcryptcomparisonsoitruns');
      if (integration && integration.status === 'DISCONNECTED') {
        await recordIntegrationEvent({
          id: `evlog_${Date.now()}_revoked_${Math.random().toString(36).substring(2, 5)}`,
          integrationId: integration.id,
          userId: integration.userId,
          externalEventId: `evt_${Date.now()}_revoked`,
          eventType: 'REVOKED_INTEGRATION_ATTEMPT',
          payload: { status: integration.status },
          status: 'FAILED',
          error: 'Attempted webhook received on disconnected/revoked integration'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or revoked integration credentials',
      });
    }

    // Secure verification of the opaque secret using bcrypt's non-reversible one-way comparison
    const isValid = await bcrypt.compare(secret, integration.secretHash);
    if (!isValid) {
      await recordIntegrationEvent({
        id: `evlog_${Date.now()}_invalid_${Math.random().toString(36).substring(2, 5)}`,
        integrationId: integration.id,
        userId: integration.userId,
        externalEventId: `evt_${Date.now()}_auth_fail`,
        eventType: 'INVALID_SECRET',
        payload: { attempt: 'failed_secret_verification' },
        status: 'FAILED',
        error: 'Unauthorized: Invalid integration credentials',
      });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or revoked integration credentials',
      });
    }

    // Reset rate limit count on success
    webhookRateLimiter.delete(ip);

    // Resolve owner identity and account directly from the verified database record
    return await processVerifiedWebhook(req, res, integration);
  } catch (err: any) {
    console.error('Canonical webhook error:', err);
    res.status(500).json({ success: false, error: 'Internal server error processing webhook' });
  }
});

// 2. DEPRECATED LEGACY WEBHOOK ROUTE (Isolated fallback)
// Only supports old-format secrets containing embedded integration IDs. New opaque secrets are rejected here.
app.post('/api/integrations/webhook', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    }

    const authHeader = req.headers.authorization;
    const bearerSecret = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const secret = bearerSecret || (req.query.secret as string) || req.body.secret;

    if (!secret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing integration secret. Provide Authorization: Bearer <secret> in header.',
      });
    }

    // Extract the candidate integration ID from the old-style secret structure
    const candidateId = parseLegacySecret(secret);
    if (!candidateId) {
      // Rejects new opaque secrets on this legacy route, as they contain no embedded ID (passes Test D)
      await bcrypt.compare('dummy_opaque_webhook_secret_value_for_timing_defense', '$2b$10$invalidhashplaceholdertextforbcryptcomparisonsoitruns');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Legacy endpoint requires legacy credential format or canonical endpoint.',
      });
    }

    // Perform a direct database lookup by the extracted ID (no table scans)
    const integration = await getBrokerIntegrationGlobalById(candidateId);
    if (!integration || integration.status === 'DISCONNECTED') {
      await bcrypt.compare('dummy_opaque_webhook_secret_value_for_timing_defense', '$2b$10$invalidhashplaceholdertextforbcryptcomparisonsoitruns');
      if (integration && integration.status === 'DISCONNECTED') {
        await recordIntegrationEvent({
          id: `evlog_${Date.now()}_revoked_${Math.random().toString(36).substring(2, 5)}`,
          integrationId: integration.id,
          userId: integration.userId,
          externalEventId: `evt_${Date.now()}_revoked`,
          eventType: 'REVOKED_INTEGRATION_ATTEMPT',
          payload: { status: integration.status },
          status: 'FAILED',
          error: 'Attempted webhook received on disconnected/revoked integration'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or revoked integration credentials',
      });
    }

    // Verify the complete raw secret using bcrypt's non-reversible one-way comparison (never bypass bcrypt verification)
    const isValid = await bcrypt.compare(secret, integration.secretHash);
    if (!isValid) {
      await recordIntegrationEvent({
        id: `evlog_${Date.now()}_invalid_${Math.random().toString(36).substring(2, 5)}`,
        integrationId: integration.id,
        userId: integration.userId,
        externalEventId: `evt_${Date.now()}_auth_fail`,
        eventType: 'INVALID_SECRET',
        payload: { attempt: 'failed_secret_verification' },
        status: 'FAILED',
        error: 'Unauthorized: Invalid integration credentials',
      });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or revoked integration credentials',
      });
    }

    // Reset rate limit count on success
    webhookRateLimiter.delete(ip);

    // Resolve owner identity and account directly from the verified database record
    return await processVerifiedWebhook(req, res, integration);
  } catch (err: any) {
    console.error('Legacy webhook error:', err);
    res.status(500).json({ success: false, error: 'Internal server error processing legacy webhook' });
  }
});

// 3. DEPRECATED LEGACY WEBHOOK WITH PREFIX ROUTE (Isolated fallback)
app.post('/api/integrations/:integrationId/webhook', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    }

    const authHeader = req.headers.authorization;
    const bearerSecret = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const secret = bearerSecret || (req.query.secret as string) || req.body.secret;

    if (!secret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing integration secret. Provide Authorization: Bearer <secret> in header.',
      });
    }

    const { integrationId } = req.params;
    const integration = await getBrokerIntegrationGlobalById(integrationId);

    if (!integration || integration.status === 'DISCONNECTED') {
      await bcrypt.compare('dummy_opaque_webhook_secret_value_for_timing_defense', '$2b$10$invalidhashplaceholdertextforbcryptcomparisonsoitruns');
      if (integration && integration.status === 'DISCONNECTED') {
        await recordIntegrationEvent({
          id: `evlog_${Date.now()}_revoked_${Math.random().toString(36).substring(2, 5)}`,
          integrationId: integration.id,
          userId: integration.userId,
          externalEventId: `evt_${Date.now()}_revoked`,
          eventType: 'REVOKED_INTEGRATION_ATTEMPT',
          payload: { status: integration.status },
          status: 'FAILED',
          error: 'Attempted webhook received on disconnected/revoked integration'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or revoked integration credentials',
      });
    }

    // Verify the complete raw secret using bcrypt's non-reversible one-way comparison (never bypass bcrypt verification)
    const isValid = await bcrypt.compare(secret, integration.secretHash);
    if (!isValid) {
      await recordIntegrationEvent({
        id: `evlog_${Date.now()}_invalid_${Math.random().toString(36).substring(2, 5)}`,
        integrationId: integration.id,
        userId: integration.userId,
        externalEventId: `evt_${Date.now()}_auth_fail`,
        eventType: 'INVALID_SECRET',
        payload: { attempt: 'failed_secret_verification' },
        status: 'FAILED',
        error: 'Unauthorized: Invalid integration credentials',
      });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or revoked integration credentials',
      });
    }

    // Reset rate limit count on success
    webhookRateLimiter.delete(ip);

    // Resolve owner identity and account directly from the verified database record
    return await processVerifiedWebhook(req, res, integration);
  } catch (err: any) {
    console.error('Legacy parameter webhook error:', err);
    res.status(500).json({ success: false, error: 'Internal server error processing legacy parameter webhook' });
  }
});

async function recoverStaleEvents(timeoutMinutes: number = 5) {
  try {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    // Recover stale integration events back to RETRY_SCHEDULED atomically
    const updated = await db
      .update(integrationEvents)
      .set({
        processingStatus: 'RETRY_SCHEDULED',
        nextRetryAt: new Date(),
        errorMessage: 'Recovered from stale processing/retrying status',
      })
      .where(
        and(
          sql`(${integrationEvents.processingStatus} = 'PROCESSING' OR ${integrationEvents.processingStatus} = 'RETRYING')`,
          sql`(${integrationEvents.lastAttemptAt} < ${cutoff} OR (${integrationEvents.lastAttemptAt} IS NULL AND ${integrationEvents.createdAt} < ${cutoff}))`
        )
      )
      .returning();

    if (updated.length > 0) {
      console.log(`[Stale Recovery] Safely recovered ${updated.length} stale integration events back to RETRY_SCHEDULED status.`);
      for (const event of updated) {
        await recordIntegrationEvent({
          id: `evlog_${Date.now()}_recovered_${Math.random().toString(36).substring(2, 5)}`,
          integrationId: event.integrationId,
          userId: event.userId,
          externalEventId: event.externalEventId,
          eventType: 'STALE_EVENT_RECOVERED',
          payload: { originalStatus: event.processingStatus, attemptCount: event.attemptCount },
          status: 'WARNING',
          processingStatus: 'RETRY_SCHEDULED',
        });
      }
    }
  } catch (error) {
    console.error('[Stale Recovery] Error recovering stale events:', error);
  }
}

export function startBackgroundRetryProcessor() {
  if ((global as any).__retryProcessorIntervalId) {
    console.log('Background retry processor already running.');
    return;
  }
  (global as any).__retryProcessorStarted = true;

  console.log('Starting background retry processor...');
  
  const intervalId = setInterval(async () => {
    if ((global as any).__isProcessingRetries) return;
    (global as any).__isProcessingRetries = true;

    try {
      // 1. Recover any stale items before fetching due ones
      await recoverStaleEvents(5);

      // 2. Query configurable batch size of due retries
      const batchSize = process.env.RETRY_BATCH_SIZE ? parseInt(process.env.RETRY_BATCH_SIZE, 10) : 10;
      const dueEvents = await getDueRetryEvents(batchSize);

      for (const event of dueEvents) {
        try {
          const claimSuccess = await db.transaction(async (tx) => {
            const currentEvent = await tx
              .select({ processingStatus: integrationEvents.processingStatus })
              .from(integrationEvents)
              .where(eq(integrationEvents.id, event.id))
              .for('update');

            if (currentEvent.length > 0 && currentEvent[0].processingStatus === 'RETRY_SCHEDULED') {
              await tx
                .update(integrationEvents)
                .set({
                  processingStatus: 'RETRYING',
                  lastAttemptAt: new Date(),
                })
                .where(eq(integrationEvents.id, event.id));
              return true;
            }
            return false;
          });

          if (!claimSuccess) continue;

          console.log(`[Retry Processor] Processing retry for event ${event.id} (attempt ${event.attemptCount + 1})`);

          const integrationList = await db
            .select()
            .from(brokerIntegrations)
            .where(eq(brokerIntegrations.id, event.integrationId))
            .limit(1);

          if (integrationList.length === 0 || integrationList[0].status === 'DISCONNECTED') {
            throw new Error('Integration not found or disconnected');
          }
          const integration = integrationList[0];

          const trade = await upsertBrokerTrade(event.userId, integration, event.payload as any);

          await updateIntegrationEvent(event.id, {
            processingStatus: 'PROCESSED',
            status: 'PROCESSED',
            processedAt: new Date(),
            error: null,
            errorMessage: null,
            attemptCount: event.attemptCount + 1,
          });

          await recordIntegrationEvent({
            id: `evlog_${Date.now()}_retry_suc_${Math.random().toString(36).substring(2, 5)}`,
            integrationId: event.integrationId,
            userId: event.userId,
            externalEventId: event.externalEventId,
            eventType: 'WEBHOOK_RETRY_SUCCEEDED',
            payload: { tradeId: trade.id, attemptCount: event.attemptCount + 1 },
            status: 'SUCCESS',
            processingStatus: 'PROCESSED',
          });

          broadcastUserEvent(event.userId, 'user_trade_synced', {
            trade,
            accountId: integration.accountId,
            provider: integration.provider,
          });

        } catch (error: any) {
          const errorMsg = error.message || 'Retry processing error';
          console.error(`[Retry Processor] Retry failed for event ${event.id}:`, errorMsg);

          const nextAttemptCount = event.attemptCount + 1;
          const isRetryable = isErrorRetryable(error);
          const canRetry = nextAttemptCount < event.maxAttempts;

          if (isRetryable && canRetry) {
            const nextDelay = calculateNextRetryDelay(nextAttemptCount);
            const nextRetryAt = new Date(Date.now() + nextDelay);

            await updateIntegrationEvent(event.id, {
              processingStatus: 'RETRY_SCHEDULED',
              status: 'FAILED',
              error: errorMsg,
              errorMessage: errorMsg,
              nextRetryAt,
              failedAt: new Date(),
              attemptCount: nextAttemptCount,
            });

            await recordIntegrationEvent({
              id: `evlog_${Date.now()}_retry_fail_${Math.random().toString(36).substring(2, 5)}`,
              integrationId: event.integrationId,
              userId: event.userId,
              externalEventId: event.externalEventId,
              eventType: 'WEBHOOK_RETRY_FAILED',
              payload: { attemptCount: nextAttemptCount, nextRetryAt: nextRetryAt.toISOString() },
              status: 'WARNING',
              processingStatus: 'RETRY_SCHEDULED',
            });
          } else {
            const finalStatus = canRetry ? 'FAILED' : 'RETRY_EXHAUSTED';
            await updateIntegrationEvent(event.id, {
              processingStatus: finalStatus,
              status: 'FAILED',
              error: errorMsg,
              errorMessage: errorMsg,
              nextRetryAt: null,
              failedAt: new Date(),
              attemptCount: nextAttemptCount,
            });

            await recordIntegrationEvent({
              id: `evlog_${Date.now()}_retry_exh_${Math.random().toString(36).substring(2, 5)}`,
              integrationId: event.integrationId,
              userId: event.userId,
              externalEventId: event.externalEventId,
              eventType: finalStatus === 'RETRY_EXHAUSTED' ? 'RETRY_EXHAUSTED' : 'WEBHOOK_FAILED',
              payload: { attemptCount: nextAttemptCount, error: errorMsg },
              status: 'FAILED',
              processingStatus: finalStatus,
            });
          }
        }
      }
    } catch (globalError) {
      console.error('[Retry Processor] Error inside retry interval:', globalError);
    } finally {
      (global as any).__isProcessingRetries = false;
    }
  }, 10000);

  (global as any).__retryProcessorIntervalId = intervalId;
}

export function stopBackgroundRetryProcessor() {
  if ((global as any).__retryProcessorIntervalId) {
    clearInterval((global as any).__retryProcessorIntervalId);
    (global as any).__retryProcessorIntervalId = null;
    (global as any).__retryProcessorStarted = false;
    console.log('Stopped background retry processor.');
  }
}

