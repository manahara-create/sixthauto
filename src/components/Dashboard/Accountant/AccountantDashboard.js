import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Space, Tag, Button, DatePicker, message, Spin, Avatar } from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  BankOutlined,
  FileTextOutlined,
  TrophyOutlined,
  TeamOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

// Import child components
import AccountantPayroll from './AccountantPayRol';
import AccountantSalary from './AccountantSalary';
import AccountantEPFETF from './AccountantEPFETF';
import AccountantLoan from './AccountantLoan';
import AccountantKPI from './AccountantKPI';
import AccountantReport from './AccountantReport';

const { Header, Sider, Content } = Layout;
const { RangePicker } = DatePicker;

const AccountantDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [dashboardStats, setDashboardStats] = useState({
    totalSalary: 0,
    totalEPF: 0,
    totalETF: 0,
    pendingLoans: 0,
    activeEmployees: 0,
    pendingPayments: 0
  });

  const user = {
    email: 'accountant@company.com',
    name: 'Finance Team',
    role: 'Accountant'
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual Supabase queries
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDashboardStats({
        totalSalary: 285000,
        totalEPF: 57000,
        totalETF: 8550,
        pendingLoans: 12,
        activeEmployees: 45,
        pendingPayments: 8
      });
    } catch (error) {
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'payroll', icon: <TeamOutlined />, label: 'Payroll Management' },
    { key: 'salary', icon: <DollarOutlined />, label: 'Salary Processing' },
    { key: 'epf-etf', icon: <BankOutlined />, label: 'EPF/ETF' },
    { key: 'loans', icon: <DollarOutlined />, label: 'Loan Management' },
    { key: 'kpi', icon: <TrophyOutlined />, label: 'KPI Management' },
    { key: 'reports', icon: <FileTextOutlined />, label: 'Reports & Analytics' }
  ];

  const renderContent = () => {
    const commonProps = { dateRange, onRefresh: fetchDashboardData };

    switch (currentView) {
      case 'payroll':
        return <AccountantPayroll {...commonProps} />;
      case 'salary':
        return <AccountantSalary {...commonProps} />;
      case 'epf-etf':
        return <AccountantEPFETF {...commonProps} />;
      case 'loans':
        return <AccountantLoan {...commonProps} />;
      case 'kpi':
        return <AccountantKPI {...commonProps} />;
      case 'reports':
        return <AccountantReport {...commonProps} />;
      default:
        return <DashboardOverview stats={dashboardStats} />;
    }
  };

  if (loading && currentView === 'dashboard') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={250}
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{
          padding: '24px 16px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', marginBottom: 12 }} />
          <h3 style={{ color: '#fff', margin: 0, fontSize: 16 }}>{user.name}</h3>
          <Tag color="blue" style={{ marginTop: 8 }}>{user.role}</Tag>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[currentView]}
          onClick={({ key }) => setCurrentView(key)}
          style={{ 
            background: 'transparent', 
            border: 'none',
            marginTop: 16
          }}
          items={menuItems.map(item => ({
            ...item,
            style: { 
              color: '#fff',
              margin: '4px 8px',
              borderRadius: 8
            }
          }))}
          theme="dark"
        />

        <div style={{ 
          position: 'absolute', 
          bottom: 20, 
          left: 16, 
          right: 16 
        }}>
          <Button 
            danger 
            block 
            icon={<LogoutOutlined />}
            style={{ borderRadius: 8 }}
          >
            Logout
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Space>
            <BarChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <h2 style={{ margin: 0, color: '#1a1a2e' }}>Accountant Dashboard</h2>
          </Space>
          
          <Space>
            <CalendarOutlined style={{ color: '#666' }} />
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates)}
              format="YYYY-MM-DD"
              style={{ width: 280 }}
            />
          </Space>
        </Header>

        <Content style={{ 
          margin: '24px', 
          background: '#f0f2f5',
          borderRadius: 12,
          overflow: 'auto'
        }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

const DashboardOverview = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Salary Processed',
      value: stats.totalSalary,
      prefix: '$',
      color: '#1890ff',
      icon: <DollarOutlined />
    },
    {
      title: 'EPF Contributions',
      value: stats.totalEPF,
      prefix: '$',
      color: '#52c41a',
      icon: <BankOutlined />
    },
    {
      title: 'ETF Contributions',
      value: stats.totalETF,
      prefix: '$',
      color: '#722ed1',
      icon: <BankOutlined />
    },
    {
      title: 'Pending Loans',
      value: stats.pendingLoans,
      color: '#fa8c16',
      icon: <DollarOutlined />
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      color: '#13c2c2',
      icon: <TeamOutlined />
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      color: '#f5222d',
      icon: <FileTextOutlined />
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24, color: '#1a1a2e' }}>Financial Overview</h1>
      
      <Row gutter={[16, 16]}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card
              hoverable
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Space>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: stat.color
                  }}>
                    {stat.icon}
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: 14 }}>{stat.title}</div>
                    <Statistic
                      value={stat.value}
                      prefix={stat.prefix}
                      valueStyle={{ 
                        color: stat.color, 
                        fontSize: 28,
                        fontWeight: 600 
                      }}
                    />
                  </div>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="Quick Actions"
        style={{ 
          marginTop: 24, 
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <Space wrap size={12}>
          <Button type="primary" size="large" icon={<DollarOutlined />}>
            Process Salary
          </Button>
          <Button size="large" icon={<BankOutlined />}>
            Calculate EPF/ETF
          </Button>
          <Button size="large" icon={<FileTextOutlined />}>
            Generate Report
          </Button>
          <Button size="large" icon={<TrophyOutlined />}>
            Update KPI
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default AccountantDashboard;