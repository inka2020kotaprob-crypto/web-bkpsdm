export type WebinarStatus = 'active' | 'upcoming' | 'completed';

export interface Webinar {
  id: string;
  seriesCode: string;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  jp: number;
  speaker: string;
  speakerRole: string;
  platform: string;
  meetingUrl: string;
  meetingPasscode: string;
  youtubeUrl: string;
  materialsUrl: string;
  recordingUrl: string;
  attendanceToken: string;
  status: WebinarStatus;
  description: string;
  agenda: string[];
  imageUrl: string;
  createdAt: string;
}

export interface WebinarStats {
  registeredCount: number;
  attendedCount: number;
  evaluatedCount: number;
  certifiedCount: number;
}

export interface WebinarWithStats extends Webinar {
  stats: WebinarStats;
}

export interface ParticipantRecord {
  id: string;
  webinarId: string;
  fullName: string;
  nip: string;
  instansi: string;
  jabatan: string;
  email: string;
  whatsapp: string;
  registeredAt: string;
  attended: boolean;
  attendedAt: string | null;
  evaluated: boolean;
  evaluatedAt: string | null;
  ratingMaterial: number | null;
  ratingSpeaker: number | null;
  feedback: string;
  certificateCode: string | null;
  certificateIssuedAt: string | null;
}

export interface PortalSettings {
  organizationName: string;
  portalSubtitle: string;
  monthlyTarget: number;
  signerName: string;
  signerTitle: string;
  signerNip: string;
  helpdeskWhatsapp: string;
}

export interface PortalBootstrapResponse {
  webinars: WebinarWithStats[];
  settings: PortalSettings;
}

export interface CertificateLookupItem {
  participantId: string;
  fullName: string;
  nip: string;
  instansi: string;
  jabatan: string;
  certificateCode: string;
  certificateIssuedAt: string;
  webinar: {
    id: string;
    seriesCode: string;
    title: string;
    date: string;
    jp: number;
    speaker: string;
    speakerRole: string;
    category: string;
  };
  signer: {
    organizationName: string;
    signerName: string;
    signerTitle: string;
    signerNip: string;
  };
}
