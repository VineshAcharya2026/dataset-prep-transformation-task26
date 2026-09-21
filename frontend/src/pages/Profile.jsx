import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: '', email: '' });

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name, email: user.email });
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put('/profile', form);
      toast('Profile updated', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Profile" />
      <form onSubmit={save} className="max-w-md space-y-4 rounded-xl border bg-white p-6">
        <div>
          <label className="text-sm text-slate-600">Username</label>
          <p className="font-medium">{user?.username}</p>
        </div>
        <div>
          <label className="text-sm text-slate-600">Role</label>
          <p className="font-medium">{user?.role?.replace(/_/g, ' ')}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Full name</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
          Save changes
        </button>
      </form>
    </div>
  );
}
