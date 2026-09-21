import { useEffect, useState } from 'react';
import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { useToast } from '../context/ToastContext';

const ROLES = ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'];

export default function AdminConfigs() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState([]);

  const load = () => api.get('/transformation-configs').then((res) => setConfigs(res.data.data));

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (cfg, role) => {
    const roles = cfg.allowed_roles.includes(role)
      ? cfg.allowed_roles.filter((r) => r !== role)
      : [...cfg.allowed_roles, role];
    try {
      await api.put(`/transformation-configs/${cfg.id}`, { enabled: cfg.enabled, allowed_roles: roles });
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const toggleEnabled = async (cfg) => {
    try {
      await api.put(`/transformation-configs/${cfg.id}`, { enabled: !cfg.enabled, allowed_roles: cfg.allowed_roles });
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const columns = [
    { key: 'display_name', label: 'Transformation' },
    { key: 'transformation_type', label: 'Type' },
    {
      key: 'enabled',
      label: 'Enabled',
      render: (r) => (
        <button type="button" className="text-sm text-brand-600" onClick={() => toggleEnabled(r)}>
          {r.enabled ? 'Yes' : 'No'}
        </button>
      ),
    },
    {
      key: 'roles',
      label: 'Allowed roles',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className={`rounded px-2 py-0.5 text-xs ${r.allowed_roles.includes(role) ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-500'}`}
              onClick={() => toggleRole(r, role)}
            >
              {role.replace('DATA_', '')}
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Transformation Configurations" subtitle="Manage which roles can use each transformation type" />
      <DataTable columns={columns} data={configs} />
    </div>
  );
}
