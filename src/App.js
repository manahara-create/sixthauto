import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";

// Auth Pages
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";

// Dashboards
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import HRDashboard from "./components/Dashboard/HRDashboard";
import ManagerDashboard from "./components/Dashboard/ManagerDashboard";
import AccountantDashboard from "./components/Dashboard/AccountantDashboard";
import CEODashboard from "./components/Dashboard/CEODashboard";
import EmployeeDashboard from "./components/Dashboard/EmployeeDashboard";

// Layout
import DashboardLayout from "./components/Layout/DashboardLayout";

function App() {
  return (
    <ConfigProvider>
      <Router>
        <Routes>
          {/* ---------- AUTH ROUTES ---------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ---------- DASHBOARD ROUTES ---------- */}
          <Route
            path="/admin/dashboard"
            element={
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            }
          />

          <Route
            path="/hr/dashboard"
            element={
              <DashboardLayout>
                <HRDashboard />
              </DashboardLayout>
            }
          />

          <Route
            path="/manager/dashboard"
            element={
              <DashboardLayout>
                <ManagerDashboard />
              </DashboardLayout>
            }
          />

          <Route
            path="/accountant/dashboard"
            element={
              <DashboardLayout>
                <AccountantDashboard />
              </DashboardLayout>
            }
          />

          <Route
            path="/ceo/dashboard"
            element={
              <DashboardLayout>
                <CEODashboard />
              </DashboardLayout>
            }
          />

          <Route
            path="/employee/dashboard"
            element={
              <DashboardLayout>
                <EmployeeDashboard />
              </DashboardLayout>
            }
          />

          {/* ---------- DEFAULT REDIRECTS ---------- */}
          <Route path="/" element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
