// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider, Spin } from 'antd';
import ProtectedRoute from './contexts/ProtectedRoute';
import Layout from './contexts/Layout';
import { useAuth } from './contexts/AuthContext';

// Auth Components
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

// Dashboard Components
import EmployeeDashboard from './components/Dashboard/EmployeeDashboard';
import ManagerDashboard from './components/Dashboard/ManagerDashboard';
import HRDashboard from './components/Dashboard/HRDashboard';
import AccountantDashboard from './components/Dashboard/AccountantDashboard';
import CEODashboard from './components/Dashboard/CEODashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';

// Common Components
import Profile from './components/Profiles/Profiles';
import LeaveManagement from './components/Common/LeaveManagement';
import Attendance from './components/Common/Attendance';

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<RoleBasedDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="leaves" element={<LeaveManagement />} />
              <Route path="attendance" element={<Attendance />} />
              
              {/* Role-specific routes */}
              <Route path="admin/*" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="hr/*" element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <HRDashboard />
                </ProtectedRoute>
              } />
              <Route path="manager/*" element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } />
              <Route path="accountant/*" element={
                <ProtectedRoute allowedRoles={['accountant']}>
                  <AccountantDashboard />
                </ProtectedRoute>
              } />
              <Route path="ceo/*" element={
                <ProtectedRoute allowedRoles={['ceo']}>
                  <CEODashboard />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

// Component to redirect users to their role-specific dashboard
const RoleBasedDashboard = () => {
  const { profile } = useAuth();
  
  if (!profile) return <Spin size="large" />;
  
  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'hr':
      return <HRDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'ceo':
      return <CEODashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

export default App;