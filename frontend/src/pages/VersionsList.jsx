import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { WorkflowStepper } from '../components/StepList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function VersionsList() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [versions, setVersions] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => api.get(`/datasets/${id}/versions`).then((res) => setVersions(res.data.data));

  useEffect(() => {
    load();
  }, [id]);

  const columns = [
    { key: 'version_number', label: 'Version' },
    { key: 'version_name', label: 'Name' },
    { key: 'row_count', label: 'Records' },
    { key: 'column_count', label: 'Columns' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'creator_name', label: 'Created by' },
    { key: 'created_at', label: 'Created', render: (r) => new Date(r.created_at).toLocaleString() },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Link to={`/datasets/${id}/versions/${r.id}`} className="text-brand-600 hover:underline">
            Details
          </Link>
          {hasRole('ADMIN') && r.version_number > 1 && (
            <button type="button" className="text-red-600 hover:underline" onClick={() => setDeleteId(r.id)}>
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <WorkflowStepper current={5} />
      <PageHeader title="Prepared Dataset Versions" subtitle="Immutable versions — original data is never overwritten" />
      <DataTable columns={columns} data={versions} emptyMessage="No versions yet" />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete version"
        message="This prepared version will be permanently removed."
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await api.delete(`/datasets/${id}/versions/${deleteId}`);
            toast('Version deleted', 'success');
            setDeleteId(null);
            load();
          } catch (e) {
            toast(e.message, 'error');
          }
        }}
      />
    </div>
  );
}
