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
  Avatar,
  Progress,
  Badge,
  Alert,
  Table,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Upload,
  Divider,
  Tooltip,
  Popconfirm,
  Steps,
  Descriptions,
  Timeline
} from 'antd';
import {
  RocketOutlined,
  TeamOutlined,
  PieChartOutlined,
  StarOutlined,
  TrophyOutlined,
  DollarOutlined,
  LineChartOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  MessageOutlined,
  UserAddOutlined,
  CalendarOutlined,
  BarChartOutlined,
  FundOutlined,
  SettingOutlined,
  AuditOutlined,
  BankOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import { Pie, Bar, Line } from '@ant-design/plots';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const CEODashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [companyMetrics, setCompanyMetrics] = useState({});
  const [strategicGoals, setStrategicGoals] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [financialOverview, setFinancialOverview] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [reports, setReports] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false);
  const [isPromotionModalVisible, setIsPromotionModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [reportData, setReportData] = useState({});
  const [taskForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [reportForm] = Form.useForm();
  const [meetingForm] = Form.useForm();
  const [promotionForm] = Form.useForm();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCompanyMetrics(),
        fetchStrategicGoals(),
        fetchDepartmentPerformance(),
        fetchFinancialOverview(),
        fetchPendingApprovals(),
        fetchAllEmployees(),
        fetchRecentReports(),
        fetchUpcomingMeetings()
      ]);
    } catch (error) {
      console.error('Error initializing CEO dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyMetrics = async () => {
    try {
      const { data: employees } = await supabase
        .from('employee')
        .select('empid, is_active')
        .eq('is_active', true);

      const { data: revenue } = await supabase
        .from('financialreports')
        .select('totalrevenue')
        .order('quarterenddate', { ascending: false })
        .limit(1);

      setCompanyMetrics({
        totalEmployees: employees?.length || 0,
        companyRevenue: revenue?.[0]?.totalrevenue || 1250000,
        profitMargin: 28.5,
        customerSatisfaction: 4.7
      });
    } catch (error) {
      console.error('Error fetching company metrics:', error);
    }
  };

  const fetchStrategicGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('strategic_goals')
        .select('*')
        .eq('year', dayjs().year())
        .order('quarter', { ascending: true });

      if (error) throw error;
      setStrategicGoals(data || []);
    } catch (error) {
      console.error('Error fetching strategic goals:', error);
      const mockGoals = [
        {
          goal_id: 1,
          goal_name: 'Revenue Growth',
          description: 'Achieve 20% revenue growth YoY',
          current_value: 15,
          target_value: 20,
          achieved: false,
          quarter: 1,
          year: 2024
        },
        {
          goal_id: 2,
          goal_name: 'Market Expansion',
          description: 'Expand to 2 new international markets',
          current_value: 1,
          target_value: 2,
          achieved: false,
          quarter: 2,
          year: 2024
        }
      ];
      setStrategicGoals(mockGoals);
    }
  };

  const fetchDepartmentPerformance = async () => {
    try {
      const performance = [
        { department: 'Sales', performance: 92, growth: 15, revenue: 450000 },
        { department: 'Marketing', performance: 88, growth: 12, revenue: 150000 },
        { department: 'Development', performance: 95, growth: 20, revenue: 300000 },
        { department: 'HR', performance: 85, growth: 8, revenue: 50000 },
        { department: 'Finance', performance: 90, growth: 10, revenue: 75000 }
      ];
      setDepartmentPerformance(performance);
    } catch (error) {
      console.error('Error fetching department performance:', error);
    }
  };

  const fetchFinancialOverview = async () => {
    try {
      setFinancialOverview({
        marketShare: 18.5,
        employeeRetention: 94,
        revenueGrowth: 22.3,
        operatingMargin: 28.5
      });
    } catch (error) {
      console.error('Error fetching financial overview:', error);
    }
  };



  const fetchPendingApprovals = async () => {
    try {
      const { data: leaveRequests, error: leaveError } = await supabase
        .from('employeeleave')
        .select(`
          *,
          employee:empid (first_name, last_name, role),
          leavetype:leavetypeid (leavetype)
        `)
        .eq('leavestatus', 'pending')
        .order('created_at', { ascending: false });

      const { data: loanRequests, error: loanError } = await supabase
        .from('loanrequest')
        .select(`
          *,
          employee:empid (first_name, last_name, role),
          loantype:loantypeid (loantype)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (leaveError) throw leaveError;
      if (loanError) throw loanError;

      const approvals = [
        ...(leaveRequests || []).map(req => ({
          ...req,
          type: 'leave',
          title: `Leave Request - ${req.employee.first_name} ${req.employee.last_name}`,
          description: `${req.leavetype?.leavetype} - ${req.duration} days`
        })),
        ...(loanRequests || []).map(req => ({
          ...req,
          type: 'loan',
          title: `Loan Request - ${req.employee.first_name} ${req.employee.last_name}`,
          description: `$${req.amount} - ${req.loantype?.loantype}`
        }))
      ];

      setPendingApprovals(approvals);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setAllEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchUpcomingMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting')
        .select('*')
        .gte('date', dayjs().format('YYYY-MM-DD'))
        .order('date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  // Approval Functions
  const handleApproval = async (type, id, status, remarks = '') => {
    try {
      if (type === 'leave') {
        const { error } = await supabase
          .from('employeeleave')
          .update({
            leavestatus: status,
            approvedby: profile.empid
          })
          .eq('leaveid', id);

        if (error) throw error;
      } else if (type === 'loan') {
        const { error } = await supabase
          .from('loanrequest')
          .update({
            status: status,
            processedby: profile.empid,
            processedat: dayjs().format('YYYY-MM-DD HH:mm:ss')
          })
          .eq('loanrequestid', id);

        if (error) throw error;
      }

      // Log the operation
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: profile.empid,
          action: `${type}_approval`,
          table_name: type === 'leave' ? 'employeeleave' : 'loanrequest',
          record_id: id,
          new_values: { status, approved_by: profile.empid, remarks }
        }]);

      message.success(`Request ${status} successfully!`);
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error('Failed to process request');
    }
  };

  // Task Management Functions
  const assignTask = async (values) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...values,
          assignee_id: values.assignee_id,
          created_by: profile.empid,
          due_date: values.due_date.format('YYYY-MM-DD'),
          status: 'pending'
        }]);

      if (error) throw error;
      message.success('Task assigned successfully!');
      setIsTaskModalVisible(false);
      taskForm.resetFields();
    } catch (error) {
      console.error('Error assigning task:', error);
      message.error('Failed to assign task');
    }
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
            date: dayjs().format('YYYY-MM-DD')
          }
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

  // Meeting Management
  const scheduleMeeting = async (values) => {
    try {
      const { data, error } = await supabase
        .from('meeting')
        .insert([{
          ...values,
          date: values.date.format('YYYY-MM-DD HH:mm:ss'),
          empid: profile.empid,
          status: 'scheduled'
        }]);

      if (error) throw error;
      message.success('Meeting scheduled successfully!');
      setIsMeetingModalVisible(false);
      meetingForm.resetFields();
      fetchUpcomingMeetings();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      message.error('Failed to schedule meeting');
    }
  };

  // Promotion Management
  const promoteEmployee = async (values) => {
    try {
      const { data: promotion, error: promotionError } = await supabase
        .from('promotion')
        .insert([{
          empid: values.employee_id,
          oldposition: values.current_position,
          newposition: values.new_position,
          promotiondate: dayjs().format('YYYY-MM-DD'),
          salaryincrease: values.salary_increase,
          department: values.department
        }])
        .select();

      if (promotionError) throw promotionError;

      // Update employee record
      const { error: employeeError } = await supabase
        .from('employee')
        .update({
          role: values.new_position,
          department: values.department
        })
        .eq('empid', values.employee_id);

      if (employeeError) throw employeeError;

      // Log promotion history
      await supabase
        .from('promotion_history')
        .insert([{
          empid: values.employee_id,
          previousrole: values.current_position,
          newrole: values.new_position,
          promotedby: profile.empid
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



  // Report Generation Functions (Similar to Manager Dashboard but for all employees)
  const generateReport = async (values) => {
    try {
      const reportConfig = {
        type: values.report_type,
        period: values.period,
        employee_id: values.employee_id,
        format: values.format,
        ...values
      };

      let reportData = {};

      switch (values.report_type) {
        case 'salary':
          reportData = await generateSalaryReport(reportConfig);
          break;
        case 'attendance':
          reportData = await generateAttendanceReport(reportConfig);
          break;
        case 'leave':
          reportData = await generateLeaveReport(reportConfig);
          break;
        case 'kpi':
          reportData = await generateKPIReport(reportConfig);
          break;
        case 'ot':
          reportData = await generateOTReport(reportConfig);
          break;
        case 'increment':
          reportData = await generateIncrementReport(reportConfig);
          break;
        case 'nopay':
          reportData = await generateNoPayReport(reportConfig);
          break;
        case 'loan':
          reportData = await generateLoanReport(reportConfig);
          break;
        case 'staff':
          reportData = await generateStaffReport(reportConfig);
          break;
        case 'financial':
          reportData = await generateFinancialReport(reportConfig);
          break;
        case 'performance':
          reportData = await generatePerformanceReport(reportConfig);
          break;
        default:
          throw new Error('Unknown report type');
      }

      const { data: report, error } = await supabase
        .from('reports')
        .insert([{
          name: `${values.report_type}_report_${dayjs().format('YYYYMMDD_HHmmss')}`,
          type: values.report_type,
          format: values.format,
          status: 'completed',
          created_by: profile.empid,
          config: reportConfig
        }])
        .select();

      if (error) throw error;

      setReportData(reportData);
      message.success('Report generated successfully!');
      fetchRecentReports();
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    }
  };



  const generateFinancialReport = async (config) => {
    const { data } = await supabase
      .from('financialreports')
      .select('*')
      .order('quarterenddate', { ascending: false })
      .limit(4);

    const chartData = data?.map(item => ({
      type: dayjs(item.quarterenddate).format('MMM YYYY'),
      value: item.totalrevenue
    })) || [];

    return { rawData: data, chartData, type: 'financial' };
  };

  const generateSalaryReport = async (config) => {
    let query = supabase
      .from('salary')
      .select(`
      *,
      employee:empid (first_name, last_name, department)
    `)
      .gte('salarydate', dayjs().startOf(config.period).format('YYYY-MM-DD'))
      .lte('salarydate', dayjs().endOf(config.period).format('YYYY-MM-DD'));

    // Only filter by employee_id if provided
    if (config.employee_id) {
      query = query.eq('empid', config.employee_id);
    } else {
      // If no specific employee, get all active employees
      const employeeIds = allEmployees.map(e => e.empid);
      if (employeeIds.length > 0) {
        query = query.in('empid', employeeIds);
      }
    }

    const { data } = await query;

    const pieData = data?.map(item => ({
      type: `${item.employee?.first_name} ${item.employee?.last_name}`,
      value: item.totalsalary
    })) || [];

    return { rawData: data, chartData: pieData, type: 'salary' };
  };

  const generatePerformanceReport = async (config) => {
    const { data } = await supabase
      .from('employee')
      .select('empid, first_name, last_name, department, kpiscore, satisfaction_score')
      .eq('is_active', true);

    const chartData = data?.map(item => ({
      type: `${item.first_name} ${item.last_name}`,
      value: item.kpiscore || 0
    })) || [];

    return { rawData: data, chartData, type: 'performance' };
  };

  // Other report functions similar to Manager Dashboard but for all employees
  const generateAttendanceReport = async (config) => {
    const { data } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:empid (first_name, last_name, department)
      `)
      .eq('empid', config.employee_id || allEmployees.map(e => e.empid))
      .gte('date', dayjs().startOf(config.period).format('YYYY-MM-DD'))
      .lte('date', dayjs().endOf(config.period).format('YYYY-MM-DD'));

    const statusCount = data?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const pieData = Object.entries(statusCount).map(([status, count]) => ({
      type: status,
      value: count
    }));

    return { rawData: data, chartData: pieData, type: 'attendance' };
  };

  const renderPieChart = (data) => {
    if (!data.chartData || data.chartData.length === 0) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>No data available</div>;
    }

    const config = {
      data: data.chartData,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      label: {
        type: 'outer',
        content: '{name} {percentage}',
      },
      interactions: [{ type: 'element-active' }],
    };
    return <Pie {...config} />;
  };

  const approvalColumns = [
    {
      title: 'Request',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary">{record.description}</Text>
        </div>
      )
    },
    {
      title: 'Employee',
      dataIndex: ['employee', 'first_name'],
      key: 'employee',
      render: (text, record) =>
        `${record.employee?.first_name} ${record.employee?.last_name}`
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'leave' ? 'blue' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApproval(record.type, record.leaveid || record.loanrequestid, 'approved')}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleApproval(record.type, record.leaveid || record.loanrequestid, 'rejected')}
          >
            Reject
          </Button>
        </Space>
      )
    }
  ];

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Performance',
      dataIndex: 'performance',
      key: 'performance',
      render: (value) => (
        <Progress percent={value} status="active" style={{ width: 100 }} />
      )
    },
    {
      title: 'Growth',
      dataIndex: 'growth',
      key: 'growth',
      render: (value) => (
        <Space>
          <Text>{value}%</Text>
          <ArrowUpOutlined style={{ color: '#52c41a' }} />
        </Space>
      )
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value) => `$${value.toLocaleString()}`
    }
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Card size="small" style={{
        marginBottom: 16,
        background: 'linear-gradient(135deg, #fa541c 0%, #d4380d 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <CrownOutlined style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                CEO Dashboard
              </Title>
              <Badge count={<CrownOutlined />} offset={[-5, 0]}>
                <Tag color="white" style={{ color: '#fa541c', fontWeight: 'bold' }}>
                  {profile?.first_name} {profile?.last_name}
                </Tag>
              </Badge>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'white' }}>
              Executive Overview • {dayjs().format('MMMM YYYY')}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Welcome Alert */}
      <Alert
        message={`Welcome back, ${profile?.first_name || 'CEO'}!`}
        description="Monitor company performance, strategic goals, department metrics, and overall business health."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Main Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Dashboard Tab */}
          <TabPane tab="Executive Overview" key="dashboard">
            {/* Quick Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Company Revenue"
                    value={companyMetrics.companyRevenue}
                    prefix="$"
                    valueStyle={{ color: '#1890ff' }}
                    suffix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Employee Count"
                    value={companyMetrics.totalEmployees}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Profit Margin"
                    value={companyMetrics.profitMargin}
                    suffix="%"
                    prefix={<PieChartOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Customer Satisfaction"
                    value={companyMetrics.customerSatisfaction}
                    suffix="/5"
                    prefix={<StarOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              {/* Strategic Goals */}
              <Col xs={24} lg={12}>
                <Card
                  title="Strategic Goals"
                  extra={<TrophyOutlined style={{ color: '#faad14' }} />}
                  loading={loading}
                >
                  <List
                    dataSource={strategicGoals}
                    renderItem={goal => (
                      <List.Item>
                        <List.Item.Meta
                          title={goal.goal_name}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>{goal.description}</Text>
                              <Progress
                                percent={Math.round((goal.current_value / goal.target_value) * 100)}
                                status={goal.achieved ? 'success' : 'active'}
                                style={{ marginTop: 8 }}
                              />
                              <Text type="secondary">
                                Progress: {goal.current_value} / {goal.target_value}
                              </Text>
                            </Space>
                          }
                        />
                        <Tag color={goal.achieved ? 'green' : 'blue'}>
                          Q{goal.quarter} {goal.year}
                        </Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              {/* Department Performance */}
              <Col xs={24} lg={12}>
                <Card title="Department Performance" loading={loading}>
                  <Table
                    dataSource={departmentPerformance}
                    columns={departmentColumns}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>

              {/* Pending Approvals */}
              <Col xs={24} lg={12}>
                <Card
                  title="Pending Approvals"
                  extra={
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => setActiveTab('approvals')}
                    >
                      View All
                    </Button>
                  }
                >
                  <Table
                    dataSource={pendingApprovals.slice(0, 5)}
                    columns={approvalColumns}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>

              {/* Executive Summary */}
              <Col xs={24} lg={12}>
                <Card title="Executive Summary">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Card size="small" hoverable>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>Market Share</Text>
                          <Statistic value={financialOverview.marketShare} suffix="%"
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }} />
                          <Text type="secondary">+2.3% from last quarter</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Card size="small" hoverable>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>Employee Retention</Text>
                          <Statistic value={financialOverview.employeeRetention} suffix="%"
                            valueStyle={{ color: '#52c41a', fontSize: '24px' }} />
                          <Text type="secondary">Industry average: 88%</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Card size="small" hoverable>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>Revenue Growth</Text>
                          <Statistic value={financialOverview.revenueGrowth} suffix="%"
                            valueStyle={{ color: '#fa8c16', fontSize: '24px' }} />
                          <Text type="secondary">YoY growth rate</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Card size="small" hoverable>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>Operating Margin</Text>
                          <Statistic value={financialOverview.operatingMargin} suffix="%"
                            valueStyle={{ color: '#722ed1', fontSize: '24px' }} />
                          <Text type="secondary">Above target: 25%</Text>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Approvals Tab */}
          <TabPane tab="Approvals" key="approvals">
            <Card
              title="Pending Approvals"
              extra={
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => setIsReportModalVisible(true)}
                >
                  Generate Approval Report
                </Button>
              }
            >
              <Table
                dataSource={pendingApprovals}
                columns={approvalColumns}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </TabPane>

          {/* Reports Tab */}
          <TabPane tab="Reports & Analytics" key="reports">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card
                  title="Executive Reports"
                  extra={
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsReportModalVisible(true)}
                      >
                        Generate New Report
                      </Button>
                    </Space>
                  }
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card title="Quick Reports" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {[
                            { type: 'financial', name: 'Financial Report', icon: <FundOutlined /> },
                            { type: 'performance', name: 'Performance Report', icon: <BarChartOutlined /> },
                            { type: 'salary', name: 'Salary Report', icon: <DollarOutlined /> },
                            { type: 'attendance', name: 'Attendance Report', icon: <CalendarOutlined /> },
                            { type: 'staff', name: 'Staff Report', icon: <TeamOutlined /> },
                            { type: 'kpi', name: 'KPI Report', icon: <LineChartOutlined /> }
                          ].map(report => (
                            <Button
                              key={report.type}
                              icon={report.icon}
                              block
                              style={{ textAlign: 'left' }}
                              onClick={() => {
                                reportForm.setFieldsValue({
                                  report_type: report.type,
                                  period: 'month'
                                });
                                setIsReportModalVisible(true);
                              }}
                            >
                              {report.name}
                            </Button>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="Recent Reports" size="small">
                        <List
                          dataSource={reports}
                          renderItem={report => (
                            <List.Item
                              actions={[
                                <Button type="link" icon={<DownloadOutlined />} size="small">Download</Button>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<Avatar icon={<FileTextOutlined />} />}
                                title={report.name}
                                description={`Type: ${report.type} | Status: ${report.status}`}
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    </Col>
                  </Row>

                  {reportData.chartData && (
                    <Card title="Report Visualization" style={{ marginTop: 16 }}>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          {renderPieChart(reportData)}
                        </Col>
                        <Col span={12}>
                          <Card title="Report Summary" size="small">
                            <List
                              dataSource={reportData.chartData}
                              renderItem={item => (
                                <List.Item>
                                  <Text>{item.type}:</Text>
                                  <Text strong>{item.value}</Text>
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Management Tab */}
          <TabPane tab="Management" key="management">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card
                  title="Employee Management"
                  extra={
                    <Space>
                      <Button
                        icon={<MessageOutlined />}
                        onClick={() => {
                          setActiveTab('employees');
                          setIsFeedbackModalVisible(true);
                        }}
                      >
                        Give Feedback
                      </Button>
                      <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => setIsPromotionModalVisible(true)}
                      >
                        Promote Employee
                      </Button>
                    </Space>
                  }
                >
                  <List
                    dataSource={allEmployees.slice(0, 5)}
                    renderItem={employee => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            icon={<MessageOutlined />}
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsFeedbackModalVisible(true);
                            }}
                          >
                            Feedback
                          </Button>,
                          <Button
                            type="link"
                            icon={<CrownOutlined />}
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsPromotionModalVisible(true);
                            }}
                          >
                            Promote
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar icon={<TeamOutlined />} />}
                          title={`${employee.first_name} ${employee.last_name}`}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>{employee.role}</Text>
                              <Tag color="blue">{employee.department}</Tag>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title="Meeting Management"
                  extra={
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setIsMeetingModalVisible(true)}
                    >
                      Schedule Meeting
                    </Button>
                  }
                >
                  <List
                    dataSource={meetings}
                    renderItem={meeting => (
                      <List.Item>
                        <List.Item.Meta
                          title={meeting.topic}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>{dayjs(meeting.date).format('DD/MM/YYYY HH:mm')}</Text>
                              <Text type="secondary">{meeting.location}</Text>
                            </Space>
                          }
                        />
                        <Tag color={meeting.status === 'scheduled' ? 'blue' : 'green'}>
                          {meeting.status}
                        </Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Modals */}
      {/* Assign Task Modal */}
      <Modal
        title="Assign Task"
        open={isTaskModalVisible}
        onCancel={() => {
          setIsTaskModalVisible(false);
          taskForm.resetFields();
        }}
        onOk={() => taskForm.submit()}
      >
        <Form form={taskForm} layout="vertical" onFinish={assignTask}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="assignee_id" label="Assignee" rules={[{ required: true }]}>
            <Select placeholder="Select employee">
              {allEmployees.map(employee => (
                <Option key={employee.empid} value={employee.empid}>
                  {employee.first_name} {employee.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="medium">
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        title={`Give Feedback to ${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`}
        open={isFeedbackModalVisible}
        onCancel={() => {
          setIsFeedbackModalVisible(false);
          feedbackForm.resetFields();
          setSelectedEmployee(null);
        }}
        onOk={() => feedbackForm.submit()}
      >
        <Form form={feedbackForm} layout="vertical" onFinish={giveFeedback}>
          <Form.Item name="feedback_type" label="Feedback Type" rules={[{ required: true }]}>
            <Select>
              <Option value="positive">Positive</Option>
              <Option value="constructive">Constructive</Option>
              <Option value="developmental">Developmental</Option>
            </Select>
          </Form.Item>
          <Form.Item name="rating" label="Rating (1-5)" rules={[{ required: true }]}>
            <Select>
              <Option value={1}>1 - Poor</Option>
              <Option value={2}>2 - Fair</Option>
              <Option value={3}>3 - Good</Option>
              <Option value={4}>4 - Very Good</Option>
              <Option value={5}>5 - Excellent</Option>
            </Select>
          </Form.Item>
          <Form.Item name="feedback" label="Feedback" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Provide detailed feedback..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Report Generation Modal */}
      <Modal
        title="Generate Executive Report"
        open={isReportModalVisible}
        onCancel={() => {
          setIsReportModalVisible(false);
          reportForm.resetFields();
        }}
        onOk={() => reportForm.submit()}
        width={600}
      >
        <Form form={reportForm} layout="vertical" onFinish={generateReport}>
          <Form.Item name="report_type" label="Report Type" rules={[{ required: true }]}>
            <Select>
              <Option value="financial">Financial Report</Option>
              <Option value="performance">Performance Report</Option>
              <Option value="salary">Salary Report</Option>
              <Option value="attendance">Attendance Report</Option>
              <Option value="leave">Leave Report</Option>
              <Option value="kpi">KPI Report</Option>
              <Option value="ot">OT Report</Option>
              <Option value="increment">Increment Report</Option>
              <Option value="nopay">No Pay Report</Option>
              <Option value="loan">Loan Report</Option>
              <Option value="staff">Staff Report</Option>
            </Select>
          </Form.Item>
          <Form.Item name="period" label="Period" rules={[{ required: true }]}>
            <Select>
              <Option value="day">Daily</Option>
              <Option value="week">Weekly</Option>
              <Option value="month">Monthly</Option>
              <Option value="quarter">Quarterly</Option>
              <Option value="year">Annual</Option>
            </Select>
          </Form.Item>
          <Form.Item name="employee_id" label="Employee (Optional)">
            <Select allowClear placeholder="Select specific employee or leave blank for all">
              {allEmployees.map(employee => (
                <Option key={employee.empid} value={employee.empid}>
                  {employee.first_name} {employee.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="format" label="Format" initialValue="pdf">
            <Select>
              <Option value="pdf">PDF</Option>
              <Option value="excel">Excel</Option>
              <Option value="csv">CSV</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Meeting Modal */}
      <Modal
        title="Schedule Meeting"
        open={isMeetingModalVisible}
        onCancel={() => {
          setIsMeetingModalVisible(false);
          meetingForm.resetFields();
        }}
        onOk={() => meetingForm.submit()}
      >
        <Form form={meetingForm} layout="vertical" onFinish={scheduleMeeting}>
          <Form.Item name="topic" label="Meeting Topic" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="date" label="Date & Time" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Meeting Type">
            <Select>
              <Option value="executive">Executive</Option>
              <Option value="department">Department</Option>
              <Option value="team">Team</Option>
              <Option value="client">Client</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Promotion Modal */}
      <Modal
        title={`Promote ${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`}
        open={isPromotionModalVisible}
        onCancel={() => {
          setIsPromotionModalVisible(false);
          promotionForm.resetFields();
          setSelectedEmployee(null);
        }}
        onOk={() => promotionForm.submit()}
      >
        <Form
          form={promotionForm}
          layout="vertical"
          onFinish={promoteEmployee}
          initialValues={{
            employee_id: selectedEmployee?.empid,
            current_position: selectedEmployee?.role,
            department: selectedEmployee?.department
          }}
        >
          <Form.Item name="employee_id" label="Employee" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="current_position" label="Current Position">
            <Input disabled />
          </Form.Item>
          <Form.Item name="new_position" label="New Position" rules={[{ required: true }]}>
            <Input placeholder="Enter new position" />
          </Form.Item>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Input placeholder="Enter department" />
          </Form.Item>
          <Form.Item name="salary_increase" label="Salary Increase (%)" rules={[{ required: true }]}>
            <Input type="number" placeholder="Enter percentage increase" />
          </Form.Item>
          <Form.Item name="promotion_reason" label="Promotion Reason">
            <TextArea rows={4} placeholder="Justification for promotion" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CEODashboard;