// src/components/Auth/Login.js
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider, Image } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    // Check for password reset success message
    if (location.state?.passwordResetSuccess) {
      message.success(location.state.message || 'Password reset successfully!');
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Email validation regex
  const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation rules
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { email, password } = values;

      // Additional client-side validation
      if (!validateEmail(email)) {
        message.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        message.error(passwordError);
        setLoading(false);
        return;
      }

      console.log('Attempting login with:', { email: email.trim().toLowerCase() });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        
        // Handle specific Supabase errors
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please try again later.');
        } else {
          throw new Error(error.message || 'Login failed. Please try again.');
        }
      }

      if (data?.user) {
        console.log('Login successful, user:', data.user);
        message.success('Login successful! Setting up your dashboard...');

        // Refresh profile to ensure it's loaded
        await refreshProfile();

        // Add a small delay to show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error('Login failed. No user data returned.');
      }

    } catch (error) {
      console.error('Login error:', error);

      // User-friendly error messages
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError) {
        errorMessage = 'Network error. Please check your connection.';
      }

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.error('Form validation failed:', errorInfo);
    const errorFields = errorInfo.errorFields.map(field => field.errors[0]).join(', ');
    message.warning(`Please check the following: ${errorFields}`);
  };

  // Handle form reset
  const handleReset = () => {
    form.resetFields();
    message.info('Form cleared');
  };

  // Handle demo login for testing
  const handleDemoLogin = () => {
    form.setFieldsValue({
      email: 'demo@example.com',
      password: 'demopassword'
    });
    message.info('Demo credentials filled. Click Sign In to test.');
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
          width: 450,
          maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          borderRadius: '16px',
          border: 'none',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        {/* Application Logo and Header */}
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
              onError={(e) => {
                console.error('Failed to load main logo');
                e.target.style.display = 'none';
              }}
            />
            <Title level={3} style={{ margin: '10px 0 0 0', color: '#2c3e50' }}>
              Employee Management System
            </Title>
          </div>
        </div>

        {/* AIPL Logo Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: 28,
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #e74c3c'
        }}>
          <Text strong style={{ 
            display: 'block', 
            marginBottom: 12,
            fontSize: '16px',
            color: '#2c3e50'
          }}>
            EMS For
          </Text>
          <Image
            src="/images/aipl.png"
            alt="Sixth Automotive"
            preview={false}
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
            onError={(e) => {
              console.error('Failed to load AIPL logo');
              e.target.style.display = 'none';
            }}
          />
        </div>

        <Divider style={{ 
          margin: '28px 0', 
          borderColor: '#bdc3c7',
          color: '#34495e',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          Sign In to Continue
        </Divider>

        {/* Login Form */}
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
          disabled={loading}
        >
          <Form.Item
            name="email"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '15px' }}>Email Address</Text>}
            rules={[
              { 
                required: true, 
                message: 'Please input your email address!' 
              },
              {
                type: 'email',
                message: 'Please enter a valid email address!'
              },
              {
                validator: (_, value) => {
                  if (value && !validateEmail(value)) {
                    return Promise.reject(new Error('Please enter a valid email address'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
            hasFeedback
          >
            <Input
              prefix={<MailOutlined style={{ color: '#3498db' }} />}
              placeholder="Enter your email address"
              size="large"
              allowClear
              disabled={loading}
              style={{
                height: '50px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3498db';
                e.target.style.boxShadow = '0 0 0 2px rgba(52, 152, 219, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dcdfe6';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '15px' }}>Password</Text>}
            rules={[
              { 
                required: true, 
                message: 'Please input your password!' 
              },
              { 
                min: 6, 
                message: 'Password must be at least 6 characters' 
              },
              {
                validator: (_, value) => {
                  const error = validatePassword(value);
                  if (error) {
                    return Promise.reject(new Error(error));
                  }
                  return Promise.resolve();
                }
              }
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#3498db' }} />}
              placeholder="Enter your password"
              size="large"
              allowClear
              disabled={loading}
              style={{
                height: '50px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3498db';
                e.target.style.boxShadow = '0 0 0 2px rgba(52, 152, 219, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dcdfe6';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                icon={<UserOutlined />}
                style={{
                  height: '52px',
                  fontSize: '17px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <Button
                  onClick={handleReset}
                  block
                  size="large"
                  disabled={loading}
                  style={{
                    height: '52px',
                    fontSize: '17px',
                    fontWeight: '500',
                    background: '#ecf0f1',
                    border: '2px solid #bdc3c7',
                    color: '#2c3e50',
                    borderRadius: '10px'
                  }}
                >
                  Clear
                </Button>
                
                <Button
                  onClick={handleDemoLogin}
                  block
                  size="large"
                  disabled={loading}
                  style={{
                    height: '52px',
                    fontSize: '17px',
                    fontWeight: '500',
                    background: '#f39c12',
                    border: '2px solid #e67e22',
                    color: 'white',
                    borderRadius: '10px'
                  }}
                >
                  Demo Credentials
                </Button>
              </div>
            </div>
          </Form.Item>
        </Form>

        {/* Additional Links */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link 
            to="/forgot-password" 
            style={{ 
              fontSize: '15px',
              color: '#e74c3c',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'block',
              marginBottom: '10px'
            }}
          >
            <SafetyCertificateOutlined /> Forgot password?
          </Link>
          
          <Text style={{ 
            fontSize: '15px', 
            color: '#7f8c8d',
            fontWeight: '500'
          }}>
            Don't have an account?{' '}
          </Text>
          <Link 
            to="/register" 
            style={{ 
              fontSize: '15px',
              color: '#3498db',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Register now
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;