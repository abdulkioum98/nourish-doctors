import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabaseClient';
import { isOnline, queueLogout, refreshDataNow, getLastDataUpdated, clearOfflineUser } from '../lib/offline';
import {
  X,
  LogOut,
  Mail,
  Home,
  Users,
  RefreshCw,
  Download,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';

// The APK lives in Supabase Storage (public bucket "app"). Upload the
// latest APK there as "nourish-doctors.apk" (see download-app-bucket.sql)
// and the Download App button below serves it. Change these two lines
// if the file ever moves.
const APK_BUCKET = 'app';
const APK_PATH = 'nourish-doctors.apk';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (id: string, label: string) => void;
  activeId?: string;
  userEmail?: string;
}

export default function Sidebar({
  isOpen,
  onClose,
  onNavigate,
  activeId = 'home',
  userEmail
}: SidebarProps) {

  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(() =>
    getLastDataUpdated(),
  );
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [showDownloadNotice, setShowDownloadNotice] = useState(false);

  // The timestamp may have changed while the sidebar was closed.
  useEffect(() => {
    if (isOpen) setLastUpdated(getLastDataUpdated());
  }, [isOpen]);

  // Start the APK download straight from its storage URL, so it appears
  // in the browser's download manager the moment it is tapped, with the
  // browser's own progress bar (no invisible Blob fetch first).
  const handleDownloadApp = () => {
    const { data } = supabase.storage
      .from(APK_BUCKET)
      .getPublicUrl(APK_PATH, { download: APK_PATH });
    const a = document.createElement('a');
    a.href = data.publicUrl;
    a.download = APK_PATH;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setShowDownloadNotice(false);
    onClose();
  };

  const formatLastUpdated = (ts: number | null): string => {
    if (!ts) return 'not yet';
    return new Date(ts).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleUpdateData = async () => {
    if (updating) return;
    if (!isOnline()) {
      setUpdateMsg('You are offline. Data will update when you are back online.');
      return;
    }
    setUpdateMsg(null);
    setUpdating(true);
    const ok = await refreshDataNow();
    setUpdating(false);
    if (!ok) {
      setUpdateMsg('You are offline. Data will update when you are back online.');
      return;
    }
    setLastUpdated(getLastDataUpdated());
    setUpdateMsg('Data updated.');
    // Reload the app so the fresh data actually shows: the pages hold
    // their data in memory, so without a reload they keep showing the
    // old rows even though the cache was just refreshed. In the browser
    // this also picks up a newly deployed version. In the APK it reloads
    // the bundled app with the fresh data — the code itself only changes
    // with a new APK build, data is what updates here.
    setTimeout(() => window.location.reload(), 700);
  };

  const handleLogout = async () => {
    if (!isOnline()) {
      if (userEmail) await queueLogout(userEmail);
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      window.location.reload();
      return;
    }

    if (userEmail) {
      const { data: activeLogs } = await supabase
        .from('user_logs')
        .select('id, login_time')
        .eq('user_email', userEmail)
        .eq('is_logged_in', true)
        .order('login_time', { ascending: false })
        .limit(1);

      if (activeLogs && activeLogs.length > 0) {
        const log = activeLogs[0];
        const loginTime = new Date(log.login_time).getTime();
        const logoutTime = new Date().getTime();
        
        const diffMinutes = Math.floor((logoutTime - loginTime) / (1000 * 60));
        const finalMinutes = diffMinutes > 0 ? diffMinutes : 1; 

        await supabase
          .from('user_logs')
          .update({
            is_logged_in: false,
            logout_time: new Date().toISOString(),
            session_duration_minutes: finalMinutes,
          })
          .eq('id', log.id);
      } else {
        await supabase
          .from('user_logs')
          .update({
            is_logged_in: false,
            logout_time: new Date().toISOString(),
          })
          .eq('user_email', userEmail);
      }
    }

    // A logout must stick: forget the remembered user, or the next
    // (offline) reopen would sign them straight back in.
    clearOfflineUser();
    try {
      await supabase.auth.signOut();
    } catch {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Sidebar Main Content */}
      <div className="relative w-70 max-w-[80vw] bg-white h-full shadow-2xl z-50 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="bg-emerald-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">Main Navigation</h2>
              <p className="text-[11px] text-emerald-200">Nourish Feeds & Tools</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-emerald-700/80 rounded-lg transition-colors text-white/90"
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items  */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => {
                onNavigate('home', 'Dashboard');
                onClose();
              }}
              className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center space-x-3 transition-all duration-150 ${
                activeId === 'home' || activeId === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 font-bold shadow-xs border-l-4 border-emerald-600'
                  : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Home size={18} className="text-emerald-700" />
              <span>Dashboard</span>
            </button>

            {/* No Admin Portal link here — the admin panel is reached only
                by its web link (/admin); the admin login guards it. */}

            {/* User Info Option - Only visible for abdulkioum98@gmail.com */}
            {userEmail === 'abdulkioum98@gmail.com' && (
              <button
                onClick={() => {
                  onNavigate('user-info', 'User Info');
                  onClose();
                }}
                className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center space-x-3 transition-all duration-150 ${
                  activeId === 'user-info'
                    ? 'bg-amber-50 text-amber-800 font-bold shadow-xs border-l-4 border-amber-600'
                    : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users size={18} className="text-amber-700" />
                <span>User Info</span>
              </button>
            )}

            {/* Download App — browser only. Inside the installed app there
                is nothing to download, so the button is hidden there. */}
            {!Capacitor.isNativePlatform() && (
              <button
                onClick={() => setShowDownloadNotice(true)}
                className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center space-x-3 transition-all duration-150 text-gray-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <Download size={18} className="text-emerald-700" />
                <span>Download App</span>
                <span className="ml-auto text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                  APK
                </span>
              </button>
            )}

            {/* Informational Message */}
            <div className="pt-6 px-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-500 text-xs text-center leading-relaxed">
                Select a specific module (Cattle, Poultry, Aqua)
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 sticky bottom-0">
          {userEmail && (
            <div className="flex items-center space-x-2.5 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
              <Mail size={16} className="text-emerald-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none">Logged In As</p>
                <span className="font-semibold truncate text-xs text-slate-700 block mt-0.5" title={userEmail}>
                  {userEmail}
                </span>
              </div>
            </div>
          )}

          {/* Update Data — manual sync with online */}
          <div>
            <button
              onClick={handleUpdateData}
              disabled={updating}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.99]"
            >
              <RefreshCw size={15} className={updating ? 'animate-spin' : ''} />
              <span>{updating ? 'Updating...' : 'Update Data'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center font-medium mt-1.5">
              Last updated: {formatLastUpdated(lastUpdated)}
            </p>
            {updateMsg && (
              <p className="text-[10px] text-center font-medium mt-1 text-amber-600">
                {updateMsg}
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.99]"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>

          <div className="text-[10px] text-slate-400 text-center font-medium">
            Nourish-Doctors v2.0
          </div>
        </div>
      </div>

      {/* Download App — install notice. The APK is not from the Play
          Store, so every phone shows some warning at install time. */}
      {showDownloadNotice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDownloadNotice(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[88vh]">
            <div className="bg-amber-500 text-white p-3 sm:p-4 flex items-center gap-2 shrink-0">
              <AlertTriangle size={20} className="shrink-0" />
              <h3 className="font-bold text-sm sm:text-base">Before you install</h3>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>
                This app is <b>not from the Google Play Store</b>, so your phone may
                show a warning while installing it. This is normal for an app
                installed directly (APK). Tap <b>“Install anyway”</b> or <b>“Agree”</b> to
                continue — the app is safe.
              </p>
              <div>
                <div className="font-bold text-slate-800 mb-1.5">
                  What your phone may show
                </div>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <Smartphone size={15} className="shrink-0 mt-0.5 text-slate-400" />
                    <span>
                      <b>Samsung:</b> “Install unknown apps” — allow your browser to
                      install apps; Play Protect may also warn — tap “Install anyway”.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Smartphone size={15} className="shrink-0 mt-0.5 text-slate-400" />
                    <span>
                      <b>Xiaomi / Redmi / POCO:</b> “Install unknown apps” permission
                      plus a security scan — tap “Allow” / “Install anyway”.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Smartphone size={15} className="shrink-0 mt-0.5 text-slate-400" />
                    <span>
                      <b>Oppo / Vivo / Realme:</b> “Install unknown apps” — allow the
                      browser, then tap “Install” / “Continue”.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Smartphone size={15} className="shrink-0 mt-0.5 text-slate-400" />
                    <span>
                      <b>Google Pixel / other Android:</b> a Play Protect warning —
                      tap “Install anyway”.
                    </span>
                  </li>
                </ul>
              </div>
              <p className="text-slate-500">
                After the download finishes, open the APK file from your Downloads
                and follow the prompts on your phone.
              </p>
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end items-center gap-2 shrink-0">
              <button
                onClick={() => setShowDownloadNotice(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadApp}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Download size={15} />
                <span>Download APK</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}