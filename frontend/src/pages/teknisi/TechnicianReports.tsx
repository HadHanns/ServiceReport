import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

interface AssignedReport {
  id: number;
  dispatch_no: string;
  customer_name: string;
  status: "open" | "progress" | "done";
  opened_at: string;
}

export default function TechnicianReports() {
  const [reports, setReports] = useState<AssignedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api
      .get("/teknisi/reports")
      .then((res) => setReports(res.data.data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Teknisi</p>
        <h1 className="text-2xl font-semibold text-slate-900">Laporan Penugasan</h1>
        <p className="text-sm text-slate-500">Pilih dispatch untuk memperbarui status.</p>
      </header>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-4">No Dispatch</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Loading penugasan...
                  </td>
                </tr>
              )}
              {!loading && reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Belum ada penugasan aktif.
                  </td>
                </tr>
              )}
              {reports.map((report) => (
                <tr key={report.id} className="border-t border-slate-100">
                  <td className="p-4 font-semibold text-slate-900">{report.dispatch_no}</td>
                  <td className="p-4 text-slate-500">{new Date(report.opened_at).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-700">{report.customer_name}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => navigate(`/teknisi/reports/${report.id}`)}
                      className="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function badgeClass(status: AssignedReport["status"]) {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-700";
    case "progress":
      return "bg-sky-100 text-sky-700";
    case "done":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
