// Offline support for Nourish Doctors (Ration Calculator).
// Dexie (IndexedDB) cache-first reads for every Supabase reference table,
// plus a small outbox queue for user_logs writes (online status / logout).
// Rule: nothing here ever blocks the UI. Cache hits render instantly,
// network refresh happens in the background when online.
// First login / OTP always needs internet; after that the app works offline
// from the cache saved on the last online visit.

import Dexie, { type Table } from 'dexie';
import { supabase } from '../supabaseClient';

export const isOnline = (): boolean =>
  typeof navigator === 'undefined' ? true : navigator.onLine;

// ---------------------------------------------------------------------------
// Last logged-in user (localStorage, not Dexie — it must be readable before
// any DB work, and it holds no secret, only id + email).
// Why: a Supabase access token lasts 1 hour. When it expires and the phone
// is offline, the client cannot refresh it and reports no session — so the
// app used to ask for login again offline, while online it stayed logged
// in. Remembering the last user lets the app reopen offline with that
// identity; the real session is restored as soon as the phone is online.
// Cleared on logout (queueLogout), so logging out always sticks.
// ---------------------------------------------------------------------------
const OFFLINE_USER_KEY = 'nourish-offline-user';

export interface OfflineUser {
  id: string;
  email: string;
}

export function saveOfflineUser(user: { id: string; email: string }): void {
  try {
    localStorage.setItem(
      OFFLINE_USER_KEY,
      JSON.stringify({ id: user.id, email: user.email }),
    );
  } catch {
    // Remembering the user must never break login.
  }
}

export function getOfflineUser(): OfflineUser | null {
  try {
    const raw = localStorage.getItem(OFFLINE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineUser>;
    if (!parsed || !parsed.email) return null;
    return { id: String(parsed.id || ''), email: String(parsed.email) };
  } catch {
    return null;
  }
}

export function clearOfflineUser(): void {
  try {
    localStorage.removeItem(OFFLINE_USER_KEY);
  } catch {
    // Never block logout.
  }
}

interface QueryCacheRow {
  key: string;
  data: unknown;
  updatedAt: number;
}

export type OutboxKind = 'user_log_upsert' | 'user_log_logout';

interface OutboxRow {
  id?: number;
  kind: OutboxKind;
  payload: Record<string, unknown>;
  createdAt: number;
}

class OfflineDB extends Dexie {
  queryCache!: Table<QueryCacheRow, string>;
  outbox!: Table<OutboxRow, number>;

  constructor() {
    super('nourish-doctors-db');
    this.version(1).stores({
      queryCache: 'key, updatedAt',
      outbox: '++id, kind, createdAt',
    });
  }
}

export const offlineDb = new OfflineDB();

// ---------------------------------------------------------------------------
// Generic cache-first loader. Every data page uses this one helper so the
// offline behaviour is identical everywhere:
//   1. cached rows (if any) -> onData immediately, spinner stops (onDone)
//   2. if online -> fetcher runs in background, cache is refreshed,
//      onData runs again with the fresh rows
//   3. if offline and no cache -> onDone only, page shows its empty state
// ---------------------------------------------------------------------------
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const row = await offlineDb.queryCache.get(key);
    return row ? (row.data as T) : null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, data: unknown): Promise<void> {
  try {
    await offlineDb.queryCache.put({ key, data, updatedAt: Date.now() });
  } catch {
    // Cache write failure must never break the page.
  }
}

export async function loadCachedFirst<T>(
  key: string,
  fetcher: () => Promise<T>,
  onData: (data: T) => void,
  onDone?: () => void,
): Promise<void> {
  let doneCalled = false;
  const doneOnce = () => {
    if (!doneCalled) {
      doneCalled = true;
      onDone?.();
    }
  };

  const cached = await getCached<T>(key);
  if (cached !== null && cached !== undefined) {
    onData(cached);
    doneOnce();
    // Background refresh only — never blocks on the cached render.
    if (isOnline()) {
      try {
        const fresh = await fetcher();
        await setCached(key, fresh);
        onData(fresh);
      } catch (err) {
        console.error(`Background refresh failed for ${key}:`, err);
      }
    }
    return;
  }

  if (!isOnline()) {
    doneOnce();
    return;
  }

  try {
    const fresh = await fetcher();
    await setCached(key, fresh);
    onData(fresh);
  } catch (err) {
    console.error(`Fetch failed for ${key}:`, err);
  } finally {
    doneOnce();
  }
}

