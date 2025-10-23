import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Select, Divider, Image, Alert, Space } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  SafetyOutlined, 
  IdcardOutlined, 
  InfoCircleOutlined,
  TeamOutlined 
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Available roles (Admin removed - must be created manually)
  const availableRoles = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR' },
    { value: 'ceo', label: 'CEO' },
    { value: 'accountant', label: 'Accountant' },
  ];

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'letmein'];
    if (weakPasswords.includes(password.toLowerCase())) {
      return 'This password is too common. Please choose a stronger one.';
    }
    
    return null;
  };

  // Check if email already exists
  const checkEmailExists = async (email) => {
    try {
      // Check in auth users
      const { data: authData } = await supabase
        .from('employee')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      return !!authData;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Create initial employee records
  const createInitialEmployeeRecords = async (userId, role, email, fullName) => {
    try {
      // Split full name
      const nameParts = fullName.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // Create employee profile
      const employeeData = {
        email: email.toLowerCase(),
        first_name: first_name,
        last_name: last_name,
        role: role,
        status: 'active',
        auth_user_id: userId,
        department: 'AUTOMOTIVE', // Default department
        is_active: true,
        satisfaction_score: 0,
        // Initialize default leave balances
        sickleavebalance: 14,
        fulldayleavebalance: 21,
        halfdayleavebalance: 5,
        shortleavebalance: 7,
        maternityleavebalance: 0,
        created_at: new Date().toISOString()
      };

      const { data: employee, error: employeeError } = await supabase
        .from('employee')
        .insert([employeeData])
        .select()
        .single();

      if (employeeError) {
        // If employee already exists (unique constraint violation), update it
        if (employeeError.code === '23505') {
          const { error: updateError } = await supabase
            .from('employee')
            .update({
              first_name: first_name,
              last_name: last_name,
              role: role,
              status: 'active',
              auth_user_id: userId,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('email', email.toLowerCase());

          if (updateError) throw updateError;
        } else {
          throw employeeError;
        }
      }

      // Create initial leave balances
      await createLeaveBalances(employee?.empid || userId);

      // Create audit log
      await createAuditLog(employee?.empid || userId, 'USER_REGISTRATION', { role, status: 'active' });

      message.success('Employee profile created successfully');
      return employee;

    } catch (error) {
      console.error('Error creating employee records:', error);
      throw new Error('Failed to create employee profile');
    }
  };

  // Create leave balances
  const createLeaveBalances = async (employeeId) => {
    try {
      const { data: leaveTypes } = await supabase
        .from('leavetype')
        .select('leavetypeid, leavetype');

      if (leaveTypes) {
        const currentYear = new Date().getFullYear();
        const leaveBalanceData = leaveTypes.map(leaveType => ({
          empid: employeeId,
          leavetypeid: leaveType.leavetypeid,
          year: currentYear,
          days: getDefaultLeaveDays(leaveType.leavetype),
          created_at: new Date().toISOString()
        }));
        
        await supabase.from('leavebalance').insert(leaveBalanceData);
      }
    } catch (error) {
      console.warn('Leave balance creation warning:', error);
    }
  };

  // Get default leave days
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

  // Create audit log
  const createAuditLog = async (userId, action, newValues) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: action,
        table_name: 'employee',
        record_id: userId,
        new_values: newValues,
        created_at: new Date().toISOString(),
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.warn('Audit log creation warning:', error);
    }
  };

  // Get client IP
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
      const { full_name, email, password, role } = values;

      // Validate email format
      if (!validateEmail(email)) {
        message.error('Please enter a valid email address');
        return;
      }

      // Validate password
      const passwordError = validatePassword(password);
      if (passwordError) {
        message.error(passwordError);
        return;
      }

      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        message.error('This email is already registered. Please use a different email or try logging in.');
        return;
      }

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: full_name,
            role: role
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please try logging in.');
        } else if (authError.message.includes('Email not allowed')) {
          throw new Error('This email domain is not allowed for registration.');
        } else {
          throw authError;
        }
      }

      if (authData.user) {
        // Create employee profile and records
        await createInitialEmployeeRecords(authData.user.id, role, email, full_name);

        message.success('Account created successfully! Please log in.', 5);
        navigate('/login');
      }

    } catch (error) {
      console.error('Registration error:', error);
      message.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form validation failed:', errorInfo);
    message.warning('Please fill in all required fields correctly.');
  };

  const handleReset = () => {
    form.resetFields();
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
        {/* Header */}
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
          <Text style={{ 
            fontSize: '12px',
            color: '#7f8c8d'
          }}>
            Default Department: AUTOMOTIVE
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
          initialValues={{ role: 'employee' }}
        >
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ 
              required: true, 
              message: 'Please input your full name!',
              whitespace: true
            }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#3498db' }} />} 
              placeholder="Enter your full name" 
              size="large"
            />
          </Form.Item>

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
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select your role!' }]}
          >
            <Select 
              placeholder="Select role" 
              size="large"
              suffixIcon={<TeamOutlined />}
            >
              {availableRoles.map(role => (
                <Option key={role.value} value={role.value}>
                  {role.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#3498db' }} />}
              placeholder="Create a strong password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
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
              prefix={<SafetyOutlined style={{ color: '#3498db' }} />}
              placeholder="Confirm your password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                icon={<UserOutlined />}
              >
                Create Account
              </Button>
              <Button
                onClick={handleReset}
                block
                size="large"
              >
                Clear Form
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Login Link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text style={{ fontSize: '14px', color: '#7f8c8d' }}>
            Already have an account?{' '}
          </Text>
          <Link to="/login" style={{ fontWeight: '600', color: '#3498db' }}>
            Sign in here
          </Link>
        </div>

        {/* Footer */}
        <Divider style={{ margin: '24px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '12px', color: '#7f8c8d' }}>
            Powered by eHealth
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;