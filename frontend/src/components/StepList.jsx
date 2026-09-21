const STEPS = ['Select', 'Inspect', 'Transform', 'Preview', 'Validate', 'Save'];

export function WorkflowStepper({ current = 0 }) {
  return (
    <ol className="mb-8 flex flex-wrap gap-2">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            i <= current ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

export function TransformationStepList({ steps, onMoveUp, onMoveDown, onEdit, onDelete }) {
  if (!steps?.length) {
    return <p className="text-sm text-slate-500">No transformation steps yet. Add your first step.</p>;
  }
  return (
    <ul className="space-y-2">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3"
        >
          <div>
            <span className="mr-2 text-xs font-bold text-brand-600">Step {index + 1}</span>
            <span className="font-medium text-slate-800">{step.transformation_type.replace(/_/g, ' ')}</span>
            {step.column_name && <span className="ml-2 text-sm text-slate-500">({step.column_name})</span>}
          </div>
          <div className="flex gap-1">
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => onMoveUp?.(step.id)}>
              ↑
            </button>
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => onMoveDown?.(step.id)}>
              ↓
            </button>
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => onEdit?.(step)}>
              Edit
            </button>
            <button type="button" className="rounded border border-red-200 px-2 py-1 text-xs text-red-600" onClick={() => onDelete?.(step.id)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
