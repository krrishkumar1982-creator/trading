import {
  getOrCreateUser,
  getTradingAccounts,
  saveTradingAccount,
  saveTrade,
  savePlaybook,
  saveStrategy,
  saveJournalNote,
  saveJournalFolder,
  saveRiskGoals,
  saveNotification,
  saveCommunityPost,
  saveMentorStudent
} from './repository.ts';
import {
  INITIAL_ACCOUNTS,
  INITIAL_PLAYBOOKS,
  INITIAL_STRATEGIES,
  INITIAL_TRADES,
  INITIAL_FOLDERS,
  INITIAL_NOTES,
  INITIAL_RISK_GOALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MENTOR_STUDENTS,
  INITIAL_COMMUNITY_POSTS
} from '../data/mockData.ts';

export async function ensureUserAndInitialSeed(userId: string) {
  try {
    await getOrCreateUser(userId);
    const existingAccounts = await getTradingAccounts(userId);

    if (existingAccounts.length === 0) {
      console.log(`Seeding initial database data for user: ${userId}`);

      const idSuffix = userId === 'default_user_1' ? '' : `_${userId.slice(0, 8)}`;

      for (const account of INITIAL_ACCOUNTS) {
        await saveTradingAccount(userId, {
          ...account,
          id: `${account.id}${idSuffix}`,
        });
      }

      for (const playbook of INITIAL_PLAYBOOKS) {
        await savePlaybook(userId, {
          ...playbook,
          id: `${playbook.id}${idSuffix}`,
        });
      }

      for (const strategy of INITIAL_STRATEGIES) {
        await saveStrategy(userId, {
          ...strategy,
          id: `${strategy.id}${idSuffix}`,
        });
      }

      for (const trade of INITIAL_TRADES) {
        await saveTrade(userId, {
          ...trade,
          id: `${trade.id}${idSuffix}`,
          accountId: `${trade.accountId}${idSuffix}`,
          playbookId: trade.playbookId ? `${trade.playbookId}${idSuffix}` : undefined,
          strategyId: trade.strategyId ? `${trade.strategyId}${idSuffix}` : undefined,
        });
      }

      for (const folder of INITIAL_FOLDERS) {
        await saveJournalFolder(userId, {
          ...folder,
          id: `${folder.id}${idSuffix}`,
        });
      }

      for (const note of INITIAL_NOTES) {
        await saveJournalNote(userId, {
          ...note,
          id: `${note.id}${idSuffix}`,
          accountId: `${note.accountId}${idSuffix}`,
          folderId: `${note.folderId}${idSuffix}`,
        });
      }

      await saveRiskGoals(userId, INITIAL_RISK_GOALS);

      for (const notification of INITIAL_NOTIFICATIONS) {
        await saveNotification(userId, {
          ...notification,
          id: `${notification.id}${idSuffix}`,
        });
      }

      for (const post of INITIAL_COMMUNITY_POSTS) {
        await saveCommunityPost(userId, {
          ...post,
          id: `${post.id}${idSuffix}`,
        });
      }

      for (const student of INITIAL_MENTOR_STUDENTS) {
        await saveMentorStudent(userId, {
          ...student,
          id: `${student.id}${idSuffix}`,
        });
      }
    }
  } catch (error) {
    console.error('ensureUserAndInitialSeed error:', error);
  }
}
