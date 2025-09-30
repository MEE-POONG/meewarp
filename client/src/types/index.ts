// display/types.ts
export type DisplayVariant =
  | 'minimal'       // QR ใหญ่กลางจอ + ปุ่มเรียก modal (โฟกัสสูงสุด)
  | 'rightDock'     // แผงข้อมูล/Leaderboard ชิดขวา, hero ตรงกลาง
  | 'poster';       // พื้นหลังสไลด์ร้าน + QR มุมใหญ่, ตัวหนังสือหนา-ชัด

export type BgContentMode = 'none' | 'menu' | 'promo' | 'gallery';

export type ThemeSpec = {
  // สีหลัก
  primary: string;   // ปุ่ม/ไฮไลท์
  accent: string;    // เสริม (ขอบเรือง/ป้ายเวลา)
  text: string;      // ข้อความหลัก
  backdrop: string;  // พื้นหลัง layer หน้าสุด (เช่น glass)
  // แสง/คอนทราสต์สำหรับบาร์ที่ไฟแรงต่างกัน
  ambient: 'dark' | 'dim' | 'bright';
  glass?: boolean;
  blur?: number;     // 0-30 (px)
  stroke?: boolean;  // เส้นขอบช่วยอ่านบนฉากหลัง
  qrStyle?: 'square' | 'rounded' | 'circle';
};
