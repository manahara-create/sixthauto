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
import AccountantDashboard from "./components/Dashboard/Accountant/AccountantDashboard";
import CEODashboard from "./components/Dashboard/CEODashboard";
import EmployeeDashboard from "./components/Dashboard/EmployeeDashboard";

// Layout
import DashboardLayout from "./components/Layout/DashboardLayout";

//Accountant Component
import AccountantEPFETF from "./components/Dashboard/Accountant/AccountantEPFETF";
import AccountantKPI from "./components/Dashboard/Accountant/AccountantKPI";
import AccountantLoan from "./components/Dashboard/Accountant/AccountantLoan";
import AccountantPayRoll from "./components/Dashboard/Accountant/AccountantPayRol";
import AccountantReport from "./components/Dashboard/Accountant/AccountantReport";
import AccountantSalary from "./components/Dashboard/Accountant/AccountantSalary";

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
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

          {/* ---------- ACCOUNTANT REDIRECTS ---------- */}
          <Route path="/accountant/epf-etf" element={
            <DashboardLayout>
              <AccountantEPFETF />
            </DashboardLayout>
          } />
          <Route path="/accountant/kpi" element={
            <DashboardLayout>
              <AccountantKPI />
            </DashboardLayout>
          } />
          <Route path="/accountant/loan" element={
            <DashboardLayout>
              <AccountantLoan />
            </DashboardLayout>
          } />
          <Route path="/accountant/payroll" element={
            <DashboardLayout>
              <AccountantPayRoll />
            </DashboardLayout>
          } />
          <Route path="/accountant/report" element={
            <DashboardLayout>
              <AccountantReport />
            </DashboardLayout>
          } />
          <Route path="/accountant/salary" element={
            <DashboardLayout>
              <AccountantSalary />
            </DashboardLayout>
          } />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
