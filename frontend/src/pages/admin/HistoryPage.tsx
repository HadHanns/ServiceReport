import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface ReportHistory {
  id: number;
  dispatch_no: string;
  customer_name: string;
  status: "open" | "progress" | "done";
  updated_at: string;
}

export default function HistoryPage() {
  const [histories, setHistories] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/reports", { params: { status: "done" } })
      .then((res) => setHistories(res.data.data || []))
      .catch(() => setHistories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">History</p>
        <h1 className="text-2xl font-semibold text-slate-900">Service Report History</h1>
        <p className="text-sm text-slate-500">Completed dispatches with their final status.</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-4">Dispatch No</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    Loading history...
                  </td>
                </tr>
              )}
              {!loading && histories.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    No completed reports yet.
                  </td>
                </tr>
              )}
              {histories.map((report) => (
                <tr key={report.id} className="border-t border-slate-100">
                  <td className="p-4 font-semibold text-slate-900">{report.dispatch_no}</td>
                  <td className="p-4 text-slate-500">{new Date(report.updated_at).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-700">{report.customer_name}</td>
                  <td className="p-4">
                    <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {report.status}
                    </span>
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
