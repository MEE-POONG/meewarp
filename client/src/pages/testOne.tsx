import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
    'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?q=80&w=1935&auto=format&fit=crop',
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

// ---------- คอมโพเนนต์หลัก ----------
const TestOnePage = () => {
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [selfWarpUrl, setSelfWarpUrl] = useState<string>('')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [currentWarp, setCurrentWarp] = useState<DisplayWarp | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [imageColors, setImageColors] = useState<{ primary: string; secondary: string } | null>(null)
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

  const extractImageColors = useCallback((imageUrl: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = 50
        canvas.width = size
        canvas.height = size

        ctx.drawImage(img, 0, 0, size, size)
        const imageData = ctx.getImageData(0, 0, size, size)
        const data = imageData.data

        const colors: { r: number; g: number; b: number; count: number }[] = []

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3
          if (brightness < 30 || brightness > 225) continue
          const existingColor = colors.find(
            (c) => Math.abs(c.r - r) < 20 && Math.abs(c.g - g) < 20 && Math.abs(c.b - b) < 20,
          )
          if (existingColor) {
            existingColor.r = (existingColor.r * existingColor.count + r) / (existingColor.count + 1)
            existingColor.g = (existingColor.g * existingColor.count + g) / (existingColor.count + 1)
            existingColor.b = (existingColor.b * existingColor.count + b) / (existingColor.count + 1)
            existingColor.count++
          } else {
            colors.push({ r, g, b, count: 1 })
          }
        }

        colors.sort((a, b) => b.count - a.count)

        if (colors.length > 0) {
          const primary = colors[0]
          const secondary = colors[1] || colors[0]
          const primaryColor = `rgb(${Math.round(primary.r)}, ${Math.round(primary.g)}, ${Math.round(primary.b)})`
          const secondaryColor = `rgb(${Math.round(secondary.r)}, ${Math.round(secondary.g)}, ${Math.round(secondary.b)})`
          setImageColors({ primary: primaryColor, secondary: secondaryColor })
        }
      } catch (error) {
        console.error('ข้อผิดพลาดในการดึงสี:', error)
      }
    }

    img.onerror = () => {
      console.error('ไม่สามารถโหลดรูปภาพสำหรับดึงสีได้')
    }

    img.src = imageUrl
  }, [])

  const formatSeconds = useCallback((value: number) => {
    const safe = Math.max(0, Math.floor(value))
    const minutes = Math.floor(safe / 60)
      .toString()
      .padStart(2, '0')
    const seconds = (safe % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
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
      setCountdown(0)
      fetchNextWarpRef.current?.()
      return
    }

    try {
      // สำหรับโหมดจำลอง ไม่ต้องเรียก API
    } catch (error) {
      console.error('ไม่สามารถทำเครื่องหมายวาร์ปเสร็จสิ้นได้', error)
    } finally {
      setCurrentWarp(null)
      setCountdown(0)
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
    setCountdown(currentWarp.displaySeconds)

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    const timeout = setTimeout(() => {
      completeCurrentWarp(currentWarp.id)
    }, currentWarp.displaySeconds * 1000)

    return () => {
      clearInterval(interval)
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

  const warpImage = useMemo(() => {
    if (!currentWarp) return null
    return (
      resolveMediaSource(currentWarp.productImage) ||
      resolveMediaSource(currentWarp.customerAvatar) ||
      `https://ui-avatars.com/api/?background=1e40af&color=fff&name=${encodeURIComponent(
        currentWarp.customerName,
      )}`
    )
  }, [currentWarp, resolveMediaSource])

  const countdownLabel = useMemo(() => formatSeconds(countdown), [countdown, formatSeconds])
  const totalDurationLabel = useMemo(
    () => (currentWarp ? formatSeconds(currentWarp.displaySeconds) : '00:00'),
    [currentWarp, formatSeconds],
  )

  const brandName = settings?.brandName || ''
  const tagline = settings?.tagline || ''

  const backgroundImage = useMemo(() => {
    if (!settings?.backgroundImage) {
      setImageColors(null)
      return null
    }
    let imageUrl: string | null
    if (settings.backgroundImage.startsWith('/uploads/')) {
      imageUrl = `${window.location.origin}/api${settings.backgroundImage}`
    } else {
      imageUrl = resolveMediaSource(settings.backgroundImage)
    }
    if (imageUrl) extractImageColors(imageUrl)
    return imageUrl
  }, [settings?.backgroundImage, resolveMediaSource, extractImageColors])

  const defaultPrimary = '#1e40af'
  const defaultSecondary = '#ec4899'
  const gradientPrimary = imageColors?.primary || defaultPrimary
  const gradientSecondary = imageColors?.secondary || defaultSecondary

  const toRgba = (color: string, alpha: number) => {
    if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
    if (color.startsWith('#')) {
      let hex = color.slice(1)
      if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
      const numeric = parseInt(hex, 16)
      const r = (numeric >> 16) & 255
      const g = (numeric >> 8) & 255
      const b = numeric & 255
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return color
  }

  return (
    <div
      className="relative flex min-h-screen w-screen overflow-hidden bg-blue-950 text-slate-100"
      style={
        backgroundImage
          ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: gradientPrimary || '#1e3a8a',
            backgroundClip: 'padding-box',
            backgroundOrigin: 'padding-box',
            backgroundAttachment: 'fixed',
          }
          : undefined
      }
    >
      {/* พื้นหลังเบลอ */}
      {backgroundImage && (
        <div
          className="pointer-events-none fixed inset-0 -z-20"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(15px)',
            transform: 'scale(1.05)',
            opacity: 0.3,
            backgroundClip: 'padding-box',
            backgroundOrigin: 'padding-box',
          }}
        />
      )}

      {/* เลเยอร์การไล่สี */}
      {backgroundImage && (
        <div
          className="pointer-events-none fixed inset-0 -z-20"
          style={{
            background: `radial-gradient(ellipse at center, transparent 0%, transparent 35%, ${toRgba(
              gradientPrimary,
              0.85,
            )} 65%, ${toRgba(gradientPrimary, 1)} 100%)`,
            opacity: 0.9,
          }}
        />
      )}

      {/* พื้นหลังไล่สีพื้นฐาน */}
      <div
        className="pointer-events-none fixed inset-0 -z-30 opacity-75"
        style={{
          background: `radial-gradient(120% 120% at 20% 15%, ${toRgba(
            gradientPrimary,
            0.6,
          )} 0%, transparent 65%), radial-gradient(120% 120% at 80% 85%, ${toRgba(
            gradientSecondary,
            0.55,
          )} 0%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-30 opacity-65 mix-blend-screen"
        style={{
          background: `radial-gradient(140% 140% at 50% 110%, ${toRgba(
            gradientSecondary,
            0.4,
          )} 0%, transparent 60%)`,
        }}
      />

      {/* หน้าจอแสดงวาร์ป */}
      {currentWarp ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
          <div className="pointer-events-auto w-full max-w-[800px] lg:max-w-[1200px] xl:max-w-[1400px] rounded-[32px] border-2 border-blue-400/25 bg-gradient-to-br from-white/20 to-blue-500/10 p-6 shadow-[0_40px_120px_rgba(30,64,175,0.7)] backdrop-blur-2xl sm:p-10 lg:p-16 xl:p-20 ring-4 ring-blue-400/15">
            <div className="grid gap-6 sm:gap-8 lg:gap-10 xl:gap-12 sm:grid-cols-[350px_1fr] lg:grid-cols-[450px_1fr] xl:grid-cols-[550px_1fr] sm:items-start">
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-[24px] border-4 border-blue-400/70 bg-blue-900/60 shadow-[0_35px_100px_rgba(30,64,175,0.8)] ring-8 ring-blue-400/40 sm:rounded-[32px] transform hover:scale-[1.02] transition-all duration-500">
                  {warpImage ? (
                    <img src={warpImage as string} alt={currentWarp.customerName} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-900/70 text-slate-100">
                      มีวาร์ป
                    </div>
                  )}
                  <span className="absolute left-4 top-4 lg:left-6 lg:top-6 xl:left-8 xl:top-8 rounded-full bg-blue-500/95 backdrop-blur-sm px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-sm lg:text-base xl:text-lg font-bold text-white shadow-xl ring-2 ring-blue-300/60">
                    {countdownLabel}
                  </span>
                  <div className="absolute inset-0 rounded-[24px] bg-gradient-to-t from-blue-900/35 via-transparent to-blue-500/15 pointer-events-none sm:rounded-[32px]"></div>
                  <div className="absolute inset-0 rounded-[24px] ring-2 ring-blue-400/25 pointer-events-none sm:rounded-[32px]"></div>
                </div>
                {currentWarp.quote ? (
                  <div className="rounded-xl border border-blue-400/25 bg-gradient-to-r from-blue-500/10 to-blue-600/10 p-4 lg:p-5 xl:p-6 backdrop-blur-sm">
                    <p className="text-sm lg:text-base xl:text-lg font-medium text-blue-100 italic text-center leading-relaxed line-clamp-3">
                      "{currentWarp.quote}"
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="space-y-4 lg:space-y-5 xl:space-y-6 text-left">
                <div className="min-w-0">
                  <p className="text-sm lg:text-base xl:text-lg uppercase tracking-[0.4em] text-blue-300 font-bold">คนดังประจำวัน</p>
                  <h2
                    className="mt-3 text-[clamp(2rem,8vw,7rem)] font-black text-white drop-shadow-lg truncate max-w-full"
                    title={currentWarp.selfDisplayName || currentWarp.customerName}
                  >
                    {sanitizeName(currentWarp.selfDisplayName || currentWarp.customerName)}
                  </h2>
                </div>
                {currentWarp.socialLink ? (
                  <div className="flex flex-col items-center gap-2 lg:gap-3 xl:gap-4 rounded-xl border border-blue-400/25 bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-3 lg:p-4 xl:p-5 backdrop-blur-sm">
                    <div className="h-16 w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 overflow-hidden rounded-lg border border-blue-400/40 bg-white/95 shadow-[0_8px_25px_rgba(59,130,246,0.3)]">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(currentWarp.socialLink)}`}
                        alt="คิวอาร์โค้ดสำหรับลิงก์โซเชียล"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="text-xs lg:text-sm font-medium text-blue-200 text-center">สแกนเพื่อติดตาม</p>
                  </div>
                ) : null}
                <div className="flex items-center gap-4 lg:gap-6 xl:gap-8 rounded-2xl border-2 border-blue-400/25 bg-gradient-to-r from-blue-500/15 to-blue-600/10 p-5 lg:p-6 xl:p-8 backdrop-blur-sm">
                  <div className="rounded-xl border border-blue-400/70 bg-blue-500/30 px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-xs lg:text-sm xl:text-base uppercase tracking-[0.3em] text-blue-100 font-bold shadow-lg ring-2 ring-blue-400/40">
                    เวลาที่เหลือ
                  </div>
                  <span className="text-2xl lg:text-4xl xl:text-5xl font-bold text-blue-100 drop-shadow-lg">{countdownLabel}</span>
                </div>
                <p className="text-sm lg:text-base xl:text-lg font-medium text-slate-200 bg-white/10 rounded-xl px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-center">
                  เวลาที่ซื้อทั้งหมด <span className="text-blue-300 font-bold">{totalDurationLabel}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* หัวข้อหลัก */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-[5vw]">
        <div className="flex max-w-[60vw] lg:max-w-[70vw] xl:max-w-[80vw] flex-col items-center text-center">
          <span className="mb-4 text-[clamp(16px,1.3vw,24px)] lg:text-2xl xl:text-3xl uppercase tracking-[0.5em] text-blue-300">
            {tagline}
          </span>
          <h1 className="font-display text-[clamp(72px,10vw,160px)] lg:text-[180px] xl:text-[220px] font-black leading-none text-white drop-shadow-[0_0_35px_rgba(59,130,246,0.6)]">
            {brandName}
          </h1>
        </div>
      </div>

      {/* คิวอาร์โค้ดสำหรับแจกวาร์ป */}
      <div className="pointer-events-auto absolute left-[2vw] bottom-[2vh] z-10 max-w-[85vw] sm:left-[4vw] sm:bottom-[4vh] rounded-3xl p-[1.6vw] lg:p-[2vw] xl:p-[2.5vw] backdrop-blur">
        <div className="flex items-center gap-4 lg:gap-6 xl:gap-8">
          <div className="h-[12vw] w-[12vw] min-h-[100px] min-w-[100px] max-h-[180px] max-w-[160px] lg:max-w-[200px] xl:max-w-[240px] overflow-hidden rounded-2xl p-2 lg:p-4 xl:p-5 shadow-[0_35px_100px_rgba(30,64,175,0.6)] backdrop-blur">
            {selfWarpUrl ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(selfWarpUrl)}`}
                alt="สแกนเพื่อแจกวาร์ป"
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
          <div className="flex-1 max-w-[60vw]">
            <p className="text-[clamp(12px,1.1vw,20px)] lg:text-xl xl:text-2xl font-semibold text-white">สแกนเพื่อแจกวาร์ป</p>
            <p className="mt-1 text-[clamp(10px,0.9vw,16px)] lg:text-lg xl:text-xl text-slate-300">เลือกเวลา ชำระเงิน ขึ้นจอได้ทันที</p>
          </div>
        </div>
      </div>

      {/* อันดับผู้สนับสนุน */}
      <div className="pointer-events-auto absolute right-[4vw] top-[6vh] w-[25vw] min-w-[260px] max-w-[320px] lg:max-w-[400px] xl:max-w-[480px] rounded-2xl border border-white/15 bg-white/10 p-4 lg:p-6 xl:p-8 shadow-[0_25px_60px_rgba(30,64,175,0.5)] backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="text-[clamp(14px,1vw,20px)] lg:text-xl xl:text-2xl font-semibold text-white">ฮอลล์ออฟเฟม</h3>
          <span className="rounded-full bg-white/15 px-2 py-0.5 lg:px-3 lg:py-1 xl:px-4 xl:py-1.5 text-[clamp(8px,0.6vw,12px)] lg:text-sm xl:text-base uppercase tracking-wide text-slate-100">
            {supporters.length > 0 ? 'สด' : 'รอ'}
          </span>
        </div>
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
        <div className="mt-3 lg:mt-4 xl:mt-5 rounded-xl border border-white/15 bg-white/10 p-3 lg:p-4 xl:p-5 text-center text-[clamp(9px,0.7vw,12px)] lg:text-sm xl:text-base text-slate-200">
          {supporters.length > 0
            ? 'เพิ่มเวลาวาร์ปเพื่อรักษาอันดับบนจอใหญ่'
            : 'ยังไม่มีใครขึ้นจอ มาเป็นคนแรกกันเถอะ!'}
        </div>
      </div>
    </div>
  )
}

export default TestOnePage