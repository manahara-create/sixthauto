import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Image, Spin, Alert, Divider } from 'antd';
import { 
  LockOutlined, 
  SafetyOutlined, 
  InfoCircleOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  ArrowLeftOutlined 
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setSessionLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw new Error('Failed to verify reset session.');
        }

        if (!session) {
          throw new Error('Invalid or expired reset link. Please request a new password reset.');
        }

        // Validate session age (1 hour max)
        const sessionAge = Date.now() - new Date(session.created_at).getTime();
        const maxSessionAge = 3600000;
        
        if (sessionAge > maxSessionAge) {
          throw new Error('Reset link has expired. Please request a new one.');
        }

        setSession(session);
        
      } catch (error) {
        setSessionError(error.message);
        message.error(error.message);
        
        setTimeout(() => {
          navigate('/forgot-password', { replace: true });
        }, 3000);
      } finally {
        setSessionLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSessionError('Session expired. Please request a new reset link.');
        setTimeout(() => navigate('/forgot-password'), 2000);
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Password validation
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    const weakPasswords = ['password', '123456', 'qwerty', 'letmein'];
    if (weakPasswords.includes(password.toLowerCase())) {
      return 'This password is too common. Please choose a stronger one.';
    }
    
    return null;
  };

  const onFinish = async (values) => {
    setLoading(true);

    try {
      if (!session) {
        throw new Error('Reset session expired. Please request a new link.');
      }

      const passwordValidationError = validatePassword(values.password);
      if (passwordValidationError) {
        throw new Error(passwordValidationError);
      }

      if (values.password !== values.confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      // Update password
      const { data, error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        if (error.message.includes('Auth session missing')) {
          throw new Error('Reset session has expired. Please request a new password reset link.');
        } else {
          throw error;
        }
      }

      if (!data.user) {
        throw new Error('Password update failed. No user data returned.');
      }

      message.success('Password updated successfully! Please log in with your new password.', 4);

      // Update employee record
      try {
        await supabase
          .from('employee')
          .update({ 
            last_password_change: new Date().toISOString() 
          })
          .eq('email', data.user.email);
      } catch (updateError) {
        console.warn('Could not update employee record:', updateError);
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      localStorage.removeItem('userRole');
      sessionStorage.removeItem('currentUser');

      setTimeout(() => {
        navigate('/login', { 
          replace: true,
          state: { 
            passwordResetSuccess: true,
            message: 'Your password has been reset successfully. Please log in with your new password.'
          }
        });
      }, 2000);

    } catch (error) {
      console.error('Password reset error:', error);
      message.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (sessionLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#ACAC9B',
        padding: '20px'
      }}>
        <Card
          style={{
            width: 450,
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
          }}
          bodyStyle={{ padding: '40px', textAlign: 'center' }}
        >
          <Spin size="large" style={{ marginBottom: 20 }} />
          <Title level={4} style={{ color: '#2c3e50', marginBottom: 8 }}>
            Verifying Reset Link
          </Title>
          <Text style={{ color: '#7f8c8d' }}>
            Please wait while we validate your password reset request...
          </Text>
        </Card>
      </div>
    );
  }

  // Error state
  if (sessionError) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#ACAC9B',
        padding: '20px'
      }}>
        <Card
          style={{
            width: 500,
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
          }}
          bodyStyle={{ padding: '40px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '48px', color: '#e74c3c', marginBottom: 20 }}>
            ⚠️
          </div>
          <Title level={3} style={{ color: '#e74c3c', marginBottom: 16 }}>
            Reset Link Invalid
          </Title>
          <Text style={{ display: 'block', marginBottom: 32 }}>
            {sessionError}
          </Text>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button
              type="primary"
              onClick={() => navigate('/forgot-password')}
              size="large"
            >
              Request New Reset Link
            </Button>
            <Button
              onClick={() => navigate('/login')}
              size="large"
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#ACAC9B',
      backgroundImage: `
        linear-gradient(135deg, rgba(172, 172, 155, 0.9) 0%, rgba(172, 172, 155, 0.9) 100%),
        url('/images/image1.avif')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: 'overlay',
      padding: '20px'
    }}>
      <Card
        style={{
          width: 520,
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
          <Image
            src="/images/main-app-logo.png"
            alt="NextGenEMS"
            preview={false}
            style={{
              height: '50px',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: 16
            }}
          />
          <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
            Reset Password
          </Title>
          <Text style={{ color: '#7f8c8d' }}>
            Create your new password
          </Text>
        </div>

        <Divider>
          <SafetyOutlined /> Set New Password
        </Divider>

        {/* Reset Password Form */}
        <Form
          form={form}
          name="resetPassword"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your new password"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your new password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<SafetyOutlined />}
              placeholder="Confirm your new password"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<SafetyOutlined />}
              disabled={!session}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </Button>
          </Form.Item>
        </Form>

        {/* Password Requirements */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          marginBottom: 24
        }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Password Requirements:
          </Text>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#6c757d', fontSize: '13px' }}>
            <li>At least 6 characters long</li>
            <li>Not a commonly used password</li>
          </ul>
        </div>

        {/* Back to Login */}
        <div style={{ textAlign: 'center' }}>
          <Button 
            onClick={() => navigate('/login')} 
            icon={<ArrowLeftOutlined />}
            type="text"
          >
            Back to Login
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;