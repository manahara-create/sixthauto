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
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocTable, TableCell, TableRow } from 'docx';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;
const { RangePicker } = DatePicker;

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

  // Export Functions
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
            children: [new Paragraph({ text: key, bold: true })]
          })
        )
      }),
      ...data.map(row => 
        new TableRow({
          children: Object.values(row).map(value => 
            new TableCell({
              children: [new Paragraph({ text: String(value || '') })]
            })
          )
        })
      )
    ];

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: title, heading: "Heading1" }),
          new DocTable({
            rows: tableRows
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Report Generation Functions
  const generateReport = async (values) => {
    try {
      setLoading(true);
      const reportConfig = {
        type: values.report_type,
        startDate: values.date_range?.[0]?.format('YYYY-MM-DD') || dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
        endDate: values.date_range?.[1]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
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

      // Export based on format
      if (values.format === 'xlsx') {
        exportToExcel(reportData.rawData, `${values.report_type}_report_${dayjs().format('YYYYMMDD_HHmmss')}`, values.report_type);
      } else if (values.format === 'docx') {
        await exportToWord(reportData.rawData, `${values.report_type}_report_${dayjs().format('YYYYMMDD_HHmmss')}`, `${values.report_type} Report`);
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
      .gte('salarydate', config.startDate)
      .lte('salarydate', config.endDate);

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
      .gte('date', config.startDate)
      .lte('date', config.endDate);

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
      .gte('leavefromdate', config.startDate)
      .lte('leavetodate', config.endDate);

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

  // Table Columns (rest of the columns remain the same as in your original code)
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
      render: (record) => (
        <Text strong style={{ color: record.type === 'loan' ? '#f50' : '#52c41a' }}>
          {record.type === 'leave' ? `${record.duration} days` : `$${record.amount}`}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
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

  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'first_name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {record.first_name?.[0]}{record.last_name?.[0]}
          </Avatar>
          <div>
            <Text strong>{record.first_name} {record.last_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.role}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept}</Tag>
    },
    {
      title: 'KPI Score',
      dataIndex: 'kpiscore',
      key: 'kpiscore',
      render: (score) => (
        <Progress
          percent={score || 0}
          size="small"
          status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={status === 'Active' ? 'success' : 'default'}
          text={status}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Tooltip title="Give Feedback">
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={() => {
                setSelectedEmployee(record);
                setIsFeedbackModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Promote">
            <Button
              size="small"
              icon={<CrownOutlined />}
              onClick={() => {
                setSelectedEmployee(record);
                setIsPromotionModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const meetingColumns = [
    {
      title: 'Meeting',
      dataIndex: 'topic',
      key: 'topic',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
        </Space>
      )
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (record) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(record.date).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.starttime} - {record.endtime}
          </Text>
        </Space>
      )
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
      render: (record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedMeeting(record);
              editMeetingForm.setFieldsValue({
                topic: record.topic,
                description: record.description,
                date: dayjs(record.date),
                end_time: dayjs(record.endtime, 'HH:mm:ss'),
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
            title="Are you sure to delete this meeting?"
            onConfirm={() => deleteMeeting(record.meetingid)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
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
      key: 'assignee',
      render: (record) => (
        <Text>{record.assignee?.first_name} {record.assignee?.last_name}</Text>
      )
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
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
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
      render: (record) => (
        <Space>
          <Button
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
            title="Are you sure to delete this task?"
            onConfirm={() => deleteTask(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const goalColumns = [
    {
      title: 'Goal',
      dataIndex: 'goal_name',
      key: 'goal_name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
        </Space>
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (record) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress
            percent={Math.round((record.current_value / record.target_value) * 100)}
            status={record.achieved ? 'success' : 'active'}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.current_value} / {record.target_value}
          </Text>
        </Space>
      )
    },
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      render: (quarter) => `Q${quarter} ${dayjs().year()}`
    },
    {
      title: 'Status',
      key: 'status',
      render: (record) => (
        <Tag color={record.achieved ? 'success' : 'processing'}>
          {record.achieved ? 'ACHIEVED' : 'IN PROGRESS'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedGoal(record);
              goalForm.setFieldsValue({
                goal_name: record.goal_name,
                description: record.description,
                year: record.year,
                quarter: record.quarter,
                target_value: record.target_value,
                current_value: record.current_value,
                achieved: record.achieved,
                weight: record.weight
              });
              setIsEditGoalModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this goal?"
            onConfirm={() => deleteStrategicGoal(record.goal_id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  <CrownOutlined style={{ marginRight: 12, color: '#faad14' }} />
                  CEO Dashboard
                </Title>
                <Text type="secondary">Welcome back, {profile?.first_name} {profile?.last_name}</Text>
              </Col>
              <Col>
                <Space>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => setIsReportModalVisible(true)}
                  >
                    Generate Report
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={initializeDashboard}
                  >
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Key Metrics */}
        <Col span={24}>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Employees"
                  value={companyMetrics.totalEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Company Revenue"
                  value={companyMetrics.companyRevenue}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                  formatter={value => `$${(value / 1000).toFixed(0)}k`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Profit Margin"
                  value={companyMetrics.profitMargin}
                  suffix="%"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Customer Satisfaction"
                  value={companyMetrics.customerSatisfaction}
                  prefix={<StarOutlined />}
                  precision={1}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Main Content */}
        <Col span={24}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              {/* Dashboard Tab */}
              <TabPane tab="Dashboard" key="dashboard">
                <Row gutter={[24, 24]}>
                  <Col span={24}>
                    <Title level={4}>Strategic Goals Progress</Title>
                    <Row gutter={[24, 24]}>
                      {strategicGoals.map(goal => (
                        <Col xs={24} sm={12} lg={8} key={goal.goal_id}>
                          <Card>
                            <div style={{ marginBottom: 16 }}>
                              <Text strong>{goal.goal_name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {goal.description}
                              </Text>
                            </div>
                            <Progress
                              percent={Math.round((goal.current_value / goal.target_value) * 100)}
                              status={goal.achieved ? 'success' : 'active'}
                            />
                            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                              <Text type="secondary">
                                {goal.current_value} / {goal.target_value}
                              </Text>
                              <Tag color={goal.achieved ? 'success' : 'processing'}>
                                {goal.achieved ? 'Achieved' : 'In Progress'}
                              </Tag>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title="Department Performance">
                      <Bar
                        data={departmentPerformance}
                        xField="performance"
                        yField="department"
                        seriesField="department"
                        isStack={true}
                        legend={{ position: 'top-left' }}
                      />
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title="Financial Overview">
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Market Share"
                            value={financialOverview.marketShare}
                            suffix="%"
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Employee Retention"
                            value={financialOverview.employeeRetention}
                            suffix="%"
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Revenue Growth"
                            value={financialOverview.revenueGrowth}
                            suffix="%"
                            valueStyle={{ color: '#faad14' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Operating Margin"
                            value={financialOverview.operatingMargin}
                            suffix="%"
                            valueStyle={{ color: '#eb2f96' }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              {/* Approvals Tab */}
              <TabPane tab="Pending Approvals" key="approvals">
                <Table
                  columns={approvalColumns}
                  dataSource={pendingApprovals}
                  rowKey={record => record.leaveid || record.loanrequestid}
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>

              {/* Employees Tab */}
              <TabPane tab="Employees" key="employees">
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Input
                      placeholder="Search employees by name, department, or role..."
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                    />
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => exportToExcel(allEmployees, 'employees_report', 'Employees')}
                      >
                        Export to Excel
                      </Button>
                      <Button
                        icon={<FileTextOutlined />}
                        onClick={() => exportToWord(allEmployees, 'employees_report', 'Employees Report')}
                      >
                        Export to Word
                      </Button>
                    </Space>
                  </Col>
                </Row>
                <Table
                  columns={employeeColumns}
                  dataSource={filteredEmployees}
                  rowKey="empid"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>

              {/* Meetings Tab */}
              <TabPane tab="Meetings" key="meetings">
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsMeetingModalVisible(true)}
                  >
                    Schedule Meeting
                  </Button>
                </div>
                <Table
                  columns={meetingColumns}
                  dataSource={meetings}
                  rowKey="meetingid"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>

              {/* Tasks Tab */}
              <TabPane tab="Tasks" key="tasks">
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsTaskModalVisible(true)}
                  >
                    Assign Task
                  </Button>
                </div>
                <Table
                  columns={taskColumns}
                  dataSource={tasks}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>

              {/* Strategic Goals Tab */}
              <TabPane tab="Strategic Goals" key="goals">
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddGoalModalVisible(true)}
                  >
                    Add Goal
                  </Button>
                </div>
                <Table
                  columns={goalColumns}
                  dataSource={strategicGoals}
                  rowKey="goal_id"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>

              {/* Reports Tab */}
              <TabPane tab="Reports" key="reports">
                <Row gutter={[24, 24]}>
                  <Col span={24}>
                    <Card title="Recent Reports">
                      <List
                        dataSource={reports}
                        renderItem={report => (
                          <List.Item
                            actions={[
                              <Button
                                key="download"
                                type="link"
                                icon={<DownloadOutlined />}
                                onClick={() => {
                                  if (report.format === 'xlsx') {
                                    exportToExcel([report], report.name, 'Report');
                                  } else if (report.format === 'docx') {
                                    exportToWord([report], report.name, report.name);
                                  }
                                }}
                              >
                                Download
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                              title={report.name}
                              description={
                                <Space direction="vertical" size={0}>
                                  <Text>Type: {report.type}</Text>
                                  <Text>Format: {report.format}</Text>
                                  <Text>Created: {dayjs(report.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <Modal
        title="Assign Task"
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
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Enter task description" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignee_id" label="Assignee" rules={[{ required: true }]}>
                <Select placeholder="Select employee">
                  {allEmployees.map(emp => (
                    <Option key={emp.empid} value={emp.empid}>
                      {emp.first_name} {emp.last_name} - {emp.role}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select placeholder="Select priority">
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}>
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Task Type">
                <Select placeholder="Select task type">
                  <Option value="general">General</Option>
                  <Option value="urgent">Urgent</Option>
                  <Option value="strategic">Strategic</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Assign Task
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        title="Give Employee Feedback"
        open={isFeedbackModalVisible}
        onCancel={() => {
          setIsFeedbackModalVisible(false);
          feedbackForm.resetFields();
          setSelectedEmployee(null);
        }}
        footer={null}
        width={500}
      >
        {selectedEmployee && (
          <Form form={feedbackForm} layout="vertical" onFinish={giveFeedback}>
            <Form.Item label="Employee">
              <Input
                value={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                disabled
              />
            </Form.Item>
            <Form.Item name="feedback_type" label="Feedback Type" rules={[{ required: true }]}>
              <Select placeholder="Select feedback type">
                <Option value="positive">Positive</Option>
                <Option value="constructive">Constructive</Option>
                <Option value="developmental">Developmental</Option>
              </Select>
            </Form.Item>
            <Form.Item name="rating" label="Rating (1-5)" rules={[{ required: true }]}>
              <InputNumber min={1} max={5} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="feedback" label="Feedback" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="Enter your feedback..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Submit Feedback
              </Button>
            </Form.Item>
          </Form>
        )}
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
        width={600}
      >
        <Form form={reportForm} layout="vertical" onFinish={generateReport}>
          <Form.Item name="report_type" label="Report Type" rules={[{ required: true }]}>
            <Select placeholder="Select report type">
              <Option value="salary">Salary Report</Option>
              <Option value="attendance">Attendance Report</Option>
              <Option value="leave">Leave Report</Option>
              <Option value="kpi">KPI Report</Option>
              <Option value="financial">Financial Report</Option>
              <Option value="performance">Performance Report</Option>
              <Option value="staff">Staff Report</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date_range" label="Date Range">
            <RangePicker
              style={{ width: '100%' }}
              defaultValue={[dayjs().subtract(7, 'days'), dayjs()]}
            />
          </Form.Item>
          <Form.Item name="format" label="Export Format" rules={[{ required: true }]}>
            <Select placeholder="Select export format">
              <Option value="xlsx">Excel (.xlsx)</Option>
              <Option value="docx">Word (.docx)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="employee_id" label="Employee (Optional)">
            <Select placeholder="Select specific employee" allowClear>
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name} - {emp.role}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Generate & Export Report
            </Button>
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
        footer={null}
        width={600}
      >
        <Form form={meetingForm} layout="vertical" onFinish={scheduleMeeting}>
          <Form.Item name="topic" label="Meeting Topic" rules={[{ required: true }]}>
            <Input placeholder="Enter meeting topic" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Enter meeting description" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date & Start Time" rules={[{ required: true }]}>
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="End Time">
                <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="Location" rules={[{ required: true }]}>
                <Input placeholder="Meeting location" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Meeting Type" rules={[{ required: true }]}>
                <Select placeholder="Select meeting type">
                  <Option value="strategy">Strategy</Option>
                  <Option value="review">Review</Option>
                  <Option value="planning">Planning</Option>
                  <Option value="general">General</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Schedule Meeting
            </Button>
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
        footer={null}
        width={600}
      >
        {selectedMeeting && (
          <Form form={editMeetingForm} layout="vertical" onFinish={updateMeeting}>
            <Form.Item name="topic" label="Meeting Topic" rules={[{ required: true }]}>
              <Input placeholder="Enter meeting topic" />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <TextArea rows={3} placeholder="Enter meeting description" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="date" label="Date & Start Time" rules={[{ required: true }]}>
                  <DatePicker
                    style={{ width: '100%' }}
                    showTime
                    format="YYYY-MM-DD HH:mm"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="end_time" label="End Time">
                  <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="location" label="Location" rules={[{ required: true }]}>
                  <Input placeholder="Meeting location" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="type" label="Meeting Type" rules={[{ required: true }]}>
                  <Select placeholder="Select meeting type">
                    <Option value="strategy">Strategy</Option>
                    <Option value="review">Review</Option>
                    <Option value="planning">Planning</Option>
                    <Option value="general">General</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select placeholder="Select status">
                <Option value="scheduled">Scheduled</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update Meeting
              </Button>
            </Form.Item>
          </Form>
        )}
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
        footer={null}
        width={600}
      >
        {selectedTask && (
          <Form form={editTaskForm} layout="vertical" onFinish={updateTask}>
            <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
              <Input placeholder="Enter task title" />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="Enter task description" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                  <Select placeholder="Select priority">
                    <Option value="low">Low</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="high">High</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="type" label="Task Type">
                  <Select placeholder="Select task type">
                    <Option value="general">General</Option>
                    <Option value="urgent">Urgent</Option>
                    <Option value="strategic">Strategic</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}>
                  <DatePicker
                    style={{ width: '100%' }}
                    showTime
                    format="YYYY-MM-DD HH:mm"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                  <Select placeholder="Select status">
                    <Option value="pending">Pending</Option>
                    <Option value="in_progress">In Progress</Option>
                    <Option value="completed">Completed</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update Task
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Add Goal Modal */}
      <Modal
        title="Add Strategic Goal"
        open={isAddGoalModalVisible}
        onCancel={() => {
          setIsAddGoalModalVisible(false);
          goalForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={goalForm} layout="vertical" onFinish={addStrategicGoal}>
          <Form.Item name="goal_name" label="Goal Name" rules={[{ required: true }]}>
            <Input placeholder="Enter goal name" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Enter goal description" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="year" label="Year" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={2023}
                  max={2030}
                  defaultValue={dayjs().year()}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quarter" label="Quarter" rules={[{ required: true }]}>
                <Select placeholder="Select quarter">
                  <Option value={1}>Q1</Option>
                  <Option value={2}>Q2</Option>
                  <Option value={3}>Q3</Option>
                  <Option value={4}>Q4</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="target_value" label="Target Value" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="current_value" label="Current Value">
                <InputNumber style={{ width: '100%' }} min={0} defaultValue={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="weight" label="Weight" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={10}
              defaultValue={1}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Goal
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        title="Edit Strategic Goal"
        open={isEditGoalModalVisible}
        onCancel={() => {
          setIsEditGoalModalVisible(false);
          goalForm.resetFields();
          setSelectedGoal(null);
        }}
        footer={null}
        width={600}
      >
        {selectedGoal && (
          <Form form={goalForm} layout="vertical" onFinish={updateStrategicGoal}>
            <Form.Item name="goal_name" label="Goal Name" rules={[{ required: true }]}>
              <Input placeholder="Enter goal name" />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <TextArea rows={3} placeholder="Enter goal description" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="year" label="Year" rules={[{ required: true }]}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={2023}
                    max={2030}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="quarter" label="Quarter" rules={[{ required: true }]}>
                  <Select placeholder="Select quarter">
                    <Option value={1}>Q1</Option>
                    <Option value={2}>Q2</Option>
                    <Option value={3}>Q3</Option>
                    <Option value={4}>Q4</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="target_value" label="Target Value" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="current_value" label="Current Value">
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="weight" label="Weight" rules={[{ required: true }]}>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={10}
              />
            </Form.Item>
            <Form.Item name="achieved" label="Achieved" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update Goal
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Promotion Modal */}
      <Modal
        title="Promote Employee"
        open={isPromotionModalVisible}
        onCancel={() => {
          setIsPromotionModalVisible(false);
          promotionForm.resetFields();
          setSelectedEmployee(null);
        }}
        footer={null}
        width={600}
      >
        {selectedEmployee && (
          <Form form={promotionForm} layout="vertical" onFinish={promoteEmployee}>
            <Form.Item name="employee_id" initialValue={selectedEmployee.empid}>
              <Input type="hidden" />
            </Form.Item>
            <Form.Item label="Current Employee">
              <Input
                value={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                disabled
              />
            </Form.Item>
            <Form.Item label="Current Position">
              <Input value={selectedEmployee.role} disabled />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="current_position" label="Current Position" initialValue={selectedEmployee.role}>
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="new_position" label="New Position" rules={[{ required: true }]}>
                  <Input placeholder="Enter new position" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                  <Select placeholder="Select department">
                    <Option value="AUTOMOTIVE">Automotive</Option>
                    <Option value="SALES">Sales</Option>
                    <Option value="MARKETING">Marketing</Option>
                    <Option value="DEVELOPMENT">Development</Option>
                    <Option value="HR">HR</Option>
                    <Option value="FINANCE">Finance</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="salary_increase" label="Salary Increase ($)" rules={[{ required: true }]}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Enter amount"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Promote Employee
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default CEODashboard;