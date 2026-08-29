import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables for Supabase (Vite client environment)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks whether valid Supabase client credentials are provided in the environment.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
};

/**
 * Supabase client instance for frontend operations (Authentication, Realtime, Storage, Table queries).
 * If environment variables are not yet provided, a fallback proxy client is instantiated to avoid runtime crashes.
 */
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
      },
    });

/**
 * Default storage buckets for DuskFlow / Pipzy trading journal assets.
 */
export const STORAGE_BUCKETS = {
  TRADE_ATTACHMENTS: 'trade-attachments',
  SCREENSHOTS: 'screenshots',
  AVATARS: 'avatars',
  JOURNAL_ASSETS: 'journal-assets',
} as const;

/**
 * Upload an image or file asset to Supabase Storage and obtain its public CDN URL.
 * 
 * @param file The File object, Blob, or base64 data string to upload.
 * @param bucket Name of the Supabase Storage bucket (default: 'screenshots').
 * @param customPath Optional custom destination path within the bucket.
 * @returns The public HTTPS URL of the uploaded asset.
 */
export async function uploadToSupabaseStorage(
  file: File | Blob | string,
  bucket: string = STORAGE_BUCKETS.SCREENSHOTS,
  customPath?: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    // If Supabase credentials are not yet configured in .env, fall back to base64 or temporary URL
    if (typeof file === 'string') {
      return file;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file as Blob);
    });
  }

  try {
    let fileBody: File | Blob;
    let contentType = 'image/png';
    let fileExtension = 'png';

    if (typeof file === 'string') {
      // Parse base64 Data URL to Blob
      if (file.startsWith('data:')) {
        const matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          contentType = matches[1];
          fileExtension = contentType.split('/')[1] || 'png';
          const byteCharacters = atob(matches[2]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          fileBody = new Blob([byteArray], { type: contentType });
        } else {
          return file; // If not standard base64 data URL, return original string
        }
      } else {
        return file; // Regular URL
      }
    } else {
      fileBody = file;
      contentType = file.type || 'image/png';
      fileExtension = file.type?.split('/')[1] || (file as File).name?.split('.').pop() || 'png';
    }

    const fileName = customPath || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const filePath = fileName.startsWith('/') ? fileName.substring(1) : fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBody, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Supabase Storage] Upload error:', uploadError.message);
      // If upload failed, fallback to base64 representation if applicable
      if (typeof file === 'string') return file;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(fileBody);
      });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data?.publicUrl || filePath;
  } catch (err: any) {
    console.error('[Supabase Storage] Unexpected error during upload:', err);
    if (typeof file === 'string') return file;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file as Blob);
    });
  }
}
