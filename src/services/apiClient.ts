import { supabase } from '../lib/supabase';
import {
  Trade,
  TradingAccount,
  Playbook,
  Strategy,
  JournalNote,
  JournalFolder,
  RiskGoalSettings,
  AppNotification,
  CommunityPost,
  MentorStudent
} from '../types';

const MIGRATION_KEY = 'duskflow_cloudsql_migrated_v1';

let currentIdToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  currentIdToken = token;
}

async function getAuthHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
  const merged: Record<string, string> = { ...headers };
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      currentIdToken = data.session.access_token;
      if (data.session.user?.id) {
        merged['x-user-id'] = data.session.user.id;
      }
    }
  } catch (e) {
    console.warn('Failed to retrieve Supabase session:', e);
  }
  if (currentIdToken) {
    merged['Authorization'] = `Bearer ${currentIdToken}`;
  }
  return merged;
}

export async function authenticatedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders((init.headers as Record<string, string>) || {});
  let response = await fetch(url, { ...init, headers });

  if (response.status === 401) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        currentIdToken = data.session.access_token;
        const retryHeaders = await getAuthHeaders((init.headers as Record<string, string>) || {});
        response = await fetch(url, { ...init, headers: retryHeaders });
      }
    } catch (e) {
      console.error('Auto token refresh on 401 failed:', e);
    }
  }

  return response;
}

export async function fetchInitialState(retries = 3, delay = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await authenticatedFetch('/api/state');
      if (!response.ok) {
        throw new Error(`State fetch failed with status ${response.status}`);
      }
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch state');
      }

      // Clean up any stale legacy localStorage items so they never leak between users
      try {
        localStorage.removeItem('duskflow_trades');
        localStorage.removeItem('duskflow_accounts');
        localStorage.removeItem('duskflow_notes');
        localStorage.removeItem('duskflow_folders');
        localStorage.removeItem('duskflow_playbooks');
        localStorage.removeItem('duskflow_strategies');
        localStorage.removeItem('duskflow_risk_goals');
        localStorage.removeItem('duskflow_backtesting_sessions');
      } catch {
        // ignore
      }

      return data;
    } catch (error: any) {
      if (attempt < retries) {
        console.warn(`fetchInitialState attempt ${attempt} failed (${error?.message || error}). Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 1.5;
      } else {
        console.warn('fetchInitialState max retries reached:', error?.message || error);
        return null;
      }
    }
  }
  return null;
}

export async function saveAccountApi(account: TradingAccount) {
  try {
    await authenticatedFetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
  } catch (error) {
    console.error('saveAccountApi error:', error);
  }
}

export async function deleteAccountApi(id: string) {
  try {
    await authenticatedFetch(`/api/accounts/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('deleteAccountApi error:', error);
  }
}

export async function saveTradeApi(trade: Trade) {
  try {
    await authenticatedFetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trade),
    });
  } catch (error) {
    console.error('saveTradeApi error:', error);
  }
}

export async function deleteTradeApi(id: string) {
  try {
    await authenticatedFetch(`/api/trades/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('deleteTradeApi error:', error);
  }
}

export async function bulkDeleteTradesApi(ids: string[]) {
  try {
    await authenticatedFetch('/api/trades/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  } catch (error) {
    console.error('bulkDeleteTradesApi error:', error);
  }
}

export async function bulkEditTradesApi(ids: string[], updates: Partial<Trade>) {
  try {
    await authenticatedFetch('/api/trades/bulk-edit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, updates }),
    });
  } catch (error) {
    console.error('bulkEditTradesApi error:', error);
  }
}

export async function savePlaybookApi(playbook: Playbook) {
  try {
    await authenticatedFetch('/api/playbooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playbook),
    });
  } catch (error) {
    console.error('savePlaybookApi error:', error);
  }
}

export async function deletePlaybookApi(id: string) {
  try {
    await authenticatedFetch(`/api/playbooks/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('deletePlaybookApi error:', error);
  }
}

export async function saveStrategyApi(strategy: Strategy) {
  try {
    await authenticatedFetch('/api/strategies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy),
    });
  } catch (error) {
    console.error('saveStrategyApi error:', error);
  }
}

