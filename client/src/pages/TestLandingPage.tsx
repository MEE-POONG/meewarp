import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** =========================================================
 *  MOCK MODE & DUMMY DATA
 *  - ปิดทุกการเรียก API และ EventSource
 *  - จำลองข้อมูล settings / supporters / warp queue
 * ========================================================= */
const MOCK_MODE = true;

// พื้นหลังแบบ data-uri (SVG gradient โทน indigo-violet ปลอด CORS)
const MOCK_BG_SVG = encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>
  <defs>
    <linearGradient id='g1' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#4f46e5'/>
      <stop offset='100%' stop-color='#8b5cf6'/>
    </linearGradient>
    <radialGradient id='g2' cx='20%' cy='25%' r='60%'>
      <stop offset='0%' stop-color='rgba(99,102,241,0.6)'/>
      <stop offset='100%' stop-color='rgba(99,102,241,0)'/>
    </radialGradient>
    <radialGradient id='g3' cx='80%' cy='80%' r='65%'>
      <stop offset='0%' stop-color='rgba(56,189,248,0.4)'/>
      <stop offset='100%' stop-color='rgba(56,189,248,0)'/>
    </radialGradient>
  </defs>
  <rect width='1200' height='800' fill='url(#g1)'/>
  <circle cx='0' cy='0' r='700' fill='url(#g2)'/>
  <circle cx='1200' cy='800' r='700' fill='url(#g3)'/>
