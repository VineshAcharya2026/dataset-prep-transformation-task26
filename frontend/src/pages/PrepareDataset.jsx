import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { TransformationStepList, WorkflowStepper } from '../components/StepList';
import { DATA_TYPES, FILTER_OPS, TRANSFORM_TYPES } from '../constants/transformations';
import { useToast } from '../context/ToastContext';

const emptyForm = {
  transformation_type: 'TRIM_WHITESPACE',
  column_name: '',
  configuration: {},
};

export default function PrepareDataset() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [steps, setSteps] = useState([]);
  const [columns, setColumns] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);

  const load = () => {
    api.get(`/datasets/${id}/transformations`).then((res) => setSteps(res.data.data));
    api.get(`/datasets/${id}/preview`).then((res) => {
      setColumns(res.data.data.columns.map((c) => c.name));
      setPreviewRows(res.data.data.records);
    });
  };

  useEffect(() => {
    load();
  }, [id]);

  const refreshPreview = async () => {
    try {
      const res = await api.post(`/datasets/${id}/transformations/preview`, {});
      setPreviewRows(res.data.data.records);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, column_name: columns[0] || '' });
    setModalOpen(true);
  };

  const openEdit = (step) => {
    setEditId(step.id);
    setForm({
      transformation_type: step.transformation_type,
      column_name: step.column_name || '',
      configuration: step.configuration || {},
    });
    setModalOpen(true);
  };

  const saveStep = async () => {
    const payload = {
      transformation_type: form.transformation_type,
      column_name: form.column_name || form.configuration.column,
      configuration: { ...form.configuration, column: form.column_name || form.configuration.filterColumn },
    };
    try {
      if (editId) await api.put(`/transformations/${editId}`, payload);
      else await api.post(`/datasets/${id}/transform`, payload);
      setModalOpen(false);
      load();
      await refreshPreview();
      toast('Transformation saved', 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const deleteStep = async (stepId) => {
    try {
      await api.delete(`/transformations/${stepId}`);
      load();
      await refreshPreview();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const reorder = async (orderedIds) => {
    await api.put(`/datasets/${id}/transformations/reorder`, { orderedIds });
    load();
  };

  const move = (stepId, dir) => {
    const ids = steps.map((s) => s.id);
    const idx = ids.indexOf(stepId);
    const swap = idx + dir;
    if (swap < 0 || swap >= ids.length) return;
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    reorder(ids);
  };

  const typeMeta = TRANSFORM_TYPES.find((t) => t.value === form.transformation_type);

  return (
    <div>
      <WorkflowStepper current={2} />
      <PageHeader
        title="Transformation Builder"
        subtitle="Build an ordered sequence of transformation steps"
        actions={
          <>
            <button type="button" onClick={openAdd} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
              Add transformation
            </button>
            <button
              type="button"
              onClick={() => navigate(`/datasets/${id}/transform-preview`)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Preview changes
            </button>
          </>
        }
      />
      <TransformationStepList
        steps={steps}
        onMoveUp={(sid) => move(sid, -1)}
        onMoveDown={(sid) => move(sid, 1)}
        onEdit={openEdit}
        onDelete={deleteStep}
      />
      <h3 className="mb-2 mt-8 font-semibold">Live preview (first rows)</h3>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {previewRows[0] &&
                Object.keys(previewRows[0]).map((k) => (
                  <th key={k} className="px-3 py-2 text-left">
                    {k}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-t">
                {Object.values(row).map((v, j) => (
                  <td key={j} className="px-3 py-2">
                    {String(v ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link to={`/datasets/${id}/preview`} className="mt-4 inline-block text-sm text-brand-600">
        ← Back to inspect
      </Link>

      <Modal
        open={modalOpen}
        title={editId ? 'Edit transformation' : 'Add transformation'}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="rounded bg-brand-600 px-4 py-2 text-sm text-white" onClick={saveStep}>
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <label className="font-medium">Type</label>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.transformation_type}
              onChange={(e) => setForm({ ...form, transformation_type: e.target.value })}
            >
              {TRANSFORM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {typeMeta?.needsColumn && (
            <div>
              <label className="font-medium">Column</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.column_name}
                onChange={(e) => setForm({ ...form, column_name: e.target.value })}
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
          {form.transformation_type === 'RENAME_COLUMN' && (
            <input
              placeholder="New column name"
              className="w-full rounded border px-3 py-2"
              value={form.configuration.newName || ''}
              onChange={(e) => setForm({ ...form, configuration: { ...form.configuration, newName: e.target.value } })}
            />
          )}
          {form.transformation_type === 'CHANGE_DATA_TYPE' && (
            <select
              className="w-full rounded border px-3 py-2"
              value={form.configuration.targetType || 'String'}
              onChange={(e) => setForm({ ...form, configuration: { ...form.configuration, targetType: e.target.value } })}
            >
              {DATA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          {form.transformation_type === 'REPLACE_NULL' && (
            <input
              placeholder="Fill value"
              className="w-full rounded border px-3 py-2"
              value={form.configuration.fillValue ?? ''}
              onChange={(e) => setForm({ ...form, configuration: { ...form.configuration, fillValue: e.target.value } })}
            />
          )}
          {(form.transformation_type === 'ROUND_DECIMAL' || form.transformation_type === 'ADD_NUMERIC' || form.transformation_type === 'MULTIPLY_NUMERIC') && (
            <input
              type="number"
              placeholder={form.transformation_type === 'ROUND_DECIMAL' ? 'Decimal places' : 'Operand'}
              className="w-full rounded border px-3 py-2"
              value={form.configuration[form.transformation_type === 'ROUND_DECIMAL' ? 'decimals' : 'operand'] ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  configuration: {
                    ...form.configuration,
                    [form.transformation_type === 'ROUND_DECIMAL' ? 'decimals' : 'operand']: e.target.value,
                  },
                })
              }
            />
          )}
          {form.transformation_type === 'FILTER_ROWS' && (
            <>
              <select
                className="w-full rounded border px-3 py-2"
                value={form.configuration.filterColumn || columns[0]}
                onChange={(e) => setForm({ ...form, configuration: { ...form.configuration, filterColumn: e.target.value } })}
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded border px-3 py-2"
                value={form.configuration.operator || 'eq'}
                onChange={(e) => setForm({ ...form, configuration: { ...form.configuration, operator: e.target.value } })}
              >
                {FILTER_OPS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                placeholder="Value"
                className="w-full rounded border px-3 py-2"
                value={form.configuration.value ?? ''}
                onChange={(e) => setForm({ ...form, configuration: { ...form.configuration, value: e.target.value } })}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