export async function deleteStrategyApi(id: string) {
  try {
    await authenticatedFetch(`/api/strategies/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('deleteStrategyApi error:', error);
  }
}

export async function saveNoteApi(note: JournalNote) {
  try {
    await authenticatedFetch('/api/journal/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
  } catch (error) {
    console.error('saveNoteApi error:', error);
  }
}

export async function deleteNoteApi(id: string) {
  try {
    await authenticatedFetch(`/api/journal/notes/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('deleteNoteApi error:', error);
  }
}

export async function saveFolderApi(folder: JournalFolder) {
  try {
    await authenticatedFetch('/api/journal/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folder),
    });
  } catch (error) {
    console.error('saveFolderApi error:', error);
  }
}

export async function deleteFolderApi(id: string) {
  try {
    await authenticatedFetch(`/api/journal/folders/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('deleteFolderApi error:', error);
  }
}

export async function fetchRiskGoalsApi(accountId?: string): Promise<RiskGoalSettings | null> {
  try {
    const url = accountId && accountId !== 'all' ? `/api/risk-goals?accountId=${encodeURIComponent(accountId)}` : '/api/risk-goals';
    const res = await authenticatedFetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.riskGoals || null;
  } catch (error) {
    console.error('fetchRiskGoalsApi error:', error);
    return null;
  }
}

export async function saveRiskGoalsApi(goals: RiskGoalSettings, accountId?: string) {
  try {
    const payload = accountId && accountId !== 'all' ? { ...goals, tradingAccountId: accountId } : goals;
    await authenticatedFetch('/api/risk-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('saveRiskGoalsApi error:', error);
  }
}

export async function saveNotificationApi(notification: AppNotification) {
  try {
    await authenticatedFetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
  } catch (error) {
    console.error('saveNotificationApi error:', error);
  }
}

export async function fetchCommunityPostsApi(): Promise<CommunityPost[]> {
  try {
    const res = await authenticatedFetch('/api/community-posts');
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error('fetchCommunityPostsApi error:', error);
    return [];
  }
}

export async function saveCommunityPostApi(post: Partial<CommunityPost>) {
  try {
    const res = await authenticatedFetch('/api/community-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create post');
    }
    const data = await res.json();
    return data.post;
  } catch (error) {
    console.error('saveCommunityPostApi error:', error);
    throw error;
  }
}

export async function editCommunityPostApi(id: string, updates: Partial<CommunityPost>) {
  try {
    const res = await authenticatedFetch(`/api/community-posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to edit post');
    }
    const data = await res.json();
    return data.post;
  } catch (error) {
    console.error('editCommunityPostApi error:', error);
    throw error;
  }
}

export async function deleteCommunityPostApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/community-posts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete post');
    }
    return true;
  } catch (error) {
    console.error('deleteCommunityPostApi error:', error);
    throw error;
  }
}

export async function toggleLikePostApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/community-posts/${id}/like`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to toggle like');
    }
    return await res.json();
  } catch (error) {
    console.error('toggleLikePostApi error:', error);
    throw error;
  }
}

export async function fetchPostCommentsApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/community-posts/${id}/comments`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.comments || [];
  } catch (error) {
    console.error('fetchPostCommentsApi error:', error);
    return [];
  }
}

export async function addPostCommentApi(id: string, content: string) {
  try {
    const res = await authenticatedFetch(`/api/community-posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to add comment');
    }
    return await res.json();
  } catch (error) {
    console.error('addPostCommentApi error:', error);
    throw error;
  }
}

export async function deletePostCommentApi(postId: string, commentId: string) {
  try {
    const res = await authenticatedFetch(`/api/community-posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete comment');
    }
    return await res.json();
  } catch (error) {
    console.error('deletePostCommentApi error:', error);
    throw error;
  }
}

