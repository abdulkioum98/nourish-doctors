import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Clock, Mail, Laptop } from 'lucide-react';

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

export default function UserInfoPage({ session }: UserInfoPageProps) {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setTick] = useState(0);

  const currentUserEmail = session?.user?.email;

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (currentUserEmail !== 'abdulkioum98@gmail.com') {
    return (
      <div className="p-12 text-center text-rose-600 font-bold text-xl bg-white rounded-3xl shadow-sm border border-rose-100 max-w-lg mx-auto mt-20">
        Access Denied! 
      </div>
    );
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLogs(data as UserLog[]);
    }
    setLoading(false);
  }

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
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

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading activity logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-100 uppercase text-xs tracking-wider">
                  <th className="p-4 font-bold">User Email</th>
                  <th className="p-4 font-bold">Device / Browser</th>
                  <th className="p-4 font-bold">OTP Status</th>
                  <th className="p-4 font-bold text-center">Login Status</th>
                  <th className="p-4 font-bold">Login Time</th>
                  <th className="p-4 font-bold">Active Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">No activity logs found.</td>
                  </tr>
                ) : (
                  logs.map((log: UserLog) => {
                    const currentDuration = calculateDuration(log);
                    return (
                      <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="p-4 font-semibold text-slate-800 flex items-center space-x-2.5">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Mail size={16} />
                          </div>
                          <span>{log.user_email}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-500 whitespace-normal break-all font-mono" title={log.device_info}>
                          <div className="flex items-center space-x-1.5">
                            <Laptop size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">{log.device_info ? log.device_info : 'Unknown Device'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-full text-xs font-bold shadow-2xs">
                            {log.otp_status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {log.is_logged_in ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 font-medium text-xs">
                          {log.login_time ? new Date(log.login_time).toLocaleString() : '-'}
                        </td>
                        <td className="p-4 font-bold text-indigo-900 flex items-center space-x-1.5">
                          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock size={14} />
                          </div>
                          <span>{currentDuration} mins</span>
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