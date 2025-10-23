// src/components/Common/LeaveManagement.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import DatabaseService from '../../services/databaseService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const LeaveManagement = () => {
  const { profile } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [form] = Form.useForm();

  const isManagerOrHR = ['manager', 'hr', 'admin'].includes(profile?.role);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (!isManagerOrHR) {
        filters.employeeId = profile.empid;
      }
      const data = await DatabaseService.getLeaves(filters);
      setLeaves(data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      message.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (values) => {
    try {
      const fromDate = values.leavefromdate.format('YYYY-MM-DD');
      const toDate = values.leavetodate.format('YYYY-MM-DD');
      const duration = dayjs(toDate).diff(dayjs(fromDate), 'day') + 1;

      const leaveData = {
        empid: profile.empid,
        leavetypeid: values.leavetypeid,
        leavefromdate: fromDate,
        leavetodate: toDate,
        duration: duration,
        leavereason: values.leavereason,
        leavestatus: 'pending',
        created_at: new Date().toISOString()
      };

      await DatabaseService.applyLeave(leaveData);
      message.success('Leave application submitted successfully!');
      setModalVisible(false);
      form.resetFields();
      fetchLeaves();
    } catch (error) {
      console.error('Error applying leave:', error);
      message.error('Failed to apply leave');
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      await DatabaseService.updateLeaveStatus(leaveId, 'approved', profile.empid);
      message.success('Leave approved successfully!');
      fetchLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
      message.error('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await DatabaseService.updateLeaveStatus(leaveId, 'rejected', profile.empid);
      message.success('Leave rejected successfully!');
      fetchLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      message.error('Failed to reject leave');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending': return 'orange';
      default: return 'blue';
    }
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'first_name'],
      key: 'employee',
      render: (text, record) => 
        `${record.employee?.first_name} ${record.employee?.last_name}`
    },
    {
      title: 'Leave Type',
      dataIndex: ['leavetype', 'leavetype'],
      key: 'leavetype'
    },
    {
      title: 'From Date',
      dataIndex: 'leavefromdate',
      key: 'leavefromdate',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'To Date',
      dataIndex: 'leavetodate',
      key: 'leavetodate',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} days`
    },
    {
      title: 'Reason',
      dataIndex: 'leavereason',
      key: 'leavereason',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'leavestatus',
      key: 'leavestatus',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Applied On',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {isManagerOrHR && record.leavestatus === 'pending' && (
            <>
              <Button 
                type="link" 
                size="small" 
                style={{ color: '#52c41a' }}
                onClick={() => handleApproveLeave(record.leaveid)}
              >
                Approve
              </Button>
              <Button 
                type="link" 
                size="small" 
                danger
                onClick={() => handleRejectLeave(record.leaveid)}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const leaveStats = {
    total: leaves.length,
    pending: leaves.filter(l => l.leavestatus === 'pending').length,
    approved: leaves.filter(l => l.leavestatus === 'approved').length,
    rejected: leaves.filter(l => l.leavestatus === 'rejected').length
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Leave Management"
        extra={
          !isManagerOrHR && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              Apply Leave
            </Button>
          )
        }
      >
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Leaves"
                value={leaveStats.total}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending"
                value={leaveStats.pending}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Approved"
                value={leaveStats.approved}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Rejected"
                value={leaveStats.rejected}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Leaves Table */}
        <Table
          dataSource={leaves}
          columns={columns}
          loading={loading}
          rowKey="leaveid"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        title="Apply for Leave"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApplyLeave}
        >
          <Form.Item
            name="leavetypeid"
            label="Leave Type"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select placeholder="Select leave type">
              <Option value={1}>Sick Leave</Option>
              <Option value={2}>Annual Leave</Option>
              <Option value={3}>Casual Leave</Option>
              <Option value={4}>Maternity Leave</Option>
              <Option value={5}>Paternity Leave</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="leavefromdate"
            label="From Date"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="leavetodate"
            label="To Date"
            rules={[{ required: true, message: 'Please select end date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="leavereason"
            label="Reason"
            rules={[{ required: true, message: 'Please enter reason for leave' }]}
          >
            <TextArea rows={4} placeholder="Enter reason for leave..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveManagement;