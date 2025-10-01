// ModalWarp.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ---------- ประเภทข้อมูล (คัดลอกมาเพื่อให้คอมโพเนนต์สมบูรณ์) ----------
export type DisplayWarp = {
  id: string;
  customerName: string;
  customerAvatar?: string | null;
  socialLink: string;
  quote?: string | null;
  displaySeconds: number;
  productImage?: string | null;
  selfDisplayName?: string | null;
};

// ---------- ข้อมูลจำลอง (คัดลอกมาเพื่อให้คอมโพเนนต์ทำงานได้) ----------
const MOCK_WARPS_QUEUE: DisplayWarp[] = [
  {
    id: 'warp_thai_001',
    customerName: 'พิมพ์ชนก',
    selfDisplayName: 'พิมพ์ชนก 💖',
    customerAvatar: 'https://i.pravatar.cc/300?img=9',
    productImage:
      'https://images.unsplash.com/photo-1526045431048-f857369baa09?q=80&w=1470&auto=format&fit=crop',
    socialLink: 'https://instagram.com/pimchanok_official',
    quote: 'สวัสดีค่ะทุกคน! วันนี้มาแชร์ความสุขให้กันน๊า ✨💕',
    displaySeconds: 10,
  },
  {
    id: 'warp_thai_002',
    customerName: 'สมชาย',
    selfDisplayName: 'อาจารย์สมชาย 📚',
    customerAvatar: 'https://i.pravatar.cc/300?img=14',
    productImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1470&auto=format&fit=crop',
    socialLink: 'https://facebook.com/teacher.somchai',
    quote: 'การศึกษาคือสิ่งสำคัญที่สุด มาเรียนรู้ไปด้วยกันครับ 🎓',
    displaySeconds: 10,
  },
  {
    id: 'warp_thai_003',
    customerName: 'แนท',
    selfDisplayName: 'แนท เด็กฝึกงาน 🚀',
    customerAvatar: 'https://i.pravatar.cc/300?img=23',
    productImage:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1470&auto=format&fit=crop',
    socialLink: 'https://linkedin.com/in/nat-trainee',
    quote: 'เก็บเกี่ยวประสบการณ์ทุกวัน ขอบคุณที่เป็นแรงบันดาลใจครับ 💪',
    displaySeconds: 10,
  },
];

