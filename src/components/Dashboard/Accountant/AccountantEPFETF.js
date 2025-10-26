import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Row,
  Col,
  Statistic,
  Alert,
  Space,
  message,
  Tag,
  Progress
} from 'antd';
import {
  BankOutlined,
  PlusOutlined,
  PercentageOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const AccountantEPFETF = ({ dateRange, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('epf');
  const [employees, setEmployees] = useState([]);
  const [epfData, setEpfData] = useState([]);
  const [etfData, setEtfData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [basicSalary, setBasicSalary] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [calculation, setCalculation] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchContributions();
  }, [dateRange]);

  useEffect(() => {
    calculateContributions();
  }, [basicSalary, activeTab]);

  const fetchEmployees = async () => {
    const mockEmployees = [
      { empid: 'E001', full_name: 'John Doe', department: 'Engineering', basicsalary: 5000 },
      { empid: 'E002', full_name: 'Jane Smith', department: 'Marketing', basicsalary: 4500 },
      { empid: 'E003', full_name: 'Bob Johnson', department: 'Sales', basicsalary: 4000 }
    ];
    setEmployees(mockEmployees);
  };

  const fetchContributions = async () => {
    const mockEPF = [
      {
        id: '1',
        employee: { full_name: 'John Doe', department: 'Engineering' },
        basicsalary: 5000,
        employeecontribution: 400,
        employercontribution: 600,
        totalcontribution: 1000,
        month: '2025-10-01',
        status: 'processed'
      }
    ];

    const mockETF = [
      {
        id: '1',
        employee: { full_name: 'John Doe', department: 'Engineering' },
        basicsalary: 5000,
        employercontribution: 150,
        month: '2025-10-01',
        status: 'processed'
      }
    ];

    setEpfData(mockEPF);
    setEtfData(mockETF);
  };

  const calculateContributions = () => {
    if (!basicSalary) {
      setCalculation(null);
      return;
    }
    
    if (activeTab === 'epf') {
      const employeeEPF = Math.round(basicSalary * 0.08);
      const employerEPF = Math.round(basicSalary * 0.12);
      setCalculation({
        type: 'EPF',
        basicSalary,
        employeeContribution: employeeEPF,
        employerContribution: employerEPF,
        total: employeeEPF + employerEPF
      });
    } else {
      const employerETF = Math.round(basicSalary * 0.03);
      setCalculation({
        type: 'ETF',
        basicSalary,
        employerContribution: employerETF,
        total: employerETF
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !basicSalary) {
      message.error('Please select employee and enter salary');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success(`${activeTab.toUpperCase()} contribution processed successfully!`);
      resetForm();
      fetchContributions();
      onRefresh?.();
    } catch (error) {
      message.error('Failed to process contribution');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setBasicSalary(0);
    setSelectedMonth(dayjs());
    setCalculation(null);
  };

  const epfColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee'
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department'
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (val) => `${val?.toLocaleString()}`
    },
    {
      title: 'Employee (8%)',
      dataIndex: 'employeecontribution',
      key: 'employeecontribution',
      render: (val) => `${val?.toLocaleString()}`
    },
    {
      title: 'Employer (12%)',
      dataIndex: 'employercontribution',
      key: 'employercontribution',
      render: (val) => `${val?.toLocaleString()}`
    },
    {
      title: 'Total (20%)',
      dataIndex: 'totalcontribution',
      key: 'totalcontribution',
      render: (val) => <strong style={{ color: '#1890ff' }}>${val?.toLocaleString()}</strong>
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (date) => dayjs(date).format('MMM YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="success">{status}</Tag>
    }
  ];

  const etfColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee'
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department'
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (val) => `${val?.toLocaleString()}`
    },
    {
      title: 'Employer (3%)',
      dataIndex: 'employercontribution',
      key: 'employercontribution',
      render: (val) => <strong style={{ color: '#52c41a' }}>${val?.toLocaleString()}</strong>
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (date) => dayjs(date).format('MMM YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="success">{status}</Tag>
    }
  ];

  const stats = {
    epf: {
      total: epfData.reduce((sum, d) => sum + (d.totalcontribution || 0), 0),
      records: epfData.length
    },
    etf: {
      total: etfData.reduce((sum, d) => sum + (d.employercontribution || 0), 0),
      records: etfData.length
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24, color: '#1a1a2e' }}>
        <BankOutlined /> EPF/ETF Management
      </h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total EPF Contributions"
              value={stats.epf.total}
              prefix="$"
              suffix={`(${stats.epf.records} records)`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total ETF Contributions"
              value={stats.etf.total}
              prefix="$"
              suffix={`(${stats.etf.records} records)`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={(key) => {
        setActiveTab(key);
        resetForm();
      }}>
        <Tabs.TabPane tab="EPF Contributions" key="epf">
          <Row gutter={24}>
            <Col xs={24} lg={14}>
              <Card
                title={<><PlusOutlined /> Process EPF</>}
                style={{ marginBottom: 24 }}
              >
                <Alert
                  message="EPF Calculation"
                  description="Employee: 8% | Employer: 12% | Total: 20% of basic salary"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Employee</label>
                    <Select
                      placeholder="Select employee"
                      style={{ width: '100%' }}
                      value={selectedEmployee}
                      onChange={(empid) => {
                        setSelectedEmployee(empid);
                        const emp = employees.find(e => e.empid === empid);
                        setBasicSalary(emp?.basicsalary || 0);
                      }}
                    >
                      {employees.map(emp => (
                        <Option key={emp.empid} value={emp.empid}>
                          {emp.full_name} - {emp.department}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Month</label>
                    <DatePicker
                      picker="month"
                      style={{ width: '100%' }}
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Basic Salary</label>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      prefix="$"
                      value={basicSalary}
                      onChange={setBasicSalary}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </div>

                  <Button
                    type="primary"
                    block
                    loading={loading}
                    disabled={!calculation}
                    onClick={handleSubmit}
                  >
                    Process EPF Contribution
                  </Button>
                </Space>
              </Card>

              <Card title="EPF Contribution Records">
                <Table
                  columns={epfColumns}
                  dataSource={epfData}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              {calculation && calculation.type === 'EPF' && (
                <Card
                  title={<><PercentageOutlined /> EPF Breakdown</>}
                  style={{ position: 'sticky', top: 24 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    <div>
                      <div style={{ marginBottom: 8, color: '#666' }}>Employee Contribution (8%)</div>
                      <Progress
                        percent={8}
                        format={() => `${calculation.employeeContribution.toLocaleString()}`}
                        strokeColor="#1890ff"
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, color: '#666' }}>Employer Contribution (12%)</div>
                      <Progress
                        percent={12}
                        format={() => `${calculation.employerContribution.toLocaleString()}`}
                        strokeColor="#52c41a"
                      />
                    </div>
                    <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
                      <Statistic
                        title="Total EPF Contribution"
                        value={calculation.total}
                        prefix="$"
                        valueStyle={{ fontSize: 28, color: '#722ed1', fontWeight: 'bold' }}
                      />
                    </div>
                  </Space>
                </Card>
              )}
            </Col>
          </Row>
        </Tabs.TabPane>

        <Tabs.TabPane tab="ETF Contributions" key="etf">
          <Row gutter={24}>
            <Col xs={24} lg={14}>
              <Card
                title={<><PlusOutlined /> Process ETF</>}
                style={{ marginBottom: 24 }}
              >
                <Alert
                  message="ETF Calculation"
                  description="Employer contribution: 3% of basic salary"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Employee</label>
                    <Select
                      placeholder="Select employee"
                      style={{ width: '100%' }}
                      value={selectedEmployee}
                      onChange={(empid) => {
                        setSelectedEmployee(empid);
                        const emp = employees.find(e => e.empid === empid);
                        setBasicSalary(emp?.basicsalary || 0);
                      }}
                    >
                      {employees.map(emp => (
                        <Option key={emp.empid} value={emp.empid}>
                          {emp.full_name} - {emp.department}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Month</label>
                    <DatePicker
                      picker="month"
                      style={{ width: '100%' }}
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Basic Salary</label>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      prefix="$"
                      value={basicSalary}
                      onChange={setBasicSalary}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </div>

                  <Button
                    type="primary"
                    block
                    loading={loading}
                    disabled={!calculation}
                    onClick={handleSubmit}
                  >
                    Process ETF Contribution
                  </Button>
                </Space>
              </Card>

              <Card title="ETF Contribution Records">
                <Table
                  columns={etfColumns}
                  dataSource={etfData}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 700 }}
                />
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              {calculation && calculation.type === 'ETF' && (
                <Card
                  title={<><DollarOutlined /> ETF Breakdown</>}
                  style={{ position: 'sticky', top: 24 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    <div>
                      <div style={{ marginBottom: 8, color: '#666' }}>Employer Contribution (3%)</div>
                      <Progress
                        percent={3}
                        format={() => `${calculation.employerContribution.toLocaleString()}`}
                        strokeColor="#52c41a"
                      />
                    </div>
                    <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
                      <Statistic
                        title="Total ETF Contribution"
                        value={calculation.total}
                        prefix="$"
                        valueStyle={{ fontSize: 28, color: '#52c41a', fontWeight: 'bold' }}
                      />
                    </div>
                  </Space>
                </Card>
              )}
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default AccountantEPFETF;