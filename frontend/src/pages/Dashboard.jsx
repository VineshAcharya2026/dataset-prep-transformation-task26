import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/dashboard/data-preparation')
      .then((res) => setData(res.data.data))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!data) return <div className="text-slate-500">Loading dashboard...</div>;

  const { summary, charts } = data;

  return (
    <div>
      <PageHeader title="Data Preparation Dashboard" subtitle="Overview of datasets and transformation activity" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Datasets" value={summary.totalDatasets} />
        <StatCard title="Prepared Datasets" value={summary.preparedDatasets} />
        <StatCard title="Transformation Runs" value={summary.transformationRuns} />
        <StatCard title="Successful" value={summary.successfulTransformations} />
        <StatCard title="Failed" value={summary.failedTransformations} />
        <StatCard title="Records Processed" value={summary.recordsProcessed} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 font-semibold text-slate-800">Transformations by Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.transformationsByType}>
              <XAxis dataKey="type" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 font-semibold text-slate-800">Successful vs Failed</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.successVsFailed} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {charts.successVsFailed.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-800">Dataset Preparation Activity (14 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.activity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="runs" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
