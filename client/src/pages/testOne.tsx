import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, GridLayout } from '../container/GridLayout'
import PromoSlider from '../container/PromoSlider'
import { ModalWarp } from '../container/ModalWarp'
/**
 * ✅ โหมดจำลองข้อมูล
 * - ใช้ข้อมูลจำลองภาษาไทยแทน API จริง
 * - แสดงผลระบบ MeeWarp แบบเต็มรูปแบบ
 */
const MOCK_MODE = true

// ---------- ประเภทข้อมูล ----------
export type Supporter = {
  customerName: string
  totalAmount: number
  customerAvatar?: string | null
  totalSeconds?: number
}

export type AppSettings = {
  brandName?: string
  tagline?: string
  primaryColor?: string
  backgroundImage?: string
  logo?: string
}

export type DisplayWarp = {
  id: string
  customerName: string
  customerAvatar?: string | null
  socialLink: string
  quote?: string | null
  displaySeconds: number
  productImage?: string | null
  selfDisplayName?: string | null
}

// ---------- ข้อมูลจำลอง ----------
const MOCK_SETTINGS: AppSettings = {
  brandName: 'มีวาร์ป',
  tagline: 'แสดงตัวตนของคุณบนจอใหญ่',
  backgroundImage:
    '/images/bg.png',
}

const MOCK_SUPPORTERS_POOL: Supporter[] = [
  {
    customerName: 'นางสาวพิมพ์ชนก',
    totalAmount: 1200,
    customerAvatar: 'https://i.pravatar.cc/200?img=9',
  },
  {
    customerName: 'คุณสมชาย',
    totalAmount: 850,
    customerAvatar: 'https://i.pravatar.cc/200?img=14',
  },
  {
    customerName: 'น้องแนท',
    totalAmount: 650,
    customerAvatar: 'https://i.pravatar.cc/200?img=23',
  },
  {
    customerName: 'พี่บิ๊ก',
    totalAmount: 590,
    customerAvatar: 'https://i.pravatar.cc/200?img=31',
  },
  {
    customerName: 'คุณครูสมหญิง',
    totalAmount: 480,
    customerAvatar: 'https://i.pravatar.cc/200?img=44',
  },
  {
    customerName: 'น้องจิ๋ม',
    totalAmount: 350,
    customerAvatar: 'https://i.pravatar.cc/200?img=16',
  },
]

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
    displaySeconds: 15,
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
    displaySeconds: 12,
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
  {
    id: 'warp_thai_004',
    customerName: 'บิ๊ก',
    selfDisplayName: 'พี่บิ๊ก แอดมิน 👨‍💻',
    customerAvatar: 'https://i.pravatar.cc/300?img=31',
    productImage:
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1476&auto=format&fit=crop',
    socialLink: 'https://github.com/big-admin',
    quote: 'เขียนโค้ดทุกวัน ดีบักทุกคืน แต่ก็มีความสุขครับ 😄',
    displaySeconds: 8,
  },
  {
    id: 'warp_thai_005',
    customerName: 'ครูสมหญิง',
    selfDisplayName: 'ครูสมหญิง 🌸',
    customerAvatar: 'https://i.pravatar.cc/300?img=44',
    productImage:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1470&auto=format&fit=crop',
    socialLink: 'https://facebook.com/teacher.somying',
    quote: 'สอนด้วยใจ เรียนด้วยรัก ขอให้ลูกศิษย์ทุกคนเก่งและดีน้า 💝',
    displaySeconds: 14,
  },
]

const fallbackSupporters: Supporter[] = [
  { customerName: 'รอคนแรกที่จะขึ้นจอ', totalAmount: 0, customerAvatar: null },
  { customerName: 'อันดับสองยังว่าง', totalAmount: 0, customerAvatar: null },
  { customerName: 'อันดับสามยังว่าง', totalAmount: 0, customerAvatar: null },
]
// ---------- THEME ----------
type ThemeKey = 'blue' | 'red' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan'

