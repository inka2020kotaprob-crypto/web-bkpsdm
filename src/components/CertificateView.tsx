import { useEffect, useState, type FormEvent } from 'react';
import { Award, CheckCircle2, Printer, Search } from 'lucide-react';
import type { CertificateLookupItem } from '../types/webinar';
import { formatIndonesianDate } from '../utils/format';

interface CertificateViewProps {
  initialQuery?: string;
}

export function CertificateView({ initialQuery = '' }: CertificateViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<CertificateLookupItem[]>([]);
  const [selectedCert, setSelectedCert] = useState<CertificateLookupItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  async function runLookup(searchValue: string) {
    const trimmed = searchValue.trim();
    if (trimmed.length < 3) {
      setError('Masukkan minimal 3 karakter NIP, Email, atau Nomor Sertifikat.');
      return;
    }
    setError('');
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/certificates/lookup?query=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Pencarian gagal diproses.');
        setResults([]);
        setSelectedCert(null);
      } else {
        setResults(data.results || []);
        setSelectedCert((data.results && data.results[0]) || null);
      }
    } catch {
      setError('Terjadi kendala jaringan saat memeriksa sertifikat.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery && initialQuery.trim().length >= 3) {
      setQuery(initialQuery);
      runLookup(initialQuery);
    }
  }, [initialQuery]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    runLookup(query);
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-900">
            Cek, Unduh &amp; Verifikasi E-Sertifikat
          </h1>
          <p className="text-sm text-slate-600 mt-1.5">
            Masukkan NIP, Email terdaftar, atau Nomor Sertifikat untuk mengunduh salinan resmi
            maupun memverifikasi keabsahan sertifikat pengembangan kompetensi.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: 199105142019032011 atau BANGKOM/2026/11/0001"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {loading ? 'Mencari...' : 'Periksa Sertifikat'}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Contoh cepat:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('199105142019032011');
                runLookup('199105142019032011');
              }}
              className="font-mono text-blue-700 hover:underline"
            >
              199105142019032011
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                setQuery('BANGKOM/2026/11/0003');
                runLookup('BANGKOM/2026/11/0003');
              }}
              className="font-mono text-blue-700 hover:underline"
            >
              BANGKOM/2026/11/0003
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-900">
            Sertifikat belum ditemukan untuk kata kunci tersebut.
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Pastikan Anda telah mengisi Presensi Sesi dan Survei Evaluasi pada webinar terkait agar
            e-sertifikat terbit otomatis.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Matching Certificate List */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 tabular-nums">
              Ditemukan {results.length} Sertifikat Terverifikasi
            </h2>
            {results.map((cert) => {
              const isSelected = selectedCert?.certificateCode === cert.certificateCode;
              return (
                <button
                  key={cert.certificateCode}
                  type="button"
                  onClick={() => setSelectedCert(cert)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-white border-blue-600 ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Terverifikasi Resmi</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900 leading-snug">
                    {cert.webinar.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{cert.fullName}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                    <span>{cert.certificateCode}</span>
                    <span>{cert.webinar.jp} JP</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Printable Official Certificate Preview */}
          {selectedCert && (
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-slate-500">Pratinjau Dokumen</span>
                  <h2 className="text-base font-semibold text-slate-900 font-mono tabular-nums">
                    {selectedCert.certificateCode}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  Cetak / Simpan PDF
                </button>
              </div>

              <div
                id="printable-certificate"
                className="bg-white border border-slate-300 rounded-xl p-8 sm:p-12 shadow-sm"
              >
                <div className="border-2 border-slate-800 p-6 sm:p-10 relative">
                  <div className="border border-slate-300 p-6 sm:p-8 text-center">
                    <p className="text-xs font-semibold tracking-widest uppercase text-blue-800">
                      {selectedCert.signer.organizationName}
                    </p>
                    <h3 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-display">
                      SERTIFIKAT PELATIHAN
                    </h3>
                    <p className="mt-2 text-xs font-mono tabular-nums text-slate-600">
                      Nomor: {selectedCert.certificateCode}
                    </p>

                    <p className="mt-8 text-sm text-slate-600">Diberikan kepada:</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                      {selectedCert.fullName}
                    </p>
                    <p className="mt-1.5 text-xs font-mono tabular-nums text-slate-600">
                      NIP. {selectedCert.nip}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selectedCert.jabatan} · {selectedCert.instansi}
                    </p>

                    <p className="mt-7 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                      Telah mengikuti dan menyelesaikan rangkaian pembelajaran daring pada kegiatan
                      pengembangan kompetensi:
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900 max-w-xl mx-auto leading-snug">
                      &ldquo;{selectedCert.webinar.title}&rdquo;
                    </p>
                    <p className="mt-2 text-xs text-slate-600 tabular-nums">
                      Diselenggarakan pada {formatIndonesianDate(selectedCert.webinar.date)} ·
                      Setara {selectedCert.webinar.jp} Jam Pelajaran (JP)
                    </p>

                    <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 text-left">
                      <div className="flex items-center gap-3">
                        {/* Verification Matrix SVG */}
                        <svg
                          viewBox="0 0 36 36"
                          className="w-14 h-14 text-slate-900 shrink-0 border border-slate-300 p-1"
                          aria-label="Kode verifikasi sertifikat"
                        >
                          <rect x="2" y="2" width="10" height="10" fill="currentColor" />
                          <rect x="4" y="4" width="6" height="6" fill="#fff" />
                          <rect x="5" y="5" width="4" height="4" fill="currentColor" />
                          <rect x="24" y="2" width="10" height="10" fill="currentColor" />
                          <rect x="26" y="4" width="6" height="6" fill="#fff" />
                          <rect x="27" y="5" width="4" height="4" fill="currentColor" />
                          <rect x="2" y="24" width="10" height="10" fill="currentColor" />
                          <rect x="4" y="26" width="6" height="6" fill="#fff" />
                          <rect x="5" y="27" width="4" height="4" fill="currentColor" />
                          <rect x="15" y="4" width="4" height="4" fill="currentColor" />
                          <rect x="15" y="12" width="6" height="6" fill="currentColor" />
                          <rect x="24" y="16" width="4" height="4" fill="currentColor" />
                          <rect x="16" y="24" width="4" height="4" fill="currentColor" />
                          <rect x="24" y="24" width="10" height="4" fill="currentColor" />
                          <rect x="28" y="30" width="6" height="4" fill="currentColor" />
                        </svg>
                        <div className="text-xs text-slate-500">
                          <p className="font-semibold text-slate-800">Terverifikasi Digital</p>
                          <p className="font-mono tabular-nums mt-0.5">
                            {selectedCert.certificateCode}
                          </p>
                          <p className="mt-0.5">
                            Narasumber: {selectedCert.webinar.speaker}
                          </p>
                        </div>
                      </div>

                      <div className="text-center sm:text-right">
                        <p className="text-xs text-slate-500 tabular-nums">
                          Diterbitkan {formatIndonesianDate(selectedCert.webinar.date)}
                        </p>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                          {selectedCert.signer.signerTitle}
                        </p>
                        <div className="h-10" aria-hidden="true" />
                        <p className="text-sm font-bold text-slate-900">
                          {selectedCert.signer.signerName}
                        </p>
                        <p className="text-xs font-mono tabular-nums text-slate-500">
                          NIP. {selectedCert.signer.signerNip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
