import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Eye, EyeOff, Loader2, Shield, UserPlus } from "lucide-react";

interface CreateUserForm {
  full_name: string;
  email: string;
  password: string;
}

interface ResetPasswordForm {
  new_password: string;
}

interface ChangePasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface ApiUser {
  ID: number;
  FullName: string;
  Email: string;
  CreatedAt?: string;
}

export default function UserManagement() {
  const { user } = useAuth();
  const role = user?.role;
  const isMaster = role === "MASTER_ADMIN";
  const isAdmin = role === "ADMIN";

  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    reset: resetAdmin,
    formState: { isSubmitting: creatingAdmin },
  } = useForm<CreateUserForm>({
    defaultValues: { full_name: "", email: "", password: "" },
  });
  const {
    register: registerTeknisi,
    handleSubmit: handleSubmitTeknisi,
    reset: resetTeknisi,
    formState: { isSubmitting: creatingTeknisi },
  } = useForm<CreateUserForm>({
    defaultValues: { full_name: "", email: "", password: "" },
  });

  const { register: registerChange, handleSubmit: handleSubmitChange, reset: resetChange } = useForm<ChangePasswordForm>();

  const [admins, setAdmins] = useState<ApiUser[]>([]);
  const [teknisi, setTeknisi] = useState<ApiUser[]>([]);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [teknisiStatus, setTeknisiStatus] = useState<string | null>(null);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingTeknisi, setLoadingTeknisi] = useState(false);
  const [changeStatus, setChangeStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isMaster) {
      fetchAdmins();
    }
    if (isAdmin) {
      fetchTeknisi();
    }
  }, [isMaster, isAdmin]);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await api.get("/admins");
      setAdmins(res.data?.data ?? []);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchTeknisi = async () => {
    setLoadingTeknisi(true);
    try {
      const res = await api.get("/teknisi");
      setTeknisi(res.data?.data ?? []);
    } finally {
      setLoadingTeknisi(false);
    }
  };

  const submitAdmin = handleSubmitAdmin(async (values) => {
    setAdminStatus(null);
    try {
      await api.post("/admins", values);
      setAdminStatus("Akun admin berhasil dibuat.");
      resetAdmin();
      fetchAdmins();
    } catch (err: any) {
      setAdminStatus(err?.response?.data?.error ?? "Gagal membuat admin baru.");
    }
  });

  const submitTeknisi = handleSubmitTeknisi(async (values) => {
    setTeknisiStatus(null);
    try {
      await api.post("/teknisi", values);
      setTeknisiStatus("Akun teknisi berhasil dibuat.");
      resetTeknisi();
      fetchTeknisi();
    } catch (err: any) {
      setTeknisiStatus(err?.response?.data?.error ?? "Gagal membuat teknisi baru.");
    }
  });

  const infoCard = useMemo(() => {
    if (isMaster) {
      return {
        title: "Alur Pembuatan Akun",
        description: "Master Admin membuat akun admin terlebih dahulu. Setelah admin login, mereka dapat membuat akun teknisi mereka masing-masing.",
      };
    }
    return {
      title: "Tips Keamanan",
      description: "Beri tahu teknisi untuk segera mengganti password bawaan mereka setelah login pertama.",
    };
  }, [isMaster]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">User Access</p>
          <h1 className="text-2xl font-semibold text-slate-900">Kelola Akun & Peran</h1>
          <p className="text-sm text-slate-500">Tambah admin atau teknisi sesuai hirarki akses.</p>
        </div>
      </header>

      {isMaster && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Buat Akun Admin</h2>
              <p className="text-sm text-slate-500">Admin baru bisa login untuk mengelola teknisi dan laporan.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              <UserPlus size={14} />
              Master Admin only
            </span>
          </div>
          <form onSubmit={submitAdmin} className="mt-6 grid gap-4 md:grid-cols-3">
            <Field label="Nama Lengkap" className="md:col-span-1">
              <input {...registerAdmin("full_name", { required: true })} className="input" placeholder="Aulia Rahman" />
            </Field>
            <Field label="Email">
              <input type="email" {...registerAdmin("email", { required: true })} className="input" placeholder="admin@corp.com" />
            </Field>
            <Field label="Password Sementara">
              <PasswordField register={registerAdmin("password", { required: true, minLength: 8 })} placeholder="Minimal 8 karakter" />
            </Field>
            <div className="md:col-span-3 flex items-center gap-4">
              <button type="submit" disabled={creatingAdmin} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {creatingAdmin ? "Menyimpan..." : "Tambah Admin"}
              </button>
              {adminStatus && <p className="text-sm text-slate-500">{adminStatus}</p>}
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Daftar Admin</h3>
            <div className="mt-3 overflow-x-auto rounded-3xl border border-slate-100">
              {loadingAdmins ? (
                <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat data admin...
                </div>
              ) : admins.length === 0 ? (
                <p className="px-6 py-10 text-sm text-slate-500">Belum ada admin yang terdaftar.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Dibuat</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {admins.map((item) => (
                      <tr key={item.ID}>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.FullName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.Email}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(item.CreatedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <ResetPasswordInline endpoint={`/admins/${item.ID}/reset-password`} label="Reset Admin" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Buat Akun Teknisi</h2>
              <p className="text-sm text-slate-500">Teknisi akan otomatis terikat dengan admin pembuatnya.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              <UserPlus size={14} />
              Admin only
            </span>
          </div>
          <form onSubmit={submitTeknisi} className="mt-6 grid gap-4 md:grid-cols-3">
            <Field label="Nama Lengkap">
              <input {...registerTeknisi("full_name", { required: true })} className="input" placeholder="Rendi - Teknisi" />
            </Field>
            <Field label="Email">
              <input type="email" {...registerTeknisi("email", { required: true })} className="input" placeholder="teknisi@corp.com" />
            </Field>
            <Field label="Password Sementara">
              <PasswordField register={registerTeknisi("password", { required: true, minLength: 8 })} placeholder="Minimal 8 karakter" />
            </Field>
            <div className="md:col-span-3 flex items-center gap-4">
              <button type="submit" disabled={creatingTeknisi} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {creatingTeknisi ? "Menyimpan..." : "Tambah Teknisi"}
              </button>
              {teknisiStatus && <p className="text-sm text-slate-500">{teknisiStatus}</p>}
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Daftar Teknisi</h3>
            <div className="mt-3 overflow-x-auto rounded-3xl border border-slate-100">
              {loadingTeknisi ? (
                <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat data teknisi...
                </div>
              ) : teknisi.length === 0 ? (
                <p className="px-6 py-10 text-sm text-slate-500">Belum ada teknisi yang terdaftar.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Dibuat</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {teknisi.map((item) => (
                      <tr key={item.ID}>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.FullName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.Email}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(item.CreatedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <ResetPasswordInline endpoint={`/teknisi/${item.ID}/reset-password`} label="Reset Teknisi" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ganti Password Saya</h2>
            <p className="text-sm text-slate-500">Semua role bisa mengganti password sendiri di sini.</p>
          </div>
        </div>
        <form
          onSubmit={handleSubmitChange(async (values) => {
            setChangeStatus(null);
            try {
              await api.post("/auth/change-password", values);
              setChangeStatus("Password berhasil diperbarui.");
              resetChange();
            } catch (err: any) {
              setChangeStatus(err?.response?.data?.error ?? "Gagal mengganti password.");
            }
          })}
          className="mt-6 grid gap-4 md:grid-cols-3"
        >
          <Field label="Password Lama">
            <PasswordField register={registerChange("current_password", { required: true })} placeholder="Password sekarang" />
          </Field>
          <Field label="Password Baru">
            <PasswordField register={registerChange("new_password", { required: true, minLength: 8 })} placeholder="Minimal 8 karakter" />
          </Field>
          <Field label="Konfirmasi Password">
            <PasswordField register={registerChange("confirm_password", { required: true })} placeholder="Ulangi password baru" />
          </Field>
          <div className="md:col-span-3 flex items-center gap-4">
            <button type="submit" className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
              Simpan Password
            </button>
            {changeStatus && <p className="text-sm text-slate-500">{changeStatus}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-slate-900">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{infoCard.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{infoCard.description}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-medium text-slate-600 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PasswordField({ register, placeholder, compact = false }: { register: UseFormRegisterReturn; placeholder?: string; compact?: boolean }) {
  const [visible, setVisible] = useState(false);
  const baseClass = compact
    ? "w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 pr-11 text-xs"
    : "input pr-11";
  return (
    <div className={`relative ${compact ? "" : ""}`}>
      <input type={visible ? "text" : "password"} {...register} className={baseClass} placeholder={placeholder} />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className={`absolute ${compact ? "right-2" : "right-3"} top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:text-slate-900`}
      >
        {visible ? <EyeOff size={compact ? 14 : 16} /> : <Eye size={compact ? 14 : 16} />}
      </button>
    </div>
  );
}

function ResetPasswordInline({ endpoint, label }: { endpoint: string; label: string }) {
  const { register, handleSubmit, reset } = useForm<ResetPasswordForm>();
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      await api.patch(endpoint, values);
      setStatus("Password berhasil direset.");
      reset();
    } catch (err: any) {
      setStatus(err?.response?.data?.error ?? "Gagal mereset password.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="inline-flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <PasswordField register={register("new_password", { required: true, minLength: 8 })} placeholder="Password baru" compact />
        <button type="submit" className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-500">
          {label}
        </button>
      </div>
      {status && <span className="text-[11px] text-slate-500">{status}</span>}
    </form>
  );
}
