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
    '/images/image.png',
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
const TestTwoPage = () => {
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
    <>
      <div className="relative flex min-h-screen w-screen overflow-hidden bg-black text-slate-100">
        {/* พื้นหลังเบลอ */}
        {backgroundImage && (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'blur(5px)',
              transform: 'scale(1.05)',
              opacity: 0.25,
            }}
          />
        )}

        <div className="absolute inset-0 z-10 aspect-square mx-auto flex h-screen items-center justify-center p-4 ">
          <div
            className={`
            relative w-full h-full flex items-center justify-center 
            bg-cover bg-center rounded-lg
            border-[2px] border-red-300
            ${backgroundImage ? `bg-[url(${backgroundImage})]` : 'bg-blue-500'}
            shadow-[0_0_2px_#f00,inset_0_0_2px_#f00,0_0_5px_#f00,0_0_15px_#f00,0_0_15px_#f00]
          `}
          //   className={`relative bg-cover bg-center w-full h-full 
          //  ${backgroundImage ? `bg-[url(${backgroundImage})]` : 'bg-blue-500'} border-red-200 shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#08f,0_0_15px_#08f,0_0_30px_#08f]`}
          >

            {/* border ชั้นนอกสุด (แดงอีกชั้น) */}
            {/* <div className="absolute inset-2 rounded-md border-[3px] border-red-500" /> */}

            {/* เนื้อหา */}
            <h1 className="relative z-10 text-6xl font-bold text-white drop-shadow-[0_0_25px_rgba(255,0,150,0.8)]">
              Neon Border ✨
            </h1>
          </div>
        </div>

        {/* อันดับผู้สนับสนุน */}
        <div className="pointer-events-auto absolute right-[4vw] top-4 w-[25vw] min-w-[260px] max-w-[320px] lg:max-w-[400px] xl:max-w-[380px] rounded-2xl border border-white/15 bg-white/10 p-4 lg:p-6 xl:p-8 shadow-[0_25px_60px_rgba(30,64,175,0.5)] backdrop-blur">
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

    </>
  )
}

export default TestTwoPage