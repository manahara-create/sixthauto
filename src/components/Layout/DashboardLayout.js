import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Button, Avatar, Dropdown, Space,
  Typography, Card, Image, message, Spin
} from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication and fetch user data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Get current Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          // No session found, redirect to login
          message.warning('Please login to continue');
          navigate('/login');
          return;
        }

        setAuthUser(session.user);

        // Fetch user data from auth_users table using supabase_auth_id
        const { data: userData, error: userError } = await supabase
          .from('auth_users')
          .select('*')
          .eq('supabase_auth_id', session.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          // If user not found in auth_users, create a basic user object
          setUserData({
            full_name: session.user.email?.split('@')[0] || 'User',
            role: 'employee',
            email: session.user.email
          });
        } else {
          setUserData(userData);
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
        message.error('Authentication failed');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUserData(null);
          setAuthUser(null);
          navigate('/login');
        } else if (event === 'SIGNED_IN' && session) {
          setAuthUser(session.user);
          // Fetch user data for signed in user
          const { data: userData } = await supabase
            .from('auth_users')
            .select('*')
            .eq('supabase_auth_id', session.user.id)
            .single();
          
          if (userData) {
            setUserData(userData);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear local state
      setUserData(null);
      setAuthUser(null);
      
      message.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Failed to logout: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#e74c3c' }} />,
      label: 'Logout',
      onClick: handleLogout,
      disabled: loading,
    },
  ];

  const menuItems = [
  ];

  const getDashboardTitle = () => {
    if (location.pathname.includes('/admin')) return 'Admin Dashboard';
    if (location.pathname.includes('/hr')) return 'HR Dashboard';
    if (location.pathname.includes('/manager')) return 'Manager Dashboard';
    if (location.pathname.includes('/accountant')) return 'Accountant Dashboard';
    if (location.pathname.includes('/ceo')) return 'CEO Dashboard';
    if (location.pathname.includes('/employee')) return 'Employee Dashboard';
    return 'Dashboard';
  };

  // Extract first and last name from full_name
  const getUserName = () => {
    if (!userData?.full_name) {
      const emailName = authUser?.email?.split('@')[0] || 'User';
      return { firstName: emailName, lastName: '', fullName: emailName };
    }
    
    const names = userData.full_name.split(' ');
    return {
      firstName: names[0] || '',
      lastName: names.slice(1).join(' ') || '',
      fullName: userData.full_name
    };
  };

  const userName = getUserName();

  // Show loading spinner while initializing
  if (loading && !userData) {
    return (
      <Layout style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#ACAC9B'
      }}>
        <Card style={{ 
          textAlign: 'center', 
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: 16 }}>Loading Dashboard...</Text>
        </Card>
      </Layout>
    );
  }

  // Redirect to login if no user data (handled in useEffect)
  if (!userData && !loading) {
    return null;
  }

  return (
    <Layout style={{
      minHeight: '100vh',
      background: '#ACAC9B',
      backgroundImage: `
        linear-gradient(135deg, rgba(172, 172, 155, 0.9) 0%, rgba(172, 172, 155, 0.9) 100%),
        url('/images/image1.avif')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: 'overlay'
    }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: 'linear-gradient(145deg, #2c3e50 0%, #34495e 100%)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Logo Section */}
        <div style={{
          height: 80,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {collapsed ? (
            <Image
              src="/images/main-app-logo.png"
              alt="NextGenEMS"
              preview={false}
              style={{
                height: '40px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          ) : (
            <Space direction="vertical" size={0} align="center">
              <Image
                src="/images/main-app-logo.png"
                alt="NextGenEMS"
                preview={false}
                style={{
                  height: '35px',
                  width: 'auto',
                  objectFit: 'contain',
                  marginBottom: 4
                }}
              />
              <Text style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                NextGen EMS
              </Text>
            </Space>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0 8px'
          }}
        />

        {/* Company Info */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          padding: '16px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center'
        }}>
          <Text style={{
            display: 'block',
            marginBottom: 8,
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
            fontWeight: '600'
          }}>
            EMS
          </Text>
          <Text style={{
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            Sixth Gear Automotive
          </Text>
        </div>
      </Sider>

      {/* Main Content Area */}
      <Layout>
        {/* Header */}
        <Header style={{
          padding: '0 24px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <Button
            type="text"
            icon={collapsed ? 
              <MenuUnfoldOutlined style={{ color: '#2c3e50', fontSize: '18px' }} /> :
              <MenuFoldOutlined style={{ color: '#2c3e50', fontSize: '18px' }} />
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 64,
              height: 64,
              borderRadius: '8px'
            }}
          />

          {/* User Info */}
          <Space>
            <Text strong style={{ color: '#2c3e50' }}>
              {userName.fullName}
              <Text type="secondary" style={{ marginLeft: 8 }}>
                ({userData?.role || 'employee'})
              </Text>
            </Text>
            
            <Dropdown
              menu={{
                items: userMenuItems,
                style: {
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Avatar
                icon={<UserOutlined />}
                style={{
                  backgroundColor: '#3498db',
                  cursor: 'pointer'
                }}
              />
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content style={{
          margin: '24px',
          padding: 0,
          minHeight: 280
        }}>
          <Card
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: 'none',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
              minHeight: 'calc(100vh - 112px)'
            }}
            bodyStyle={{
              padding: '32px'
            }}
          >
            {/* Page Header */}
            <div style={{
              marginBottom: 32,
              paddingBottom: 16,
              borderBottom: '2px solid #e8e8e8'
            }}>
              <Title level={2} style={{
                color: '#2c3e50',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <DashboardOutlined style={{ color: '#3498db' }} />
                {getDashboardTitle()}
              </Title>
              <Text style={{
                color: '#7f8c8d',
                fontSize: '16px'
              }}>
                Welcome back, {userName.firstName} {userName.lastName}
              </Text>
            </div>

            {/* Page Content */}
            {children || <Outlet />}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;