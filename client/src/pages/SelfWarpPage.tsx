import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import Spinner from '../components/Spinner';
import { resizeImageFile } from '../utils/image';
import ThankYouModal from '../components/customer/ThankYouModal';
import { useLineAuth } from '../contexts/LineAuthContext';

type WarpOption = {
  id?: string;
  seconds: number;
  label: string;
  price: number;
};


type FormState = {
  customerName: string;
  socialLink: string;
  seconds: number;
  price: number;
  customSeconds?: string;
  customerAvatar?: string;
  selfImage?: string;
  selfDisplayName?: string;
  packageId?: string;
  quote: string;
};

const defaultState: FormState = {
  customerName: '',
  socialLink: '',
  quote: '',
  seconds: 30,
  price: 20,
  customSeconds: '',
  customerAvatar: '',
  selfImage: '',
  selfDisplayName: '',
  packageId: '',
};

const customerEndpoint = () =>
  API_ENDPOINTS.topSupporters.replace('/leaderboard/top-supporters', '/public/transactions');

const SelfWarpPage = () => {
  const navigate = useNavigate();
  const { user, login, isConfigured, getStoredFormData, clearStoredFormData } = useLineAuth();
  const [form, setForm] = useState<FormState>(defaultState);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [paymentLink, setPaymentLink] = useState<{ url: string; reference?: string } | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [options, setOptions] = useState<WarpOption[]>([]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Auto-fill form with LINE profile data when user logs in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: user.displayName,
        customerAvatar: user.pictureUrl || '', // Set LINE profile picture as default
      }));
    }
  }, [user]);

  // Restore form data after LINE login
  useEffect(() => {
    const storedFormData = getStoredFormData();
    if (storedFormData && user) {
      setForm((prev) => ({
        ...prev,
        ...storedFormData,
        // Override with LINE profile data if available
        customerName: user.displayName || storedFormData.customerName,
        customerAvatar: user.pictureUrl || storedFormData.customerAvatar || '',
      }));
      // Clear stored form data after restoring
      clearStoredFormData();
    }
  }, [user, getStoredFormData, clearStoredFormData]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.publicPackages);
        if (!response.ok) {
          throw new Error('Failed to load packages');
        }
        const body = await response.json();
        if (Array.isArray(body?.packages)) {
          const mapped: WarpOption[] = body.packages.map((pkg: { _id: string; seconds: number; price: number; name: string }) => ({
            id: pkg._id,
            seconds: pkg.seconds,
            price: pkg.price,
            label: `${pkg.name} (${pkg.seconds}s)`,
          }));
          setOptions(mapped);
          if (mapped.length > 0) {
            setForm((prev) => ({
              ...prev,
              packageId: mapped[0].id,
              seconds: mapped[0].seconds,
              price: mapped[0].price,
            }));
          }
        }
      } catch {
        const fallback: WarpOption[] = [
          { seconds: 30, price: 199, label: '30 วินาที' },
          { seconds: 60, price: 349, label: '60 วินาที' },
          { seconds: 90, price: 499, label: '90 วินาที' },
        ];
        setOptions(fallback);
        setForm((prev) => ({
          ...prev,
          packageId: undefined,
          seconds: fallback[0].seconds,
          price: fallback[0].price,
        }));
      }
    };

    loadPackages();
  }, []);

  const handleSelectWarpOption = (option: WarpOption) => {
    setForm((prev) => ({
      ...prev,
      packageId: option.id,
      seconds: option.seconds,
      price: option.price,
      customSeconds: '',
    }));
  };

  const priceLabel = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(form.price);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    setFieldErrors({});
    setShowThankYouModal(false);

    const errors: Record<string, string> = {};

    if (!form.selfImage) {
      errors.profileCode = 'กรุณาอัปโหลดรูปภาพของคุณ';
    }

    if (!form.selfDisplayName?.trim()) {
      errors.selfDisplayName = 'กรุณากรอกชื่อที่จะโชว์บนจอ';
    }
    if (!form.customerName.trim()) {
      errors.customerName = 'กรุณากรอกชื่อหรือชื่อเล่น';
    }
    if (!form.socialLink.trim()) {
      errors.socialLink = 'กรุณาระบุลิงก์ social';
    }
    if (options.some((option) => option.id) && !form.packageId) {
      errors.packageId = 'กรุณาเลือกแพ็กเกจ';
    }
    if (!form.seconds || form.seconds < 10) {
      errors.seconds = 'เวลาต้องมากกว่า 10 วินาที';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus('error');
      setMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const referenceCode = `SELF-${Date.now()}`;

      const payload = {
        code: referenceCode,
        customerName: form.customerName,
        customerAvatar: form.customerAvatar || user?.pictureUrl,
        socialLink: form.socialLink,
        quote: form.quote,
        displaySeconds: form.seconds,
        amount: form.price,
        packageId: form.packageId,
        metadata: {
          source: 'self-warp-page',
          productImage: form.selfImage,
          productDescription: `${form.selfDisplayName || form.customerName} | ${form.socialLink}`,
          paymentLimit: 0,
          expiresInMinutes: 120,
          packageName: options.find(opt => opt.id === form.packageId)?.label || `${form.seconds} วินาที`,
          selfDisplayName: form.selfDisplayName,
        },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if user is logged in
      if (user && localStorage.getItem('lineAuthToken')) {
        headers.Authorization = `Bearer ${localStorage.getItem('lineAuthToken')}`;
      }

      const response = await fetch(customerEndpoint(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'ไม่สามารถบันทึก Warp ได้');
      }

      const data = await response.json();

      setTransactionId(data?.id || null);

      const linkUrl = data?.paymentUrl;
      const reference = data?.paymentReference;
      const newStatus = data?.status || 'success';

      if (linkUrl) {
        setPaymentLink({ url: linkUrl, reference });
        // Redirect to payment page directly
        window.location.href = linkUrl;
        return; // Exit early to prevent showing success message
      } else if (newStatus === 'paid') {
        // In simulation mode, transaction is already paid
        setStatus('success');
        setMessage('Warp ของคุณถูกบันทึกแล้ว! (โหมดจำลอง)');
        return;
      }

      setStatus('success');
      setMessage(
        linkUrl
          ? 'สร้าง PayLink สำเร็จ! กรุณาชำระเงินในหน้าต่างใหม่ หากไม่ได้เปิดให้คลิกปุ่มด้านล่าง'
          : newStatus === 'paid'
            ? 'Warp ของคุณถูกบันทึกแล้ว!'
            : 'Warp ถูกบันทึกแล้ว กำลังรอตรวจสอบการชำระเงิน'
      );

      if (!linkUrl && newStatus === 'paid') {
        setShowThankYouModal(true);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 font-th" style={{ letterSpacing: '-0.02em' }}>
      <div
        className="pointer-events-none absolute inset-x-1/3 -top-32 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-12 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-pink-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-purple-500/25 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-en text-xs uppercase tracking-[0.5em] text-indigo-300">Self Warp</p>
            <h1
              lang="th"
              className="mt-2 text-4xl font-semibold text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.45)] sm:text-5xl"
            >
              สร้าง Warp
            </h1>
            <p lang="th" className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
              กรอกข้อมูลและอัปโหลดรูปเพื่อให้ทีมงานแสดงวาร์ปของคุณบนจอ พร้อมลิงก์ชำระเงินแบบ Realtime
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_30px_90px_rgba(8,12,24,0.65)] backdrop-blur-xl sm:p-10">
          <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
            {/* Step 1 */}
            <section>
              <h3 className="font-en text-xs uppercase tracking-[0.45em] text-indigo-300 sm:text-sm">Step 1</h3>
              <p lang="th" className="mt-2 text-base font-semibold text-white sm:text-lg">
                แจกวาร์ปตัวเอง
              </p>

              <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
                <div>
                  <label
                    lang="th"
                    className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    ชื่อที่จะโชว์
                  </label>
                  <input
                    type="text"
                    value={form.selfDisplayName}
                    onChange={(event) => handleChange('selfDisplayName', event.target.value)}
                    placeholder="ชื่อที่จะขึ้นจอ"
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] transition focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 sm:mt-3"
                    style={{ letterSpacing: '-0.02em' }}
                  />
                  {fieldErrors.selfDisplayName ? (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors.selfDisplayName}</p>
                  ) : null}
                </div>

                <div>
                  <label
                    lang="th"
                    className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    อัปโหลดรูปของคุณ
                  </label>
                  <div className="mt-2 rounded-2xl border border-dashed border-indigo-300/30 bg-slate-950/60 p-4 text-center shadow-[0_20px_45px_rgba(8,12,24,0.5)] transition hover:border-indigo-300/60 sm:mt-3 sm:p-6">
                    <input
                      id="warp-self-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          handleChange('selfImage', '');
                          return;
                        }
                        setStatus('loading');
                        try {
                          const base64 = await resizeImageFile(file, { maxSize: 720, quality: 0.82 });
                          handleChange('selfImage', base64);
                          setStatus('idle');
                        } catch {
                          setStatus('error');
                          setMessage('อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง');
                        }
                      }}
                    />
                    <label
                      htmlFor="warp-self-upload"
                      className="mx-auto flex w-full max-w-xs cursor-pointer flex-col items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-100 transition hover:border-indigo-300/70 hover:bg-indigo-500/20 sm:gap-3 sm:px-6 sm:py-4"
                    >
                      <span className="font-en rounded-full border border-indigo-400/50 bg-indigo-500/20 px-3 py-1 text-xs uppercase tracking-[0.35em] text-indigo-100 sm:px-4 sm:py-2">
                        Upload
                      </span>
                      <span lang="th" className="text-xs text-slate-200">
                        กดเพื่อเลือกไฟล์ (รองรับ png, jpg)
                      </span>
                    </label>
                    {form.selfImage ? (
                      <div className="relative mx-auto mt-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/5 shadow-[0_10px_30px_rgba(15,23,42,0.45)] sm:mt-4 sm:h-32 sm:w-32 sm:rounded-2xl">
                        <img
                          src={`data:image/jpeg;base64,${form.selfImage}`}
                          alt="preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                  {fieldErrors.profileCode ? (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors.profileCode}</p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Step 2 */}
            <section>
              <h3 className="font-en text-xs uppercase tracking-[0.45em] text-pink-300 sm:text-sm">Step 2</h3>

              <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-4">
                {options.map((option) => {
                  const isActive = form.packageId ? form.packageId === option.id : form.seconds === option.seconds;
                  return (
                    <button
                      type="button"
                      key={`${option.id ?? option.seconds}`}
                      onClick={() => handleSelectWarpOption(option)}
                      className={`group rounded-2xl border px-3 py-3 text-center shadow-[0_18px_45px_rgba(8,12,24,0.45)] transition sm:px-6 sm:py-4 ${isActive
                        ? 'border-pink-400/80 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/80 hover:border-pink-300/60 hover:bg-pink-500/10 hover:text-white'
                        }`}
                    >
                      <p className="text-sm font-semibold text-white sm:text-lg">{option.label}</p>
                      <p lang="th" className="mt-1 text-xs text-slate-300 sm:text-sm">
                        {new Intl.NumberFormat('th-TH').format(option.price)} บาท
                      </p>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.packageId ? (
                <p className="mt-2 text-xs text-rose-300">{fieldErrors.packageId}</p>
              ) : null}
            </section>

            {/* Additional Info */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {user && <div>
                <label
                  lang="th"
                  className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  ชื่อของคุณ {user ? '(จาก LINE)' : ''}
                </label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(event) => handleChange('customerName', event.target.value)}
                  placeholder={user ? user.displayName : "ชื่อเล่น / นามแฝง"}
                  disabled={!!user}
                  required
                  className={`mt-2 w-full rounded-2xl border border-white/15 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 ${user ? 'cursor-not-allowed bg-slate-800/50 opacity-70' : 'bg-slate-950/60'
                    }`}
                  style={{ letterSpacing: '-0.02em' }}
                />
                {user && (
                  <p className="mt-1 text-xs text-emerald-300">ใช้ชื่อจาก LINE: {user.displayName}</p>
                )}
                {fieldErrors.customerName ? (
                  <p className="mt-1 text-xs text-rose-300">{fieldErrors.customerName}</p>
                ) : null}
              </div>}
              <div>
                <label
                  lang="th"
                  className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  ลิงก์ Social
                </label>
                <input
                  type="url"
                  value={form.socialLink}
                  onChange={(event) => handleChange('socialLink', event.target.value)}
                  placeholder="https://instagram.com/..."
                  required
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  style={{ letterSpacing: '-0.02em' }}
                />
                {fieldErrors.socialLink ? (
                  <p className="mt-1 text-xs text-rose-300">{fieldErrors.socialLink}</p>
                ) : null}
              </div>
            </section>

            {/* Quote Section */}
            <section>
              <label
                lang="th"
                className="block text-xs uppercase tracking-[0.35em] text-indigo-200"
                style={{ letterSpacing: '-0.02em' }}
              >
                คำคม / ข้อความ
              </label>
              <textarea
                value={form.quote}
                onChange={(event) => handleChange('quote', event.target.value)}
                placeholder="ใส่คำคมหรือข้อความที่อยากให้แสดงบนจอ..."
                maxLength={200}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(8,12,24,0.55)] focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                style={{ letterSpacing: '-0.02em' }}
              />
              <div className="mt-1 flex justify-between">
                <p lang="th" className="text-xs text-slate-400">
                  คำคมนี้จะแสดงบนจอพร้อมกับวาร์ปของคุณ
                </p>
                <p className="font-en text-xs text-slate-400">{form.quote.length}/200</p>
              </div>
              {fieldErrors.quote ? (
                <p className="mt-1 text-xs text-rose-300">{fieldErrors.quote}</p>
              ) : null}
            </section>

            {/* Price Summary */}
            <section className="rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-5 shadow-[0_18px_45px_rgba(8,12,24,0.5)] sm:rounded-3xl sm:p-6">
              <div className="flex items-center justify-between">
                <p lang="th" className="text-base font-semibold text-white sm:text-lg">
                  รวมทั้งสิ้น
                </p>
                <p className="font-en text-xl font-bold tracking-wide text-indigo-200 sm:text-2xl">{priceLabel}</p>
              </div>
            </section>

            {/* Status Message */}
            {status !== 'idle' && message ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm sm:rounded-2xl sm:px-6 sm:py-4 ${status === 'success'
                  ? 'border-emerald-300/60 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-300/60 bg-rose-500/10 text-rose-200'
                  }`}
              >
                {message}
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              {paymentLink ? (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = paymentLink.url;
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-950 shadow-[0_20px_40px_rgba(16,185,129,0.4)] transition hover:scale-[1.01] sm:px-6"
                >
                  <span lang="th">ไปหน้าชำระเงิน</span>
                  {paymentLink.reference ? (
                    <span className="font-en rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] tracking-widest text-emerald-100">
                      Ref: {paymentLink.reference}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {transactionId && paymentLink ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!transactionId) return;
                    setIsCheckingStatus(true);
                    setMessage('กำลังตรวจสอบสถานะการชำระเงิน...');
                    try {
                      const response = await fetch('/api/v1/public/transactions/check-status', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ transactionId }),
                      });

                      const body = await response.json();

                      if (!response.ok) {
                        throw new Error(body?.message || 'ตรวจสอบสถานะไม่สำเร็จ');
                      }

                      if (body?.status === 'paid') {
                        setStatus('success');
                        setMessage('ชำระเงินเรียบร้อยแล้ว! ทีมงานจะดัน Warp ของคุณขึ้นจอทันที');
                        setShowThankYouModal(true);
                      } else {
                        setStatus('success');
                        setMessage(
                          body?.note
                            ? `${body.note} (สถานะ: ${body?.chillpayStatus || 'กำลังตรวจสอบ'})`
                            : `สถานะปัจจุบัน: ${body?.chillpayStatus || 'กำลังตรวจสอบ'}`
                        );
                      }
                    } catch (error) {
                      setStatus('error');
                      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
                    } finally {
                      setIsCheckingStatus(false);
                    }
                  }}
                  disabled={isCheckingStatus}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-300/50 bg-indigo-500/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-indigo-100 transition hover:border-indigo-200/70 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6"
                >
                  {isCheckingStatus ? (
                    <>
                      <Spinner /> กำลังตรวจสอบ...
                    </>
                  ) : (
                    'ตรวจสอบสถานะการชำระ'
                  )}
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:px-6"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  ยกเลิก
                </button>

                {!user ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await login(form);
                      } catch {
                        setMessage('ไม่สามารถเข้าสู่ระบบ LINE ได้ กรุณาลองใหม่อีกครั้ง');
                        setStatus('error');
                      }
                    }}
                    disabled={!isConfigured}
                    className="rounded-2xl bg-gradient-to-r from-emerald-400 via-green-400 to-lime-300 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-950 shadow-[0_20px_45px_rgba(34,197,94,0.4)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:px-8"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {!isConfigured ? (
                      'LINE Login ไม่พร้อมใช้งาน'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                        เข้าสู่ระบบ LINE
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-[0_22px_55px_rgba(99,102,241,0.4)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:px-8"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner /> กำลังบันทึก…
                      </span>
                    ) : (
                      'ยืนยัน Warp'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      <ThankYouModal isOpen={showThankYouModal} onClose={() => setShowThankYouModal(false)} />
    </div>
  );
};

export default SelfWarpPage;
