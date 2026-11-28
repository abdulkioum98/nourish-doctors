// Notice panel — opened from the bell icon on the home page (and from
// tapping a notice notification). Lists every notice the admin sent,
// newest first. App.tsx marks everything visible as read when it opens,
// so the bell badge clears.
import React from 'react';
import { Bell, X } from 'lucide-react';
import type { Notice } from '../lib/notices';

interface NoticePanelProps {
  open: boolean;
  onClose: () => void;
  notices: Notice[];
  loading: boolean;
}

export default function NoticePanel({ open, onClose, notices, loading }: NoticePanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="bg-emerald-800 text-white p-3 sm:p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 min-w-0">
            <Bell size={18} className="shrink-0 text-amber-300" />
            <span className="truncate">Notices</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50">
          {loading ? (
            <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
              Loading notices...
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
              No notices yet.
            </div>
          ) : (
            notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-lg border border-slate-200 p-3 sm:p-3.5 space-y-1"
              >
                <div className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                  {notice.title}
                </div>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                  {notice.message}
                </div>
                <div className="text-[11px] text-slate-400 font-medium pt-0.5">
                  {notice.created_at ? new Date(notice.created_at).toLocaleString() : ''}
                  {notice.created_by ? ` • ${notice.created_by}` : ''}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
