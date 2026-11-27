import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { loadCachedFirst, setCached, shouldUseRealtime } from '../../lib/offline';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import {
  ArrowLeft,
  Download,
  FolderOpen,
  Loader2,
} from 'lucide-react';

export interface MaterialItem {
  id: number;
  title: string;
  category: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

interface TrainingMaterialsPageProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Small helpers (kept in this file — only this page needs them).
// ---------------------------------------------------------------------------
const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes == null || Number.isNaN(bytes) || bytes < 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const timeAgo = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '';
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'just now';
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const exactDate = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Category badge colours (Poultry amber, Cattle emerald, Fish cyan).
const categoryBadge = (category: string): string => {
  const c = (category || '').toLowerCase();
  if (c === 'poultry') return 'bg-amber-100 text-amber-800';
  if (c === 'cattle') return 'bg-emerald-100 text-emerald-800';
  if (c === 'fish') return 'bg-cyan-100 text-cyan-800';
  return 'bg-slate-100 text-slate-700';
};

// Extension badge — the label IS the file extension (e.g. "PDF", "PPTX",
// "DOCX", "MP3"), on a background coloured like the app that opens it.
// Covers documents, spreadsheets, images, audio, video and archives.
const fileBadge = (fileType: string): { label: string; classes: string } => {
  const t = (fileType || '').toLowerCase();
  const label = (t || 'file').toUpperCase().slice(0, 5);
  if (t === 'pdf') return { label, classes: 'bg-red-600' };
  if (t === 'doc' || t === 'docx') return { label, classes: 'bg-blue-600' };
  if (t === 'ppt' || t === 'pptx') return { label, classes: 'bg-orange-500' };
  if (t === 'xls' || t === 'xlsx' || t === 'csv') return { label, classes: 'bg-green-600' };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(t))
    return { label, classes: 'bg-purple-500' };
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(t)) return { label, classes: 'bg-rose-500' };
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(t))
    return { label, classes: 'bg-amber-500' };
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(t)) return { label, classes: 'bg-slate-500' };
  if (t === 'txt' || t === 'md') return { label, classes: 'bg-slate-400' };
  return { label, classes: 'bg-slate-500' };
};

