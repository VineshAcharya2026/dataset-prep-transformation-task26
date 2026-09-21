import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function DatasetList() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  const load = () => {
    setLoading(true);
    api
      .get('/datasets', { params: { search, status, page, pageSize: 10, sort: 'updated_at' } })
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search, status, page]);

  const columns = [
    { key: 'name', label: 'Dataset Name' },
    { key: 'file_type', label: 'File Type' },
    { key: 'row_count', label: 'Rows' },
    { key: 'column_count', label: 'Columns' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'quality_score', label: 'Quality Score', render: (r) => (r.quality_score != null ? `${r.quality_score}%` : '—') },
    { key: 'updated_at', label: 'Last Updated', render: (r) => new Date(r.updated_at).toLocaleString() },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <Link to={`/datasets/${r.id}`} className="text-brand-600 hover:underline">
            View
          </Link>
          <Link to={`/datasets/${r.id}/preview`} className="text-brand-600 hover:underline">
            Preview
          </Link>
          {r.status === 'PROCESSED' && hasRole('ADMIN', 'DATA_STEWARD', 'DATA_ANALYST') && (
            <Link to={`/datasets/${r.id}/prepare`} className="text-brand-600 hover:underline">
              Prepare
            </Link>
          )}
          <Link to={`/datasets/${r.id}/history`} className="text-brand-600 hover:underline">
            History
          </Link>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(data.total / 10) || 1;

  return (
    <div>
      <PageHeader title="Datasets" subtitle="Select a processed dataset to prepare for analytics" />
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Search datasets..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="PROCESSED">Processed</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
      <DataTable columns={columns} data={data.items} loading={loading} />
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          Page {page} of {totalPages} ({data.total} total)
        </span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <button type="button" disabled={page >= totalPages} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
