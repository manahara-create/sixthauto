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
  ReloadOutlined,
  SettingOutlined,
  MessageOutlined,
  FundOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import { Pie, Bar, Line } from '@ant-design/plots';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocTable, TableCell, TableRow, WidthType } from 'docx';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

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
  const [searchEmployee, setSearchEmployee] = useState('');

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

  // Export Functions for XLSX and DOCX
  const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToWord = async (data, filename, title) => {
    const tableRows = [
      new TableRow({
        children: Object.keys(data[0] || {}).map(key => 
          new TableCell({
            children: [new Paragraph({ text: key, style: 'Heading3' })],
          })
        ),
      }),
      ...data.map(item => 
        new TableRow({
          children: Object.values(item).map(value => 
            new TableCell({
              children: [new Paragraph({ text: String(value || '') })],
            })
          ),
        })
      ),
    ];

    const table = new DocTable({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: tableRows,
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            style: 'Heading1',
          }),
          new Paragraph({
            text: `Generated on: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
            style: 'Heading4',
          }),
          table,
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Report Generation Functions
  const generateReport = async (values) => {
    try {
      const reportConfig = {
        type: values.report_type,
        start_date: values.date_range?.[0]?.format('YYYY-MM-DD') || dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        end_date: values.date_range?.[1]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
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

      // Export based on format
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const reportTitle = `${values.report_type}_report_${timestamp}`;
      
      if (values.format === 'excel') {
        exportToExcel(reportData.rawData, reportTitle, values.report_type);
      } else if (values.format === 'docx') {
        await exportToWord(reportData.rawData, reportTitle, `${values.report_type.replace(/_/g, ' ').toUpperCase()} REPORT`);
      }

      // Save report to database
      const { data: report, error } = await supabase
        .from('reports')
        .insert([{
          name: reportTitle,
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
      message.success('Report generated and downloaded successfully!');
      setIsReportModalVisible(false);
      reportForm.resetFields();
      fetchRecentReports();
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    }
  };

  const generateSalaryReport = async (config) => {
    const { data } = await supabase
      .from('salary')
      .select(`
        *,
        employee:empid (first_name, last_name, email, department)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('salarydate', config.start_date)
      .lte('salarydate', config.end_date);

    const formattedData = data?.map(item => ({
      'Employee Name': `${item.employee?.first_name} ${item.employee?.last_name}`,
      'Department': item.employee?.department,
      'Basic Salary': item.basicsalary,
      'OT Pay': item.otpay,
      'Bonus Pay': item.bonuspay,
      'Increment Pay': item.incrementpay,
      'Total Salary': item.totalsalary,
      'Salary Date': item.salarydate,
    })) || [];

    return { rawData: formattedData, type: 'salary' };
  };

  const generateAttendanceReport = async (config) => {
    const { data } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:empid (first_name, last_name, department)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('date', config.start_date)
      .lte('date', config.end_date);

    const formattedData = data?.map(item => ({
      'Employee Name': `${item.employee?.first_name} ${item.employee?.last_name}`,
      'Department': item.employee?.department,
      'Date': item.date,
      'In Time': item.intime,
      'Out Time': item.outtime,
      'Status': item.status,
    })) || [];

    return { rawData: formattedData, type: 'attendance' };
  };

  const generateLeaveReport = async (config) => {
    const { data } = await supabase
      .from('employeeleave')
      .select(`
        *,
        employee:empid (first_name, last_name, department),
        leavetype:leavetypeid (leavetype)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('leavefromdate', config.start_date)
      .lte('leavetodate', config.end_date);

    const formattedData = data?.map(item => ({
      'Employee Name': `${item.employee?.first_name} ${item.employee?.last_name}`,
      'Department': item.employee?.department,
      'Leave Type': item.leavetype?.leavetype,
      'From Date': item.leavefromdate,
      'To Date': item.leavetodate,
      'Duration': item.duration,
      'Reason': item.leavereason,
      'Status': item.leavestatus,
    })) || [];

    return { rawData: formattedData, type: 'leave' };
  };

  const generateKPIReport = async (config) => {
    const { data } = await supabase
      .from('kpi')
      .select(`
        *,
        employee:empid (first_name, last_name, department)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('calculatedate', config.start_date)
      .lte('calculatedate', config.end_date);

    const formattedData = data?.map(item => ({
      'Employee Name': `${item.employee?.first_name} ${item.employee?.last_name}`,
      'Department': item.employee?.department,
      'KPI Value': item.kpivalue,
      'Calculation Date': item.calculatedate,
      'KPI Year': item.kpiyear,
    })) || [];

    return { rawData: formattedData, type: 'kpi' };
  };

  const generateOTReport = async (config) => {
    const { data } = await supabase
      .from('ot')
      .select(`
        *,
        employee:empid (first_name, last_name, department)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('created_at', config.start_date)
      .lte('created_at', config.end_date);

    const formattedData = data?.map(item => ({
      'Employee Name': `${item.employee?.first_name} ${item.employee?.last_name}`,
      'Department': item.employee?.department,
      'OT Hours': item.othours,
      'Rate': item.rate,
      'Amount': item.amount,
      'Type': item.type,
      'Status': item.status,
    })) || [];

    return { rawData: formattedData, type: 'ot' };
  };

  const generatePerformanceReport = async (config) => {
    const { data } = await supabase
      .from('performance_rating')
      .select(`
        *,
        employee:empid (first_name, last_name, department),
        evaluator:evaluator_id (first_name, last_name)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('rating_date', config.start_date)
      .lte('rating_date', config.end_date);

    const formattedData = data?.map(item => ({
      'Employee Name': `${item.employee?.first_name} ${item.employee?.last_name}`,
      'Department': item.employee?.department,
      'Rating': item.rating,
      'Comments': item.comments,
      'Evaluator': `${item.evaluator?.first_name} ${item.evaluator?.last_name}`,
      'Rating Date': item.rating_date,
    })) || [];

    return { rawData: formattedData, type: 'performance' };
  };

  const generateIncrementReport = async (config) => {
    const { data } = await supabase
      .from('increment')
      .select(`
        *,
        employee:empid (first_name, last_name, department)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('created_at', config.start_date)
      .lte('created_at', config.end_date);

    const formattedData = data?.map(item => ({
      'Employee Name': `${item.employee?.first_name} ${item.employee?.last_name}`,
      'Department': item.employee?.department,
      'Percentage': item.percentage,
      'Amount': item.amount,
      'Last Increment Date': item.lastincrementdate,
      'Next Increment Date': item.nextincrementdate,
      'Approval Status': item.approval,
    })) || [];

    return { rawData: formattedData, type: 'increment' };
  };

  const generateNoPayReport = async (config) => {
    const { data } = await supabase
      .from('nopay')
      .select(`
        *,
        employee:empid (first_name, last_name, department)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('created_at', config.start_date)
      .lte('created_at', config.end_date);

    const formattedData = data?.map(item => ({
      'Employee Name': `${item.employee?.first_name} ${item.employee?.last_name}`,
      'Department': item.employee?.department,
      'Deduction Amount': item.deductionamount,
      'Deduction Date': item.deductiondate,
      'Reason': item.reason,
    })) || [];

    return { rawData: formattedData, type: 'nopay' };
  };

  const generateLoanReport = async (config) => {
    const { data } = await supabase
      .from('loanrequest')
      .select(`
        *,
        employee:empid (first_name, last_name, department),
        loantype:loantypeid (loantype)
      `)
      .in('empid', config.employee_id ? [config.employee_id] : teamMembers.map(m => m.empid))
      .gte('created_at', config.start_date)
      .lte('created_at', config.end_date);

    const formattedData = data?.map(item => ({
      'Employee Name': `${item.employee?.first_name} ${item.employee?.last_name}`,
      'Department': item.employee?.department,
      'Loan Type': item.loantype?.loantype,
      'Amount': item.amount,
      'Duration': item.duration,
      'Interest Rate': item.interestrate,
      'Status': item.status,
      'Request Date': item.date,
    })) || [];

    return { rawData: formattedData, type: 'loan' };
  };

  const generateStaffReport = async (config) => {
    const { data } = await supabase
      .from('employee')
      .select('*')
      .eq('managerid', profile.empid)
      .eq('is_active', true);

    const formattedData = data?.map(item => ({
      'Employee ID': item.empid,
      'Full Name': item.full_name,
      'Email': item.email,
      'Phone': item.phone,
      'Role': item.role,
      'Department': item.department,
      'Gender': item.gender,
      'Status': item.status,
      'Basic Salary': item.basicsalary,
      'KPI Score': item.kpiscore,
      'Satisfaction Score': item.satisfaction_score,
      'Date of Birth': item.dob,
      'Tenure': item.tenure,
    })) || [];

    return { rawData: formattedData, type: 'staff' };
  };

  // Filtered team members based on search
  const filteredTeamMembers = teamMembers.filter(member =>
    member.first_name?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    member.last_name?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchEmployee.toLowerCase())
  );

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

            {/* Action Buttons */}
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              <Col>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsTaskModalVisible(true)}
                >
                  Assign Task
                </Button>
              </Col>
              <Col>
                <Button 
                  type="default" 
                  icon={<DownloadOutlined />}
                  onClick={() => setIsReportModalVisible(true)}
                >
                  Generate Report
                </Button>
              </Col>
              <Col>
                <Button 
                  type="default" 
                  icon={<ReloadOutlined />}
                  onClick={initializeDashboard}
                >
                  Refresh
                </Button>
              </Col>
            </Row>

            {/* Team Members Section */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <TeamOutlined />
                      Team Members ({filteredTeamMembers.length})
                    </Space>
                  }
                  extra={
                    <Input
                      placeholder="Search team members..."
                      prefix={<SearchOutlined />}
                      value={searchEmployee}
                      onChange={(e) => setSearchEmployee(e.target.value)}
                      style={{ width: 200 }}
                    />
                  }
                >
                  <List
                    dataSource={filteredTeamMembers}
                    renderItem={(employee) => (
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
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={`${employee.first_name} ${employee.last_name}`}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text type="secondary">{employee.email}</Text>
                              <Text type="secondary">{employee.department}</Text>
                              <Progress 
                                percent={employee.kpiscore || 0} 
                                size="small" 
                                status={employee.kpiscore >= 80 ? 'success' : employee.kpiscore >= 60 ? 'normal' : 'exception'}
                              />
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <CalendarOutlined />
                      Recent Tasks
                    </Space>
                  }
                >
                  <Table
                    dataSource={teamTasks}
                    columns={taskColumns}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>

            {/* Pending Approvals */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <ExclamationCircleOutlined />
                      Pending Leave Requests ({leaveRequests.length})
                    </Space>
                  }
                >
                  <Table
                    dataSource={leaveRequests}
                    columns={leaveColumns}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <FundOutlined />
                      Pending Loan Requests ({loanRequests.length})
                    </Space>
                  }
                >
                  <Table
                    dataSource={loanRequests}
                    columns={loanColumns}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Reports Tab */}
          <TabPane tab="Reports & Analytics" key="reports">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card
                  title="Report Generation"
                  extra={
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={() => setIsReportModalVisible(true)}
                    >
                      Generate New Report
                    </Button>
                  }
                >
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Title level={4}>Recent Reports</Title>
                      <List
                        dataSource={reports}
                        renderItem={(report) => (
                          <List.Item
                            actions={[
                              <Button type="link" icon={<DownloadOutlined />}>
                                Download
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<FileTextOutlined />}
                              title={report.name}
                              description={`Type: ${report.type} | Format: ${report.format} | Created: ${dayjs(report.created_at).format('DD/MM/YYYY HH:mm')}`}
                            />
                          </List.Item>
                        )}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
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
        footer={null}
        width={600}
      >
        <Form form={taskForm} layout="vertical" onFinish={assignTask}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="Enter task title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter task description" />
          </Form.Item>
          <Form.Item name="assignee_id" label="Assign To" rules={[{ required: true }]}>
            <Select placeholder="Select team member">
              {teamMembers.map(member => (
                <Option key={member.empid} value={member.empid}>
                  {member.first_name} {member.last_name} - {member.department}
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
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Assign Task
              </Button>
              <Button onClick={() => {
                setIsTaskModalVisible(false);
                taskForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
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
        footer={null}
        width={600}
      >
        <Form form={feedbackForm} layout="vertical" onFinish={giveFeedback}>
          <Form.Item name="feedback_type" label="Feedback Type" rules={[{ required: true }]}>
            <Select placeholder="Select feedback type">
              <Option value="positive">Positive</Option>
              <Option value="constructive">Constructive</Option>
              <Option value="improvement">Improvement Needed</Option>
            </Select>
          </Form.Item>
          <Form.Item name="rating" label="Rating (1-5)" rules={[{ required: true }]}>
            <Select placeholder="Select rating">
              <Option value={1}>1 - Poor</Option>
              <Option value={2}>2 - Fair</Option>
              <Option value={3}>3 - Good</Option>
              <Option value={4}>4 - Very Good</Option>
              <Option value={5}>5 - Excellent</Option>
            </Select>
          </Form.Item>
          <Form.Item name="feedback" label="Feedback" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Enter your feedback..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Feedback
              </Button>
              <Button onClick={() => {
                setIsFeedbackModalVisible(false);
                feedbackForm.resetFields();
                setSelectedEmployee(null);
              }}>
                Cancel
              </Button>
            </Space>
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
        footer={null}
        width={700}
      >
        <Form form={reportForm} layout="vertical" onFinish={generateReport}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="report_type" label="Report Type" rules={[{ required: true }]}>
                <Select placeholder="Select report type">
                  <Option value="salary">Salary Report</Option>
                  <Option value="attendance">Attendance Report</Option>
                  <Option value="leave">Leave Report</Option>
                  <Option value="kpi">KPI Report</Option>
                  <Option value="ot">OT Report</Option>
                  <Option value="performance">Performance Report</Option>
                  <Option value="increment">Increment Report</Option>
                  <Option value="loan">Loan Report</Option>
                  <Option value="staff">Staff Report</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="format" label="Export Format" rules={[{ required: true }]}>
                <Select placeholder="Select format">
                  <Option value="excel">Excel (.xlsx)</Option>
                  <Option value="docx">Word (.docx)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="date_range" label="Date Range" initialValue={[dayjs().subtract(7, 'day'), dayjs()]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="employee_id" label="Employee (Optional)">
            <Select 
              placeholder="Select specific employee (leave empty for all team members)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {teamMembers.map(member => (
                <Option key={member.empid} value={member.empid}>
                  {member.first_name} {member.last_name} - {member.department}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<DownloadOutlined />}>
                Generate & Download
              </Button>
              <Button onClick={() => {
                setIsReportModalVisible(false);
                reportForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Leave Review Modal */}
      <Modal
        title="Review Leave Request"
        open={isLeaveModalVisible}
        onCancel={() => {
          setIsLeaveModalVisible(false);
          setSelectedLeave(null);
        }}
        footer={null}
        width={600}
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
              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />}
                    onClick={() => handleLeaveAction(selectedLeave.leaveid, 'approved', leaveForm.getFieldValue('remarks'))}
                  >
                    Approve
                  </Button>
                  <Button 
                    danger 
                    icon={<CloseOutlined />}
                    onClick={() => handleLeaveAction(selectedLeave.leaveid, 'rejected', leaveForm.getFieldValue('remarks'))}
                  >
                    Reject
                  </Button>
                  <Button onClick={() => {
                    setIsLeaveModalVisible(false);
                    setSelectedLeave(null);
                  }}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Loan Review Modal */}
      <Modal
        title="Review Loan Request"
        open={isLoanModalVisible}
        onCancel={() => {
          setIsLoanModalVisible(false);
          setSelectedLoan(null);
        }}
        footer={null}
        width={600}
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
              <Descriptions.Item label="Basic Salary">
                ${selectedLoan.employee?.basicsalary?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Request Date">
                {dayjs(selectedLoan.date).format('DD/MM/YYYY')}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Form form={loanForm} layout="vertical">
              <Form.Item name="remarks" label="Remarks (Optional)">
                <TextArea rows={3} placeholder="Enter any remarks..." />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />}
                    onClick={() => handleLoanAction(selectedLoan.loanrequestid, 'approved', loanForm.getFieldValue('remarks'))}
                  >
                    Approve
                  </Button>
                  <Button 
                    danger 
                    icon={<CloseOutlined />}
                    onClick={() => handleLoanAction(selectedLoan.loanrequestid, 'rejected', loanForm.getFieldValue('remarks'))}
                  >
                    Reject
                  </Button>
                  <Button onClick={() => {
                    setIsLoanModalVisible(false);
                    setSelectedLoan(null);
                  }}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerDashboard;