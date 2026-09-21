const styles = {
  PROCESSED: 'bg-emerald-100 text-emerald-800',
  PROCESSING: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-red-100 text-red-800',
  PASSED: 'bg-emerald-100 text-emerald-800',
  WARNING: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  SUCCESS: 'bg-emerald-100 text-emerald-800',
  DRAFT: 'bg-slate-100 text-slate-700',
};

export default function StatusBadge({ status }) {
  const key = status?.toUpperCase?.() || status;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[key] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
