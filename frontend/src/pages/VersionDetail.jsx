import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export default function VersionDetail() {
  const { id, versionId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/datasets/${id}/versions/${versionId}`).then((res) => setData(res.data.data));
  }, [id, versionId]);

  if (!data) return <div className="text-slate-500">Loading...</div>;
  const { version, transformations, validation } = data;

  return (
    <div>
      <PageHeader title={version.version_name} subtitle={`Version ${version.version_number}`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-sm">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-slate-500">Records</p>
          <p className="text-xl font-semibold">{version.row_count}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-slate-500">Columns</p>
          <p className="text-xl font-semibold">{version.column_count}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-slate-500">Created by</p>
          <p className="font-medium">{version.creator_name}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-slate-500">Created</p>
          <p>{new Date(version.created_at).toLocaleString()}</p>
        </div>
      </div>
      <h3 className="mb-2 font-semibold">Applied transformations</h3>
      <ol className="mb-8 list-decimal space-y-1 pl-5 text-sm">
        {transformations.map((t) => (
          <li key={t.id}>
            {t.transformation_type.replace(/_/g, ' ')} {t.column_name && `— ${t.column_name}`}
          </li>
        ))}
      </ol>
      {validation && (
        <>
          <h3 className="mb-2 font-semibold">Validation</h3>
          <div className="flex items-center gap-2 text-sm">
            <StatusBadge status={validation.validation_status} />
            <span>
              {validation.valid_records} valid / {validation.total_records} total · {validation.null_values} nulls ·{' '}
              {validation.duplicate_records} duplicates
            </span>
          </div>
        </>
      )}
    </div>
  );
}
