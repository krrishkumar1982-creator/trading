import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Derive a 32-byte key from environment secret or a secure system secret
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'tradeforge_secure_auto_sync_secret_vault_key_2026';
  return crypto.createHash('sha256').update(secret).digest();
}

export interface EncryptedPayload {
  iv: string; // base64
  tag: string; // base64
  data: string; // base64
}

/**
 * Encrypt sensitive credentials (e.g. read-only broker passwords, API tokens)
 * using AES-256-GCM authenticated encryption.
 */
export function encryptCredentials(plainData: any): string {
  if (plainData === undefined || plainData === null) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const textToEncrypt = typeof plainData === 'string' ? plainData : JSON.stringify(plainData);
  let encrypted = cipher.update(textToEncrypt, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted,
  };

  return JSON.stringify(payload);
}

/**
 * Decrypt sensitive credentials using AES-256-GCM.
 * Never throws to the client - returns null on corrupted or invalid tags.
 */
export function decryptCredentials<T = any>(encryptedString: string): T | null {
  if (!encryptedString) return null;
  try {
    const payload: EncryptedPayload = JSON.parse(encryptedString);
    if (!payload.iv || !payload.tag || !payload.data) return null;

    const key = getEncryptionKey();
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(payload.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as unknown as T;
    }
  } catch (err) {
    console.error('[CryptoUtils] Decryption error:', err);
    return null;
  }
}
