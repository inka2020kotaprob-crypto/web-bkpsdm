import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type {
  CertificateLookupItem,
  ParticipantRecord,
  PortalSettings,
  Webinar,
  WebinarStatus,
  WebinarWithStats,
} from './src/types/webinar.ts';

interface DatabaseSchema {
  settings: PortalSettings;
  webinars: Webinar[];
  participants: ParticipantRecord[];
}

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'portal-db.json');

const SEED_DATA: DatabaseSchema = {
  settings: {
    organizationName: 'Balai Pengembangan Kompetensi ASN',
    portalSubtitle: 'Portal Satu Pintu Pelatihan & Monitoring Webinar Bulanan',
    monthlyTarget: 3,
    signerName: 'Drs. Bambang Sutrisno, M.Si.',
    signerTitle: 'Kepala Unit Pengembangan Kompetensi',
    signerNip: '19720415 199803 1 004',
    helpdeskWhatsapp: '6281234567890',
  },
  webinars: [
    {
      id: 'web-2026-11-s2',
      seriesCode: 'SERI #32 · NOV S2',
      title: 'Pemanfaatan Kecerdasan Artifisial dalam Tata Kelola Layanan Publik Modern',
      category: 'Transformasi Digital',
      date: '2026-11-25',
      startTime: '09:00',
      endTime: '11:30',
      jp: 3,
      speaker: 'Dr. Hendra Wijaya, M.Kom.',
      speakerRole: 'Widyaiswara Ahli Utama · Analis Sistem Pemerintahan',
      platform: 'Zoom Meeting & YouTube Live',
      meetingUrl: 'https://zoom.us/j/92847102938',
      meetingPasscode: 'BANGKOM26',
      youtubeUrl: 'https://youtube.com/live/bangkom-ai-2026',
      materialsUrl: 'https://drive.google.com/drive/folders/materi-ai-layanan-publik',
      recordingUrl: '',
      attendanceToken: 'AI2511',
      status: 'active',
      description:
        'Pelatihan praktis penerapan kecerdasan artifisial untuk mempercepat analisis dokumen administrasi, layanan pengaduan masyarakat, dan tata kelola data instansi secara aman dan akuntabel.',
      agenda: [
        '09:00 — Pembukaan & Pengarahan Kepala Unit Bangkom',
        '09:15 — Peta Jalan Adopsi AI di Sektor Pemerintahan',
        '10:00 — Studi Kasus Otomasi Layanan & Etika Data ASN',
        '10:50 — Sesi Tanya Jawab & Pengisian Presensi Evaluasi',
      ],
      imageUrl: '/src/assets/images/webinar_hero_stage_1795676415681.jpg',
      createdAt: '2026-11-10T08:00:00.000Z',
    },
    {
      id: 'web-2026-11-s3',
      seriesCode: 'SERI #33 · NOV S3',
      title: 'Strategi Komunikasi Publik & Penanganan Krisis Informasi Instansi',
      category: 'Komunikasi Publik',
      date: '2026-11-30',
      startTime: '09:00',
      endTime: '11:30',
      jp: 3,
      speaker: 'Rina Kusumawardhani, S.Sos., M.I.Kom.',
      speakerRole: 'Pranata Humas Ahli Madya',
      platform: 'Zoom Meeting & YouTube Live',
      meetingUrl: 'https://zoom.us/j/93811204811',
      meetingPasscode: 'HUMAS30',
      youtubeUrl: 'https://youtube.com/live/bangkom-humas-2026',
      materialsUrl: 'https://drive.google.com/drive/folders/materi-komunikasi-krisis',
      recordingUrl: '',
      attendanceToken: 'HUMAS30',
      status: 'upcoming',
      description:
        'Membekali pengelola informasi dan ASN dengan kerangka respon cepat disinformasi, penyusunan rilis pers yang jernih, dan orkestrasi kanal komunikasi resmi.',
      agenda: [
        '09:00 — Registrasi Ulang & Pengantar Moderator',
        '09:15 — Anatomi Krisis Informasi & Kecepatan Respon',
        '10:15 — Simulasi Penyusunan Klarifikasi Publik',
        '11:00 — Diskusi Terbuka & Evaluasi Sesi',
      ],
      imageUrl: '/src/assets/images/webinar_thumb_service_1795676416338.jpg',
      createdAt: '2026-11-12T08:00:00.000Z',
    },
    {
      id: 'web-2026-11-s1',
      seriesCode: 'SERI #31 · NOV S1',
      title: 'Penyusunan Indikator Kinerja Individu Berbasis Outcome Organisasi',
      category: 'Manajemen Kinerja',
      date: '2026-11-04',
      startTime: '09:00',
      endTime: '11:30',
      jp: 3,
      speaker: 'Ahmad Fauzi Pratama, S.E., M.P.A.',
      speakerRole: 'Analis Kebijakan Ahli Madya',
      platform: 'Zoom Meeting & YouTube Live',
      meetingUrl: 'https://zoom.us/j/91029384712',
      meetingPasscode: 'KINERJA04',
      youtubeUrl: 'https://youtube.com/live/bangkom-kinerja-2026',
      materialsUrl: 'https://drive.google.com/drive/folders/materi-iki-outcome',
      recordingUrl: 'https://youtube.com/watch?v=rekaman-iki-nov2026',
      attendanceToken: 'IKI0411',
      status: 'completed',
      description:
        'Pendalaman teknik cascading sasaran kinerja pimpinan ke dalam rencana aksi individu yang terukur serta selaras dengan sistem akuntabilitas instansi.',
      agenda: [
        '09:00 — Pengantar Cascading Kinerja',
        '09:30 — Perumusan IKI Spesifik & Terukur',
        '10:30 — Klinik Penyelarasan SKP',
      ],
      imageUrl: '/src/assets/images/webinar_thumb_digital_1795676416459.jpg',
      createdAt: '2026-10-25T08:00:00.000Z',
    },
    {
      id: 'web-2026-12-s1',
      seriesCode: 'SERI #34 · DES S1',
      title: 'Kepemimpinan Kolaboratif Lintas Sektor dalam Percepatan Layanan Daerah',
      category: 'Kepemimpinan',
      date: '2026-12-08',
      startTime: '09:00',
      endTime: '12:00',
      jp: 4,
      speaker: 'Prof. Dr. Ratna Puspitasari, M.Si.',
      speakerRole: 'Guru Besar Administrasi Publik',
      platform: 'Zoom Meeting & YouTube Live',
      meetingUrl: 'https://zoom.us/j/94120039481',
      meetingPasscode: 'KOLAB08',
      youtubeUrl: 'https://youtube.com/live/bangkom-kolaboratif-2026',
      materialsUrl: 'https://drive.google.com/drive/folders/materi-kepemimpinan-kolaboratif',
      recordingUrl: '',
      attendanceToken: 'KOLAB08',
      status: 'upcoming',
      description:
        'Membangun ekosistem kerja lintas perangkat daerah untuk menuntaskan program prioritas tanpa sekat birokrasi dan duplikasi anggaran.',
      agenda: [
        '09:00 — Pengantar Tata Kelola Kolaboratif',
        '09:45 — Pemetaan Pemangku Kepentingan',
        '10:45 — Studi Kasus Integrasi Layanan',
      ],
      imageUrl: '/src/assets/images/webinar_thumb_leadership_1795676416139.jpg',
      createdAt: '2026-11-18T08:00:00.000Z',
    },
  ],
  participants: [
    {
      id: 'part-001',
      webinarId: 'web-2026-11-s2',
      fullName: 'Siti Nurhaliza, S.Kom.',
      nip: '199105142019032011',
      instansi: 'Dinas Komunikasi dan Informatika Provinsi',
      jabatan: 'Pranata Komputer Ahli Pertama',
      email: 'siti.nurhaliza@pemprov.go.id',
      whatsapp: '081298765432',
      registeredAt: '2026-11-23T09:12:00.000Z',
      attended: true,
      attendedAt: '2026-11-25T09:08:00.000Z',
      evaluated: true,
      evaluatedAt: '2026-11-25T11:20:00.000Z',
      ratingMaterial: 5,
      ratingSpeaker: 5,
      feedback: 'Materi sangat aplikatif dan alur presensinya jauh lebih praktis dibanding tautan terpisah.',
      certificateCode: 'BANGKOM/2026/11/0001',
      certificateIssuedAt: '2026-11-25T11:20:00.000Z',
    },
    {
      id: 'part-002',
      webinarId: 'web-2026-11-s2',
      fullName: 'Budi Santoso, S.Sos.',
      nip: '198708212015021003',
      instansi: 'Badan Kepegawaian Daerah',
      jabatan: 'Analis SDM Aparatur Ahli Muda',
      email: 'budi.santoso@bkd.go.id',
      whatsapp: '081345678901',
      registeredAt: '2026-11-24T10:30:00.000Z',
      attended: true,
      attendedAt: '2026-11-25T09:14:00.000Z',
      evaluated: false,
      evaluatedAt: null,
      ratingMaterial: null,
      ratingSpeaker: null,
      feedback: '',
      certificateCode: null,
      certificateIssuedAt: null,
    },
    {
      id: 'part-003',
      webinarId: 'web-2026-11-s2',
      fullName: 'Dewi Anggraini, S.E.',
      nip: '199302102020122007',
      instansi: 'Inspektorat Daerah',
      jabatan: 'Auditor Ahli Pertama',
      email: 'dewi.anggraini@inspektorat.go.id',
      whatsapp: '085678901234',
      registeredAt: '2026-11-24T14:45:00.000Z',
      attended: false,
      attendedAt: null,
      evaluated: false,
      evaluatedAt: null,
      ratingMaterial: null,
      ratingSpeaker: null,
      feedback: '',
      certificateCode: null,
      certificateIssuedAt: null,
    },
    {
      id: 'part-004',
      webinarId: 'web-2026-11-s1',
      fullName: 'Siti Nurhaliza, S.Kom.',
      nip: '199105142019032011',
      instansi: 'Dinas Komunikasi dan Informatika Provinsi',
      jabatan: 'Pranata Komputer Ahli Pertama',
      email: 'siti.nurhaliza@pemprov.go.id',
      whatsapp: '081298765432',
      registeredAt: '2026-11-02T08:15:00.000Z',
      attended: true,
      attendedAt: '2026-11-04T09:05:00.000Z',
      evaluated: true,
      evaluatedAt: '2026-11-04T11:25:00.000Z',
      ratingMaterial: 5,
      ratingSpeaker: 4,
      feedback: 'Contoh penyusunan IKI sangat jelas.',
      certificateCode: 'BANGKOM/2026/11/0002',
      certificateIssuedAt: '2026-11-04T11:25:00.000Z',
    },
    {
      id: 'part-005',
      webinarId: 'web-2026-11-s1',
      fullName: 'Rahmat Hidayat, S.T., M.T.',
      nip: '198411032011011002',
      instansi: 'Dinas Pekerjaan Umum dan Penataan Ruang',
      jabatan: 'Kepala Seksi Perencanaan Teknis',
      email: 'rahmat.hidayat@pupr.go.id',
      whatsapp: '081122334455',
      registeredAt: '2026-11-03T11:00:00.000Z',
      attended: true,
      attendedAt: '2026-11-04T09:10:00.000Z',
      evaluated: true,
      evaluatedAt: '2026-11-04T11:32:00.000Z',
      ratingMaterial: 5,
      ratingSpeaker: 5,
      feedback: 'Sertifikat langsung terbit tanpa menunggu lama.',
      certificateCode: 'BANGKOM/2026/11/0003',
      certificateIssuedAt: '2026-11-04T11:32:00.000Z',
    },
    {
      id: 'part-006',
      webinarId: 'web-2026-11-s3',
      fullName: 'Nadia Kartika, S.I.Kom.',
      nip: '199506182022032009',
      instansi: 'Sekretariat Daerah Bagian Protokol',
      jabatan: 'Pranata Humas Ahli Pertama',
      email: 'nadia.kartika@setda.go.id',
      whatsapp: '082134567890',
      registeredAt: '2026-11-22T15:20:00.000Z',
      attended: false,
      attendedAt: null,
      evaluated: false,
      evaluatedAt: null,
      ratingMaterial: null,
      ratingSpeaker: null,
      feedback: '',
      certificateCode: null,
      certificateIssuedAt: null,
    },
  ],
};

