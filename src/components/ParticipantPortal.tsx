import { useState, type FormEvent } from 'react';
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  PlayCircle,
  Share2,
  Video,
} from 'lucide-react';
import type { PortalSettings, WebinarWithStats } from '../types/webinar';
import {
  buildWhatsappInviteText,
  formatIndonesianDate,
  getStatusLabel,
  getStatusTextClass,
  safeExternalUrl,
} from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface ParticipantPortalProps {
  webinars: WebinarWithStats[];
  settings: PortalSettings;
  selectedWebinarId: string;
  onSelectWebinar: (id: string) => void;
  onRefreshData: () => Promise<void>;
  onOpenCertificateWithQuery: (query: string) => void;
  activeStep: 'room' | 'register' | 'attendance' | 'evaluation';
  onChangeStep: (step: 'room' | 'register' | 'attendance' | 'evaluation') => void;
}

export function ParticipantPortal({
  webinars,
  settings,
  selectedWebinarId,
  onSelectWebinar,
  onRefreshData,
  onOpenCertificateWithQuery,
  activeStep,
  onChangeStep,
}: ParticipantPortalProps) {
  const featuredWebinar =
    webinars.find((w) => w.id === selectedWebinarId) ||
    webinars.find((w) => w.status === 'active') ||
    webinars[0];

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Shared participant identity across steps
  const [participantIdentifier, setParticipantIdentifier] = useState('');

  // Step 2: Registration state
  const [regName, setRegName] = useState('');
  const [regNip, setRegNip] = useState('');
  const [regInstansi, setRegInstansi] = useState('');
  const [regJabatan, setRegJabatan] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regBusy, setRegBusy] = useState(false);
  const [regFeedback, setRegFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Step 3: Attendance state
  const [attToken, setAttToken] = useState('');
  const [needsWalkIn, setNeedsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInInstansi, setWalkInInstansi] = useState('');
  const [attBusy, setAttBusy] = useState(false);
  const [attFeedback, setAttFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Step 4: Evaluation state
  const [ratingMaterial, setRatingMaterial] = useState(5);
  const [ratingSpeaker, setRatingSpeaker] = useState(5);
  const [evalNotes, setEvalNotes] = useState('');
  const [evalBusy, setEvalBusy] = useState(false);
  const [evalFeedback, setEvalFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
    certificateCode?: string;
  } | null>(null);

  if (!featuredWebinar) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Belum Ada Jadwal Webinar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Panitia belum menerbitkan jadwal webinar. Buka tab Monitor untuk menambahkan sesi pertama.
        </p>
      </section>
    );
  }

  const currentMonthKey = featuredWebinar.date.slice(0, 7);
  const monthlyWebinars = webinars
    .filter((w) => w.date.startsWith(currentMonthKey))
    .sort((a, b) => a.date.localeCompare(b.date));

  const meetingHref = safeExternalUrl(featuredWebinar.meetingUrl);
  const youtubeHref = safeExternalUrl(featuredWebinar.youtubeUrl);
  const materialsHref = safeExternalUrl(featuredWebinar.materialsUrl);
  const recordingHref = safeExternalUrl(featuredWebinar.recordingUrl);

  async function handleCopy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }

  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setRegFeedback(null);
    setRegBusy(true);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: featuredWebinar.id,
          fullName: regName,
          nip: regNip,
          instansi: regInstansi,
          jabatan: regJabatan,
          email: regEmail,
          whatsapp: regWhatsapp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegFeedback({ type: 'err', text: data.error || 'Gagal mendaftar.' });
      } else {
        const idUsed = regNip.trim() || regEmail.trim();
        if (idUsed) setParticipantIdentifier(idUsed);
        setRegFeedback({
          type: 'ok',
          text: data.alreadyRegistered
            ? 'Anda sudah terdaftar pada webinar ini. Silakan lanjut ke langkah Presensi saat acara berlangsung.'
            : 'Pendaftaran berhasil dicatat. Simpan jadwal dan siapkan diri mengikuti sesi.',
        });
        await onRefreshData();
      }
    } catch {
      setRegFeedback({ type: 'err', text: 'Kendala jaringan saat mengirim pendaftaran.' });
    } finally {
      setRegBusy(false);
    }
  }

  async function handleAttendanceSubmit(e: FormEvent) {
    e.preventDefault();
    setAttFeedback(null);
    setAttBusy(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: featuredWebinar.id,
          identifier: participantIdentifier,
          token: attToken,
          fullName: walkInName || regName,
          instansi: walkInInstansi || regInstansi,
          jabatan: regJabatan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsWalkInDetails) {
          setNeedsWalkIn(true);
        }
        setAttFeedback({ type: 'err', text: data.error || 'Presensi gagal diverifikasi.' });
      } else {
        setNeedsWalkIn(false);
        setAttFeedback({ type: 'ok', text: data.message });
        await onRefreshData();
      }
    } catch {
      setAttFeedback({ type: 'err', text: 'Kendala jaringan saat mencatat presensi.' });
    } finally {
      setAttBusy(false);
    }
  }

  async function handleEvaluationSubmit(e: FormEvent) {
    e.preventDefault();
    setEvalFeedback(null);
    setEvalBusy(true);
    try {
      const res = await fetch('/api/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: featuredWebinar.id,
          identifier: participantIdentifier,
          ratingMaterial,
          ratingSpeaker,
          feedback: evalNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEvalFeedback({ type: 'err', text: data.error || 'Evaluasi gagal dikirim.' });
      } else {
        setEvalFeedback({
          type: 'ok',
          text: data.message,
          certificateCode: data.certificateCode,
        });
        await onRefreshData();
      }
    } catch {
      setEvalFeedback({ type: 'err', text: 'Kendala jaringan saat mengirim evaluasi.' });
    } finally {
      setEvalBusy(false);
    }
  }

  const portalShareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const whatsappInvite = buildWhatsappInviteText(
    featuredWebinar,
    portalShareUrl,
    settings.organizationName
  );

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Split Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between py-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3">
                <span className={getStatusTextClass(featuredWebinar.status)}>
                  {getStatusLabel(featuredWebinar.status)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{featuredWebinar.seriesCode}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatIndonesianDate(featuredWebinar.date)}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-medium text-slate-800">
                  {featuredWebinar.jp} JP
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-[1.15] [text-wrap:balance]">
                {featuredWebinar.title}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                {featuredWebinar.description}
              </p>

              <div className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-slate-500">Narasumber</span>
                  <span className="font-semibold text-slate-900">{featuredWebinar.speaker}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {featuredWebinar.speakerRole}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Waktu &amp; Penyelenggara</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {featuredWebinar.startTime} – {featuredWebinar.endTime} WIB
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {settings.organizationName}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Participant Actions */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {meetingHref ? (
                <a
                  href={meetingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <Video className="w-4 h-4" aria-hidden="true" />
                  Gabung Ruang Zoom
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onChangeStep('register')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Daftar Sesi Ini
                </button>
              )}

              {youtubeHref && (
                <a
                  href={youtubeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <PlayCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
                  Live YouTube
                </a>
              )}

              <a
                href={`/api/webinars/${featuredWebinar.id}/calendar.ics`}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <CalendarPlus className="w-4 h-4 text-slate-500" aria-hidden="true" />
                Simpan Kalender
              </a>

              <button
                type="button"
                onClick={() => handleCopy('wa-share', whatsappInvite)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                {copiedId === 'wa-share' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    Teks Undangan Disalin
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    Salin Info WA
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <ResilientImage
                src={featuredWebinar.imageUrl}
                alt={featuredWebinar.title}
                fallbackTitle={featuredWebinar.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-5 text-white">
                <div className="flex items-center justify-between gap-4 text-xs text-slate-200">
                  <span>{featuredWebinar.category}</span>
                  <span className="font-mono tabular-nums">
                    {featuredWebinar.stats.registeredCount} Terdaftar ·{' '}
                    {featuredWebinar.stats.attendedCount} Hadir
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-white">
                  {featuredWebinar.platform}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 4-Step Participant Hub (Replaces fragmented s.id links) */}
      <section
        id="alur-peserta"
        className="max-w-6xl mx-auto px-4 sm:px-6"
        aria-label="Alur Mengikuti Pelatihan"
      >
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Alur Mengikuti Webinar Hari Ini
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Semua tautan room, pendaftaran, presensi, materi, dan e-sertifikat dalam satu halaman.
              </p>
            </div>
            <div
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
              role="tablist"
            >
              {[
                { key: 'room', label: '01. Room & Materi' },
                { key: 'register', label: '02. Daftar' },
                { key: 'attendance', label: '03. Presensi' },
                { key: 'evaluation', label: '04. Evaluasi & Sertifikat' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeStep === tab.key}
                  onClick={() =>
                    onChangeStep(tab.key as 'room' | 'register' | 'attendance' | 'evaluation')
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeStep === tab.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeStep === 'room' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Tautan Ruang Pelatihan &amp; Bahan Tayang
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Gunakan ruang Zoom untuk interaksi langsung dengan narasumber, atau YouTube Live
                      jika kapasitas ruang utama penuh.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-slate-900">
                          Zoom Meeting Room
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                          Passcode: {featuredWebinar.meetingPasscode || 'Tanpa Passcode'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {featuredWebinar.meetingPasscode && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy('passcode', featuredWebinar.meetingPasscode)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                          >
                            {copiedId === 'passcode' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                Tersalin
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Salin Passcode
                              </>
                            )}
                          </button>
                        )}
                        {meetingHref && (
                          <a
                            href={meetingHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                          >
                            Buka Zoom
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-slate-900">
                          Siaran Langsung YouTube
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tersedia untuk peserta yang menyimak melalui kanal streaming resmi.
                        </p>
                      </div>
                      {youtubeHref ? (
                        <a
                          href={youtubeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 shrink-0"
                        >
                          Tonton Streaming
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Belum tersedia</span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-slate-900">
                          Materi &amp; Bahan Tayang Narasumber
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Slide presentasi, modul ringkas, dan panduan praktik.
                        </p>
                      </div>
                      {materialsHref ? (
                        <a
                          href={materialsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Unduh Materi
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Menunggu unggahan panitia</span>
                      )}
                    </div>

                    {recordingHref && (
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-sm font-semibold text-slate-900">
                            Rekaman Ulang Sesi
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Tersedia bagi peserta yang ingin meninjau ulang pembahasan.
                          </p>
                        </div>
                        <a
                          href={recordingHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 shrink-0"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Putar Rekaman
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Susunan Acara</h3>
                    <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                      {featuredWebinar.agenda.map((item, idx) => (
                        <li
                          key={idx}
                          className="pb-2.5 border-b border-slate-100 last:border-b-0 leading-relaxed"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-500">Sudah masuk ruang acara?</span>
                    <button
                      type="button"
                      onClick={() => onChangeStep('attendance')}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                    >
                      Lanjut Isi Presensi &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="max-w-3xl space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Pendaftaran Peserta — {featuredWebinar.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Data pendaftaran akan tercatat otomatis di daftar hadir dan digunakan untuk
                    pencetakan e-sertifikat.
                  </p>
                </div>

                {regFeedback && (
                  <div
                    className={`p-3.5 rounded-lg text-sm border ${
                      regFeedback.type === 'ok'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {regFeedback.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Lengkap &amp; Gelar *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Siti Nurhaliza, S.Kom."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      NIP / Nomor Pegawai *
                    </label>
                    <input
                      type="text"
                      required
                      value={regNip}
                      onChange={(e) => setRegNip(e.target.value)}
                      placeholder="199105142019032011"
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Instansi / Unit Kerja *
                    </label>
                    <input
                      type="text"
                      required
                      value={regInstansi}
                      onChange={(e) => setRegInstansi(e.target.value)}
                      placeholder="Dinas Komunikasi dan Informatika"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={regJabatan}
                      onChange={(e) => setRegJabatan(e.target.value)}
                      placeholder="Pranata Komputer Ahli Pertama"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Resmi *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@instansi.go.id"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor WhatsApp (untuk info materi)
                    </label>
                    <input
                      type="tel"
                      value={regWhatsapp}
                      onChange={(e) => setRegWhatsapp(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3 py-2 text-sm tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={regBusy}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
                  >
                    {regBusy ? 'Mendaftarkan...' : 'Simpan Pendaftaran'}
                  </button>
                  {regFeedback?.type === 'ok' && (
                    <button
                      type="button"
                      onClick={() => onChangeStep('attendance')}
                      className="px-4 py-2.5 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Lanjut ke Presensi Sesi &rarr;
                    </button>
                  )}
                </div>
              </form>
            )}

            {activeStep === 'attendance' && (
              <form onSubmit={handleAttendanceSubmit} className="max-w-2xl space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Presensi Kehadiran Sesi
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Masukkan NIP atau Email beserta Kode Token Presensi yang diumumkan moderator
                    saat webinar berlangsung.
                  </p>
                </div>

                {attFeedback && (
                  <div
                    className={`p-3.5 rounded-lg text-sm border ${
                      attFeedback.type === 'ok'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {attFeedback.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      NIP atau Email Peserta *
                    </label>
                    <input
                      type="text"
                      required
                      value={participantIdentifier}
                      onChange={(e) => setParticipantIdentifier(e.target.value)}
                      placeholder="199105142019032011 / email"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kode Token Presensi *
                    </label>
                    <input
                      type="text"
                      required
                      value={attToken}
                      onChange={(e) => setAttToken(e.target.value.toUpperCase())}
                      placeholder="Contoh: AI2511"
                      className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {needsWalkIn && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nama Lengkap &amp; Gelar *
                      </label>
                      <input
                        type="text"
                        required
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        placeholder="Nama untuk sertifikat"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Instansi / Unit Kerja *
                      </label>
                      <input
                        type="text"
                        required
                        value={walkInInstansi}
                        onChange={(e) => setWalkInInstansi(e.target.value)}
                        placeholder="Nama instansi"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={attBusy}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
                  >
                    {attBusy ? 'Memverifikasi...' : 'Kirim Presensi'}
                  </button>
                  {attFeedback?.type === 'ok' && (
                    <button
                      type="button"
                      onClick={() => onChangeStep('evaluation')}
                      className="px-4 py-2.5 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Lanjut Isi Evaluasi &amp; Terbitkan Sertifikat &rarr;
                    </button>
                  )}
                </div>
              </form>
            )}

            {activeStep === 'evaluation' && (
              <form onSubmit={handleEvaluationSubmit} className="max-w-2xl space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Survei Evaluasi Pelatihan &amp; Penerbitan E-Sertifikat
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Setelah mengisi evaluasi singkat ini, nomor e-sertifikat resmi Anda langsung
                    terbit otomatis tanpa menunggu unggahan manual.
                  </p>
                </div>

                {evalFeedback && (
                  <div
                    className={`p-4 rounded-lg text-sm border ${
                      evalFeedback.type === 'ok'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {evalFeedback.type === 'ok' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{evalFeedback.text}</p>
                        {evalFeedback.certificateCode && (
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="font-mono text-xs text-emerald-950">
                              Nomor: {evalFeedback.certificateCode}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onOpenCertificateWithQuery(
                                  evalFeedback.certificateCode || participantIdentifier
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Lihat &amp; Cetak E-Sertifikat
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIP atau Email (sesuai presensi) *
                  </label>
                  <input
                    type="text"
                    required
                    value={participantIdentifier}
                    onChange={(e) => setParticipantIdentifier(e.target.value)}
                    placeholder="199105142019032011 / email"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kualitas Materi Pelatihan (1–5)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setRatingMaterial(score)}
                          className={`w-10 h-10 text-sm font-semibold rounded-lg border tabular-nums transition-colors ${
                            ratingMaterial === score
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Penyampaian Narasumber (1–5)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setRatingSpeaker(score)}
                          className={`w-10 h-10 text-sm font-semibold rounded-lg border tabular-nums transition-colors ${
                            ratingSpeaker === score
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Saran &amp; Usulan Topik Webinar Berikutnya
                  </label>
                  <textarea
                    rows={3}
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    placeholder="Tuliskan masukan atau usulan tema pelatihan bulan depan..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={evalBusy}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
                >
                  {evalBusy ? 'Memproses...' : 'Kirim Evaluasi & Terbitkan Sertifikat'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Monthly Series Strip (3 Webinars / Month Cadence) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Rangkaian Webinar Bulan Ini ({monthlyWebinars.length} dari {settings.monthlyTarget} Sesi)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Pilih sesi untuk melihat detail materi, mendaftar, atau mengakses rekaman ulang.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {monthlyWebinars.map((item) => {
            const isSelected = item.id === featuredWebinar.id;
            return (
              <article
                key={item.id}
                className={`bg-white border rounded-xl overflow-hidden flex flex-col justify-between transition-colors ${
                  isSelected ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-200">
                    <ResilientImage
                      src={item.imageUrl}
                      alt={item.title}
                      fallbackTitle={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className={getStatusTextClass(item.status)}>
                        {getStatusLabel(item.status)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatIndonesianDate(item.date, true)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.jp} JP</span>
                    </div>

                    <h3 className="mt-2 text-base font-semibold text-slate-900 leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600">{item.speaker}</p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 tabular-nums">
                    {item.stats.registeredCount} peserta
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectWebinar(item.id);
                      onChangeStep('room');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? 'Sedang Ditampilkan' : 'Buka Sesi Ini'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
