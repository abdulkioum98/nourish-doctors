// Device / source info for the home-page visit log (User Info page).
//
// No new plugin is needed: the phone model comes from the user agent,
// which the Android WebView already carries (e.g. "SM-A536E" for a
// Samsung, "Redmi Note 10" for a Xiaomi). That works in the installed
// app AND in the browser, and needs no APK rebuild.

import { Capacitor } from '@capacitor/core';

/** 'app' when running inside the installed APK, 'browser' otherwise. */
export function getVisitSource(): 'app' | 'browser' {
  try {
    return Capacitor.isNativePlatform() ? 'app' : 'browser';
  } catch {
    return 'browser';
  }
}

// ---------------------------------------------------------------------------
// Stable per-device id (login logs). One id per device, saved in
// localStorage the first time the app runs on that device — so the phone
// and the PC get different ids, and the same device keeps its id across
// reloads. That is how the login log can show ONE row per device when
// the same user is logged in on several devices, instead of collapsing
// them into a single row. localStorage persists in the Capacitor WebView
// too, so the installed app gets a stable id as well.
// ---------------------------------------------------------------------------
const DEVICE_ID_KEY = 'nourish-device-id';

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'unknown-device';
  }
}

/**
 * The phone / computer model from a user-agent string.
 * Android: the model sits between the Android version and "Build/"
 * (e.g. "SM-A536E", "Redmi Note 10", "Pixel 7"). iPhone/iPad have no
 * model in the user agent, so they read "iPhone" / "iPad". Desktops
 * read as their OS.
 */
export function getDeviceModel(userAgent?: string): string {
  const ua = userAgent || '';
  if (!ua) return 'Unknown';
  const androidBuild = ua.match(/Android\s[\d.]+;\s*([^;)]+?)\s+Build\//);
  if (androidBuild) return androidBuild[1].trim();
  const androidPlain = ua.match(/Android\s[\d.]+;\s*([^;)]+)/);
  if (androidPlain) return androidPlain[1].trim();
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Linux/.test(ua)) return 'Linux PC';
  return 'Unknown';
}

/** One home-page visit row, as stored in the `home_visits` table. */
export function buildHomeVisit(email: string) {
  const deviceInfo = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return {
    user_email: email,
    visited_at: new Date().toISOString(),
    source: getVisitSource(),
    device_model: getDeviceModel(deviceInfo),
    device_info: deviceInfo,
  };
}
