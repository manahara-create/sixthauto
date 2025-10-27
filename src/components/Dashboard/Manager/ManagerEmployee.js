import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  List,
  Avatar,
  Progress,
  Button,
  Space,
  Input,
  Typography,
  Modal,
  Form,
  Select,
  message,
  Tag,
  Divider,
  Empty
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  MessageOutlined,
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ManagerTeam = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [feedbackForm] = Form.useForm();

  useEffect(() => {
    if (profile?.empid) {
      fetchTeamMembers();
    }
  }, [profile?.empid]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, full_name, email, phone, role, department, gender, status, basicsalary, kpiscore, satisfaction_score, dob, tenure')
        .eq('managerid', profile.empid)
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      message.error('Failed to load team members');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const giveFeedback = async (values) => {
    try {
      if (!selectedEmployee) {
        message.error('No employee selected');
        return;
      }

      const { data, error } = await supabase
        .from('manager_operations')
        .insert([{
          operation: 'employee_feedback',
          record_id: selectedEmployee.empid,
          manager_id: profile.empid,
          details: {
            feedback: values.feedback,
            rating: values.rating,
            type: values.feedback_type,
            date: new Date().toISOString().split('T')[0]
          },
          operation_time: new Date().toISOString()
        }]);

      if (error) throw error;
      
      message.success('Feedback submitted successfully!');
      setIsFeedbackModalVisible(false);
      feedbackForm.resetFields();
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
    }
  };

  const getKPIStatus = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'normal';
    return 'exception';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'on leave': return 'orange';
      default: return 'default';
    }
  };

  const filteredTeamMembers = teamMembers.filter(member =>
    member.full_name?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  if (!profile?.empid) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Empty
          description="Manager profile not found. Please contact administrator."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3}>
              <TeamOutlined /> Team Management
            </Title>
          </Col>
          <Col>
            <Input
              placeholder="Search team members..."
              prefix={<SearchOutlined />}
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </Col>
        </Row>

        <Divider />

        {loading ? (
          <Card loading={true} style={{ minHeight: 200 }} />
        ) : filteredTeamMembers.length === 0 ? (
          <Empty
            description={
              searchEmployee ? 
              "No team members found matching your search" : 
              "No team members found under your management"
            }
          />
        ) : (
          <List
            dataSource={filteredTeamMembers}
            renderItem={(employee) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsProfileModalVisible(true);
                    }}
                  >
                    View
                  </Button>,
                  <Button
                    type="link"
                    icon={<MessageOutlined />}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsFeedbackModalVisible(true);
                    }}
                  >
                    Feedback
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <Text strong>{employee.full_name}</Text>
                      <Tag color={getStatusColor(employee.status)}>
                        {employee.status}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">{employee.email}</Text>
                      <Text type="secondary">{employee.role} - {employee.department}</Text>
                      <Space>
                        <Text type="secondary">KPI Score:</Text>
                        <Progress
                          percent={employee.kpiscore || 0}
                          size="small"
                          status={getKPIStatus(employee.kpiscore)}
                          style={{ width: 100 }}
                          showInfo={false}
                        />
                        <Text>({employee.kpiscore || 0})</Text>
                      </Space>
                      {employee.tenure && (
                        <Text type="secondary">Tenure: {employee.tenure}</Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} team members`
            }}
          />
        )}
      </Card>

      {/* Employee Profile Modal */}
      <Modal
        title={`Employee Profile - ${selectedEmployee?.full_name}`}
        open={isProfileModalVisible}
        onCancel={() => {
          setIsProfileModalVisible(false);
          setSelectedEmployee(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsProfileModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedEmployee && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Email:</Text>
                <br />
                <Text>{selectedEmployee.email}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Phone:</Text>
                <br />
                <Text>{selectedEmployee.phone || 'N/A'}</Text>
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Role:</Text>
                <br />
                <Text>{selectedEmployee.role}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Department:</Text>
                <br />
                <Text>{selectedEmployee.department}</Text>
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Status:</Text>
                <br />
                <Tag color={getStatusColor(selectedEmployee.status)}>
                  {selectedEmployee.status}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>Basic Salary:</Text>
                <br />
                <Text>${selectedEmployee.basicsalary?.toLocaleString()}</Text>
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>KPI Score:</Text>
                <br />
                <Progress
                  percent={selectedEmployee.kpiscore || 0}
                  status={getKPIStatus(selectedEmployee.kpiscore)}
                  style={{ width: 150 }}
                />
              </Col>
              <Col span={12}>
                <Text strong>Satisfaction Score:</Text>
                <br />
                <Text>{selectedEmployee.satisfaction_score || 'N/A'}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal
        title={`Give Feedback to ${selectedEmployee?.full_name}`}
        open={isFeedbackModalVisible}
        onCancel={() => {
          setIsFeedbackModalVisible(false);
          feedbackForm.resetFields();
          setSelectedEmployee(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={feedbackForm} layout="vertical" onFinish={giveFeedback}>
          <Form.Item name="feedback_type" label="Feedback Type" rules={[{ required: true }]}>
            <Select placeholder="Select feedback type">
              <Option value="positive">Positive</Option>
              <Option value="constructive">Constructive</Option>
              <Option value="improvement">Improvement Needed</Option>
            </Select>
          </Form.Item>
          <Form.Item name="rating" label="Rating (1-5)" rules={[{ required: true }]}>
            <Select placeholder="Select rating">
              <Option value={1}>1 - Poor</Option>
              <Option value={2}>2 - Fair</Option>
              <Option value={3}>3 - Good</Option>
              <Option value={4}>4 - Very Good</Option>
              <Option value={5}>5 - Excellent</Option>
            </Select>
          </Form.Item>
          <Form.Item name="feedback" label="Feedback" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Enter your feedback..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Feedback
              </Button>
              <Button onClick={() => {
                setIsFeedbackModalVisible(false);
                feedbackForm.resetFields();
                setSelectedEmployee(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerTeam;