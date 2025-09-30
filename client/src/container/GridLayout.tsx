// GridLayout.tsx
import React, { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";

type GridLayoutProps = PropsWithChildren<{
  rows?: number;
  cols?: number;
  gap?: number;
  showGrid?: boolean;
  showIndex?: boolean;
  devMode?: boolean;
  devLineColor?: string;
  className?: string;
  style?: React.CSSProperties;
}>;

// ---------- Context ----------
type GridMeta = { rows: number; cols: number; devMode: boolean; devLineColor: string };
const GridMetaCtx = createContext<GridMeta>({ rows: 2, cols: 12, devMode: false, devLineColor: "rgba(59,130,246,0.28)" });
export const useGridMeta = () => useContext(GridMetaCtx);

export function GridLayout({
  rows = 2,
  cols = 12,
  gap = 8,
  showIndex = false,
  devMode = false,
  devLineColor = "rgba(59,130,246,0.28)", // blue-500 @ ~28%
  className = "",
  style,
  children,
}: GridLayoutProps) {
  const cssVars: React.CSSProperties = {
    ["--rows" as any]: rows,
    ["--cols" as any]: cols,
    ["--gap" as any]: `${gap}px`,
  };

  // 🔧 กติกา devMode:
  // - ถ้า devMode=true => บังคับโชว์กริด (สี devLineColor) และโชว์เลข index
  // - ถ้า devMode=false => พื้นหลังโปร่งใส (ไม่โชว์กริด) แต่ showIndex ยังเปิดได้เอง
  const gridVisible = devMode ? true : false;         // override: ปิดเสมอถ้าไม่ dev
  const indexVisible = devMode ? true : showIndex;    // เปิดอัตโนมัติเมื่อ dev

  return (
    <div
      className={`relative rounded-lg border ${devMode ? "border-black/10" : "border-white/0"} h-full ${className}`}
      style={{
        isolation: "isolate",
        contain: "layout style paint",
        ...style,
      }}
    >
      <GridMetaCtx.Provider value={{ rows, cols, devMode, devLineColor }}>
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
          {/* 🧰 เส้นกริด (โชว์เฉพาะตอน devMode) */}
          {gridVisible && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 block"
              style={{
                ["--cw" as any]: `calc((100% - ( (var(--cols) - 1) * var(--gap) )) / var(--cols))`,
                ["--ch" as any]: `calc((100% - ( (var(--rows) - 1) * var(--gap) )) / var(--rows))`,
                backgroundImage: `
                  repeating-linear-gradient(
                    to bottom,
                    transparent,
                    transparent calc(var(--ch)),
                    ${devLineColor} calc(var(--ch)),
                    ${devLineColor} calc(var(--ch) + 1px),
                    transparent calc(var(--ch) + 1px),
                    transparent calc(var(--ch) + 1px + var(--gap))
                  ),
                  repeating-linear-gradient(
                    to right,
                    transparent,
                    transparent calc(var(--cw)),
                    ${devLineColor} calc(var(--cw)),
                    ${devLineColor} calc(var(--cw) + 1px),
                    transparent calc(var(--cw) + 1px),
                    transparent calc(var(--cw) + 1px + var(--gap))
                  )
                `,
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
              }}
            />
          )}

          {/* 🔢 เลขลำดับช่อง (เปิดอัตโนมัติเมื่อ devMode) */}
          {indexVisible &&
            Array.from({ length: rows * cols }).map((_, i) => {
              const r = Math.floor(i / cols) + 1;
              const c = (i % cols) + 1;
              return (
                <div
                  key={i}
                  className="pointer-events-none flex items-center justify-center text-[10px]"
                  style={{
                    gridRow: r,
                    gridColumn: c,
                    color: devMode ? "#1e3a8a" : "rgba(0,0,0,0.5)", // เข้มขึ้นเล็กน้อยตอน dev
                    border: devMode ? "1px dashed rgba(59,130,246,0.35)" : "none",
                  }}
                >
                 {devMode ? `r${r},c${c}` : ``}
                </div>
              );
            })}

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
  const { rows, cols, devMode, devLineColor } = useGridMeta();

  const sr = clamp(startRow, 1, rows);
  const sc = clamp(startCol, 1, cols);
  const maxRowSpan = rows - (sr - 1);
  const maxColSpan = cols - (sc - 1);
  const rs = clamp(rowSpan, 1, maxRowSpan);
  const cs = clamp(colSpan, 1, maxColSpan);

  return (
    <div
      className="box-frame relative"
      style={{
        gridRow: `${sr} / span ${rs}`,
        gridColumn: `${sc} / span ${cs}`,
        margin: 0,
        padding: 0,
        minWidth: 0,
        minHeight: 0,
        ...frameStyle,
      }}
    >
      <div
        className={`box-inner rounded-md border ${devMode ? "border-black/10 bg-white/70 backdrop-blur-sm" : "border-white/0"} text-sm ${className}`}
        style={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          ...style,
        }}
      >
        {children}
      </div>

      {frameClassName ? (
        <div
          className={frameClassName}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />
      ) : null}
    </div>
  );
}