// ---------------------------------------------------------------------------
// Reference-data warm sync. Runs once after login (online) and on every
// 'online' event. Keys match exactly what the pages ask loadCachedFirst for,
// so a synced phone already has every calculator / standard / feed table
// before the user opens the page. One failed table never stops the others.
// ---------------------------------------------------------------------------
export const REFERENCE_KEYS = [
  'cattle_feeds:all',
  'cattle_feeds:dairy',
  'cattle_feeds:fattening',
  'other_ingredients:all',
  'other_ingredients:concentrate-fodder',
  'dm_references:all',
  'breeds:all',
  'breeds:dairy',
  'breeds:fattening',
  'broiler_standards:all',
  'layer_standards:all',
  'broiler_vaccinations:all',
  'layer_vaccinations:all',
  'broiler_feeds:all',
  'layer_feeds:all',
  'floating_fish_feeds:all',
  'sinking_fish_feeds:all',
  'allowed_emails:all',
] as const;

async function fetchReference(key: string): Promise<unknown> {
  switch (key) {
    case 'cattle_feeds:all': {
      const { data, error } = await supabase.from('cattle_feeds').select('*').order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'cattle_feeds:dairy': {
      const { data, error } = await supabase.from('cattle_feeds').select('*').ilike('category', 'dairy');
      if (error) throw error;
      return data || [];
    }
    case 'cattle_feeds:fattening': {
      const { data, error } = await supabase.from('cattle_feeds').select('*').ilike('category', 'fattening');
      if (error) throw error;
      return data || [];
    }
    case 'other_ingredients:all': {
      const { data, error } = await supabase.from('other_ingredients').select('*').order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'other_ingredients:concentrate-fodder': {
      const { data, error } = await supabase
        .from('other_ingredients')
        .select('id, name, price, feed_type, dm, cp, me')
        .or('feed_type.ilike.concentrate,feed_type.ilike.fodder');
      if (error) throw error;
      return data || [];
    }
    case 'dm_references:all': {
      const { data, error } = await supabase.from('dm_references').select('*').order('target_group', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'breeds:all': {
      const { data, error } = await supabase.from('breeds').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'breeds:dairy': {
      const { data, error } = await supabase.from('breeds').select('id, name').ilike('category', 'dairy').order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'breeds:fattening': {
      const { data, error } = await supabase.from('breeds').select('id, name').ilike('category', 'fattening').order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'broiler_standards:all': {
      const { data, error } = await supabase.from('broiler_standards').select('*').order('day', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'layer_standards:all': {
      const { data, error } = await supabase.from('layer_standards').select('*').order('age_weeks', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'broiler_vaccinations:all': {
      const { data, error } = await supabase.from('broiler_vaccinations').select('*').order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'layer_vaccinations:all': {
      const { data, error } = await supabase.from('layer_vaccinations').select('*').order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'broiler_feeds:all': {
      const { data, error } = await supabase.from('broiler_feeds').select('*').order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'layer_feeds:all': {
      const { data, error } = await supabase.from('layer_feeds').select('*').order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'floating_fish_feeds:all': {
      const { data, error } = await supabase.from('floating_fish_feeds').select('*').order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'sinking_fish_feeds:all': {
      const { data, error } = await supabase.from('sinking_fish_feeds').select('*').order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    case 'allowed_emails:all': {
      const { data, error } = await supabase.from('allowed_emails').select('email');
      if (error) throw error;
      return (data || []).map((r: { email: string }) => r.email.toLowerCase());
    }
    default:
      return [];
  }
}

export async function syncAllReferenceData(): Promise<void> {
  if (!isOnline()) return;
  await Promise.all(
    REFERENCE_KEYS.map(async (key) => {
      try {
        const rows = await fetchReference(key);
        await setCached(key, rows);
      } catch (err) {
        console.error(`Warm sync failed for ${key}:`, err);
      }
    }),
  );
}

// ---------------------------------------------------------------------------
// user_logs outbox. Online-status writes are fire-and-forget logs: they must
// never block login, logout or any page. Offline they are queued in Dexie
// and sent when the phone is back online.
// ---------------------------------------------------------------------------
export async function sendOrQueueUserLog(
  entry: Record<string, unknown>,
): Promise<void> {
  if (isOnline()) {
    try {
      const { error } = await supabase
        .from('user_logs')
        .upsert([entry], { onConflict: 'user_email' });
      if (error) throw error;
      return;
    } catch (err) {
      console.error('user_logs upsert failed, queuing:', err);
    }
  }
  try {
    await offlineDb.outbox.add({
      kind: 'user_log_upsert',
      payload: entry,
      createdAt: Date.now(),
    });
  } catch {
    // Log loss is acceptable; never break login/logout.
  }
}

export async function queueLogout(email: string): Promise<void> {
  // A logout must stick: forget the remembered user so an offline reopen
  // never brings them back.
  clearOfflineUser();
  try {
    await offlineDb.outbox.add({
      kind: 'user_log_logout',
      payload: { user_email: email, logout_time: new Date().toISOString() },
      createdAt: Date.now(),
    });
  } catch {
    // Never block logout.
  }
}

async function processLogoutEntry(email: string, logoutTime: string): Promise<void> {
  const { data: activeLogs } = await supabase
    .from('user_logs')
    .select('id, login_time')
    .eq('user_email', email)
    .eq('is_logged_in', true)
    .order('login_time', { ascending: false })
    .limit(1);

  if (activeLogs && activeLogs.length > 0) {
    const log = activeLogs[0];
    const diffMinutes = Math.floor(
      (new Date(logoutTime).getTime() - new Date(log.login_time).getTime()) / (1000 * 60),
    );
    await supabase
      .from('user_logs')
      .update({
        is_logged_in: false,
        logout_time: logoutTime,
        session_duration_minutes: diffMinutes > 0 ? diffMinutes : 1,
      })
      .eq('id', log.id);
  } else {
    await supabase
      .from('user_logs')
      .update({ is_logged_in: false, logout_time: logoutTime })
      .eq('user_email', email);
  }
}

export async function processOutbox(): Promise<void> {
  if (!isOnline()) return;
  let rows: OutboxRow[] = [];
  try {
    rows = await offlineDb.outbox.orderBy('createdAt').toArray();
  } catch {
    return;
  }
  for (const row of rows) {
    try {
      if (row.kind === 'user_log_upsert') {
        const { error } = await supabase
          .from('user_logs')
          .upsert([row.payload], { onConflict: 'user_email' });
        if (error) throw error;
      } else if (row.kind === 'user_log_logout') {
        await processLogoutEntry(
          String(row.payload.user_email || ''),
          String(row.payload.logout_time || new Date().toISOString()),
        );
      }
      if (row.id !== undefined) await offlineDb.outbox.delete(row.id);
    } catch (err) {
      console.error('Outbox entry failed, will retry later:', err);
      // Keep the entry queued; stop this run so order is preserved.
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Manual "Update Data" (sidebar button). Re-pulls every reference table from
// Supabase into the offline cache and flushes queued user_logs, then records
// when it happened so the sidebar can show "Last updated: ...".
// Offline it does nothing and returns false — the app keeps running from
// the cache, exactly as before.
// ---------------------------------------------------------------------------
const LAST_DATA_UPDATED_KEY = 'nourish-last-data-updated';

export function getLastDataUpdated(): number | null {
  try {
    const raw = localStorage.getItem(LAST_DATA_UPDATED_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export async function refreshDataNow(): Promise<boolean> {
  if (!isOnline()) return false;
  await syncAllReferenceData();
  await processOutbox();
  try {
    localStorage.setItem(LAST_DATA_UPDATED_KEY, String(Date.now()));
  } catch {
    // Timestamp loss is harmless; the data itself was still refreshed.
  }
  return true;
}

// ---------------------------------------------------------------------------
// One-time wiring: 'online' event re-syncs reference data + flushes logs.
// Call once from App. Safe to call repeatedly (guarded).
// ---------------------------------------------------------------------------
let offlineListenersStarted = false;

export function initOfflineSync(): void {
  if (offlineListenersStarted || typeof window === 'undefined') return;
  offlineListenersStarted = true;
  window.addEventListener('online', () => {
    void syncAllReferenceData();
    void processOutbox();
  });
}

// Realtime channels need a live connection. Offline they just hang / error,
// so pages only subscribe when online.
export const shouldUseRealtime = (): boolean => isOnline();
