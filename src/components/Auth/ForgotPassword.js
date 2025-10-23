import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Image, Alert, Divider, Spin } from 'antd';
import { 
  MailOutlined, 
  ArrowLeftOutlined, 
  SafetyOutlined, 
  InfoCircleOutlined, 
  UserOutlined 
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email exists
  const checkEmailExists = async (email) => {
    try {
      setCheckingEmail(true);
      const normalizedEmail = email.trim().toLowerCase();

      // Check in employee table
      const { data: employeeData, error } = await supabase
        .from('employee')
        .select('empid, email, first_name, last_name, role, status')
        .eq('email', normalizedEmail)
        .single();

      if (error || !employeeData) {
        return { exists: false, message: 'No account found with this email address.' };
      }

      if (employeeData.status !== 'active') {
        return { 
          exists: true, 
          user: employeeData, 
          message: 'Your account is deactivated. Please contact administrator.' 
        };
      }

      return { 
        exists: true, 
        user: employeeData,
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
    
    try {
      const email = values.email.trim().toLowerCase();

      if (!validateEmail(email)) {
        message.error('Please enter a valid email address');
        return;
      }

      // Check if email exists
      const emailCheck = await checkEmailExists(email);
      
      if (!emailCheck.exists) {
        // For security, show generic message
        setEmailSent(true);
        setUserData(null);
        message.info('If an account exists with this email, you will receive a password reset link.');
        return;
      }

      // If account is deactivated
      if (emailCheck.user && emailCheck.user.status !== 'active') {
        throw new Error(emailCheck.message);
      }

      setUserData(emailCheck.user);

      // Send reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before resetting password.');
        } else {
          throw error;
        }
      }

      setEmailSent(true);
      message.success(`Password reset link sent to ${email}. Please check your inbox.`);
      
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
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
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
          }}
          bodyStyle={{ padding: '40px' }}
        >
          {/* Success Message */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Image
              src="/images/main-app-logo.png"
              alt="NextGenEMS"
              preview={false}
              style={{
                height: '80px',
                width: 'auto',
                objectFit: 'contain',
                marginBottom: 20
              }}
            />
          </div>

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
                  <Text strong>
                    {userData.first_name} {userData.last_name} ({userData.role})
                  </Text>
                </div>
                <Text style={{ display: 'block', marginBottom: 16 }}>
                  We've sent a password reset link to your email address.
                  Click the link in the email to reset your password.
                </Text>
              </>
            ) : (
              <Text style={{ display: 'block', marginBottom: 16 }}>
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

          <Divider />

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <Button
              type="primary"
              onClick={() => navigate('/login')}
              block
              size="large"
              icon={<ArrowLeftOutlined />}
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
              >
                Send Another
              </Button>
            </div>
          </div>

          {/* Help Section */}
          <div style={{
            padding: '16px',
            backgroundColor: '#fffbf0',
            borderRadius: '8px',
            border: '1px solid #f39c12',
            marginTop: 24
          }}>
            <Text strong style={{ color: '#e67e22', display: 'block', marginBottom: 8 }}>
              Didn't receive the email?
            </Text>
            <Text style={{ fontSize: '14px' }}>
              • Check your spam folder<br/>
              • Ensure you entered the correct email address<br/>
              • Wait a few minutes and try again
            </Text>
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
              height: '80px',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: 16
            }}
          />
          <Title level={3} style={{ color: '#2c3e50', marginBottom: 8 }}>
            Reset Your Password
          </Title>
          <Text style={{ color: '#7f8c8d' }}>
            Enter your email to receive a reset link
          </Text>
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
        </div>

        <Divider>
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
          <Text style={{ lineHeight: '1.5' }}>
            Enter the email address associated with your account and we'll send you a secure link to reset your password.
          </Text>
        </div>

        {/* Forgot Password Form */}
        <Form
          form={form}
          name="forgotPassword"
          onFinish={onFinish}
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
              placeholder="Enter your registered email address" 
              size="large"
              suffix={checkingEmail ? <Spin size="small" /> : null}
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                icon={<MailOutlined />}
                disabled={checkingEmail}
              >
                {checkingEmail ? 'Checking...' : 'Send Reset Link'}
              </Button>
            </div>
          </Form.Item>
        </Form>

        {/* Back to Login */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeftOutlined /> Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;