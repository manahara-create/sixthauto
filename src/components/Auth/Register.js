import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Select, Divider, Image, Alert, Radio } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined, SafetyOutlined, IdcardOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Available roles
  const availableRoles = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR' },
    { value: 'ceo', label: 'CEO' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'admin', label: 'Admin' },
  ];

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('department')  // Changed from 'departments' to 'department'
        .select('departmentid, departmentname')
        .order('departmentname');

      if (error) {
        console.error('Error fetching departments:', error);
        message.warning('Departments loading slowly. You can still register.');
      } else {
        setDepartments(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

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
            department_id: values.department_id
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
      }

      // Success message based on email confirmation status
      if (authData.user && !authData.user.email_confirmed_at) {
        message.success(
          <span>
            Account created successfully! 🎉<br />
            Please check your email for verification link.
          </span>,
          8
        );
      } else {
        message.success('Account created successfully! You can now log in.', 5);
      }
      
      // Redirect to login after delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);

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

  // Create employee profile in your employee table
  const createEmployeeProfile = async (user, values) => {
    try {
      // Split full name into first and last name
      const nameParts = values.full_name.split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // Get department name
      const departmentName = departments.find(dept => dept.departmentid === values.department_id)?.departmentname || '';

      const { error: employeeError } = await supabase
        .from('employee')
        .insert([
          {
            email: values.email.toLowerCase(),
            first_name: first_name,
            last_name: last_name,
            role: values.role,
            department: departmentName,
            status: 'active',
            auth_user_id: user.id, // Link to Supabase auth user
            created_at: new Date().toISOString(),
          },
        ]);

      if (employeeError) {
        console.error('Employee creation error:', employeeError);
        
        // If employee creation fails, try to update existing employee
        const { error: updateError } = await supabase
          .from('employee')
          .update({
            first_name: first_name,
            last_name: last_name,
            role: values.role,
            department: departmentName,
            status: 'active',
            auth_user_id: user.id,
          })
          .eq('email', values.email);

        if (updateError) {
          console.error('Employee update also failed:', updateError);
          message.warning('Account created but employee profile setup incomplete. Please contact support.');
        } else {
          message.info('Employee profile updated successfully.');
        }
      } else {
        console.log('Employee profile created successfully');
      }
    } catch (employeeError) {
      console.error('Unexpected error in employee creation:', employeeError);
      message.warning('Account created but there was an issue with employee profile setup.');
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

        {/* Email Error Alert */}
        {emailError && (
          <Alert
            message="Email Service Notice"
            description={emailError}
            type="warning"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 24 }}
            closable
          />
        )}

        {/* AIPL Logo Section */}
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
          <Image
            src="/images/aipl.png"
            alt="Sixth Automotive"
            preview={false}
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
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
            role: 'User'
          }}
        >
          <Form.Item
            name="full_name"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Full Name</Text>}
            rules={[{ 
              required: true, 
              message: 'Please input your full name!' 
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
              name="department_id"
              label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Department</Text>}
              rules={[{ 
                required: true, 
                message: 'Please select your department!' 
              }]}
            >
              <Select 
                placeholder="Select department" 
                size="large"
                suffixIcon={<TeamOutlined style={{ color: '#3498db' }} />}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                style={{
                  borderRadius: '8px'
                }}
                notFoundContent={
                  <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>
                    No departments found
                  </div>
                }
              >
                {departments.map(dept => (
                  <Option key={dept.departmentid} value={dept.departmentid}>
                    {dept.departmentname}
                  </Option>
                ))}
              </Select>
            </Form.Item>

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