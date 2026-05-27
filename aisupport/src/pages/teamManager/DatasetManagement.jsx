import { useEffect, useMemo, useState } from 'react';
import { Database, Eye, FileJson, FileSpreadsheet, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { datasetApi } from '../../services/api';

const datasetTypes = [
  { label: 'Support Tickets', value: 'tickets' },
  { label: 'Team Manager Performance', value: 'team_manager_performance' },
  { label: 'Business Executive Insights', value: 'business_executive_insights' },
];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '-');

export default function DatasetManagement() {
  const [datasetType, setDatasetType] = useState('tickets');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const FileIcon = useMemo(() => {
    if (!file) return UploadCloud;
    return file.name.toLowerCase().endsWith('.json') ? FileJson : FileSpreadsheet;
  }, [file]);

  const loadUploads = async () => {
    try {
      const response = await datasetApi.uploads();
      setUploads(response.uploads || []);
    } catch (error) {
      setToast(error.message || 'Unable to load upload history.');
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

  const acceptFile = (selected) => {
    if (!selected) return;
    const validType = selected.name.toLowerCase().endsWith('.csv') || selected.name.toLowerCase().endsWith('.json');
    if (!validType) {
      setToast('Only CSV and JSON files are allowed.');
      return;
    }
    setFile(selected);
    setSummary(null);
    setErrors([]);
    setPreviewRows([]);
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(5);
    setErrors([]);
    try {
      const response = await datasetApi.upload({ file, datasetType, onProgress: setProgress });
      setSummary(response);
      setErrors(response.errors || []);
      setToast('Dataset uploaded successfully and saved to database.');
      await loadUploads();
      if (response.uploadId) {
        const preview = await datasetApi.preview(response.uploadId);
        setPreviewRows((preview.records || []).slice(0, 10));
      }
    } catch (error) {
      setToast(error.message || 'Upload failed.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const preview = async (uploadId) => {
    const response = await datasetApi.preview(uploadId);
    setPreviewRows((response.records || []).slice(0, 10));
    setToast('Preview loaded.');
  };

  const remove = async (uploadId) => {
    await datasetApi.remove(uploadId);
    setToast('Dataset upload removed.');
    setPreviewRows([]);
    await loadUploads();
  };

  const refreshDashboards = () => {
    localStorage.setItem('dashboardRefreshAt', new Date().toISOString());
    setToast('Dashboard data refresh requested.');
  };

  return (
    <Layout title="Dataset Management">
      <div className="slide-in space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dataset Management</h1>
            <p className="mt-1 text-sm text-slate-400">Upload support datasets, validate records, and refresh analytics.</p>
          </div>
          <button type="button" onClick={refreshDashboards} className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
            <RefreshCw size={16} /> Refresh Dashboards
          </button>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="card-glass rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <Database size={18} className="text-purple-300" />
              <h2 className="text-sm font-semibold text-white">Upload Dataset</h2>
            </div>
            <label className="mb-2 block text-xs text-slate-400">Dataset Type</label>
            <select value={datasetType} onChange={(event) => setDatasetType(event.target.value)} className="mb-4 w-full rounded-lg px-3 py-2 text-sm">
              {datasetTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
            <div
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                acceptFile(event.dataTransfer.files?.[0]);
              }}
              className={`rounded-xl border border-dashed p-6 text-center transition-colors ${dragging ? 'border-purple-300 bg-purple-500/10' : 'border-purple-400/25 bg-white/5'}`}
            >
              <FileIcon size={34} className="mx-auto text-purple-300" />
              <p className="mt-3 text-sm font-semibold text-white">{file ? file.name : 'Drop CSV/JSON here'}</p>
              <p className="mt-1 text-xs text-slate-400">Maximum file size: 20 MB</p>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                <UploadCloud size={15} /> Choose File
                <input type="file" accept=".csv,.json" className="hidden" onChange={(event) => acceptFile(event.target.files?.[0])} />
              </label>
            </div>
            {progress > 0 && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Upload progress</span><span>{progress}%</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-purple-500" style={{ width: `${progress}%` }} /></div>
              </div>
            )}
            <button type="button" onClick={upload} disabled={!file || loading} className="btn-primary mt-5 w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Uploading...' : 'Upload CSV/JSON'}
            </button>
          </section>

          <section className="card-glass rounded-xl p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Upload Summary</h2>
            {summary ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  ['Total Rows', summary.totalRows],
                  ['Inserted/Updated', summary.insertedRows ?? summary.successRows],
                  ['Failed Rows', summary.failedRows],
                  ['Status', summary.status],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-1 text-xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">Upload a dataset to view validation and insert summary.</div>
            )}
            {errors.length > 0 && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-4">
                <p className="mb-2 text-sm font-semibold text-red-100">Validation Errors</p>
                <div className="max-h-36 space-y-1 overflow-y-auto text-xs text-red-100/80">
                  {errors.slice(0, 8).map((error, index) => <p key={`${error.row}-${index}`}>Row {error.row}: {error.message}</p>)}
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="card-glass rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Preview First 10 Rows</h2>
            <span className="text-xs text-slate-400">{previewRows.length} rows shown</span>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  {(previewRows[0] ? Object.keys(previewRows[0].data || previewRows[0]).filter((key) => !key.startsWith('_')).slice(0, 8) : ['Preview']).map((key) => <th key={key}>{key.replace(/_/g, ' ')}</th>)}
                </tr>
              </thead>
              <tbody>
                {previewRows.length ? previewRows.map((row, index) => {
                  const record = row.data || row;
                  const keys = Object.keys(record).filter((key) => !key.startsWith('_')).slice(0, 8);
                  return <tr key={row._id || row.ticket_id || index}>{keys.map((key) => <td key={key} className="text-slate-300">{String(record[key] ?? '')}</td>)}</tr>;
                }) : <tr><td className="py-8 text-center text-slate-500">No preview loaded.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card-glass rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Upload History</h2>
            <button type="button" onClick={loadUploads} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/10">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>File</th><th>Type</th><th>Rows</th><th>Failed</th><th>Status</th><th>Uploaded</th><th>Actions</th></tr></thead>
              <tbody>
                {uploads.length ? uploads.map((item) => (
                  <tr key={item.uploadId}>
                    <td className="text-slate-300">{item.fileName}</td>
                    <td className="text-slate-400">{item.datasetType}</td>
                    <td className="text-slate-400">{item.successRows}/{item.totalRows}</td>
                    <td className="text-slate-400">{item.failedRows}</td>
                    <td className="text-slate-400">{item.status}</td>
                    <td className="text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => preview(item.uploadId)} className="rounded-lg p-2 text-blue-300 hover:bg-white/10" title="Preview"><Eye size={15} /></button>
                        <button type="button" onClick={() => remove(item.uploadId)} className="rounded-lg p-2 text-red-300 hover:bg-white/10" title="Delete upload"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="7" className="py-8 text-center text-slate-500">No uploads yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <Toast message={toast} type={toast.includes('failed') || toast.includes('Only') ? 'warning' : 'success'} onClose={() => setToast('')} />
      </div>
    </Layout>
  );
}
