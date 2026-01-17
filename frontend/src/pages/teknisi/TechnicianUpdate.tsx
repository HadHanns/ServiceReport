import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

interface ReportDetail {
  id: number;
  dispatch_no: string;
  customer_name: string;
  device_name: string;
  status: "open" | "progress" | "done";
  complaint: string;
  action_taken?: string;
}

interface UpdateForm {
  jobSummary: string;
  actionTaken: string;
  status: "progress" | "done";
  photos: FileList;
}

export default function TechnicianUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue } = useForm<UpdateForm>({
    defaultValues: { status: "progress" },
  });
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/reports/${id}`)
      .then((res) => {
        setReport(res.data.data);
        setValue("status", res.data.data.status === "done" ? "done" : "progress");
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [id, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    if (!id) return;
    setMessage(null);
    try {
      await api.patch(`/teknisi/reports/${id}/progress`, {
        jobSummary: values.jobSummary,
        actionTaken: values.actionTaken,
        status: values.status,
      });
      if (values.photos && values.photos.length > 0) {
        const formData = new FormData();
        Array.from(values.photos).forEach((file) => formData.append("photos", file));
        await api.post(`/reports/${id}/photos`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setMessage("Status laporan berhasil diperbarui.");
    } catch (err: any) {
      setMessage(err?.response?.data?.error ?? "Gagal mengirim pembaruan.");
    }
  });

  if (loading) {
    return <p className="text-slate-500">Loading detail laporan...</p>;
  }

  if (!report) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-slate-500">Laporan tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="mt-4 rounded-2xl border border-slate-300 px-4 py-2 text-sm">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Teknisi</p>
          <h1 className="text-2xl font-semibold text-slate-900">Update Laporan #{report.dispatch_no}</h1>
          <p className="text-sm text-slate-500">Customer {report.customer_name} - {report.device_name}</p>
        </div>
        <button onClick={() => navigate(-1)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-600">
          Kembali
        </button>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Keluhan</h3>
        <p className="mt-2 text-sm text-slate-600">{report.complaint}</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Update Pekerjaan</h3>
        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <Field label="Ringkasan Pekerjaan">
            <textarea {...register("jobSummary", { required: true })} className="input h-32" placeholder="Deskripsikan tindakan..." />
          </Field>
          <Field label="Tindakan / Hasil">
            <textarea {...register("actionTaken", { required: true })} className="input h-32" placeholder="Detail hasil perbaikan" />
          </Field>
          <Field label="Status">
            <select {...register("status", { required: true })} className="input">
              <option value="progress">On Progress</option>
              <option value="done">Selesai</option>
            </select>
          </Field>
          <Field label="Foto Before/After">
            <input type="file" multiple accept="image/*" {...register("photos")} />
          </Field>
          <button type="submit" className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
            Simpan Update
          </button>
          {message && <p className="text-sm text-slate-500">{message}</p>}
        </form>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}