export async function saveMentorStudentApi(student: MentorStudent) {
  try {
    await authenticatedFetch('/api/mentor-students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
  } catch (error) {
    console.error('saveMentorStudentApi error:', error);
  }
}

export async function deleteMentorStudentApi(id: string) {
  try {
    await authenticatedFetch(`/api/mentor-students/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('deleteMentorStudentApi error:', error);
  }
}

export async function getBacktestSessionsApi() {
  try {
    const res = await authenticatedFetch('/api/backtesting/sessions');
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions || [];
  } catch (error) {
    console.error('getBacktestSessionsApi error:', error);
    return [];
  }
}

export async function saveBacktestSessionApi(session: any) {
  try {
    await authenticatedFetch('/api/backtesting/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
  } catch (error) {
    console.error('saveBacktestSessionApi error:', error);
  }
}

export async function deleteBacktestSessionApi(id: string) {
  try {
    await authenticatedFetch(`/api/backtesting/sessions/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('deleteBacktestSessionApi error:', error);
  }
}

// Broker Integrations & Webhook Auto-Sync API methods
export async function fetchIntegrationsApi() {
  try {
    const res = await authenticatedFetch('/api/integrations');
    if (!res.ok) return [];
    const data = await res.json();
    return data.integrations || [];
  } catch (error) {
    console.error('fetchIntegrationsApi error:', error);
    return [];
  }
}

export async function createIntegrationApi(payload: {
  accountId: string;
  provider: string;
  displayName?: string;
  externalAccountId?: string;
}) {
  try {
    const res = await authenticatedFetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create integration');
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('createIntegrationApi error:', error);
    throw error;
  }
}

export async function deleteIntegrationApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/integrations/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete integration');
    }
    return true;
  } catch (error) {
    console.error('deleteIntegrationApi error:', error);
    throw error;
  }
}

export async function getEaScriptApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/integrations/${id}/ea-script`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch EA script');
    }
    return await res.json();
  } catch (error) {
    console.error('getEaScriptApi error:', error);
    throw error;
  }
}

export async function sendTestWebhookApi(id: string, secret: string, payload: any) {
  try {
    const res = await fetch(`/api/integrations/webhook/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
        'Idempotency-Key': `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Webhook call failed');
    }
    return data;
  } catch (error) {
    console.error('sendTestWebhookApi error:', error);
    throw error;
  }
}

export async function regenerateIntegrationApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/integrations/${id}/regenerate`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to regenerate integration secret');
    }
    return await res.json();
  } catch (error) {
    console.error('regenerateIntegrationApi error:', error);
    throw error;
  }
}

export async function fetchIntegrationEventsApi(id: string, limit = 50, offset = 0) {
  try {
    const res = await authenticatedFetch(`/api/integrations/${id}/events?limit=${limit}&offset=${offset}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch event history');
    }
    const data = await res.json();
    return data.events || [];
  } catch (error) {
    console.error('fetchIntegrationEventsApi error:', error);
    throw error;
  }
}

export async function fetchIntegrationHealthApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/integrations/${id}/health`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch integration health');
    }
    const data = await res.json();
    return data.health;
  } catch (error) {
    console.error('fetchIntegrationHealthApi error:', error);
    throw error;
  }
}

export async function retryIntegrationEventApi(id: string, eventId: string) {
  try {
    const res = await authenticatedFetch(`/api/integrations/${id}/events/${eventId}/retry`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to retry integration event');
    }
    return await res.json();
  } catch (error) {
    console.error('retryIntegrationEventApi error:', error);
    throw error;
  }
}

export async function fetchDailyChecklist(date: string): Promise<string[]> {
  try {
    const res = await authenticatedFetch(`/api/checklist?date=${encodeURIComponent(date)}`);
    if (!res.ok) {
      console.warn(`fetchDailyChecklist received status ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.completedItems || [];
  } catch (error) {
    console.error('fetchDailyChecklist error:', error);
    return [];
  }
}

export async function saveDailyChecklistItemApi(itemId: string, date: string, completed: boolean): Promise<void> {
  try {
    const res = await authenticatedFetch(`/api/checklist/${encodeURIComponent(itemId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, completed }),
    });
    if (!res.ok) {
      console.error(`saveDailyChecklistItemApi failed with status ${res.status}`);
    }
  } catch (error) {
    console.error('saveDailyChecklistItemApi error:', error);
  }
}

