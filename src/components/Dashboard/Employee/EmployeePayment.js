import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Typography, Tag, Button, Space,
  Statistic, Modal, Form, Select, InputNumber, Input,
  message
} from 'antd';
import {
  DollarOutlined, PlusOutlined, DownloadOutlined,
  FileTextOutlined, BankOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EmployeePayments = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [salaryData, setSalaryData] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [epfEtfRequests, setEpfEtfRequests] = useState([]);
  const [isLoanModalVisible, setIsLoanModalVisible] = useState(false);
  const [isEpfModalVisible, setIsEpfModalVisible] = useState(false);
  
  const [loanForm] = Form.useForm();
  const [epfForm] = Form.useForm();

  useEffect(() => {
    fetchSalaryData();
    fetchLoanRequests();
    fetchEpfEtfRequests();
  }, []);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salary')
        .select('*')
        .eq('empid', profile.empid)
        .order('salarydate', { ascending: false });

      if (error) throw error;
      setSalaryData(data || []);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      message.error('Failed to fetch salary data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('loanrequest')
        .select('*')
        .eq('empid', profile.empid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoanRequests(data || []);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
      setLoanRequests([]);
    }
  };

  const fetchEpfEtfRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('epfnetf')
        .select('*')
        .eq('empid', profile.empid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEpfEtfRequests(data || []);
    } catch (error) {
      console.error('Error fetching EPF/ETF requests:', error);
      setEpfEtfRequests([]);
    }
  };

  const handleApplyLoan = async (values) => {
    try {
      const amount = parseFloat(values.amount) || 0;
      const duration = parseInt(values.duration) || 0;

      if (amount <= 0) {
        message.error('Loan amount must be greater than 0');
        return;
      }

      if (duration <= 0) {
        message.error('Duration must be greater than 0');
        return;
      }

      const loanData = {
        empid: profile.empid,
        loantype: values.loanType,
        amount: Math.round(amount),
        duration: duration,
        status: 'pending',
        date: dayjs().format('YYYY-MM-DD')
      };

      const { error } = await supabase
        .from('loanrequest')
        .insert([loanData]);

      if (error) throw error;

      message.success('Loan application submitted successfully!');
      setIsLoanModalVisible(false);
      loanForm.resetFields();
      fetchLoanRequests();
    } catch (error) {
      console.error('Error applying for loan:', error);
      message.error('Failed to apply for loan');
    }
  };

  const handleApplyEpfEtf = async (values) => {
    try {
      const epfData = {
        empid: profile.empid,
        basicsalary: values.basicSalary,
        applieddate: dayjs().format('YYYY-MM-DD'),
        status: 'pending'
      };

      const { error } = await supabase
        .from('epfnetf')
        .insert([epfData]);

      if (error) throw error;

      message.success('EPF/ETF application submitted successfully!');
      setIsEpfModalVisible(false);
      epfForm.resetFields();
      fetchEpfEtfRequests();
    } catch (error) {
      console.error('Error applying for EPF/ETF:', error);
      message.error('Failed to apply for EPF/ETF');
    }
  };

  const exportToExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'approved': 'green',
      'pending': 'orange',
      'rejected': 'red',
      'completed': 'blue'
    };
    return statusColors[status?.toLowerCase()] || 'default';
  };

  const salaryColumns = [
    {
      title: 'Salary Date',
      dataIndex: 'salarydate',
      key: 'salarydate',
      render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (salary) => `LKR ${salary?.toLocaleString()}`
    },
    {
      title: 'OT Pay',
      dataIndex: 'otpay',
      key: 'otpay',
      render: (pay) => `LKR ${pay?.toLocaleString() || '0'}`
    },
    {
      title: 'Bonus Pay',
      dataIndex: 'bonuspay',
      key: 'bonuspay',
      render: (pay) => `LKR ${pay?.toLocaleString() || '0'}`
    },
    {
      title: 'Total Salary',
      dataIndex: 'totalsalary',
      key: 'totalsalary',
      render: (salary) => <Text strong>LKR {salary?.toLocaleString()}</Text>
    }
  ];

  const loanColumns = [
    {
      title: 'Loan Type',
      dataIndex: 'loantype',
      key: 'loantype',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `LKR ${amount?.toLocaleString()}`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} months`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Applied Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card>
        <Title level={2}>Payments & Benefits</Title>
        
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsLoanModalVisible(true)}
            >
              Apply for Loan
            </Button>
          </Col>
          <Col>
            <Button
              icon={<BankOutlined />}
              onClick={() => setIsEpfModalVisible(true)}
            >
              Apply for EPF/ETF
            </Button>
          </Col>
          <Col>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportToExcel([...salaryData, ...loanRequests, ...epfEtfRequests], 'payments_data')}
            >
              Export All Data
            </Button>
          </Col>
        </Row>

        {/* Salary History */}
        <Card title="Salary History" style={{ marginBottom: 24 }}>
          <Table
            columns={salaryColumns}
            dataSource={salaryData}
            rowKey="salaryid"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Loan Requests */}
        <Card title="My Loan Requests" style={{ marginBottom: 24 }}>
          <Table
            columns={loanColumns}
            dataSource={loanRequests}
            rowKey="loanrequestid"
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: 'No loan applications yet' }}
          />
        </Card>

        {/* EPF/ETF Applications */}
        <Card title="EPF/ETF Applications">
          <Table
            dataSource={epfEtfRequests}
            columns={[
              {
                title: 'Basic Salary',
                dataIndex: 'basicsalary',
                key: 'basicsalary',
                render: (salary) => `LKR ${salary?.toLocaleString()}`
              },
              {
                title: 'Employee EPF (8%)',
                key: 'employee_epf',
                render: (_, record) => `LKR ${(record.basicsalary * 0.08)?.toFixed(2)}`
              },
              {
                title: 'Employer EPF (12%)',
                key: 'employer_epf',
                render: (_, record) => `LKR ${(record.basicsalary * 0.12)?.toFixed(2)}`
              },
              {
                title: 'Total Contribution (20%)',
                key: 'total_contribution',
                render: (_, record) => `LKR ${(record.basicsalary * 0.20)?.toFixed(2)}`
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
              }
            ]}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: 'No EPF/ETF applications yet' }}
          />
        </Card>
      </Card>

      {/* Loan Application Modal */}
      <Modal
        title="Apply for Loan"
        open={isLoanModalVisible}
        onCancel={() => setIsLoanModalVisible(false)}
        footer={null}
      >
        <Form form={loanForm} layout="vertical" onFinish={handleApplyLoan}>
          <Form.Item name="loanType" label="Loan Type" rules={[{ required: true }]}>
            <Select placeholder="Select loan type">
              <Option value="Personal">Personal Loan</Option>
              <Option value="Housing">Housing Loan</Option>
              <Option value="Vehicle">Vehicle Loan</Option>
              <Option value="Education">Education Loan</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Loan Amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
              min={1000}
            />
          </Form.Item>
          <Form.Item name="duration" label="Duration (months)" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={60}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Application
              </Button>
              <Button onClick={() => setIsLoanModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* EPF/ETF Application Modal */}
      <Modal
        title="Apply for EPF/ETF"
        open={isEpfModalVisible}
        onCancel={() => setIsEpfModalVisible(false)}
        footer={null}
      >
        <Form form={epfForm} layout="vertical" onFinish={handleApplyEpfEtf}>
          <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>
          <Alert
            message="EPF/ETF Calculation"
            description={
              <div>
                <div>Employee EPF Contribution: 8% of basic salary</div>
                <div>Employer EPF Contribution: 12% of basic salary</div>
                <div>Employer ETF Contribution: 3% of basic salary</div>
                <div><strong>Total Contribution: 23% of basic salary</strong></div>
              </div>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Application
              </Button>
              <Button onClick={() => setIsEpfModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeePayments;