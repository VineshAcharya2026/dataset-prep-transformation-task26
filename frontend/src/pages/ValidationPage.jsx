import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { WorkflowStepper } from '../components/StepList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ValidationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [result, setResult] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [versionName, setVersionName] = useState('Prepared Dataset');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!hasRole('ADMIN', 'DATA_STEWARD')) return;
    api
      .post(`/datasets/${id}/validate`, {})
      .then((res) => setResult(res.data.data))
      .catch((e) => toast(e.message, 'error'));
  }, [id, toast, hasRole]);

  if (!hasRole('ADMIN', 'DATA_STEWARD')) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Your role cannot run validation or save prepared versions. Contact a data steward.
      </div>
    );
  }

  const saveVersion = async () => {
    try {
      await api.post(`/datasets/${id}/versions`, { version_name: versionName, description });
      toast('Prepared version saved', 'success');
      navigate(`/datasets/${id}/versions`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!result) return <div className="text-slate-500">Running validation...</div>;

  return (
    <div>
      <WorkflowStepper current={4} />
      <PageHeader
        title="Validation Results"
        actions={
          <button type="button" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => setSaveOpen(true)}>
            Save prepared version
          </button>
        }
      />
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-slate-600">Validation status:</span>
        <StatusBadge status={result.validation_status} />
      </div>
      <dl className="grid max-w-xl gap-3 rounded-xl border bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Total records</dt>
          <dd className="text-lg font-semibold">{result.total_records}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Valid records</dt>
          <dd className="text-lg font-semibold">{result.valid_records}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Invalid records</dt>
          <dd className="text-lg font-semibold">{result.invalid_records}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Remaining null values</dt>
          <dd className="text-lg font-semibold">{result.null_values}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Duplicate records</dt>
          <dd className="text-lg font-semibold">{result.duplicate_records}</dd>
        </div>
      </dl>
      <Link to={`/datasets/${id}/transform-preview`} className="mt-6 inline-block text-sm text-brand-600">
        ← Back to preview
      </Link>

      <Modal
        open={saveOpen}
        title="Save prepared version"
        onClose={() => setSaveOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setSaveOpen(false)}>
              Cancel
            </button>
            <button type="button" className="rounded bg-brand-600 px-4 py-2 text-sm text-white" onClick={saveVersion}>
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <input
            className="w-full rounded border px-3 py-2"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="Version name"
          />
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
        </div>
      </Modal>
    </div>
  );
}
