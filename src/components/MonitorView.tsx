import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Plus,
  Search,
  Share2,
  Trash2,
} from 'lucide-react';
import type { ParticipantRecord, PortalSettings, Webinar, WebinarWithStats } from '../types/webinar';
import {
  buildWhatsappInviteText,
  formatIndonesianDate,
  formatMonthYear,
  getStatusLabel,
  getStatusTextClass,
} from '../utils/format';
import { WebinarFormModal } from './WebinarFormModal';

interface MonitorViewProps {
  webinars: WebinarWithStats[];
  settings: PortalSettings;
  onWebinarsUpdated: (webinars: WebinarWithStats[]) => void;
  onSettingsUpdated: (settings: PortalSettings) => void;
  openCreateSignal: number;
}

interface ParticipantSummary {
  total: number;
  attended: number;
  evaluated: number;
  certified: number;
  avgMaterial: number;
  avgSpeaker: number;
}

export function MonitorView({
  webinars,
  settings,
  onWebinarsUpdated,
  onSettingsUpdated,
  openCreateSignal,
}: MonitorViewProps) {
  const [subTab, setSubTab] = useState<'webinars' | 'participants' | 'settings'>('webinars');
  const [editingWebinar, setEditingWebinar] = useState<Webinar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Participants monitoring state
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>(
    () => webinars.find((w) => w.status === 'active')?.id || webinars[0]?.id || 'all'
  );
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [summary, setSummary] = useState<ParticipantSummary>({
    total: 0,
    attended: 0,
    evaluated: 0,
    certified: 0,
    avgMaterial: 0,
    avgSpeaker: 0,
  });
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantFilter, setParticipantFilter] = useState<
    'all' | 'attended' | 'pending' | 'certified'
  >('all');

  // Settings form state
  const [orgName, setOrgName] = useState(settings.organizationName);
  const [portalSubtitle, setPortalSubtitle] = useState(settings.portalSubtitle);
  const [monthlyTarget, setMonthlyTarget] = useState(String(settings.monthlyTarget));
  const [signerName, setSignerName] = useState(settings.signerName);
  const [signerTitle, setSignerTitle] = useState(settings.signerTitle);
  const [signerNip, setSignerNip] = useState(settings.signerNip);
  const [helpdeskWa, setHelpdeskWa] = useState(settings.helpdeskWhatsapp);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  useEffect(() => {
    if (openCreateSignal > 0) {
      setEditingWebinar(null);
      setIsModalOpen(true);
    }
  }, [openCreateSignal]);

  const loadParticipants = useCallback(async (webinarId: string) => {
    setLoadingParticipants(true);
    try {
      const qs = webinarId === 'all' ? '' : `?webinarId=${encodeURIComponent(webinarId)}`;
      const res = await fetch(`/api/monitor/participants${qs}`);
      const data = await res.json();
      if (res.ok) {
        setParticipants(data.participants || []);
        if (data.summary) setSummary(data.summary);
      }
    } finally {
      setLoadingParticipants(false);
    }
  }, []);

  useEffect(() => {
    if (subTab === 'participants') {
      loadParticipants(selectedWebinarId);
    }
  }, [subTab, selectedWebinarId, loadParticipants]);

  const totals = useMemo(() => {
    const activeWebinar = webinars.find((w) => w.status === 'active') || webinars[0];
    const currentMonth = activeWebinar?.date.slice(0, 7) || '2026-11';
    const monthCount = webinars.filter((w) => w.date.startsWith(currentMonth)).length;
    const registered = webinars.reduce((acc, w) => acc + w.stats.registeredCount, 0);
    const attended = webinars.reduce((acc, w) => acc + w.stats.attendedCount, 0);
    const certified = webinars.reduce((acc, w) => acc + w.stats.certifiedCount, 0);
    const attendanceRate = registered > 0 ? Math.round((attended / registered) * 100) : 0;

    return {
      monthLabel: formatMonthYear(currentMonth),
      monthCount,
      registered,
      attended,
      certified,
      attendanceRate,
    };
  }, [webinars]);

  const filteredParticipants = useMemo(() => {
    const q = participantSearch.trim().toLowerCase();
    return participants.filter((p) => {
      if (participantFilter === 'attended' && !p.attended) return false;
      if (participantFilter === 'pending' && p.attended) return false;
      if (participantFilter === 'certified' && !p.certificateCode) return false;
      if (!q) return true;
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.nip.toLowerCase().includes(q) ||
        p.instansi.toLowerCase().includes(q) ||
        (p.certificateCode || '').toLowerCase().includes(q)
      );
    });
  }, [participants, participantSearch, participantFilter]);

  async function handleCopy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  }

  async function handleQuickStatus(id: string, status: 'active' | 'upcoming' | 'completed') {
    const res = await fetch(`/api/webinars/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok && data.webinars) {
      onWebinarsUpdated(data.webinars);
    }
  }

  async function handleDeleteWebinar(id: string) {
    const res = await fetch(`/api/webinars/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.webinars) {
      onWebinarsUpdated(data.webinars);
      setConfirmDeleteId(null);
    }
  }

  async function handleParticipantAction(
    participantId: string,
    action: 'mark_attended' | 'issue_certificate'
  ) {
    const res = await fetch(`/api/monitor/participants/${participantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      await loadParticipants(selectedWebinarId);
      const portalRes = await fetch('/api/portal');
      const portalData = await portalRes.json();
      if (portalRes.ok && portalData.webinars) {
        onWebinarsUpdated(portalData.webinars);
      }
    }
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSavedNotice(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: orgName,
          portalSubtitle,
          monthlyTarget: Number(monthlyTarget) || 3,
          signerName,
          signerTitle,
          signerNip,
          helpdeskWhatsapp: helpdeskWa,
        }),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        onSettingsUpdated(data.settings);
        setSettingsSavedNotice(true);
        setTimeout(() => setSettingsSavedNotice(false), 3000);
      }
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Monitor Webinar &amp; Data Pelatihan
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kelola judul webinar yang dirilis hari ini, pantau presensi peserta, dan ekspor data
            sertifikat bulanan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingWebinar(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Buat Webinar Baru
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">Target {totals.monthLabel}</span>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {totals.monthCount} / {settings.monthlyTarget}
          </p>
          <span className="text-xs text-slate-500">Sesi webinar terjadwal</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">Total Pendaftar</span>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {totals.registered}
          </p>
          <span className="text-xs text-slate-500">Akumulasi semua seri</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">Kehadiran Terverifikasi</span>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {totals.attended}{' '}
            <span className="text-sm font-medium text-emerald-700">
              ({totals.attendanceRate}%)
            </span>
          </p>
          <span className="text-xs text-slate-500">Validasi token sesi</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">E-Sertifikat Terbit</span>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {totals.certified}
          </p>
          <span className="text-xs text-slate-500">Tervalidasi survei monev</span>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
        {[
          { key: 'webinars', label: 'Data Webinar' },
          { key: 'participants', label: 'Monitor Peserta & Kehadiran' },
          { key: 'settings', label: 'Pengaturan Portal & Sertifikat' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() =>
              setSubTab(tab.key as 'webinars' | 'participants' | 'settings')
            }
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab 1: Data Webinar */}
      {subTab === 'webinars' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Judul &amp; Narasumber</th>
                  <th className="py-3 px-4 whitespace-nowrap">Jadwal</th>
                  <th className="py-3 px-4 whitespace-nowrap">Token Presensi</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Daftar / Hadir / Cert</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status Portal</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {webinars.map((item) => {
                  const inviteText = buildWhatsappInviteText(
                    item,
                    typeof window !== 'undefined' ? window.location.origin : '',
                    settings.organizationName
                  );
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 max-w-sm">
                        <span className="block text-xs font-mono text-slate-500">
                          {item.seriesCode} · {item.jp} JP
                        </span>
                        <span className="block font-semibold text-slate-900 leading-snug mt-0.5">
                          {item.title}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">{item.speaker}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap tabular-nums text-xs text-slate-700">
                        <span className="block font-medium">
                          {formatIndonesianDate(item.date, true)}
                        </span>
                        <span className="text-slate-500">
                          {item.startTime}–{item.endTime} WIB
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopy(`token-${item.id}`, item.attendanceToken)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 bg-slate-100 rounded border border-slate-200 hover:bg-slate-200/70"
                          title="Salin token presensi"
                        >
                          {item.attendanceToken}
                          {copiedKey === `token-${item.id}` ? (
                            <Check className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono tabular-nums text-xs text-slate-700">
                        {item.stats.registeredCount} / {item.stats.attendedCount} /{' '}
                        {item.stats.certifiedCount}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-xs ${getStatusTextClass(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {item.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatus(item.id, 'active')}
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                            >
                              Tampilkan Hari Ini
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(`wa-${item.id}`, inviteText)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
                            title="Salin pesan undangan WhatsApp"
                            aria-label="Salin pesan undangan WhatsApp"
                          >
                            {copiedKey === `wa-${item.id}` ? (
                              <Check className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWebinar(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
                            title="Edit webinar"
                            aria-label="Edit webinar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 text-red-600 hover:text-red-700 border border-slate-200 rounded-lg hover:bg-red-50"
                            title="Hapus webinar"
                            aria-label="Hapus webinar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Monitor Peserta (semestabangkom data_webinar equivalent) */}
      {subTab === 'participants' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedWebinarId}
                onChange={(e) => setSelectedWebinarId(e.target.value)}
                aria-label="Pilih webinar"
                className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg max-w-xs sm:max-w-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Semua Webinar</option>
                {webinars.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.seriesCode} — {w.title}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Cari nama, NIP, instansi..."
                  className="pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'attended', label: 'Hadir' },
                  { key: 'pending', label: 'Belum Hadir' },
                  { key: 'certified', label: 'Sertifikat' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() =>
                      setParticipantFilter(
                        f.key as 'all' | 'attended' | 'pending' | 'certified'
                      )
                    }
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      participantFilter === f.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <a
                href={`/api/monitor/export/${encodeURIComponent(selectedWebinarId)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Export CSV
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-1">
            <span className="tabular-nums">
              Ringkasan: {summary.total} terdaftar · {summary.attended} hadir · {summary.evaluated}{' '}
              evaluasi · {summary.certified} sertifikat terbit
            </span>
            {summary.evaluated > 0 && (
              <span className="tabular-nums font-medium text-slate-800">
                Rata-rata Nilai: Materi {summary.avgMaterial}/5 · Narasumber {summary.avgSpeaker}/5
              </span>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Peserta &amp; NIP</th>
                    <th className="py-2.5 px-4">Instansi</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Presensi</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Evaluasi</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">No. Sertifikat</th>
                    <th className="py-2.5 px-4 text-right whitespace-nowrap">Verifikasi Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {loadingParticipants ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                        Memuat data peserta...
                      </td>
                    </tr>
                  ) : filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                        Belum ada data peserta untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4">
                          <span className="block font-medium text-slate-900">{p.fullName}</span>
                          <span className="block text-xs font-mono tabular-nums text-slate-500">
                            {p.nip}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-700 max-w-xs">
                          <span className="block truncate">{p.instansi}</span>
                          <span className="block text-slate-500 truncate">{p.jabatan}</span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-xs">
                          {p.attended ? (
                            <span className="text-emerald-700 font-medium">Hadir</span>
                          ) : (
                            <span className="text-slate-500">Belum Hadir</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-xs tabular-nums">
                          {p.evaluated ? (
                            <span className="text-blue-700 font-medium">
                              Sudah ({p.ratingMaterial}/{p.ratingSpeaker})
                            </span>
                          ) : (
                            <span className="text-slate-400">Belum</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap font-mono tabular-nums text-xs text-slate-800">
                          {p.certificateCode || '—'}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {!p.attended && (
                              <button
                                type="button"
                                onClick={() => handleParticipantAction(p.id, 'mark_attended')}
                                className="px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
                              >
                                Tandai Hadir
                              </button>
                            )}
                            {!p.certificateCode && (
                              <button
                                type="button"
                                onClick={() => handleParticipantAction(p.id, 'issue_certificate')}
                                className="px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 rounded-md hover:bg-blue-100"
                              >
                                Terbitkan Sertifikat
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Pengaturan Portal & Penandatangan Sertifikat */}
      {subTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl space-y-5"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Identitas Lembaga &amp; Penandatangan E-Sertifikat
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Informasi ini otomatis ditampilkan pada portal peserta, pesan undangan WhatsApp, dan
              cetakan sertifikat resmi.
            </p>
          </div>

          {settingsSavedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Pengaturan portal berhasil diperbarui.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Instansi / Penyelenggara
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Webinar per Bulan
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi Singkat Portal
            </label>
            <input
              type="text"
              value={portalSubtitle}
              onChange={(e) => setPortalSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Penandatangan Sertifikat
              </label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jabatan Penandatangan
              </label>
              <input
                type="text"
                required
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                NIP Penandatangan
              </label>
              <input
                type="text"
                value={signerNip}
                onChange={(e) => setSignerNip(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nomor WhatsApp Helpdesk Panitia
            </label>
            <input
              type="text"
              value={helpdeskWa}
              onChange={(e) => setHelpdeskWa(e.target.value)}
              placeholder="6281234567890"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
          >
            {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </form>
      )}

      {/* Delete confirmation modal (avoiding window.confirm) */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Hapus Data Webinar?</h3>
            <p className="text-sm text-slate-600 mt-1.5">
              Seluruh data pendaftaran dan presensi pada webinar ini akan ikut terhapus permanen.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteWebinar(confirmDeleteId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Ya, Hapus Webinar
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <WebinarFormModal
          initialWebinar={editingWebinar}
          onClose={() => setIsModalOpen(false)}
          onSaved={(updatedWebinars) => onWebinarsUpdated(updatedWebinars)}
        />
      )}
    </section>
  );
}
