import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { isOnline, loadCachedFirst, setCached, shouldUseRealtime } from '../lib/offline';
import { Shield, Clock, Mail, Laptop, Trash2, Home, Smartphone, Globe, Calendar, ChevronDown, ChevronRight, History } from 'lucide-react';

interface SessionUser {
  email?: string;
}

interface Session {
  user?: SessionUser;
}

interface UserInfoPageProps {
  session: Session | null;
}

interface UserLog {
  id: string;
  user_email: string;
  otp_status: string;
  is_logged_in: boolean;
  login_time: string | null;
  logout_time: string | null;
  session_duration_minutes: number;
  created_at: string;
  device_info?: string;
}

interface HomeVisit {
  id: number;
  user_email: string;
  visited_at: string;
  source: 'app' | 'browser';
  device_model?: string | null;
  device_info?: string | null;
}

/** Local YYYY-MM-DD for a timestamp (the visit date in the phone's timezone). */
function localDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return localDateKey(new Date().toISOString());
}

export default function UserInfoPage({ session }: UserInfoPageProps) {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setTick] = useState(0);

  // Home page visits (daily).
  const [visits, setVisits] = useState<HomeVisit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  // Date range (Multi): when marked, From-To pickers replace the single
  // date. Default range = last 7 days (today + 6 days back).
  const [multiDate, setMultiDate] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return localDateKey(d.toISOString());
  });
  const [toDate, setToDate] = useState<string>(todayKey());
  // Delete History range, in days (1 month = 30 days, 3 months = 90, 6 = 180).
  const [deleteRangeDays, setDeleteRangeDays] = useState<number>(7);

  const currentUserEmail = session?.user?.email;

  // প্রতি ১ মিনিট পর পর অনলাইন ইউজারদের লাইভ ডিউরেশন আপডেট করার জন্য টিক
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (currentUserEmail !== 'abdulkioum98@gmail.com') {
    return (
      <div className="p-12 text-center text-rose-600 font-bold text-xl bg-white rounded-3xl shadow-sm border border-rose-100 max-w-lg mx-auto mt-20">
        Access Denied! You do not have permission to view this page.
      </div>
    );
  }

  // Data fetch (cache-first) and Realtime subscription setup
  useEffect(() => {
    fetchLogs();

    // Realtime only when online — offline a channel just hangs / errors.
    if (!shouldUseRealtime()) return;

    const channel = supabase
      .channel('public:user_logs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_logs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLogs((prev) => [payload.new as UserLog, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLogs((prev) =>
              prev.map((log) =>
                log.id === payload.new.id ? (payload.new as UserLog) : log
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setLogs((prev) => prev.filter((log) => log.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Exact Supabase query, used as the cache-first fetcher.
  async function fetchLogs() {
    setLoading(true);
    await loadCachedFirst<UserLog[]>(
      'user_logs:all',
      async () => {
        const { data, error } = await supabase
          .from('user_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching user logs:', error);
          return [];
        }
        return (data ?? []) as UserLog[];
      },
      (rows) => setLogs(rows),
      () => setLoading(false),
    );
  }

  // Home page visits: cache-first fetch + Realtime for new visits.
  useEffect(() => {
    fetchVisits();

    if (!shouldUseRealtime()) return;

    const channel = supabase
      .channel('public:home_visits')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'home_visits' },
        (payload) => {
          setVisits((prev) => [payload.new as HomeVisit, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchVisits() {
    setVisitsLoading(true);
    await loadCachedFirst<HomeVisit[]>(
      'home_visits:all',
      async () => {
        const { data, error } = await supabase
          .from('home_visits')
          .select('*')
          .order('visited_at', { ascending: false })
          .limit(2000);

        if (error) {
          console.error('Error fetching home visits:', error);
          return [];
        }
        return (data ?? []) as HomeVisit[];
      },
      (rows) => setVisits(rows),
      () => setVisitsLoading(false),
    );
  }

  // Visits on the selected date (or in the From-To range when Multi is
  // on), grouped per user (newest first). From/To are auto-swapped if
  // the user picks From after To.
  const dayVisits = useMemo(() => {
    if (!multiDate) {
      return visits.filter((v) => localDateKey(v.visited_at) === selectedDate);
    }
    const lo = fromDate <= toDate ? fromDate : toDate;
    const hi = fromDate <= toDate ? toDate : fromDate;
    return visits.filter((v) => {
      const k = localDateKey(v.visited_at);
      return k >= lo && k <= hi;
    });
  }, [visits, selectedDate, multiDate, fromDate, toDate]);
  const visitSummary = useMemo(() => {
    const byUser = new Map<string, HomeVisit[]>();
    dayVisits.forEach((v) => {
      const list = byUser.get(v.user_email) || [];
      list.push(v);
      byUser.set(v.user_email, list);
    });
    // Each user's list is already newest-first (visits are newest-first).
    return Array.from(byUser.entries()).map(([email, list]) => ({
      email,
      count: list.length,
      last: list[0],
      list,
    }));
  }, [dayVisits]);

  // Delete History: removes EVERYONE's home page visits in the chosen
  // range (visited_at >= now - N days). The range label for the confirm.
  const deleteRangeLabel =
    deleteRangeDays === 30
      ? '1 month'
      : deleteRangeDays === 90
        ? '3 months'
        : deleteRangeDays === 180
          ? '6 months'
          : `${deleteRangeDays} day${deleteRangeDays !== 1 ? 's' : ''}`;

  const handleDeleteHistory = async () => {
    if (!isOnline()) {
      alert('You are offline. Deleting history needs internet.');
      return;
    }
    const cutoff = new Date(Date.now() - deleteRangeDays * 24 * 60 * 60 * 1000).toISOString();
    const inRange = visits.filter((v) => v.visited_at >= cutoff);
    if (inRange.length === 0) {
      alert(`No home page visits in the last ${deleteRangeLabel}.`);
      return;
    }
    const ok = window.confirm(
      `Delete ${inRange.length} home page visit${inRange.length !== 1 ? 's' : ''} from the last ${deleteRangeLabel} for ALL users? This cannot be undone.`,
    );
    if (!ok) return;

    const { error } = await supabase
      .from('home_visits')
      .delete()
      .gte('visited_at', cutoff);

    if (error) {
      alert('Failed to delete history: ' + error.message);
      return;
    }
    const remaining = visits.filter((v) => v.visited_at < cutoff);
    setVisits(remaining);
    await setCached('home_visits:all', remaining);
    setExpandedEmail(null);
    alert(`Deleted ${inRange.length} home page visit${inRange.length !== 1 ? 's' : ''} from the last ${deleteRangeLabel}.`);
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;

    if (!isOnline()) {
      alert('You are offline. Deleting logs needs internet.');
      return;
    }

    const { error } = await supabase.from('user_logs').delete().eq('id', id);

    if (error) {
      alert('Failed to delete log: ' + error.message);
    } else {
      const remaining = logs.filter((log) => log.id !== id);
      setLogs(remaining);
      await setCached('user_logs:all', remaining);
    }
  };

  const parseDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Device';

    if (userAgent.includes('Android')) {
      if (userAgent.includes('Mobile')) {
        return 'Android Mobile Device';
      }
      return 'Android Tablet / Device';
    } else if (userAgent.includes('iPhone')) {
      return 'Apple iPhone';
    } else if (userAgent.includes('iPad')) {
      return 'Apple iPad';
    } else if (userAgent.includes('Windows')) {
      return 'Windows PC / Laptop';
    } else if (userAgent.includes('Macintosh')) {
      return 'Mac / MacBook';
    } else if (userAgent.includes('Linux')) {
      return 'Linux Computer';
    }

    return 'Web Browser / Device';
  };

  const calculateDuration = (log: UserLog) => {
    if (!log.login_time) return 0;

    if (log.is_logged_in) {
      const loginTime = new Date(log.login_time).getTime();
      const now = new Date().getTime();
      const diffMinutes = Math.floor((now - loginTime) / (1000 * 60));
      return diffMinutes > 0 ? diffMinutes : 0;
    }

    if (log.session_duration_minutes && log.session_duration_minutes > 0) {
      return log.session_duration_minutes;
    }

    if (log.logout_time) {
      const loginTime = new Date(log.login_time).getTime();
      const logoutTime = new Date(log.logout_time).getTime();
      const diffMinutes = Math.floor((logoutTime - loginTime) / (1000 * 60));
      return diffMinutes > 0 ? diffMinutes : 0;
    }

    return 0;
  };

  return (
    <div className="p-6 space-y-6 max-w-full mx-auto font-sans">
      <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-7 rounded-3xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] border border-indigo-500/30 overflow-hidden flex items-center justify-between backdrop-blur-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
            User Activity
          </h1>
        </div>
        
        <div className="relative z-10 p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15 shadow-inner">
          <Shield size={32} className="text-indigo-300 drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]" />
        </div>
      </div>

      {/* ---------- Home Page Visits (daily) ---------- */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
              <Home size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight">
                Home Page Visits
              </h2>
              <p className="text-xs text-slate-500">
                {dayVisits.length} visit{dayVisits.length !== 1 ? 's' : ''} by{' '}
                {visitSummary.length} user{visitSummary.length !== 1 ? 's' : ''}{' '}
                {multiDate
                  ? `from ${fromDate <= toDate ? fromDate : toDate} to ${fromDate <= toDate ? toDate : fromDate}`
                  : 'on this day'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Multi — small checkbox; when marked, From-To pickers appear */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={multiDate}
                onChange={(e) => {
                  setMultiDate(e.target.checked);
                  setExpandedEmail(null);
                }}
                className="w-4 h-4 accent-emerald-700 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-600">Multi</span>
            </label>

            {multiDate ? (
              <>
                <label className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 cursor-pointer">
                  <span className="text-[11px] font-bold text-slate-500">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFromDate(e.target.value);
                        setExpandedEmail(null);
                      }
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  />
                </label>
                <label className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 cursor-pointer">
                  <span className="text-[11px] font-bold text-slate-500">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setToDate(e.target.value);
                        setExpandedEmail(null);
                      }
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  />
                </label>
              </>
            ) : (
              <>
                {/* Date filter */}
                <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                        setExpandedEmail(null);
                      }
                    }}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                  />
                </label>
                {selectedDate !== todayKey() && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayKey());
                      setExpandedEmail(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer"
                  >
                    Today
                  </button>
                )}
              </>
            )}

            {/* Delete History — small, right side (rarely used) */}
            <span className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />
            <select
              value={deleteRangeDays}
              onChange={(e) => setDeleteRangeDays(Number(e.target.value))}
              title="Delete history range"
              className="bg-rose-50/70 border border-rose-200 text-rose-800 text-[11px] font-semibold rounded-lg px-2 py-1.5 outline-none cursor-pointer"
            >
              <option value={1}>Last 1 day</option>
              <option value={3}>Last 3 days</option>
              <option value={7}>Last 7 days</option>
              <option value={15}>Last 15 days</option>
              <option value={30}>Last 1 month</option>
              <option value={90}>Last 3 months</option>
              <option value={180}>Last 6 months</option>
            </select>
            <button
              type="button"
              onClick={handleDeleteHistory}
              title="Delete history"
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {visitsLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading visits...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-100 uppercase text-xs tracking-wider">
                  <th className="p-4 font-bold whitespace-nowrap">User Email</th>
                  <th className="p-4 font-bold text-center whitespace-nowrap">Visits</th>
                  <th className="p-4 font-bold whitespace-nowrap">Last Visit</th>
                  <th className="p-4 font-bold whitespace-nowrap">Source</th>
                  <th className="p-4 font-bold whitespace-nowrap">Phone Model</th>
                  <th className="p-4 font-bold text-center whitespace-nowrap">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visitSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">
                      {multiDate
                        ? 'No home page visits in this date range.'
                        : 'No home page visits on this date.'}
                    </td>
                  </tr>
                ) : (
                  visitSummary.map((row) => {
                    const expanded = expandedEmail === row.email;
                    return (
                      <React.Fragment key={row.email}>
                        <tr className="hover:bg-emerald-50/30 transition-colors">
                          <td className="p-4 font-semibold text-slate-800 whitespace-nowrap">
                            <div className="flex items-center space-x-2.5">
                              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                                <Mail size={16} />
                              </div>
                              <span>{row.email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 bg-emerald-700 text-white rounded-full text-xs font-bold">
                              {row.count}×
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-medium text-xs whitespace-nowrap">
                            {new Date(row.last.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {row.last.source === 'app' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-xs font-bold">
                                <Smartphone size={13} />
                                App
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-full text-xs font-bold">
                                <Globe size={13} />
                                Browser
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {row.last.device_model || 'Unknown'}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setExpandedEmail(expanded ? null : row.email)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              <History size={14} />
                              History
                              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={6} className="p-4">
                              <div className="text-xs font-bold text-slate-600 mb-2">
                                {row.email} — {row.count} visit{row.count !== 1 ? 's' : ''}{' '}
                                {multiDate
                                  ? `from ${fromDate <= toDate ? fromDate : toDate} to ${fromDate <= toDate ? toDate : fromDate}`
                                  : `on ${selectedDate}`}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {row.list.map((v) => (
                                  <div
                                    key={v.id}
                                    className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2"
                                  >
                                    <span className="font-bold text-slate-700 text-xs whitespace-nowrap">
                                      {new Date(v.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-500 truncate">
                                      {v.source === 'app' ? 'App' : 'Browser'} • {v.device_model || 'Unknown'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading activity logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-100 uppercase text-xs tracking-wider">
                  <th className="p-4 font-bold whitespace-nowrap">User Email</th>
                  <th className="p-4 font-bold whitespace-nowrap">Device / Browser</th>
                  <th className="p-4 font-bold whitespace-nowrap">OTP Status</th>
                  <th className="p-4 font-bold text-center whitespace-nowrap">Login Status</th>
                  <th className="p-4 font-bold whitespace-nowrap">Login Time</th>
                  <th className="p-4 font-bold whitespace-nowrap">Active Duration</th>
                  <th className="p-4 font-bold text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">No activity logs found.</td>
                  </tr>
                ) : (
                  logs.map((log: UserLog) => {
                    const currentDuration = calculateDuration(log);
                    return (
                      <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                        
                        <td className="p-4 font-semibold text-slate-800 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                              <Mail size={16} />
                            </div>
                            <span>{log.user_email}</span>
                          </div>
                        </td>

                        <td className="p-4 text-xs text-slate-500 font-mono whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Laptop size={14} className="text-slate-400 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-700">
                                {parseDeviceInfo(log.device_info)}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-2" title={log.device_info}>
                                ({log.device_info ? log.device_info.substring(0, 45) + '...' : 'Unknown'})
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-full text-xs font-bold shadow-2xs">
                            {log.otp_status}
                          </span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          {log.is_logged_in ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                              Logged In
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              Logged Out
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 font-medium text-xs whitespace-nowrap">
                          {log.login_time ? new Date(log.login_time).toLocaleString() : '-'}
                        </td>
                        <td className="p-4 font-bold text-indigo-900 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                              <Clock size={14} />
                            </div>
                            <span>{currentDuration} mins</span>
                          </div>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors shadow-2xs"
                            title="Delete this log"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}