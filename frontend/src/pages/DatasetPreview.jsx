import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import { WorkflowStepper } from '../components/StepList';

export default function DatasetPreview() {
  const { id } = useParams();
  const [preview, setPreview] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);

  useEffect(() => {
    api.get(`/datasets/${id}/preview`).then((res) => setPreview(res.data.data));
  }, [id]);

  if (!preview) return <div className="text-slate-500">Loading preview...</div>;

  return (
    <div>
      <WorkflowStepper current={1} />
      <PageHeader title="Dataset Preview" subtitle={preview.dataset.name} />
      <div className="mb-4 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {preview.columns.map((c) => (
                <th
                  key={c.name}
                  className={`cursor-pointer px-3 py-2 text-left ${selectedColumn === c.name ? 'bg-brand-50 text-brand-700' : ''}`}
                  onClick={() => setSelectedColumn(c.name)}
                >
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.records.map((row, i) => (
              <tr key={i} className="border-t">
                {preview.columns.map((c) => (
                  <td key={c.name} className="px-3 py-2">
                    {String(row[c.name] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {preview.columns.map((c) => (
          <div key={c.name} className="rounded-lg border bg-white p-4 text-sm">
            <p className="font-medium">{c.name}</p>
            <p className="text-slate-500">Type: {c.dataType}</p>
            <p className="text-slate-500">Nulls: {c.nullCount}</p>
            <p className="text-slate-500">Unique: {c.uniqueCount}</p>
          </div>
        ))}
      </div>
      {selectedColumn && (
        <p className="mt-4 text-sm text-brand-700">Selected column for transformation: <strong>{selectedColumn}</strong></p>
      )}
    </div>
  );
}
