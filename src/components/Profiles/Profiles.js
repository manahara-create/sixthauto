// src/components/Common/Profile.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  message,
  Row,
  Col,
  Statistic,
  Space,
  Descriptions,
  Tag,
  Divider,
  Switch,
  Select,
  DatePicker
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import DatabaseService from '../../services/databaseService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const Profile = () => {
  const { profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        gender: profile.gender,
        dob: profile.dob ? dayjs(profile.dob) : null,
        empaddress: profile.empaddress,
        department: profile.department,
        role: profile.role
      });
    }
  }, [profile, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await DatabaseService.updateEmployee(profile.empid, {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        updated_at: new Date().toISOString()
      });
      
      message.success('Profile updated successfully!');
      setEditing(false);
      refreshProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
  };

  const handleUpload = async (file) => {
    try {
      const { publicUrl } = await DatabaseService.uploadFile(file, 'avatars');
      await DatabaseService.updateEmployee(profile.empid, {
        avatarurl: publicUrl
      });
      message.success('Profile picture updated successfully!');
      refreshProfile();
      return false; // Prevent default upload
    } catch (error) {
      console.error('Error uploading avatar:', error);
      message.error('Failed to upload profile picture');
      return false;
    }
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <Card title="My Profile">
        <Row gutter={24}>
          {/* Avatar Section */}
          <Col span={8}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUpload}
                disabled={!editing}
              >
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={profile.avatarurl || '/default-avatar.png'}
                    alt="Profile"
                    style={{
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #f0f0f0'
                    }}
                  />
                  {editing && (
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<UploadOutlined />}
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8
                      }}
                    />
                  )}
                </div>
              </Upload>
              <div style={{ marginTop: 16 }}>
                <h3>{profile.first_name} {profile.last_name}</h3>
                <Tag color="blue">{profile.role}</Tag>
                <Tag color="green">{profile.department}</Tag>
              </div>
            </div>

            {/* Quick Stats */}
            <Card size="small" title="Quick Stats">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Employee ID">
                  {profile.empid}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={profile.is_active ? 'green' : 'red'}>
                    {profile.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="KPI Score">
                  {profile.kpiscore || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Join Date">
                  {dayjs(profile.created_at).format('DD/MM/YYYY')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Profile Details */}
          <Col span={16}>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              {!editing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Space>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={() => form.submit()}
                  >
                    Save Changes
                  </Button>
                </Space>
              )}
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              disabled={!editing}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="first_name"
                    label="First Name"
                    rules={[{ required: true, message: 'Please enter first name' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="last_name"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please enter last name' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input prefix={<PhoneOutlined />} type="tel" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[{ required: true, message: 'Please select gender' }]}
                  >
                    <Select>
                      <Option value="Male">Male</Option>
                      <Option value="Female">Female</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="dob" label="Date of Birth">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="empaddress" label="Address">
                <TextArea rows={3} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="department"
                    label="Department"
                  >
                    <Input prefix={<BankOutlined />} disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="role"
                    label="Role"
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            <Divider />

            {/* Leave Balances */}
            <Card size="small" title="Leave Balances">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="Sick Leave" value={profile.sickleavebalance || 0} />
                </Col>
                <Col span={6}>
                  <Statistic title="Full Day Leave" value={profile.fulldayleavebalance || 0} />
                </Col>
                <Col span={6}>
                  <Statistic title="Half Day Leave" value={profile.halfdayleavebalance || 0} />
                </Col>
                <Col span={6}>
                  <Statistic title="Maternity Leave" value={profile.maternityleavebalance || 0} />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Profile;