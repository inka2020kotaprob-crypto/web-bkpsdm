import { useCallback, useEffect, useState } from 'react';
import { CertificateView } from './components/CertificateView';
import { MonitorView } from './components/MonitorView';
import { ParticipantPortal } from './components/ParticipantPortal';
import { ScheduleView } from './components/ScheduleView';
import type { PortalBootstrapResponse, PortalSettings, WebinarWithStats } from './types/webinar';

type AppView = 'portal' | 'schedule' | 'certificates' | 'monitor';
type PortalStep = 'room' | 'register' | 'attendance' | 'evaluation';

const DEFAULT_SETTINGS: PortalSettings = {
  organizationName: 'Balai Pengembangan Kompetensi ASN',
  portalSubtitle: 'Portal Satu Pintu Pelatihan & Monitoring Webinar Bulanan',
  monthlyTarget: 3,
  signerName: 'Drs. Bambang Sutrisno, M.Si.',
  signerTitle: 'Kepala Unit Pengembangan Kompetensi',
  signerNip: '19720415 199803 1 004',
  helpdeskWhatsapp: '6281234567890',
};

export default function App() {
  const [view, setView] = useState<AppView>('portal');
  const [webinars, setWebinars] = useState<WebinarWithStats[]>([]);
  const [settings, setSettings] = useState<PortalSettings>(DEFAULT_SETTINGS);
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>('');
  const [portalStep, setPortalStep] = useState<PortalStep>('room');
  const [certificateQuery, setCertificateQuery] = useState<string>('');
  const [openCreateSignal, setOpenCreateSignal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadPortalData = useCallback(async () => {
    try {
      setLoadError('');
      const res = await fetch('/api/portal');
      if (!res.ok) throw new Error('Gagal memuat data portal');
      const data = (await res.json()) as PortalBootstrapResponse;
      setWebinars(data.webinars || []);
      if (data.settings) setSettings(data.settings);
      setSelectedWebinarId((prev) => {
        if (prev && data.webinars.some((w) => w.id === prev)) return prev;
        return (
          data.webinars.find((w) => w.status === 'active')?.id || data.webinars[0]?.id || ''
        );
      });
    } catch {
      setLoadError('Tidak dapat terhubung ke server portal webinar. Silakan muat ulang.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  function handlePrimaryHeaderAction() {
    if (view === 'monitor') {
      setOpenCreateSignal((c) => c + 1);
      return;
    }
    const active = webinars.find((w) => w.status === 'active') || webinars[0];
    if (active) {
      setSelectedWebinarId(active.id);
    }
    setView('portal');
    setPortalStep('attendance');
    setTimeout(() => {
      document.getElementById('alur-peserta')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }

  function handleOpenInPortal(webinarId: string, step: 'room' | 'register' | 'attendance') {
    setSelectedWebinarId(webinarId);
    setPortalStep(step);
    setView('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleOpenCertificateWithQuery(query: string) {
    setCertificateQuery(query);
    setView('certificates');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const navItems: Array<{ key: AppView; label: string }> = [
    { key: 'portal', label: 'Portal' },
    { key: 'schedule', label: 'Jadwal' },
    { key: 'certificates', label: 'Sertifikat' },
    { key: 'monitor', label: 'Monitor' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Three-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setView('portal')}
            className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0 text-left"
          >
            RuangBangkom
          </button>

          {/* Zone 2: 4 single-line text nav links */}
          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
            aria-label="Navigasi utama"
          >
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  view === item.key
                    ? 'border-blue-700 text-slate-900 font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handlePrimaryHeaderAction}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {view === 'monitor' ? 'Buat Webinar' : 'Presensi Hari Ini'}
            </button>
          </div>
        </div>

        {/* Mobile navigation row (non-sticky so 0% viewport lock) */}
        <nav
          className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto"
          aria-label="Navigasi seluler"
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setView(item.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                view === item.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        {loading ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="h-72 bg-slate-200/70 rounded-xl animate-pulse" />
            <div className="h-48 bg-slate-200/60 rounded-xl animate-pulse" />
          </div>
        ) : loadError ? (
          <div className="max-w-xl mx-auto px-4 py-16 text-center">
            <p className="text-sm font-medium text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={loadPortalData}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {view === 'portal' && (
              <ParticipantPortal
                webinars={webinars}
                settings={settings}
                selectedWebinarId={selectedWebinarId}
                onSelectWebinar={setSelectedWebinarId}
                onRefreshData={loadPortalData}
                onOpenCertificateWithQuery={handleOpenCertificateWithQuery}
                activeStep={portalStep}
                onChangeStep={setPortalStep}
              />
            )}

            {view === 'schedule' && (
              <ScheduleView
                webinars={webinars}
                settings={settings}
                onOpenInPortal={handleOpenInPortal}
              />
            )}

            {view === 'certificates' && <CertificateView initialQuery={certificateQuery} />}

            {view === 'monitor' && (
              <MonitorView
                webinars={webinars}
                settings={settings}
                onWebinarsUpdated={setWebinars}
                onSettingsUpdated={setSettings}
                openCreateSignal={openCreateSignal}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            {settings.organizationName} · {settings.portalSubtitle}
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setView('certificates')}
              className="hover:text-slate-900 transition-colors"
            >
              Verifikasi Sertifikat
            </button>
            {settings.helpdeskWhatsapp && (
              <a
                href={`https://wa.me/${settings.helpdeskWhatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-900 transition-colors"
              >
                Helpdesk Panitia
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
