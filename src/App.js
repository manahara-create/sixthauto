// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin, Layout } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

// Dashboard Components
import DashboardLayout from './components/Layout/DashboardLayout';
import CEODashboard from './components/Dashboard/CEODashboard';
import HRDashboard from './components/Dashboard/HRDashboard';
import ManagerDashboard from './components/Dashboard/ManagerDashboard';
import EmployeeDashboard from './components/Dashboard/EmployeeDashboard';
import AccountantDashboard from './components/Dashboard/AccountantDashboard';

import 'antd/dist/reset.css';

// Dashboard Router Component
const DashboardRouter = () => {
  const { profile } = useAuth();
  
  if (!profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  switch (profile.role) {
    case 'ceo':
      return <CEODashboard />;
    case 'hr':
      return <HRDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (user && profile) {
    return children;
  }

  if (user && !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Setting up your profile..." />
      </div>
    );
  }

  return <Navigate to="/login" />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, profile, loading, getDashboardRoute } = useAuth(); // ✅ one single hook call

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (user && profile) {
    return <Navigate to={getDashboardRoute(profile.role)} />;
  }

  return children;
};


// Main App Content
function AppContent() {
  const { profile } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Protected Routes with Dashboard Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Routes */}
          <Route path="ceo-dashboard" element={<DashboardRouter />} />
          <Route path="hr-dashboard" element={<DashboardRouter />} />
          <Route path="manager-dashboard" element={<DashboardRouter />} />
          <Route path="employee-dashboard" element={<DashboardRouter />} />
          <Route path="accountant-dashboard" element={<DashboardRouter />} />
          
          {/* Default route based on user role */}
          <Route 
            index 
            element={
              profile ? (
                <Navigate to={`/${profile.role}-dashboard`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Route>

        {/* Catch all route - redirect to appropriate dashboard */}
        <Route 
          path="*" 
          element={
            profile ? (
              <Navigate to={`/${profile.role}-dashboard`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Layout>
  );
}

// Main App Component
function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          colorBgContainer: '#ffffff',
        },
        components: {
          Layout: {
            bodyBg: '#f5f5f5',
            headerBg: '#001529',
            siderBg: '#001529',
          },
          Card: {
            borderRadiusLG: 8,
          },
          Button: {
            borderRadius: 6,
          },
          Input: {
            borderRadius: 6,
          },
        },
      }}
    >
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;