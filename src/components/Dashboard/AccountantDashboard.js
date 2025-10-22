// src/components/Dashboard/AccountantDashboard.js
import React, { useState, useEffect } from 'react';
import EmployeeDetails from './EmployeeDetails';
import {
  Row,
  Col,
  Card,
  Statistic,
  List,
  Typography,
  Tag,
  Button,
  Space,
  Progress,
  Table,
  Tooltip
} from 'antd';
import {
  DollarOutlined,
  PieChartOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AccountantDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({});
  const [payrollData, setPayrollData] = useState([]);
  const [epfContributions, setEpfContributions] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  <EmployeeDetails employeeId={profile.empid} showActions={true} />

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchFinancialData(),
        fetchPayrollData(),
        fetchEPFData(),
        fetchPendingPayments()
      ]);
    } catch (error) {
      console.error('Error initializing accountant dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialData = async () => {
    try {
      const { data: salaryData } = await supabase
        .from('salary')
        .select('totalsalary')
        .order('salarydate', { ascending: false })
        .limit(1);

      const { data: epfData } = await supabase
        .from('epf_contributions')
        .select('totalcontribution')
        .order('month', { ascending: false })
        .limit(1);

      const { data: revenueData } = await supabase
        .from('financialreports')
        .select('totalrevenue')
        .order('quarterenddate', { ascending: false })
        .limit(1);

      setFinancialData({
        totalSalary: salaryData?.[0]?.totalsalary || 0,
        totalEPF: epfData?.[0]?.totalcontribution || 0,
        totalRevenue: revenueData?.[0]?.totalrevenue || 0
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const fetchPayrollData = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (first_name, last_name)
        `)
        .order('salarydate', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPayrollData(data || []);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    }
  };

  const fetchEPFData = async () => {
    try {
      const { data, error } = await supabase
        .from('epf_contributions')
        .select(`
          *,
          employee:empid (first_name, last_name)
        `)
        .order('month', { ascending: false })
        .limit(5);

      if (error) throw error;
      setEpfContributions(data || []);
    } catch (error) {
      console.error('Error fetching EPF data:', error);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (first_name, last_name)
        `)
        .is('processed_by', null)
        .order('salarydate', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPendingPayments(data || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const payrollColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'first_name'],
      key: 'employee',
      render: (text, record) => 
        `${record.employee?.first_name} ${record.employee?.last_name}`
    },
    {
      title: 'Date',
      dataIndex: 'salarydate',
      key: 'salarydate',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (amount) => `$${amount?.toLocaleString()}`
    },
    {
      title: 'Total Salary',
      dataIndex: 'totalsalary',
      key: 'totalsalary',
      render: (amount) => `$${amount?.toLocaleString()}`
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.processed_by ? 'green' : 'orange'}>
          {record.processed_by ? 'Processed' : 'Pending'}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Card size="small" style={{ 
        marginBottom: 16, 
        background: 'linear-gradient(135deg, #722ed1 0%, #391085 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <DollarOutlined style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                Accountant Dashboard
              </Title>
              <Tag color="white" style={{ color: '#722ed1', fontWeight: 'bold' }}>
                {profile?.first_name} {profile?.last_name}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'white' }}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Welcome Alert */}
      <Alert
        message={`Welcome back, ${profile?.first_name || 'Accountant'}!`}
        description="Manage payroll, EPF/ETF contributions, financial reports, and accounting operations."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Salary"
              value={financialData.totalSalary}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="EPF Contributions"
              value={financialData.totalEPF}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Payments"
              value={pendingPayments.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={financialData.totalRevenue}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Payroll */}
        <Col xs={24} lg={12}>
          <Card 
            title="Recent Payroll" 
            extra={<Button type="link" icon={<EyeOutlined />}>View All</Button>}
            loading={loading}
          >
            <Table
              dataSource={payrollData}
              columns={payrollColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* EPF Contributions */}
        <Col xs={24} lg={12}>
          <Card title="Recent EPF Contributions" loading={loading}>
            <List
              dataSource={epfContributions}
              renderItem={epf => (
                <List.Item>
                  <List.Item.Meta
                    title={`${epf.employee?.first_name} ${epf.employee?.last_name}`}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text>Month: {dayjs(epf.month).format('MMMM YYYY')}</Text>
                        <Text>Total: ${epf.totalcontribution?.toLocaleString()}</Text>
                      </Space>
                    }
                  />
                  <Tag color={epf.status === 'processed' ? 'green' : 'orange'}>
                    {epf.status}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Pending Payments */}
        <Col xs={24} lg={12}>
          <Card title="Pending Payments" loading={loading}>
            <List
              dataSource={pendingPayments}
              renderItem={payment => (
                <List.Item
                  actions={[
                    <Button type="link" size="small">Process</Button>
                  ]}
                >
                  <List.Item.Meta
                    title={`${payment.employee?.first_name} ${payment.employee?.last_name}`}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text>Amount: ${payment.totalsalary?.toLocaleString()}</Text>
                        <Text>Date: {dayjs(payment.salarydate).format('DD/MM/YYYY')}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Financial Overview */}
        <Col xs={24} lg={12}>
          <Card title="Financial Overview">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Monthly P&L"
                    value={125000}
                    prefix="$"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Text type="secondary">+12% from last month</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Balance Sheet"
                    value={450000}
                    prefix="$"
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Text type="secondary">Total assets</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Cash Flow"
                    value={75000}
                    prefix="$"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                  <Text type="secondary">Operating activities</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Tax Liability"
                    value={28500}
                    prefix="$"
                    valueStyle={{ color: '#f5222d' }}
                  />
                  <Text type="secondary">Current quarter</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AccountantDashboard;