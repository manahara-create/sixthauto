import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Table, Button, Space, Tag,
  Modal, Form, Input, Select, DatePicker, message, Tabs,
  Descriptions, Alert, Progress, List, Avatar, Divider,
  Tooltip, Popconfirm, InputNumber, Switch, Upload, Radio,
  Timeline, Badge, Drawer, Collapse, Tree, Cascader, TimePicker,
  Steps, Rate, Slider, Checkbox
} from 'antd';
import {
  TeamOutlined, UserOutlined, SettingOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined,
  PlusOutlined, BarChartOutlined, DatabaseOutlined,
  MailOutlined, PhoneOutlined, CalendarOutlined,
  DollarOutlined, PieChartOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SyncOutlined,
  RocketOutlined, GiftOutlined, CalculatorOutlined,
  BankOutlined, CrownOutlined, SecurityScanOutlined,
  AuditOutlined, FundOutlined, BarChartOutlined as ChartOutlined,
  UploadOutlined, InboxOutlined, StarOutlined,
  ClockCircleOutlined, EnvironmentOutlined, IdcardOutlined,
  SolutionOutlined, TrophyOutlined, RiseOutlined,
  FallOutlined, PercentageOutlined, MoneyCollectOutlined,
  FilterOutlined, DownloadOutlined, FileExcelOutlined, FileWordOutlined
} from '@ant-design/icons';

