import { getOrCreateUser } from './repository.ts';

export async function ensureUserAndInitialSeed(userId: string) {
  try {
    await getOrCreateUser(userId);
    // Strict multi-user data isolation:
    // Brand new users start with ZERO trading accounts, ZERO trades, ZERO journal entries, ZERO playbooks.
    // We do NOT inject mock data into any user account.
  } catch (error) {
    console.error('ensureUserAndInitialSeed error:', error);
  }
}