const THEME_CLASS_MAP: Record<ThemeKey, string> = {
  blue: 'backdrop-blur bg-blue-900/30  rounded-lg p-4 shadow-[0_0_2px_#3b82f6,inset_0_0_1px_#3b82f6,0_0_3px_#3b82f6,0_0_5px_#3b82f6,0_0_10px_#3b82f6] text-center',
  red: 'backdrop-blur bg-red-900/30   rounded-lg p-4 shadow-[0_0_2px_#ef4444,inset_0_0_1px_#ef4444,0_0_3px_#ef4444,0_0_5px_#ef4444,0_0_10px_#ef4444] text-center',
  emerald: 'backdrop-blur bg-emerald-900/30 rounded-lg p-4 shadow-[0_0_2px_#10b981,inset_0_0_1px_#10b981,0_0_3px_#10b981,0_0_5px_#10b981,0_0_10px_#10b981] text-center',
  violet: 'backdrop-blur bg-violet-900/30  rounded-lg p-4 shadow-[0_0_2px_#8b5cf6,inset_0_0_1px_#8b5cf6,0_0_3px_#8b5cf6,0_0_5px_#8b5cf6,0_0_10px_#8b5cf6] text-center',
  amber: 'backdrop-blur bg-amber-900/20 rounded-lg p-4 shadow-[0_0_2px_#f59e0b,inset_0_0_1px_#f59e0b,0_0_3px_#f59e0b,0_0_5px_#f59e0b,0_0_10px_#f59e0b] text-center',
  rose: 'backdrop-blur bg-rose-900/20 rounded-lg p-4 shadow-[0_0_2px_#f43f5e,inset_0_0_1px_#f43f5e,0_0_3px_#f43f5e,0_0_5px_#f43f5e,0_0_10px_#f43f5e] text-center',
  cyan: 'backdrop-blur bg-cyan-900/20 rounded-lg p-4 shadow-[0_0_2px_#06b6d4,inset_0_0_1px_#06b6d4,0_0_3px_#06b6d4,0_0_5px_#06b6d4,0_0_10px_#06b6d4] text-center',
}


