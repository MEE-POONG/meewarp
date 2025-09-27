import { useAuth } from '../../contexts/AuthContext';
import AdminForm from '../../components/AdminForm';

const AdminCreateWarpPage = () => {
  const { token } = useAuth();

  if (!token) {
    return null;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Profiles</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Create Warp Profile</h1>
        <p className="mt-1 text-sm text-slate-300">
          ใช้สำหรับเพิ่มศิลปิน/ดีเจใหม่ให้ลูกค้าเลือกจากหน้าจอหลัก หรือใช้ในโปรโมชันพิเศษ
        </p>
      </header>
      <AdminForm authToken={token} />
    </div>
  );
};

export default AdminCreateWarpPage;
