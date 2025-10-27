// AccountantPayRol.js
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
import { supabase } from '../../../services/supabase';

const { Search } = Input;
const { Option } = Select;

const AccountantPayroll = ({ dateRange, onRefresh, currentUser }) => {
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
      const { data, error } = await supabase
        .from('salary')
        .select(`
          salaryid,
          empid,
          basicsalary,
          otpay,
          bonuspay,
          incrementpay,
          totalsalary,
          salarydate,
          processed_by,
          processed_at,
          employee:employee(full_name, department, email)
        `)
        .order('salarydate', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        salaryid: item.salaryid,
        empid: item.empid,
        employee: item.employee,
        basicsalary: item.basicsalary,
        otpay: item.otpay,
        bonuspay: item.bonuspay,
        incrementpay: item.incrementpay,
        totalsalary: item.totalsalary,
        salarydate: item.salarydate,
        processed_by: item.processed_by,
        processed_at: item.processed_at
      })) || [];

      setPayrollData(formattedData);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
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
      const { error } = await supabase
        .from('salary')
        .update({
          processed_by: currentUser?.id,
          processed_at: new Date().toISOString()
        })
        .eq('salaryid', record.salaryid);

      if (error) throw error;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'PAYROLL_PROCESSING',
          record_id: record.salaryid,
          accountant_id: currentUser?.id,
          details: `Processed payroll for employee ${record.empid} - Amount: $${record.totalsalary}`,
          operation_time: new Date().toISOString()
        });

      message.success(`Payment processed for ${record.employee?.full_name}`);
      fetchPayrollData();
      onRefresh?.();
    } catch (error) {
      console.error('Error processing payment:', error);
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
              formatter={value => value.toLocaleString()}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: 16, background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search by name, department or ID"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">All Status</Option>
                <Option value="processed">Processed</Option>
                <Option value="pending">Pending</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Button onClick={fetchPayrollData} loading={loading}>
                Refresh
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items`
          }}
          locale={{
            emptyText: (
              <Empty
                description="No payroll records found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
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
          </Button>
        ]}
        width={700}
      >
        {selectedPayroll && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Employee ID" span={1}>
              {selectedPayroll.empid}
            </Descriptions.Item>
            <Descriptions.Item label="Employee Name" span={1}>
              {selectedPayroll.employee?.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="Department" span={1}>
              {selectedPayroll.employee?.department}
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={1}>
              {selectedPayroll.employee?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Salary Date" span={1}>
              {dayjs(selectedPayroll.salarydate).format('MMMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <Tag color={selectedPayroll.processed_by ? 'success' : 'warning'}>
                {selectedPayroll.processed_by ? 'Processed' : 'Pending'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Basic Salary" span={1}>
              <strong>${selectedPayroll.basicsalary?.toLocaleString()}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="OT Pay" span={1}>
              ${selectedPayroll.otpay?.toLocaleString() || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Bonus Pay" span={1}>
              ${selectedPayroll.bonuspay?.toLocaleString() || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Increment Pay" span={1}>
              ${selectedPayroll.incrementpay?.toLocaleString() || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Total Salary" span={2}>
              <strong style={{ color: '#1890ff', fontSize: '18px' }}>
                ${selectedPayroll.totalsalary?.toLocaleString()}
              </strong>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AccountantPayroll;