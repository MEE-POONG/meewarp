import Modal from '../Modal';

type ThankYouModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ThankYouModal = ({ isOpen, onClose }: ThankYouModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title="ขอบคุณที่สนับสนุน!" closeLabel="ปิด">
    <div className="space-y-6 text-center text-white">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.78a.75.75 0 1 0-1.22-.94l-3.622 4.702-1.858-1.858a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.13-.094l4.13-5.37Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <p className="text-lg font-semibold">ชำระเงินเรียบร้อยแล้ว</p>
      <p className="text-sm text-slate-200">
        ทีมงานกำลังจัดคิว Warp ของคุณให้แสดงบนหน้าจอ อย่าลืมกลับมาแจกอีกครั้งนะ!
      </p>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-[0_20px_50px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400"
      >
        ปิดหน้าต่าง
      </button>
    </div>
  </Modal>
);

export default ThankYouModal;
