import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export default function DatasetDetail() {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    api.get(`/datasets/${id}`).then((res) => setDataset(res.data.data));
    api.get(`/datasets/${id}/versions`).then((res) => setVersions(res.data.data));
  }, [id]);

  if (!dataset) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <PageHeader
        title={dataset.name}
        subtitle={dataset.description}
        actions={
          <>
            <Link to={`/datasets/${id}/preview`} className="rounded-lg border px-4 py-2 text-sm">
              Preview
            </Link>
            {dataset.status === 'PROCESSED' && (
              <Link to={`/datasets/${id}/prepare`} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
                Prepare Dataset
              </Link>
            )}
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <dl className="rounded-xl border bg-white p-5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <dt className="text-slate-500">File</dt>
            <dd>{dataset.file_name}</dd>
            <dt className="text-slate-500">Type</dt>
            <dd>{dataset.file_type}</dd>
            <dt className="text-slate-500">Rows / Columns</dt>
            <dd>
              {dataset.row_count} / {dataset.column_count}
            </dd>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <StatusBadge status={dataset.status} />
            </dd>
            <dt className="text-slate-500">Quality Score</dt>
            <dd>{dataset.quality_score != null ? `${dataset.quality_score}%` : '—'}</dd>
            <dt className="text-slate-500">Created by</dt>
            <dd>{dataset.creator_name}</dd>
          </div>
        </dl>
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-slate-800">Prepared Versions</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {versions.map((v) => (
              <li key={v.id} className="flex justify-between border-b border-slate-100 pb-2">
                <Link to={`/datasets/${id}/versions/${v.id}`} className="text-brand-600 hover:underline">
                  v{v.version_number} – {v.version_name}
                </Link>
                <span className="text-slate-500">{v.row_count} rows</span>
              </li>
            ))}
          </ul>
          <Link to={`/datasets/${id}/versions`} className="mt-3 inline-block text-sm text-brand-600">
            View all versions →
          </Link>
        </div>
      </div>
    </div>
  );
}
