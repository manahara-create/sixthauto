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
  Descriptions
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  EyeOutlined,
  CalendarOutlined,
  BarChartOutlined,
  RocketOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PieChartOutlined,
  SettingOutlined,
  MessageOutlined,
  FundOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import { Pie, Bar, Line } from '@ant-design/plots';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const ManagerDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState({});
  const [departmentStats, setDepartmentStats] = useState({});
  const [reports, setReports] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isLoanModalVisible, setIsLoanModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [reportData, setReportData] = useState({});
  const [taskForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [reportForm] = Form.useForm();
  const [leaveForm] = Form.useForm();
  const [loanForm] = Form.useForm();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeamMembers(),
        fetchTeamTasks(),
        fetchTeamPerformance(),
        fetchDepartmentStats(),
        fetchRecentReports(),
        fetchLeaveRequests(),
        fetchLoanRequests()
      ]);
    } catch (error) {
      console.error('Error initializing manager dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .eq('managerid', profile.empid)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchTeamTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id (first_name, last_name)
        `)
        .in('assignee_id', teamMembers.map(member => member.empid))
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setTeamTasks(data || []);
    } catch (error) {
      console.error('Error fetching team tasks:', error);
    }
  };

  const fetchTeamPerformance = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('kpiscore, satisfaction_score')
        .eq('managerid', profile.empid)
        .eq('is_active', true);

      if (error) throw error;

      const avgKPI = data?.reduce((acc, emp) => acc + (emp.kpiscore || 0), 0) / (data?.length || 1);
      const avgSatisfaction = data?.reduce((acc, emp) => acc + (emp.satisfaction_score || 0), 0) / (data?.length || 1);

      setTeamPerformance({
        avgKPI: Math.round(avgKPI),
        avgSatisfaction: Math.round(avgSatisfaction),
        teamSize: data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching team performance:', error);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today)
        .in('empid', teamMembers.map(member => member.empid));

      const presentCount = attendance?.filter(a => a.status === 'Present').length || 0;

      setDepartmentStats({
        presentToday: presentCount,
        onLeave: teamMembers.length - presentCount,
        productivity: 92
      });
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('created_by', profile.empid)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('employeeleave')
        .select(`
          *,
          employee:empid (first_name, last_name, email),
          leavetype:leavetypeid (leavetype)
        `)
        .in('empid', teamMembers.map(member => member.empid))
        .eq('leavestatus', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('loanrequest')
        .select(`
          *,
          employee:empid (first_name, last_name, email, basicsalary),
          loantype:loantypeid (loantype)
        `)
        .in('empid', teamMembers.map(member => member.empid))
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoanRequests(data || []);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
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
          status: 'pending',
          created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }]);

      if (error) throw error;
      
      // Log the operation
      await supabase
        .from('manager_operations')
        .insert([{
          operation: 'assign_task',
          record_id: data?.[0]?.id,
          manager_id: profile.empid,
          details: {
            task_title: values.title,
            assignee_id: values.assignee_id,
            due_date: values.due_date.format('YYYY-MM-DD')
          },
          operation_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }]);

      message.success('Task assigned successfully!');
      setIsTaskModalVisible(false);
      taskForm.resetFields();
      fetchTeamTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      message.error('Failed to assign task');
    }
  };

  const giveFeedback = async (values) => {
    try {
      const { data, error } = await supabase
        .from('manager_operations')
        .insert([{
          operation: 'employee_feedback',
          record_id: selectedEmployee.empid,
          manager_id: profile.empid,
          details: {
            feedback: values.feedback,
            rating: values.rating,
            type: values.feedback_type,
            date: dayjs().format('YYYY-MM-DD')
          },
          operation_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
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

  // Leave Management Functions
  const handleLeaveAction = async (leaveId, action, remarks = '') => {
    try {
      const { error } = await supabase
        .from('employeeleave')
        .update({
          leavestatus: action,
          approvedby: profile.empid,
          updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
        })
        .eq('leaveid', leaveId);

      if (error) throw error;

      // Log the operation
      await supabase
        .from('manager_operations')
        .insert([{
          operation: `${action}_leave`,
          record_id: leaveId,
          manager_id: profile.empid,
          details: {
            action: action,
            remarks: remarks,
            date: dayjs().format('YYYY-MM-DD')
          },
          operation_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }]);

      message.success(`Leave request ${action} successfully!`);
      setIsLeaveModalVisible(false);
      setSelectedLeave(null);
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error processing leave request:', error);
      message.error('Failed to process leave request');
    }
  };

  // Loan Management Functions
  const handleLoanAction = async (loanId, action, remarks = '') => {
    try {
      const { error } = await supabase
        .from('loanrequest')
        .update({
          status: action,
          processedby: profile.empid,
          processedat: dayjs().format('YYYY-MM-DD HH:mm:ss')
        })
        .eq('loanrequestid', loanId);

      if (error) throw error;

      // Log the operation
      await supabase
        .from('manager_operations')
        .insert([{
          operation: `${action}_loan`,
          record_id: loanId,
          manager_id: profile.empid,
          details: {
            action: action,
            remarks: remarks,
            date: dayjs().format('YYYY-MM-DD')
          },
          operation_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }]);

      message.success(`Loan request ${action} successfully!`);
      setIsLoanModalVisible(false);
      setSelectedLoan(null);
      fetchLoanRequests();
    } catch (error) {
      console.error('Error processing loan request:', error);
      message.error('Failed to process loan request');
    }
  };

  // Report Generation Functions
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
        case 'performance':
          reportData = await generatePerformanceReport(reportConfig);
          break;
        default:
          throw new Error('Unknown report type');
      }

      // Save report to database
      const { data: report, error } = await supabase
        .from('reports')
        .insert([{
          name: `${values.report_type}_report_${dayjs().format('YYYYMMDD_HHmmss')}`,
          type: values.report_type,
          format: values.format,
          status: 'completed',
          created_by: profile.empid,
          config: reportConfig,
          created_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }])
        .select();

      if (error) throw error;

      setReportData(reportData);
      message.success('Report generated successfully!');
      setIsReportModalVisible(false);
      reportForm.resetFields();
      fetchRecentReports();
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    }
  };

  const generateSalaryReport = async (config) => {
    const startDate = dayjs().startOf(config.period).format('YYYY-MM-DD');
    const endDate = dayjs().endOf(config.period).format('YYYY-MM-DD');

    const { data } = await supabase
      .from('salary')
      .select(`
        *,
        employee:empid (first_name, last_name)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('salarydate', startDate)
      .lte('salarydate', endDate);

    const pieData = data?.map(item => ({
      type: `${item.employee.first_name} ${item.employee.last_name}`,
      value: item.totalsalary
    })) || [];

    return { rawData: data, chartData: pieData, type: 'salary' };
  };

  const generateAttendanceReport = async (config) => {
    const startDate = dayjs().startOf(config.period).format('YYYY-MM-DD');
    const endDate = dayjs().endOf(config.period).format('YYYY-MM-DD');

    const { data } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:empid (first_name, last_name)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('date', startDate)
      .lte('date', endDate);

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

  const generateLeaveReport = async (config) => {
    const startDate = dayjs().startOf(config.period).format('YYYY-MM-DD');
    const endDate = dayjs().endOf(config.period).format('YYYY-MM-DD');

    const { data } = await supabase
      .from('employeeleave')
      .select(`
        *,
        employee:empid (first_name, last_name),
        leavetype:leavetypeid (leavetype)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('leavefromdate', startDate)
      .lte('leavetodate', endDate);

    const leaveTypeCount = data?.reduce((acc, item) => {
      const type = item.leavetype?.leavetype || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};

    const pieData = Object.entries(leaveTypeCount).map(([type, count]) => ({
      type,
      value: count
    }));

    return { rawData: data, chartData: pieData, type: 'leave' };
  };

  const generateKPIReport = async (config) => {
    const startDate = dayjs().startOf(config.period).format('YYYY-MM-DD');
    const endDate = dayjs().endOf(config.period).format('YYYY-MM-DD');

    const { data } = await supabase
      .from('kpi')
      .select(`
        *,
        employee:empid (first_name, last_name)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('calculatedate', startDate)
      .lte('calculatedate', endDate);

    const kpiData = data?.map(item => ({
      type: `${item.employee.first_name} ${item.employee.last_name}`,
      value: item.kpivalue
    })) || [];

    return { rawData: data, chartData: kpiData, type: 'kpi' };
  };

  const generateOTReport = async (config) => {
    const startDate = dayjs().startOf(config.period).format('YYYY-MM-DD');
    const endDate = dayjs().endOf(config.period).format('YYYY-MM-DD');

    const { data } = await supabase
      .from('ot')
      .select(`
        *,
        employee:empid (first_name, last_name)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const otData = data?.map(item => ({
      type: `${item.employee.first_name} ${item.employee.last_name}`,
      value: item.amount
    })) || [];

    return { rawData: data, chartData: otData, type: 'ot' };
  };

  const generatePerformanceReport = async (config) => {
    const startDate = dayjs().startOf(config.period).format('YYYY-MM-DD');
    const endDate = dayjs().endOf(config.period).format('YYYY-MM-DD');

    const { data } = await supabase
      .from('performance_rating')
      .select(`
        *,
        employee:empid (first_name, last_name),
        evaluator:evaluator_id (first_name, last_name)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('review_period_start', startDate)
      .lte('review_period_end', endDate);

    const performanceData = data?.map(item => ({
      type: `${item.employee.first_name} ${item.employee.last_name}`,
      value: item.rate
    })) || [];

    return { rawData: data, chartData: performanceData, type: 'performance' };
  };

  const generateIncrementReport = async (config) => {
    const startDate = dayjs().startOf(config.period).format('YYYY-MM-DD');
    const endDate = dayjs().endOf(config.period).format('YYYY-MM-DD');

    const { data } = await supabase
      .from('increment')
      .select(`
        *,
        employee:empid (first_name, last_name)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const incrementData = data?.map(item => ({
      type: `${item.employee.first_name} ${item.employee.last_name}`,
      value: item.amount
    })) || [];

    return { rawData: data, chartData: incrementData, type: 'increment' };
  };

  const generateNoPayReport = async (config) => {
    const startDate = dayjs().startOf(config.period).format('YYYY-MM-DD');
    const endDate = dayjs().endOf(config.period).format('YYYY-MM-DD');

    const { data } = await supabase
      .from('nopay')
      .select(`
        *,
        employee:empid (first_name, last_name)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const nopayData = data?.map(item => ({
      type: `${item.employee.first_name} ${item.employee.last_name}`,
      value: item.deductionamount
    })) || [];

    return { rawData: data, chartData: nopayData, type: 'nopay' };
  };

  const generateLoanReport = async (config) => {
    const startDate = dayjs().startOf(config.period).format('YYYY-MM-DD');
    const endDate = dayjs().endOf(config.period).format('YYYY-MM-DD');

    const { data } = await supabase
      .from('loanrequest')
      .select(`
        *,
        employee:empid (first_name, last_name),
        loantype:loantypeid (loantype)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const loanTypeData = data?.reduce((acc, item) => {
      const type = item.loantype?.loantype || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};

    const pieData = Object.entries(loanTypeData).map(([type, count]) => ({
      type,
      value: count
    }));

    return { rawData: data, chartData: pieData, type: 'loan' };
  };

  const generateStaffReport = async (config) => {
    const { data } = await supabase
      .from('employee')
      .select('*')
      .eq('managerid', profile.empid)
      .eq('is_active', true);

    const departmentData = data?.reduce((acc, item) => {
      acc[item.department] = (acc[item.department] || 0) + 1;
      return acc;
    }, {}) || {};

    const pieData = Object.entries(departmentData).map(([dept, count]) => ({
      type: dept,
      value: count
    }));

    return { rawData: data, chartData: pieData, type: 'staff' };
  };

  const renderPieChart = (data) => {
    if (!data?.chartData?.length) {
      return <div>No data available for chart</div>;
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
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    return <Pie {...config} />;
  };

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div><Text strong>{text}</Text></div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: 'Assignee',
      dataIndex: ['assignee', 'first_name'],
      key: 'assignee',
      render: (text, record) => 
        `${record.assignee?.first_name} ${record.assignee?.last_name}`
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : 'orange'}>
          {status.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small">Edit</Button>
          <Popconfirm
            title="Are you sure to delete this task?"
            onConfirm={() => deleteTask(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const leaveColumns = [
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
      title: 'Reason',
      dataIndex: 'leavereason',
      key: 'reason'
    },
    {
      title: 'Status',
      dataIndex: 'leavestatus',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<CheckOutlined />} 
            size="small"
            onClick={() => {
              setSelectedLeave(record);
              setIsLeaveModalVisible(true);
            }}
          >
            Review
          </Button>
        </Space>
      )
    }
  ];

  const loanColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'first_name'],
      key: 'employee',
      render: (text, record) => 
        `${record.employee?.first_name} ${record.employee?.last_name}`
    },
    {
      title: 'Loan Type',
      dataIndex: ['loantype', 'loantype'],
      key: 'loantype'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount?.toLocaleString()}`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} months`
    },
    {
      title: 'Interest Rate',
      dataIndex: 'interestrate',
      key: 'interestrate',
      render: (rate) => `${rate}%`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<CheckOutlined />} 
            size="small"
            onClick={() => {
              setSelectedLoan(record);
              setIsLoanModalVisible(true);
            }}
          >
            Review
          </Button>
        </Space>
      )
    }
  ];

  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      message.success('Task deleted successfully!');
      fetchTeamTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      message.error('Failed to delete task');
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Card size="small" style={{ 
        marginBottom: 16, 
        background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <UserOutlined style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                Manager Dashboard
              </Title>
              <Badge count={<UserOutlined />} offset={[-5, 0]}>
                <Tag color="white" style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  {profile?.first_name} {profile?.last_name}
                </Tag>
              </Badge>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'white' }}>
              Department: {profile?.department}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Welcome Alert */}
      <Alert
        message={`Welcome back, ${profile?.first_name || 'Manager'}!`}
        description="Manage your team, track performance, monitor tasks, and oversee department operations."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Main Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Dashboard Tab */}
          <TabPane tab="Dashboard" key="dashboard">
            {/* Quick Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Team Members"
                    value={teamPerformance.teamSize}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Present Today"
                    value={departmentStats.presentToday}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Team KPI"
                    value={teamPerformance.avgKPI}
                    suffix="/100"
                    prefix={<LineChartOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Productivity"
                    value={departmentStats.productivity}
                    suffix="%"
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              {/* Team Members */}
              <Col xs={24} lg={12}>
                <Card 
                  title="My Team" 
                  extra={
                    <Space>
                      <Button type="link" icon={<EyeOutlined />}>View All</Button>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => setIsReportModalVisible(true)}
                      >
                        Generate Report
                      </Button>
                    </Space>
                  }
                  loading={loading}
                >
                  <List
                    dataSource={teamMembers}
                    renderItem={member => (
                      <List.Item
                        actions={[
                          <Button 
                            type="link" 
                            icon={<MessageOutlined />} 
                            size="small"
                            onClick={() => {
                              setSelectedEmployee(member);
                              setIsFeedbackModalVisible(true);
                            }}
                          >
                            Feedback
                          </Button>,
                          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                          title={`${member.first_name} ${member.last_name}`}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text type="secondary">{member.role}</Text>
                              <Space>
                                <Tag color="blue">{member.department}</Tag>
                                <Progress 
                                  percent={member.kpiscore || 75} 
                                  size="small" 
                                  style={{ width: 100 }} 
                                />
                              </Space>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              {/* Team Tasks */}
              <Col xs={24} lg={12}>
                <Card 
                  title="Team Tasks" 
                  extra={
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setIsTaskModalVisible(true)}
                    >
                      Assign Task
                    </Button>
                  }
                  loading={loading}
                >
                  <Table
                    dataSource={teamTasks}
                    columns={taskColumns}
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
                    <Space>
                      <Badge count={leaveRequests.length} offset={[-5, 0]}>
                        <Button 
                          type="link" 
                          onClick={() => setActiveTab('leaves')}
                        >
                          Leaves
                        </Button>
                      </Badge>
                      <Badge count={loanRequests.length} offset={[-5, 0]}>
                        <Button 
                          type="link" 
                          onClick={() => setActiveTab('loans')}
                        >
                          Loans
                        </Button>
                      </Badge>
                    </Space>
                  }
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card 
                        size="small" 
                        hoverable
                        onClick={() => setActiveTab('leaves')}
                        style={{ cursor: 'pointer', textAlign: 'center' }}
                      >
                        <Space direction="vertical">
                          <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                          <Text strong>Leave Requests</Text>
                          <Statistic value={leaveRequests.length} valueStyle={{ color: '#faad14' }} />
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card 
                        size="small" 
                        hoverable
                        onClick={() => setActiveTab('loans')}
                        style={{ cursor: 'pointer', textAlign: 'center' }}
                      >
                        <Space direction="vertical">
                          <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                          <Text strong>Loan Requests</Text>
                          <Statistic value={loanRequests.length} valueStyle={{ color: '#faad14' }} />
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* Quick Manager Actions */}
              <Col xs={24} lg={12}>
                <Card title="Manager Actions">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card size="small" hoverable style={{ textAlign: 'center', height: '100%' }}>
                        <Button 
                          type="primary" 
                          icon={<CheckCircleOutlined />} 
                          block 
                          size="large"
                          onClick={() => setActiveTab('leaves')}
                        >
                          Approve Leaves
                        </Button>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" hoverable style={{ textAlign: 'center', height: '100%' }}>
                        <Button 
                          icon={<BarChartOutlined />} 
                          block 
                          size="large"
                          onClick={() => {
                            setActiveTab('reports');
                            reportForm.setFieldsValue({ report_type: 'performance' });
                            setIsReportModalVisible(true);
                          }}
                        >
                          Performance Review
                        </Button>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" hoverable style={{ textAlign: 'center', height: '100%' }}>
                        <Button 
                          icon={<FileTextOutlined />} 
                          block 
                          size="large"
                          onClick={() => {
                            setActiveTab('reports');
                            setIsReportModalVisible(true);
                          }}
                        >
                          Generate Reports
                        </Button>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" hoverable style={{ textAlign: 'center', height: '100%' }}>
                        <Button 
                          icon={<RocketOutlined />} 
                          block 
                          size="large"
                          onClick={() => setIsTaskModalVisible(true)}
                        >
                          Assign Tasks
                        </Button>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Reports Tab */}
          <TabPane tab="Reports & Analytics" key="reports">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card
                  title="Report Generator"
                  extra={
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setIsReportModalVisible(true)}
                    >
                      Generate New Report
                    </Button>
                  }
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card 
                        title="Quick Reports" 
                        size="small"
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {[
                            { type: 'salary', name: 'Salary Report', icon: <FundOutlined /> },
                            { type: 'attendance', name: 'Attendance Report', icon: <CalendarOutlined /> },
                            { type: 'leave', name: 'Leave Report', icon: <UserOutlined /> },
                            { type: 'kpi', name: 'KPI Report', icon: <LineChartOutlined /> },
                            { type: 'performance', name: 'Performance Report', icon: <BarChartOutlined /> },
                            { type: 'ot', name: 'OT Report', icon: <BarChartOutlined /> },
                            { type: 'staff', name: 'Staff Report', icon: <TeamOutlined /> }
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
                      <Card 
                        title="Recent Reports" 
                        size="small"
                      >
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

                  {/* Report Visualization */}
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

          {/* Task Management Tab */}
          <TabPane tab="Task Management" key="tasks">
            <Card
              title="Task Management"
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsTaskModalVisible(true)}
                >
                  Assign New Task
                </Button>
              }
            >
              <Table
                dataSource={teamTasks}
                columns={taskColumns}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </TabPane>

          {/* Leave Management Tab */}
          <TabPane tab="Leave Requests" key="leaves">
            <Card
              title="Leave Requests Management"
              extra={
                <Button 
                  type="primary" 
                  icon={<RefreshOutlined />}
                  onClick={fetchLeaveRequests}
                >
                  Refresh
                </Button>
              }
            >
              <Table
                dataSource={leaveRequests}
                columns={leaveColumns}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </TabPane>

          {/* Loan Management Tab */}
          <TabPane tab="Loan Requests" key="loans">
            <Card
              title="Loan Requests Management"
              extra={
                <Button 
                  type="primary" 
                  icon={<RefreshOutlined />}
                  onClick={fetchLoanRequests}
                >
                  Refresh
                </Button>
              }
            >
              <Table
                dataSource={loanRequests}
                columns={loanColumns}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* Modals */}
      {/* Assign Task Modal */}
      <Modal
        title="Assign New Task"
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
            <Select placeholder="Select team member">
              {teamMembers.map(member => (
                <Option key={member.empid} value={member.empid}>
                  {member.first_name} {member.last_name}
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
        title="Generate Report"
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
              <Option value="salary">Salary Report</Option>
              <Option value="attendance">Attendance Report</Option>
              <Option value="leave">Leave Report</Option>
              <Option value="kpi">KPI Report</Option>
              <Option value="performance">Performance Report</Option>
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
              {teamMembers.map(member => (
                <Option key={member.empid} value={member.empid}>
                  {member.first_name} {member.last_name}
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

      {/* Leave Approval Modal */}
      <Modal
        title="Review Leave Request"
        open={isLeaveModalVisible}
        onCancel={() => {
          setIsLeaveModalVisible(false);
          setSelectedLeave(null);
          leaveForm.resetFields();
        }}
        footer={null}
      >
        {selectedLeave && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Employee">
                {selectedLeave.employee?.first_name} {selectedLeave.employee?.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="Leave Type">
                {selectedLeave.leavetype?.leavetype}
              </Descriptions.Item>
              <Descriptions.Item label="From Date">
                {dayjs(selectedLeave.leavefromdate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="To Date">
                {dayjs(selectedLeave.leavetodate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedLeave.duration} days
              </Descriptions.Item>
              <Descriptions.Item label="Reason">
                {selectedLeave.leavereason}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Form form={leaveForm} layout="vertical">
              <Form.Item name="remarks" label="Remarks (Optional)">
                <TextArea rows={3} placeholder="Enter any remarks..." />
              </Form.Item>
            </Form>
            
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Space>
                <Button 
                  type="primary" 
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleLeaveAction(selectedLeave.leaveid, 'rejected', leaveForm.getFieldValue('remarks'))}
                >
                  Reject
                </Button>
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />}
                  onClick={() => handleLeaveAction(selectedLeave.leaveid, 'approved', leaveForm.getFieldValue('remarks'))}
                >
                  Approve
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Loan Approval Modal */}
      <Modal
        title="Review Loan Request"
        open={isLoanModalVisible}
        onCancel={() => {
          setIsLoanModalVisible(false);
          setSelectedLoan(null);
          loanForm.resetFields();
        }}
        footer={null}
      >
        {selectedLoan && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Employee">
                {selectedLoan.employee?.first_name} {selectedLoan.employee?.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="Loan Type">
                {selectedLoan.loantype?.loantype}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                ${selectedLoan.amount?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedLoan.duration} months
              </Descriptions.Item>
              <Descriptions.Item label="Interest Rate">
                {selectedLoan.interestrate}%
              </Descriptions.Item>
              <Descriptions.Item label="Employee Salary">
                ${selectedLoan.employee?.basicsalary?.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Form form={loanForm} layout="vertical">
              <Form.Item name="remarks" label="Remarks (Optional)">
                <TextArea rows={3} placeholder="Enter any remarks..." />
              </Form.Item>
            </Form>
            
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Space>
                <Button 
                  type="primary" 
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleLoanAction(selectedLoan.loanrequestid, 'rejected', loanForm.getFieldValue('remarks'))}
                >
                  Reject
                </Button>
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />}
                  onClick={() => handleLoanAction(selectedLoan.loanrequestid, 'approved', loanForm.getFieldValue('remarks'))}
                >
                  Approve
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerDashboard;