import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Webinar, WebinarStatus } from '../types/webinar';

interface WebinarFormModalProps {
  initialWebinar: Webinar | null;
  onClose: () => void;
  onSaved: (webinars: any[]) => void;
}

const IMAGE_PRESETS = [
  {
    label: 'Auditorium Studio Utama',
    url: '/src/assets/images/webinar_hero_stage_1795676415681.jpg',
  },
  {
    label: 'Tata Kelola Digital',
    url: '/src/assets/images/webinar_thumb_digital_1795676416459.jpg',
  },
  {
    label: 'Ruang Pelatihan Eksekutif',
    url: '/src/assets/images/webinar_thumb_leadership_1795676416139.jpg',
  },
  {
    label: 'Kolaborasi Layanan Publik',
    url: '/src/assets/images/webinar_thumb_service_1795676416338.jpg',
  },
];

export function WebinarFormModal({ initialWebinar, onClose, onSaved }: WebinarFormModalProps) {
  const isEditing = Boolean(initialWebinar);
  const [title, setTitle] = useState(initialWebinar?.title || '');
  const [seriesCode, setSeriesCode] = useState(initialWebinar?.seriesCode || '');
  const [category, setCategory] = useState(initialWebinar?.category || 'Pengembangan Kompetensi');
  const [date, setDate] = useState(initialWebinar?.date || '2026-11-28');
  const [startTime, setStartTime] = useState(initialWebinar?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialWebinar?.endTime || '11:30');
  const [jp, setJp] = useState(String(initialWebinar?.jp || 3));
  const [speaker, setSpeaker] = useState(initialWebinar?.speaker || '');
  const [speakerRole, setSpeakerRole] = useState(initialWebinar?.speakerRole || '');
  const [platform, setPlatform] = useState(
    initialWebinar?.platform || 'Zoom Meeting & YouTube Live'
  );
  const [meetingUrl, setMeetingUrl] = useState(initialWebinar?.meetingUrl || '');
  const [meetingPasscode, setMeetingPasscode] = useState(initialWebinar?.meetingPasscode || '');
  const [youtubeUrl, setYoutubeUrl] = useState(initialWebinar?.youtubeUrl || '');
  const [materialsUrl, setMaterialsUrl] = useState(initialWebinar?.materialsUrl || '');
  const [recordingUrl, setRecordingUrl] = useState(initialWebinar?.recordingUrl || '');
  const [attendanceToken, setAttendanceToken] = useState(
    initialWebinar?.attendanceToken || 'BANGKOM26'
  );
  const [status, setStatus] = useState<WebinarStatus>(initialWebinar?.status || 'active');
  const [description, setDescription] = useState(initialWebinar?.description || '');
  const [agendaText, setAgendaText] = useState(
    initialWebinar?.agenda?.join('\n') ||
      '09:00 — Pembukaan & Pengarahan\n09:15 — Pemaparan Materi Utama\n10:30 — Diskusi & Presensi Evaluasi'
  );
  const [imageUrl, setImageUrl] = useState(
    initialWebinar?.imageUrl || IMAGE_PRESETS[0].url
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      title,
      seriesCode,
      category,
      date,
      startTime,
      endTime,
      jp: Number(jp) || 3,
      speaker,
      speakerRole,
      platform,
      meetingUrl,
      meetingPasscode,
      youtubeUrl,
      materialsUrl,
      recordingUrl,
      attendanceToken,
      status,
      description,
      agenda: agendaText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl,
    };

    try {
      const endpoint = isEditing ? `/api/webinars/${initialWebinar?.id}` : '/api/webinars';
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan data webinar.');
        setSubmitting(false);
        return;
      }
      onSaved(data.webinars);
      onClose();
    } catch {
      setError('Terjadi kendala jaringan saat menyimpan data.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="webinar-form-title"
    >
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-xl my-8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="webinar-form-title" className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Perbarui Data Webinar' : 'Buat Jadwal Webinar Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Judul Webinar / Pelatihan *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pemanfaatan AI dalam Layanan Publik"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kode Seri
              </label>
              <input
                type="text"
                value={seriesCode}
                onChange={(e) => setSeriesCode(e.target.value)}
                placeholder="SERI #35 · NOV S3"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jam Mulai
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jam Selesai
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bobot JP
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={jp}
                onChange={(e) => setJp(e.target.value)}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status Tampilan Portal
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WebinarStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="active">Berlangsung Hari Ini (Tampil Utama)</option>
                <option value="upcoming">Akan Datang</option>
                <option value="completed">Selesai (Arsip)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kategori Topik
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Token Presensi Sesi
              </label>
              <input
                type="text"
                required
                value={attendanceToken}
                onChange={(e) => setAttendanceToken(e.target.value.toUpperCase())}
                placeholder="AI2511"
                className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Narasumber *
              </label>
              <input
                type="text"
                required
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="Dr. Hendra Wijaya, M.Kom."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jabatan / Instansi Narasumber
              </label>
              <input
                type="text"
                value={speakerRole}
                onChange={(e) => setSpeakerRole(e.target.value)}
                placeholder="Widyaiswara Ahli Utama"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tautan Zoom / Meeting Room
              </label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Passcode Meeting
              </label>
              <input
                type="text"
                value={meetingPasscode}
                onChange={(e) => setMeetingPasscode(e.target.value)}
                placeholder="BANGKOM26"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tautan Live YouTube
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/live/..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tautan Materi / Slide
              </label>
              <input
                type="url"
                value={materialsUrl}
                onChange={(e) => setMaterialsUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tautan Rekaman (Arsip)
              </label>
              <input
                type="url"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Platform &amp; Tema Visual
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <select
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.url} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ringkasan Materi
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tujuan pembelajaran singkat untuk peserta..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Susunan Acara (satu baris per sesi)
            </label>
            <textarea
              rows={3}
              value={agendaText}
              onChange={(e) => setAgendaText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Terbitkan Webinar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
