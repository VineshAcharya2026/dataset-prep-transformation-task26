import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { TRANSFORM_TYPES } from '../constants/transformations';

export default function HistoryPage() {
  const { id } = useParams();
  const isGlobal = !id;
  const [data, setData] = useState({ items: [], total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const url = isGlobal ? '/history' : `/datasets/${id}/history`;
    api
      .get(url, { params: { search, status, type, page, pageSize: 10 } })
      .then((res) => setData(res.data.data));
  }, [id, isGlobal, search, status, type, page]);

  const columns = [
    ...(isGlobal ? [{ key: 'dataset_name', label: 'Dataset' }] : []),
    { key: 'version_name', label: 'Version', render: (r) => r.version_name || '—' },
    { key: 'transformation_type', label: 'Transformation', render: (r) => r.transformation_type.replace(/_/g, ' ') },
    { key: 'performer_name', label: 'Performed by' },
    { key: 'executed_at', label: 'Date', render: (r) => new Date(r.executed_at).toLocaleString() },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'link',
      label: '',
      render: (r) =>
        !isGlobal ? null : (
          <Link to={`/datasets/${r.dataset_id}/history`} className="text-brand-600 text-sm">
            View dataset
          </Link>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Transformation History" subtitle="Audit trail of applied transformations" />
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          placeholder="Search..."
          className="rounded-lg border px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select className="rounded-lg border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
        <select className="rounded-lg border px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {TRANSFORM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} data={data.items} />
    </div>
  );
}
