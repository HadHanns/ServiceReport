import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { api } from "../../lib/api";
import { Plus, Trash2, UploadCloud, Download } from "lucide-react";

interface DeviceRow {
  device: string;
  description: string;
  serial: string;
  location: string;
  status: string;
}

interface SummaryRow {
  task: string;
  start: string;
  finish: string;
  duration: string;
  owner: string;
}

interface SparepartRow {
  partNo: string;
  description: string;
  qty: string;
  status: string;
}

interface ReportFormValues {
  mode: "estimate" | "report";
  customerName: string;
  reportTitle: string;
  sla: string;
  dueDate: string;
  subjectName: string;
  segment: string;
  department: string;
  address: string;
  phone: string;
  email: string;
  jobTags: string[];
  problemDetail: string;
  jobSummaryNotes: string;
  recommendation: string;
  documentationNotes: string;
  customerContactedBy: string;
  signBy: string;
  signDate: string;
  notes: string;
  devices: DeviceRow[];
  summary: SummaryRow[];
  spareparts: SparepartRow[];
}

const defaultValues: ReportFormValues = {
  mode: "report",
  customerName: "",
  reportTitle: "",
  sla: "24 Hours",
  dueDate: "",
  subjectName: "",
  segment: "",
  department: "",
  address: "",
  phone: "",
  email: "",
  jobTags: [],
  problemDetail: "",
  jobSummaryNotes: "",
  recommendation: "",
  documentationNotes: "",
  customerContactedBy: "",
  signBy: "",
  signDate: "",
  notes: "",
  devices: [{ device: "", description: "", serial: "", location: "", status: "" }],
  summary: [{ task: "", start: "", finish: "", duration: "", owner: "" }],
  spareparts: [{ partNo: "", description: "", qty: "1", status: "" }],
};

const jobOptions = ["Inspection", "High Pressure", "Preventive", "Power Supply", "Data Logging", "T&M"];

