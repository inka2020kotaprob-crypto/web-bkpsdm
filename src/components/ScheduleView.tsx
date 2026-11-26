import { useMemo, useState } from 'react';
import { CalendarPlus, ExternalLink, FileText, PlayCircle, Search } from 'lucide-react';
import type { PortalSettings, WebinarStatus, WebinarWithStats } from '../types/webinar';
import {
  formatIndonesianDate,
  formatMonthYear,
  getStatusLabel,
  getStatusTextClass,
  safeExternalUrl,
} from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface ScheduleViewProps {
  webinars: WebinarWithStats[];
  settings: PortalSettings;
  onOpenInPortal: (webinarId: string, step: 'room' | 'register' | 'attendance') => void;
}

export function ScheduleView({ webinars, settings, onOpenInPortal }: ScheduleViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WebinarStatus>('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const w of webinars) {
      if (w.date.length >= 7) set.add(w.date.slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [webinars]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return webinars.filter((w) => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (monthFilter !== 'all' && !w.date.startsWith(monthFilter)) return false;
      if (!q) return true;
      return (
        w.title.toLowerCase().includes(q) ||
        w.speaker.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.seriesCode.toLowerCase().includes(q)
      );
    });
  }, [webinars, statusFilter, monthFilter, searchQuery]);

  const activeMonthCount = useMemo(() => {
    const targetMonth = monthFilter === 'all' ? availableMonths[0] : monthFilter;
    if (!targetMonth) return { monthLabel: '-', count: 0 };
    return {
      monthLabel: formatMonthYear(targetMonth),
      count: webinars.filter((w) => w.date.startsWith(targetMonth)).length,
    };
  }, [webinars, monthFilter, availableMonths]);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Jadwal &amp; Arsip Pelatihan Bulanan
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kalender rutin {settings.monthlyTarget} kali webinar per bulan · Terjadwal{' '}
            <span className="font-semibold text-slate-900 tabular-nums">
              {activeMonthCount.count} dari {settings.monthlyTarget} sesi
            </span>{' '}
            pada {activeMonthCount.monthLabel}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul atau narasumber..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="Filter bulan"
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Semua Bulan</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthYear(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Status Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {[
            { key: 'all', label: 'Semua Sesi' },
            { key: 'active', label: 'Hari Ini' },
            { key: 'upcoming', label: 'Akan Datang' },
            { key: 'completed', label: 'Selesai' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as 'all' | WebinarStatus)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 tabular-nums">
          Menampilkan {filtered.length} webinar
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-slate-900">
            Tidak ada jadwal webinar yang cocok dengan filter Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setMonthFilter('all');
            }}
            className="mt-3 px-4 py-2 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const materialsHref = safeExternalUrl(item.materialsUrl);
            const recordingHref = safeExternalUrl(item.recordingUrl);
            return (
              <article
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row gap-6 items-start"
              >
                <div className="w-full lg:w-56 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  <ResilientImage
                    src={item.imageUrl}
                    alt={item.title}
                    fallbackTitle={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className={getStatusTextClass(item.status)}>
                      {getStatusLabel(item.status)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{item.seriesCode}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatIndonesianDate(item.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {item.startTime}–{item.endTime} WIB
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums font-medium text-slate-800">{item.jp} JP</span>
                  </div>

                  <h2 className="mt-2 text-lg font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.description}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span>
                      Narasumber: <strong className="text-slate-900">{item.speaker}</strong>
                    </span>
                    <span className="tabular-nums">
                      {item.stats.registeredCount} pendaftar · {item.stats.attendedCount} hadir ·{' '}
                      {item.stats.certifiedCount} sertifikat
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenInPortal(
                          item.id,
                          item.status === 'upcoming' ? 'register' : 'room'
                        )
                      }
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      {item.status === 'active'
                        ? 'Ikuti Sesi & Presensi'
                        : item.status === 'upcoming'
                        ? 'Daftar Sekarang'
                        : 'Buka Ringkasan Sesi'}
                    </button>

                    {materialsHref && (
                      <a
                        href={materialsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Materi
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}

                    {recordingHref && (
                      <a
                        href={recordingHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        Rekaman
                      </a>
                    )}

                    <a
                      href={`/api/webinars/${item.id}/calendar.ics`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Simpan .ics
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
