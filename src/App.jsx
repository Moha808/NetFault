import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import UserDashboard from './pages/user/UserDashboard';
import ReportFault from './pages/user/ReportFault';
import MyReports from './pages/user/MyReports';
import ReportDetail from './pages/user/ReportDetail';
import Profile from './pages/user/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AllReports from './pages/admin/AllReports';
import AdminReportDetail from './pages/admin/ReportDetail';
import ManageCategories from './pages/admin/ManageCategories';
import ManageUsers from './pages/admin/ManageUsers';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User routes */}
        <Route path="/dashboard" element={<ProtectedRoute requireRole="user"><UserDashboard /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute requireRole="user"><ReportFault /></ProtectedRoute>} />
        <Route path="/my-reports" element={<ProtectedRoute requireRole="user"><MyReports /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requireRole="user"><Profile /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requireRole="admin"><AllReports /></ProtectedRoute>} />
        <Route path="/admin/reports/:id" element={<ProtectedRoute requireRole="admin"><AdminReportDetail /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute requireRole="admin"><ManageCategories /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireRole="admin"><ManageUsers /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