</svg>
`);
const MOCK_BG_DATA_URL = `data:image/svg+xml;charset=utf-8,${MOCK_BG_SVG}`;

type Supporter = {
  customerName: string;
  totalAmount: number;
  customerAvatar?: string | null;
  totalSeconds?: number;
};

type AppSettings = {
  brandName?: string;
  tagline?: string;
  primaryColor?: string;
  backgroundImage?: string;
  logo?: string;
};

type DisplayWarp = {
  id: string;
  customerName: string;
  customerAvatar?: string | null;
  socialLink: string;
  quote?: string | null;
  displaySeconds: number;
  productImage?: string | null;
  selfDisplayName?: string | null;
};

// ข้อมูล mock
const mockSettings: AppSettings = {
  brandName: 'MeeWarp',
  tagline: 'Community Digital — Indigo/Violet',
  primaryColor: '#4f46e5',
  backgroundImage: MOCK_BG_DATA_URL,
  logo: '',
};

const mockSupportersSeed: Supporter[] = [
  { customerName: 'คุณอินดิโก้', totalAmount: 1590, customerAvatar: null },
  { customerName: 'คุณไวโอเล็ต', totalAmount: 980, customerAvatar: null },
  { customerName: 'คุณสกาย', totalAmount: 720, customerAvatar: null },
];

const fallbackSupporters: Supporter[] = [
  { customerName: 'รอการสนับสนุน', totalAmount: 0, customerAvatar: null },
  { customerName: 'ยังว่างอันดับ 2', totalAmount: 0, customerAvatar: null },
  { customerName: 'ยังว่างอันดับ 3', totalAmount: 0, customerAvatar: null },
];

const mockWarpQueue: DisplayWarp[] = [
  {
    id: 'tx-001',
    customerName: 'Indigo Lover',
    selfDisplayName: 'INDIGO LOVER',
    customerAvatar: null,
    socialLink: 'https://example.com/@indigo',
    quote: 'Make it glow in indigo.',
    displaySeconds: 15,
    productImage: null,
  },
  {
    id: 'tx-002',
    customerName: 'Violet Dreamer',
    selfDisplayName: 'VIOLET DREAMER',
    customerAvatar: null,
    socialLink: 'https://example.com/@violet',
    quote: 'Stay vivid. Stay kind.',
    displaySeconds: 12,
    productImage: null,
  },
  {
    id: 'tx-003',
    customerName: 'Sky Runner',
    selfDisplayName: 'SKY RUNNER',
    customerAvatar: null,
    socialLink: 'https://example.com/@sky',
    quote: 'Breathe, then sprint.',
    displaySeconds: 10,
    productImage: null,
  },
];

const TestLandingPage = () => {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [selfWarpUrl, setSelfWarpUrl] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentWarp, setCurrentWarp] = useState<DisplayWarp | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [imageColors, setImageColors] = useState<{ primary: string; secondary: string } | null>(null);

  const isFetchingWarpRef = useRef(false);
  const currentWarpRef = useRef<DisplayWarp | null>(null);
  const fetchNextWarpRef = useRef<() => void>(() => {});
  const mockWarpIndexRef = useRef<number>(0); // index ปัจจุบันของคิว mock

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }),
    []
  );

  useEffect(() => {
    currentWarpRef.current = currentWarp;
  }, [currentWarp]);

  /** ==============================
   * SETTINGS (MOCK)
   * ============================== */
  useEffect(() => {
    let isMounted = true;

    const load = () => {
      if (!isMounted) return;
      if (MOCK_MODE) {
        setSettings(mockSettings);
        return;
      }
      // (ถ้าอยากสลับกลับ API: วาง fetch จริงไว้ที่นี่)
    };

    load();

    // จำลองการอัปเดต settings ทุก 10 วิ (เช่น สลับ tagline)
    const iv = setInterval(() => {
      if (!isMounted || !MOCK_MODE) return;
      setSettings((prev) => {
        if (!prev) return mockSettings;
        const flip = prev.tagline?.includes('—') ? 'Community Digital' : 'Community Digital — Indigo/Violet';
        return { ...prev, tagline: flip };
      });
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(iv);
    };
  }, []);

  const resolveMediaSource = useCallback((raw?: string | null) => {
    if (!raw) return null;
    if (raw.startsWith('data:') || /^https?:\/\//i.test(raw)) return raw;

    const trimmed = raw.trim();
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      return `data:image/jpeg;base64,${trimmed}`;
    }
    return raw;
  }, []);

  const extractImageColors = useCallback((imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = 50;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const colors: { r: number; g: number; b: number; count: number }[] = [];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 225) continue;

          const existing = colors.find(
            (c) => Math.abs(c.r - r) < 20 && Math.abs(c.g - g) < 20 && Math.abs(c.b - b) < 20
          );
          if (existing) {
            existing.r = (existing.r * existing.count + r) / (existing.count + 1);
            existing.g = (existing.g * existing.count + g) / (existing.count + 1);
            existing.b = (existing.b * existing.count + b) / (existing.count + 1);
            existing.count++;
          } else {
            colors.push({ r, g, b, count: 1 });
          }
        }

        colors.sort((a, b) => b.count - a.count);
        if (colors.length > 0) {
          const p = colors[0];
          const s = colors[1] || colors[0];
          setImageColors({
            primary: `rgb(${Math.round(p.r)}, ${Math.round(p.g)}, ${Math.round(p.b)})`,
            secondary: `rgb(${Math.round(s.r)}, ${Math.round(s.g)}, ${Math.round(s.b)})`,
          });
        }
      } catch (e) {
        console.error('Error extracting colors:', e);
      }
    };

    img.onerror = () => console.error('Error loading image for color extraction');
    img.src = imageUrl;
  }, []);

  const formatSeconds = useCallback((value: number) => {
    const safe = Math.max(0, Math.floor(value));
    const minutes = Math.floor(safe / 60).toString().padStart(2, '0');
    const seconds = (safe % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, []);

  const sanitizeName = useCallback((name: string) => {
    return name.replace(/[^\u0E00-\u0E7F\u0020-\u007E]/g, '').trim();
  }, []);

  /** ==============================
   * FETCH NEXT WARP (MOCK QUEUE)
   * ============================== */
  const fetchNextWarp = useCallback(async () => {
    if (isFetchingWarpRef.current || currentWarpRef.current) return;
    isFetchingWarpRef.current = true;

    try {
      if (MOCK_MODE) {
        const idx = mockWarpIndexRef.current % mockWarpQueue.length;
        const data = mockWarpQueue[idx];
        mockWarpIndexRef.current = (mockWarpIndexRef.current + 1) % mockWarpQueue.length;

        setCurrentWarp({
          id: data.id,
          customerName: data.customerName,
          customerAvatar: data.customerAvatar || null,
          socialLink: data.socialLink || '',
          quote: data.quote || null,
          displaySeconds: Math.max(1, Number(data.displaySeconds) || 15),
          productImage: data.productImage || null,
          selfDisplayName: data.selfDisplayName || null,
        });
        return;
      }

      // (ถ้าอยากสลับกลับ API: วาง fetch จริงไว้ที่นี่)
    } catch (error) {
      console.error('Failed to fetch next warp', error);
    } finally {
      isFetchingWarpRef.current = false;
    }
  }, []);

  const completeCurrentWarp = useCallback(async (transactionId: string) => {
    // MOCK: ไม่ต้องเรียก API ใดๆ
    setCurrentWarp(null);
    setCountdown(0);
    setTimeout(() => {
      fetchNextWarpRef.current?.();
    }, 500);
  }, []);

  useEffect(() => {
    fetchNextWarpRef.current = fetchNextWarp;
  }, [fetchNextWarp]);

  // Timer & auto-complete
  useEffect(() => {
    if (!currentWarp) return;

    setCountdown(currentWarp.displaySeconds);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeout = setTimeout(() => {
      completeCurrentWarp(currentWarp.id);
    }, currentWarp.displaySeconds * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentWarp, completeCurrentWarp]);

  /** ==============================
   * STREAM/POOL LOGIC (MOCK)
   * ============================== */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSelfWarpUrl(`${window.location.origin}/self-warp`);
    }

    // เริ่มดึง warp แรก
    fetchNextWarpRef.current?.();

    // ถ้ายังไม่มี currentWarp ให้พยายามดึงทุก 15 วิ
    const poller = setInterval(() => {
      if (!currentWarpRef.current) fetchNextWarpRef.current?.();
    }, 15000);

    return () => clearInterval(poller);
  }, []);

  // Supporters mock stream/update
  useEffect(() => {
    let isMounted = true;
    if (MOCK_MODE) {
      setSupporters(mockSupportersSeed);

      // จำลองยอดเปลี่ยนเล็กน้อยทุก 6 วิ
      const iv = setInterval(() => {
        if (!isMounted) return;
        setSupporters((prev) => {
          const next = [...prev];
          if (next.length === 0) return mockSupportersSeed;
          const i = Math.floor(Math.random() * next.length);
          const bump = (Math.random() < 0.5 ? 20 : 50);
          next[i] = { ...next[i], totalAmount: next[i].totalAmount + bump };
          // sort ใหม่
          next.sort((a, b) => b.totalAmount - a.totalAmount);
          return next.slice(0, 3);
        });
      }, 6000);

      return () => {
        isMounted = false;
        clearInterval(iv);
      };
    }

    // (ถ้าอยากสลับกลับ API & SSE: วางโค้ดจริงไว้ที่นี่)
    return () => {};
  }, []);

  /** ==============================
   * BACKGROUND IMAGE & COLORS
   * ============================== */
  const bgImageUrl = useMemo(() => {
    const src = settings?.backgroundImage || null;
    if (!src) {
      setImageColors(null);
      return null;
    }
    const imageUrl = resolveMediaSource(src) || null;
    if (imageUrl) extractImageColors(imageUrl);
    return imageUrl;
  }, [settings?.backgroundImage, resolveMediaSource, extractImageColors]);

  const defaultPrimary = '#6366f1';   // indigo-500
  const defaultSecondary = '#f472b6'; // pink-400 (ไฮไลต์อุ่นๆ)
  const gradientPrimary = imageColors?.primary || defaultPrimary;
  const gradientSecondary = imageColors?.secondary || defaultSecondary;

  const toRgba = (color: string, alpha: number) => {
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map((c) => c + c).join('');
      }
      const num = parseInt(hex, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  };

  const hasLiveData = supporters.length > 0;
  const supportersToDisplay = hasLiveData ? supporters : fallbackSupporters;

  const warpImage = useMemo(() => {
    if (!currentWarp) return null;
    return (
      resolveMediaSource(currentWarp.productImage) ||
      resolveMediaSource(currentWarp.customerAvatar) ||
      `https://ui-avatars.com/api/?background=1e1b4b&color=fff&name=${encodeURIComponent(currentWarp.customerName)}`
    );
  }, [currentWarp, resolveMediaSource]);

  const countdownLabel = useMemo(() => formatSeconds(countdown), [countdown, formatSeconds]);
  const totalDurationLabel = useMemo(
    () => (currentWarp ? formatSeconds(currentWarp.displaySeconds) : '00:00'),
    [currentWarp, formatSeconds]
  );

  const brandName = settings?.brandName || '';
  const tagline = settings?.tagline || '';

  return (
    <div
      className="relative flex min-h-screen w-screen overflow-hidden bg-slate-950 text-slate-100"
      style={
        bgImageUrl
          ? {
              backgroundImage: `url(${bgImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: gradientPrimary || '#0f172a',
              backgroundClip: 'padding-box',
              backgroundOrigin: 'padding-box',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      {/* Blurred background image overlay */}
      {bgImageUrl && (
        <div
          className="pointer-events-none fixed inset-0 -z-20"
          style={{
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(20px)',
            transform: 'scale(1.05)',
            opacity: 0.25,
            backgroundClip: 'padding-box',
            backgroundOrigin: 'padding-box',
          }}
        />
      )}

      {/* Smooth edge transition overlay */}
      {bgImageUrl && (
        <div
          className="pointer-events-none fixed inset-0 -z-20"
          style={{
            background: `radial-gradient(ellipse at center, transparent 0%, transparent 40%, ${toRgba(
              gradientPrimary,
              0.9
            )} 70%, ${toRgba(gradientPrimary, 1)} 100%)`,
            opacity: 0.8,
          }}
        />
      )}

      {/* Gradient backdrops */}
      <div
        className="pointer-events-none fixed inset-0 -z-30 opacity-70"
        style={{
          background: `radial-gradient(120% 120% at 15% 20%, ${toRgba(gradientPrimary, 0.55)} 0%, transparent 70%),
                       radial-gradient(120% 120% at 85% 80%, ${toRgba(gradientSecondary, 0.5)} 0%, transparent 72%)`,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-30 opacity-60 mix-blend-screen"
        style={{
          background: `radial-gradient(140% 140% at 50% 120%, ${toRgba(gradientSecondary, 0.35)} 0%, transparent 65%)`,
        }}
      />

      {currentWarp ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
          <div className="pointer-events-auto w-full max-w-[800px] lg:max-w-[1200px] xl:max-w-[1400px] rounded-[32px] border-2 border-emerald-400/20 bg-gradient-to-br from-white/15 to-emerald-500/5 p-6 shadow-[0_40px_120px_rgba(20,20,40,0.65)] backdrop-blur-2xl sm:p-10 lg:p-16 xl:p-20 ring-4 ring-emerald-400/10">
            <div className="grid gap-6 sm:gap-8 lg:gap-10 xl:gap-12 sm:grid-cols-[350px_1fr] lg:grid-cols-[450px_1fr] xl:grid-cols-[550px_1fr] sm:items-start">
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-[24px] border-4 border-emerald-400/60 bg-slate-900/60 shadow-[0_35px_100px_rgba(15,23,42,0.75)] ring-8 ring-emerald-400/30 sm:rounded-[32px] transform hover:scale-[1.02] transition-all duration-500">
                  {warpImage ? (
                    <img
                      src={warpImage}
                      alt={currentWarp.customerName}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900/70 text-slate-100">
                      MeeWarp
                    </div>
                  )}
                  <span className="absolute left-4 top-4 lg:left-6 lg:top-6 xl:left-8 xl:top-8 rounded-full bg-emerald-500/90 backdrop-blur-sm px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-sm lg:text-base xl:text-lg font-bold uppercase tracking-[0.3em] text-white shadow-xl ring-2 ring-emerald-300/50">
                    {countdownLabel}
                  </span>
                  <div className="absolute inset-0 rounded-[24px] bg-gradient-to-t from-emerald-900/30 via-transparent to-emerald-500/10 pointer-events-none sm:rounded-[32px]"></div>
                  <div className="absolute inset-0 rounded-[24px] ring-2 ring-emerald-400/20 pointer-events-none sm:rounded-[32px]"></div>
                </div>
                {currentWarp.quote ? (
                  <div className="rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 p-4 lg:p-5 xl:p-6 backdrop-blur-sm">
                    <p className="text-sm lg:text-base xl:text-lg font-medium text-emerald-100 italic text-center leading-relaxed line-clamp-3">
                      "{currentWarp.quote}"
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="space-y-4 lg:space-y-5 xl:space-y-6 text-left">
                <div className="min-w-0">
                  <p className="text-sm lg:text-base xl:text-lg uppercase tracking-[0.4em] text-emerald-300 font-bold">
                    Warp Spotlight
                  </p>
                  <h2
                    className="mt-3 text-[clamp(2rem,8vw,7rem)] font-black text-white drop-shadow-lg truncate max-w-full"
                    title={currentWarp.selfDisplayName || currentWarp.customerName}
                  >
                    {sanitizeName(currentWarp.selfDisplayName || currentWarp.customerName)}
                  </h2>
                </div>
                {currentWarp.socialLink ? (
                  <div className="flex flex-col items-center gap-2 lg:gap-3 xl:gap-4 rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 p-3 lg:p-4 xl:p-5 backdrop-blur-sm">
                    <div className="h-16 w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 overflow-hidden rounded-lg border border-emerald-400/30 bg-white/95 shadow-[0_8px_25px_rgba(16,185,129,0.2)]">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(
                          currentWarp.socialLink
                        )}`}
                        alt="QR Code สำหรับลิงก์โซเชียล"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="text-xs lg:text-sm font-medium text-emerald-200 text-center">
                      สแกนเพื่อไปยังลิงก์โซเชียล
                    </p>
                  </div>
                ) : null}
                <div className="flex items-center gap-4 lg:gap-6 xl:gap-8 rounded-2xl border-2 border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 p-5 lg:p-6 xl:p-8 backdrop-blur-sm">
                  <div className="rounded-xl border border-emerald-400/60 bg-emerald-500/25 px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-xs lg:text-sm xl:text-base uppercase tracking-[0.3em] text-emerald-100 font-bold shadow-lg ring-2 ring-emerald-400/30">
                    Time Left
                  </div>
                  <span className="text-2xl lg:text-4xl xl:text-5xl font-bold text-emerald-100 drop-shadow-lg">
                    {countdownLabel}
                  </span>
                </div>
                <p className="text-sm lg:text-base xl:text-lg font-medium text-slate-200 bg-white/5 rounded-xl px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-center">
                  เวลาที่ซื้อไว้ทั้งหมด{' '}
                  <span className="text-emerald-300 font-bold">{totalDurationLabel}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-[5vw]">
        <div className="flex max-w-[60vw] lg:max-w-[70vw] xl:max-w-[80vw] flex-col items-center text-center">
          <span className="mb-4 text-[clamp(16px,1.3vw,24px)] lg:text-2xl xl:text-3xl uppercase tracking-[0.5em] text-indigo-300">
            {tagline}
          </span>
          <h1 className="font-display text-[clamp(72px,10vw,160px)] lg:text-[180px] xl:text-[220px] font-black uppercase leading-none text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.55)]">
            {brandName}
          </h1>
        </div>
      </div>

      {/* Bottom-left QR Code Section */}
      <div className="pointer-events-auto absolute left-[2vw] bottom-[2vh] z-10 max-w-[85vw] sm:left-[4vw] sm:bottom-[4vh] rounded-3xl p-[1.6vw] lg:p-[2vw] xl:p-[2.5vw] backdrop-blur">
        <div className="flex items-center gap-4 lg:gap-6 xl:gap-8">
          <div className="h-[12vw] w-[12vw] min-h-[100px] min-w-[100px] max-h-[180px] max-w-[160px] lg:max-w-[200px] xl:max-w-[240px] overflow-hidden rounded-2xl p-2 lg:p-4 xl:p-5 shadow-[0_35px_100px_rgba(15,23,42,0.55)] backdrop-blur">
            {selfWarpUrl ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(selfWarpUrl)}`}
                alt="สแกนเพื่อแจกวาร์ป"
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
          <div className="flex-1 max-w-[60vw]">
            <p className="text-[clamp(12px,1.1vw,20px)] lg:text-xl xl:text-2xl font-semibold text-white">
              สแกนเพื่อแจกวาร์ป
            </p>
            <p className="mt-1 text-[clamp(10px,0.9vw,16px)] lg:text-lg xl:text-xl text-slate-300">
              เลือกเวลาและชำระเงินได้ทันที
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-[4vw] top-[6vh] w-[25vw] min-w-[260px] max-w-[320px] lg:max-w-[400px] xl:max-w-[480px] rounded-2xl border border-white/10 bg-white/10 p-4 lg:p-6 xl:p-8 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="text-[clamp(14px,1vw,20px)] lg:text-xl xl:text-2xl font-semibold text-white">Warp Hall of Fame</h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 lg:px-3 lg:py-1 xl:px-4 xl:py-1.5 text-[clamp(8px,0.6vw,12px)] lg:text-sm xl:text-base uppercase tracking-wide text-slate-100">
            {hasLiveData ? 'Live' : 'Standby'}
          </span>
        </div>
        <ul className="mt-4 lg:mt-6 xl:mt-8 space-y-3 lg:space-y-4 xl:space-y-5">
          {supportersToDisplay.map((supporter, index) => {
            const avatarUrl =
              resolveMediaSource(supporter.customerAvatar) ||
              `https://ui-avatars.com/api/?background=312e81&color=fff&name=${encodeURIComponent(
                supporter.customerName
              )}`;
            const isPlaceholder = supporter.totalAmount <= 0;
            const amountLabel = isPlaceholder ? 'รอเริ่มต้น' : currencyFormatter.format(supporter.totalAmount);

            return (
              <li key={supporter.customerName} className="flex items-center gap-3 lg:gap-4 xl:gap-5">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt={supporter.customerName}
                    className="h-[2.8vw] w-[2.8vw] min-h-[44px] min-w-[44px] max-h-[52px] max-w-[52px] lg:min-h-[56px] lg:min-w-[56px] lg:max-h-[64px] lg:max-w-[64px] xl:min-h-[68px] xl:min-w-[68px] xl:max-h-[76px] xl:max-w-[76px] rounded-full border border-white/20 object-cover"
                  />
                  <span className="absolute -left-2 -top-2 flex h-[1.8vw] w-[1.8vw] min-h-[28px] min-w-[28px] lg:min-h-[32px] lg:min-w-[32px] xl:min-h-[36px] xl:min-w-[36px] items-center justify-center rounded-full bg-indigo-500 text-[clamp(10px,0.7vw,14px)] lg:text-base xl:text-lg font-semibold text-white">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[clamp(12px,0.9vw,16px)] lg:text-lg xl:text-xl font-semibold text-white truncate">
                    {sanitizeName(supporter.customerName)}
                  </p>
                  <p className="text-[clamp(10px,0.8vw,14px)] lg:text-base xl:text-lg text-slate-300">{amountLabel}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 lg:mt-4 xl:mt-5 rounded-xl border border-white/10 bg-white/10 p-3 lg:p-4 xl:p-5 text-center text-[clamp(9px,0.7vw,12px)] lg:text-sm xl:text-base text-slate-200">
          {hasLiveData
            ? 'เพิ่มเวลาวาร์ปของคุณเพื่อรักษาอันดับบนจอหลัก'
            : 'ยังไม่มีใครขึ้นจอ ลองเป็นคนแรกที่ปล่อยวาร์ปดูไหม?'}
        </div>
      </div>
    </div>
  );
};

export default TestLandingPage;
