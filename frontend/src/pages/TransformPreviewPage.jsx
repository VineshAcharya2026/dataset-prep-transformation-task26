import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { WorkflowStepper } from '../components/StepList';
import { useAuth } from '../context/AuthContext';

function SampleTable({ title, sample }) {
  if (!sample?.columns?.length) return null;
  return (
    <div>
      <h4 className="mb-2 font-medium text-slate-700">{title}</h4>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {sample.columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.rows.map((row, i) => (
              <tr key={i} className="border-t">
                {sample.columns.map((c) => (
                  <td key={c} className="px-3 py-2">
                    {String(row[c] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TransformPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.post(`/datasets/${id}/transformations/preview`, {}).then((res) => setData(res.data.data));
  }, [id]);

  if (!data) return <div className="text-slate-500">Loading preview...</div>;

  return (
    <div>
      <WorkflowStepper current={3} />
      <PageHeader title="Transformation Preview" subtitle="Review impact before validation and save" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Original records" value={data.originalRecordCount} />
        <StatCard title="Updated records" value={data.updatedRecordCount} />
        <StatCard title="Removed rows" value={data.removedRows} />
        <StatCard title="Original columns" value={data.originalColumnCount} />
        <StatCard title="Updated columns" value={data.updatedColumnCount} />
        <StatCard title="Modified values" value={data.modifiedValues} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SampleTable title="Before" sample={data.preview.before} />
        <SampleTable title="After" sample={data.preview.after} />
      </div>
      <div className="mt-8 flex gap-3">
        <Link to={`/datasets/${id}/prepare`} className="rounded-lg border px-4 py-2 text-sm">
          ← Edit steps
        </Link>
        {hasRole('ADMIN', 'DATA_STEWARD') && (
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white"
            onClick={() => navigate(`/datasets/${id}/validate`)}
          >
            Continue to validation →
          </button>
        )}
      </div>
    </div>
  );
}
