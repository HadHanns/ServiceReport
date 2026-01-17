import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setError(null);
    try {
      await login(values);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  });

  const handleForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      const res = await api.post("/auth/forgot-password", { email: forgotEmail });
      const temp = res.data?.data?.temporary_password;
      setForgotMessage(temp ? `Password sementara: ${temp}` : "Password sementara telah dibuat.");
    } catch (err: any) {
      setForgotMessage(err?.response?.data?.error ?? "Email tidak ditemukan.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white/80 p-10 shadow-2xl">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Internal Service</p>
          <h1 className="text-3xl font-semibold text-slate-900">Portal Service Report</h1>
          <p className="text-sm text-slate-500">Gunakan akun resmi untuk mengakses dashboard.</p>
        </div>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-slate-400 focus:outline-none"
              placeholder="email@company.com"
              {...register("email", { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Password</label>
            <input
              type="password"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              placeholder="********"
              {...register("password", { required: true })}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            className="w-full rounded-2xl bg-slate-900 py-3 text-white transition hover:bg-slate-800"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-500">
          <button type="button" onClick={() => setForgotOpen((prev) => !prev)} className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            Lupa password?
          </button>
        </div>
        {forgotOpen && (
          <form onSubmit={handleForgot} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="text-slate-600">Masukkan email akun. Sistem akan memberikan password sementara untuk login ulang.</p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
              placeholder="email@company.com"
            />
            <button type="submit" disabled={forgotLoading} className="w-full rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60">
              {forgotLoading ? "Mengirim..." : "Dapatkan Password"}
            </button>
            {forgotMessage && <p className="text-xs text-slate-500">{forgotMessage}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
