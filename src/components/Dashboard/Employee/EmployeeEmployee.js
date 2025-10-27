import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Typography, Tag, Button, Space,
  Statistic, Modal, Form, Select, DatePicker, Input,
  message
} from 'antd';
import {
  CalendarOutlined, PlusOutlined, DownloadOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EmployeeLeaves = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  
  const [leaveForm] = Form.useForm();

  useEffect(() => {
    fetchMyLeaves();
    fetchLeaveBalance();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employeeleave')
        .select('*')
        .eq('empid', profile.empid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyLeaves(data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      message.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('leavebalance')
        .select('*')
        .eq('empid', profile.empid)
        .single();

      setLeaveBalance(data || { days: 15, max_days: 21, taken: 6 });
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      setLeaveBalance({ days: 15, max_days: 21, taken: 6 });
    }
  };

  const handleApplyLeave = async (values) => {
    try {
      if (!values.fromDate || !values.toDate) {
        message.error('Please select both from and to dates');
        return;
      }

      const fromDate = dayjs(values.fromDate);
      const toDate = dayjs(values.toDate);

      if (toDate.isBefore(fromDate)) {
        message.error('To date cannot be before from date');
        return;
      }

      const duration = toDate.diff(fromDate, 'day') + 1;

      const leaveData = {
        empid: profile.empid,
        leavetype: values.leaveType,
        leavefromdate: fromDate.format('YYYY-MM-DD'),
        leavetodate: toDate.format('YYYY-MM-DD'),
        leavereason: values.reason?.trim() || '',
        leavestatus: 'pending',
        duration: duration
      };

      const { error } = await supabase
        .from('employeeleave')
        .insert([leaveData]);

      if (error) throw error;

      message.success('Leave application submitted successfully!');
      setIsLeaveModalVisible(false);
      leaveForm.resetFields();
      fetchMyLeaves();
    } catch (error) {
      console.error('Error applying for leave:', error);
      message.error('Failed to apply for leave');
    }
  };

  const exportToExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leaves');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'approved': 'green',
      'pending': 'orange',
      'rejected': 'red'
    };
    return statusColors[status?.toLowerCase()] || 'default';
  };

  const leaveColumns = [
    {
      title: 'Leave Type',
      dataIndex: 'leavetype',
      key: 'leavetype',
    },
    {
      title: 'From Date',
      dataIndex: 'leavefromdate',
      key: 'leavefromdate',
      render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
    },
    {
      title: 'To Date',
      dataIndex: 'leavetodate',
      key: 'leavetodate',
      render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} days`
    },
    {
      title: 'Status',
      dataIndex: 'leavestatus',
      key: 'leavestatus',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Applied Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card>
        <Title level={2}>Leave Management</Title>
        
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Total Leaves" value={leaveBalance.max_days || 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Leaves Taken" value={leaveBalance.taken || 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Remaining" value={leaveBalance.days || 0} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsLeaveModalVisible(true)}
            >
              Apply for Leave
            </Button>
          </Col>
          <Col>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportToExcel(myLeaves, 'my_leaves')}
            >
              Export to Excel
            </Button>
          </Col>
        </Row>

        <Table
          columns={leaveColumns}
          dataSource={myLeaves}
          rowKey="leaveid"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Leave Application Modal */}
      <Modal
        title="Apply for Leave"
        open={isLeaveModalVisible}
        onCancel={() => setIsLeaveModalVisible(false)}
        footer={null}
      >
        <Form form={leaveForm} layout="vertical" onFinish={handleApplyLeave}>
          <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select leave type">
              <Option value="Annual">Annual Leave</Option>
              <Option value="Sick">Sick Leave</Option>
              <Option value="Casual">Casual Leave</Option>
              <Option value="Maternity">Maternity Leave</Option>
              <Option value="Paternity">Paternity Leave</Option>
            </Select>
          </Form.Item>
          <Form.Item name="fromDate" label="From Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="toDate" label="To Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Enter reason for leave" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Application
              </Button>
              <Button onClick={() => setIsLeaveModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeLeaves;