import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// Import all dashboard components
import CEODashboard from './CEODashboard';
import ManagerDashboard from './ManagerDashboard';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import HRDashboard from './HRDashboard';
import AccountantDashboard from './AccountantDashboard';

const DashboardRouter = () => {
  const { profile } = useAuth();

  if (!profile) {
    return <div>Loading...</div>;
  }

  const renderDashboard = () => {
    const userRole = profile.role?.toLowerCase();
    
    switch (userRole) {
      case 'ceo':
        return <CEODashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'hr':
        return <HRDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'accountant':
        return <AccountantDashboard />;
      case 'employee':
      default:
        return <EmployeeDashboard />;
    }
  };

  return renderDashboard();
};

export default DashboardRouter;