function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_DATA, null, 2), 'utf8');
    return structuredClone(SEED_DATA);
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.webinars || !parsed.participants || !parsed.settings) {
      throw new Error('Malformed database file');
    }
    return parsed;
  } catch {
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_DATA, null, 2), 'utf8');
    return structuredClone(SEED_DATA);
  }
}

function saveDb(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

function cleanStr(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function buildStatsMap(participants: ParticipantRecord[]): Map<string, WebinarWithStats['stats']> {
  const map = new Map<string, WebinarWithStats['stats']>();
  for (const p of participants) {
    const current = map.get(p.webinarId) || {
      registeredCount: 0,
      attendedCount: 0,
      evaluatedCount: 0,
      certifiedCount: 0,
    };
    current.registeredCount += 1;
    if (p.attended) current.attendedCount += 1;
    if (p.evaluated) current.evaluatedCount += 1;
    if (p.certificateCode) current.certifiedCount += 1;
    map.set(p.webinarId, current);
  }
  return map;
}

function enrichWebinars(db: DatabaseSchema): WebinarWithStats[] {
  const statsMap = buildStatsMap(db.participants);
  const statusRank: Record<WebinarStatus, number> = {
    active: 0,
    upcoming: 1,
    completed: 2,
  };
  return [...db.webinars]
    .sort((a, b) => {
      const rankDiff = statusRank[a.status] - statusRank[b.status];
      if (rankDiff !== 0) return rankDiff;
      return b.date.localeCompare(a.date);
    })
    .map((w) => ({
      ...w,
      stats: statsMap.get(w.id) || {
        registeredCount: 0,
        attendedCount: 0,
        evaluatedCount: 0,
        certifiedCount: 0,
      },
    }));
}

function generateCertificateCode(db: DatabaseSchema, webinarDate: string): string {
  const year = webinarDate.slice(0, 4) || String(new Date().getFullYear());
  const month = webinarDate.slice(5, 7) || String(new Date().getMonth() + 1).padStart(2, '0');
  const existingCount = db.participants.filter((p) => Boolean(p.certificateCode)).length;
  const seq = String(existingCount + 1).padStart(4, '0');
  return `BANGKOM/${year}/${month}/${seq}`;
}

function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const d = dateStr.replace(/-/g, '');
  const t = `${timeStr.replace(/:/g, '')}00`;
  return `${d}T${t}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/portal', (_req, res) => {
    const db = ensureDb();
    res.json({
      webinars: enrichWebinars(db),
      settings: db.settings,
    });
  });

  app.post('/api/webinars', (req, res) => {
    const db = ensureDb();
    const title = cleanStr(req.body?.title, 200);
    const date = cleanStr(req.body?.date, 20);
    const speaker = cleanStr(req.body?.speaker, 120);

    if (!title || !date || !speaker) {
      res.status(400).json({ error: 'Judul webinar, tanggal, dan narasumber wajib diisi.' });
      return;
    }

    const statusInput = cleanStr(req.body?.status, 20);
    const status: WebinarStatus =
      statusInput === 'active' || statusInput === 'completed' ? statusInput : 'upcoming';

    if (status === 'active') {
      db.webinars = db.webinars.map((w) =>
        w.status === 'active' ? { ...w, status: 'upcoming' } : w
      );
    }

    const rawAgenda = Array.isArray(req.body?.agenda)
      ? req.body.agenda.map((item: unknown) => cleanStr(item, 180)).filter(Boolean)
      : [];

    const newWebinar: Webinar = {
      id: `web-${Date.now()}`,
      seriesCode: cleanStr(req.body?.seriesCode, 40) || `SERI #${db.webinars.length + 31}`,
      title,
      category: cleanStr(req.body?.category, 60) || 'Pengembangan Kompetensi',
      date,
      startTime: cleanStr(req.body?.startTime, 10) || '09:00',
      endTime: cleanStr(req.body?.endTime, 10) || '11:30',
      jp: Math.min(24, Math.max(1, Number(req.body?.jp) || 3)),
      speaker,
      speakerRole: cleanStr(req.body?.speakerRole, 120) || 'Narasumber Pelatihan',
      platform: cleanStr(req.body?.platform, 80) || 'Zoom Meeting & YouTube Live',
      meetingUrl: cleanStr(req.body?.meetingUrl, 300),
      meetingPasscode: cleanStr(req.body?.meetingPasscode, 40),
      youtubeUrl: cleanStr(req.body?.youtubeUrl, 300),
      materialsUrl: cleanStr(req.body?.materialsUrl, 300),
      recordingUrl: cleanStr(req.body?.recordingUrl, 300),
      attendanceToken: (cleanStr(req.body?.attendanceToken, 20) || 'SESI26').toUpperCase(),
      status,
      description: cleanStr(req.body?.description, 800) || 'Pelatihan pengembangan kompetensi daring.',
      agenda:
        rawAgenda.length > 0
          ? rawAgenda
          : ['09:00 — Pembukaan Sesi', '09:15 — Pemaparan Materi Utama', '10:30 — Diskusi & Presensi'],
      imageUrl:
        cleanStr(req.body?.imageUrl, 300) ||
        '/src/assets/images/webinar_thumb_digital_1795676416459.jpg',
      createdAt: new Date().toISOString(),
    };

    db.webinars.unshift(newWebinar);
    saveDb(db);
    res.status(201).json({ webinar: newWebinar, webinars: enrichWebinars(db) });
  });

  app.patch('/api/webinars/:id', (req, res) => {
    const db = ensureDb();
    const { id } = req.params;
    const index = db.webinars.findIndex((w) => w.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Data webinar tidak ditemukan.' });
      return;
    }

    const existing = db.webinars[index];
    const nextStatus = cleanStr(req.body?.status, 20) as WebinarStatus;
    const validStatus: WebinarStatus =
      nextStatus === 'active' || nextStatus === 'upcoming' || nextStatus === 'completed'
        ? nextStatus
        : existing.status;

    if (validStatus === 'active') {
      db.webinars = db.webinars.map((w) =>
        w.id !== id && w.status === 'active' ? { ...w, status: 'upcoming' } : w
      );
    }

    const updated: Webinar = {
      ...existing,
      seriesCode: cleanStr(req.body?.seriesCode, 40) || existing.seriesCode,
      title: cleanStr(req.body?.title, 200) || existing.title,
      category: cleanStr(req.body?.category, 60) || existing.category,
      date: cleanStr(req.body?.date, 20) || existing.date,
      startTime: cleanStr(req.body?.startTime, 10) || existing.startTime,
      endTime: cleanStr(req.body?.endTime, 10) || existing.endTime,
      jp: req.body?.jp !== undefined ? Math.min(24, Math.max(1, Number(req.body.jp) || 3)) : existing.jp,
      speaker: cleanStr(req.body?.speaker, 120) || existing.speaker,
      speakerRole: cleanStr(req.body?.speakerRole, 120) || existing.speakerRole,
      platform: cleanStr(req.body?.platform, 80) || existing.platform,
      meetingUrl: req.body?.meetingUrl !== undefined ? cleanStr(req.body.meetingUrl, 300) : existing.meetingUrl,
      meetingPasscode:
        req.body?.meetingPasscode !== undefined
          ? cleanStr(req.body.meetingPasscode, 40)
          : existing.meetingPasscode,
      youtubeUrl: req.body?.youtubeUrl !== undefined ? cleanStr(req.body.youtubeUrl, 300) : existing.youtubeUrl,
      materialsUrl:
        req.body?.materialsUrl !== undefined ? cleanStr(req.body.materialsUrl, 300) : existing.materialsUrl,
      recordingUrl:
        req.body?.recordingUrl !== undefined ? cleanStr(req.body.recordingUrl, 300) : existing.recordingUrl,
      attendanceToken:
        req.body?.attendanceToken !== undefined
          ? cleanStr(req.body.attendanceToken, 20).toUpperCase() || existing.attendanceToken
          : existing.attendanceToken,
      status: validStatus,
      description:
        req.body?.description !== undefined ? cleanStr(req.body.description, 800) : existing.description,
      imageUrl: cleanStr(req.body?.imageUrl, 300) || existing.imageUrl,
    };

    db.webinars[index] = updated;
    saveDb(db);
    res.json({ webinar: updated, webinars: enrichWebinars(db) });
  });

  app.delete('/api/webinars/:id', (req, res) => {
    const db = ensureDb();
    const { id } = req.params;
    const exists = db.webinars.some((w) => w.id === id);
    if (!exists) {
      res.status(404).json({ error: 'Webinar tidak ditemukan.' });
      return;
    }
    db.webinars = db.webinars.filter((w) => w.id !== id);
    db.participants = db.participants.filter((p) => p.webinarId !== id);
    saveDb(db);
    res.json({ ok: true, webinars: enrichWebinars(db) });
  });

  app.post('/api/registrations', (req, res) => {
    const db = ensureDb();
    const webinarId = cleanStr(req.body?.webinarId, 60);
    const fullName = cleanStr(req.body?.fullName, 120);
    const nip = cleanStr(req.body?.nip, 40);
    const instansi = cleanStr(req.body?.instansi, 160);
    const jabatan = cleanStr(req.body?.jabatan, 120);
    const email = cleanStr(req.body?.email, 120).toLowerCase();
    const whatsapp = cleanStr(req.body?.whatsapp, 30);

    const webinar = db.webinars.find((w) => w.id === webinarId);
    if (!webinar) {
      res.status(404).json({ error: 'Webinar tidak ditemukan.' });
      return;
    }
    if (!fullName || !instansi || (!nip && !email)) {
      res.status(400).json({ error: 'Nama lengkap, instansi, serta NIP atau email wajib diisi.' });
      return;
    }

    const existing = db.participants.find(
      (p) =>
        p.webinarId === webinarId &&
        ((nip && p.nip.toLowerCase() === nip.toLowerCase()) ||
          (email && p.email.toLowerCase() === email))
    );

    if (existing) {
      res.json({
        alreadyRegistered: true,
        message: 'Data Anda sudah terdaftar pada webinar ini.',
        participant: existing,
      });
      return;
    }

    const record: ParticipantRecord = {
      id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      webinarId,
      fullName,
      nip: nip || '-',
      instansi,
      jabatan: jabatan || 'Peserta Pelatihan',
      email,
      whatsapp,
      registeredAt: new Date().toISOString(),
      attended: false,
      attendedAt: null,
      evaluated: false,
      evaluatedAt: null,
      ratingMaterial: null,
      ratingSpeaker: null,
      feedback: '',
      certificateCode: null,
      certificateIssuedAt: null,
    };

    db.participants.unshift(record);
    saveDb(db);
    res.status(201).json({
      alreadyRegistered: false,
      message: 'Pendaftaran berhasil dicatat.',
      participant: record,
    });
  });

  app.post('/api/attendance', (req, res) => {
    const db = ensureDb();
    const webinarId = cleanStr(req.body?.webinarId, 60);
    const identifier = cleanStr(req.body?.identifier, 120).toLowerCase();
    const token = cleanStr(req.body?.token, 40).toUpperCase();
    const fullName = cleanStr(req.body?.fullName, 120);
    const instansi = cleanStr(req.body?.instansi, 160);
    const jabatan = cleanStr(req.body?.jabatan, 120);

    const webinar = db.webinars.find((w) => w.id === webinarId);
    if (!webinar) {
      res.status(404).json({ error: 'Webinar tidak ditemukan.' });
      return;
    }
    if (!identifier || !token) {
      res.status(400).json({ error: 'NIP/Email dan Kode Token Presensi wajib diisi.' });
      return;
    }
    if (token !== webinar.attendanceToken.toUpperCase()) {
      res.status(403).json({
        error: 'Kode Token Presensi tidak sesuai. Silakan periksa kode yang dibagikan panitia saat sesi berlangsung.',
      });
      return;
    }

    let participant = db.participants.find(
      (p) =>
        p.webinarId === webinarId &&
        (p.nip.toLowerCase() === identifier || p.email.toLowerCase() === identifier)
    );

    if (!participant) {
      if (!fullName || !instansi) {
        res.status(404).json({
          needsWalkInDetails: true,
          error:
            'NIP/Email belum terdaftar sebelumnya. Lengkapi Nama Lengkap dan Instansi untuk presensi langsung.',
        });
        return;
      }

      const isEmail = identifier.includes('@');
      participant = {
        id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        webinarId,
        fullName,
        nip: isEmail ? '-' : identifier.toUpperCase(),
        instansi,
        jabatan: jabatan || 'Peserta Pelatihan',
        email: isEmail ? identifier : '',
        whatsapp: '',
        registeredAt: new Date().toISOString(),
        attended: true,
        attendedAt: new Date().toISOString(),
        evaluated: false,
        evaluatedAt: null,
        ratingMaterial: null,
        ratingSpeaker: null,
        feedback: '',
        certificateCode: null,
        certificateIssuedAt: null,
      };
      db.participants.unshift(participant);
    } else {
      participant.attended = true;
      participant.attendedAt = participant.attendedAt || new Date().toISOString();
      if (fullName) participant.fullName = fullName;
      if (instansi) participant.instansi = instansi;
    }

    saveDb(db);
    res.json({
      ok: true,
      message: `Presensi berhasil dicatat atas nama ${participant.fullName}. Silakan lanjutkan pengisian evaluasi untuk menerbitkan e-sertifikat.`,
      participant,
    });
  });

  app.post('/api/evaluation', (req, res) => {
    const db = ensureDb();
    const webinarId = cleanStr(req.body?.webinarId, 60);
    const identifier = cleanStr(req.body?.identifier, 120).toLowerCase();
    const ratingMaterial = Math.min(5, Math.max(1, Number(req.body?.ratingMaterial) || 5));
    const ratingSpeaker = Math.min(5, Math.max(1, Number(req.body?.ratingSpeaker) || 5));
    const feedback = cleanStr(req.body?.feedback, 600);

    const webinar = db.webinars.find((w) => w.id === webinarId);
    if (!webinar) {
      res.status(404).json({ error: 'Webinar tidak ditemukan.' });
      return;
    }
    if (!identifier) {
      res.status(400).json({ error: 'Masukkan NIP atau Email yang digunakan saat presensi.' });
      return;
    }

    const participant = db.participants.find(
      (p) =>
        p.webinarId === webinarId &&
        (p.nip.toLowerCase() === identifier || p.email.toLowerCase() === identifier)
    );

    if (!participant) {
      res.status(404).json({
        error: 'Data peserta tidak ditemukan. Pastikan Anda sudah mengisi Presensi Sesi terlebih dahulu.',
      });
      return;
    }

    if (!participant.attended) {
      res.status(400).json({
        error: 'Anda tercatat belum mengisi presensi sesi. Silakan isi Presensi Sesi dengan token terlebih dahulu.',
      });
      return;
    }

    participant.evaluated = true;
    participant.evaluatedAt = participant.evaluatedAt || new Date().toISOString();
    participant.ratingMaterial = ratingMaterial;
    participant.ratingSpeaker = ratingSpeaker;
    participant.feedback = feedback;
    if (!participant.certificateCode) {
      participant.certificateCode = generateCertificateCode(db, webinar.date);
      participant.certificateIssuedAt = new Date().toISOString();
    }

    saveDb(db);
    res.json({
      ok: true,
      message: 'Evaluasi tersimpan. E-Sertifikat Anda telah terbit dan siap diunduh.',
      certificateCode: participant.certificateCode,
      participant,
    });
  });

  app.get('/api/certificates/lookup', (req, res) => {
    const db = ensureDb();
    const query = cleanStr(req.query.query, 120).toLowerCase();
    if (query.length < 3) {
      res.status(400).json({ error: 'Masukkan minimal 3 karakter NIP, Email, atau Nomor Sertifikat.' });
      return;
    }

    const matches = db.participants.filter(
      (p) =>
        Boolean(p.certificateCode) &&
        (p.nip.toLowerCase() === query ||
          p.email.toLowerCase() === query ||
          (p.certificateCode || '').toLowerCase() === query ||
          p.fullName.toLowerCase().includes(query))
    );

    const results: CertificateLookupItem[] = [];
    for (const p of matches) {
      const webinar = db.webinars.find((w) => w.id === p.webinarId);
      if (!webinar || !p.certificateCode) continue;
      results.push({
        participantId: p.id,
        fullName: p.fullName,
        nip: p.nip,
        instansi: p.instansi,
        jabatan: p.jabatan,
        certificateCode: p.certificateCode,
        certificateIssuedAt: p.certificateIssuedAt || p.evaluatedAt || p.registeredAt,
        webinar: {
          id: webinar.id,
          seriesCode: webinar.seriesCode,
          title: webinar.title,
          date: webinar.date,
          jp: webinar.jp,
          speaker: webinar.speaker,
          speakerRole: webinar.speakerRole,
          category: webinar.category,
        },
        signer: {
          organizationName: db.settings.organizationName,
          signerName: db.settings.signerName,
          signerTitle: db.settings.signerTitle,
          signerNip: db.settings.signerNip,
        },
      });
    }

    res.json({ results });
  });

  app.get('/api/monitor/participants', (req, res) => {
    const db = ensureDb();
    const webinarId = cleanStr(req.query.webinarId, 60);
    const rows = webinarId
      ? db.participants.filter((p) => p.webinarId === webinarId)
      : db.participants;

    const evaluatedRows = rows.filter((p) => p.evaluated && p.ratingMaterial && p.ratingSpeaker);
    const avgMaterial =
      evaluatedRows.length > 0
        ? Number(
            (
              evaluatedRows.reduce((acc, p) => acc + (p.ratingMaterial || 0), 0) /
              evaluatedRows.length
            ).toFixed(2)
          )
        : 0;
    const avgSpeaker =
      evaluatedRows.length > 0
        ? Number(
            (
              evaluatedRows.reduce((acc, p) => acc + (p.ratingSpeaker || 0), 0) /
              evaluatedRows.length
            ).toFixed(2)
          )
        : 0;

    res.json({
      participants: rows,
      summary: {
        total: rows.length,
        attended: rows.filter((p) => p.attended).length,
        evaluated: rows.filter((p) => p.evaluated).length,
        certified: rows.filter((p) => Boolean(p.certificateCode)).length,
        avgMaterial,
        avgSpeaker,
      },
    });
  });

  app.patch('/api/monitor/participants/:id', (req, res) => {
    const db = ensureDb();
    const { id } = req.params;
    const participant = db.participants.find((p) => p.id === id);
    if (!participant) {
      res.status(404).json({ error: 'Data peserta tidak ditemukan.' });
      return;
    }

    const webinar = db.webinars.find((w) => w.id === participant.webinarId);
    const action = cleanStr(req.body?.action, 40);

    if (action === 'mark_attended') {
      participant.attended = true;
      participant.attendedAt = participant.attendedAt || new Date().toISOString();
    } else if (action === 'issue_certificate') {
      participant.attended = true;
      participant.attendedAt = participant.attendedAt || new Date().toISOString();
      participant.evaluated = true;
      participant.evaluatedAt = participant.evaluatedAt || new Date().toISOString();
      if (!participant.certificateCode) {
        participant.certificateCode = generateCertificateCode(db, webinar?.date || '2026-11-25');
        participant.certificateIssuedAt = new Date().toISOString();
      }
    } else if (action === 'revoke_certificate') {
      participant.certificateCode = null;
      participant.certificateIssuedAt = null;
    }

    saveDb(db);
    res.json({ ok: true, participant });
  });

  app.get('/api/monitor/export/:webinarId', (req, res) => {
    const db = ensureDb();
    const { webinarId } = req.params;
    const webinar = db.webinars.find((w) => w.id === webinarId);
    const rows =
      webinarId === 'all'
        ? db.participants
        : db.participants.filter((p) => p.webinarId === webinarId);

    const header = [
      'No',
      'Seri Webinar',
      'Nama Lengkap',
      'NIP',
      'Instansi',
      'Jabatan',
      'Email',
      'WhatsApp',
      'Status Presensi',
      'Status Evaluasi',
      'Nomor Sertifikat',
    ];

    const webinarMap = new Map(db.webinars.map((w) => [w.id, w.title]));

    const lines = rows.map((p, idx) =>
      [
        String(idx + 1),
        webinarMap.get(p.webinarId) || p.webinarId,
        p.fullName,
        p.nip,
        p.instansi,
        p.jabatan,
        p.email,
        p.whatsapp,
        p.attended ? 'Hadir' : 'Belum Hadir',
        p.evaluated ? 'Sudah Evaluasi' : 'Belum',
        p.certificateCode || '-',
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    const csvContent = '\uFEFF' + [header.map(escapeCsvCell).join(','), ...lines].join('\r\n');
    const slug = (webinar?.seriesCode || 'semua-webinar').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="data-webinar-${slug}.csv"`);
    res.send(csvContent);
  });

  app.get('/api/webinars/:id/calendar.ics', (req, res) => {
    const db = ensureDb();
    const webinar = db.webinars.find((w) => w.id === req.params.id);
    if (!webinar) {
      res.status(404).send('Webinar tidak ditemukan');
      return;
    }

    const dtStart = formatIcsDateTime(webinar.date, webinar.startTime);
    const dtEnd = formatIcsDateTime(webinar.date, webinar.endTime);
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RuangBangkom//Portal Webinar//ID',
      'BEGIN:VEVENT',
      `UID:${webinar.id}@ruangbangkom.id`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;TZID=Asia/Jakarta:${dtStart}`,
      `DTEND;TZID=Asia/Jakarta:${dtEnd}`,
      `SUMMARY:${webinar.title}`,
      `DESCRIPTION:Narasumber: ${webinar.speaker}. Platform: ${webinar.platform}. Link: ${webinar.meetingUrl}`,
      `LOCATION:${webinar.platform}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="jadwal-${webinar.id}.ics"`);
    res.send(ics);
  });

  app.patch('/api/settings', (req, res) => {
    const db = ensureDb();
    db.settings = {
      organizationName: cleanStr(req.body?.organizationName, 140) || db.settings.organizationName,
      portalSubtitle: cleanStr(req.body?.portalSubtitle, 200) || db.settings.portalSubtitle,
      monthlyTarget:
        req.body?.monthlyTarget !== undefined
          ? Math.min(20, Math.max(1, Number(req.body.monthlyTarget) || 3))
          : db.settings.monthlyTarget,
      signerName: cleanStr(req.body?.signerName, 120) || db.settings.signerName,
      signerTitle: cleanStr(req.body?.signerTitle, 140) || db.settings.signerTitle,
      signerNip: cleanStr(req.body?.signerNip, 60) || db.settings.signerNip,
      helpdeskWhatsapp: cleanStr(req.body?.helpdeskWhatsapp, 30) || db.settings.helpdeskWhatsapp,
    };
    saveDb(db);
    res.json({ ok: true, settings: db.settings });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RuangBangkom server listening on http://localhost:${PORT}`);
  });
}

startServer();
