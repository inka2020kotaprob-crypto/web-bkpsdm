import type { Webinar, WebinarStatus } from '../types/webinar';

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const SHORT_MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatIndonesianDate(dateStr: string, shortMonth = false): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const monthNames = shortMonth ? SHORT_MONTHS_ID : MONTHS_ID;
  return `${d} ${monthNames[m - 1] || ''} ${y}`;
}

export function formatMonthYear(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return `${MONTHS_ID[m - 1] || ''} ${y}`;
}

export function getStatusLabel(status: WebinarStatus): string {
  switch (status) {
    case 'active':
      return 'Berlangsung Hari Ini';
    case 'upcoming':
      return 'Akan Datang';
    case 'completed':
      return 'Selesai';
  }
}

export function getStatusTextClass(status: WebinarStatus): string {
  switch (status) {
    case 'active':
      return 'text-emerald-700 font-semibold';
    case 'upcoming':
      return 'text-blue-700 font-medium';
    case 'completed':
      return 'text-slate-500 font-medium';
  }
}

export function safeExternalUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  return null;
}

export function buildWhatsappInviteText(webinar: Webinar, portalUrl: string, orgName: string): string {
  return [
    `*UNDANGAN WEBINAR PELATIHAN*`,
    `${orgName}`,
    ``,
    `*${webinar.title}*`,
    `Tanggal: ${formatIndonesianDate(webinar.date)}`,
    `Waktu: ${webinar.startTime} - ${webinar.endTime} WIB (${webinar.jp} JP)`,
    `Narasumber: ${webinar.speaker}`,
    ``,
    `Akses satu pintu (Link Room, Presensi, Materi, & E-Sertifikat):`,
    portalUrl,
    ``,
    `Kode Token Presensi akan diumumkan saat sesi berlangsung.`,
  ].join('\n');
}