// ---------- คอมโพเนนต์หลัก ----------
const TestOnePage = () => {
  const [theme, setTheme] = useState<ThemeKey>('blue')
  const temp = THEME_CLASS_MAP[theme]
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [selfWarpUrl, setSelfWarpUrl] = useState<string>('')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [currentWarp, setCurrentWarp] = useState<DisplayWarp | null>(null)
  const isFetchingWarpRef = useRef(false)
  const currentWarpRef = useRef<DisplayWarp | null>(null)
  const fetchNextWarpRef = useRef<() => void>(() => { })

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }),
    [])

  useEffect(() => {
    currentWarpRef.current = currentWarp
  }, [currentWarp])

  // ---------- การตั้งค่าระบบ ----------
  useEffect(() => {
    let isMounted = true

    const fetchSettings = async () => {
      if (MOCK_MODE) {
        if (!isMounted) return
        setSettings(MOCK_SETTINGS)
        return
      }
    }

    fetchSettings()
    const interval = setInterval(fetchSettings, 10000)

    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted) fetchSettings()
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settingsUpdated' && isMounted) {
        fetchSettings()
        localStorage.removeItem('settingsUpdated')
      }
    }

    const handleSettingsUpdate = () => {
      if (isMounted) fetchSettings()
    }

    window.addEventListener('settingsUpdated', handleSettingsUpdate)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      isMounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('settingsUpdated', handleSettingsUpdate)
    }
  }, [])

  const resolveMediaSource = useCallback((raw?: string | null) => {
    if (!raw) return null
    if (raw.startsWith('data:') || /^https?:\/\//i.test(raw)) return raw
    const trimmed = raw.trim()
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) return `data:image/jpeg;base64,${trimmed}`
    return raw
  }, [])

  const sanitizeName = useCallback((name: string) => {
    return name.trim()
  }, [])

  // ---------- คิววาร์ป ----------
  const fetchNextWarp = useCallback(async () => {
    if (isFetchingWarpRef.current || currentWarpRef.current) return
    isFetchingWarpRef.current = true

    try {
      if (MOCK_MODE) {
        const next = MOCK_WARPS_QUEUE.shift()
        if (next) {
          setCurrentWarp({ ...next })
          MOCK_WARPS_QUEUE.push({ ...next, id: next.id + '_' + Date.now() })
        }
        return
      }
    } catch (error) {
      console.error('ไม่สามารถดึงวาร์ปถัดไปได้', error)
    } finally {
      isFetchingWarpRef.current = false
    }
  }, [])

  const completeCurrentWarp = useCallback(async (transactionId: string) => {
    if (!transactionId) {
      setCurrentWarp(null)
      fetchNextWarpRef.current?.()
      return
    }

    try {
      // สำหรับโหมดจำลอง ไม่ต้องเรียก API
    } catch (error) {
      console.error('ไม่สามารถทำเครื่องหมายวาร์ปเสร็จสิ้นได้', error)
    } finally {
      setCurrentWarp(null)
      setTimeout(() => {
        fetchNextWarpRef.current?.()
      }, 500)
    }
  }, [])

  useEffect(() => {
    fetchNextWarpRef.current = fetchNextWarp
  }, [fetchNextWarp])

  useEffect(() => {
    if (!currentWarp) return

    const timeout = setTimeout(() => {
      completeCurrentWarp(currentWarp.id)
    }, currentWarp.displaySeconds * 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [currentWarp, completeCurrentWarp])

  // ---------- การเชื่อมต่อข้อมูล ----------
  useEffect(() => {
    if (typeof window === 'undefined') return

    let poller: ReturnType<typeof setInterval> | null = null

    const connectMockStreams = () => {
      poller = setInterval(() => {
        if (!currentWarpRef.current) fetchNextWarpRef.current?.()
      }, 6000) // ทุก 6 วินาที
    }

    if (MOCK_MODE) connectMockStreams()

    fetchNextWarpRef.current?.()

    return () => {
      if (poller) clearInterval(poller)
    }
  }, [])

  // ---------- อันดับผู้สนับสนุน ----------
  useEffect(() => {
    let isMounted = true
    let interval: ReturnType<typeof setInterval> | null = null

    if (typeof window !== 'undefined') {
      setSelfWarpUrl(`${window.location.origin}/self-warp`)
    }

    const fetchInitial = async () => {
      if (MOCK_MODE) {
        if (!isMounted) return
        const top3 = [...MOCK_SUPPORTERS_POOL]
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 3)
        setSupporters(top3)
        return
      }
    }

    const setupStream = () => {
      if (MOCK_MODE) {
        // จำลองการอัพเดตอันดับแบบสดๆ
        interval = setInterval(() => {
          if (!isMounted) return
          const pool = [...MOCK_SUPPORTERS_POOL]
          const idx = Math.floor(Math.random() * pool.length)
          pool[idx] = {
            ...pool[idx],
            totalAmount: pool[idx].totalAmount + [20, 50, 100, 150][Math.floor(Math.random() * 4)],
          }
          pool.sort((a, b) => b.totalAmount - a.totalAmount)
          setSupporters(pool.slice(0, 3))
        }, 5000) // ทุก 5 วินาที
        return
      }
    }

    fetchInitial()
    setupStream()

    return () => {
      isMounted = false
      if (interval) clearInterval(interval)
    }
  }, [])

  const hasLiveData = supporters.length > 0
  const supportersToDisplay = hasLiveData ? supporters : fallbackSupporters

  const backgroundImage = useMemo(() => {
    if (!settings?.backgroundImage) {
      return null
    }
    let imageUrl: string | null
    if (settings.backgroundImage.startsWith('/uploads/')) {
      imageUrl = `${window.location.origin}/api${settings.backgroundImage}`
    } else {
      imageUrl = resolveMediaSource(settings.backgroundImage)
    }
    return imageUrl
  }, [settings?.backgroundImage, resolveMediaSource])

  return (
    <>
      <div className="absolute z-50 left-4 top-4 flex gap-2">
        {(['blue', 'red', 'emerald', 'violet', 'amber', 'rose', 'cyan'] as ThemeKey[]).map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`text-white px-2 py-1 rounded border border-white/20 text-xs uppercase ${t === theme ? `bg-${theme}-500` : 'bg-black'}`}
            title={t}
          >
            {t}
          </button>
        ))}
      </div>
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0 blur-[15px] opacity-30 pointer-events-none no-repeat bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        />
      )}
      <div className="relative h-screen bg-black">
        <img src="/images/paper.png" alt="logo" className="h-[80%] object-contain absolute z-5 bottom-0 left-0 w-auto" />
        <GridLayout gap={8} rows={6} cols={12} showIndex devMode={false} style={{ height: "100%" }}>
          <Box startRow={1} startCol={4} rowSpan={6} colSpan={6}>
            <PromoSlider
              className={`relative rounded-lg text-center h-full ${temp}`}
              items={[
                { src: "/images/pro1.jpg", alt: "โปรโมชั่น-1" },
                { src: "/images/pro2.jpg", alt: "โปรโมชั่น-2" },
                { src: "/images/pro3.jpg", alt: "โปรโมชั่น-3" },
                { src: "/images/pro4.jpg", alt: "โปรโมชั่น-4" },
              ]}
            />
          </Box>
          <Box startRow={1} startCol={10} rowSpan={3} colSpan={3} className="">
            <div className={`relative h-full rounded-lg p-4 text-center ${temp}`}>
              {/* ส่วนบน: ชื่อฮอลล์ + สถานะฮอลล์ */}
              <div className="flex items-center justify-between">
                <h3 className="text-[clamp(14px,1vw,20px)] lg:text-xl xl:text-2xl font-semibold text-white">ฮอลล์ออฟเฟม</h3>
                <span className="rounded-full bg-white/15 px-2 py-0.5 lg:px-3 lg:py-1 xl:px-4 xl:py-1.5 text-[clamp(8px,0.6vw,12px)] lg:text-sm xl:text-base uppercase tracking-wide text-slate-100">
                  {supporters.length > 0 ? 'สด' : 'รอ'}
                </span>
              </div>

              {/* ส่วนล่าง: รายชื่อผู้สนับสนุน */}
              <ul className="mt-4 lg:mt-6 xl:mt-8 space-y-3 lg:space-y-4 xl:space-y-5">
                {supportersToDisplay.map((supporter, index) => {
                  const avatarUrl =
                    resolveMediaSource(supporter.customerAvatar) ||
                    `https://ui-avatars.com/api/?background=1e40af&color=fff&name=${encodeURIComponent(
                      supporter.customerName,
                    )}`
                  const isPlaceholder = supporter.totalAmount <= 0
                  const amountLabel = isPlaceholder ? 'รอเริ่มต้น' : currencyFormatter.format(supporter.totalAmount)

                  return (
                    <li key={`${supporter.customerName}-${index}`} className="flex items-center gap-3 lg:gap-4 xl:gap-5">
                      <div className="relative">
                        <img
                          src={avatarUrl as string}
                          alt={supporter.customerName}
                          className="h-[2.8vw] w-[2.8vw] min-h-[44px] min-w-[44px] max-h-[52px] max-w-[52px] lg:min-h-[56px] lg:min-w-[56px] lg:max-h-[64px] lg:max-w-[64px] xl:min-h-[68px] xl:min-w-[68px] xl:max-h-[76px] xl:max-w-[76px] rounded-full border border-white/25 object-cover"
                        />
                        <span className="absolute -left-2 -top-2 flex h-[1.8vw] w-[1.8vw] min-h-[28px] min-w-[28px] lg:min-h-[32px] lg:min-w-[32px] xl:min-h-[36px] xl:min-w-[36px] items-center justify-center rounded-full bg-blue-500 text-[clamp(10px,0.7vw,14px)] lg:text-base xl:text-lg font-semibold text-white">
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
                  )
                })}
              </ul>
              <div className="mt-3 lg:mt-4 xl:mt-5 rounded-xl border border-white/15 p-3 lg:p-4 xl:p-5 text-center text-[clamp(9px,0.7vw,12px)] lg:text-sm xl:text-base text-slate-200 temp ${temp}">
                {supporters.length > 0
                  ? 'เพิ่มเวลาวาร์ปเพื่อรักษาอันดับบนจอใหญ่'
                  : 'ยังไม่มีใครขึ้นจอ มาเป็นคนแรกกันเถอะ!'}
              </div>
            </div>
          </Box>
          <Box startRow={4} startCol={10} rowSpan={3} colSpan={3} className="items-center justify-center">
            <div className={`relative h-full rounded-lg p-4 text-center ${temp}`}>
              {selfWarpUrl ? (
                <div className='h-80 w-80 m-auto p-4 bg-white rounded-sm mb-4'>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(selfWarpUrl)}`}
                    alt="สแกนเพื่อแจกวาร์ป"
                    className="object-contain"
                  />
                </div>
              ) : null}
              <div className="flex-1 max-w-[60vw]">
                <p className="text-[clamp(12px,1.1vw,20px)] lg:text-xl xl:text-2xl font-semibold text-white">สแกนเพื่อแจกวาร์ป</p>
                <p className="mt-1 text-[clamp(10px,0.9vw,16px)] lg:text-lg xl:text-xl text-slate-300">เลือกเวลา ชำระเงิน ขึ้นจอได้ทันที</p>
              </div>
            </div>
          </Box>
          <Box startRow={1} startCol={3} rowSpan={6} colSpan={8}>
            <ModalWarp className={`p-4 ${temp}`} textColor={theme} />
          </Box>
        </GridLayout>
      </div>
    </>

  )
}

export default TestOnePage