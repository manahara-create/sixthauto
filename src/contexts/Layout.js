// src/components/Layout/Layout.js
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Space,
  Typography,
  Breadcrumb
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { useAuth } from './AuthContext';
import './Layout.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AppLayout = () => {
  const { profile, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'My Profile'
    },
    {
      key: '/leaves',
      icon: <CalendarOutlined />,
      label: 'Leave Management'
    },
    {
      key: '/attendance',
      icon: <HistoryOutlined />,
      label: 'Attendance'
    }
  ];

  // Add role-specific menu items
  if (['hr', 'admin', 'manager'].includes(profile?.role)) {
    menuItems.push({
      key: '/team',
      icon: <TeamOutlined />,
      label: 'Team Management'
    });
  }

  const breadcrumbNameMap = {
    '/dashboard': 'Dashboard',
    '/profile': 'My Profile',
    '/leaves': 'Leave Management',
    '/attendance': 'Attendance',
    '/team': 'Team Management'
  };

  const pathSnippets = location.pathname.split('/').filter(i => i);
  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    return {
      key: url,
      title: breadcrumbNameMap[url] || url
    };
  });

  const breadcrumbItems = [
    {
      title: 'Home',
      key: 'home'
    },
    ...extraBreadcrumbItems
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
      >
        <div className="logo">
          <Title level={4} style={{ color: '#1890ff', margin: 16, textAlign: 'center' }}>
            {collapsed ? 'HR' : 'HR System'}
          </Title>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      
      <Layout>
        <Header style={{ padding: 0, background: '#fff', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            
            <Space>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar 
                    src={profile?.avatarurl} 
                    icon={<UserOutlined />}
                  />
                  <span>
                    {profile?.first_name} {profile?.last_name}
                    <br />
                    <small style={{ color: '#666' }}>{profile?.role}</small>
                  </span>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;