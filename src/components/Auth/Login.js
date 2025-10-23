import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider, Image, Alert } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  SafetyCertificateOutlined,
  DashboardOutlined 
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const { refreshProfile, user } = useAuth();

  useEffect(() => {
    // Check for password reset success
    if (location.state?.passwordResetSuccess) {
      message.success(location.state.message || 'Password reset successfully!');
      navigate(location.pathname, { replace: true, state: {} });
    }

    // Redirect if already logged in
    if (user) {
      navigate('/dashboard');
    }
  }, [location, navigate, user]);

  // Email validation
  const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fetch user profile
  const fetchUserProfile = async (userId, email) => {
    try {
      // Try by auth_user_id first
      let { data: profile, error } = await supabase
        .from('employee')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      // If not found, try by email
      if (error || !profile) {
        const { data: profileByEmail } = await supabase
          .from('employee')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (!profileByEmail) {
          throw new Error('User profile not found. Please contact administrator.');
        }
        profile = profileByEmail;
      }

      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  // Get dashboard route based on role
  const getDashboardRoute = (role) => {
    const roleRoutes = {
      'admin': '/admin/dashboard',
      'hr': '/hr/dashboard',
      'ceo': '/ceo/dashboard',
      'manager': '/manager/dashboard',
      'accountant': '/accountant/dashboard',
      'employee': '/employee/dashboard'
    };
    
    return roleRoutes[role?.toLowerCase()] || '/dashboard';
  };

  // Store user session
  const storeUserSession = (userData, profile) => {
    const sessionData = {
      userId: userData.id,
      email: userData.email,
      profile: {
        empid: profile.empid,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        department: profile.department,
        is_active: profile.is_active
      },
      loginTime: new Date().toISOString()
    };

    sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
    localStorage.setItem('userRole', profile.role);
  };

  // Update last login
  const updateLastLogin = async (empid) => {
    try {
      await supabase
        .from('employee')
        .update({ 
          last_login: new Date().toISOString() 
        })
        .eq('empid', empid);
    } catch (error) {
      console.warn('Could not update last login:', error);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      const { email, password } = values;

      // Hardcoded admin check
      if (email === 'admin@superadmin.com' && password === 'adminsuper@123') {
        // Create admin session manually
        const adminProfile = {
          empid: 1,
          first_name: 'Super',
          last_name: 'Admin',
          email: 'admin@superadmin.com',
          role: 'admin',
          department: 'AUTOMOTIVE',
          is_active: true
        };

        storeUserSession({ id: 'admin', email: 'admin@superadmin.com' }, adminProfile);
        message.success('Welcome back, Super Admin!');
        navigate('/admin/dashboard');
        return;
      }

      // Validate email
      if (!validateEmail(email)) {
        message.error('Please enter a valid email address');
        return;
      }

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in.');
        } else {
          throw error;
        }
      }

      if (data?.user) {
        // Fetch user profile
        const userProfile = await fetchUserProfile(data.user.id, data.user.email);
        
        if (!userProfile.is_active) {
          throw new Error('Your account is deactivated. Please contact administrator.');
        }

        // Store session data
        storeUserSession(data.user, userProfile);
        
        // Update last login
        await updateLastLogin(userProfile.empid);

        // Refresh auth context
        await refreshProfile();

        // Redirect to appropriate dashboard
        const dashboardRoute = getDashboardRoute(userProfile.role);
        message.success(`Welcome back, ${userProfile.first_name}!`);
        
        setTimeout(() => {
          navigate(dashboardRoute);
        }, 1000);
      }

    } catch (error) {
      console.error('Login error:', error);
      message.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form validation failed:', errorInfo);
    message.warning('Please check your email and password.');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#ACAC9B',
      backgroundImage: `
        linear-gradient(135deg, rgba(172, 172, 155, 0.9) 0%, rgba(172, 172, 155, 0.9) 100%),
        url('/images/image2.avif')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: 'overlay',
      padding: '20px'
    }}>
      <Card
        style={{
          width: 480,
          maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            marginBottom: 20,
            padding: '25px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <Image
              src="/images/main-app-logo.png"
              alt="NextGenEMS"
              preview={false}
              style={{
                height: '50px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <Title level={3} style={{ margin: '10px 0 0 0', color: '#2c3e50' }}>
              Employee Management System
            </Title>
          </div>
        </div>

        {/* Company Info */}
        <div style={{
          textAlign: 'center',
          marginBottom: 28,
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #e74c3c'
        }}>
          <Text strong style={{ fontSize: '20px', color: '#2c3e50' }}>
            Sixth Gear Automotive Pvt Ltd
          </Text>
          <Text style={{ display: 'block', fontSize: '12px', color: '#7f8c8d', marginTop: 4 }}>
            Department: AUTOMOTIVE
          </Text>
        </div>

        <Divider style={{ margin: '20px 0' }}>
          Sign In to Continue
        </Divider>

        {/* Login Form */}
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please input your email address!' },
              { type: 'email', message: 'Please enter a valid email address!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your email address"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<UserOutlined />}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        {/* Links */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link 
            to="/forgot-password" 
            style={{ display: 'block', marginBottom: '10px', color: '#e74c3c' }}
          >
            <SafetyCertificateOutlined /> Forgot password?
          </Link>
          
          <Text style={{ color: '#7f8c8d' }}>
            Don't have an account?{' '}
          </Text>
          <Link to="/register" style={{ color: '#3498db', fontWeight: '600' }}>
            Register now
          </Link>
        </div>

        {/* Admin Note */}
        <Alert
          message="Admin Access"
          description="Use admin@superadmin.com / adminsuper@123 for admin login"
          type="info"
          showIcon
          style={{ marginTop: 20 }}
        />
      </Card>
    </div>
  );
};

export default Login;