import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocTable, TableCell, TableRow, TextRun } from 'docx';
import { saveAs } from 'file-saver';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Step } = Steps;
const { Dragger } = Upload;
const { RangePicker } = DatePicker;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [systemStats, setSystemStats] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  
  // Date Range State
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  
  // Modal states
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [isEditUserModalVisible, setIsEditUserModalVisible] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState(false);
  const [isSalaryModalVisible, setIsSalaryModalVisible] = useState(false);
  const [isLoanModalVisible, setIsLoanModalVisible] = useState(false);
  const [isKPIModalVisible, setIsKPIModalVisible] = useState(false);
  const [isEpfEtfModalVisible, setIsEpfEtfModalVisible] = useState(false);
  const [isTrainingModalVisible, setIsTrainingModalVisible] = useState(false);
  const [isPromotionModalVisible, setIsPromotionModalVisible] = useState(false);
  const [isBonusModalVisible, setIsBonusModalVisible] = useState(false);
  const [isIncrementModalVisible, setIsIncrementModalVisible] = useState(false);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [isEmployeeDetailVisible, setIsEmployeeDetailVisible] = useState(false);
  const [isDateRangeModalVisible, setIsDateRangeModalVisible] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Forms
  const [userForm] = Form.useForm();
  const [editUserForm] = Form.useForm();
  const [leaveForm] = Form.useForm();
  const [attendanceForm] = Form.useForm();
  const [salaryForm] = Form.useForm();
  const [loanForm] = Form.useForm();
  const [kpiForm] = Form.useForm();
  const [epfEtfForm] = Form.useForm();
  const [trainingForm] = Form.useForm();
  const [promotionForm] = Form.useForm();
  const [bonusForm] = Form.useForm();
  const [incrementForm] = Form.useForm();
  const [taskForm] = Form.useForm();
  const [meetingForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [dateRangeForm] = Form.useForm();

  // Data states
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [trainingRequests, setTrainingRequests] = useState([]);
  const [promotionRequests, setPromotionRequests] = useState([]);
  const [epfEtfData, setEpfEtfData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        await Promise.all([
          fetchSystemStats(),
          fetchAllEmployees(),
          fetchDepartments(),
          fetchRecentActivities(),
          fetchLeaveRequests(),
          fetchLoanRequests(),
          fetchAttendanceData(),
          fetchSalaryData(),
          fetchKPIData(),
          fetchTrainingRequests(),
          fetchPromotionRequests(),
          fetchEpfEtfData(),
          fetchPerformanceData(),
          fetchLeaveTypes(),
          fetchLoanTypes(),
          fetchTasks(),
          fetchMeetings()
        ]);
      }
    } catch (error) {
      console.error('Error initializing admin dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Data fetching functions with date range
  const fetchSystemStats = async () => {
    try {
      const { data: employees } = await supabase
        .from('employee')
        .select('*')
        .eq('is_active', true);

      const { data: pendingLeaves } = await supabase
        .from('employeeleave')
        .select('*')
        .eq('leavestatus', 'pending');

      const { data: departments } = await supabase
        .from('departments')
        .select('*');

      const { data: loans } = await supabase
        .from('loanrequest')
        .select('*')
        .eq('status', 'pending');

      const today = dayjs().format('YYYY-MM-DD');
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);

      const activeEmployees = employees?.filter(e => e.status === 'Active').length || 0;
      const totalDepartments = departments?.length || 0;
      const pendingLoans = loans?.length || 0;
      const todayAttendance = attendance || [];

      setSystemStats({
        totalEmployees: employees?.length || 0,
        activeEmployees,
        departments: totalDepartments,
        pendingLeaves: pendingLeaves?.length || 0,
        pendingLoans,
        todayPresent: todayAttendance.filter(a => a.status === 'Present').length,
        systemHealth: 95,
        storageUsed: 65,
        newHires: employees?.filter(e => {
          const joinDate = dayjs(e.created_at);
          const monthAgo = dayjs().subtract(1, 'month');
          return joinDate >= monthAgo;
        }).length || 0
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setAllEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('departmentname');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('leavetype')
        .select('*')
        .order('leavetype');

      if (error) throw error;
      setLeaveTypes(data || []);
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const fetchLoanTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('loantype')
        .select('*')
        .order('loantype');

      if (error) throw error;
      setLoanTypes(data || []);
    } catch (error) {
      console.error('Error fetching loan types:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('employeeleave')
        .select(`
          *,
          employee:empid (full_name, department),
          leavetype:leavetypeid (leavetype)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('loanrequest')
        .select(`
          *,
          employee:empid (full_name, department),
          loantype:loantypeid (loantype)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoanRequests(data || []);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchSalaryData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('salarydate', startDate)
        .lte('salarydate', endDate)
        .order('salarydate', { ascending: false });

      if (error) throw error;
      setSalaryData(data || []);
    } catch (error) {
      console.error('Error fetching salary data:', error);
    }
  };

  const fetchKPIData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('kpi')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('calculatedate', startDate)
        .lte('calculatedate', endDate)
        .order('calculatedate', { ascending: false });

      if (error) throw error;
      setKpiData(data || []);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  const fetchTrainingRequests = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('training')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setTrainingRequests(data || []);
    } catch (error) {
      console.error('Error fetching training requests:', error);
    }
  };

  const fetchPromotionRequests = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('promotion')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('promotiondate', startDate)
        .lte('promotiondate', endDate)
        .order('promotiondate', { ascending: false });

      if (error) throw error;
      setPromotionRequests(data || []);
    } catch (error) {
      console.error('Error fetching promotion requests:', error);
    }
  };

  const fetchEpfEtfData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('epfnetf')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('applieddate', startDate)
        .lte('applieddate', endDate)
        .order('applieddate', { ascending: false });

      if (error) throw error;
      setEpfEtfData(data || []);
    } catch (error) {
      console.error('Error fetching EPF/ETF data:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('performance_rating')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('rating_date', startDate)
        .lte('rating_date', endDate)
        .order('rating_date', { ascending: false });

      if (error) throw error;
      setPerformanceData(data || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('meeting')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  // Export Functions
  const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${fileName}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
      message.success(`${fileName} exported successfully!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export to Excel');
    }
  };

  const exportToWord = async (data, fileName, title) => {
    try {
      const tableRows = [
        new TableRow({
          children: Object.keys(data[0] || {}).map(key => 
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: key, bold: true })] })]
            })
          )
        }),
        ...data.map(item => 
          new TableRow({
            children: Object.values(item).map(value => 
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(value || '') })] })]
              })
            )
          })
        )
      ];

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: title, bold: true, size: 32 })]
            }),
            new Paragraph({
              children: [new TextRun({ 
                text: `Date Range: ${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`,
                size: 24 
              })]
            }),
            new Paragraph({ text: "" }),
            new DocTable({
              rows: tableRows,
            })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileName}_${dayjs().format('YYYY-MM-DD')}.docx`);
      message.success(`${fileName} exported successfully!`);
    } catch (error) {
      console.error('Error exporting to Word:', error);
      message.error('Failed to export to Word');
    }
  };

  // Report Generation Functions
  const generateReport = async (type) => {
    try {
      message.info(`Generating ${type} report...`);
      
      let reportData = [];
      let fileName = '';
      let title = '';

      switch (type) {
        case 'staff':
          reportData = allEmployees.map(emp => ({
            'Employee ID': emp.empid,
            'Full Name': emp.full_name,
            'Email': emp.email,
            'Phone': emp.phone,
            'Role': emp.role,
            'Department': emp.department,
            'Status': emp.status,
            'Basic Salary': `LKR ${emp.basicsalary?.toLocaleString() || '0'}`,
            'Join Date': dayjs(emp.created_at).format('MMM D, YYYY')
          }));
          fileName = 'Staff_Report';
          title = 'Staff Report';
          break;

        case 'salary':
          reportData = salaryData.map(salary => ({
            'Employee': salary.employee?.full_name || 'N/A',
            'Department': salary.employee?.department || 'N/A',
            'Basic Salary': `LKR ${salary.basicsalary?.toLocaleString() || '0'}`,
            'OT Pay': `LKR ${salary.otpay?.toLocaleString() || '0'}`,
            'Bonus Pay': `LKR ${salary.bonuspay?.toLocaleString() || '0'}`,
            'Increment Pay': `LKR ${salary.incrementpay?.toLocaleString() || '0'}`,
            'Total Salary': `LKR ${salary.totalsalary?.toLocaleString() || '0'}`,
            'Salary Date': salary.salarydate
          }));
          fileName = 'Salary_Report';
          title = 'Salary Report';
          break;

        case 'attendance':
          reportData = attendanceData.map(att => ({
            'Employee': att.employee?.full_name || 'N/A',
            'Department': att.employee?.department || 'N/A',
            'Date': att.date,
            'In Time': att.intime,
            'Out Time': att.outtime,
            'Status': att.status
          }));
          fileName = 'Attendance_Report';
          title = 'Attendance Report';
          break;

        case 'financial':
          reportData = [
            ...salaryData.map(s => ({
              'Type': 'Salary',
              'Employee': s.employee?.full_name || 'N/A',
              'Amount': s.totalsalary,
              'Date': s.salarydate
            })),
            ...loanRequests.map(l => ({
              'Type': 'Loan',
              'Employee': l.employee?.full_name || 'N/A',
              'Amount': l.amount,
              'Status': l.status,
              'Date': l.date
            })),
            ...epfEtfData.map(e => ({
              'Type': 'EPF/ETF',
              'Employee': e.employee?.full_name || 'N/A',
              'EPF': e.epfcalculation,
              'ETF': e.etfcalculation,
              'Date': e.applieddate
            }))
          ];
          fileName = 'Financial_Report';
          title = 'Financial Report';
          break;

        case 'leave':
          reportData = leaveRequests.map(leave => ({
            'Employee': leave.employee?.full_name || 'N/A',
            'Leave Type': leave.leavetype?.leavetype || 'N/A',
            'From Date': leave.leavefromdate,
            'To Date': leave.leavetodate,
            'Duration': `${leave.duration} days`,
            'Status': leave.leavestatus,
            'Reason': leave.leavereason
          }));
          fileName = 'Leave_Report';
          title = 'Leave Report';
          break;

        default:
          message.error('Unknown report type');
          return;
      }

      // Show export options
      Modal.confirm({
        title: `Export ${title}`,
        content: `Choose export format for ${title}`,
        okText: 'Excel (XLSX)',
        cancelText: 'Word (DOCX)',
        onOk: () => exportToExcel(reportData, fileName),
        onCancel: () => exportToWord(reportData, fileName, title)
      });

    } catch (error) {
      console.error('Error generating report:', error);
      message.error(error.message || 'Failed to generate report');
    }
  };

  // Handler functions (CRUD operations)
  const handleAddUser = async (values) => {
    try {
      const employeeData = {
        full_name: `${values.first_name} ${values.last_name}`,
        email: values.email,
        role: values.role,
        department: values.department,
        phone: values.phone,
        gender: values.gender,
        empaddress: values.address,
        status: 'Active',
        is_active: true,
        basicsalary: values.basicsalary || 0,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employee')
        .insert([employeeData])
        .select();

      if (error) throw error;

      // Create auth user record
      await supabase
        .from('auth_users')
        .insert([{
          email: values.email,
          role: values.role,
          is_active: true,
          full_name: employeeData.full_name
        }]);

      message.success('User created successfully!');
      setIsAddUserModalVisible(false);
      userForm.resetFields();
      fetchAllEmployees();
      fetchSystemStats();
    } catch (error) {
      console.error('Error adding user:', error);
      message.error(error.message || 'Failed to add user');
    }
  };

  const handleEditUser = async (values) => {
    try {
      if (!selectedEmployee) return;

      const updates = {
        full_name: `${values.first_name} ${values.last_name}`,
        email: values.email,
        role: values.role,
        department: values.department,
        phone: values.phone,
        gender: values.gender,
        empaddress: values.address,
        status: values.status,
        is_active: values.is_active,
        basicsalary: values.basicsalary || 0,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('employee')
        .update(updates)
        .eq('empid', selectedEmployee.empid);

      if (error) throw error;

      // Update auth user
      await supabase
        .from('auth_users')
        .update({
          email: values.email,
          role: values.role,
          is_active: values.is_active,
          full_name: updates.full_name
        })
        .eq('email', selectedEmployee.email);

      message.success('User updated successfully!');
      setIsEditUserModalVisible(false);
      setSelectedEmployee(null);
      fetchAllEmployees();
    } catch (error) {
      console.error('Error updating user:', error);
      message.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (employee) => {
    try {
      const { error } = await supabase
        .from('employee')
        .update({ is_active: false, status: 'Inactive' })
        .eq('empid', employee.empid);

      if (error) throw error;

      // Deactivate auth user
      await supabase
        .from('auth_users')
        .update({ is_active: false })
        .eq('email', employee.email);

      message.success('User deactivated successfully!');
      fetchAllEmployees();
      fetchSystemStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error(error.message || 'Failed to delete user');
    }
  };

  const handleApplyLeaveForUser = async (values) => {
    try {
      const leaveData = {
        empid: values.empid,
        leavetypeid: values.leavetypeid,
        leavefromdate: values.leavefromdate.format('YYYY-MM-DD'),
        leavetodate: values.leavetodate.format('YYYY-MM-DD'),
        leavereason: values.leavereason,
        leavestatus: 'approved',
        approvedby: user?.id,
        duration: values.leavetodate.diff(values.leavefromdate, 'day') + 1,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('employeeleave')
        .insert([leaveData]);

      if (error) throw error;

      message.success('Leave applied successfully!');
      setIsLeaveModalVisible(false);
      leaveForm.resetFields();
      fetchLeaveRequests();
      fetchSystemStats();
    } catch (error) {
      console.error('Error applying leave:', error);
      message.error('Failed to apply leave');
    }
  };

  const handleMarkAttendance = async (values) => {
    try {
      const attendanceData = {
        empid: values.empid,
        date: values.date.format('YYYY-MM-DD'),
        intime: values.intime.format('HH:mm'),
        outtime: values.outtime ? values.outtime.format('HH:mm') : null,
        status: values.status,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('attendance')
        .insert([attendanceData]);

      if (error) throw error;

      message.success('Attendance marked successfully!');
      setIsAttendanceModalVisible(false);
      attendanceForm.resetFields();
      fetchAttendanceData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      message.error('Failed to mark attendance');
    }
  };

  const handleProcessSalary = async (values) => {
    try {
      const totalSalary = values.basicsalary + (values.otpay || 0) + (values.incrementpay || 0) + (values.bonuspay || 0);
      
      const salaryData = {
        empid: values.empid,
        basicsalary: values.basicsalary,
        otpay: values.otpay || 0,
        incrementpay: values.incrementpay || 0,
        bonuspay: values.bonuspay || 0,
        totalsalary: totalSalary,
        salarydate: values.salarydate.format('YYYY-MM-DD'),
        processed_by: user?.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('salary')
        .insert([salaryData]);

      if (error) throw error;

      message.success('Salary processed successfully!');
      setIsSalaryModalVisible(false);
      salaryForm.resetFields();
      fetchSalaryData();
    } catch (error) {
      console.error('Error processing salary:', error);
      message.error('Failed to process salary');
    }
  };

  const handleProcessLoan = async (values) => {
    try {
      const loanData = {
        empid: values.empid,
        loantypeid: values.loantypeid,
        amount: values.amount,
        duration: values.duration,
        interestrate: values.interestrate,
        date: values.date.format('YYYY-MM-DD'),
        status: 'approved',
        processedby: user?.id,
        processedat: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('loanrequest')
        .insert([loanData]);

      if (error) throw error;

      message.success('Loan processed successfully!');
      setIsLoanModalVisible(false);
      loanForm.resetFields();
      fetchLoanRequests();
      fetchSystemStats();
    } catch (error) {
      console.error('Error processing loan:', error);
      message.error('Failed to process loan');
    }
  };

  const handleUpdateKPI = async (values) => {
    try {
      const kpiData = {
        empid: values.empid,
        kpivalue: values.kpivalue,
        calculatedate: values.calculatedate.format('YYYY-MM-DD'),
        kpiyear: values.calculatedate.year(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('kpi')
        .insert([kpiData]);

      if (error) throw error;

      message.success('KPI updated successfully!');
      setIsKPIModalVisible(false);
      kpiForm.resetFields();
      fetchKPIData();
    } catch (error) {
      console.error('Error updating KPI:', error);
      message.error('Failed to update KPI');
    }
  };

  const handleCalculateEPFETF = async (values) => {
    try {
      const epfEtfData = {
        empid: values.empid,
        basicsalary: values.basicsalary,
        epfcalculation: values.basicsalary * 0.08,
        etfcalculation: values.basicsalary * 0.03,
        applieddate: new Date().toISOString(),
        processedby: user?.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('epfnetf')
        .insert([epfEtfData]);

      if (error) throw error;

      message.success('EPF/ETF calculated successfully!');
      setIsEpfEtfModalVisible(false);
      epfEtfForm.resetFields();
      fetchEpfEtfData();
    } catch (error) {
      console.error('Error calculating EPF/ETF:', error);
      message.error('Failed to calculate EPF/ETF');
    }
  };

  const handleAddTraining = async (values) => {
    try {
      const trainingData = {
        empid: values.empid,
        topic: values.topic,
        trainer: values.trainer,
        venue: values.venue,
        duration: values.duration,
        date: values.date.format('YYYY-MM-DD'),
        status: 'scheduled',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('training')
        .insert([trainingData]);

      if (error) throw error;

      message.success('Training scheduled successfully!');
      setIsTrainingModalVisible(false);
      trainingForm.resetFields();
      fetchTrainingRequests();
    } catch (error) {
      console.error('Error scheduling training:', error);
      message.error('Failed to schedule training');
    }
  };

  const handleProcessPromotion = async (values) => {
    try {
      const promotionData = {
        empid: values.empid,
        oldposition: values.oldposition,
        newposition: values.newposition,
        promotiondate: values.promotiondate.format('YYYY-MM-DD'),
        salaryincrease: values.salaryincrease,
        department: values.department,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('promotion')
        .insert([promotionData]);

      if (error) throw error;

      message.success('Promotion processed successfully!');
      setIsPromotionModalVisible(false);
      promotionForm.resetFields();
      fetchPromotionRequests();
    } catch (error) {
      console.error('Error processing promotion:', error);
      message.error('Failed to process promotion');
    }
  };

  const handleAddBonus = async (values) => {
    try {
      const bonusData = {
        empid: values.empid,
        type: values.type,
        reason: values.reason,
        amount: values.amount,
        bonusdate: values.bonusdate.format('YYYY-MM-DD'),
        processedby: user?.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bonus')
        .insert([bonusData]);

      if (error) throw error;

      message.success('Bonus added successfully!');
      setIsBonusModalVisible(false);
      bonusForm.resetFields();
    } catch (error) {
      console.error('Error adding bonus:', error);
      message.error('Failed to add bonus');
    }
  };

  const handleProcessIncrement = async (values) => {
    try {
      const incrementData = {
        empid: values.empid,
        percentage: values.percentage,
        amount: values.amount,
        lastincrementdate: values.lastincrementdate.format('YYYY-MM-DD'),
        nextincrementdate: values.nextincrementdate.format('YYYY-MM-DD'),
        approval: 'approved',
        processed_by: user?.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('increment')
        .insert([incrementData]);

      if (error) throw error;

      message.success('Increment processed successfully!');
      setIsIncrementModalVisible(false);
      incrementForm.resetFields();
    } catch (error) {
      console.error('Error processing increment:', error);
      message.error('Failed to process increment');
    }
  };

  const handleAddTask = async (values) => {
    try {
      const taskData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        type: values.type,
        due_date: values.due_date.format('YYYY-MM-DD'),
        status: 'pending',
        assignee_id: values.assignee_id,
        created_by: user?.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tasks')
        .insert([taskData]);

      if (error) throw error;

      message.success('Task added successfully!');
      setIsTaskModalVisible(false);
      taskForm.resetFields();
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      message.error('Failed to add task');
    }
  };

  const handleScheduleMeeting = async (values) => {
    try {
      const meetingData = {
        topic: values.topic,
        description: values.description,
        date: values.date.format('YYYY-MM-DD'),
        starttime: values.starttime.format('HH:mm'),
        endtime: values.endtime.format('HH:mm'),
        location: values.location,
        type: values.type,
        status: 'scheduled',
        empid: user?.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('meeting')
        .insert([meetingData]);

      if (error) throw error;

      message.success('Meeting scheduled successfully!');
      setIsMeetingModalVisible(false);
      meetingForm.resetFields();
      fetchMeetings();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      message.error('Failed to schedule meeting');
    }
  };

  const handleSubmitFeedback = async (values) => {
    try {
      const feedbackData = {
        empid: values.empid,
        feedback_type: values.feedback_type,
        subject: values.subject,
        message: values.message,
        rating: values.rating,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('employee_feedback')
        .insert([feedbackData]);

      if (error) throw error;

      message.success('Feedback submitted successfully!');
      setIsFeedbackModalVisible(false);
      feedbackForm.resetFields();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
    }
  };

  const handleUpdateDateRange = async (values) => {
    try {
      const { dateRange: newDateRange } = values;
      setDateRange(newDateRange);
      setIsDateRangeModalVisible(false);
      dateRangeForm.resetFields();
      
      message.info('Updating data for new date range...');
      
      // Refetch all data with new date range
      await Promise.all([
        fetchRecentActivities(),
        fetchLeaveRequests(),
        fetchLoanRequests(),
        fetchAttendanceData(),
        fetchSalaryData(),
        fetchKPIData(),
        fetchTrainingRequests(),
        fetchPromotionRequests(),
        fetchEpfEtfData(),
        fetchPerformanceData(),
        fetchTasks(),
        fetchMeetings()
      ]);
      
      message.success('Data updated for selected date range!');
    } catch (error) {
      console.error('Error updating date range:', error);
      message.error('Failed to update date range');
    }
  };

  const handleViewEmployeeDetails = async (employee) => {
    try {
      setSelectedEmployeeDetail(employee);
      setIsEmployeeDetailVisible(true);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      message.error('Failed to load employee details');
    }
  };

  // Search and filter functions
  const searchEmployees = (searchTerm) => {
    if (!searchTerm) return allEmployees;
    
    const term = searchTerm.toLowerCase();
    return allEmployees.filter(emp => 
      emp.full_name?.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term) ||
      emp.department?.toLowerCase().includes(term) ||
      emp.role?.toLowerCase().includes(term)
    );
  };

  // Table columns
  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department) => <Tag color="blue">{department}</Tag>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color={role === 'admin' ? 'red' : 'green'}>{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status === 'Active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {status}
        </Tag>
      ),
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (salary) => `LKR ${salary?.toLocaleString() || '0'}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewEmployeeDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => {
                setSelectedEmployee(record);
                editUserForm.setFieldsValue({
                  first_name: record.full_name?.split(' ')[0] || '',
                  last_name: record.full_name?.split(' ').slice(1).join(' ') || '',
                  email: record.email,
                  role: record.role,
                  department: record.department,
                  phone: record.phone,
                  gender: record.gender,
                  address: record.empaddress,
                  status: record.status,
                  is_active: record.is_active,
                  basicsalary: record.basicsalary
                });
                setIsEditUserModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure to deactivate this user?"
            onConfirm={() => handleDeleteUser(record)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Deactivate">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const leaveColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee_name',
    },
    {
      title: 'Leave Type',
      dataIndex: ['leavetype', 'leavetype'],
      key: 'leavetype',
    },
    {
      title: 'From Date',
      dataIndex: 'leavefromdate',
      key: 'leavefromdate',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'To Date',
      dataIndex: 'leavetodate',
      key: 'leavetodate',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} days`,
    },
    {
      title: 'Status',
      dataIndex: 'leavestatus',
      key: 'leavestatus',
      render: (status) => {
        const statusColors = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red'
        };
        return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Reason',
      dataIndex: 'leavereason',
      key: 'leavereason',
      ellipsis: true,
    },
  ];

  const loanColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee_name',
    },
    {
      title: 'Loan Type',
      dataIndex: ['loantype', 'loantype'],
      key: 'loantype',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `LKR ${amount?.toLocaleString() || '0'}`,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} months`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red'
        };
        return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Applied Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
  ];

  // Render components
  const renderOverview = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Employees"
            value={systemStats.totalEmployees || 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Employees"
            value={systemStats.activeEmployees || 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Departments"
            value={systemStats.departments || 0}
            prefix={<DatabaseOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Pending Leaves"
            value={systemStats.pendingLeaves || 0}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Pending Loans"
            value={systemStats.pendingLoans || 0}
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#fa541c' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Today Present"
            value={systemStats.todayPresent || 0}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#13c2c2' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="System Health"
            value={systemStats.systemHealth || 0}
            suffix="%"
            prefix={<PieChartOutlined />}
            valueStyle={{ color: '#eb2f96' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="New Hires (30d)"
            value={systemStats.newHires || 0}
            prefix={<RocketOutlined />}
            valueStyle={{ color: '#a0d911' }}
          />
        </Card>
      </Col>

      {/* Recent Activities */}
      <Col span={24}>
        <Card 
          title="Recent Activities" 
          extra={
            <Button 
              type="link" 
              icon={<FilterOutlined />}
              onClick={() => setIsDateRangeModalVisible(true)}
            >
              Date Range
            </Button>
          }
        >
          <List
            dataSource={recentActivities}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<AuditOutlined />} />}
                  title={item.action}
                  description={
                    <Space direction="vertical" size={0}>
                      <div>Table: {item.table_name}</div>
                      <div>Time: {dayjs(item.created_at).format('MMM D, YYYY HH:mm')}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        IP: {item.ip_address}
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderEmployeeManagement = () => (
    <Card
      title="Employee Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsAddUserModalVisible(true)}
          >
            Add Employee
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('staff')}
          >
            Export Staff
          </Button>
        </Space>
      }
    >
      <Table
        columns={employeeColumns}
        dataSource={allEmployees}
        rowKey="empid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const renderLeaveManagement = () => (
    <Card
      title="Leave Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsLeaveModalVisible(true)}
          >
            Apply Leave
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('leave')}
          >
            Export Report
          </Button>
        </Space>
      }
    >
      <Table
        columns={leaveColumns}
        dataSource={leaveRequests}
        rowKey="leaveid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const renderLoanManagement = () => (
    <Card
      title="Loan Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsLoanModalVisible(true)}
          >
            Process Loan
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('financial')}
          >
            Export Report
          </Button>
        </Space>
      }
    >
      <Table
        columns={loanColumns}
        dataSource={loanRequests}
        rowKey="loanrequestid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const renderAttendanceManagement = () => (
    <Card
      title="Attendance Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsAttendanceModalVisible(true)}
          >
            Mark Attendance
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('attendance')}
          >
            Export Report
          </Button>
        </Space>
      }
    >
      <Table
        columns={[
          {
            title: 'Employee',
            dataIndex: ['employee', 'full_name'],
            key: 'employee_name',
          },
          {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format('MMM D, YYYY'),
          },
          {
            title: 'In Time',
            dataIndex: 'intime',
            key: 'intime',
          },
          {
            title: 'Out Time',
            dataIndex: 'outtime',
            key: 'outtime',
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={status === 'Present' ? 'green' : 'red'}>{status}</Tag>,
          },
        ]}
        dataSource={attendanceData}
        rowKey="attendanceid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const renderSalaryManagement = () => (
    <Card
      title="Salary Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsSalaryModalVisible(true)}
          >
            Process Salary
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('salary')}
          >
            Export Report
          </Button>
        </Space>
      }
    >
      <Table
        columns={[
          {
            title: 'Employee',
            dataIndex: ['employee', 'full_name'],
            key: 'employee_name',
          },
          {
            title: 'Basic Salary',
            dataIndex: 'basicsalary',
            key: 'basicsalary',
            render: (salary) => `LKR ${salary?.toLocaleString() || '0'}`,
          },
          {
            title: 'OT Pay',
            dataIndex: 'otpay',
            key: 'otpay',
            render: (pay) => `LKR ${pay?.toLocaleString() || '0'}`,
          },
          {
            title: 'Bonus Pay',
            dataIndex: 'bonuspay',
            key: 'bonuspay',
            render: (pay) => `LKR ${pay?.toLocaleString() || '0'}`,
          },
          {
            title: 'Total Salary',
            dataIndex: 'totalsalary',
            key: 'totalsalary',
            render: (salary) => `LKR ${salary?.toLocaleString() || '0'}`,
          },
          {
            title: 'Salary Date',
            dataIndex: 'salarydate',
            key: 'salarydate',
            render: (date) => dayjs(date).format('MMM D, YYYY'),
          },
        ]}
        dataSource={salaryData}
        rowKey="salaryid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  // Modal forms
  const renderAddUserModal = () => (
    <Modal
      title="Add New Employee"
      open={isAddUserModalVisible}
      onCancel={() => {
        setIsAddUserModalVisible(false);
        userForm.resetFields();
      }}
      onOk={() => userForm.submit()}
      width={700}
    >
      <Form form={userForm} layout="vertical" onFinish={handleAddUser}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: 'Please enter first name' }]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: 'Please enter last name' }]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter valid email' }
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select role' }]}
            >
              <Select placeholder="Select role">
                <Option value="employee">Employee</Option>
                <Option value="manager">Manager</Option>
                <Option value="admin">Admin</Option>
                <Option value="hr">HR</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Please select department' }]}
            >
              <Select placeholder="Select department">
                {departments.map(dept => (
                  <Option key={dept.departmentid} value={dept.departmentname}>
                    {dept.departmentname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Please select gender' }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="basicsalary"
              label="Basic Salary"
              rules={[{ required: true, message: 'Please enter basic salary' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter basic salary"
                min={0}
                formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/LKR\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Please enter address' }]}
        >
          <TextArea placeholder="Enter address" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderEditUserModal = () => (
    <Modal
      title="Edit Employee"
      open={isEditUserModalVisible}
      onCancel={() => {
        setIsEditUserModalVisible(false);
        setSelectedEmployee(null);
        editUserForm.resetFields();
      }}
      onOk={() => editUserForm.submit()}
      width={700}
    >
      <Form form={editUserForm} layout="vertical" onFinish={handleEditUser}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: 'Please enter first name' }]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: 'Please enter last name' }]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter valid email' }
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select role' }]}
            >
              <Select placeholder="Select role">
                <Option value="employee">Employee</Option>
                <Option value="manager">Manager</Option>
                <Option value="admin">Admin</Option>
                <Option value="hr">HR</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Please select department' }]}
            >
              <Select placeholder="Select department">
                {departments.map(dept => (
                  <Option key={dept.departmentid} value={dept.departmentname}>
                    {dept.departmentname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Please select gender' }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="basicsalary"
              label="Basic Salary"
              rules={[{ required: true, message: 'Please enter basic salary' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter basic salary"
                min={0}
                formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/LKR\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="is_active"
              label="Active Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Please enter address' }]}
        >
          <TextArea placeholder="Enter address" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderLeaveModal = () => (
    <Modal
      title="Apply Leave"
      open={isLeaveModalVisible}
      onCancel={() => {
        setIsLeaveModalVisible(false);
        leaveForm.resetFields();
      }}
      onOk={() => leaveForm.submit()}
      width={600}
    >
      <Form form={leaveForm} layout="vertical" onFinish={handleApplyLeaveForUser}>
        <Form.Item
          name="empid"
          label="Employee"
          rules={[{ required: true, message: 'Please select employee' }]}
        >
          <Select placeholder="Select employee" showSearch optionFilterProp="children">
            {allEmployees.filter(emp => emp.is_active).map(emp => (
              <Option key={emp.empid} value={emp.empid}>
                {emp.full_name} - {emp.department}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="leavetypeid"
          label="Leave Type"
          rules={[{ required: true, message: 'Please select leave type' }]}
        >
          <Select placeholder="Select leave type">
            {leaveTypes.map(type => (
              <Option key={type.leavetypeid} value={type.leavetypeid}>
                {type.leavetype} (Max: {type.max_days} days)
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="leavefromdate"
              label="From Date"
              rules={[{ required: true, message: 'Please select from date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="leavetodate"
              label="To Date"
              rules={[{ required: true, message: 'Please select to date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="leavereason"
          label="Reason"
          rules={[{ required: true, message: 'Please enter reason' }]}
        >
          <TextArea placeholder="Enter leave reason" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderDateRangeModal = () => (
    <Modal
      title="Select Date Range"
      open={isDateRangeModalVisible}
      onCancel={() => {
        setIsDateRangeModalVisible(false);
        dateRangeForm.resetFields();
      }}
      onOk={() => dateRangeForm.submit()}
    >
      <Form form={dateRangeForm} layout="vertical" onFinish={handleUpdateDateRange}>
        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Please select date range' }]}
          initialValue={dateRange}
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderEmployeeDetailDrawer = () => (
    <Drawer
      title="Employee Details"
      placement="right"
      width={600}
      onClose={() => {
        setIsEmployeeDetailVisible(false);
        setSelectedEmployeeDetail(null);
      }}
      open={isEmployeeDetailVisible}
    >
      {selectedEmployeeDetail && (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Full Name">
            {selectedEmployeeDetail.full_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {selectedEmployeeDetail.email}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {selectedEmployeeDetail.phone}
          </Descriptions.Item>
          <Descriptions.Item label="Role">
            <Tag color="blue">{selectedEmployeeDetail.role}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {selectedEmployeeDetail.department}
          </Descriptions.Item>
          <Descriptions.Item label="Gender">
            {selectedEmployeeDetail.gender}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={selectedEmployeeDetail.status === 'Active' ? 'green' : 'red'}>
              {selectedEmployeeDetail.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Basic Salary">
            LKR {selectedEmployeeDetail.basicsalary?.toLocaleString() || '0'}
          </Descriptions.Item>
          <Descriptions.Item label="Address">
            {selectedEmployeeDetail.empaddress}
          </Descriptions.Item>
          <Descriptions.Item label="Join Date">
            {dayjs(selectedEmployeeDetail.created_at).format('MMM D, YYYY')}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
          Admin Dashboard
        </h1>
        <p style={{ margin: 0, color: '#666' }}>
          Welcome back! Manage your HR system efficiently.
        </p>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <BarChartOutlined />
                  Overview
                </span>
              ),
              children: renderOverview(),
            },
            {
              key: 'employees',
              label: (
                <span>
                  <TeamOutlined />
                  Employee Management
                </span>
              ),
              children: renderEmployeeManagement(),
            },
            {
              key: 'leave',
              label: (
                <span>
                  <CalendarOutlined />
                  Leave Management
                </span>
              ),
              children: renderLeaveManagement(),
            },
            {
              key: 'loans',
              label: (
                <span>
                  <DollarOutlined />
                  Loan Management
                </span>
              ),
              children: renderLoanManagement(),
            },
            {
              key: 'attendance',
              label: (
                <span>
                  <ClockCircleOutlined />
                  Attendance
                </span>
              ),
              children: renderAttendanceManagement(),
            },
            {
              key: 'salary',
              label: (
                <span>
                  <MoneyCollectOutlined />
                  Salary Management
                </span>
              ),
              children: renderSalaryManagement(),
            },
          ]}
        />
      </Card>

      {/* Modals */}
      {renderAddUserModal()}
      {renderEditUserModal()}
      {renderLeaveModal()}
      {renderDateRangeModal()}
      {renderEmployeeDetailDrawer()}
    </div>
  );
};

export default AdminDashboard;