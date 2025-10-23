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
  FallOutlined, PercentageOutlined, MoneyCollectOutlined
} from '@ant-design/icons';

import DB from '../../services/databaseService';
import { DatabaseService as GenericDB } from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';
import ReportService from '../../services/reportServices';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Step } = Steps;
const { Dragger } = Upload;

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  
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
    } catch (error) {
      console.error('Error initializing admin dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Data fetching functions
  const fetchSystemStats = async () => {
    try {
      const employees = await DB.getEmployees();
      const pendingLeaves = await DB.getPendingLeaves();
      const departments = await DB.getDepartments();
      const loans = await GenericDB.getData('loanrequest');
      const attendance = await GenericDB.getData('attendance');

      const activeEmployees = employees.filter(e => e.status === 'Active').length;
      const totalDepartments = departments.length;
      const pendingLoans = loans.filter(l => l.status === 'pending').length;
      const todayAttendance = attendance.filter(a => a.date === dayjs().format('YYYY-MM-DD'));

      setSystemStats({
        totalEmployees: employees.length,
        activeEmployees,
        departments: totalDepartments,
        pendingLeaves: pendingLeaves.length,
        pendingLoans,
        todayPresent: todayAttendance.filter(a => a.status === 'Present').length,
        systemHealth: 95,
        storageUsed: 65,
        newHires: employees.filter(e => {
          const joinDate = new Date(e.created_at);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return joinDate >= monthAgo;
        }).length
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const employees = await DB.getEmployees();
      setAllEmployees(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await DB.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const data = await GenericDB.getData('leavetype');
      setLeaveTypes(data);
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const fetchLoanTypes = async () => {
    try {
      const data = await GenericDB.getData('loantype');
      setLoanTypes(data);
    } catch (error) {
      console.error('Error fetching loan types:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activities = await GenericDB.getData('audit_logs', { limit: 10, orderBy: 'created_at', order: 'desc' });
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const leaves = await GenericDB.getData('employeeleave', { orderBy: 'created_at', order: 'desc' });
      setLeaveRequests(leaves);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      const loans = await GenericDB.getData('loanrequest', { orderBy: 'created_at', order: 'desc' });
      setLoanRequests(loans);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const attendance = await GenericDB.getData('attendance', { 
        limit: 50, 
        orderBy: 'created_at', 
        order: 'desc' 
      });
      setAttendanceData(attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchSalaryData = async () => {
    try {
      const salaries = await GenericDB.getData('salary', { 
        orderBy: 'created_at', 
        order: 'desc' 
      });
      setSalaryData(salaries);
    } catch (error) {
      console.error('Error fetching salary data:', error);
    }
  };

  const fetchKPIData = async () => {
    try {
      const kpis = await GenericDB.getData('kpi', { 
        orderBy: 'calculatedate', 
        order: 'desc' 
      });
      setKpiData(kpis);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  const fetchTrainingRequests = async () => {
    try {
      const trainings = await GenericDB.getData('training', { 
        orderBy: 'created_at', 
        order: 'desc' 
      });
      setTrainingRequests(trainings);
    } catch (error) {
      console.error('Error fetching training requests:', error);
    }
  };

  const fetchPromotionRequests = async () => {
    try {
      const promotions = await GenericDB.getData('promotion', { 
        orderBy: 'created_at', 
        order: 'desc' 
      });
      setPromotionRequests(promotions);
    } catch (error) {
      console.error('Error fetching promotion requests:', error);
    }
  };

  const fetchEpfEtfData = async () => {
    try {
      const epfEtf = await GenericDB.getData('epfnetf', { 
        orderBy: 'created_at', 
        order: 'desc' 
      });
      setEpfEtfData(epfEtf);
    } catch (error) {
      console.error('Error fetching EPF/ETF data:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const performance = await GenericDB.getData('performance_rating', { 
        orderBy: 'rating_date', 
        order: 'desc' 
      });
      setPerformanceData(performance);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const tasksData = await GenericDB.getData('tasks', { 
        orderBy: 'created_at', 
        order: 'desc' 
      });
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const meetingsData = await GenericDB.getData('meeting', { 
        orderBy: 'created_at', 
        order: 'desc' 
      });
      setMeetings(meetingsData);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  // Handler functions
  const handleAddUser = async (values) => {
    try {
      const employeeData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role,
        department: values.department,
        phone: values.phone,
        gender: values.gender,
        empaddress: values.address,
        status: 'Active',
        is_active: true,
        sickleavebalance: 14,
        fulldayleavebalance: 21,
        halfdayleavebalance: 5,
        shortleavebalance: 7,
        maternityleavebalance: 84
      };

      const result = await GenericDB.insertData('employee', employeeData);

      if (result) {
        message.success('User created successfully!');
        setIsAddUserModalVisible(false);
        userForm.resetFields();
        fetchAllEmployees();
      }
    } catch (error) {
      console.error('Error adding user:', error);
      message.error(error.message || 'Failed to add user');
    }
  };

  const handleEditUser = async (values) => {
    try {
      if (!selectedEmployee) return;

      const updates = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role,
        department: values.department,
        phone: values.phone,
        gender: values.gender,
        empaddress: values.address,
        status: values.status,
        is_active: values.is_active
      };

      const updated = await GenericDB.updateData('employee', updates, { empid: selectedEmployee.empid });

      if (updated) {
        message.success('User updated successfully!');
        setIsEditUserModalVisible(false);
        setSelectedEmployee(null);
        fetchAllEmployees();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      message.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (employee) => {
    try {
      await GenericDB.deleteData('employee', { empid: employee.empid });
      message.success('User deactivated successfully!');
      fetchAllEmployees();
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
        approvedby: profile.empid,
        duration: values.leavetodate.diff(values.leavefromdate, 'day') + 1
      };

      await GenericDB.insertData('employeeleave', leaveData);
      message.success('Leave applied successfully!');
      setIsLeaveModalVisible(false);
      leaveForm.resetFields();
      fetchLeaveRequests();
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
        outtime: values.outtime.format('HH:mm'),
        status: values.status
      };

      await GenericDB.insertData('attendance', attendanceData);
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
        processed_by: profile.empid
      };

      await GenericDB.insertData('salary', salaryData);
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
        processedby: profile.empid,
        processedat: new Date()
      };

      await GenericDB.insertData('loanrequest', loanData);
      message.success('Loan processed successfully!');
      setIsLoanModalVisible(false);
      loanForm.resetFields();
      fetchLoanRequests();
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
        kpiyear: values.calculatedate.year()
      };

      await GenericDB.insertData('kpi', kpiData);
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
        applieddate: new Date(),
        processedby: profile.empid
      };

      await GenericDB.insertData('epfnetf', epfEtfData);
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
        date: values.date.format('YYYY-MM-DD')
      };

      await GenericDB.insertData('training', trainingData);
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
        department: values.department
      };

      await GenericDB.insertData('promotion', promotionData);
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
        processedby: profile.empid
      };

      await GenericDB.insertData('bonus', bonusData);
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
        percenatge: values.percentage,
        amount: values.amount,
        lastincrementdate: values.lastincrementdate.format('YYYY-MM-DD'),
        nextincrementdate: values.nextincrementdate.format('YYYY-MM-DD'),
        approval: 'approved',
        processed_by: profile.empid
      };

      await GenericDB.insertData('increment', incrementData);
      message.success('Increment processed successfully!');
      setIsIncrementModalVisible(false);
      incrementForm.resetFields();
    } catch (error) {
      console.error('Error processing increment:', error);
      message.error('Failed to process increment');
    }
  };

  const handleAssignTask = async (values) => {
    try {
      const taskData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        type: values.type,
        due_date: values.due_date.format('YYYY-MM-DD'),
        status: 'assigned',
        assignee_id: values.empid,
        created_by: profile.empid
      };

      await GenericDB.insertData('tasks', taskData);
      message.success('Task assigned successfully!');
      setIsTaskModalVisible(false);
      taskForm.resetFields();
      fetchTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      message.error('Failed to assign task');
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
        empid: values.empid
      };

      await GenericDB.insertData('meeting', meetingData);
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
        rating: values.rating,
        comments: values.comments,
        evaluator_id: profile.empid,
        rating_date: new Date()
      };

      await GenericDB.insertData('performance_rating', feedbackData);
      message.success('Feedback submitted successfully!');
      setIsFeedbackModalVisible(false);
      feedbackForm.resetFields();
      fetchPerformanceData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      await GenericDB.updateData('employeeleave', { 
        leavestatus: 'approved',
        approvedby: profile.empid
      }, { leaveid: leaveId });
      
      message.success('Leave approved successfully!');
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error approving leave:', error);
      message.error('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await GenericDB.updateData('employeeleave', { 
        leavestatus: 'rejected',
        approvedby: profile.empid
      }, { leaveid: leaveId });
      
      message.success('Leave rejected successfully!');
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      message.error('Failed to reject leave');
    }
  };

  const handleApproveLoan = async (loanId) => {
    try {
      await GenericDB.updateData('loanrequest', { 
        status: 'approved',
        processedby: profile.empid,
        processedat: new Date()
      }, { loanrequestid: loanId });
      
      message.success('Loan approved successfully!');
      fetchLoanRequests();
    } catch (error) {
      console.error('Error approving loan:', error);
      message.error('Failed to approve loan');
    }
  };

  const showEditUserModal = (employee) => {
    setSelectedEmployee(employee);
    editUserForm.setFieldsValue({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      phone: employee.phone,
      gender: employee.gender,
      address: employee.empaddress,
      status: employee.status,
      is_active: employee.is_active
    });
    setIsEditUserModalVisible(true);
  };

  const showEmployeeDetail = (employee) => {
    setSelectedEmployeeDetail(employee);
    setIsEmployeeDetailVisible(true);
  };

  const generateReport = async (type) => {
    try {
      let doc;
      switch (type) {
        case 'staff':
          doc = await ReportService.generateEmployeeReport();
          ReportService.downloadPDF(doc, 'Staff_Report');
          break;
        case 'salary':
          doc = await ReportService.generateSalaryReport({ month: dayjs().format('YYYY-MM') });
          ReportService.downloadPDF(doc, 'Salary_Report');
          break;
        case 'attendance':
          doc = await ReportService.generateAttendanceReport({ month: dayjs().format('YYYY-MM') });
          ReportService.downloadPDF(doc, 'Attendance_Report');
          break;
        case 'financial':
          doc = await ReportService.generateFinancialReport();
          ReportService.downloadPDF(doc, 'Financial_Report');
          break;
        case 'performance':
          doc = await ReportService.generatePerformanceReport();
          ReportService.downloadPDF(doc, 'Performance_Report');
          break;
        default:
          message.warning('Report type not implemented');
          return;
      }
      message.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      message.error(error.message || 'Failed to generate report');
    }
  };

  // Column definitions
  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'first_name',
      key: 'employee',
      render: (text, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} src={record.avatarurl} />
          <div>
            <Button type="link" onClick={() => showEmployeeDetail(record)}>
              {record.first_name} {record.last_name}
            </Button>
            <div style={{ fontSize: 12, color: '#888' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: dept => <Tag>{dept || 'N/A'}</Tag>
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: role => <Tag color="blue">{role}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Leave Balance',
      key: 'leave_balance',
      render: (_, record) => (
        <Tooltip title={`Sick: ${record.sickleavebalance} | Full: ${record.fulldayleavebalance} | Half: ${record.halfdayleavebalance}`}>
          <Tag color="purple">View Balance</Tag>
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => showEmployeeDetail(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => showEditUserModal(record)} />
          </Tooltip>
          <Tooltip title="Apply Leave">
            <Button icon={<CalendarOutlined />} onClick={() => {
              leaveForm.setFieldsValue({ empid: record.empid });
              setIsLeaveModalVisible(true);
            }} />
          </Tooltip>
          <Tooltip title="Mark Attendance">
            <Button icon={<CheckCircleOutlined />} onClick={() => {
              attendanceForm.setFieldsValue({ empid: record.empid });
              setIsAttendanceModalVisible(true);
            }} />
          </Tooltip>
          <Popconfirm title="Deactivate this user?" onConfirm={() => handleDeleteUser(record)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const leaveRequestColumns = [
    {
      title: 'Employee',
      dataIndex: 'empid',
      key: 'employee',
      render: (empid) => {
        const employee = allEmployees.find(e => e.empid === empid);
        return employee ? `${employee.first_name} ${employee.last_name}` : 'N/A';
      }
    },
    {
      title: 'Leave Type',
      dataIndex: 'leavetypeid',
      key: 'leavetype',
      render: (leavetypeid) => {
        const leaveType = leaveTypes.find(lt => lt.leavetypeid === leavetypeid);
        return leaveType ? leaveType.leavetype : 'N/A';
      }
    },
    {
      title: 'From - To',
      key: 'dates',
      render: (_, record) => `${record.leavefromdate} to ${record.leavetodate}`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: duration => `${duration} days`
    },
    {
      title: 'Status',
      dataIndex: 'leavestatus',
      key: 'status',
      render: status => (
        <Tag color={status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange'}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.leavestatus === 'pending' && (
            <>
              <Button size="small" type="primary" onClick={() => handleApproveLeave(record.leaveid)}>
                Approve
              </Button>
              <Button size="small" danger onClick={() => handleRejectLeave(record.leaveid)}>
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const loanRequestColumns = [
    {
      title: 'Employee',
      dataIndex: 'empid',
      key: 'employee',
      render: (empid) => {
        const employee = allEmployees.find(e => e.empid === empid);
        return employee ? `${employee.first_name} ${employee.last_name}` : 'N/A';
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => `LKR ${amount?.toLocaleString()}`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: duration => `${duration} months`
    },
    {
      title: 'Interest Rate',
      dataIndex: 'interestrate',
      key: 'interestrate',
      render: rate => `${rate}%`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange'}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => handleApproveLoan(record.loanrequestid)}>
              Approve
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Alert
        message="Super Admin Access"
        description="You have full system access including employee management, leave/attendance tracking, salary processing, loan approvals, and comprehensive reporting."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={systemStats.totalEmployees || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Employees"
              value={systemStats.activeEmployees || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Departments"
              value={systemStats.departments || 0}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Leaves"
              value={systemStats.pendingLeaves || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Card
                title="Employee Management"
                extra={
                  <Space>
                    <Button icon={<BarChartOutlined />} onClick={() => generateReport('staff')}>
                      Staff Report
                    </Button>
                    <Button icon={<BarChartOutlined />} onClick={() => generateReport('salary')}>
                      Salary Report
                    </Button>
                    <Button icon={<BarChartOutlined />} onClick={() => generateReport('attendance')}>
                      Attendance Report
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddUserModalVisible(true)}>
                      Add User
                    </Button>
                  </Space>
                }
              >
                <Table
                  rowKey="empid"
                  columns={employeeColumns}
                  dataSource={allEmployees}
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="Quick Actions" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    icon={<CalendarOutlined />} 
                    block 
                    onClick={() => setIsLeaveModalVisible(true)}
                  >
                    Apply Leave for Employee
                  </Button>
                  <Button 
                    icon={<CheckCircleOutlined />} 
                    block 
                    onClick={() => setIsAttendanceModalVisible(true)}
                  >
                    Mark Attendance
                  </Button>
                  <Button 
                    icon={<DollarOutlined />} 
                    block 
                    onClick={() => setIsSalaryModalVisible(true)}
                  >
                    Process Salary
                  </Button>
                  <Button 
                    icon={<BankOutlined />} 
                    block 
                    onClick={() => setIsLoanModalVisible(true)}
                  >
                    Manage Loans
                  </Button>
                  <Button 
                    icon={<CalculatorOutlined />} 
                    block 
                    onClick={() => setIsEpfEtfModalVisible(true)}
                  >
                    Calculate EPF/ETF
                  </Button>
                  <Button 
                    icon={<FundOutlined />} 
                    block 
                    onClick={() => setIsKPIModalVisible(true)}
                  >
                    Update KPI
                  </Button>
                  <Button 
                    icon={<RocketOutlined />} 
                    block 
                    onClick={() => setIsPromotionModalVisible(true)}
                  >
                    Process Promotion
                  </Button>
                  <Button 
                    icon={<GiftOutlined />} 
                    block 
                    onClick={() => setIsBonusModalVisible(true)}
                  >
                    Add Bonus
                  </Button>
                  <Button 
                    icon={<RiseOutlined />} 
                    block 
                    onClick={() => setIsIncrementModalVisible(true)}
                  >
                    Process Increment
                  </Button>
                  <Button 
                    icon={<SolutionOutlined />} 
                    block 
                    onClick={() => setIsTaskModalVisible(true)}
                  >
                    Assign Task
                  </Button>
                  <Button 
                    icon={<ClockCircleOutlined />} 
                    block 
                    onClick={() => setIsMeetingModalVisible(true)}
                  >
                    Schedule Meeting
                  </Button>
                  <Button 
                    icon={<StarOutlined />} 
                    block 
                    onClick={() => setIsFeedbackModalVisible(true)}
                  >
                    Give Feedback
                  </Button>
                </Space>
              </Card>
              
              <Card title="Recent Activities">
                <List
                  itemLayout="horizontal"
                  dataSource={recentActivities}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<SettingOutlined />} />}
                        title={item.action}
                        description={`${item.user_id} • ${new Date(item.created_at).toLocaleString()}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Leave Management" key="leaves">
          <Card
            title="Leave Requests"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsLeaveModalVisible(true)}>
                Apply Leave
              </Button>
            }
          >
            <Table
              rowKey="leaveid"
              columns={leaveRequestColumns}
              dataSource={leaveRequests}
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Financial" key="financial">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Loan Requests" extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsLoanModalVisible(true)}>
                  New Loan
                </Button>
              }>
                <Table
                  rowKey="loanrequestid"
                  columns={loanRequestColumns}
                  dataSource={loanRequests}
                  loading={loading}
                  pagination={{ pageSize: 5 }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Salary Processing" extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsSalaryModalVisible(true)}>
                  Process Salary
                </Button>
              }>
                <List
                  dataSource={salaryData.slice(0, 5)}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={`LKR ${item.totalsalary?.toLocaleString()}`}
                        description={`Date: ${item.salarydate}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Reports" key="reports">
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card hoverable onClick={() => generateReport('staff')}>
                <Statistic title="Staff Report" value=" " prefix={<TeamOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable onClick={() => generateReport('salary')}>
                <Statistic title="Salary Report" value=" " prefix={<DollarOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable onClick={() => generateReport('attendance')}>
                <Statistic title="Attendance Report" value=" " prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable onClick={() => generateReport('financial')}>
                <Statistic title="Financial Report" value=" " prefix={<PieChartOutlined />} />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Add User Modal */}
      <Modal
        title="Add New User"
        open={isAddUserModalVisible}
        onCancel={() => setIsAddUserModalVisible(false)}
        onOk={() => userForm.submit()}
        okText="Create"
        width={600}
      >
        <Form layout="vertical" form={userForm} onFinish={handleAddUser}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="First Name" name="first_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last Name" name="last_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                <Select>
                  <Option value="admin">Admin</Option>
                  <Option value="hr">HR</Option>
                  <Option value="manager">Manager</Option>
                  <Option value="accountant">Accountant</Option>
                  <Option value="employee">Employee</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Department" name="department" rules={[{ required: true }]}>
                <Select>
                  {departments.map(d => (
                    <Option key={d.departmentid} value={d.departmentname}>
                      {d.departmentname}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Gender" name="gender">
            <Select>
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Address" name="address">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isEditUserModalVisible}
        onCancel={() => setIsEditUserModalVisible(false)}
        onOk={() => editUserForm.submit()}
        okText="Save"
        width={600}
      >
        <Form layout="vertical" form={editUserForm} onFinish={handleEditUser}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="First Name" name="first_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last Name" name="last_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                <Select>
                  <Option value="admin">Admin</Option>
                  <Option value="hr">HR</Option>
                  <Option value="manager">Manager</Option>
                  <Option value="accountant">Accountant</Option>
                  <Option value="employee">Employee</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Department" name="department" rules={[{ required: true }]}>
                <Select>
                  {departments.map(d => (
                    <Option key={d.departmentid} value={d.departmentname}>
                      {d.departmentname}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Status" name="status">
                <Select>
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Active" name="is_active">
                <Select>
                  <Option value={true}>Yes</Option>
                  <Option value={false}>No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Address" name="address">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Apply Leave Modal */}
      <Modal
        title="Apply Leave for Employee"
        open={isLeaveModalVisible}
        onCancel={() => setIsLeaveModalVisible(false)}
        onOk={() => leaveForm.submit()}
        okText="Apply Leave"
        width={500}
      >
        <Form layout="vertical" form={leaveForm} onFinish={handleApplyLeaveForUser}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Leave Type" name="leavetypeid" rules={[{ required: true }]}>
            <Select>
              {leaveTypes.map(lt => (
                <Option key={lt.leavetypeid} value={lt.leavetypeid}>
                  {lt.leavetype}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="From Date" name="leavefromdate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="To Date" name="leavetodate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Reason" name="leavereason">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal
        title="Mark Attendance"
        open={isAttendanceModalVisible}
        onCancel={() => setIsAttendanceModalVisible(false)}
        onOk={() => attendanceForm.submit()}
        okText="Mark Attendance"
        width={500}
      >
        <Form layout="vertical" form={attendanceForm} onFinish={handleMarkAttendance}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="In Time" name="intime" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Out Time" name="outtime">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select>
              <Option value="Present">Present</Option>
              <Option value="Absent">Absent</Option>
              <Option value="Half Day">Half Day</Option>
              <Option value="Late">Late</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Process Salary Modal */}
      <Modal
        title="Process Salary"
        open={isSalaryModalVisible}
        onCancel={() => setIsSalaryModalVisible(false)}
        onOk={() => salaryForm.submit()}
        okText="Process Salary"
        width={600}
      >
        <Form layout="vertical" form={salaryForm} onFinish={handleProcessSalary}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Salary Date" name="salarydate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Basic Salary" name="basicsalary" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="OT Pay" name="otpay">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/LKR\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Increment Pay" name="incrementpay">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/LKR\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Bonus Pay" name="bonuspay">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/LKR\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Process Loan Modal */}
      <Modal
        title="Process Loan"
        open={isLoanModalVisible}
        onCancel={() => setIsLoanModalVisible(false)}
        onOk={() => loanForm.submit()}
        okText="Process Loan"
        width={500}
      >
        <Form layout="vertical" form={loanForm} onFinish={handleProcessLoan}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Loan Type" name="loantypeid" rules={[{ required: true }]}>
            <Select>
              {loanTypes.map(lt => (
                <Option key={lt.loantypeid} value={lt.loantypeid}>
                  {lt.loantype}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Duration (months)" name="duration" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={60} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Interest Rate (%)" name="interestrate" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={50} step={0.1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Update KPI Modal */}
      <Modal
        title="Update KPI"
        open={isKPIModalVisible}
        onCancel={() => setIsKPIModalVisible(false)}
        onOk={() => kpiForm.submit()}
        okText="Update KPI"
        width={500}
      >
        <Form layout="vertical" form={kpiForm} onFinish={handleUpdateKPI}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="KPI Value" name="kpivalue" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item label="Calculation Date" name="calculatedate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Calculate EPF/ETF Modal */}
      <Modal
        title="Calculate EPF/ETF"
        open={isEpfEtfModalVisible}
        onCancel={() => setIsEpfEtfModalVisible(false)}
        onOk={() => epfEtfForm.submit()}
        okText="Calculate"
        width={500}
      >
        <Form layout="vertical" form={epfEtfForm} onFinish={handleCalculateEPFETF}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Basic Salary" name="basicsalary" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Alert
            message="EPF: 8% of basic salary | ETF: 3% of basic salary"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* Schedule Training Modal */}
      <Modal
        title="Schedule Training"
        open={isTrainingModalVisible}
        onCancel={() => setIsTrainingModalVisible(false)}
        onOk={() => trainingForm.submit()}
        okText="Schedule Training"
        width={500}
      >
        <Form layout="vertical" form={trainingForm} onFinish={handleAddTraining}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Training Topic" name="topic" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Trainer" name="trainer" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Venue" name="venue" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Duration" name="duration" rules={[{ required: true }]}>
            <Input placeholder="e.g., 2 hours" />
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Process Promotion Modal */}
      <Modal
        title="Process Promotion"
        open={isPromotionModalVisible}
        onCancel={() => setIsPromotionModalVisible(false)}
        onOk={() => promotionForm.submit()}
        okText="Process Promotion"
        width={500}
      >
        <Form layout="vertical" form={promotionForm} onFinish={handleProcessPromotion}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Current Position" name="oldposition" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="New Position" name="newposition" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Department" name="department" rules={[{ required: true }]}>
            <Select>
              {departments.map(d => (
                <Option key={d.departmentid} value={d.departmentname}>
                  {d.departmentname}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Salary Increase" name="salaryincrease" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item label="Promotion Date" name="promotiondate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Bonus Modal */}
      <Modal
        title="Add Bonus"
        open={isBonusModalVisible}
        onCancel={() => setIsBonusModalVisible(false)}
        onOk={() => bonusForm.submit()}
        okText="Add Bonus"
        width={500}
      >
        <Form layout="vertical" form={bonusForm} onFinish={handleAddBonus}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Bonus Type" name="type" rules={[{ required: true }]}>
            <Select>
              <Option value="Performance">Performance Bonus</Option>
              <Option value="Festival">Festival Bonus</Option>
              <Option value="Annual">Annual Bonus</Option>
              <Option value="Special">Special Bonus</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item label="Reason" name="reason" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Bonus Date" name="bonusdate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Process Increment Modal */}
      <Modal
        title="Process Increment"
        open={isIncrementModalVisible}
        onCancel={() => setIsIncrementModalVisible(false)}
        onOk={() => incrementForm.submit()}
        okText="Process Increment"
        width={500}
      >
        <Form layout="vertical" form={incrementForm} onFinish={handleProcessIncrement}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Increment Percentage" name="percentage" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={100}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
            />
          </Form.Item>
          <Form.Item label="Increment Amount" name="amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item label="Last Increment Date" name="lastincrementdate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Next Increment Date" name="nextincrementdate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        title="Assign Task"
        open={isTaskModalVisible}
        onCancel={() => setIsTaskModalVisible(false)}
        onOk={() => taskForm.submit()}
        okText="Assign Task"
        width={500}
      >
        <Form layout="vertical" form={taskForm} onFinish={handleAssignTask}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Task Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
                <Select>
                  <Option value="Low">Low</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="High">High</Option>
                  <Option value="Urgent">Urgent</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Type" name="type" rules={[{ required: true }]}>
                <Select>
                  <Option value="Development">Development</Option>
                  <Option value="Testing">Testing</Option>
                  <Option value="Design">Design</Option>
                  <Option value="Documentation">Documentation</Option>
                  <Option value="Meeting">Meeting</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Due Date" name="due_date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Schedule Meeting Modal */}
      <Modal
        title="Schedule Meeting"
        open={isMeetingModalVisible}
        onCancel={() => setIsMeetingModalVisible(false)}
        onOk={() => meetingForm.submit()}
        okText="Schedule Meeting"
        width={500}
      >
        <Form layout="vertical" form={meetingForm} onFinish={handleScheduleMeeting}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Meeting Topic" name="topic" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Start Time" name="starttime" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="End Time" name="endtime" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Location" name="location">
            <Input />
          </Form.Item>
          <Form.Item label="Meeting Type" name="type">
            <Select>
              <Option value="Team">Team Meeting</Option>
              <Option value="One-on-One">One-on-One</Option>
              <Option value="Client">Client Meeting</Option>
              <Option value="Training">Training Session</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Give Feedback Modal */}
      <Modal
        title="Give Performance Feedback"
        open={isFeedbackModalVisible}
        onCancel={() => setIsFeedbackModalVisible(false)}
        onOk={() => feedbackForm.submit()}
        okText="Submit Feedback"
        width={500}
      >
        <Form layout="vertical" form={feedbackForm} onFinish={handleSubmitFeedback}>
          <Form.Item label="Select Employee" name="empid" rules={[{ required: true }]}>
            <Select placeholder="Choose employee">
              {allEmployees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Rating" name="rating" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>
          <Form.Item label="Comments" name="comments">
            <TextArea rows={4} placeholder="Provide detailed feedback..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Employee Detail Drawer */}
      <Drawer
        title="Employee Details"
        placement="right"
        width={600}
        onClose={() => setIsEmployeeDetailVisible(false)}
        open={isEmployeeDetailVisible}
      >
        {selectedEmployeeDetail && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Name">
              {selectedEmployeeDetail.first_name} {selectedEmployeeDetail.last_name}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedEmployeeDetail.email}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {selectedEmployeeDetail.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {selectedEmployeeDetail.department}
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              {selectedEmployeeDetail.role}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedEmployeeDetail.status === 'Active' ? 'green' : 'red'}>
                {selectedEmployeeDetail.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              {selectedEmployeeDetail.gender}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {selectedEmployeeDetail.empaddress}
            </Descriptions.Item>
            <Descriptions.Item label="Leave Balances">
              <div>Sick Leave: {selectedEmployeeDetail.sickleavebalance} days</div>
              <div>Full Day Leave: {selectedEmployeeDetail.fulldayleavebalance} days</div>
              <div>Half Day Leave: {selectedEmployeeDetail.halfdayleavebalance} days</div>
              <div>Short Leave: {selectedEmployeeDetail.shortleavebalance} days</div>
              <div>Maternity Leave: {selectedEmployeeDetail.maternityleavebalance} days</div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default AdminDashboard;