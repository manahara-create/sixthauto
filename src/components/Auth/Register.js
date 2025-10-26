import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Form, Input, Button, Select, message, Card, Typography, Divider, Alert, Space, Image } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  SafetyOutlined, 
  IdcardOutlined, 
  InfoCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const { Option } = Select;
const { Title, Text } = Typography;

// Define available roles (excluding Admin)
const availableRoles = [
  { value: 'Manager', label: 'Manager' },
  { value: 'Employee', label: 'Employee' },
  { value: 'CEO', label: 'CEO' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'HR', label: 'HR' }
];

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleRegister = async (values) => {
    const { full_name, email, password, confirmPassword, role } = values;

    if (password !== confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const supabaseAuthId = authData.user.id;

      // 2️⃣ Insert into auth_users table
      const { error: authUserError } = await supabase
        .from('auth_users')
        .insert([
          {
            email,
            full_name: full_name,
            role,
            supabase_auth_id: supabaseAuthId,
          },
        ])
        .select();

      if (authUserError) throw authUserError;

      // 3️⃣ Insert into employee table
      const { error: employeeError } = await supabase
        .from('employee')
        .insert([
          {
            full_name: full_name,
            email,
            role,
            auth_user_id: supabaseAuthId,
          },
        ]);

      if (employeeError) throw employeeError;

      message.success("Registration successful! Please verify your email.");
      form.resetFields();
      navigate('/login'); 
      
    } catch (error) {
      console.error('Registration error:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please check the form for errors.');
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
          onFinish={handleRegister}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
          initialValues={{ role: 'Employee' }}
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
            Powered by
          </Text>
          <div style={{ margin: '8px 0' }}></div>
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

export default Register;