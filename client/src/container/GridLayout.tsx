// GridLayout.tsx
import React, { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";

type GridLayoutProps = PropsWithChildren<{
  rows?: number;
  cols?: number;
  gap?: number;
  showGrid?: boolean;
  className?: string;
  style?: React.CSSProperties;
}>;

// --- Context: ให้ Box รู้ขนาดกริดเพื่อ clamp ---
const GridMetaCtx = createContext<{ rows: number; cols: number }>({ rows: 2, cols: 12 });
const useGridMeta = () => useContext(GridMetaCtx);

export function GridLayout({
  rows = 2,
  cols = 12,
  gap = 8,
  showGrid = true,
  className = "",
  style,
  children,
}: GridLayoutProps) {
  const cssVars: React.CSSProperties = {
    ['--rows' as any]: rows,
    ['--cols' as any]: cols,
    ['--gap'  as any]: `${gap}px`,
  };

  return (
    <div
      className={`relative rounded-lg border border-black/10 h-full ${className}`}
      style={{
        // กันผลข้างเคียงจากสไตล์ลูก
        isolation: "isolate",
        contain: "layout style paint",
        ...style,
      }}
    >
      <GridMetaCtx.Provider value={{ rows, cols }}>
        <div
          className="relative grid h-full w-full"
          style={{
            ...cssVars,
            display: "grid",
            gap,
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {showGrid && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 block"
              style={{
                ['--cw' as any]: `calc((100% - ( (var(--cols) - 1) * var(--gap) )) / var(--cols))`,
                ['--ch' as any]: `calc((100% - ( (var(--rows) - 1) * var(--gap) )) / var(--rows))`,
                backgroundImage: `
                  repeating-linear-gradient(
                    to bottom,
                    transparent,
                    transparent calc(var(--ch)),
                    rgba(0,0,0,0.12) calc(var(--ch)),
                    rgba(0,0,0,0.12) calc(var(--ch) + 1px),
                    transparent calc(var(--ch) + 1px),
                    transparent calc(var(--ch) + 1px + var(--gap))
                  ),
                  repeating-linear-gradient(
                    to right,
                    transparent,
                    transparent calc(var(--cw)),
                    rgba(0,0,0,0.12) calc(var(--cw)),
                    rgba(0,0,0,0.12) calc(var(--cw) + 1px),
                    transparent calc(var(--cw) + 1px),
                    transparent calc(var(--cw) + 1px + var(--gap))
                  )
                `,
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
              }}
            />
          )}

          {children}
        </div>
      </GridMetaCtx.Provider>
    </div>
  );
}

type BoxProps = {
  /** จุดเริ่ม (นับจาก 1) */
  startRow: number;
  startCol: number;
  /** span (จะถูกหักส่วนเกินให้อัตโนมัติ) */
  rowSpan?: number;
  colSpan?: number;
  /** สไตล์ของ "เนื้อใน" เท่านั้น ไม่กระทบเฟรมกริด */
  className?: string;
  style?: React.CSSProperties;       // สำหรับเนื้อใน
  frameClassName?: string;           // ถ้าจำเป็น: ใส่ที่เฟรม (ปกติไม่ต้อง)
  frameStyle?: React.CSSProperties;  // ถ้าจำเป็น: ใส่ที่เฟรม (ปกติไม่ต้อง)
  children?: React.ReactNode;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function Box({
  startRow,
  startCol,
  rowSpan = 1,
  colSpan = 1,
  className = "",
  style,
  frameClassName = "",
  frameStyle,
  children,
}: BoxProps) {
  const { rows, cols } = useGridMeta();

  // 1) clamp จุดเริ่มให้อยู่ในกรอบ
  const sr = clamp(startRow, 1, rows);
  const sc = clamp(startCol, 1, cols);

  // 2) จำกัด span สูงสุดตามพื้นที่ที่เหลือ
  const maxRowSpan = rows - (sr - 1);
  const maxColSpan = cols - (sc - 1);

  // 3) หักส่วนเกิน
  const rs = clamp(rowSpan, 1, maxRowSpan);
  const cs = clamp(colSpan, 1, maxColSpan);

  return (
    // เฟรม: คุมตำแหน่งในกริดเท่านั้น ไม่รับ className ของเนื้อใน
    <div
      className={`box-frame relative`}
      style={{
        gridRow: `${sr} / span ${rs}`,
        gridColumn: `${sc} / span ${cs}`,
        margin: 0,               // กัน margin เนื้อในไหลไปกระทบเลย์เอาต์กริด
        padding: 0,
        minWidth: 0,             // กัน overflow ของเนื้อในทำให้ track กว้าง
        minHeight: 0,
        ...frameStyle,
      }}
    >
      {/* เนื้อใน: ใส่ className/ style ตามใจ ไม่กระทบกริด/คอนเทนเนอร์ */}
      <div
        className={`box-inner rounded-md border border-black/10 bg-white/70 backdrop-blur-sm p-3 text-sm ${className}`}
        style={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          ...style,
        }}
      >
        {children}
      </div>

      {/* เผื่ออยากสไตล์ที่เฟรมจริง ๆ */}
      {frameClassName ? <div className={frameClassName} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} /> : null}
    </div>
  );
}
