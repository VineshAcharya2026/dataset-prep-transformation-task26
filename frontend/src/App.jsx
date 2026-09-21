import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminConfigs from './pages/AdminConfigs';
import Dashboard from './pages/Dashboard';
import DatasetDetail from './pages/DatasetDetail';
import DatasetList from './pages/DatasetList';
import DatasetPreview from './pages/DatasetPreview';
import HistoryPage from './pages/HistoryPage';
import Login from './pages/Login';
import PrepareDataset from './pages/PrepareDataset';
import Profile from './pages/Profile';
import TransformPreviewPage from './pages/TransformPreviewPage';
import ValidationPage from './pages/ValidationPage';
import VersionDetail from './pages/VersionDetail';
import VersionsList from './pages/VersionsList';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="datasets" element={<DatasetList />} />
        <Route path="datasets/:id" element={<DatasetDetail />} />
        <Route path="datasets/:id/preview" element={<DatasetPreview />} />
        <Route path="datasets/:id/prepare" element={<PrepareDataset />} />
        <Route path="datasets/:id/transform-preview" element={<TransformPreviewPage />} />
        <Route path="datasets/:id/validate" element={<ValidationPage />} />
        <Route path="datasets/:id/versions" element={<VersionsList />} />
        <Route path="datasets/:id/versions/:versionId" element={<VersionDetail />} />
        <Route path="datasets/:id/history" element={<HistoryPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="profile" element={<Profile />} />
        <Route
          path="admin/configs"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminConfigs />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
