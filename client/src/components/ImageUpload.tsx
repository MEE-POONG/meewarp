import { useRef, useState, useEffect } from 'react';

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null) => void;
  label: string;
  placeholder?: string;
  accept?: string;
}

const ImageUpload = ({
  value,
  onChange,
  label,
  placeholder = 'คลิกเพื่อเลือกรูปภาพ',
  accept = 'image/*',
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onChange(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกรูปภาพเท่านั้น');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      
      // Clean up previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // Create preview URL for the selected file
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      onChange(file);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onChange(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-2 col-span-2">
      <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">
        {label}
      </label>
      
      <div className="grid gap-6 lg:grid-cols-2 w-full">
      {/* Upload Area */}
        <div
          onClick={handleClick}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
            isUploading
              ? 'border-indigo-400 bg-indigo-500/10'
              : 'border-white/20 hover:border-indigo-400 hover:bg-white/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center justify-center p-6 text-center h-full">
            {isUploading ? (
              <div className="space-y-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div>
                <p className="text-sm text-indigo-300">กำลังอัปโหลด...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-8 w-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-slate-300">{placeholder}</p>
                <p className="text-xs text-slate-400">
                  PNG, JPG, GIF (สูงสุด 5MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {(value || previewUrl) && (
          <div className="relative">
            <div className="relative overflow-hidden rounded-lg border border-white/10">
              <img
                src={previewUrl || (value?.startsWith('http') ? value : `${window.location.origin}/api${value}`)}
                alt="Preview"
                className="w-full object-contain"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-2 top-2 rounded-full bg-red-500/80 p-1 text-white hover:bg-red-500"
                title="ลบรูปภาพ"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {previewUrl ? 'รูปภาพที่เลือกใหม่' : 'รูปภาพปัจจุบัน (คลิกเพื่อเปลี่ยน)'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-xs text-rose-300">{error}</p>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
