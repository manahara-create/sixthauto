import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Image, Alert, Divider, Spin } from 'antd';
import { MailOutlined, ArrowLeftOutlined, SafetyOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email exists in both user table and employee table
  const checkEmailExists = async (email) => {
    try {
      setCheckingEmail(true);
      const normalizedEmail = email.trim().toLowerCase();

      // Check in auth.users (Supabase)
      const { data: authData, error: authError } = await supabase
        .from('employee') // Using employee table to check registered users
        .select('empid, email, first_name, last_name, role, status')
        .eq('email', normalizedEmail)
        .single();

      if (authError || !authData) {
        return { exists: false, message: 'No account found with this email address.' };
      }

      // Check if user is active
      if (authData.status !== 'active') {
        return { 
          exists: true, 
          user: authData, 
          message: 'Your account is deactivated. Please contact administrator.' 
        };
      }

      return { 
        exists: true, 
        user: authData,
        message: 'Account found and active.' 
      };

    } catch (error) {
      console.error('Error checking email:', error);
      return { exists: false, message: 'Error verifying email. Please try again.' };
    } finally {
      setCheckingEmail(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    setEmailError('');
    
    try {
      const email = values.email.trim().toLowerCase();

      // Client-side validation
      if (!validateEmail(email)) {
        message.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      console.log('Checking email existence:', email);
      
      // First check if email exists
      const emailCheck = await checkEmailExists(email);
      
      if (!emailCheck.exists) {
        // For security, don't reveal if email doesn't exist
        console.log('Email not found, but showing generic success message');
        setEmailSent(true);
        setUserData(null);
        message.info('If an account exists with this email, you will receive a password reset link.', 5);
        return;
      }

      // If account is deactivated
      if (emailCheck.user && emailCheck.user.status !== 'active') {
        throw new Error(emailCheck.message);
      }

      // Store user data for reset password page
      setUserData(emailCheck.user);

      console.log('Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(
        email, 
        {
          redirectTo: `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`,
        }
      );

      if (error) {
        console.error('Password reset error:', error);
        
        // Handle specific errors
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before resetting password.');
        } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          throw new Error('Too many attempts. Please try again in a few minutes.');
        } else {
          throw error;
        }
      }

      // Success - show user-specific message
      setEmailSent(true);
      message.success(`Password reset link sent to ${email}. Please check your inbox.`, 5);
      
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      setEmailError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form validation failed:', errorInfo);
    message.warning('Please enter a valid email address.');
  };

  const handleReset = () => {
    form.resetFields();
    setEmailError('');
    setUserData(null);
  };

  // Navigate to reset password with email pre-filled
  const handleManualReset = () => {
    const email = form.getFieldValue('email');
    if (email && validateEmail(email)) {
      navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } else {
      message.warning('Please enter a valid email address first.');
    }
  };

  if (emailSent) {
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
          {/* Application Logo and Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ 
              marginBottom: 20,
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <Image
                src="/images/main-app-logo.png"
                alt="NextGenEMS"
                preview={false}
                style={{
                  height: '80px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
              />
            </div>
            <Text style={{ 
              fontSize: '16px', 
              color: '#7f8c8d',
              fontWeight: '500'
            }}>
              Check Your Email
            </Text>
          </div>

          {/* Success Message */}
          <div style={{
            textAlign: 'center',
            padding: '32px',
            backgroundColor: '#f8fff9',
            borderRadius: '12px',
            border: '2px solid #27ae60',
            marginBottom: 24
          }}>
            <div style={{ fontSize: '48px', color: '#27ae60', marginBottom: 16 }}>
              ✓
            </div>
            <Title level={3} style={{ color: '#27ae60', marginBottom: 16 }}>
              Check Your Inbox!
            </Title>
            
            {userData ? (
              <>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: 16,
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px'
                }}>
                  <UserOutlined style={{ color: '#3498db', marginRight: '8px' }} />
                  <Text strong style={{ color: '#2c3e50' }}>
                    {userData.first_name} {userData.last_name} ({userData.role})
                  </Text>
                </div>
                <Text style={{ 
                  fontSize: '15px', 
                  color: '#2c3e50',
                  lineHeight: '1.6',
                  display: 'block',
                  marginBottom: 16
                }}>
                  We've sent a password reset link to your email address.
                  Click the link in the email to reset your password.
                </Text>
              </>
            ) : (
              <Text style={{ 
                fontSize: '15px', 
                color: '#2c3e50',
                lineHeight: '1.6',
                display: 'block',
                marginBottom: 16
              }}>
                If an account exists with the email you provided, you will receive a password reset link shortly.
              </Text>
            )}
            
            <Alert
              message="Security Notice"
              description="The reset link will expire in 1 hour for security reasons."
              type="info"
              showIcon
              style={{ textAlign: 'left' }}
            />
          </div>

          <Divider style={{ 
            margin: '24px 0', 
            borderColor: '#bdc3c7'
          }} />

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: 24, flexDirection: 'column' }}>
            <Button
              type="primary"
              onClick={() => navigate('/login')}
              block
              size="large"
              icon={<ArrowLeftOutlined />}
              style={{
                height: '50px',
                fontSize: '16px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                border: 'none',
                borderRadius: '10px',
                boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
              }}
            >
              Back to Login
            </Button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  form.resetFields();
                }}
                block
                size="large"
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
                Send Another
              </Button>
              
              {userData && (
                <Button
                  onClick={handleManualReset}
                  block
                  size="large"
                  style={{
                    height: '50px',
                    fontSize: '16px',
                    fontWeight: '500',
                    background: '#f39c12',
                    border: '2px solid #e67e22',
                    color: 'white',
                    borderRadius: '10px'
                  }}
                >
                  Go to Reset
                </Button>
              )}
            </div>
          </div>

          {/* Additional Help */}
          <div style={{
            padding: '16px',
            backgroundColor: '#fffbf0',
            borderRadius: '8px',
            border: '1px solid #f39c12',
            marginBottom: 24
          }}>
            <Text strong style={{ color: '#e67e22', display: 'block', marginBottom: 8 }}>
              Didn't receive the email?
            </Text>
            <Text style={{ color: '#2c3e50', fontSize: '14px' }}>
              • Check your spam folder<br/>
              • Ensure you entered the correct email address<br/>
              • Wait a few minutes and try again<br/>
              • Contact IT support if the problem persists
            </Text>
          </div>

          {/* Footer with eHealth Logo */}
          <Divider style={{ 
            margin: '24px 0', 
            borderColor: '#bdc3c7'
          }} />
          <div style={{
            textAlign: 'center',
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '2px solid #3498db'
          }}>
            <Text style={{
              display: 'block',
              marginBottom: 8,
              fontSize: '12px',
              color: '#7f8c8d',
              fontWeight: '600'
            }}>
              Powered by
            </Text>
            <Image
              src="/images/eHealth.png"
              alt="eHealth"
              preview={false}
              style={{
                height: '35px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
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
        {/* Application Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            marginBottom: 20,
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <Image
              src="/images/main-app-logo.png"
              alt="NextGenEMS"
              preview={false}
              style={{
                height: '80px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
          <Title level={3} style={{ color: '#2c3e50', marginBottom: 8 }}>
            Reset Your Password
          </Title>
          <Text style={{ 
            fontSize: '14px', 
            color: '#7f8c8d',
            fontWeight: '500'
          }}>
            Enter your email to receive a reset link
          </Text>
        </div>

        <div style={{
          textAlign: 'center',
          marginBottom: 28,
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #e74c3c'
        }}>
          <Text strong style={{ 
            display: 'block', 
            marginBottom: 8,
            fontSize: '14px',
            color: '#2c3e50'
          }}>
            EMS For
          </Text>
          <Text strong style={{ 
            display: 'block', 
            marginBottom: 8,
            fontSize: '20px',
            color: '#2c3e50'
          }}>
            Sixth Gear Automotive Pvt Ltd
          </Text>
        </div>

        {/* Email Error Alert */}
        {emailError && (
          <Alert
            message="Reset Request Failed"
            description={emailError}
            type="error"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setEmailError('')}
          />
        )}

        <Divider style={{ 
          margin: '24px 0', 
          borderColor: '#bdc3c7',
          color: '#34495e',
          fontSize: '15px',
          fontWeight: '600'
        }}>
          <SafetyOutlined /> Password Recovery
        </Divider>

        {/* Instructions */}
        <div style={{
          padding: '16px',
          backgroundColor: '#e8f4fd',
          borderRadius: '8px',
          border: '1px solid #3498db',
          marginBottom: 24
        }}>
          <Text style={{ color: '#2c3e50', fontSize: '14px', lineHeight: '1.5' }}>
            Enter the email address associated with your account and we'll send you a secure link to reset your password.
          </Text>
        </div>

        {/* Forgot Password Form */}
        <Form
          form={form}
          name="forgotPassword"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Email Address</Text>}
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
            hasFeedback
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#3498db' }} />} 
              placeholder="Enter your registered email address" 
              size="large"
              disabled={loading || checkingEmail}
              suffix={checkingEmail ? <Spin size="small" /> : null}
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
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
                icon={<MailOutlined />}
                disabled={checkingEmail}
                style={{
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
                }}
              >
                {checkingEmail ? 'Checking...' : 'Send Reset Link'}
              </Button>
              <Button
                onClick={handleReset}
                block
                size="large"
                disabled={loading || checkingEmail}
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

        {/* Additional Links */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link 
            to="/login" 
            style={{ 
              fontSize: '14px',
              color: '#3498db',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeftOutlined /> Back to Login
          </Link>
          <br />
          <Text style={{ 
            fontSize: '13px', 
            color: '#7f8c8d',
            marginTop: '8px',
            display: 'block'
          }}>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: '#3498db',
                fontWeight: '500',
                textDecoration: 'none'
              }}
            >
              Sign up here
            </Link>
          </Text>
        </div>

        {/* Footer with eHealth Logo */}
        <Divider style={{ 
          margin: '24px 0', 
          borderColor: '#bdc3c7'
        }} />
        <div style={{
          textAlign: 'center',
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #3498db'
        }}>
          <Text style={{
            display: 'block',
            marginBottom: 8,
            fontSize: '12px',
            color: '#7f8c8d',
            fontWeight: '600'
          }}>
            Powered by
          </Text>
          <Image
            src="/images/eHealth.png"
            alt="eHealth"
            preview={false}
            style={{
              height: '35px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;