export default function ReportForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
  } = useForm<ReportFormValues>({
    defaultValues,
  });

  const { fields: deviceFields, append: appendDevice, remove: removeDevice } = useFieldArray({
    control,
    name: "devices",
  });
  const { fields: summaryFields, append: appendSummary, remove: removeSummary } = useFieldArray({
    control,
    name: "summary",
  });
  const { fields: spareFields, append: appendSpare, remove: removeSpare } = useFieldArray({
    control,
    name: "spareparts",
  });

  const selectedTags = watch("jobTags");

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
    setValue("jobTags", next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setMessage(null);
    try {
      const primaryDevice = values.devices[0] ?? { description: "", serial: "", location: "" };
      await api.post("/reports", {
        customer: {
          name: values.customerName,
          address: values.address,
          contact: values.phone || values.email,
        },
        device: {
          name: primaryDevice.device || primaryDevice.description || "Device",
          serial: primaryDevice.serial,
          location: primaryDevice.location,
        },
        complaint: values.problemDetail || values.notes,
      });
      setMessage("Laporan berhasil dibuat.");
      reset(defaultValues);
    } catch (err: any) {
      setMessage(err?.response?.data?.error ?? "Gagal menyimpan laporan.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Create Service Report</h1>
          <p className="text-sm text-slate-500">Lengkapi detail lapangan sesuai template yang kamu buat.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-600">Cancel</button>
          <button className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-600">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button form="report-form" type="submit" disabled={loading} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
            {loading ? "Saving..." : "Submit"}
          </button>
        </div>
      </header>

      <form id="report-form" onSubmit={onSubmit} className="space-y-8 pb-16">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-500">
              {(["estimate", "report"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setValue("mode", mode)}
                  className={`rounded-full px-4 py-1 capitalize ${watch("mode") === mode ? "bg-white text-slate-900 shadow" : ""}`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="flex gap-3 text-sm">
              <button type="button" className="rounded-full border border-slate-300 px-4 py-2 text-slate-600">
                Save Draft
              </button>
              <button type="button" className="rounded-full border border-slate-300 px-4 py-2 text-slate-600">
                Share
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-4">
            <Field label="Customer Name">
              <input {...register("customerName", { required: true })} className="input" placeholder="SWAN Medical" />
            </Field>
            <Field label="Report Name">
              <input {...register("reportTitle", { required: true })} className="input" placeholder="SWAN / R6 / 2023" />
            </Field>
            <Field label="SLA">
              <input {...register("sla")} className="input" placeholder="24 Hours" />
            </Field>
            <Field label="Due Date">
              <input type="date" {...register("dueDate")} className="input" />
            </Field>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Field label="Subject Name">
              <input {...register("subjectName")} className="input" placeholder="Sisca" />
            </Field>
            <Field label="Customer Segment">
              <input {...register("segment")} className="input" placeholder="Retail" />
            </Field>
            <Field label="Department">
              <input {...register("department")} className="input" placeholder="ICT" />
            </Field>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Field label="Customer Address" className="md:col-span-2">
              <textarea {...register("address", { required: true })} className="input h-24" placeholder="Jl. Sudirman No. 12, Jakarta" />
            </Field>
            <div className="grid gap-4">
              <Field label="Phone Number">
                <input {...register("phone")} className="input" placeholder="0821 1234 5678" />
              </Field>
              <Field label="Email">
                <input type="email" {...register("email")} className="input" placeholder="email@domain.com" />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Job Information</h3>
              <p className="text-sm text-slate-500">Checklist pekerjaan dan detail keluhan.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Report Problem</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {jobOptions.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((box) => (
              <div key={box} className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                <UploadCloud className="mb-2 h-6 w-6 text-slate-400" />
                Upload Photo
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Field label="Detail Issue" className="md:col-span-2">
              <textarea {...register("problemDetail", { required: true })} className="input h-32" placeholder="Explain the issue in detail, steps to reproduce, error messages, etc." />
            </Field>
            <Field label="Recommendation">
              <textarea {...register("recommendation")} className="input h-32" placeholder="Recommendations, next action, sparepart planning, etc." />
            </Field>
            <Field label="Documentation Notes">
              <textarea {...register("documentationNotes")} className="input h-32" placeholder="Upload links, drive references, measurement notes." />
            </Field>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Device Information</h3>
            <button type="button" onClick={() => appendDevice({ device: "", description: "", serial: "", location: "", status: "" })} className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-500">
              <Plus className="h-4 w-4" />
              Add Table
            </button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Serial No</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {deviceFields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-3 text-xs text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <input {...register(`devices.${index}.device` as const)} className="input" placeholder="ID 001" />
                    </td>
                    <td className="px-4 py-3">
                      <input {...register(`devices.${index}.description` as const)} className="input" placeholder="Device Description" />
                    </td>
                    <td className="px-4 py-3">
                      <input {...register(`devices.${index}.serial` as const)} className="input" placeholder="SN-2024-01" />
                    </td>
                    <td className="px-4 py-3">
                      <input {...register(`devices.${index}.location` as const)} className="input" placeholder="Warehouse" />
                    </td>
                    <td className="px-4 py-3">
                      <input {...register(`devices.${index}.status` as const)} className="input" placeholder="Ready" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deviceFields.length > 1 && (
                        <button type="button" onClick={() => removeDevice(index)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Summary</h3>
              <p className="text-sm text-slate-500">Rekap pekerjaan, waktu pengerjaan, dan PIC.</p>
            </div>
            <button type="button" onClick={() => appendSummary({ task: "", start: "", finish: "", duration: "", owner: "" })} className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-500">
              <Plus className="h-4 w-4" />
              Add Table
            </button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">Finish</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">PIC</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {summaryFields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-3">
                      <input {...register(`summary.${index}.task` as const)} className="input" placeholder="Inspection" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="datetime-local" {...register(`summary.${index}.start` as const)} className="input" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="datetime-local" {...register(`summary.${index}.finish` as const)} className="input" />
                    </td>
                    <td className="px-4 py-3">
                      <input {...register(`summary.${index}.duration` as const)} className="input" placeholder="2 hours" />
                    </td>
                    <td className="px-4 py-3">
                      <input {...register(`summary.${index}.owner` as const)} className="input" placeholder="John Doe" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {summaryFields.length > 1 && (
                        <button type="button" onClick={() => removeSummary(index)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Field label="Job Summary Notes" className="mt-6">
            <textarea {...register("jobSummaryNotes")} className="input h-24" placeholder="Highlight achievement, obstacles, and next steps." />
          </Field>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Sparepart</h3>
            <button type="button" onClick={() => appendSpare({ partNo: "", description: "", qty: "1", status: "" })} className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-500">
              <Plus className="h-4 w-4" />
              Add Table
            </button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Part No.</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {spareFields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-3">
                      <input {...register(`spareparts.${index}.partNo` as const)} className="input" placeholder="PN-0032" />
                    </td>
                    <td className="px-4 py-3">
                      <input {...register(`spareparts.${index}.description` as const)} className="input" placeholder="Power Supply" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min={1} {...register(`spareparts.${index}.qty` as const)} className="input" />
                    </td>
                    <td className="px-4 py-3">
                      <input {...register(`spareparts.${index}.status` as const)} className="input" placeholder="Delivered" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {spareFields.length > 1 && (
                        <button type="button" onClick={() => removeSpare(index)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Customer Satisfaction Survey</h3>
              <Field label="Contacted By">
                <input {...register("customerContactedBy")} className="input" placeholder="Aulia" />
              </Field>
              <Field label="Signed By">
                <input {...register("signBy")} className="input" placeholder="Customer Representative" />
              </Field>
              <Field label="Signed Date">
                <input type="date" {...register("signDate")} className="input" />
              </Field>
            </div>
            <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50">
              <div className="text-center">
                <div className="mx-auto h-40 w-40 rounded-2xl border border-slate-300 bg-white p-4">
                  <div className="h-full w-full rounded-lg bg-[length:60px_60px] bg-[linear-gradient(90deg,#0f172a_1px,transparent_1px),linear-gradient(#0f172a_1px,transparent_1px)]" style={{ backgroundSize: "20px 20px" }} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-widest text-slate-400">QR Survey</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Change Notes</h3>
              <textarea {...register("notes")} className="input h-40" placeholder="Tambahkan catatan perubahan, permintaan khusus, atau reminder follow-up." />
              <div className="flex gap-3">
                <button type="button" className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600">
                  Preview
                </button>
                <button type="button" className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600">
                  Share Link
                </button>
              </div>
            </div>
          </div>
        </section>

        {message && <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</p>}
      </form>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-medium text-slate-600 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
