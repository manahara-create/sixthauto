import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, List, Typography, Tag, Button, Space, Avatar,
  Badge, Alert, Divider, Tabs, Form, Input, Select, DatePicker, Modal, Table,
  message, Descriptions, Timeline, Progress, InputNumber, Upload, Steps, Rate,
  Spin
} from 'antd';
import {
  UserOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DollarOutlined, TeamOutlined, LineChartOutlined, EyeOutlined, IdcardOutlined,
  PlusOutlined, UploadOutlined, HistoryOutlined, SolutionOutlined, BankOutlined,
  FileTextOutlined, LogoutOutlined, LoginOutlined, MessageOutlined, MailOutlined,
  StarOutlined, ProfileOutlined, EditOutlined, DownloadOutlined, DeleteOutlined,
  SearchOutlined, FileExcelOutlined, FileWordOutlined, LoadingOutlined
} from '@ant-design/icons';
import DatabaseService from '../../services/databaseService2';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ReportService from '../../services/reportServices2';
import FileService from '../../services/fileServices2';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;
const { RangePicker } = DatePicker;

const EmployeeDashboard = () => {
  const { profile, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // State for all features
  const [myTasks, setMyTasks] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [salaryData, setSalaryData] = useState({});
  const [leaveBalance, setLeaveBalance] = useState({});
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [trainingRequests, setTrainingRequests] = useState([]);
  const [epfEtfRequests, setEpfEtfRequests] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [profileData, setProfileData] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Report states
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [reportFormat, setReportFormat] = useState('xlsx');

  // Modal states
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [epfModalVisible, setEpfModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [employeeSearchModalVisible, setEmployeeSearchModalVisible] = useState(false);

  // Form states
  const [leaveForm] = Form.useForm();
  const [loanForm] = Form.useForm();
  const [trainingForm] = Form.useForm();
  const [epfForm] = Form.useForm();
  const [documentForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [reportForm] = Form.useForm();

  // Debugging useEffect
  useEffect(() => {
    console.log('Auth loading:', authLoading);
    console.log('Profile:', profile);
    console.log('Dashboard loading:', loading);
  }, [authLoading, profile, loading]);

  // Handle authentication state
  useEffect(() => {
    if (authLoading) {
      console.log('Auth still loading...');
      return;
    }

    if (!profile) {
      console.log('No profile found, redirecting to login...');
      message.warning('Please log in to access the dashboard');
      navigate('/login');
      return;
    }

    console.log('Profile loaded, initializing dashboard...');
    initializeDashboard();
  }, [profile, authLoading, navigate]);

  const initializeDashboard = async (retryCount = 0) => {
    try {
      setLoading(true);
      console.log('Starting dashboard initialization...');

      // Check if we have the necessary profile data
      if (!profile || !profile.empid) {
        console.error('No profile or employee ID found');
        message.error('Unable to load dashboard: No employee profile found');
        setLoading(false);
        return;
      }

      console.log('Employee ID:', profile.empid);

      // Test database connection first with a simple query
      try {
        const testProfile = await DatabaseService.getEmployeeProfile(profile.empid);
        console.log('Database test successful:', testProfile);
      } catch (dbError) {
        console.error('Database test failed:', dbError);
        throw new Error('Database connection failed');
      }

      // Load critical data first
      const criticalData = await Promise.allSettled([
        fetchProfileData(),
        fetchAttendanceData(),
        fetchMyTasks(),
        fetchLeaveBalance()
      ]);

      console.log('Critical data loaded:', criticalData);

      // Load non-critical data in background
      const backgroundData = await Promise.allSettled([
        fetchMyLeaves(),
        fetchSalaryData(),
        fetchPromotionHistory(),
        fetchLoanRequests(),
        fetchTrainingRequests(),
        fetchEpfEtfRequests(),
        fetchTeamMembers(),
        fetchDocuments(),
        fetchMyFeedback(),
        fetchAllEmployees()
      ]);

      console.log('Background data loaded');

    } catch (error) {
      console.error('Error initializing employee dashboard:', error);

      if (retryCount < 2) {
        console.log(`Retrying dashboard initialization... Attempt ${retryCount + 1}`);
        setTimeout(() => {
          initializeDashboard(retryCount + 1);
        }, 2000 * (retryCount + 1));
      } else {
        message.error('Failed to load dashboard after multiple attempts. Please refresh the page.');
      }
    } finally {
      setLoading(false);
      console.log('Dashboard initialization completed');
    }
  };

  const fetchMyTasks = async () => {
    try {
      console.log('Fetching tasks...');
      const data = await DatabaseService.getTasks(profile?.empid);
      console.log('Tasks data:', data);

      // Ensure data is an array
      const tasksArray = Array.isArray(data) ? data : [];
      setMyTasks(tasksArray);
      return tasksArray;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setMyTasks([]);
      return [];
    }
  };

  const fetchMyLeaves = async () => {
    try {
      console.log('Fetching leaves...');
      const data = await DatabaseService.getLeaves({ employeeId: profile?.empid });
      console.log('Leaves data:', data);

      const leavesArray = Array.isArray(data) ? data : [];
      setMyLeaves(leavesArray);
      return leavesArray;
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setMyLeaves([]);
      return [];
    }
  };

  const fetchAttendanceData = async () => {
    try {
      console.log('Fetching attendance...');
      const month = dayjs().format('YYYY-MM');
      const data = await DatabaseService.getAttendance({ employeeId: profile?.empid, month });
      console.log('Attendance data:', data);

      // Ensure we have a valid object
      const attendanceObj = data && typeof data === 'object' ? data : {};
      setAttendanceData(attendanceObj);
      return attendanceObj;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData({});
      return {};
    }
  };


  const fetchSalaryData = async () => {
    try {
      console.log('Fetching salary...');
      const month = dayjs().format('YYYY-MM');
      const data = await DatabaseService.getSalaries({ employeeId: profile?.empid, month });
      console.log('Salary data:', data);
      setSalaryData(data || {});
      return data;
    } catch (error) {
      console.error('Error fetching salary:', error);
      setSalaryData({});
      return {};
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      console.log('Fetching leave balance...');
      const balance = await DatabaseService.getLeaveBalance(profile?.empid);
      console.log('Leave balance:', balance);
      setLeaveBalance(balance || {});
      return balance;
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      setLeaveBalance({});
      return {};
    }
  };

  const fetchPromotionHistory = async () => {
    try {
      console.log('Fetching promotions...');
      const data = await DatabaseService.getPromotions(profile?.empid);
      console.log('Promotions data:', data);
      setPromotionHistory(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotionHistory([]);
      return [];
    }
  };

  const fetchLoanRequests = async () => {
    try {
      console.log('Fetching loans...');
      const data = await DatabaseService.getLoans({ employeeId: profile?.empid });
      console.log('Loans data:', data);
      setLoanRequests(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoanRequests([]);
      return [];
    }
  };

  const fetchTrainingRequests = async () => {
    try {
      console.log('Fetching training requests...');
      const data = await DatabaseService.getTrainingRequests({ employeeId: profile?.empid });
      console.log('Training data:', data);
      setTrainingRequests(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching training requests:', error);
      setTrainingRequests([]);
      return [];
    }
  };

  const fetchEpfEtfRequests = async () => {
    try {
      console.log('Fetching EPF/ETF...');
      const data = await DatabaseService.getEpfEtfRequests({ employeeId: profile?.empid });
      console.log('EPF/ETF data:', data);
      setEpfEtfRequests(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching EPF/ETF:', error);
      setEpfEtfRequests([]);
      return [];
    }
  };

  const fetchTeamMembers = async () => {
    try {
      console.log('Fetching team members...');
      const data = await DatabaseService.getEmployees({ managerId: profile?.empid });
      console.log('Team members data:', data);
      setTeamMembers(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
      return [];
    }
  };

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents...');
      const data = await FileService.listEmployeeFiles(profile?.empid);
      console.log('Documents data:', data);
      setDocuments(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
      return [];
    }
  };

  const fetchMyFeedback = async () => {
    try {
      console.log('Fetching feedback...');
      const data = await DatabaseService.getFeedback(profile?.empid);
      console.log('Feedback data:', data);
      setMyFeedback(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setMyFeedback([]);
      return [];
    }
  };

  const fetchProfileData = async () => {
    try {
      console.log('Fetching profile data...');
      const data = await DatabaseService.getEmployeeProfile(profile?.empid);
      console.log('Profile data:', data);
      setProfileData(data || {});
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileData({});
      return {};
    }
  };

  const fetchAllEmployees = async () => {
    try {
      console.log('Fetching all employees...');
      const data = await DatabaseService.getAllEmployees();
      console.log('All employees data:', data);
      setAllEmployees(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      setAllEmployees([]);
      return [];
    }
  };

  // Status color helper function
  const getStatusColor = (status) => {
    const statusColors = {
      'approved': 'green',
      'pending': 'orange',
      'rejected': 'red',
      'completed': 'blue',
      'in-progress': 'purple',
      'active': 'green',
      'inactive': 'red',
      'scheduled': 'blue',
      'submitted': 'orange',
      'present': 'green',
      'absent': 'red'
    };
    return statusColors[status?.toLowerCase()] || 'default';
  };

  // Handle role navigation
  const handleRoleNavigation = () => {
    if (!profile) return;

    if (profile.role === 'manager') {
      navigate('/manager-dashboard');
    } else if (profile.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (profile.role === 'undefined') {
      navigate('/default-dashboard');
    }
  };

  const handleApplyLeave = async (values) => {
    try {
      // Validate dates
      if (!values.fromDate || !values.toDate) {
        message.error('Please select both from and to dates');
        return;
      }

      const fromDate = dayjs(values.fromDate);
      const toDate = dayjs(values.toDate);

      if (toDate.isBefore(fromDate)) {
        message.error('To date cannot be before from date');
        return;
      }

      const duration = toDate.diff(fromDate, 'day') + 1;

      const leaveData = {
        empid: profile?.empid,
        leavetype: values.leaveType,
        leavefromdate: fromDate.format('YYYY-MM-DD'),
        leavetodate: toDate.format('YYYY-MM-DD'),
        leavereason: values.reason?.trim() || '',
        leavestatus: 'pending',
        duration: duration
      };

      await DatabaseService.applyLeave(leaveData);
      message.success('Leave application submitted successfully!');
      setLeaveModalVisible(false);
      leaveForm.resetFields();
      fetchMyLeaves();
    } catch (error) {
      console.error('Error applying for leave:', error);
      message.error('Failed to apply for leave');
    }
  };

  // Handle Mark Attendance
  const handleMarkAttendance = async () => {
    try {
      const currentTime = new Date().toTimeString().split(' ')[0];
      const today = dayjs().format('YYYY-MM-DD');

      // Check if attendance already exists for today
      const existingAttendance = attendanceData.todayRecord;

      const attendanceDataToSend = {
        empid: profile?.empid,
        date: today,
        status: 'present'
      };

      if (existingAttendance) {
        // Update out time
        attendanceDataToSend.outtime = currentTime;
        await DatabaseService.updateAttendance(existingAttendance.attendanceid, attendanceDataToSend);
      } else {
        // Create new attendance with in time
        attendanceDataToSend.intime = currentTime;
        await DatabaseService.markAttendance(attendanceDataToSend);
      }

      message.success(`Attendance ${existingAttendance ? 'updated' : 'marked'} successfully!`);
      setAttendanceModalVisible(false);
      fetchAttendanceData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      message.error('Failed to mark attendance');
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
        empid: profile?.empid,
        loantype: values.loanType,
        amount: Math.round(amount),
        duration: duration,
        status: 'pending',
        date: dayjs().format('YYYY-MM-DD')
      };

      await DatabaseService.applyLoan(loanData);
      message.success('Loan application submitted successfully!');
      setLoanModalVisible(false);
      loanForm.resetFields();
      fetchLoanRequests();
    } catch (error) {
      console.error('Error applying for loan:', error);
      message.error('Failed to apply for loan');
    }
  };

  // Handle Request Training
  const handleRequestTraining = async (values) => {
    try {
      const trainingData = {
        empid: profile?.empid,
        topic: values.topic,
        venue: values.venue,
        trainer: values.trainer,
        duration: values.duration,
        date: values.trainingDate.format('YYYY-MM-DD'),
        status: 'pending'
      };

      await DatabaseService.requestTraining(trainingData);
      message.success('Training request submitted successfully!');
      setTrainingModalVisible(false);
      trainingForm.resetFields();
      fetchTrainingRequests();
    } catch (error) {
      console.error('Error requesting training:', error);
      message.error('Failed to request training');
    }
  };

  // Handle Apply for EPF/ETF
  const handleApplyEpfEtf = async (values) => {
    try {
      const epfData = {
        empid: profile?.empid,
        basicsalary: values.basicSalary,
        applieddate: dayjs().format('YYYY-MM-DD'),
        status: 'pending'
      };

      await DatabaseService.applyEpfEtf(epfData);
      message.success('EPF/ETF application submitted successfully!');
      setEpfModalVisible(false);
      epfForm.resetFields();
      fetchEpfEtfRequests();
    } catch (error) {
      console.error('Error applying for EPF/ETF:', error);
      message.error('Failed to apply for EPF/ETF');
    }
  };

  // Handle Upload Document
  const handleUploadDocument = async (values) => {
    try {
      const file = values.file.fileList[0].originFileObj;

      await FileService.uploadEmployeeDocument(
        file,
        profile?.empid,
        values.documentType,
        values.documentName || file.name
      );

      message.success('Document uploaded successfully!');
      setDocumentModalVisible(false);
      documentForm.resetFields();
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      message.error('Failed to upload document');
    }
  };

  // Handle Submit Feedback
  const handleSubmitFeedback = async (values) => {
    try {
      const feedbackData = {
        empid: profile?.empid,
        feedback_type: values.feedbackType,
        subject: values.subject,
        message: values.message,
        rating: values.rating,
        status: 'submitted'
      };

      await DatabaseService.submitFeedback(feedbackData);
      message.success('Feedback submitted successfully!');
      setFeedbackModalVisible(false);
      feedbackForm.resetFields();
      fetchMyFeedback();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
    }
  };

  // Handle Update Profile
  const handleUpdateProfile = async (values) => {
    try {
      const updatedProfile = await DatabaseService.updateEmployeeProfile(profile?.empid, values);
      setProfileData(updatedProfile);
      message.success('Profile updated successfully!');
      setProfileModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    }
  };

  // Handle Download Document
  const handleDownloadDocument = async (document) => {
    try {
      const link = document.createElement('a');
      link.href = document.file_path;
      link.download = document.document_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Document download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      message.error('Failed to download document');
    }
  };

  // Handle Delete Document
  const handleDeleteDocument = async (documentId) => {
    try {
      await FileService.deleteEmployeeDocument(documentId, profile?.empid);
      message.success('Document deleted successfully!');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      message.error('Failed to delete document');
    }
  };

  // Generate Report
  const generateReport = async () => {
    try {
      const reportData = {
        employeeId: selectedEmployee || profile?.empid,
        reportType,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        format: reportFormat
      };

      let report;
      if (reportFormat === 'xlsx') {
        report = await ReportService.generateEmployeeExcelReport(reportData);
      } else {
        report = await ReportService.generateEmployeeWordReport(reportData);
      }

      const url = window.URL.createObjectURL(new Blob([report]));
      const link = document.createElement('a');
      link.href = url;
      const extension = reportFormat === 'xlsx' ? 'xlsx' : 'docx';
      link.setAttribute('download', `${reportType}_report_${profile?.empid}_${dayjs().format('YYYY-MM-DD')}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success(`${reportType} report generated successfully!`);
      setReportModalVisible(false);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId);
    setEmployeeSearchModalVisible(false);
  };

  // Tab Components
  const OverviewTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's Attendance"
              value={attendanceData.todayRecord ? 'Present' : 'Absent'}
              prefix={attendanceData.todayRecord ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              valueStyle={{ color: attendanceData.todayRecord ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Leave Balance"
              value={leaveBalance.days || 0}
              suffix={`/ ${leaveBalance.max_days || 0}`}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Tasks"
              value={myTasks.filter(task => task.status === 'pending').length}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Monthly Salary"
              value={salaryData.totalsalary || 0}
              prefix={<DollarOutlined />}
              formatter={value => `LKR ${value}`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Recent Tasks" extra={<Button type="link">View All</Button>}>
            <List
              dataSource={myTasks.slice(0, 5)}
              renderItem={task => (
                <List.Item>
                  <List.Item.Meta
                    title={task.title}
                    description={task.description}
                  />
                  <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                </List.Item>
              )}
              locale={{ emptyText: 'No tasks assigned' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Quick Actions" style={{ textAlign: 'center' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button type="primary" icon={<LoginOutlined />} onClick={() => setAttendanceModalVisible(true)} block>
                Mark Attendance
              </Button>
              <Button icon={<CalendarOutlined />} onClick={() => setLeaveModalVisible(true)} block>
                Apply for Leave
              </Button>
              <Button icon={<LineChartOutlined />} onClick={() => setReportModalVisible(true)} block>
                Generate Report
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const LeavesTab = () => (
    <div>
      <Card
        title="My Leaves"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setLeaveModalVisible(true)}>
            Apply for Leave
          </Button>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Total Leaves" value={leaveBalance.max_days || 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Leaves Taken" value={leaveBalance.taken || 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Remaining" value={leaveBalance.days || 0} />
            </Card>
          </Col>
        </Row>
        <Table
          dataSource={myLeaves}
          columns={[
            {
              title: 'Leave Type',
              dataIndex: 'leavetype',
              key: 'leavetype',
            },
            {
              title: 'From Date',
              dataIndex: 'leavefromdate',
              key: 'leavefromdate',
              render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
            },
            {
              title: 'To Date',
              dataIndex: 'leavetodate',
              key: 'leavetodate',
              render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
            },
            {
              title: 'Status',
              dataIndex: 'leavestatus',
              key: 'leavestatus',
              render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
            }
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="leaveid"
        />
      </Card>
    </div>
  );

  const AttendanceTab = () => (
    <div>
      <Card
        title="My Attendance"
        extra={
          <Button type="primary" icon={<LoginOutlined />} onClick={() => setAttendanceModalVisible(true)}>
            Mark Attendance
          </Button>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Present Days" value={attendanceData.presentDays || 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Absent Days" value={attendanceData.absentDays || 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Late Marks" value={attendanceData.lateMarks || 0} />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const DocumentsTab = () => (
    <div>
      <Card
        title="My Documents"
        extra={
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setDocumentModalVisible(true)}>
            Upload Document
          </Button>
        }
      >
        {documents.length > 0 ? (
          <Table
            dataSource={documents}
            columns={[
              {
                title: 'Document Name',
                dataIndex: 'document_name',
                key: 'document_name',
              },
              {
                title: 'Type',
                dataIndex: 'document_type',
                key: 'document_type',
                render: (type) => <Tag>{type}</Tag>
              },
              {
                title: 'Upload Date',
                dataIndex: 'uploaded_at',
                key: 'uploaded_at',
                render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
              },
              {
                title: 'Status',
                dataIndex: 'is_verified',
                key: 'is_verified',
                render: (verified) => (
                  <Tag color={verified ? 'green' : 'orange'}>
                    {verified ? 'Verified' : 'Pending Verification'}
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
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadDocument(record)}
                    >
                      Download
                    </Button>
                    <Button
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteDocument(record.id)}
                    >
                      Delete
                    </Button>
                  </Space>
                )
              }
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>No documents uploaded yet</div>
            <Button type="primary" onClick={() => setDocumentModalVisible(true)} style={{ marginTop: '16px' }}>
              Upload Your First Document
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const LoansTab = () => (
    <div>
      <Card
        title="My Loans"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setLoanModalVisible(true)}>
            Apply for Loan
          </Button>
        }
      >
        <Table
          dataSource={loanRequests}
          columns={[
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
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="loanrequestid"
          locale={{ emptyText: 'No loan applications yet' }}
        />
      </Card>
    </div>
  );

  const TrainingTab = () => (
    <div>
      <Card
        title="Training Requests"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setTrainingModalVisible(true)}>
            Request Training
          </Button>
        }
      >
        <Table
          dataSource={trainingRequests}
          columns={[
            {
              title: 'Topic',
              dataIndex: 'topic',
              key: 'topic',
            },
            {
              title: 'Trainer',
              dataIndex: 'trainer',
              key: 'trainer',
            },
            {
              title: 'Date',
              dataIndex: 'date',
              key: 'date',
              render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
            }
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="trainingid"
          locale={{ emptyText: 'No training requests yet' }}
        />
      </Card>
    </div>
  );

  const EpfEtfTab = () => (
    <div>
      <Card
        title="EPF/ETF Applications"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEpfModalVisible(true)}>
            Apply for EPF/ETF
          </Button>
        }
      >
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
          pagination={{ pageSize: 10 }}
          rowKey="id"
          locale={{ emptyText: 'No EPF/ETF applications yet' }}
        />
      </Card>
    </div>
  );

  const TeamTab = () => (
    <div>
      <Card title="Team Directory">
        <Table
          dataSource={teamMembers}
          columns={[
            {
              title: 'Employee',
              key: 'employee',
              render: (_, record) => (
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <div>
                    <div>{record.full_name}</div>
                    <Text type="secondary">{record.empid}</Text>
                  </div>
                </Space>
              )
            },
            {
              title: 'Role',
              dataIndex: 'role',
              key: 'role',
            },
            {
              title: 'Department',
              dataIndex: 'department',
              key: 'department',
            },
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
            }
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="empid"
          locale={{ emptyText: 'No team members found' }}
        />
      </Card>
    </div>
  );

  const FeedbackTab = () => (
    <div>
      <Card
        title="Company Feedback"
        extra={
          <Button type="primary" icon={<MessageOutlined />} onClick={() => setFeedbackModalVisible(true)}>
            Submit Feedback
          </Button>
        }
      >
        <Table
          dataSource={myFeedback}
          columns={[
            {
              title: 'Type',
              dataIndex: 'feedback_type',
              key: 'feedback_type',
            },
            {
              title: 'Subject',
              dataIndex: 'subject',
              key: 'subject',
            },
            {
              title: 'Rating',
              dataIndex: 'rating',
              key: 'rating',
              render: (rating) => rating ? <Rate disabled defaultValue={rating} /> : 'N/A'
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
            },
            {
              title: 'Submitted',
              dataIndex: 'submitted_at',
              key: 'submitted_at',
              render: (date) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A'
            }
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          locale={{ emptyText: 'No feedback submitted yet' }}
        />
      </Card>
    </div>
  );

  const ProfileTab = () => (
    <div>
      <Card
        title="My Profile"
        extra={
          <Button type="primary" icon={<EditOutlined />} onClick={() => {
            profileForm.setFieldsValue(profileData);
            setProfileModalVisible(true);
          }}>
            Edit Profile
          </Button>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Employee ID">{profileData.empid || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Name">{profileData.full_name || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Email">{profileData.email || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{profileData.phone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Role">{profileData.role || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Department">{profileData.department || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            {profileData.dob ? dayjs(profileData.dob).format('MMM D, YYYY') : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Address">{profileData.empaddress || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(profileData.status)}>{profileData.status || 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tenure">{profileData.tenure || 'N/A'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );

  // Tab items configuration
  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: <OverviewTab />
    },
    {
      key: 'leaves',
      label: 'Leaves',
      children: <LeavesTab />
    },
    {
      key: 'attendance',
      label: 'Attendance',
      children: <AttendanceTab />
    },
    {
      key: 'profile',
      label: 'My Profile',
      children: <ProfileTab />
    },
    {
      key: 'documents',
      label: 'Documents',
      children: <DocumentsTab />
    },
    {
      key: 'loans',
      label: 'Loans',
      children: <LoansTab />
    },
    {
      key: 'training',
      label: 'Training',
      children: <TrainingTab />
    },
    {
      key: 'epf-etf',
      label: 'EPF/ETF',
      children: <EpfEtfTab />
    },
    {
      key: 'feedback',
      label: 'Feedback',
      children: <FeedbackTab />
    }
  ];

  // Add Team tab for managers
  if (profile && ['manager', 'admin', 'undefined'].includes(profile.role)) {
    tabItems.splice(4, 0, {
      key: 'team',
      label: 'Team',
      children: <TeamTab />
    });
  }

  // Show loading spinner while profile is loading or dashboard is initializing
  if (authLoading || (loading && profile)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  // If no profile after auth loading is complete, show error
  if (!profile && !authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Alert
          message="Authentication Error"
          description="Unable to load your profile. Please try logging in again."
          type="error"
          showIcon
        />
        <Button type="primary" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header Section */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <Avatar size={64} icon={<UserOutlined />} />
          </Col>
          <Col flex={1}>
            <Title level={2} style={{ margin: 0 }}>
              Welcome back, {profile?.full_name || 'Employee'}!
            </Title>
            <Text type="secondary">
              {profile?.role || 'Employee'} • {profile?.department || 'Department'} • Employee ID: {profile?.empid || 'N/A'}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<LineChartOutlined />}
                onClick={() => setReportModalVisible(true)}
              >
                Generate Report
              </Button>
              <Button
                icon={<SearchOutlined />}
                onClick={() => setEmployeeSearchModalVisible(true)}
              >
                Search Employee
              </Button>
              {profile && ['manager', 'admin', 'undefined'].includes(profile.role) && (
                <Button
                  type="dashed"
                  icon={<TeamOutlined />}
                  onClick={handleRoleNavigation}
                >
                  Switch to {profile.role === 'manager' ? 'Manager' : profile.role === 'admin' ? 'Admin' : 'Default'} View
                </Button>
              )}
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={logout}
              >
                Logout
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarExtraContent={
            <Text type="secondary">
              Last updated: {dayjs().format('MMM D, YYYY h:mm A')}
            </Text>
          }
        />
      </Card>

      {/* Report Generation Modal */}
      <Modal
        title="Generate Report"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReportModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="generate" type="primary" onClick={generateReport}>
            Generate Report
          </Button>
        ]}
      >
        <Form form={reportForm} layout="vertical">
          <Form.Item label="Report Type" required>
            <Select value={reportType} onChange={setReportType}>
              <Option value="attendance">Attendance Report</Option>
              <Option value="leaves">Leaves Report</Option>
              <Option value="salary">Salary Report</Option>
              <Option value="performance">Performance Report</Option>
              <Option value="training">Training Report</Option>
              <Option value="documents">Documents Report</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Date Range" required>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Report Format" required>
            <Select value={reportFormat} onChange={setReportFormat}>
              <Option value="xlsx">
                <Space>
                  <FileExcelOutlined style={{ color: '#217346' }} />
                  Excel (.xlsx)
                </Space>
              </Option>
              <Option value="docx">
                <Space>
                  <FileWordOutlined style={{ color: '#2b579a' }} />
                  Word (.docx)
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item label="Employee Selection">
            <Button
              type="dashed"
              block
              onClick={() => setEmployeeSearchModalVisible(true)}
              icon={<SearchOutlined />}
            >
              {selectedEmployee ? 'Change Employee' : 'Select Specific Employee'}
            </Button>
            {selectedEmployee && (
              <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                Selected: {allEmployees.find(emp => emp.empid === selectedEmployee)?.full_name}
              </Text>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* Employee Search Modal */}
      <Modal
        title="Search Employee"
        open={employeeSearchModalVisible}
        onCancel={() => setEmployeeSearchModalVisible(false)}
        footer={null}
        width={800}
      >
        <Input.Search
          placeholder="Search employees by name, email, or employee ID"
          style={{ marginBottom: 16 }}
          onSearch={(value) => {
            // In a real app, you would call an API here
            // For now, we'll just log the search
            console.log('Searching for:', value);
          }}
        />
        <Table
          dataSource={allEmployees}
          columns={[
            {
              title: 'Employee',
              key: 'employee',
              render: (_, record) => (
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <div>
                    <div>{record.full_name}</div>
                    <Text type="secondary">{record.empid}</Text>
                  </div>
                </Space>
              )
            },
            {
              title: 'Department',
              dataIndex: 'department',
              key: 'department',
            },
            {
              title: 'Role',
              dataIndex: 'role',
              key: 'role',
            },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Button
                  type="link"
                  onClick={() => handleEmployeeSelect(record.empid)}
                >
                  Select
                </Button>
              )
            }
          ]}
          pagination={{ pageSize: 5 }}
          rowKey="empid"
        />
      </Modal>

      {/* Leave Application Modal */}
      <Modal
        title="Apply for Leave"
        open={leaveModalVisible}
        onCancel={() => setLeaveModalVisible(false)}
        footer={null}
      >
        <Form form={leaveForm} layout="vertical" onFinish={handleApplyLeave}>
          <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select leave type">
              <Option value="Annual">Annual Leave</Option>
              <Option value="Sick">Sick Leave</Option>
              <Option value="Casual">Casual Leave</Option>
              <Option value="Maternity">Maternity Leave</Option>
              <Option value="Paternity">Paternity Leave</Option>
            </Select>
          </Form.Item>
          <Form.Item name="fromDate" label="From Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="toDate" label="To Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Enter reason for leave" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Application
              </Button>
              <Button onClick={() => setLeaveModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Attendance Marking Modal */}
      <Modal
        title="Mark Attendance"
        open={attendanceModalVisible}
        onCancel={() => setAttendanceModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAttendanceModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="mark" type="primary" onClick={handleMarkAttendance}>
            {attendanceData.todayRecord ? 'Mark Out Time' : 'Mark In Time'}
          </Button>
        ]}
      >
        <Alert
          message={`You are about to mark your ${attendanceData.todayRecord ? 'out time' : 'in time'} for today`}
          description={`Current time: ${new Date().toLocaleTimeString()}`}
          type="info"
          showIcon
        />
      </Modal>

      {/* Loan Application Modal */}
      <Modal
        title="Apply for Loan"
        open={loanModalVisible}
        onCancel={() => setLoanModalVisible(false)}
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
              <Button onClick={() => setLoanModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Training Request Modal */}
      <Modal
        title="Request Training"
        open={trainingModalVisible}
        onCancel={() => setTrainingModalVisible(false)}
        footer={null}
      >
        <Form form={trainingForm} layout="vertical" onFinish={handleRequestTraining}>
          <Form.Item name="topic" label="Training Topic" rules={[{ required: true }]}>
            <Input placeholder="Enter training topic" />
          </Form.Item>
          <Form.Item name="trainer" label="Trainer" rules={[{ required: true }]}>
            <Input placeholder="Enter trainer name" />
          </Form.Item>
          <Form.Item name="venue" label="Venue" rules={[{ required: true }]}>
            <Input placeholder="Enter training venue" />
          </Form.Item>
          <Form.Item name="duration" label="Duration" rules={[{ required: true }]}>
            <Input placeholder="e.g., 2 hours, 1 day" />
          </Form.Item>
          <Form.Item name="trainingDate" label="Preferred Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Request
              </Button>
              <Button onClick={() => setTrainingModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* EPF/ETF Application Modal */}
      <Modal
        title="Apply for EPF/ETF"
        open={epfModalVisible}
        onCancel={() => setEpfModalVisible(false)}
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
              <Button onClick={() => setEpfModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Document Upload Modal */}
      <Modal
        title="Upload Document"
        open={documentModalVisible}
        onCancel={() => setDocumentModalVisible(false)}
        footer={null}
      >
        <Form form={documentForm} layout="vertical" onFinish={handleUploadDocument}>
          <Form.Item name="documentName" label="Document Name">
            <Input placeholder="Enter document name" />
          </Form.Item>
          <Form.Item name="documentType" label="Document Type" rules={[{ required: true }]}>
            <Select placeholder="Select document type">
              <Option value="ID">ID Document</Option>
              <Option value="Certificate">Certificate</Option>
              <Option value="Contract">Contract</Option>
              <Option value="Resume">Resume</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="file" label="File" rules={[{ required: true }]}>
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Upload Document
              </Button>
              <Button onClick={() => setDocumentModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Feedback Submission Modal */}
      <Modal
        title="Submit Feedback"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={null}
      >
        <Form form={feedbackForm} layout="vertical" onFinish={handleSubmitFeedback}>
          <Form.Item name="feedbackType" label="Feedback Type" rules={[{ required: true }]}>
            <Select placeholder="Select feedback type">
              <Option value="General">General Feedback</Option>
              <Option value="Work Environment">Work Environment</Option>
              <Option value="Management">Management</Option>
              <Option value="Facilities">Facilities</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
            <Input placeholder="Enter feedback subject" />
          </Form.Item>
          <Form.Item name="rating" label="Rating">
            <Rate />
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Enter your feedback message" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Feedback
              </Button>
              <Button onClick={() => setFeedbackModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Profile Update Modal */}
      <Modal
        title="Update Profile"
        open={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        footer={null}
      >
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="empaddress" label="Address">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="dob" label="Date of Birth">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Profile
              </Button>
              <Button onClick={() => setProfileModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;