export async function saveDailyChecklistBulkApi(date: string, completedItems: string[]): Promise<void> {
  try {
    const res = await authenticatedFetch('/api/checklist/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, completedItems }),
    });
    if (!res.ok) {
      console.error(`saveDailyChecklistBulkApi failed with status ${res.status}`);
    }
  } catch (error) {
    console.error('saveDailyChecklistBulkApi error:', error);
  }
}

export async function fetchDirectivesApi() {
  try {
    const res = await authenticatedFetch('/api/mentor/directives');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch mentor directives');
    }
    return await res.json();
  } catch (error) {
    console.error('fetchDirectivesApi error:', error);
    throw error;
  }
}

export async function createDirectiveApi(studentCode: string, content: string, type = 'DIRECTIVE') {
  try {
    const res = await authenticatedFetch('/api/mentor/directives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, content, type }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to dispatch directive');
    }
    return await res.json();
  } catch (error) {
    console.error('createDirectiveApi error:', error);
    throw error;
  }
}

export async function acknowledgeDirectiveApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/mentor/directives/${id}/acknowledge`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to acknowledge directive');
    }
    return await res.json();
  } catch (error) {
    console.error('acknowledgeDirectiveApi error:', error);
    throw error;
  }
}

export async function fetchMentorStudentFeedback(studentId: string) {
  try {
    const res = await authenticatedFetch(`/api/mentor/students/${encodeURIComponent(studentId)}/feedback`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch student feedback');
    }
    const data = await res.json();
    return data.feedback || [];
  } catch (error) {
    console.error('fetchMentorStudentFeedback error:', error);
    throw error;
  }
}

export async function createMentorFeedback(studentId: string, payload: { content: string; type?: string }) {
  try {
    const res = await authenticatedFetch(`/api/mentor/students/${encodeURIComponent(studentId)}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create student feedback');
    }
    return await res.json();
  } catch (error) {
    console.error('createMentorFeedback error:', error);
    throw error;
  }
}

export async function updateMentorFeedback(id: string, payload: { content?: string; status?: string; type?: string }) {
  try {
    const res = await authenticatedFetch(`/api/mentor/feedback/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update feedback');
    }
    return await res.json();
  } catch (error) {
    console.error('updateMentorFeedback error:', error);
    throw error;
  }
}

export async function deleteMentorFeedback(id: string) {
  try {
    const res = await authenticatedFetch(`/api/mentor/feedback/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete feedback');
    }
    return true;
  } catch (error) {
    console.error('deleteMentorFeedback error:', error);
    throw error;
  }
}

export async function fetchStudentMentorsApi() {
  try {
    const res = await authenticatedFetch('/api/student/mentors');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch mentors');
    }
    const data = await res.json();
    return data.mentors || [];
  } catch (error) {
    console.error('fetchStudentMentorsApi error:', error);
    return [];
  }
}

export async function fetchMentorStudentsFullApi() {
  try {
    const res = await authenticatedFetch('/api/mentor/students-full');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch students');
    }
    const data = await res.json();
    return data.students || [];
  } catch (error) {
    console.error('fetchMentorStudentsFullApi error:', error);
    return [];
  }
}

export async function fetchStudentDetailsForMentorApi(studentId: string) {
  try {
    const res = await authenticatedFetch(`/api/mentor/students/${encodeURIComponent(studentId)}/details`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch student details');
    }
    const data = await res.json();
    return data.details || null;
  } catch (error) {
    console.error('fetchStudentDetailsForMentorApi error:', error);
    throw error;
  }
}