// MIME type for FileOpener — the phone's viewer needs it to pick the
// right app (PDF viewer, PowerPoint, music player, ...).
const mimeFor = (fileType: string): string => {
  const t = (fileType || '').toLowerCase();
  if (t === 'pdf') return 'application/pdf';
  if (t === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (t === 'ppt') return 'application/vnd.ms-powerpoint';
  if (t === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (t === 'doc') return 'application/msword';
  if (t === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (t === 'xls') return 'application/vnd.ms-excel';
  if (t === 'csv') return 'text/csv';
  if (t === 'txt' || t === 'md') return 'text/plain';
  if (t === 'jpg' || t === 'jpeg') return 'image/jpeg';
  if (t === 'png') return 'image/png';
  if (t === 'gif') return 'image/gif';
  if (t === 'webp') return 'image/webp';
  if (t === 'svg') return 'image/svg+xml';
  if (t === 'mp3') return 'audio/mpeg';
  if (t === 'wav') return 'audio/wav';
  if (t === 'ogg') return 'audio/ogg';
  if (t === 'm4a') return 'audio/mp4';
  if (t === 'flac') return 'audio/flac';
  if (t === 'aac') return 'audio/aac';
  if (t === 'mp4') return 'video/mp4';
  if (t === 'mov') return 'video/quicktime';
  if (t === 'avi') return 'video/x-msvideo';
  if (t === 'mkv') return 'video/x-matroska';
  if (t === 'webm') return 'video/webm';
  if (t === 'zip') return 'application/zip';
  if (t === 'rar') return 'application/vnd.rar';
  if (t === '7z') return 'application/x-7z-compressed';
  return 'application/octet-stream';
};

// Blob -> base64 (without the data: prefix), for Filesystem.writeFile.
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(blob);
  });

type CategoryFilter = 'all' | 'poultry' | 'cattle' | 'fish';

export default function TrainingMaterialsPage({ onBack }: TrainingMaterialsPageProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadErrorId, setDownloadErrorId] = useState<number | null>(null);

  // Fetch the rows (cache-first: renders from IndexedDB instantly,
  // refreshes from network in the background). Latest first.
  const fetchMaterials = async () => {
    await loadCachedFirst<MaterialItem[]>(
      'materials:all',
      async () => {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching training materials:', error);
          return [];
        }
        return data || [];
      },
      (rows) => setMaterials(rows),
      () => setLoading(false),
    );
  };

  // Same fetch used by the realtime listener (returns rows directly).
  const fetchMaterialsRows = async (): Promise<MaterialItem[]> => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching training materials:', error);
      return [];
    }
    return data || [];
  };

  useEffect(() => {
    fetchMaterials();

    // Realtime only when online — offline a channel just hangs / errors.
    if (!shouldUseRealtime()) return;

    // Supabase Realtime listener (auto-update when Admin uploads/deletes)
    const channel = supabase
      .channel('materials_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials' },
        () => {
          void fetchMaterialsRows().then((rows) => {
            void setCached('materials:all', rows);
            setMaterials(rows);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const visibleMaterials = materials.filter((m) => {
    if (activeCategory === 'all') return true;
    return (m.category || '').toLowerCase() === activeCategory;
  });

  const countFor = (cat: CategoryFilter) =>
    cat === 'all'
      ? materials.length
      : materials.filter((m) => (m.category || '').toLowerCase() === cat).length;

  // Download the file from the public storage bucket.
  // In the app (Android WebView) a plain <a download> click silently
  // does nothing — the same reason window.print() never worked there
  // (see downloadPdf.ts). So on the phone the file is saved FIRST to
  // the Documents folder, then opened with the phone's viewer ("Open
  // with" chooser). In the browser the file downloads DIRECTLY from
  // its URL, so it appears in the browser's download manager the
  // moment you click, with the browser's own progress.
  // SPEED (phone): the native side downloads straight to Documents
  // with Filesystem.downloadFile — the old way (Blob -> base64 ->
  // writeFile) was slow because base64 makes the file ~33% bigger
  // and the whole string has to cross the JS bridge. downloadFile
  // skips it entirely, and its progress events drive the live % bar.
  // If it ever fails, the old Blob way is the fallback.
  const handleDownload = async (item: MaterialItem) => {
    setDownloadErrorId(null);
    setDownloadingId(item.id);
    setDownloadProgress(null);
    try {
      const fileName = item.file_name || 'material';
      if (Capacitor.isNativePlatform()) {
        let savedUri: string | null = null;
        let savedToDocuments = false;
        // Fast path: native download straight to Documents, with a live
        // progress listener so the button shows the real % instead of a
        // bare spinner (a big file on a slow connection still takes
        // time — the % shows it is actually moving).
        let progressHandle: { remove: () => Promise<void> } | null = null;
        try {
          const { data: urlData } = supabase.storage.from('materials').getPublicUrl(item.file_path);
          progressHandle = await Filesystem.addListener('progress', (p) => {
            if (p.contentLength > 0) {
              setDownloadProgress(Math.min(100, Math.round((p.bytes / p.contentLength) * 100)));
            }
          });
          await Filesystem.downloadFile({
            url: urlData.publicUrl,
            path: fileName,
            directory: Directory.Documents,
            progress: true,
          });
          const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Documents });
          savedUri = uri;
          savedToDocuments = true;
        } catch (nativeDownloadError) {
          console.warn('Native downloadFile failed, falling back to blob download', nativeDownloadError);
        } finally {
          if (progressHandle) {
            try { await progressHandle.remove(); } catch { /* already gone */ }
          }
        }
        // Fallback: download as Blob, base64, writeFile (the old way).
        if (!savedUri) {
          const { data, error } = await supabase.storage.from('materials').download(item.file_path);
          if (error || !data) throw error || new Error('Empty download');
          const base64 = await blobToBase64(data);
          try {
            const saved = await Filesystem.writeFile({
              path: fileName,
              data: base64,
              directory: Directory.Documents,
            });
            savedUri = saved.uri;
            savedToDocuments = true;
          } catch (documentsError) {
            // Some devices block the public Documents folder — fall back
            // to the app cache so the file still opens, and say so plainly.
            console.warn('Could not save file to Documents, using cache', documentsError);
            alert('Could not save the file to Documents. Opening a temporary copy instead.');
            const saved = await Filesystem.writeFile({
              path: fileName,
              data: base64,
              directory: Directory.Cache,
            });
            savedUri = saved.uri;
          }
        }
        alert(
          savedToDocuments
            ? `File saved successfully to Documents: ${fileName}`
            : `File saved: ${fileName}`,
        );
        try {
          await FileOpener.open({
            filePath: savedUri,
            contentType: mimeFor(item.file_type),
          });
        } catch (openError) {
          // The file IS saved — only opening it failed.
          console.warn('Could not open file, it is saved in Documents', openError);
          alert(`File saved to Documents: ${fileName}. No app on the phone can open this file type.`);
        }
        return;
      }
      // Browser: start the download DIRECTLY from the file URL, so it
      // appears in the browser's download manager the moment you click,
      // with the browser's own progress bar. The old way fetched the
      // whole file as a Blob first (invisible, in the background) and
      // only then started the browser download — that is why nothing
      // showed in the download list until the very end. The download
      // URL forces the file to download (not display) via
      // Content-Disposition: attachment.
      const { data: urlData } = supabase.storage.from('materials').getPublicUrl(item.file_path, { download: fileName });
      const a = document.createElement('a');
      a.href = urlData.publicUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // The browser now owns the download (its manager shows progress),
      // so our spinner stops right away.
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadErrorId(item.id);
    } finally {
      setDownloadingId(null);
      setDownloadProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back */}
      <div>
        <button
          onClick={onBack}
          className="text-xs text-violet-700 font-semibold flex items-center space-x-1 bg-violet-50 px-2.5 py-1.5 rounded-lg hover:bg-violet-100 transition"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Category filter — individual cards (label + item count) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'poultry', label: 'Poultry' },
            { key: 'cattle', label: 'Cattle' },
            { key: 'fish', label: 'Fish' },
          ] as const
        ).map((c) => {
          const isActive = activeCategory === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`rounded-xl px-1 py-1.5 sm:py-2 text-center transition border ${
                isActive
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-600 border-violet-700 text-white shadow-md scale-[1.03]'
                  : 'bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100'
              }`}
            >
              <span className="block text-[11px] sm:text-xs font-bold leading-tight">{c.label}</span>
              <span className={`block text-[9px] sm:text-[10px] leading-tight ${isActive ? 'text-violet-100' : 'text-violet-600/70'}`}>
                {countFor(c.key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Material list */}
      {loading && materials.length === 0 ? (
        <div className="p-8 flex justify-center items-center text-violet-700 space-x-2 bg-white rounded-2xl border border-violet-100">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-xs font-semibold">Loading materials...</span>
        </div>
      ) : visibleMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-violet-100 py-10 px-4 flex flex-col items-center gap-2 text-center">
          <span className="p-3 rounded-2xl bg-violet-50 text-violet-400">
            <FolderOpen size={28} />
          </span>
          <p className="text-sm font-bold text-slate-700">
            {activeCategory === 'all'
              ? 'No training materials uploaded yet.'
              : 'No materials in this category yet.'}
          </p>
          <p className="text-xs text-slate-400">
            {activeCategory === 'all'
              ? 'Upload a file from the Admin page to see it here.'
              : 'Try another category, or check back later.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMaterials.map((item) => {
            const badge = fileBadge(item.file_type);
            const isDownloading = downloadingId === item.id;
            const hasError = downloadErrorId === item.id;
            return (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden"
              >
                <div className="p-3.5 sm:p-4 flex gap-3">
                {/* File-type badge — the extension itself, on its app colour */}
                <span className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center ${badge.classes}`}>
                  <span className="text-[11px] sm:text-xs font-extrabold tracking-wide text-white text-center leading-none px-1 break-all">
                    {badge.label}
                  </span>
                </span>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug break-words">
                    {item.title}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${categoryBadge(item.category)}`}>
                      {item.category}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {formatFileSize(item.file_size)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">{timeAgo(item.created_at)}</span>
                    <span className="text-slate-400">({exactDate(item.created_at)})</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 break-all">{item.file_name}</p>
                  {hasError && (
                    <p className="mt-1.5 text-[11px] font-semibold text-rose-600">
                      Download failed — check your connection and try again.
                    </p>
                  )}
                </div>

                {/* Download button */}
                <div className="shrink-0 self-center">
                  <button
                    onClick={() => handleDownload(item)}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs font-bold px-3 py-2.5 shadow-sm hover:from-violet-700 hover:to-indigo-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Download size={15} />
                    )}
                    <span className={isDownloading && downloadProgress !== null ? '' : 'hidden sm:inline'}>
                      {isDownloading && downloadProgress !== null ? `${downloadProgress}%` : 'Download'}
                    </span>
                  </button>
                </div>
                </div>
                {/* Live download progress — so a big file on a slow
                    connection shows it is actually moving, not stuck. */}
                {isDownloading && (
                  <div className="px-3.5 sm:px-4 pb-3">
                    <div className="h-1.5 rounded-full bg-violet-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-200"
                        style={{ width: `${downloadProgress ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-violet-700">
                      {downloadProgress !== null ? `Downloading… ${downloadProgress}%` : 'Downloading…'}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full bg-violet-700 text-white font-medium py-2.5 rounded-lg text-xs hover:bg-violet-800 transition flex items-center justify-center space-x-1.5 mt-2 shadow-sm"
      >
        <ArrowLeft size={14} />
        <span>Back to Main Menu</span>
      </button>
    </div>
  );
}
