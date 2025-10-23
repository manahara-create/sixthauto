// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute.js';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

// Dashboard Components
import AdminDashboard from './components/Dashboard/AdminDashboard';
import HRDashboard from './components/Dashboard/HRDashboard';
import ManagerDashboard from './components/Dashboard/ManagerDashboard';
import AccountantDashboard from './components/Dashboard/AccountantDashboard';
import CEODashboard from './components/Dashboard/CEODashboard';
import EmployeeDashboard from './components/Dashboard/EmployeeDashboard';
import DashboardLayout from './components/Layout/DashboardLayout';

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/register" 
        element={!user ? <Register /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/forgot-password" 
        element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/reset-password" 
        element={!user ? <ResetPassword /> : <Navigate to="/dashboard" replace />} 
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleBasedDashboard />} />
      </Route>

      {/* Role-specific dashboard routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/hr/*"
        element={
          <ProtectedRoute allowedRoles={['hr']}>
            <DashboardLayout>
              <HRDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/manager/*"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <DashboardLayout>
              <ManagerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/accountant/*"
        element={
          <ProtectedRoute allowedRoles={['accountant']}>
            <DashboardLayout>
              <AccountantDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/ceo/*"
        element={
          <ProtectedRoute allowedRoles={['ceo']}>
            <DashboardLayout>
              <CEODashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <DashboardLayout>
              <EmployeeDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Component to redirect users to their role-specific dashboard
function RoleBasedDashboard() {
  const { profile } = useAuth();
  
  if (!profile) {
    return <div>Loading profile...</div>;
  }

  // Redirect to role-specific dashboard
  switch (profile.role?.toLowerCase()) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'hr':
      return <Navigate to="/hr" replace />;
    case 'manager':
      return <Navigate to="/manager" replace />;
    case 'accountant':
      return <Navigate to="/accountant" replace />;
    case 'ceo':
      return <Navigate to="/ceo" replace />;
    case 'employee':
    default:
      return <Navigate to="/employee" replace />;
  }
}

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;