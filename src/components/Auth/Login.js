import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import {
  Form,
  Input,
  Button,
  message,
  Card,
  Typography,
  Divider,
  Alert,
  Image
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const roleRoutes = {
  Admin: '/admin/dashboard',
  Manager: '/manager/dashboard',
  Employee: '/employee/dashboard',
  CEO: '/ceo/dashboard',
  Accountant: '/accountant/dashboard',
  HR: '/hr/dashboard',
  admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  employee: '/employee/dashboard',
  ceo: '/ceo/dashboard',
  accountant: '/accountant/dashboard',
  hr: '/hr/dashboard',
};

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 🟢 Handle form submit
  const handleLogin = async (values) => {
    const { email, password } = values;
    setLoading(true);

    try {

      if (email === 'admin@admin.com' && password === 'admin123') {
        message.success('Welcome, Admin (Hardcoded)');
        navigate('/admin/dashboard');
        form.resetFields();
        setLoading(false);
        return; // Exit early
      }

      // 1️⃣ Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // 2️⃣ Fetch user role info
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('supabase_auth_id', authData.user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found in auth_users table');
      }

      if (!userData.is_active) {
        throw new Error('Your account is inactive. Please contact the admin.');
      }

      // 3️⃣ Redirect based on role
      const userRole = userData.role?.toLowerCase();
      if (roleRoutes[userRole]) {
        message.success(`Welcome, ${userData.full_name || 'User'} (${userData.role})`);
        navigate(roleRoutes[userRole]);
      } else {
        throw new Error('User role not recognized or not assigned.');
      }

      form.resetFields();

    } catch (error) {
      console.error(error);
      message.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
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
      }}
    >
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
          <div
            style={{
              marginBottom: 20,
              padding: '25px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8'
            }}
          >
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
        <div
          style={{
            textAlign: 'center',
            marginBottom: 28,
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '2px solid #e74c3c',
            background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)'
          }}
        >
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
          layout="vertical"
          onFinish={handleLogin} // ✅ correct handler
          autoComplete="on"
          disabled={loading}
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
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#3498db' }} />}
              placeholder="Enter your password"
              size="large"
              autoComplete="current-password"
              disabled={loading}
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              style={{
                borderRadius: '8px',
                height: '45px'
              }}
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

        {/* Footer + Alerts */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text style={{ fontSize: '14px', color: '#7f8c8d' }}>
            Didn't have an account?{' '}
          </Text>
          <Link to="/register" style={{ fontWeight: '600', color: '#3498db' }}>
            Sign up here
          </Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/forgot-password" style={{ fontWeight: '600', color: '#db3434ff' }}>
            Forgot Password?
          </Link>
        </div>

        <Divider style={{ margin: '24px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '12px', color: '#7f8c8d' }}>
            Powered by
          </Text>
          <div style={{ margin: '2px 0' }}></div>
          <Image
            src="/logo.png"
            alt="YISN"
            preview={false}
            style={{
              height: '60px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Login;
