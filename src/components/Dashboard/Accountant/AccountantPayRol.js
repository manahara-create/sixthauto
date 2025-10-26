import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, message, Modal, Descriptions, Statistic, Row, Col, Empty } from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const AccountantPayroll = ({ dateRange, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    fetchPayrollData();
  }, [dateRange]);

  useEffect(() => {
    filterData();
  }, [searchText, statusFilter, payrollData]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      // Simulated data - Replace with Supabase query
      const mockData = [
        {
          salaryid: '1',
          empid: 'E001',
          employee: { full_name: 'John Doe', department: 'Engineering', email: 'john@company.com' },
          basicsalary: 5000,
          otpay: 500,
          bonuspay: 1000,
          incrementpay: 0,
          totalsalary: 6500,
          salarydate: '2025-10-15',
          processed_by: null,
          processed_at: null
        },
        {
          salaryid: '2',
          empid: 'E002',
          employee: { full_name: 'Jane Smith', department: 'Marketing', email: 'jane@company.com' },
          basicsalary: 4500,
          otpay: 300,
          bonuspay: 0,
          incrementpay: 200,
          totalsalary: 5000,
          salarydate: '2025-10-15',
          processed_by: 'acc123',
          processed_at: '2025-10-16T10:30:00'
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setPayrollData(mockData);
    } catch (error) {
      message.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...payrollData];

    if (searchText) {
      filtered = filtered.filter(item =>
        item.employee?.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.employee?.department?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.empid?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const isProcessed = Boolean(item.processed_by);
        return statusFilter === 'processed' ? isProcessed : !isProcessed;
      });
    }

    setFilteredData(filtered);
  };

  const handleProcessPayment = async (record) => {
    try {
      // Supabase update query here
      message.success(`Payment processed for ${record.employee?.full_name}`);
      fetchPayrollData();
      onRefresh?.();
    } catch (error) {
      message.error('Failed to process payment');
    }
  };

  const showDetails = (record) => {
    setSelectedPayroll(record);
    setDetailsVisible(true);
  };

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'empid',
      key: 'empid',
      width: 120,
      fixed: 'left'
    },
    {
      title: 'Employee Name',
      dataIndex: ['employee', 'full_name'],
      key: 'name',
      width: 180,
      render: (text) => <strong>{text || 'N/A'}</strong>
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department',
      width: 150
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      width: 130,
      align: 'right',
      render: (val) => `$${val?.toLocaleString() || 0}`
    },
    {
      title: 'OT Pay',
      dataIndex: 'otpay',
      key: 'otpay',
      width: 110,
      align: 'right',
      render: (val) => `$${val?.toLocaleString() || 0}`
    },
    {
      title: 'Bonus',
      dataIndex: 'bonuspay',
      key: 'bonuspay',
      width: 110,
      align: 'right',
      render: (val) => `$${val?.toLocaleString() || 0}`
    },
    {
      title: 'Total Salary',
      dataIndex: 'totalsalary',
      key: 'totalsalary',
      width: 140,
      align: 'right',
      render: (val) => <strong style={{ color: '#1890ff' }}>${val?.toLocaleString() || 0}</strong>
    },
    {
      title: 'Date',
      dataIndex: 'salarydate',
      key: 'date',
      width: 120,
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Tag 
          icon={record.processed_by ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={record.processed_by ? 'success' : 'warning'}
        >
          {record.processed_by ? 'Processed' : 'Pending'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetails(record)}
          >
            View
          </Button>
          {!record.processed_by && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleProcessPayment(record)}
            >
              Process
            </Button>
          )}
        </Space>
      )
    }
  ];

  const stats = {
    total: filteredData.length,
    processed: filteredData.filter(d => d.processed_by).length,
    pending: filteredData.filter(d => !d.processed_by).length,
    totalAmount: filteredData.reduce((sum, d) => sum + (d.totalsalary || 0), 0)
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24, color: '#1a1a2e' }}>Payroll Management</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Records"
              value={stats.total}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Processed"
              value={stats.processed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.totalAmount}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Payroll Records"
        extra={
          <Space>
            <Search
              placeholder="Search by name or department"
              allowClear
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="processed">Processed</Option>
            </Select>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="salaryid"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`
          }}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: <Empty description="No payroll records found" />
          }}
        />
      </Card>

      <Modal
        title="Payroll Details"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
          !selectedPayroll?.processed_by && (
            <Button
              key="process"
              type="primary"
              onClick={() => {
                handleProcessPayment(selectedPayroll);
                setDetailsVisible(false);
              }}
            >
              Process Payment
            </Button>
          )
        ]}
        width={700}
      >
        {selectedPayroll && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Employee" span={2}>
              <strong>{selectedPayroll.employee?.full_name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Employee ID">
              {selectedPayroll.empid}
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {selectedPayroll.employee?.department}
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={2}>
              {selectedPayroll.employee?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Basic Salary">
              ${selectedPayroll.basicsalary?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="OT Pay">
              ${selectedPayroll.otpay?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Bonus Pay">
              ${selectedPayroll.bonuspay?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Increment Pay">
              ${selectedPayroll.incrementpay?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Total Salary" span={2}>
              <strong style={{ fontSize: 18, color: '#1890ff' }}>
                ${selectedPayroll.totalsalary?.toLocaleString()}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Salary Date">
              {dayjs(selectedPayroll.salarydate).format('MMMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedPayroll.processed_by ? 'success' : 'warning'}>
                {selectedPayroll.processed_by ? 'Processed' : 'Pending'}
              </Tag>
            </Descriptions.Item>
            {selectedPayroll.processed_at && (
              <Descriptions.Item label="Processed At" span={2}>
                {dayjs(selectedPayroll.processed_at).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AccountantPayroll;