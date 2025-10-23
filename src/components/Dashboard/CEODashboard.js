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
  Timeline,
  InputNumber,
  Switch
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
  CrownOutlined,
  SearchOutlined,
  ReloadOutlined
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
  const [tasks, setTasks] = useState([]);
  
  // Modal states
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false);
  const [isPromotionModalVisible, setIsPromotionModalVisible] = useState(false);
  const [isEditMeetingModalVisible, setIsEditMeetingModalVisible] = useState(false);
  const [isEditTaskModalVisible, setIsEditTaskModalVisible] = useState(false);
  const [isEditGoalModalVisible, setIsEditGoalModalVisible] = useState(false);
  const [isAddGoalModalVisible, setIsAddGoalModalVisible] = useState(false);
  
  // Selected items
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  const [reportData, setReportData] = useState({});
  const [searchText, setSearchText] = useState('');
  
  // Forms
  const [taskForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [reportForm] = Form.useForm();
  const [meetingForm] = Form.useForm();
  const [promotionForm] = Form.useForm();
  const [editMeetingForm] = Form.useForm();
  const [editTaskForm] = Form.useForm();
  const [goalForm] = Form.useForm();

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
        fetchUpcomingMeetings(),
        fetchTasks()
      ]);
    } catch (error) {
      console.error('Error initializing CEO dashboard:', error);
      message.error('Failed to initialize dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyMetrics = async () => {
    try {
      const { data: employees, error: empError } = await supabase
        .from('employee')
        .select('empid, is_active')
        .eq('is_active', true);

      if (empError) throw empError;

      const { data: revenue, error: revError } = await supabase
        .from('financialreports')
        .select('totalrevenue')
        .order('quarterenddate', { ascending: false })
        .limit(1);

      if (revError) throw revError;

      // Calculate profit margin from salary data
      const { data: salaryData } = await supabase
        .from('salary')
        .select('totalsalary')
        .gte('salarydate', dayjs().subtract(1, 'month').format('YYYY-MM-DD'));

      const totalSalary = salaryData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0;
      const companyRevenue = revenue?.[0]?.totalrevenue || 1250000;
      const profitMargin = companyRevenue > 0 ? ((companyRevenue - totalSalary) / companyRevenue * 100).toFixed(1) : 0;

      setCompanyMetrics({
        totalEmployees: employees?.length || 0,
        companyRevenue: companyRevenue,
        profitMargin: parseFloat(profitMargin),
        customerSatisfaction: 4.7
      });
    } catch (error) {
      console.error('Error fetching company metrics:', error);
      // Fallback data
      setCompanyMetrics({
        totalEmployees: 150,
        companyRevenue: 1250000,
        profitMargin: 28.5,
        customerSatisfaction: 4.7
      });
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
      // Create initial goals if none exist
      const initialGoals = [
        { 
          goal_id: 1, 
          goal_name: 'Revenue Growth', 
          description: 'Achieve 20% revenue growth YoY', 
          current_value: 15, 
          target_value: 20, 
          achieved: false, 
          quarter: 1, 
          year: 2024,
          weight: 1
        },
        { 
          goal_id: 2, 
          goal_name: 'Market Expansion', 
          description: 'Expand to 2 new international markets', 
          current_value: 1, 
          target_value: 2, 
          achieved: false, 
          quarter: 2, 
          year: 2024,
          weight: 1
        }
      ];
      setStrategicGoals(initialGoals);
    }
  };

  const fetchDepartmentPerformance = async () => {
    try {
      // Get employees by department with their KPIs
      const { data: employees, error } = await supabase
        .from('employee')
        .select('empid, department, kpiscore, satisfaction_score')
        .eq('is_active', true);

      if (error) throw error;

      // Calculate department performance
      const departmentStats = {};
      employees.forEach(emp => {
        if (!departmentStats[emp.department]) {
          departmentStats[emp.department] = {
            count: 0,
            totalKPI: 0,
            totalSatisfaction: 0
          };
        }
        departmentStats[emp.department].count++;
        departmentStats[emp.department].totalKPI += (emp.kpiscore || 0);
        departmentStats[emp.department].totalSatisfaction += (emp.satisfaction_score || 0);
      });

      const performance = Object.entries(departmentStats).map(([dept, stats]) => ({
        department: dept,
        performance: Math.round((stats.totalKPI / stats.count) * 10),
        growth: Math.round((stats.totalSatisfaction / stats.count) * 20),
        revenue: Math.round(Math.random() * 500000) + 50000 // Mock revenue data
      }));

      setDepartmentPerformance(performance);
    } catch (error) {
      console.error('Error fetching department performance:', error);
      // Fallback data
      const performance = [
        { department: 'Sales', performance: 92, growth: 15, revenue: 450000 },
        { department: 'Marketing', performance: 88, growth: 12, revenue: 150000 },
        { department: 'Development', performance: 95, growth: 20, revenue: 300000 },
        { department: 'HR', performance: 85, growth: 8, revenue: 50000 },
        { department: 'Finance', performance: 90, growth: 10, revenue: 75000 }
      ];
      setDepartmentPerformance(performance);
    }
  };

  const fetchFinancialOverview = async () => {
    try {
      const { data: financialData } = await supabase
        .from('financialreports')
        .select('*')
        .order('quarterenddate', { ascending: false })
        .limit(2);

      const currentRevenue = financialData?.[0]?.totalrevenue || 1250000;
      const previousRevenue = financialData?.[1]?.totalrevenue || 1000000;
      const revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);

      setFinancialOverview({
        marketShare: 18.5,
        employeeRetention: 94,
        revenueGrowth: parseFloat(revenueGrowth),
        operatingMargin: 28.5
      });
    } catch (error) {
      console.error('Error fetching financial overview:', error);
      setFinancialOverview({
        marketShare: 18.5,
        employeeRetention: 94,
        revenueGrowth: 22.3,
        operatingMargin: 28.5
      });
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const { data: leaveRequests, error: leaveError } = await supabase
        .from('employeeleave')
        .select(`
          *,
          employee:empid (first_name, last_name, role, department),
          leavetype:leavetypeid (leavetype)
        `)
        .eq('leavestatus', 'pending')
        .order('created_at', { ascending: false });

      if (leaveError) throw leaveError;

      const { data: loanRequests, error: loanError } = await supabase
        .from('loanrequest')
        .select(`
          *,
          employee:empid (first_name, last_name, role, department),
          loantype:loantypeid (loantype)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (loanError) throw loanError;

      const approvals = [
        ...(leaveRequests || []).map(req => ({
          ...req,
          type: 'leave',
          title: `Leave Request - ${req.employee.first_name} ${req.employee.last_name}`,
          description: `${req.leavetype?.leavetype} - ${req.duration} days`,
          employee_name: `${req.employee.first_name} ${req.employee.last_name}`,
          employee_role: req.employee.role
        })),
        ...(loanRequests || []).map(req => ({
          ...req,
          type: 'loan',
          title: `Loan Request - ${req.employee.first_name} ${req.employee.last_name}`,
          description: `$${req.amount} - ${req.loantype?.loantype}`,
          employee_name: `${req.employee.first_name} ${req.employee.last_name}`,
          employee_role: req.employee.role
        }))
      ];

      setPendingApprovals(approvals);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      message.error('Failed to fetch pending approvals');
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
      message.error('Failed to fetch employees');
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
        .limit(10);

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id (first_name, last_name, role),
          creator:created_by (first_name, last_name)
        `)
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
            approvedby: profile.empid,
            remarks: remarks
          })
          .eq('leaveid', id);

        if (error) throw error;
      } else if (type === 'loan') {
        const { error } = await supabase
          .from('loanrequest')
          .update({ 
            status: status,
            processedby: profile.empid,
            processedat: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            remarks: remarks
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
          title: values.title,
          description: values.description,
          priority: values.priority,
          type: values.type || 'general',
          due_date: values.due_date.format('YYYY-MM-DD HH:mm:ss'),
          status: 'pending',
          assignee_id: values.assignee_id,
          created_by: profile.empid
        }])
        .select();

      if (error) throw error;
      
      message.success('Task assigned successfully!');
      setIsTaskModalVisible(false);
      taskForm.resetFields();
      fetchTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      message.error('Failed to assign task');
    }
  };

  const updateTask = async (values) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: values.title,
          description: values.description,
          priority: values.priority,
          type: values.type,
          due_date: values.due_date.format('YYYY-MM-DD HH:mm:ss'),
          status: values.status
        })
        .eq('id', selectedTask.id);

      if (error) throw error;
      
      message.success('Task updated successfully!');
      setIsEditTaskModalVisible(false);
      editTaskForm.resetFields();
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      message.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      message.success('Task deleted successfully!');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      message.error('Failed to delete task');
    }
  };

  // Meeting Management
  const scheduleMeeting = async (values) => {
    try {
      const { data, error } = await supabase
        .from('meeting')
        .insert([{
          topic: values.topic,
          description: values.description,
          date: values.date.format('YYYY-MM-DD HH:mm:ss'),
          starttime: values.date.format('HH:mm:ss'),
          endtime: values.end_time?.format('HH:mm:ss') || values.date.add(1, 'hour').format('HH:mm:ss'),
          location: values.location,
          type: values.type,
          empid: profile.empid,
          status: 'scheduled'
        }])
        .select();

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

  const updateMeeting = async (values) => {
    try {
      const { error } = await supabase
        .from('meeting')
        .update({
          topic: values.topic,
          description: values.description,
          date: values.date.format('YYYY-MM-DD HH:mm:ss'),
          starttime: values.date.format('HH:mm:ss'),
          endtime: values.end_time?.format('HH:mm:ss') || values.date.add(1, 'hour').format('HH:mm:ss'),
          location: values.location,
          type: values.type,
          status: values.status
        })
        .eq('meetingid', selectedMeeting.meetingid);

      if (error) throw error;
      
      message.success('Meeting updated successfully!');
      setIsEditMeetingModalVisible(false);
      editMeetingForm.resetFields();
      setSelectedMeeting(null);
      fetchUpcomingMeetings();
    } catch (error) {
      console.error('Error updating meeting:', error);
      message.error('Failed to update meeting');
    }
  };

  const deleteMeeting = async (meetingId) => {
    try {
      const { error } = await supabase
        .from('meeting')
        .delete()
        .eq('meetingid', meetingId);

      if (error) throw error;
      
      message.success('Meeting deleted successfully!');
      fetchUpcomingMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      message.error('Failed to delete meeting');
    }
  };

  // Strategic Goals Management
  const addStrategicGoal = async (values) => {
    try {
      const { data, error } = await supabase
        .from('strategic_goals')
        .insert([{
          goal_name: values.goal_name,
          description: values.description,
          year: values.year,
          quarter: values.quarter,
          target_value: values.target_value,
          current_value: values.current_value || 0,
          achieved: false,
          weight: values.weight || 1
        }])
        .select();

      if (error) throw error;
      
      message.success('Strategic goal added successfully!');
      setIsAddGoalModalVisible(false);
      goalForm.resetFields();
      fetchStrategicGoals();
    } catch (error) {
      console.error('Error adding strategic goal:', error);
      message.error('Failed to add strategic goal');
    }
  };

  const updateStrategicGoal = async (values) => {
    try {
      const { error } = await supabase
        .from('strategic_goals')
        .update({
          goal_name: values.goal_name,
          description: values.description,
          year: values.year,
          quarter: values.quarter,
          target_value: values.target_value,
          current_value: values.current_value,
          achieved: values.achieved,
          weight: values.weight
        })
        .eq('goal_id', selectedGoal.goal_id);

      if (error) throw error;
      
      message.success('Strategic goal updated successfully!');
      setIsEditGoalModalVisible(false);
      goalForm.resetFields();
      setSelectedGoal(null);
      fetchStrategicGoals();
    } catch (error) {
      console.error('Error updating strategic goal:', error);
      message.error('Failed to update strategic goal');
    }
  };

  const deleteStrategicGoal = async (goalId) => {
    try {
      const { error } = await supabase
        .from('strategic_goals')
        .delete()
        .eq('goal_id', goalId);

      if (error) throw error;
      
      message.success('Strategic goal deleted successfully!');
      fetchStrategicGoals();
    } catch (error) {
      console.error('Error deleting strategic goal:', error);
      message.error('Failed to delete strategic goal');
    }
  };

  // Feedback Management
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
            date: dayjs().format('YYYY-MM-DD'),
            employee_name: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
          }
        }])
        .select();

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

  // Promotion Management
  const promoteEmployee = async (values) => {
    try {
      // First update employee record
      const { error: employeeError } = await supabase
        .from('employee')
        .update({
          role: values.new_position,
          department: values.department
        })
        .eq('empid', values.employee_id);

      if (employeeError) throw employeeError;

      // Then create promotion record
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

  // Report Generation Functions
  const generateReport = async (values) => {
    try {
      setLoading(true);
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
        case 'financial':
          reportData = await generateFinancialReport(reportConfig);
          break;
        case 'performance':
          reportData = await generatePerformanceReport(reportConfig);
          break;
        case 'staff':
          reportData = await generateStaffReport(reportConfig);
          break;
        default:
          throw new Error('Unknown report type');
      }

      // Save report metadata
      const { data: report, error } = await supabase
        .from('reports')
        .insert([{
          name: `${values.report_type}_report_${dayjs().format('YYYYMMDD_HHmmss')}`,
          type: values.report_type,
          format: values.format,
          status: 'completed',
          created_by: profile.empid,
          config: reportConfig,
          download_url: `/reports/${values.report_type}_${dayjs().format('YYYYMMDD_HHmmss')}.${values.format}`
        }])
        .select();

      if (error) throw error;

      setReportData(reportData);
      message.success('Report generated successfully!');
      fetchRecentReports();
      
      // Simulate download
      if (values.format === 'pdf') {
        const blob = new Blob([JSON.stringify(reportData.rawData, null, 2)], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${values.report_type}_report_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateSalaryReport = async (config) => {
    const { data } = await supabase
      .from('salary')
      .select(`
        *,
        employee:empid (first_name, last_name, department, role)
      `)
      .gte('salarydate', dayjs().startOf(config.period).format('YYYY-MM-DD'))
      .lte('salarydate', dayjs().endOf(config.period).format('YYYY-MM-DD'));

    const chartData = data?.map(item => ({
      type: `${item.employee?.first_name} ${item.employee?.last_name}`,
      value: item.totalsalary || 0
    })) || [];

    return { rawData: data, chartData, type: 'salary' };
  };

  const generateFinancialReport = async (config) => {
    const { data } = await supabase
      .from('financialreports')
      .select('*')
      .order('quarterenddate', { ascending: false })
      .limit(8);

    const chartData = data?.map(item => ({
      type: dayjs(item.quarterenddate).format('MMM YYYY'),
      value: item.totalrevenue || 0
    })) || [];

    return { rawData: data, chartData, type: 'financial' };
  };

  const generatePerformanceReport = async (config) => {
    const { data } = await supabase
      .from('employee')
      .select('empid, first_name, last_name, department, kpiscore, satisfaction_score, role')
      .eq('is_active', true);

    const chartData = data?.map(item => ({
      type: `${item.first_name} ${item.last_name}`,
      value: item.kpiscore || 0
    })) || [];

    return { rawData: data, chartData, type: 'performance' };
  };

  const generateAttendanceReport = async (config) => {
    const { data } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:empid (first_name, last_name, department)
      `)
      .gte('date', dayjs().startOf(config.period).format('YYYY-MM-DD'))
      .lte('date', dayjs().endOf(config.period).format('YYYY-MM-DD'));

    const statusCount = data?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const chartData = Object.entries(statusCount).map(([status, count]) => ({
      type: status,
      value: count
    }));

    return { rawData: data, chartData, type: 'attendance' };
  };

  const generateLeaveReport = async (config) => {
    const { data } = await supabase
      .from('employeeleave')
      .select(`
        *,
        employee:empid (first_name, last_name, department),
        leavetype:leavetypeid (leavetype)
      `)
      .gte('leavefromdate', dayjs().startOf(config.period).format('YYYY-MM-DD'))
      .lte('leavetodate', dayjs().endOf(config.period).format('YYYY-MM-DD'));

    const statusCount = data?.reduce((acc, item) => {
      acc[item.leavestatus] = (acc[item.leavestatus] || 0) + 1;
      return acc;
    }, {}) || {};

    const chartData = Object.entries(statusCount).map(([status, count]) => ({
      type: status,
      value: count
    }));

    return { rawData: data, chartData, type: 'leave' };
  };

  const generateKPIReport = async (config) => {
    const { data } = await supabase
      .from('employee')
      .select('empid, first_name, last_name, department, kpiscore, role')
      .eq('is_active', true);

    const chartData = data?.map(item => ({
      type: `${item.first_name} ${item.last_name}`,
      value: item.kpiscore || 0
    })) || [];

    return { rawData: data, chartData, type: 'kpi' };
  };

  const generateStaffReport = async (config) => {
    const { data } = await supabase
      .from('employee')
      .select('*')
      .eq('is_active', true)
      .order('department', { ascending: true });

    const departmentCount = data?.reduce((acc, item) => {
      acc[item.department] = (acc[item.department] || 0) + 1;
      return acc;
    }, {}) || {};

    const chartData = Object.entries(departmentCount).map(([dept, count]) => ({
      type: dept,
      value: count
    }));

    return { rawData: data, chartData, type: 'staff' };
  };

  const renderChart = (data) => {
    if (!data.chartData || data.chartData.length === 0) {
      return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No data available for visualization</div>;
    }

    const config = {
      data: data.chartData,
      xField: 'type',
      yField: 'value',
      seriesField: 'type',
      legend: { position: 'top-left' },
    };

    return <Bar {...config} />;
  };

  // Filter employees based on search
  const filteredEmployees = allEmployees.filter(employee =>
    employee.first_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    employee.last_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchText.toLowerCase()) ||
    employee.role?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table Columns
  const approvalColumns = [
    {
      title: 'Request Details',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary">{record.description}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Submitted: {dayjs(record.created_at).format('DD/MM/YYYY HH:mm')}
          </Text>
        </Space>
      )
    },
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.employee_role}</Text>
          <Tag color="blue">{record.employee?.department}</Tag>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'leave' ? 'blue' : 'green'} style={{ fontWeight: 'bold' }}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Duration/Amount',
      key: 'details',
      render: (_, record) => (
        <Text strong>
          {record.type === 'leave' ? `${record.duration} days` : `$${record.amount}`}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Approve Request"
            description="Are you sure you want to approve this request?"
            onConfirm={() => handleApproval(record.type, record.leaveid || record.loanrequestid, 'approved')}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
            >
              Approve
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Reject Request"
            description="Are you sure you want to reject this request?"
            onConfirm={() => handleApproval(record.type, record.leaveid || record.loanrequestid, 'rejected')}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              size="small" 
              icon={<CloseCircleOutlined />}
            >
              Reject
            </Button>
          </Popconfirm>
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
        <Progress 
          percent={value} 
          status={value >= 90 ? 'success' : value >= 80 ? 'active' : 'exception'} 
          style={{ width: 120 }} 
        />
      )
    },
    {
      title: 'Growth',
      dataIndex: 'growth',
      key: 'growth',
      render: (value) => (
        <Space>
          <Text strong style={{ color: value >= 10 ? '#52c41a' : '#faad14' }}>{value}%</Text>
          <ArrowUpOutlined style={{ color: value >= 10 ? '#52c41a' : '#faad14' }} />
        </Space>
      )
    },
    {
      title: 'Revenue Contribution',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value) => `$${value.toLocaleString()}`
    }
  ];

  const meetingColumns = [
    {
      title: 'Meeting Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.type}</Text>
        </Space>
      )
    },
    {
      title: 'Date & Time',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'scheduled' ? 'blue' : status === 'completed' ? 'green' : 'red'}>
          {status.toUpperCase()}
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
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedMeeting(record);
              editMeetingForm.setFieldsValue({
                topic: record.topic,
                description: record.description,
                date: dayjs(record.date),
                location: record.location,
                type: record.type,
                status: record.status
              });
              setIsEditMeetingModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Meeting"
            description="Are you sure you want to delete this meeting?"
            onConfirm={() => deleteMeeting(record.meetingid)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              type="link" 
              size="small" 
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
        </Space>
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
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'blue'}>
          {priority.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : 'orange'}>
          {status.toUpperCase()}
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
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedTask(record);
              editTaskForm.setFieldsValue({
                title: record.title,
                description: record.description,
                priority: record.priority,
                type: record.type,
                due_date: dayjs(record.due_date),
                status: record.status
              });
              setIsEditTaskModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Task"
            description="Are you sure you want to delete this task?"
            onConfirm={() => deleteTask(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              type="link" 
              size="small" 
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
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
            <Space>
              <Button 
                type="default" 
                icon={<ReloadOutlined />} 
                onClick={initializeDashboard}
                style={{ color: 'white', borderColor: 'white' }}
              >
                Refresh
              </Button>
              <Text style={{ color: 'white' }}>
                Executive Overview • {dayjs().format('MMMM YYYY')}
              </Text>
            </Space>
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
        action={
          <Space>
            <Button size="small" onClick={() => setActiveTab('dashboard')}>
              Dashboard
            </Button>
            <Button size="small" onClick={() => setActiveTab('approvals')}>
              Pending Approvals ({pendingApprovals.length})
            </Button>
          </Space>
        }
      />

      {/* Main Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
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
                  title={
                    <Space>
                      <TrophyOutlined style={{ color: '#faad14' }} />
                      Strategic Goals
                    </Space>
                  }
                  extra={
                    <Button 
                      type="link" 
                      icon={<PlusOutlined />}
                      onClick={() => setIsAddGoalModalVisible(true)}
                    >
                      Add Goal
                    </Button>
                  }
                  loading={loading}
                >
                  <List
                    dataSource={strategicGoals}
                    renderItem={goal => (
                      <List.Item
                        actions={[
                          <Button 
                            type="link" 
                            icon={<EditOutlined />}
                            onClick={() => {
                              setSelectedGoal(goal);
                              goalForm.setFieldsValue({
                                goal_name: goal.goal_name,
                                description: goal.description,
                                year: goal.year,
                                quarter: goal.quarter,
                                target_value: goal.target_value,
                                current_value: goal.current_value,
                                achieved: goal.achieved,
                                weight: goal.weight
                              });
                              setIsEditGoalModalVisible(true);
                            }}
                          />,
                          <Popconfirm
                            title="Delete Goal"
                            description="Are you sure you want to delete this goal?"
                            onConfirm={() => deleteStrategicGoal(goal.goal_id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button type="link" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          title={goal.goal_name}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>{goal.description}</Text>
                              <Progress 
                                percent={Math.round((goal.current_value / goal.target_value) * 100)} 
                                status={goal.achieved ? 'success' : 'active'}
                                style={{ marginTop: 8, width: '200px' }}
                              />
                              <Text type="secondary">
                                Progress: {goal.current_value} / {goal.target_value} • Q{goal.quarter} {goal.year}
                              </Text>
                            </Space>
                          }
                        />
                        <Tag color={goal.achieved ? 'green' : 'blue'}>
                          {goal.achieved ? 'Achieved' : 'In Progress'}
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
                      View All ({pendingApprovals.length})
                    </Button>
                  }
                >
                  {pendingApprovals.length > 0 ? (
                    <Table
                      dataSource={pendingApprovals.slice(0, 5)}
                      columns={approvalColumns}
                      pagination={false}
                      size="small"
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      <CheckCircleOutlined style={{ fontSize: '24px', marginBottom: 8 }} />
                      <div>No pending approvals</div>
                    </div>
                  )}
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
          <TabPane tab={`Approvals (${pendingApprovals.length})`} key="approvals">
            <Card
              title="Pending Approvals"
              extra={
                <Space>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      reportForm.setFieldsValue({
                        report_type: 'leave',
                        period: 'month'
                      });
                      setIsReportModalVisible(true);
                    }}
                  >
                    Generate Report
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />}
                    onClick={fetchPendingApprovals}
                  >
                    Refresh
                  </Button>
                </Space>
              }
            >
              {pendingApprovals.length > 0 ? (
                <Table
                  dataSource={pendingApprovals}
                  columns={approvalColumns}
                  pagination={{ pageSize: 10 }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <CheckCircleOutlined style={{ fontSize: '48px', marginBottom: 16 }} />
                  <div style={{ fontSize: '16px' }}>No pending approvals</div>
                  <Text type="secondary">All requests have been processed</Text>
                </div>
              )}
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
                            { type: 'financial', name: 'Financial Report', icon: <FundOutlined />, color: '#1890ff' },
                            { type: 'performance', name: 'Performance Report', icon: <BarChartOutlined />, color: '#52c41a' },
                            { type: 'salary', name: 'Salary Report', icon: <DollarOutlined />, color: '#faad14' },
                            { type: 'attendance', name: 'Attendance Report', icon: <CalendarOutlined />, color: '#722ed1' },
                            { type: 'staff', name: 'Staff Report', icon: <TeamOutlined />, color: '#fa541c' },
                            { type: 'kpi', name: 'KPI Report', icon: <LineChartOutlined />, color: '#13c2c2' }
                          ].map(report => (
                            <Button 
                              key={report.type}
                              icon={report.icon}
                              block
                              style={{ 
                                textAlign: 'left',
                                borderColor: report.color,
                                color: report.color
                              }}
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
                        {reports.length > 0 ? (
                          <List
                            dataSource={reports}
                            renderItem={report => (
                              <List.Item
                                actions={[
                                  <Button 
                                    type="link" 
                                    icon={<DownloadOutlined />} 
                                    size="small"
                                    onClick={() => {
                                      // Simulate download
                                      message.info(`Downloading ${report.name}...`);
                                    }}
                                  >
                                    Download
                                  </Button>
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={<Avatar icon={<FileTextOutlined />} />}
                                  title={report.name}
                                  description={
                                    <Space direction="vertical" size={0}>
                                      <Text>Type: {report.type} | Format: {report.format}</Text>
                                      <Text type="secondary">
                                        Created: {dayjs(report.created_at).format('DD/MM/YYYY HH:mm')}
                                      </Text>
                                    </Space>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                            <FileTextOutlined style={{ fontSize: '24px', marginBottom: 8 }} />
                            <div>No reports generated yet</div>
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>

                  {reportData.chartData && (
                    <Card title="Report Visualization" style={{ marginTop: 16 }}>
                      <Row gutter={[16, 16]}>
                        <Col span={16}>
                          {renderChart(reportData)}
                        </Col>
                        <Col span={8}>
                          <Card title="Report Summary" size="small">
                            <List
                              dataSource={reportData.chartData.slice(0, 10)}
                              renderItem={item => (
                                <List.Item>
                                  <Text>{item.type}:</Text>
                                  <Text strong>
                                    {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                                  </Text>
                                </List.Item>
                              )}
                            />
                            {reportData.rawData && (
                              <div style={{ marginTop: 16 }}>
                                <Text type="secondary">
                                  Total Records: {reportData.rawData.length}
                                </Text>
                              </div>
                            )}
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
              {/* Employee Management */}
              <Col span={12}>
                <Card 
                  title="Employee Management"
                  extra={
                    <Space>
                      <Input
                        placeholder="Search employees..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 200 }}
                      />
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
                    dataSource={searchText ? filteredEmployees : allEmployees.slice(0, 6)}
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
                              promotionForm.setFieldsValue({
                                employee_id: employee.empid,
                                current_position: employee.role,
                                department: employee.department
                              });
                              setIsPromotionModalVisible(true);
                            }}
                          >
                            Promote
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar src={employee.avatarurl} icon={<TeamOutlined />} />}
                          title={`${employee.first_name} ${employee.last_name}`}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>{employee.role}</Text>
                              <Tag color="blue">{employee.department}</Tag>
                              <Text type="secondary">KPI: {employee.kpiscore || 'N/A'}</Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>

                {/* Task Management */}
                <Card 
                  title="Task Management"
                  style={{ marginTop: 16 }}
                  extra={
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setIsTaskModalVisible(true)}
                    >
                      Assign Task
                    </Button>
                  }
                >
                  <Table
                    dataSource={tasks}
                    columns={taskColumns}
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </Card>
              </Col>

              {/* Meeting Management */}
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
                  <Table
                    dataSource={meetings}
                    columns={meetingColumns}
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </Card>

                {/* Quick Actions */}
                <Card title="Quick Actions" style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button 
                      icon={<FileTextOutlined />}
                      block
                      onClick={() => {
                        reportForm.setFieldsValue({ report_type: 'financial', period: 'quarter' });
                        setIsReportModalVisible(true);
                      }}
                    >
                      Generate Financial Report
                    </Button>
                    <Button 
                      icon={<TeamOutlined />}
                      block
                      onClick={() => {
                        reportForm.setFieldsValue({ report_type: 'performance', period: 'month' });
                        setIsReportModalVisible(true);
                      }}
                    >
                      Generate Performance Report
                    </Button>
                    <Button 
                      icon={<BarChartOutlined />}
                      block
                      onClick={() => {
                        reportForm.setFieldsValue({ report_type: 'kpi', period: 'month' });
                        setIsReportModalVisible(true);
                      }}
                    >
                      Generate KPI Report
                    </Button>
                  </Space>
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
        onOk={() => taskForm.submit()}
        width={600}
      >
        <Form form={taskForm} layout="vertical" onFinish={assignTask}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true, message: 'Please enter task title' }]}>
            <Input placeholder="Enter task title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Enter task description" />
          </Form.Item>
          <Form.Item name="assignee_id" label="Assignee" rules={[{ required: true, message: 'Please select assignee' }]}>
            <Select placeholder="Select employee">
              {allEmployees.map(employee => (
                <Option key={employee.empid} value={employee.empid}>
                  {employee.first_name} {employee.last_name} ({employee.department})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="due_date" label="Due Date" rules={[{ required: true, message: 'Please select due date' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="medium">
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>
          <Form.Item name="type" label="Task Type" initialValue="general">
            <Select>
              <Option value="general">General</Option>
              <Option value="urgent">Urgent</Option>
              <Option value="strategic">Strategic</Option>
              <Option value="operational">Operational</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        title="Edit Task"
        open={isEditTaskModalVisible}
        onCancel={() => {
          setIsEditTaskModalVisible(false);
          editTaskForm.resetFields();
          setSelectedTask(null);
        }}
        onOk={() => editTaskForm.submit()}
        width={600}
      >
        <Form form={editTaskForm} layout="vertical" onFinish={updateTask}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>
          <Form.Item name="type" label="Task Type" rules={[{ required: true }]}>
            <Select>
              <Option value="general">General</Option>
              <Option value="urgent">Urgent</Option>
              <Option value="strategic">Strategic</Option>
              <Option value="operational">Operational</Option>
            </Select>
          </Form.Item>
          <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
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
        width={600}
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
        confirmLoading={loading}
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
                  {employee.first_name} {employee.last_name} ({employee.department})
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

      {/* Schedule Meeting Modal */}
      <Modal
        title="Schedule New Meeting"
        open={isMeetingModalVisible}
        onCancel={() => {
          setIsMeetingModalVisible(false);
          meetingForm.resetFields();
        }}
        onOk={() => meetingForm.submit()}
        width={600}
      >
        <Form form={meetingForm} layout="vertical" onFinish={scheduleMeeting}>
          <Form.Item name="topic" label="Meeting Topic" rules={[{ required: true }]}>
            <Input placeholder="Enter meeting topic" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Enter meeting description" />
          </Form.Item>
          <Form.Item name="date" label="Date & Time" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true }]}>
            <Input placeholder="Enter meeting location" />
          </Form.Item>
          <Form.Item name="type" label="Meeting Type" initialValue="executive">
            <Select>
              <Option value="executive">Executive</Option>
              <Option value="department">Department</Option>
              <Option value="team">Team</Option>
              <Option value="client">Client</Option>
              <Option value="strategic">Strategic</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Meeting Modal */}
      <Modal
        title="Edit Meeting"
        open={isEditMeetingModalVisible}
        onCancel={() => {
          setIsEditMeetingModalVisible(false);
          editMeetingForm.resetFields();
          setSelectedMeeting(null);
        }}
        onOk={() => editMeetingForm.submit()}
        width={600}
      >
        <Form form={editMeetingForm} layout="vertical" onFinish={updateMeeting}>
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
          <Form.Item name="type" label="Meeting Type" rules={[{ required: true }]}>
            <Select>
              <Option value="executive">Executive</Option>
              <Option value="department">Department</Option>
              <Option value="team">Team</Option>
              <Option value="client">Client</Option>
              <Option value="strategic">Strategic</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="scheduled">Scheduled</Option>
              <Option value="ongoing">Ongoing</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
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
        width={600}
      >
        <Form 
          form={promotionForm} 
          layout="vertical" 
          onFinish={promoteEmployee}
        >
          <Form.Item name="employee_id" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee to promote">
              {allEmployees.map(employee => (
                <Option key={employee.empid} value={employee.empid}>
                  {employee.first_name} {employee.last_name} - {employee.role} ({employee.department})
                </Option>
              ))}
            </Select>
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
            <InputNumber 
              min={0} 
              max={100} 
              style={{ width: '100%' }} 
              placeholder="Enter percentage increase" 
            />
          </Form.Item>
          <Form.Item name="promotion_reason" label="Promotion Reason">
            <TextArea rows={4} placeholder="Justification for promotion" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Strategic Goal Modal */}
      <Modal
        title="Add Strategic Goal"
        open={isAddGoalModalVisible}
        onCancel={() => {
          setIsAddGoalModalVisible(false);
          goalForm.resetFields();
        }}
        onOk={() => goalForm.submit()}
        width={600}
      >
        <Form form={goalForm} layout="vertical" onFinish={addStrategicGoal}>
          <Form.Item name="goal_name" label="Goal Name" rules={[{ required: true }]}>
            <Input placeholder="Enter goal name" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Enter goal description" />
          </Form.Item>
          <Form.Item name="year" label="Year" rules={[{ required: true }]}>
            <InputNumber 
              min={2020} 
              max={2030} 
              style={{ width: '100%' }} 
              placeholder="Enter year" 
            />
          </Form.Item>
          <Form.Item name="quarter" label="Quarter" rules={[{ required: true }]}>
            <Select>
              <Option value={1}>Q1</Option>
              <Option value={2}>Q2</Option>
              <Option value={3}>Q3</Option>
              <Option value={4}>Q4</Option>
            </Select>
          </Form.Item>
          <Form.Item name="target_value" label="Target Value" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Enter target value" />
          </Form.Item>
          <Form.Item name="current_value" label="Current Value" initialValue={0}>
            <InputNumber style={{ width: '100%' }} placeholder="Enter current value" />
          </Form.Item>
          <Form.Item name="weight" label="Weight" initialValue={1}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Strategic Goal Modal */}
      <Modal
        title="Edit Strategic Goal"
        open={isEditGoalModalVisible}
        onCancel={() => {
          setIsEditGoalModalVisible(false);
          goalForm.resetFields();
          setSelectedGoal(null);
        }}
        onOk={() => goalForm.submit()}
        width={600}
      >
        <Form form={goalForm} layout="vertical" onFinish={updateStrategicGoal}>
          <Form.Item name="goal_name" label="Goal Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="year" label="Year" rules={[{ required: true }]}>
            <InputNumber min={2020} max={2030} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="quarter" label="Quarter" rules={[{ required: true }]}>
            <Select>
              <Option value={1}>Q1</Option>
              <Option value={2}>Q2</Option>
              <Option value={3}>Q3</Option>
              <Option value={4}>Q4</Option>
            </Select>
          </Form.Item>
          <Form.Item name="target_value" label="Target Value" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="current_value" label="Current Value" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="weight" label="Weight" rules={[{ required: true }]}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="achieved" label="Achieved" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CEODashboard;