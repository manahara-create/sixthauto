import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Alert,
  Tabs,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Divider,
  Timeline,
  Badge,
  message,
  Upload,
  Radio,
  Switch,
  Descriptions
} from 'antd';
import {
  DollarOutlined,
  PieChartOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalculatorOutlined,
  DownloadOutlined,
  HistoryOutlined,
  TeamOutlined,
  BankOutlined,
  PercentageOutlined,
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const AccountantDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for all features
  const [financialData, setFinancialData] = useState({});
  const [payrollData, setPayrollData] = useState([]);
  const [epfContributions, setEpfContributions] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [salaryCalculations, setSalaryCalculations] = useState([]);

  // Modal states
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [epfModalVisible, setEpfModalVisible] = useState(false);
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [processPaymentModalVisible, setProcessPaymentModalVisible] = useState(false);

  // Form states
  const [salaryForm] = Form.useForm();
  const [epfForm] = Form.useForm();
  const [bonusForm] = Form.useForm();
  const [reportForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

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
        fetchPendingPayments(),
        fetchRecentActivities(),
        fetchEmployees(),
        fetchSalaryCalculations()
      ]);
    } catch (error) {
      console.error('Error initializing accountant dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Data fetching functions
  const fetchFinancialData = async () => {
    try {
      // Total salary for current month
      const currentMonth = dayjs().format('YYYY-MM');
      const { data: salaryData } = await supabase
        .from('salary')
        .select('totalsalary, salarydate')
        .gte('salarydate', `${currentMonth}-01`)
        .lte('salarydate', `${currentMonth}-31`);

      // EPF contributions for current month
      const { data: epfData } = await supabase
        .from('epf_contributions')
        .select('totalcontribution')
        .gte('month', `${currentMonth}-01`)
        .lte('month', `${currentMonth}-31`)
        .eq('status', 'processed');

      // Recent financial reports
      const { data: revenueData } = await supabase
        .from('financialreports')
        .select('totalrevenue')
        .order('quarterenddate', { ascending: false })
        .limit(1);

      const totalSalary = salaryData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0;
      const totalEPF = epfData?.reduce((sum, item) => sum + (item.totalcontribution || 0), 0) || 0;

      setFinancialData({
        totalSalary,
        totalEPF,
        totalRevenue: revenueData?.[0]?.totalrevenue || 0,
        pendingCount: pendingPayments.length
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
          employee:empid (first_name, last_name, email),
          processed_by_employee:processed_by (first_name, last_name)
        `)
        .order('salarydate', { ascending: false })
        .limit(10);

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
          employee:empid (first_name, last_name),
          processed_by_employee:processed_by (first_name, last_name)
        `)
        .order('month', { ascending: false })
        .limit(10);

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
          employee:empid (first_name, last_name, department)
        `)
        .is('processed_by', null)
        .order('salarydate', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPendingPayments(data || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('accountant_operations')
        .select(`
          *,
          accountant:accountant_id (first_name, last_name)
        `)
        .order('operation_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, first_name, last_name, department, basicsalary')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSalaryCalculations = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (first_name, last_name),
          bonus:bonus_id (amount, type),
          ot:ot_id (amount, othours)
        `)
        .order('salarydate', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSalaryCalculations(data || []);
    } catch (error) {
      console.error('Error fetching salary calculations:', error);
    }
  };

  // Action handlers
  const handleProcessSalary = async (values) => {
    try {
      // Calculate total salary with components
      const basicSalary = values.basicSalary || 0;
      const otPay = values.otHours * values.otRate || 0;
      const bonusPay = values.bonusAmount || 0;
      const incrementPay = values.incrementAmount || 0;
      const noPayDeduction = values.noPayDays * (basicSalary / 30) || 0;
      
      const totalSalary = basicSalary + otPay + bonusPay + incrementPay - noPayDeduction;

      const { data, error } = await supabase
        .from('salary')
        .insert([{
          empid: values.employeeId,
          basicsalary: basicSalary,
          otpay: otPay,
          bonuspay: bonusPay,
          incrementpay: incrementPay,
          totalsalary: totalSalary,
          salarydate: values.salaryDate.format('YYYY-MM-DD'),
          processed_by: profile.empid,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Log the operation
      await logAccountantOperation('PROCESS_SALARY', data[0].salaryid, {
        employeeId: values.employeeId,
        totalSalary,
        components: { basicSalary, otPay, bonusPay, incrementPay, noPayDeduction }
      });

      message.success('Salary processed successfully!');
      setSalaryModalVisible(false);
      salaryForm.resetFields();
      fetchPayrollData();
      fetchFinancialData();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error processing salary:', error);
      message.error('Failed to process salary');
    }
  };

  const handleProcessEPF = async (values) => {
    try {
      const employeeContribution = values.basicSalary * 0.08; // 8%
      const employerContribution = values.basicSalary * 0.12; // 12%
      const totalContribution = employeeContribution + employerContribution;

      const { data, error } = await supabase
        .from('epf_contributions')
        .insert([{
          empid: values.employeeId,
          basicsalary: values.basicSalary,
          employeecontribution: employeeContribution,
          employercontribution: employerContribution,
          totalcontribution: totalContribution,
          month: values.contributionMonth.format('YYYY-MM-DD'),
          processed_by: profile.empid,
          status: 'processed',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Log the operation
      await logAccountantOperation('PROCESS_EPF', data[0].id, {
        employeeId: values.employeeId,
        totalContribution,
        employeeContribution,
        employerContribution
      });

      message.success('EPF contribution processed successfully!');
      setEpfModalVisible(false);
      epfForm.resetFields();
      fetchEPFData();
      fetchFinancialData();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error processing EPF:', error);
      message.error('Failed to process EPF contribution');
    }
  };

  const handleAddBonus = async (values) => {
    try {
      const { data, error } = await supabase
        .from('bonus')
        .insert([{
          empid: values.employeeId,
          amount: values.amount,
          type: values.bonusType,
          reason: values.reason,
          bonusdate: values.bonusDate.format('YYYY-MM-DD'),
          processedby: profile.empid,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await logAccountantOperation('ADD_BONUS', data[0].bonusid, {
        employeeId: values.employeeId,
        amount: values.amount,
        type: values.bonusType
      });

      message.success('Bonus added successfully!');
      setBonusModalVisible(false);
      bonusForm.resetFields();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error adding bonus:', error);
      message.error('Failed to add bonus');
    }
  };

  const handleProcessPayment = async (salaryId) => {
    try {
      const { error } = await supabase
        .from('salary')
        .update({
          processed_by: profile.empid,
          processed_at: new Date().toISOString()
        })
        .eq('salaryid', salaryId);

      if (error) throw error;

      await logAccountantOperation('PROCESS_PAYMENT', salaryId, {
        action: 'payment_processed'
      });

      message.success('Payment processed successfully!');
      fetchPendingPayments();
      fetchPayrollData();
      fetchFinancialData();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error('Failed to process payment');
    }
  };

  const logAccountantOperation = async (operation, recordId, details) => {
    try {
      await supabase
        .from('accountant_operations')
        .insert([{
          operation,
          record_id: recordId,
          accountant_id: profile.empid,
          details,
          operation_time: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging operation:', error);
    }
  };

  // Report Generation
  const generatePayrollReport = async () => {
    try {
      const { data: payrollData } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (first_name, last_name, department)
        `)
        .gte('salarydate', dayjs().startOf('month').format('YYYY-MM-DD'))
        .lte('salarydate', dayjs().endOf('month').format('YYYY-MM-DD'))
        .order('salarydate', { ascending: false });

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Monthly Payroll Report', 105, 15, { align: 'center' });
      
      // Date
      doc.setFontSize(12);
      doc.text(`Generated on: ${dayjs().format('MMMM D, YYYY')}`, 105, 25, { align: 'center' });
      doc.text(`Generated by: ${profile.first_name} ${profile.last_name}`, 105, 32, { align: 'center' });

      // Summary
      const totalSalary = payrollData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0;
      doc.setFontSize(14);
      doc.text(`Total Payroll: $${totalSalary.toLocaleString()}`, 14, 45);

      // Table
      const tableData = payrollData?.map(item => [
        `${item.employee?.first_name} ${item.employee?.last_name}`,
        item.employee?.department,
        `$${item.basicsalary?.toLocaleString()}`,
        `$${item.totalsalary?.toLocaleString()}`,
        dayjs(item.salarydate).format('MMM D, YYYY')
      ]) || [];

      doc.autoTable({
        startY: 50,
        head: [['Employee', 'Department', 'Basic Salary', 'Total Salary', 'Date']],
        body: tableData,
        theme: 'grid'
      });

      doc.save(`payroll-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      message.success('Payroll report generated successfully!');
    } catch (error) {
      console.error('Error generating payroll report:', error);
      message.error('Failed to generate report');
    }
  };

  const generateEPFReport = async () => {
    try {
      const { data: epfData } = await supabase
        .from('epf_contributions')
        .select(`
          *,
          employee:empid (first_name, last_name)
        `)
        .gte('month', dayjs().startOf('month').format('YYYY-MM-DD'))
        .lte('month', dayjs().endOf('month').format('YYYY-MM-DD'))
        .order('month', { ascending: false });

      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('EPF Contributions Report', 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Generated on: ${dayjs().format('MMMM D, YYYY')}`, 105, 25, { align: 'center' });

      const totalEPF = epfData?.reduce((sum, item) => sum + (item.totalcontribution || 0), 0) || 0;
      doc.setFontSize(14);
      doc.text(`Total EPF Contributions: $${totalEPF.toLocaleString()}`, 14, 40);

      const tableData = epfData?.map(item => [
        `${item.employee?.first_name} ${item.employee?.last_name}`,
        `$${item.basicsalary?.toLocaleString()}`,
        `$${item.employeecontribution?.toLocaleString()}`,
        `$${item.employercontribution?.toLocaleString()}`,
        `$${item.totalcontribution?.toLocaleString()}`,
        dayjs(item.month).format('MMM YYYY')
      ]) || [];

      doc.autoTable({
        startY: 45,
        head: [['Employee', 'Basic Salary', 'Employee EPF', 'Employer EPF', 'Total', 'Month']],
        body: tableData,
        theme: 'grid'
      });

      doc.save(`epf-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      message.success('EPF report generated successfully!');
    } catch (error) {
      console.error('Error generating EPF report:', error);
      message.error('Failed to generate report');
    }
  };

  // Chart data simulation (you can replace with real chart libraries)
  const getChartData = () => {
    return {
      payrollTrend: [65000, 72000, 68000, 75000, 80000, 78000],
      epfContributions: [12000, 13500, 12800, 14200, 15000, 14500],
      departmentCosts: [
        { department: 'IT', cost: 25000 },
        { department: 'HR', cost: 18000 },
        { department: 'Finance', cost: 22000 },
        { department: 'Operations', cost: 30000 }
      ]
    };
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
      title: 'Processed By',
      dataIndex: ['processed_by_employee', 'first_name'],
      key: 'processed_by',
      render: (text, record) => 
        record.processed_by_employee ? 
          `${record.processed_by_employee.first_name} ${record.processed_by_employee.last_name}` : 
          'Pending'
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

  const pendingPaymentsColumns = [
    ...payrollColumns.slice(0, 4),
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => handleProcessPayment(record.salaryid)}
        >
          Process Payment
        </Button>
      )
    }
  ];

  if (!profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert message="Please log in to access the dashboard" type="warning" />
      </div>
    );
  }

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

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          <OverviewTab 
            financialData={financialData}
            pendingPayments={pendingPayments}
            recentActivities={recentActivities}
            profile={profile}
            onProcessSalary={() => setSalaryModalVisible(true)}
            onGeneratePayrollReport={generatePayrollReport}
            onGenerateEPFReport={generateEPFReport}
          />
        </TabPane>
        
        <TabPane tab="Payroll Management" key="payroll">
          <PayrollTab 
            payrollData={payrollData}
            pendingPayments={pendingPayments}
            pendingPaymentsColumns={pendingPaymentsColumns}
            onProcessSalary={() => setSalaryModalVisible(true)}
            onProcessPayment={handleProcessPayment}
          />
        </TabPane>
        
        <TabPane tab="EPF/ETF" key="epf">
          <EPFTab 
            epfContributions={epfContributions}
            onProcessEPF={() => setEpfModalVisible(true)}
            onGenerateEPFReport={generateEPFReport}
          />
        </TabPane>
        
        <TabPane tab="Salary Calculator" key="calculator">
          <CalculatorTab 
            employees={employees}
            onProcessSalary={() => setSalaryModalVisible(true)}
            salaryCalculations={salaryCalculations}
          />
        </TabPane>
        
        <TabPane tab="Reports" key="reports">
          <ReportsTab 
            onGeneratePayrollReport={generatePayrollReport}
            onGenerateEPFReport={generateEPFReport}
            financialData={financialData}
          />
        </TabPane>
        
        <TabPane tab="Recent Activities" key="activities">
          <ActivitiesTab recentActivities={recentActivities} />
        </TabPane>
      </Tabs>

      {/* Salary Processing Modal */}
      <Modal
        title="Process Salary"
        open={salaryModalVisible}
        onCancel={() => setSalaryModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={salaryForm} layout="vertical" onFinish={handleProcessSalary}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
                <Select placeholder="Select employee">
                  {employees.map(emp => (
                    <Option key={emp.empid} value={emp.empid}>
                      {emp.first_name} {emp.last_name} - {emp.department}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryDate" label="Salary Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Salary Components</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true }]}>
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="otHours" label="OT Hours">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="otRate" label="OT Rate per Hour">
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bonusAmount" label="Bonus Amount">
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="incrementAmount" label="Increment Amount">
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="noPayDays" label="No Pay Days">
                <InputNumber style={{ width: '100%' }} min={0} max={31} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Process Salary
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* EPF Processing Modal */}
      <Modal
        title="Process EPF Contribution"
        open={epfModalVisible}
        onCancel={() => setEpfModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={epfForm} layout="vertical" onFinish={handleProcessEPF}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
                <Select placeholder="Select employee">
                  {employees.map(emp => (
                    <Option key={emp.empid} value={emp.empid}>
                      {emp.first_name} {emp.last_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contributionMonth" label="Contribution Month" rules={[{ required: true }]}>
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Alert
            message="EPF Calculation"
            description="Employee: 8% | Employer: 12% | Total: 20% of basic salary"
            type="info"
            style={{ marginBottom: 16 }}
          />

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Process EPF Contribution
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bonus Modal */}
      <Modal
        title="Add Bonus"
        open={bonusModalVisible}
        onCancel={() => setBonusModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={bonusForm} layout="vertical" onFinish={handleAddBonus}>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee">
              {employees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="bonusType" label="Bonus Type" rules={[{ required: true }]}>
            <Select placeholder="Select bonus type">
              <Option value="performance">Performance Bonus</Option>
              <Option value="annual">Annual Bonus</Option>
              <Option value="special">Special Bonus</Option>
              <Option value="festival">Festival Bonus</Option>
            </Select>
          </Form.Item>

          <Form.Item name="amount" label="Bonus Amount" rules={[{ required: true }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="bonusDate" label="Bonus Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="reason" label="Reason">
            <TextArea rows={3} placeholder="Enter reason for bonus" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Bonus
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ financialData, pendingPayments, recentActivities, profile, onProcessSalary, onGeneratePayrollReport, onGenerateEPFReport }) => {
  const chartData = {
    payrollTrend: [65000, 72000, 68000, 75000, 80000, 78000],
    epfContributions: [12000, 13500, 12800, 14200, 15000, 14500]
  };

  return (
    <div>
      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Salary (Monthly)"
              value={financialData.totalSalary}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={value => `$${Number(value).toLocaleString()}`}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Current month</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="EPF Contributions"
              value={financialData.totalEPF}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={value => `$${Number(value).toLocaleString()}`}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">20% of basic salary</Text>
            </div>
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
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Awaiting processing</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={financialData.totalRevenue}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#f5222d' }}
              formatter={value => `$${Number(value).toLocaleString()}`}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Last quarter</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Quick Actions" size="small">
            <Space wrap>
              <Button type="primary" icon={<CalculatorOutlined />} onClick={onProcessSalary}>
                Process Salary
              </Button>
              <Button icon={<BankOutlined />} onClick={() => {}}>
                Process EPF
              </Button>
              <Button icon={<DownloadOutlined />} onClick={onGeneratePayrollReport}>
                Payroll Report
              </Button>
              <Button icon={<FileTextOutlined />} onClick={onGenerateEPFReport}>
                EPF Report
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => {}}>
                Add Bonus
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activities" size="small">
            <Timeline>
              {recentActivities.slice(0, 5).map((activity, index) => (
                <Timeline.Item
                  key={index}
                  dot={<SyncOutlined style={{ fontSize: '16px' }} />}
                  color="blue"
                >
                  <Space direction="vertical" size={0}>
                    <Text strong>{activity.operation.replace('_', ' ')}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      By {activity.accountant?.first_name} {activity.accountant?.last_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
                    </Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Pending Payments */}
        <Col xs={24} lg={12}>
          <Card title="Pending Payments" size="small" extra={<Button type="link">View All</Button>}>
            <List
              dataSource={pendingPayments.slice(0, 5)}
              renderItem={payment => (
                <List.Item>
                  <List.Item.Meta
                    title={`${payment.employee?.first_name} ${payment.employee?.last_name}`}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text>Amount: ${payment.totalsalary?.toLocaleString()}</Text>
                        <Text>Date: {dayjs(payment.salarydate).format('MMM D, YYYY')}</Text>
                      </Space>
                    }
                  />
                  <Tag color="orange">Pending</Tag>
                </List.Item>
              )}
              locale={{ emptyText: 'No pending payments' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Financial Charts Placeholder */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Payroll Trend (Last 6 Months)" size="small">
            <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px' }}>
              {chartData.payrollTrend.map((value, index) => (
                <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                  <div
                    style={{
                      height: `${(value / 100000) * 150}px`,
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ${(value / 1000).toFixed(0)}k
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="EPF Contributions (Last 6 Months)" size="small">
            <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px' }}>
              {chartData.epfContributions.map((value, index) => (
                <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                  <div
                    style={{
                      height: `${(value / 20000) * 150}px`,
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ${(value / 1000).toFixed(0)}k
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const PayrollTab = ({ payrollData, pendingPayments, pendingPaymentsColumns, onProcessSalary, onProcessPayment }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Payroll Management" 
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onProcessSalary}>
              Process Salary
            </Button>
          }
        >
          <Alert
            message="Payroll Processing"
            description="Process salaries for employees, including OT, bonuses, increments, and deductions."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Pending Payments">
          <Table
            dataSource={pendingPayments}
            columns={pendingPaymentsColumns}
            pagination={{ pageSize: 10 }}
            rowKey="salaryid"
          />
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col span={24}>
        <Card title="Recent Payroll History">
          <Table
            dataSource={payrollData}
            columns={[
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
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="salaryid"
          />
        </Card>
      </Col>
    </Row>
  </div>
);

const EPFTab = ({ epfContributions, onProcessEPF, onGenerateEPFReport }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="EPF/ETF Management" 
          extra={
            <Space>
              <Button onClick={onGenerateEPFReport} icon={<DownloadOutlined />}>
                Generate Report
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={onProcessEPF}>
                Process EPF
              </Button>
            </Space>
          }
        >
          <Alert
            message="EPF/ETF Contributions"
            description="Employee Provident Fund (8%) and Employer Trust Fund (12%) contributions calculation and processing."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Card title="Recent EPF Contributions">
      <Table
        dataSource={epfContributions}
        columns={[
          {
            title: 'Employee',
            dataIndex: ['employee', 'first_name'],
            key: 'employee',
            render: (text, record) => 
              `${record.employee?.first_name} ${record.employee?.last_name}`
          },
          {
            title: 'Month',
            dataIndex: 'month',
            key: 'month',
            render: (date) => dayjs(date).format('MMMM YYYY')
          },
          {
            title: 'Basic Salary',
            dataIndex: 'basicsalary',
            key: 'basicsalary',
            render: (amount) => `$${amount?.toLocaleString()}`
          },
          {
            title: 'Employee EPF (8%)',
            dataIndex: 'employeecontribution',
            key: 'employeecontribution',
            render: (amount) => `$${amount?.toLocaleString()}`
          },
          {
            title: 'Employer EPF (12%)',
            dataIndex: 'employercontribution',
            key: 'employercontribution',
            render: (amount) => `$${amount?.toLocaleString()}`
          },
          {
            title: 'Total Contribution',
            dataIndex: 'totalcontribution',
            key: 'totalcontribution',
            render: (amount) => `$${amount?.toLocaleString()}`
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
              <Tag color={status === 'processed' ? 'green' : 'orange'}>
                {status}
              </Tag>
            )
          }
        ]}
        pagination={{ pageSize: 10 }}
        rowKey="id"
      />
    </Card>
  </div>
);

const CalculatorTab = ({ employees, onProcessSalary, salaryCalculations }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Salary Calculator" 
          extra={
            <Button type="primary" icon={<CalculatorOutlined />} onClick={onProcessSalary}>
              Calculate Salary
            </Button>
          }
        >
          <Alert
            message="Salary Calculation"
            description="Calculate employee salaries with OT, bonuses, increments, and no-pay deductions."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Recent Calculations">
          <Table
            dataSource={salaryCalculations}
            columns={[
              {
                title: 'Employee',
                dataIndex: ['employee', 'first_name'],
                key: 'employee',
                render: (text, record) => 
                  `${record.employee?.first_name} ${record.employee?.last_name}`
              },
              {
                title: 'Basic Salary',
                dataIndex: 'basicsalary',
                key: 'basicsalary',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'OT Pay',
                dataIndex: 'otpay',
                key: 'otpay',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Bonus Pay',
                dataIndex: 'bonuspay',
                key: 'bonuspay',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Total Salary',
                dataIndex: 'totalsalary',
                key: 'totalsalary',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Date',
                dataIndex: 'salarydate',
                key: 'salarydate',
                render: (date) => dayjs(date).format('MMM D, YYYY')
              }
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="salaryid"
          />
        </Card>
      </Col>
    </Row>
  </div>
);

const ReportsTab = ({ onGeneratePayrollReport, onGenerateEPFReport, financialData }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="Financial Reports">
          <Alert
            message="Report Generation"
            description="Generate and download various financial reports in PDF format."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card 
                size="small" 
                hoverable
                actions={[
                  <Button type="link" icon={<DownloadOutlined />} onClick={onGeneratePayrollReport}>
                    Generate
                  </Button>
                ]}
              >
                <Card.Meta
                  title="Payroll Report"
                  description="Monthly payroll summary with employee details and totals"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                size="small" 
                hoverable
                actions={[
                  <Button type="link" icon={<DownloadOutlined />} onClick={onGenerateEPFReport}>
                    Generate
                  </Button>
                ]}
              >
                <Card.Meta
                  title="EPF Report"
                  description="Employee Provident Fund contributions report"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                size="small" 
                hoverable
                actions={[
                  <Button type="link" icon={<DownloadOutlined />}>
                    Generate
                  </Button>
                ]}
              >
                <Card.Meta
                  title="Financial Summary"
                  description="Quarterly financial performance and metrics"
                />
              </Card>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Report Templates">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Payroll Report">
              Includes employee details, salary components, totals, and processing date
            </Descriptions.Item>
            <Descriptions.Item label="EPF Report">
              Contains EPF contributions breakdown by employee and month
            </Descriptions.Item>
            <Descriptions.Item label="Tax Report">
              Tax deductions and liabilities summary
            </Descriptions.Item>
            <Descriptions.Item label="Financial Summary">
              Revenue, expenses, profit/loss, and balance sheet overview
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    </Row>
  </div>
);

const ActivitiesTab = ({ recentActivities }) => (
  <div>
    <Card title="Accountant Activities Log">
      <Timeline>
        {recentActivities.map((activity, index) => (
          <Timeline.Item
            key={index}
            dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
            color="green"
          >
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Col>
                    <Text strong>{activity.operation.replace(/_/g, ' ')}</Text>
                  </Col>
                  <Col>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
                    </Text>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Text type="secondary">
                      By: {activity.accountant?.first_name} {activity.accountant?.last_name}
                    </Text>
                  </Col>
                </Row>
                {activity.details && (
                  <Row>
                    <Col>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Details: {JSON.stringify(activity.details)}
                      </Text>
                    </Col>
                  </Row>
                )}
              </Space>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  </div>
);

export default AccountantDashboard;