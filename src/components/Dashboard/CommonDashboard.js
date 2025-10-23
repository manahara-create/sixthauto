import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmployeeDashboard from './EmployeeDashboard';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';
import AccountantDashboard from './AccountantDashboard';
import CEODashboard from './CEODashboard';
import AdminDashboard from './AdminDashboard';

const CommonDashboard = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>Please log in to access the dashboard</div>
      </div>
    );
  }

  const renderDashboard = () => {
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
      case 'employee':
      default:
        return <EmployeeDashboard />;
    }
  };

  return renderDashboard();
};

export default CommonDashboard;