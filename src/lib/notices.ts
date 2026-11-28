// Notices — the bell icon on the home page + the Admin Notice tab.
//
// Flow: the admin writes a notice (Admin page) -> a row lands in the
// `notices` table -> every open app hears it at once through Supabase
// Realtime, shows it in the Notice panel and fires a local phone
// notification. A closed app gets it through Firebase (FCM) instead —
// see the send-notice-push Edge Function and push_tokens.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '../supabaseClient';
import { getAndroidNotificationIcon } from './notificationIcon';

export interface Notice {
  id: number;
  title: string;
  message: string;
  created_by?: string | null;
  created_at: string;
}

/** Newest first, up to 100 — what the Notice panel and the Admin list show. */
export async function fetchNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Notice[];
}

/** Send a notice. Returns the inserted row (its id is the notification id). */
export async function sendNotice(
  title: string,
  message: string,
  createdBy: string,
): Promise<Notice> {
  const { data, error } = await supabase
    .from('notices')
    .insert([{ title, message, created_by: createdBy || null }])
    .select('*')
    .single();
  if (error) throw error;
  return data as Notice;
}

export async function deleteNotice(id: number): Promise<void> {
  const { error } = await supabase.from('notices').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Read tracking — per device, in localStorage. A notice is unread until
// the user opens the Notice panel (which marks everything visible read).
// The navbar bell badge counts the unread ones.
// ---------------------------------------------------------------------------
const READ_NOTICES_KEY = 'nourish-read-notices';

export function getReadNoticeIds(): number[] {
  try {
    const raw = localStorage.getItem(READ_NOTICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export function markNoticesRead(ids: number[]): void {
  try {
    const merged = new Set([...getReadNoticeIds(), ...ids]);
    localStorage.setItem(READ_NOTICES_KEY, JSON.stringify([...merged]));
  } catch {
    // Read state loss is harmless; the badge just shows again.
  }
}

export function countUnread(notices: Notice[]): number {
  const read = new Set(getReadNoticeIds());
  return notices.filter((n) => !read.has(n.id)).length;
}

// ---------------------------------------------------------------------------
// Local phone notification — the "app open" path. When a new notice
// arrives over Realtime while the app is open, this puts it in the
// phone's notification panel (with the app's white silhouette icon).
// Tapping it fires 'localNotificationActionPerformed', which App.tsx
// listens for to open the Notice panel. Browser: no local notification
// (the bell badge + panel are enough there).
// ---------------------------------------------------------------------------
export async function showNoticeNotification(notice: Notice): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.requestPermissions();
    } catch {
      // Permission prompt failure must never break the panel update.
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Number(notice.id) || Math.floor(Math.random() * 2147483647),
          title: notice.title,
          body: notice.message,
          extra: { type: 'notice', noticeId: String(notice.id) },
          ...getAndroidNotificationIcon(),
        },
      ],
    });
  } catch {
    // A failed notification must never break the notice itself.
  }
}
