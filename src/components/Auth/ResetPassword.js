import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Image, Spin, Alert, Divider } from 'antd';
import { LockOutlined, SafetyOutlined, InfoCircleOutlined, EyeInvisibleOutlined, EyeTwoTone, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Enhanced password validation
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (password.length > 128) {
      return 'Password must be less than 128 characters';
    }
    
    // Check for common weak passwords
    const weakPasswords = [
      'password', '123456', 'qwerty', 'letmein', 'admin', 
      'welcome', 'password1', '12345678', '123456789', '12345'
    ];
    if (weakPasswords.includes(password.toLowerCase())) {
      return 'This password is too common. Please choose a stronger one.';
    }
    
    // Check for sequential characters (3 or more identical consecutive chars)
    if (/(.)\1{2,}/.test(password)) {
      return 'Password contains repeated characters. Please use a more complex password.';
    }
    
    // Check for sequential numbers
    if (/(012|123|234|345|456|567|678|789)/.test(password)) {
      return 'Password contains sequential numbers. Please use a more complex password.';
    }
    
    return null;
  };

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        setSessionLoading(true);
        setSessionError('');

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Session retrieval error:', error);
          throw new Error('Failed to verify reset session. Please try again.');
        }

        if (!session) {
          throw new Error('Invalid or expired reset link. Please request a new password reset.');
        }

        // Enhanced session validation
        const sessionAge = Date.now() - new Date(session.created_at).getTime();
        const maxSessionAge = 3600000; // 1 hour
        
        if (sessionAge > maxSessionAge) {
          throw new Error('Reset link has expired. Please request a new one.');
        }

        // Check if user has password reset access
        if (session.user.aud !== 'authenticated') {
          throw new Error('Invalid authentication session.');
        }

        setSession(session);
        
      } catch (error) {
        if (!mounted) return;
        
        console.error('Session validation error:', error);
        let errorMessage = 'Invalid reset session';
        
        if (error.message) {
          errorMessage = error.message;
        }
        
        setSessionError(errorMessage);
        message.error(errorMessage);
        
        // Redirect after error message
        setTimeout(() => {
          if (mounted) {
            navigate('/forgot-password', { replace: true });
          }
        }, 4000);
      } finally {
        if (mounted) {
          setSessionLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setSessionError('Session expired. Please request a new reset link.');
        setTimeout(() => navigate('/forgot-password'), 2000);
      } else if (event === 'PASSWORD_RECOVERY') {
        // This is the event we want for password reset
        setSession(session);
        setSessionLoading(false);
      } else {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    setPasswordError('');

    try {
      // Enhanced session validation
      if (!session) {
        throw new Error('Reset session expired. Please request a new link.');
      }

      // Comprehensive password validation
      const passwordValidationError = validatePassword(values.password);
      if (passwordValidationError) {
        throw new Error(passwordValidationError);
      }

      // Enhanced confirmation validation
      if (values.password !== values.confirmPassword) {
        throw new Error('Passwords do not match. Please ensure both fields are identical.');
      }

      console.log('Attempting password reset for user:', session.user.email);

      // Update user password
      const { data, error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        console.error('Password update error:', error);
        
        // Enhanced error handling with more specific cases
        if (error.message.includes('Auth session missing') || 
            error.message.includes('Invalid refresh token') ||
            error.message.includes('JWT expired')) {
          throw new Error('Reset session has expired. Please request a new password reset link.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          throw new Error('Password must be at least 6 characters long.');
        } else if (error.message.includes('New password should be different from the old password')) {
          throw new Error('New password must be different from your current password.');
        } else if (error.message.includes('User not found')) {
          throw new Error('Account not found. The user may have been deleted.');
        } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          throw new Error('Too many attempts. Please wait a few minutes before trying again.');
        } else if (error.message.includes('weak_password')) {
          throw new Error('Password is too weak. Please choose a stronger password.');
        } else {
          throw new Error('Failed to update password. Please try again.');
        }
      }

      if (!data.user) {
        throw new Error('Password update failed. No user data returned.');
      }

      // Enhanced success handling
      message.success({
        content: (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Password updated successfully! 🎉
            </div>
            <div>Redirecting to login page...</div>
          </div>
        ),
        duration: 4,
      });

      // Enhanced security: Sign out after password reset
      await supabase.auth.signOut();

      // Redirect to login page with success state
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
      console.error('Password reset process error:', error);
      
      let userFriendlyMessage = 'Failed to reset password. Please try again.';
      
      if (error.message) {
        userFriendlyMessage = error.message;
      } else if (error instanceof TypeError) {
        userFriendlyMessage = 'Network error. Please check your internet connection.';
      }
      
      message.error(userFriendlyMessage);
      setPasswordError(userFriendlyMessage);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setPasswordError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form validation failed:', errorInfo);
    const firstError = errorInfo.errorFields[0]?.errors[0] || 'Please check your input and try again.';
    message.warning(firstError);
  };

  const handleReset = () => {
    form.resetFields();
    setPasswordError('');
  };

  const handleGoToForgotPassword = () => {
    navigate('/forgot-password', { replace: true });
  };

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  // Session loading state
  if (sessionLoading) {
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
            width: 450,
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
          }}
          bodyStyle={{ padding: '40px', textAlign: 'center' }}
        >
          {/* Application Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Image
              src="/images/main-app-logo.png"
              alt="NextGenEMS"
              preview={false}
              style={{
                height: '60px',
                width: 'auto',
                objectFit: 'contain',
                marginBottom: 16
              }}
            />
          </div>
          
          <Spin size="large" style={{ marginBottom: 20 }} />
          <Title level={4} style={{ color: '#2c3e50', marginBottom: 8 }}>
            Verifying Reset Link
          </Title>
          <Text style={{ color: '#7f8c8d', fontSize: '14px', lineHeight: '1.5' }}>
            Please wait while we validate your password reset request...
          </Text>
        </Card>
      </div>
    );
  }

  // Session error state
  if (sessionError) {
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
            width: 500,
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
          }}
          bodyStyle={{ padding: '40px', textAlign: 'center' }}
        >
          {/* Application Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Image
              src="/images/main-app-logo.png"
              alt="NextGenEMS"
              preview={false}
              style={{
                height: '60px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>

          <div style={{ fontSize: '48px', color: '#e74c3c', marginBottom: 20 }}>
            ⚠️
          </div>
          <Title level={3} style={{ color: '#e74c3c', marginBottom: 16 }}>
            Reset Link Invalid
          </Title>
          <Text style={{ 
            color: '#2c3e50', 
            fontSize: '15px', 
            lineHeight: '1.5', 
            display: 'block', 
            marginBottom: 32 
          }}>
            {sessionError}
          </Text>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button
              type="primary"
              onClick={handleGoToForgotPassword}
              size="large"
              style={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Request New Reset Link
            </Button>
            <Button
              onClick={handleGoToLogin}
              size="large"
              style={{
                background: '#ecf0f1',
                border: '2px solid #bdc3c7',
                color: '#2c3e50',
                borderRadius: '8px',
                fontWeight: '500'
              }}
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
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        {/* Application Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 16 }}>
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
          </div>
          <Title level={2} style={{ 
            margin: '0 0 8px 0', 
            color: '#2c3e50',
            fontWeight: '700'
          }}>
            Reset Password
          </Title>
          <Text style={{ 
            fontSize: '16px', 
            color: '#7f8c8d',
            fontWeight: '500'
          }}>
            Create your new password
          </Text>
        </div>

        {/* Password Error Alert */}
        {passwordError && (
          <Alert
            message="Password Reset Failed"
            description={passwordError}
            type="error"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setPasswordError('')}
          />
        )}

        <Divider style={{ 
          margin: '24px 0', 
          borderColor: '#bdc3c7',
          color: '#34495e',
          fontSize: '15px',
          fontWeight: '600'
        }}>
          <SafetyOutlined /> Set New Password
        </Divider>

        {/* User Info */}
        {session && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px',
            border: '1px solid #3498db',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            <Text strong style={{ color: '#2c3e50', fontSize: '14px' }}>
              Resetting password for: <span style={{ color: '#e74c3c' }}>{session.user.email}</span>
            </Text>
          </div>
        )}

        {/* Reset Password Form */}
        <Form
          form={form}
          name="resetPassword"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
          validateTrigger={['onChange', 'onBlur']}
        >
          <Form.Item
            name="password"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>New Password</Text>}
            rules={[
              { 
                required: true, 
                message: 'Please input your new password!' 
              },
              { 
                min: 6, 
                message: 'Password must be at least 6 characters!' 
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const error = validatePassword(value);
                  return error ? Promise.reject(new Error(error)) : Promise.resolve();
                }
              }
            ]}
            hasFeedback
            validateFirst
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#3498db' }} />}
              placeholder="Enter your new password"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Confirm New Password</Text>}
            dependencies={['password']}
            rules={[
              { 
                required: true, 
                message: 'Please confirm your new password!' 
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value) {
                    return Promise.reject(new Error('Please confirm your password'));
                  }
                  if (value && getFieldValue('password') !== value) {
                    return Promise.reject(new Error('The two passwords do not match!'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<SafetyOutlined style={{ color: '#3498db' }} />}
              placeholder="Confirm your new password"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
              disabled={loading}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                icon={<SafetyOutlined />}
                style={{
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)'
                }}
                disabled={loading || !session}
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </Button>
              <Button
                onClick={handleReset}
                block
                size="large"
                disabled={loading}
                style={{
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: '500',
                  background: '#ecf0f1',
                  border: '2px solid #bdc3c7',
                  color: '#2c3e50',
                  borderRadius: '10px'
                }}
              >
                Clear
              </Button>
            </div>
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
          <Text strong style={{ display: 'block', marginBottom: 8, color: '#2c3e50' }}>
            🔒 Password Requirements:
          </Text>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px', 
            color: '#6c757d', 
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            <li>At least 6 characters long</li>
            <li>Not a commonly used password</li>
            <li>No repeated character sequences (aaa, 111)</li>
            <li>No sequential numbers (123, 456)</li>
          </ul>
        </div>

        {/* Navigation Links */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Link 
            to="/login" 
            style={{ 
              fontSize: '14px',
              color: '#3498db',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeftOutlined /> Back to Login
          </Link>
        </div>

        {/* Footer */}
        <Divider style={{ margin: '24px 0', borderColor: '#bdc3c7' }} />
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '12px', color: '#7f8c8d' }}>
            Powered by eHealth
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;