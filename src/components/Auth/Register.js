import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Select, Divider, Image, Alert, Radio } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined, SafetyOutlined, IdcardOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Available roles (Admin removed - must be created manually)
  const availableRoles = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR' },
    { value: 'ceo', label: 'CEO' },
    { value: 'accountant', label: 'Accountant' },
  ];

  // Email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation rules
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  // Helper function for default leave days
  const getDefaultLeaveDays = (leaveType) => {
    const defaults = {
      'sick': 14,
      'annual': 21,
      'half-day': 5,
      'maternity': 84,
      'short': 7
    };
    return defaults[leaveType?.toLowerCase()] || 0;
  };

  // Create initial records in related tables
  const createInitialEmployeeRecords = async (userId, role) => {
    try {
      // 1. Create default leave balances in leavebalance table
      const { data: leaveTypes, error: leaveError } = await supabase
        .from('leavetype')
        .select('leavetypeid, leavetype');

      if (leaveTypes && !leaveError) {
        const currentYear = new Date().getFullYear();
        const leaveBalanceData = leaveTypes.map(leaveType => ({
          empid: userId,
          leavetypeid: leaveType.leavetypeid,
          year: currentYear,
          days: getDefaultLeaveDays(leaveType.leavetype),
          created_at: new Date().toISOString()
        }));
        
        await supabase.from('leavebalance').insert(leaveBalanceData);
      }

      // 2. Create initial audit log entry
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'USER_REGISTRATION',
        table_name: 'employee',
        record_id: userId,
        new_values: { role, status: 'active' },
        created_at: new Date().toISOString(),
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      });

      console.log('Initial employee records created successfully');

    } catch (error) {
      console.warn('Initial records creation warning:', error);
      // Non-critical error, don't block registration
    }
  };

  // Get client IP (simplified version)
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  };

  // Role assignment validation
  const validateRoleAssignment = (role) => {
    const restrictedRoles = ['ceo', 'hr'];
    if (restrictedRoles.includes(role)) {
      console.warn(`Restricted role ${role} assigned during registration - requires admin review`);
      // You can add additional validation or notifications here
    }
    return true;
  };

  // Create employee profile in employee table
  const createEmployeeProfile = async (user, values) => {
    try {
      // Split full name into first and last name
      const nameParts = values.full_name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // Validate role assignment
      validateRoleAssignment(values.role);

      const employeeData = {
        email: values.email.toLowerCase(),
        first_name: first_name,
        last_name: last_name,
        role: values.role,
        status: 'active',
        auth_user_id: user.id,
        created_at: new Date().toISOString(),
        is_active: true,
        satisfaction_score: 0,
        // Initialize default leave balances
        sickleavebalance: 14,
        fulldayleavebalance: 21,
        halfdayleavebalance: 5,
        shortleavebalance: 7,
        maternityleavebalance: 0, // Only applicable when needed
      };

      const { data: employeeInsert, error: employeeError } = await supabase
        .from('employee')
        .insert([employeeData])
        .select() // Return the inserted data
        .single();

      if (employeeError) {
        console.error('Employee creation error:', employeeError);
        
        // If employee creation fails due to duplicate email, try update
        if (employeeError.code === '23505') { // Unique violation
          const { error: updateError } = await supabase
            .from('employee')
            .update({
              first_name: first_name,
              last_name: last_name,
              role: values.role,
              status: 'active',
              auth_user_id: user.id,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('email', values.email.toLowerCase());

          if (updateError) {
            console.error('Employee update also failed:', updateError);
            throw new Error('Account created but employee profile setup incomplete. Please contact support.');
          }
        } else {
          throw employeeError;
        }
      }

      // Create initial records in other tables
      await createInitialEmployeeRecords(employeeInsert?.empid || user.id, values.role);

      console.log('Employee profile created/updated successfully');
      return employeeInsert;

    } catch (error) {
      console.error('Unexpected error in employee creation:', error);
      throw error;
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    setEmailError('');
    
    try {
      console.log('Registration values:', values);
      
      // Client-side validation
      if (!validateEmail(values.email)) {
        message.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const passwordError = validatePassword(values.password);
      if (passwordError) {
        message.error(passwordError);
        setLoading(false);
        return;
      }

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            role: values.role,
            email_confirm: true // Bypass email verification
          }
        }
      });

      if (authError) {
        console.error('Auth error details:', authError);
        
        // Handle specific auth errors
        if (authError.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please try logging in or use a different email.');
        } else if (authError.message.includes('Email not allowed')) {
          throw new Error('This email domain is not allowed for registration.');
        } else if (authError.message.includes('Password should be at least')) {
          throw new Error('Password does not meet security requirements.');
        } else if (authError.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else {
          throw authError;
        }
      }

      console.log('Auth data received:', authData);

      // Create employee profile in your employee table
      if (authData.user) {
        await createEmployeeProfile(authData.user, values);

        // Auto-login after successful registration
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email.trim().toLowerCase(),
          password: values.password
        });

        if (signInError) {
          console.warn('Auto-login failed:', signInError);
          message.success('Account created successfully! Please log in.', 5);
          navigate('/login');
        } else {
          message.success('Account created successfully! Redirecting to dashboard...', 3);
          // Redirect to dashboard immediately
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
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
    console.log('Form validation failed:', errorInfo);
    message.warning('Please fill in all required fields correctly.');
  };

  // Handle form reset
  const handleReset = () => {
    form.resetFields();
    setEmailError('');
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
          <Title level={3} style={{ color: '#2c3e50', margin: 0 }}>
            Create Your Account
          </Title>
          <Text style={{ 
            fontSize: '14px', 
            color: '#7f8c8d',
            fontWeight: '500'
          }}>
            Join the Employee Management System
          </Text>
        </div>

        {/* Registration Notice */}
        <Alert
          message="Registration Notice"
          description="Admin accounts cannot be created through this page. All other roles are available for self-registration."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
          closable
        />

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

        <Divider style={{ 
          margin: '24px 0', 
          borderColor: '#bdc3c7',
          color: '#34495e',
          fontSize: '15px',
          fontWeight: '600'
        }}>
          <IdcardOutlined /> Registration Details
        </Divider>

        {/* Registration Form */}
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
          initialValues={{
            role: 'employee' // Default to employee
          }}
        >
          <Form.Item
            name="full_name"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Full Name</Text>}
            rules={[{ 
              required: true, 
              message: 'Please input your full name!',
              whitespace: true
            }]}
            hasFeedback
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#3498db' }} />} 
              placeholder="Enter your full name" 
              size="large"
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
            />
          </Form.Item>

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
              placeholder="Enter your email address" 
              size="large"
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="role"
              label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Role</Text>}
              rules={[{ 
                required: true, 
                message: 'Please select your role!' 
              }]}
            >
              <Select 
                placeholder="Select role" 
                size="large"
                style={{
                  borderRadius: '8px'
                }}
              >
                {availableRoles.map(role => (
                  <Option key={role.value} value={role.value}>
                    {role.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="password"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Password</Text>}
            rules={[
              { 
                required: true, 
                message: 'Please input your password!' 
              },
              { 
                min: 6, 
                message: 'Password must be at least 6 characters!' 
              }
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#3498db' }} />}
              placeholder="Create a strong password"
              size="large"
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Confirm Password</Text>}
            dependencies={['password']}
            rules={[
              { 
                required: true, 
                message: 'Please confirm your password!' 
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<SafetyOutlined style={{ color: '#3498db' }} />}
              placeholder="Confirm your password"
              size="large"
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
                icon={<UserOutlined />}
                style={{
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)'
                }}
              >
                Create Account
              </Button>
              <Button
                onClick={handleReset}
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
                Clear Form
              </Button>
            </div>
          </Form.Item>
        </Form>

        {/* Additional Links */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Text style={{ 
            fontSize: '14px', 
            color: '#7f8c8d',
            fontWeight: '500'
          }}>
            Already have an account?{' '}
          </Text>
          <Link 
            to="/login" 
            style={{ 
              fontSize: '14px',
              color: '#3498db',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Sign in here
          </Link>
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

export default Register;