// src/components/Auth/Login.js
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider, Image, Alert, Space } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    // Check for password reset success
    if (location.state?.passwordResetSuccess) {
      message.success(location.state.message || 'Password reset successfully! Please log in with your new password.');
      // Clear the state
      window.history.replaceState({}, document.title);
    }

    // Redirect if already logged in and has profile
    if (user && profile) {
      redirectToDashboard(profile.role);
    }
  }, [location, user, profile, navigate]);

  // Email validation
  const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Redirect to appropriate dashboard based on role
  const redirectToDashboard = (role) => {
    const dashboardRoutes = {
      'admin': '/admin',
      'hr': '/hr',
      'manager': '/manager',
      'accountant': '/accountant',
      'ceo': '/ceo',
      'employee': '/employee'
    };
    
    const route = dashboardRoutes[role?.toLowerCase()] || '/employee';
    navigate(route, { replace: true });
  };

  // Fetch user profile from employee table
  const fetchUserProfile = async (userId, email) => {
    try {
      console.log('Fetching profile for:', email);

      // Try by auth_user_id first
      let { data: profile, error } = await supabase
        .from('employee')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      // If not found, try by email
      if (error || !profile) {
        console.log('Profile not found by auth_user_id, trying email...');
        const { data: profileByEmail, error: emailError } = await supabase
          .from('employee')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (emailError || !profileByEmail) {
          throw new Error('User profile not found. Please contact administrator.');
        }
        profile = profileByEmail;
      }

      // Check if account is active
      if (!profile.is_active) {
        throw new Error('Your account has been deactivated. Please contact administrator.');
      }

      console.log('Profile loaded successfully:', profile);
      return profile;

    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  // Update last login timestamp
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

  // Create audit log for login
  const createLoginAuditLog = async (userId, email, status) => {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'USER_LOGIN',
          table_name: 'employee',
          record_id: userId,
          new_values: { email, status, login_time: new Date().toISOString() },
          created_at: new Date().toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.warn('Audit log creation warning:', error);
    }
  };

  // Get client IP address
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      const { email, password } = values;
      const normalizedEmail = email.trim().toLowerCase();

      // Validate email format
      if (!validateEmail(normalizedEmail)) {
        message.error('Please enter a valid email address');
        return;
      }

      // Hardcoded admin authentication
      if (normalizedEmail === 'admin@superadmin.com' && password === 'adminsuper@123') {
        console.log('Admin login detected');
        
        // Create admin user object
        const adminUser = {
          id: 'admin-super-user',
          email: 'admin@superadmin.com',
          user_metadata: { full_name: 'Super Admin' }
        };

        // Create admin profile
        const adminProfile = {
          empid: 0,
          first_name: 'Super',
          last_name: 'Admin',
          email: 'admin@superadmin.com',
          role: 'admin',
          department: 'AUTOMOTIVE',
          is_active: true,
          auth_user_id: 'admin-super-user'
        };

        // Store in session storage
        sessionStorage.setItem('adminSession', 'true');
        sessionStorage.setItem('userProfile', JSON.stringify(adminProfile));
        localStorage.setItem('userRole', 'admin');

        // Create login audit log
        await createLoginAuditLog(0, 'admin@superadmin.com', 'success');

        // Refresh auth context to update profile
        await refreshProfile();

        message.success('Welcome back, Super Admin!');
        redirectToDashboard('admin');
        return;
      }

      // Regular user authentication with Supabase
      console.log('Attempting Supabase authentication for:', normalizedEmail);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
      });

      if (error) {
        // Create failed login audit log
        await createLoginAuditLog(null, normalizedEmail, 'failed');

        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in.');
        } else if (error.message.includes('User not found')) {
          throw new Error('No account found with this email address.');
        } else {
          throw error;
        }
      }

      if (data?.user) {
        console.log('Supabase authentication successful:', data.user.id);
        
        // Fetch user profile from employee table
        const userProfile = await fetchUserProfile(data.user.id, data.user.email);
        
        if (!userProfile) {
          throw new Error('Failed to load user profile.');
        }

        // Update last login
        await updateLastLogin(userProfile.empid);

        // Create successful login audit log
        await createLoginAuditLog(userProfile.empid, userProfile.email, 'success');

        // Store session data
        sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('userRole', userProfile.role);

        // Refresh auth context
        await refreshProfile();

        // Redirect to appropriate dashboard
        message.success(`Welcome back, ${userProfile.first_name} ${userProfile.last_name}!`);
        redirectToDashboard(userProfile.role);
      }

    } catch (error) {
      console.error('Login error:', error);
      
      // More specific error messages
      if (error.message.includes('network') || error.message.includes('fetch')) {
        message.error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('deactivated')) {
        message.error('Your account has been deactivated. Please contact administrator.');
      } else if (error.message.includes('profile not found')) {
        message.error('User profile not found. Please contact administrator.');
      } else {
        message.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form validation failed:', errorInfo);
    const errorFields = errorInfo.errorFields.map(field => field.errors[0]).join(', ');
    message.warning(`Please check the following: ${errorFields}`);
  };

  const handleDemoLogins = (role, email, password) => {
    form.setFieldsValue({
      email: email,
      password: password
    });
    message.info(`Demo ${role} credentials filled. Click Sign In to continue.`);
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
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
          overflow: 'hidden'
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #e8e8e8'
          }}>
            <Image
              src="/images/main-app-logo.png"
              alt="NextGenEMS"
              preview={false}
              style={{
                height: '50px',
                width: 'auto',
                objectFit: 'contain',
                marginBottom: '12px'
              }}
            />
            <Title level={3} style={{ margin: '10px 0 0 0', color: '#2c3e50', fontSize: '20px' }}>
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
          border: '2px solid #e74c3c',
          background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)'
        }}>
          <Text strong style={{ fontSize: '18px', color: '#2c3e50', display: 'block', marginBottom: '4px' }}>
            Sixth Gear Automotive Pvt Ltd
          </Text>
          <Text style={{ display: 'block', fontSize: '12px', color: '#7f8c8d', marginTop: 4 }}>
            Department: AUTOMOTIVE
          </Text>
        </div>

        <Divider style={{ margin: '20px 0', color: '#7f8c8d', fontWeight: '500' }}>
          Sign In to Continue
        </Divider>

        {/* Login Form */}
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
          autoComplete="on"
          disabled={loading}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { 
                required: true, 
                message: 'Please input your email address!' 
              },
              { 
                type: 'email', 
                message: 'Please enter a valid email address!' 
              }
            ]}
            validateTrigger="onBlur"
          >
            <Input
              prefix={<MailOutlined style={{ color: '#3498db' }} />}
              placeholder="Enter your email address"
              size="large"
              autoComplete="email"
              disabled={loading}
              style={{
                borderRadius: '8px',
                height: '45px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ 
              required: true, 
              message: 'Please input your password!' 
            }]}
            validateTrigger="onBlur"
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#3498db' }} />}
              placeholder="Enter your password"
              size="large"
              autoComplete="current-password"
              disabled={loading}
              iconRender={(visible) => 
                visible ? 
                <EyeTwoTone /> : 
                <EyeInvisibleOutlined />
              }
              style={{
                borderRadius: '8px',
                height: '45px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<UserOutlined />}
              style={{
                height: '50px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        {/* Demo Login Buttons */}
        <div style={{ marginBottom: '24px' }}>
          <Text strong style={{ display: 'block', marginBottom: '12px', color: '#2c3e50', fontSize: '14px' }}>
            Demo Logins:
          </Text>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Button 
              size="small" 
              block 
              onClick={() => handleDemoLogins('Admin', 'admin@superadmin.com', 'adminsuper@123')}
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              Admin Demo
            </Button>
            <Button 
              size="small" 
              block 
              onClick={() => handleDemoLogins('Employee', 'employee@example.com', 'employee123')}
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              Employee Demo
            </Button>
          </Space>
        </div>

        {/* Links */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link 
            to="/forgot-password" 
            style={{ 
              display: 'block', 
              marginBottom: '16px', 
              color: '#e74c3c',
              fontWeight: '500',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.target.style.color = '#c0392b'}
            onMouseLeave={(e) => e.target.style.color = '#e74c3c'}
          >
            Forgot your password?
          </Link>
          
          <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <Text style={{ color: '#7f8c8d', fontSize: '14px' }}>
              Don't have an account?{' '}
            </Text>
            <Link 
              to="/register" 
              style={{ 
                color: '#3498db', 
                fontWeight: '600',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.target.style.color = '#2980b9'}
              onMouseLeave={(e) => e.target.style.color = '#3498db'}
            >
              Register now
            </Link>
          </div>
        </div>

        {/* Admin Note */}
        <Alert
          message="Admin Access"
          description="Use admin@superadmin.com with password 'adminsuper@123' for full system access"
          type="info"
          showIcon
          style={{ 
            marginTop: 20,
            borderRadius: '8px',
            border: '1px solid #3498db'
          }}
        />

        {/* Security Notice */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fffbf0',
          borderRadius: '8px',
          border: '1px solid #f39c12'
        }}>
          <Text style={{ fontSize: '12px', color: '#e67e22' }}>
            🔒 Your login is secure. All credentials are encrypted and protected.
          </Text>
        </div>

        {/* Footer */}
        <Divider style={{ margin: '24px 0 16px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '12px', color: '#7f8c8d' }}>
            Powered by NextGenEMS • v1.0.0
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;