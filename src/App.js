import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";

// Auth Pages
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";

// Dashboards
import AdminDashboard from "./components/Dashboard/Admin/AdminDashboard";
import HRDashboard from "./components/Dashboard/HR/HRDashboard";
import ManagerDashboard from "./components/Dashboard/Manager/ManagerDashboard";
import AccountantDashboard from "./components/Dashboard/Accountant/AccountantDashboard";
import CEODashboard from "./components/Dashboard/CEO/CEODashboard";
import EmployeeDashboard from "./components/Dashboard/Employee/EmployeeDashboard";

// Layout
import DashboardLayout from "./components/Layout/DashboardLayout";

//Accountant Component
import AccountantEPFETF from "./components/Dashboard/Accountant/AccountantEPFETF";
import AccountantKPI from "./components/Dashboard/Accountant/AccountantKPI";
import AccountantLoan from "./components/Dashboard/Accountant/AccountantLoan";
import AccountantPayRoll from "./components/Dashboard/Accountant/AccountantPayRol";
import AccountantReport from "./components/Dashboard/Accountant/AccountantReport";
import AccountantSalary from "./components/Dashboard/Accountant/AccountantSalary";

//Admin Component
import AdminEmployee from "./components/Dashboard/Admin/AdminEmployee";
import AdminPayment from "./components/Dashboard/Admin/AdminPayment";
import AdminReport from "./components/Dashboard/Admin/AdminReports";

//CEO Component
import CEOEmployee from "./components/Dashboard/CEO/CEOEmployee";
import CEOPayment from "./components/Dashboard/CEO/CEOPayment";
import CEOReport from "./components/Dashboard/CEO/CEOReports";

//Employee Component
import EmployeeLeaves from "./components/Dashboard/Employee/EmployeeEmployee";
import EmployeePayments from "./components/Dashboard/Employee/EmployeePayment";
import EmployeeReports from "./components/Dashboard/Employee/EmployeeReports";

//HR Component
import HREmployee from "./components/Dashboard/HR/HREmployee"
import HRPayments from "./components/Dashboard/HR/HRPayment";
import HRReports from "./components/Dashboard/HR/HRReport";

//Manager Component

import ManagerReports from "./components/Dashboard/Manager/ManagerReport";
import ManagerTasks from "./components/Dashboard/Manager/ManagerPayment";
import ManagerTeam from "./components/Dashboard/Manager/ManagerEmployee";

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

          {/* ---------- ADMIN REDIRECTS ---------- */}
          <Route path="/admin/employee" element={
            <DashboardLayout>
              <AdminEmployee>
              </AdminEmployee>
            </DashboardLayout>
          } />

          <Route path="/admin/payement" element={
            <DashboardLayout>
              <AdminPayment>
              </AdminPayment>
            </DashboardLayout>
          } />

          <Route path="/admin/reports" element={
            <DashboardLayout>
              <AdminReport>
              </AdminReport>
            </DashboardLayout>
          } />

          {/* ---------- EMPLOYEE REDIRECTS ---------- */}
          <Route path="/employee/employee" element={
            <DashboardLayout>
              <EmployeeLeaves>
              </EmployeeLeaves>
            </DashboardLayout>
          } />

          <Route path="/employee/payement" element={
            <DashboardLayout>
              <EmployeePayments>
              </EmployeePayments>
            </DashboardLayout>
          } />

          <Route path="/employee/reports" element={
            <DashboardLayout>
              <EmployeeReports>
              </EmployeeReports>
            </DashboardLayout>
          } />

          {/* ---------- CEO REDIRECTS ---------- */}
          <Route path="/ceo/employee" element={
            <DashboardLayout>
              <CEOEmployee>
              </CEOEmployee>
            </DashboardLayout>
          } />

          <Route path="/ceo/payement" element={
            <DashboardLayout>
              <CEOPayment>
              </CEOPayment>
            </DashboardLayout>
          } />

          <Route path="/ceo/reports" element={
            <DashboardLayout>
              <CEOReport>
              </CEOReport>
            </DashboardLayout>
          } />

          {/* ---------- HR REDIRECTS ---------- */}
          <Route path="/hr/employee" element={
            <DashboardLayout>
              <HREmployee>
              </HREmployee>
            </DashboardLayout>
          } />

          <Route path="/hr/payement" element={
            <DashboardLayout>
              <HRPayments>
              </HRPayments>
            </DashboardLayout>
          } />

          <Route path="/hr/reports" element={
            <DashboardLayout>
              <HRReports>
              </HRReports>
            </DashboardLayout>
          } />

          {/* ---------- MANAGER REDIRECTS ---------- */}
          <Route path="/manager/employee" element={
            <DashboardLayout>
              <ManagerTeam>
              </ManagerTeam>
            </DashboardLayout>
          } />

          <Route path="/manager/tasks" element={
            <DashboardLayout>
              <ManagerTasks>
              </ManagerTasks>
            </DashboardLayout>
          } />

          <Route path="/manager/reports" element={
            <DashboardLayout>
              <ManagerReports>
              </ManagerReports>
            </DashboardLayout>
          } />

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
