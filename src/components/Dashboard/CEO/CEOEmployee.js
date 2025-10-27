import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Typography, Tag, Button, Space, Avatar,
  Progress, Badge, Tooltip, Input, Modal, Form, Select, InputNumber,
  Rate, message, Popconfirm
} from 'antd';
import {
  SearchOutlined, MessageOutlined, CrownOutlined, DownloadOutlined,
  FileTextOutlined, UserOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CEOEmployee = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [isPromotionModalVisible, setIsPromotionModalVisible] = useState(false);
  
  const [feedbackForm] = Form.useForm();
  const [promotionForm] = Form.useForm();

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchText, allEmployees]);

  const fetchAllEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setAllEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    const filtered = allEmployees.filter(employee =>
      employee.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchText.toLowerCase()) ||
      employee.role?.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToWord = async (data, filename, title) => {
    // Word export implementation would go here
    message.info('Word export feature would be implemented here');
  };

  const giveFeedback = async (values) => {
    try {
      const { data, error } = await supabase
        .from('md_operations')
        .insert([{
          operation: 'employee_feedback',
          record_id: selectedEmployee.empid,
          md_id: profile.empid,
          details: {
            feedback: values.feedback,
            rating: values.rating,
            type: values.feedback_type,
            date: dayjs().format('YYYY-MM-DD'),
            employee_name: `${selectedEmployee.full_name}`
          }
        }])
        .select();

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

  const promoteEmployee = async (values) => {
    try {
      if (!values.employee_id || !values.new_position) {
        message.error('Employee and new position are required');
        return;
      }

      const salaryIncrease = parseFloat(values.salary_increase) || 0;
      if (salaryIncrease < 0) {
        message.error('Salary increase cannot be negative');
        return;
      }

      const { error: employeeError } = await supabase
        .from('employee')
        .update({
          role: values.new_position,
          department: values.department,
          updated_at: new Date().toISOString()
        })
        .eq('empid', values.employee_id);

      if (employeeError) throw employeeError;

      try {
        const { data: promotion, error: promotionError } = await supabase
          .from('promotion')
          .insert([{
            empid: values.employee_id,
            oldposition: values.current_position || 'Unknown',
            newposition: values.new_position,
            promotiondate: dayjs().format('YYYY-MM-DD'),
            salaryincrease: Math.round(salaryIncrease),
            department: values.department
          }])
          .select();

        if (promotionError) {
          console.warn('Promotion table insert failed:', promotionError);
        }
      } catch (promError) {
        console.warn('Promotion record creation failed:', promError);
      }

      await supabase
        .from('promotion_history')
        .insert([{
          empid: values.employee_id,
          previousrole: values.current_position || 'Unknown',
          newrole: values.new_position,
          promotedby: profile?.empid,
          promotion_date: new Date().toISOString()
        }]);

      message.success('Employee promoted successfully!');
      setIsPromotionModalVisible(false);
      promotionForm.resetFields();
      fetchAllEmployees();
    } catch (error) {
      console.error('Error promoting employee:', error);
      message.error('Failed to promote employee');
    }
  };

  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'full_name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {record.full_name?.[0]}
          </Avatar>
          <div>
            <Text strong>{record.full_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.role}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept}</Tag>
    },
    {
      title: 'KPI Score',
      dataIndex: 'kpiscore',
      key: 'kpiscore',
      render: (score) => (
        <Progress
          percent={score || 0}
          size="small"
          status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={status === 'Active' ? 'success' : 'default'}
          text={status}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Tooltip title="Give Feedback">
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={() => {
                setSelectedEmployee(record);
                setIsFeedbackModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Promote">
            <Button
              size="small"
              icon={<CrownOutlined />}
              onClick={() => {
                setSelectedEmployee(record);
                promotionForm.setFieldsValue({
                  employee_id: record.empid,
                  current_position: record.role,
                  department: record.department
                });
                setIsPromotionModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        <Title level={2}>Employee Management</Title>
        
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Input
              placeholder="Search employees by name, department, or role..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => exportToExcel(allEmployees, 'employees_report', 'Employees')}
              >
                Export to Excel
              </Button>
              <Button
                icon={<FileTextOutlined />}
                onClick={() => exportToWord(allEmployees, 'employees_report', 'Employees Report')}
              >
                Export to Word
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={employeeColumns}
          dataSource={filteredEmployees}
          rowKey="empid"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Feedback Modal */}
      <Modal
        title="Give Employee Feedback"
        open={isFeedbackModalVisible}
        onCancel={() => {
          setIsFeedbackModalVisible(false);
          feedbackForm.resetFields();
          setSelectedEmployee(null);
        }}
        footer={null}
        width={500}
      >
        {selectedEmployee && (
          <Form form={feedbackForm} layout="vertical" onFinish={giveFeedback}>
            <Form.Item label="Employee">
              <Input
                value={`${selectedEmployee.full_name}`}
                disabled
              />
            </Form.Item>
            <Form.Item name="feedback_type" label="Feedback Type" rules={[{ required: true }]}>
              <Select placeholder="Select feedback type">
                <Option value="positive">Positive</Option>
                <Option value="constructive">Constructive</Option>
                <Option value="developmental">Developmental</Option>
              </Select>
            </Form.Item>
            <Form.Item name="rating" label="Rating (1-5)" rules={[{ required: true }]}>
              <InputNumber min={1} max={5} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="feedback" label="Feedback" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="Enter your feedback..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Submit Feedback
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Promotion Modal */}
      <Modal
        title="Promote Employee"
        open={isPromotionModalVisible}
        onCancel={() => {
          setIsPromotionModalVisible(false);
          promotionForm.resetFields();
          setSelectedEmployee(null);
        }}
        footer={null}
        width={600}
      >
        {selectedEmployee && (
          <Form form={promotionForm} layout="vertical" onFinish={promoteEmployee}>
            <Form.Item name="employee_id" initialValue={selectedEmployee.empid}>
              <Input type="hidden" />
            </Form.Item>
            <Form.Item label="Current Employee">
              <Input
                value={`${selectedEmployee.full_name}`}
                disabled
              />
            </Form.Item>
            <Form.Item label="Current Position">
              <Input value={selectedEmployee.role} disabled />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="current_position" label="Current Position" initialValue={selectedEmployee.role}>
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="new_position" label="New Position" rules={[{ required: true }]}>
                  <Input placeholder="Enter new position" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                  <Select placeholder="Select department">
                    <Option value="AUTOMOTIVE">Automotive</Option>
                    <Option value="SALES">Sales</Option>
                    <Option value="MARKETING">Marketing</Option>
                    <Option value="DEVELOPMENT">Development</Option>
                    <Option value="HR">HR</Option>
                    <Option value="FINANCE">Finance</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="salary_increase" label="Salary Increase ($)" rules={[{ required: true }]}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Enter amount"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Promote Employee
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default CEOEmployee;