export async function searchMentorAccountsApi(query: string) {
  try {
    const res = await authenticatedFetch(`/api/mentor/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to search mentor accounts');
    }
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('searchMentorAccountsApi error:', error);
    throw error;
  }
}

export async function searchStudentByCodeApi(code: string) {
  try {
    const res = await authenticatedFetch(`/api/mentor/search-student?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Student not found. Check the Unique Mentor Code.');
    }
    return data.student;
  } catch (error) {
    console.error('searchStudentByCodeApi error:', error);
    throw error;
  }
}

export async function connectMentorByCodeApi(mentorCode: string, role?: 'mentor' | 'student') {
  try {
    const res = await authenticatedFetch('/api/mentor/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorCode, role }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to connect');
    }
    return data;
  } catch (error) {
    console.error('connectMentorByCodeApi error:', error);
    throw error;
  }
}

export async function updateStudentSharingPermissionsApi(mentorUserId: string, permissions: any) {
  try {
    const res = await authenticatedFetch('/api/student/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorUserId, permissions }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update permissions');
    }
    return data.permissions;
  } catch (error) {
    console.error('updateStudentSharingPermissionsApi error:', error);
    throw error;
  }
}

export async function disconnectMentorRelationshipApi(targetUserId: string) {
  try {
    const res = await authenticatedFetch(`/api/mentor/relationship/${encodeURIComponent(targetUserId)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to disconnect relationship');
    }
    return true;
  } catch (error) {
    console.error('disconnectMentorRelationshipApi error:', error);
    throw error;
  }
}

// Leaderboard & Admin API calls
export async function fetchLeaderboardApi(retries = 3, delay = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await authenticatedFetch('/api/leaderboard');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch leaderboard');
      }
      return await res.json();
    } catch (error) {
      if (attempt === retries) {
        console.warn('fetchLeaderboardApi error after retries:', error);
        return { success: true, leaderboard: [] };
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
  return { success: true, leaderboard: [] };
}

export async function updateUserPointsAdminApi(userId: string, points: number, reason?: string) {
  try {
    const res = await authenticatedFetch(`/api/admin/leaderboard/${userId}/points`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, reason }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update user points');
    }
    return await res.json();
  } catch (error) {
    console.error('updateUserPointsAdminApi error:', error);
    throw error;
  }
}

export async function updateUserRoleAdminApi(userId: string, role: string, reason?: string) {
  try {
    const res = await authenticatedFetch(`/api/admin/leaderboard/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, reason }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update user role');
    }
    return await res.json();
  } catch (error) {
    console.error('updateUserRoleAdminApi error:', error);
    throw error;
  }
}

// Backtesting Drawings & Templates API calls
export async function fetchBacktestDrawingsApi(symbol?: string, sessionId: string = 'default') {
  try {
    const url = symbol
      ? `/api/backtest/drawings?symbol=${encodeURIComponent(symbol)}&sessionId=${encodeURIComponent(sessionId)}`
      : `/api/backtest/drawings?sessionId=${encodeURIComponent(sessionId)}`;
    const res = await authenticatedFetch(url);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch drawings');
    }
    const data = await res.json();
    return data.drawings || [];
  } catch (error) {
    console.error('fetchBacktestDrawingsApi error:', error);
    return [];
  }
}

export async function saveBacktestDrawingsApi(
  symbol: string,
  drawings: any[],
  sessionId: string = 'default',
  timeframe: string = '15m'
) {
  try {
    const res = await authenticatedFetch('/api/backtest/drawings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, drawings, sessionId, timeframe }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save drawings');
    }
    return await res.json();
  } catch (error) {
    console.error('saveBacktestDrawingsApi error:', error);
    throw error;
  }
}

export async function fetchChartTemplatesApi() {
  try {
    const res = await authenticatedFetch('/api/backtest/templates');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch templates');
    }
    const data = await res.json();
    return data.templates || [];
  } catch (error) {
    console.error('fetchChartTemplatesApi error:', error);
    return [];
  }
}

