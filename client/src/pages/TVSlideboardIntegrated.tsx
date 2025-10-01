// TVSlideboardIntegrated.tsx
// Integrated with your MOCK MODE + warp queue + supporters logic
// Layout: 6x8 Grid — Left menu, Center spotlight, Top-right QR, Mid-right Hall of Fame, Bottom ticker
// Tech: React + Tailwind (no external deps required). QR uses api.qrserver.com

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/************************************
 * MOCK MODE & DUMMY DATA (from you)
 ***********************************/
const MOCK_MODE = true

// Background SVG data-uri (indigo/violet, CORS-safe)
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
`)
const MOCK_BG_DATA_URL = `data:image/svg+xml;charset=utf-8,${MOCK_BG_SVG}`

type Supporter = {
  customerName: string
  totalAmount: number
  customerAvatar?: string | null
  totalSeconds?: number
}

type AppSettings = {
  brandName?: string
  tagline?: string
  primaryColor?: string
  backgroundImage?: string
  logo?: string
}

type DisplayWarp = {
  id: string
  customerName: string
  customerAvatar?: string | null
  socialLink: string
  quote?: string | null
  displaySeconds: number
  productImage?: string | null
  selfDisplayName?: string | null
}

const mockSettings: AppSettings = {
  brandName: 'MeeWarp',
  tagline: 'Community Digital — Indigo/Violet',
  primaryColor: '#4f46e5',
  backgroundImage: MOCK_BG_DATA_URL,
  logo: '',
}

const mockSupportersSeed: Supporter[] = [
  { customerName: 'คุณอินดิโก้', totalAmount: 1590, customerAvatar: null },
  { customerName: 'คุณไวโอเล็ต', totalAmount: 980, customerAvatar: null },
  { customerName: 'คุณสกาย', totalAmount: 720, customerAvatar: null },
]

const fallbackSupporters: Supporter[] = [
  { customerName: 'รอการสนับสนุน', totalAmount: 0, customerAvatar: null },
  { customerName: 'ยังว่างอันดับ 2', totalAmount: 0, customerAvatar: null },
  { customerName: 'ยังว่างอันดับ 3', totalAmount: 0, customerAvatar: null },
]

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
]

/***************************
 * Utilities
 **************************/ 
function cn(...args: Array<string | undefined | false>) {
  return args.filter(Boolean).join(' ')
}

const toRgba = (color: string, alpha: number) => {
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  }
  if (color.startsWith('#')) {
    let hex = color.slice(1)
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
    const num = parseInt(hex, 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return color
}

/***************************
 * Grid Layout Primitives
 **************************/ 
interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  rows: number
  cols: number
  gap?: number
  showGrid?: boolean
  showIndex?: boolean
}

function GridLayout({ rows, cols, gap = 8, showGrid, showIndex, style, className, children, ...rest }: GridLayoutProps) {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap,
    ...style,
  }
  return (
    <div style={gridStyle} className={cn('relative', className)} {...rest}>
      {showGrid && <GridOverlay rows={rows} cols={cols} showIndex={!!showIndex} />}
      {children}
    </div>
  )
}

function GridOverlay({ rows, cols, showIndex }: { rows: number; cols: number; showIndex: boolean }) {
  const cells: React.ReactNode[] = []
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      cells.push(
        <div key={`g-${r}-${c}`} style={{ gridRow: `${r} / ${r + 1}`, gridColumn: `${c} / ${c + 1}` }} className={cn('border border-dashed border-white/15 text-[10px] p-1 pointer-events-none')}>
          {showIndex && <span className="text-white/50 select-none">{r},{c}</span>}
        </div>
      )
    }
  }
  return <>{cells}</>
}

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  startRow: number
  startCol: number
  rowSpan?: number
  colSpan?: number
}

function Box({ startRow, startCol, rowSpan = 1, colSpan = 1, style, className, children, ...rest }: BoxProps) {
  const gridStyle: React.CSSProperties = {
    gridRow: `${startRow} / ${startRow + rowSpan}`,
    gridColumn: `${startCol} / ${startCol + colSpan}`,
    ...style,
  }
  return (
    <div style={gridStyle} className={cn('relative', className)} {...rest}>
      {children}
    </div>
  )
}

/***************************
 * Section Components
 **************************/ 
function FoodMenu({ items }: { items: { name: string; price: number; tag?: string }[] }) {
  return (
    <div className="h-full w-full rounded-2xl bg-black/35 backdrop-blur-sm border border-white/10 p-3 flex flex-col">
      <h2 className="text-xl md:text-2xl font-bold tracking-wide">เมนูแนะนำ</h2>
      <div className="mt-2 h-px bg-white/10" />
      <ul className="mt-3 space-y-2 overflow-y-auto pr-2 custom-scroll">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between py-1.5">
            <div className="truncate">
              <span className="text-base md:text-lg font-medium">{it.name}</span>
              {it.tag && <span className="ml-2 text-xs rounded bg-white/10 px-2 py-0.5">{it.tag}</span>}
            </div>
            <span className="text-base md:text-lg font-semibold tabular-nums">฿{it.price.toFixed(0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function WarpSpotlight({ warp, countdownLabel, totalDurationLabel }: { warp: DisplayWarp; countdownLabel: string; totalDurationLabel: string }) {
  // pick image
  const warpImage = useMemo(() => {
    const resolveMediaSource = (raw?: string | null) => {
      if (!raw) return null
      if (raw.startsWith('data:') || /^https?:\/\//i.test(raw)) return raw
      const trimmed = raw.trim()
      if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) return `data:image/jpeg;base64,${trimmed}`
      return raw
    }
    return (
      resolveMediaSource(warp.productImage) ||
      resolveMediaSource(warp.customerAvatar) ||
      `https://ui-avatars.com/api/?background=1e1b4b&color=fff&name=${encodeURIComponent(warp.customerName)}`
    )
  }, [warp])

  const sanitizeName = (name: string) => name.replace(/[^฀-๿ -~]/g, '').trim()

  return (
    <div className="h-full w-full rounded-2xl bg-black/35 backdrop-blur-sm border border-white/10 p-4 overflow-hidden">
      <div className="grid gap-4 h-full grid-cols-1 md:grid-cols-[minmax(240px,0.9fr)_1.1fr]">
        <div className="relative aspect-square md:aspect-auto md:h-full rounded-2xl overflow-hidden ring-2 ring-emerald-400/30 border border-emerald-400/30 bg-slate-900/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={warpImage || ''} alt={warp.customerName} className="w-full h-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-3 py-1 text-sm font-bold tracking-[0.25em]">{countdownLabel}</span>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-emerald-900/30 via-transparent to-transparent"/>
        </div>
        <div className="min-w-0 flex flex-col gap-3">
          <p className="uppercase tracking-[0.35em] text-emerald-300 text-xs md:text-sm font-bold">Warp Spotlight</p>
          <h2 className="text-3xl md:text-5xl font-black truncate" title={warp.selfDisplayName || warp.customerName}>
            {sanitizeName(warp.selfDisplayName || warp.customerName)}
          </h2>
          {warp.quote && (
            <p className="text-sm md:text-base italic text-emerald-100/90 bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3 line-clamp-3">"{warp.quote}"</p>
          )}
          {warp.socialLink && (
            <div className="mt-auto flex items-center gap-3">
              <div className="h-20 w-20 overflow-hidden rounded-lg border border-emerald-400/30 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(warp.socialLink)}`}
                  alt="QR Social"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="text-xs md:text-sm opacity-90">สแกนไปยังลิงก์โซเชียล</div>
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs uppercase tracking-[0.25em] bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-3 py-1">Time Left</span>
            <span className="text-2xl md:text-3xl font-bold text-emerald-100">{countdownLabel}</span>
            <span className="ml-auto text-xs opacity-80">รวม {totalDurationLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function HallOfFame({ supporters, currencyFormatter }: { supporters: Supporter[]; currencyFormatter: Intl.NumberFormat }) {
  const hasLiveData = supporters.some((s) => s.totalAmount > 0)
  return (
    <div className="h-full w-full rounded-2xl bg-black/35 backdrop-blur-sm border border-white/10 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg md:text-xl font-semibold">Warp Hall of Fame</h3>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide">{hasLiveData ? 'Live' : 'Standby'}</span>
      </div>
      <ul className="mt-3 space-y-2 overflow-y-auto pr-2 custom-scroll">
        {supporters.map((s, i) => {
          const avatarUrl = `https://ui-avatars.com/api/?background=312e81&color=fff&name=${encodeURIComponent(s.customerName)}`
          const isPlaceholder = s.totalAmount <= 0
          const amountLabel = isPlaceholder ? 'รอเริ่มต้น' : currencyFormatter.format(s.totalAmount)
          return (
            <li key={`${s.customerName}-${i}`} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt={s.customerName} className="h-10 w-10 rounded-full border border-white/20 object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.customerName}</p>
                <p className="text-xs opacity-80">{amountLabel}</p>
              </div>
              <span className="text-xs opacity-70">#{i + 1}</span>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 rounded-lg border border-white/10 bg-white/10 p-2 text-center text-xs">
        {hasLiveData ? 'เพิ่มเวลาวาร์ปของคุณเพื่อรักษาอันดับบนจอหลัก' : 'ยังไม่มีใครขึ้นจอ ลองเป็นคนแรกที่ปล่อยวาร์ปดูไหม?'}
      </div>
    </div>
  )
}

function WarpQR({ url, title = 'สแกนเพื่อขอขึ้นวาร์ป' }: { url: string; title?: string }) {
  return (
    <div className="h-full w-full rounded-2xl bg-black/35 backdrop-blur-sm border border-white/10 p-3 flex flex-col">
      <h3 className="text-lg md:text-xl font-bold">{title}</h3>
      <div className="mt-2 h-full grid place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}`}
          alt="QR Request"
          className="max-h-full max-w-full rounded-xl bg-white p-2"
        />
      </div>
      <div className="mt-2 text-xs opacity-80 truncate">{url}</div>
    </div>
  )
}

function Ticker({ text, speed = 50 }: { text: string; speed?: number }) {
  return (
    <div className="h-full w-full rounded-xl bg-black/45 border border-white/10 overflow-hidden">
      <div className="whitespace-nowrap animate-[marquee_linear_infinite] will-change-transform py-2">
        <span className="mx-6 text-lg md:text-2xl font-semibold">{text}</span>
        <span className="mx-6 text-lg md:text-2xl font-semibold">{text}</span>
        <span className="mx-6 text-lg md:text-2xl font-semibold">{text}</span>
      </div>
      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0%);} 100% { transform: translateX(-50%);} }
        .animate-\[marquee_linear_infinite\] { animation: marquee ${Math.max(10, Math.min(60, 200 - speed))}s linear infinite; }
      `}</style>
    </div>
  )
}

/***************************
 * Main Integrated Screen
 **************************/ 
export default function TVSlideboardIntegrated() {
  // ====== state from your TestLandingPage logic ======
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [selfWarpUrl, setSelfWarpUrl] = useState<string>('')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [currentWarp, setCurrentWarp] = useState<DisplayWarp | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [imageColors, setImageColors] = useState<{ primary: string; secondary: string } | null>(null)

  const isFetchingWarpRef = useRef(false)
  const currentWarpRef = useRef<DisplayWarp | null>(null)
  const fetchNextWarpRef = useRef<() => void>(() => {})
  const mockWarpIndexRef = useRef<number>(0)

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }), [])

  useEffect(() => { currentWarpRef.current = currentWarp }, [currentWarp])

  // SETTINGS mock + flip tagline
  useEffect(() => {
    let isMounted = true
    const load = () => { if (!isMounted) return; if (MOCK_MODE) { setSettings(mockSettings); return } }
    load()
    const iv = setInterval(() => {
      if (!isMounted || !MOCK_MODE) return
      setSettings((prev) => {
        if (!prev) return mockSettings
        const flip = prev.tagline?.includes('—') ? 'Community Digital' : 'Community Digital — Indigo/Violet'
        return { ...prev, tagline: flip }
      })
    }, 10000)
    return () => { isMounted = false; clearInterval(iv) }
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
        const { data } = ctx.getImageData(0, 0, size, size)
        const colors: { r: number; g: number; b: number; count: number }[] = []
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]; const g = data[i + 1]; const b = data[i + 2]
          const brightness = (r + g + b) / 3
          if (brightness < 30 || brightness > 225) continue
          const existing = colors.find((c) => Math.abs(c.r - r) < 20 && Math.abs(c.g - g) < 20 && Math.abs(c.b - b) < 20)
          if (existing) { existing.r = (existing.r * existing.count + r) / (existing.count + 1); existing.g = (existing.g * existing.count + g) / (existing.count + 1); existing.b = (existing.b * existing.count + b) / (existing.count + 1); existing.count++ }
          else { colors.push({ r, g, b, count: 1 }) }
        }
        colors.sort((a, b) => b.count - a.count)
        if (colors.length > 0) {
          const p = colors[0]; const s = colors[1] || colors[0]
          setImageColors({ primary: `rgb(${Math.round(p.r)}, ${Math.round(p.g)}, ${Math.round(p.b)})`, secondary: `rgb(${Math.round(s.r)}, ${Math.round(s.g)}, ${Math.round(s.b)})` })
        }
      } catch {}
    }
    img.onerror = () => {}
    img.src = imageUrl
  }, [])

  const formatSeconds = useCallback((value: number) => {
    const safe = Math.max(0, Math.floor(value))
    const minutes = Math.floor(safe / 60).toString().padStart(2, '0')
    const seconds = (safe % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [])

  // Fetch next warp (mock queue)
  const fetchNextWarp = useCallback(async () => {
    if (isFetchingWarpRef.current || currentWarpRef.current) return
    isFetchingWarpRef.current = true
    try {
      if (MOCK_MODE) {
        const idx = mockWarpIndexRef.current % mockWarpQueue.length
        const data = mockWarpQueue[idx]
        mockWarpIndexRef.current = (mockWarpIndexRef.current + 1) % mockWarpQueue.length
        setCurrentWarp({
          id: data.id,
          customerName: data.customerName,
          customerAvatar: data.customerAvatar || null,
          socialLink: data.socialLink || '',
          quote: data.quote || null,
          displaySeconds: Math.max(1, Number(data.displaySeconds) || 15),
          productImage: data.productImage || null,
          selfDisplayName: data.selfDisplayName || null,
        })
        return
      }
    } finally {
      isFetchingWarpRef.current = false
    }
  }, [])

  const completeCurrentWarp = useCallback(async (transactionId: string) => {
    setCurrentWarp(null)
    setCountdown(0)
    setTimeout(() => { fetchNextWarpRef.current?.() }, 500)
  }, [])

  useEffect(() => { fetchNextWarpRef.current = fetchNextWarp }, [fetchNextWarp])

  // Timer & auto-complete
  useEffect(() => {
    if (!currentWarp) return
    setCountdown(currentWarp.displaySeconds)
    const interval = setInterval(() => setCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000)
    const timeout = setTimeout(() => completeCurrentWarp(currentWarp.id), currentWarp.displaySeconds * 1000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [currentWarp, completeCurrentWarp])

  // Self URL + initial polling
  useEffect(() => {
    if (typeof window !== 'undefined') setSelfWarpUrl(`${window.location.origin}/self-warp`)
    fetchNextWarpRef.current?.()
    const poller = setInterval(() => { if (!currentWarpRef.current) fetchNextWarpRef.current?.() }, 15000)
    return () => clearInterval(poller)
  }, [])

  // Supporters mock updates
  useEffect(() => {
    let isMounted = true
    if (MOCK_MODE) {
      setSupporters(mockSupportersSeed)
      const iv = setInterval(() => {
        if (!isMounted) return
        setSupporters((prev) => {
          const next = [...prev]
          if (next.length === 0) return mockSupportersSeed
          const i = Math.floor(Math.random() * next.length)
          const bump = Math.random() < 0.5 ? 20 : 50
          next[i] = { ...next[i], totalAmount: next[i].totalAmount + bump }
          next.sort((a, b) => b.totalAmount - a.totalAmount)
          return next.slice(0, 3)
        })
      }, 6000)
      return () => { isMounted = false; clearInterval(iv) }
    }
    return () => {}
  }, [])

  // Background colors
  const bgImageUrl = useMemo(() => {
    const src = settings?.backgroundImage || null
    if (!src) { setImageColors(null); return null }
    const imageUrl = resolveMediaSource(src) || null
    if (imageUrl) extractImageColors(imageUrl)
    return imageUrl
  }, [settings?.backgroundImage, resolveMediaSource, extractImageColors])

  const defaultPrimary = '#6366f1'
  const defaultSecondary = '#f472b6'
  const gradientPrimary = imageColors?.primary || defaultPrimary
  const gradientSecondary = imageColors?.secondary || defaultSecondary

  // Derived labels
  const countdownLabel = useMemo(() => formatSeconds(countdown), [countdown, formatSeconds])
  const totalDurationLabel = useMemo(() => (currentWarp ? formatSeconds(currentWarp.displaySeconds) : '00:00'), [currentWarp, formatSeconds])

  // Demo food list (you can replace with API later)
  const foodItems = useMemo(() => [
    { name: 'ปีกไก่ทอดเกลือ', price: 129, tag: 'Best' },
    { name: 'นักเก็ตไก่', price: 99 },
    { name: 'เฟรนช์ฟรายส์ชีส', price: 129 },
    { name: 'ยำหมูยอไข่แดง', price: 159, tag: 'Spicy' },
    { name: 'เอ็นไก่ทอด', price: 119 },
    { name: 'คอหมูย่างจิ้มแจ่ว', price: 149 },
    { name: 'หมูทอดน้ำปลา', price: 119 },
    { name: 'ไส้กรอกค็อกเทล', price: 109 },
    { name: 'ข้าวผัดหมู', price: 79 },
  ], [])

  // Brand
  const brandName = settings?.brandName || ''
  const tagline = settings?.tagline || ''

  return (
    <div
      className="relative h-screen w-screen text-slate-100"
      style={bgImageUrl ? { backgroundImage: `url(${bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: gradientPrimary, backgroundAttachment: 'fixed' } : undefined}
    >
      {/* Ambient overlays */}
      {bgImageUrl && (
        <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: `radial-gradient(120% 120% at 15% 20%, ${toRgba(gradientPrimary, 0.55)} 0%, transparent 70%), radial-gradient(120% 120% at 85% 80%, ${toRgba(gradientSecondary, 0.5)} 0%, transparent 72%)` }} />
      )}

      <div className="h-full p-4">
        <GridLayout rows={6} cols={8} gap={12} showGrid={false} showIndex={false} style={{ height: '100%' }}>
          {/* Left rail: Food menu (full height, 2 columns) */}
          <Box startRow={1} startCol={1} rowSpan={6} colSpan={2}>
            <FoodMenu items={foodItems} />
          </Box>

          {/* Center: Warp Spotlight (or brand fallback) */}
          <Box startRow={1} startCol={3} rowSpan={4} colSpan={4}>
            {currentWarp ? (
              <WarpSpotlight warp={currentWarp} countdownLabel={countdownLabel} totalDurationLabel={totalDurationLabel} />
            ) : (
              <div className="h-full w-full rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 grid place-items-center text-center p-6">
                <div>
                  <div className="text-indigo-300 uppercase tracking-[0.5em] text-sm md:text-base">{tagline}</div>
                  <div className="mt-2 text-4xl md:text-6xl font-black">{brandName}</div>
                  <div className="mt-4 text-xs opacity-80">ยังไม่มีวาร์ปในคิว — สแกนที่ QR เพื่อขอขึ้นจอ</div>
                </div>
              </div>
            )}
          </Box>

          {/* Top-right: QR for self-warp request */}
          <Box startRow={1} startCol={7} rowSpan={2} colSpan={2}>
            <WarpQR url={selfWarpUrl || 'https://example.com/self-warp'} />
          </Box>

          {/* Mid-right: Hall of Fame (supporters) */}
          <Box startRow={3} startCol={7} rowSpan={2} colSpan={2}>
            <HallOfFame supporters={supporters.length ? supporters : fallbackSupporters} currencyFormatter={currencyFormatter} />
          </Box>

          {/* Bottom span: Ticker */}
          <Box startRow={5} startCol={3} rowSpan={2} colSpan={6}>
            <Ticker text={`แจ้งข่าว: คืนนี้ดนตรีสด 20:30 | โปรเบียร์ 3 ฟรี 1 | สแกน QR เพื่อขึ้นวาร์ปได้เลยที่ ${selfWarpUrl || 'หน้าเว็บของร้าน'}`} />
          </Box>
        </GridLayout>
      </div>
    </div>
  )
}

// ---------- Tailwind helpers ----------
// .custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.25) transparent; }
// .custom-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
// .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 999px; }