// ---------- คอมโพเนนต์ ModalWarp ----------
export function ModalWarp({ className, textColor }: { className?: string, textColor?: string }) {
  const [currentWarp, setCurrentWarp] = useState<DisplayWarp | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const isFetchingWarpRef = useRef(false);
  const currentWarpRef = useRef<DisplayWarp | null>(null);
  const fetchNextWarpRef = useRef<() => void>(() => { });

  const MOCK_MODE = true; // ใช้ข้อมูลจำลอง

  useEffect(() => {
    currentWarpRef.current = currentWarp;
  }, [currentWarp]);

  // ---------- ฟังก์ชัน Helpers (คัดลอกมาจาก TestOnePage) ----------
  const resolveMediaSource = useCallback((raw?: string | null) => {
    if (!raw) return null;
    if (raw.startsWith('data:') || /^https?:\/\//i.test(raw)) return raw;
    const trimmed = raw.trim();
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) return `data:image/jpeg;base64,${trimmed}`;
    return raw;
  }, []);

  const formatSeconds = useCallback((value: number) => {
    const safe = Math.max(0, Math.floor(value));
    const minutes = Math.floor(safe / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (safe % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, []);

  const sanitizeName = useCallback((name: string) => {
    return name.trim();
  }, []);

  // ---------- Logic หลักในการจัดการคิววาร์ป (คัดลอกมาจาก TestOnePage) ----------
  const fetchNextWarp = useCallback(async () => {
    if (isFetchingWarpRef.current || currentWarpRef.current) return;
    isFetchingWarpRef.current = true;
    try {
      if (MOCK_MODE) {
        const next = MOCK_WARPS_QUEUE.shift();
        if (next) {
          setCurrentWarp({ ...next });
          // เพิ่มกลับเข้าไปในคิวเพื่อให้วนลูปได้
          MOCK_WARPS_QUEUE.push({ ...next, id: next.id + '_' + Date.now() });
        }
      }
    } catch (error) {
      console.error('ไม่สามารถดึงวาร์ปถัดไปได้', error);
    } finally {
      isFetchingWarpRef.current = false;
    }
  }, []);

  const completeCurrentWarp = useCallback(
    async (transactionId: string) => {
      try {
        // ในโหมดจริงอาจมีการเรียก API ที่นี่
      } catch (error) {
        console.error('ไม่สามารถทำเครื่องหมายวาร์ปเสร็จสิ้นได้', error);
      } finally {
        setCurrentWarp(null);
        setCountdown(0);
        setTimeout(() => {
          fetchNextWarpRef.current?.();
        }, 500); // หน่วงเวลาเล็กน้อยก่อนแสดงวาร์ปถัดไป
      }
    },
    [],
  );

  useEffect(() => {
    fetchNextWarpRef.current = fetchNextWarp;
  }, [fetchNextWarp]);

  // ---------- Logic การนับถอยหลังและจัดการการแสดงผล ----------
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

  // ---------- Logic เริ่มต้นการทำงานของคอมโพเนนต์ ----------
  useEffect(() => {
    let poller: ReturnType<typeof setInterval> | null = null;

    // เริ่มดึงวาร์ปแรกเมื่อคอมโพเนนต์พร้อมใช้งาน
    fetchNextWarpRef.current?.();

    // ตั้งค่าการตรวจสอบวาร์ปใหม่เป็นระยะ (ถ้าไม่มีวาร์ปกำลังแสดง)
    if (MOCK_MODE) {
      poller = setInterval(() => {
        if (!currentWarpRef.current) {
          fetchNextWarpRef.current?.();
        }
      }, 6000); // ตรวจสอบทุก 6 วินาที
    }

    return () => {
      if (poller) clearInterval(poller);
    };
  }, []);

  // ---------- ค่าที่คำนวณไว้ล่วงหน้าสำหรับ UI ----------
  const warpImage = useMemo(() => {
    if (!currentWarp) return null;
    return (
      resolveMediaSource(currentWarp.productImage) ||
      resolveMediaSource(currentWarp.customerAvatar) ||
      `https://ui-avatars.com/api/?background=1e40af&color=fff&name=${encodeURIComponent(
        currentWarp.customerName,
      )}`
    );
  }, [currentWarp, resolveMediaSource]);

  const countdownLabel = useMemo(() => formatSeconds(countdown), [countdown, formatSeconds]);
  const totalDurationLabel = useMemo(
    () => (currentWarp ? formatSeconds(currentWarp.displaySeconds) : '00:00'),
    [currentWarp, formatSeconds],
  );

  // ---------- ส่วนการแสดงผล (UI) ----------
  if (!currentWarp) {
    return null; // ไม่แสดงอะไรเลยถ้าไม่มีวาร์ป
  }

  return (
    <div className={`relative z-50 w-full h-full flex justify-center items-center`}>
      <div className={`my-auto max-h-max z-50 grid grid-cols-1 md:grid-cols-5 gap-6 ${className}`}>
        {/* ซ้าย: รูปภาพ = 1 col เต็มสูง */}
        <div className="md:col-span-2 min-h-0">
          <div className=" w-full h-max-content overflow-hidden self-start ">
            {warpImage ? (
              <img
                src={warpImage as string}
                alt={currentWarp.customerName}
                className={`w-[60vh] h-[80vh] object-cover rounded-xl aspect-[5/3] m-auto`}
              />
            ) : (
              <div className={`grid place-items-center bg-${textColor}-900/70 text-slate-100`}>
                มีวาร์ป
              </div>
            )}
          </div>
        </div>

        {/* ขวา: เนื้อหา = 2 col แบ่ง 2 แถว (บน 2fr, ล่าง 1fr) */}
        <div className="md:col-span-3 grid grid-rows-[2fr_1fr] gap-6 min-h-0 h-[80vh]">
          {/* แถวบน: ชื่อไอดี + คำคม */}
          <div className={`${className}`}>
            <div className="flex flex-col justify-center items-center h-full">
              <h2
                className={`text-[4rem] font-black text-white drop-shadow-lg text-ellipsis`}
                title={currentWarp.selfDisplayName || currentWarp.customerName}
              >
                {sanitizeName(currentWarp.selfDisplayName || currentWarp.customerName)}
              </h2>

              {currentWarp.quote && (
                <p className={`mt-8 text-[2rem] font-medium text-white italic leading-relaxed`}>
                  {/* “{currentWarp.quote}” */}
                  {/* เปลี่ยนเป็น icon instagram */}
                  {/* <FaInstagram />  */}IG : devilzeros
                </p>
              )}
            </div>
          </div>

          {/* แถวล่าง: แบ่ง 2 คอลัมน์ → ซ้าย QR / ขวากล่องเวลา */}
          <div className="grid grid-cols-2 gap-6 max-h-max">
            {/* ซ้าย: QR */}
            <div className={`${className}`}>
              <div className={`aspect-square p-4 overflow-hidden rounded-lg border border-${textColor}-400/40 bg-white/95 shadow-[0_8px_25px_rgba(59,130,246,0.3)]`}>
                {currentWarp.socialLink ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(
                      currentWarp.socialLink
                    )}`}
                    alt="QR"
                    className="aspect-square h-full w-full object-contain"
                  />
                ) : (
                  <div className={`h-full w-full grid place-items-center text-${textColor}-100 text-sm`}>QR</div>
                )}
              </div>
              <div className={`text-[1.5rem] mt-2 font-bold text-white text-center text-bold`}>
                สแกนเพื่อติดตาม
              </div>
            </div>

            {/* ขวา: เวลาถอยหลัง + เวลารวม (ในกล่องเดียวตามภาพ) */}
            <div className={`flex flex-col justify-center items-center ${className}`}>
              <div className={`text-4xl font-bold text-white drop-shadow-lg text-center`}>
                เวลาที่เหลือ <br />
                <span className={`text-${textColor}-500 font-bold`}>{countdownLabel}</span>
              </div>
              <div className={`mt-4 text-sm text-slate-200 text-center`}>
                เวลาที่ซื้อทั้งหมด <span className={`text-${textColor}-500 font-bold`}>{totalDurationLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}