export async function saveChartTemplateApi(template: {
  id?: string;
  name: string;
  description?: string;
  chartType: string;
  indicators: any[];
}) {
  try {
    const res = await authenticatedFetch('/api/backtest/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save template');
    }
    return await res.json();
  } catch (error) {
    console.error('saveChartTemplateApi error:', error);
    throw error;
  }
}

export async function deleteChartTemplateApi(templateId: string) {
  try {
    const res = await authenticatedFetch(`/api/backtest/templates/${encodeURIComponent(templateId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete template');
    }
    return await res.json();
  } catch (error) {
    console.error('deleteChartTemplateApi error:', error);
    throw error;
  }
}

export async function fetchUserProfileApi() {
  try {
    const res = await authenticatedFetch('/api/user/profile');
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile || null;
  } catch (error) {
    console.error('fetchUserProfileApi error:', error);
    return null;
  }
}

export async function updateUserProfileApi(profileData: {
  fullName?: string;
  name?: string;
  email?: string;
  accountCode?: string;
  experienceLevel?: string;
  avatarUrl?: string;
}) {
  try {
    const res = await authenticatedFetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update profile');
    }
    return await res.json();
  } catch (error) {
    console.error('updateUserProfileApi error:', error);
    throw error;
  }
}

// ============================================================================
// Auto-Sync Trading Account Connections API Helpers
// ============================================================================

export async function fetchPlatformsApi() {
  try {
    const res = await authenticatedFetch('/api/connections/platforms');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch supported platforms');
    }
    const data = await res.json();
    return data.platforms || [];
  } catch (error) {
    console.error('fetchPlatformsApi error:', error);
    throw error;
  }
}

export async function testConnectionApi(platform: string, credentials: Record<string, any>) {
  try {
    const res = await authenticatedFetch('/api/connections/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, credentials }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Connection test failed');
    }
    return data;
  } catch (error) {
    console.error('testConnectionApi error:', error);
    throw error;
  }
}

export async function fetchConnectionsApi() {
  try {
    const res = await authenticatedFetch('/api/connections');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch connections');
    }
    const data = await res.json();
    return data.connections || [];
  } catch (error) {
    console.error('fetchConnectionsApi error:', error);
    throw error;
  }
}

export async function createConnectionApi(connectionData: {
  platform: string;
  broker: string;
  server?: string;
  accountNumber: string;
  accountName?: string;
  currency?: string;
  accountType?: string;
  credentials: Record<string, any>;
  syncEnabled?: boolean;
  autoSyncIntervalMins?: number;
  importScope?: string;
  importStartDate?: string;
  linkToExistingAccountId?: string;
}) {
  try {
    const res = await authenticatedFetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create connection');
    }
    return data;
  } catch (error) {
    console.error('createConnectionApi error:', error);
    throw error;
  }
}

export async function updateConnectionApi(
  id: string,
  updateData: {
    accountName?: string;
    syncEnabled?: boolean;
    autoSyncIntervalMins?: number;
    importScope?: string;
    importStartDate?: string;
    credentials?: Record<string, any>;
  }
) {
  try {
    const res = await authenticatedFetch(`/api/connections/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update connection');
    }
    return data;
  } catch (error) {
    console.error('updateConnectionApi error:', error);
    throw error;
  }
}

export async function deleteConnectionApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/connections/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete connection');
    }
    return data;
  } catch (error) {
    console.error('deleteConnectionApi error:', error);
    throw error;
  }
}

export async function syncConnectionApi(
  id: string,
  options?: { importScope?: string; startDate?: string }
) {
  try {
    const res = await authenticatedFetch(`/api/connections/${encodeURIComponent(id)}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Sync request failed');
    }
    return data;
  } catch (error) {
    console.error('syncConnectionApi error:', error);
    throw error;
  }
}

export async function fetchConnectionLogsApi(id: string) {
  try {
    const res = await authenticatedFetch(`/api/connections/${encodeURIComponent(id)}/logs`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch logs');
    }
    return data.logs || [];
  } catch (error) {
    console.error('fetchConnectionLogsApi error:', error);
    throw error;
  }
}



