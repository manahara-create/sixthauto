import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, List, Typography, Tag, Button, Space, Avatar,
  Badge, Alert, Divider, Tabs, Form, Input, Select, DatePicker, Modal, Table,
  message, Descriptions, Timeline, Progress, InputNumber, Upload, Steps, Rate
} from 'antd';
import {
  UserOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DollarOutlined, TeamOutlined, LineChartOutlined, EyeOutlined, IdcardOutlined,
  PlusOutlined, UploadOutlined, HistoryOutlined, SolutionOutlined, BankOutlined,
  FileTextOutlined, LogoutOutlined, LoginOutlined, MessageOutlined, MailOutlined,
  StarOutlined, ProfileOutlined, EditOutlined, DownloadOutlined, DeleteOutlined,
  SearchOutlined, FileExcelOutlined, FileWordOutlined
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
  const { profile, logout } = useAuth();
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

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        fetchMyTasks(),
        fetchMyLeaves(),
        fetchAttendanceData(),
        fetchSalaryData(),
        fetchLeaveBalance(),
        fetchPromotionHistory(),
        fetchLoanRequests(),
        fetchTrainingRequests(),
        fetchEpfEtfRequests(),
        fetchTeamMembers(),
        fetchDocuments(),
        fetchMyFeedback(),
        fetchProfileData(),
        fetchAllEmployees()
      ]);

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Dashboard initialization ${index} failed:`, result.reason);
        }
      });

    } catch (error) {
      console.error('Error initializing employee dashboard:', error);
      message.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch functions - Updated to match your schema
  const fetchMyTasks = async () => {
    try {
      const data = await DatabaseService.getTasks(profile.empid);
      setMyTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setMyTasks([]);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const data = await DatabaseService.getLeaves({ employeeId: profile.empid });
      setMyLeaves(data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setMyLeaves([]);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const month = dayjs().format('YYYY-MM');
      const data = await DatabaseService.getAttendance({ employeeId: profile.empid, month });
      setAttendanceData(data || {});
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData({});
    }
  };

  const fetchSalaryData = async () => {
    try {
      const month = dayjs().format('YYYY-MM');
      const data = await DatabaseService.getSalaries({ employeeId: profile.empid, month });
      setSalaryData(data || {});
    } catch (error) {
      console.error('Error fetching salary:', error);
      setSalaryData({});
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const balance = await DatabaseService.getLeaveBalance(profile.empid);
      setLeaveBalance(balance || {});
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      setLeaveBalance({});
    }
  };

  const fetchPromotionHistory = async () => {
    try {
      const data = await DatabaseService.getPromotions(profile.empid);
      setPromotionHistory(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotionHistory([]);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      const data = await DatabaseService.getLoans({ employeeId: profile.empid });
      setLoanRequests(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoanRequests([]);
    }
  };

  const fetchTrainingRequests = async () => {
    try {
      const data = await DatabaseService.getTrainingRequests({ employeeId: profile.empid });
      setTrainingRequests(data || []);
    } catch (error) {
      console.error('Error fetching training requests:', error);
      setTrainingRequests([]);
    }
  };

  const fetchEpfEtfRequests = async () => {
    try {
      const data = await DatabaseService.getEpfEtfRequests({ employeeId: profile.empid });
      setEpfEtfRequests(data || []);
    } catch (error) {
      console.error('Error fetching EPF/ETF:', error);
      setEpfEtfRequests([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const data = await DatabaseService.getEmployees({ managerId: profile.empid });
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await FileService.listEmployeeFiles(profile.empid);
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    }
  };

  const fetchMyFeedback = async () => {
    try {
      const data = await DatabaseService.getFeedback(profile.empid);
      setMyFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setMyFeedback([]);
    }
  };

  const fetchProfileData = async () => {
    try {
      const data = await DatabaseService.getEmployeeProfile(profile.empid);
      setProfileData(data || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileData({});
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const data = await DatabaseService.getAllEmployees();
      setAllEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setAllEmployees([]);
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
      'Active': 'green',
      'Inactive': 'red',
      'scheduled': 'blue',
      'submitted': 'orange'
    };
    return statusColors[status?.toLowerCase()] || 'default';
  };

  // Handle role navigation
  const handleRoleNavigation = () => {
    if (profile.role === 'manager') {
      navigate('/manager-dashboard');
    } else if (profile.role === 'admin') {
      navigate('/admin-dashboard');
    }
  };

  // Handle Apply Leave - Updated to match your schema
  const handleApplyLeave = async (values) => {
    try {
      const leaveData = {
        empid: profile.empid,
        leavetype: values.leaveType,
        leavefromdate: values.fromDate.format('YYYY-MM-DD'),
        leavetodate: values.toDate.format('YYYY-MM-DD'),
        leavereason: values.reason,
        leavestatus: 'pending'
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

  // Handle Mark Attendance - Updated to match your schema
  const handleMarkAttendance = async () => {
    try {
      const currentTime = new Date().toTimeString().split(' ')[0];
      const today = dayjs().format('YYYY-MM-DD');
      
      // Check if attendance already exists for today
      const existingAttendance = attendanceData.todayRecord;
      
      const attendanceDataToSend = {
        empid: profile.empid,
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

  // Handle Apply Loan - Updated to match your schema
  const handleApplyLoan = async (values) => {
    try {
      const loanData = {
        empid: profile.empid,
        loantype: values.loanType,
        amount: values.amount,
        duration: values.duration,
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

  // Handle Request Training - Updated to match your schema
  const handleRequestTraining = async (values) => {
    try {
      const trainingData = {
        empid: profile.empid,
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

  // Handle Apply for EPF/ETF - Updated to match your schema
  const handleApplyEpfEtf = async (values) => {
    try {
      const epfData = {
        empid: profile.empid,
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
        profile.empid,
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

  // Handle Submit Feedback - Updated to match your schema
  const handleSubmitFeedback = async (values) => {
    try {
      const feedbackData = {
        empid: profile.empid,
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

  // Handle Update Profile - Updated to match your schema
  const handleUpdateProfile = async (values) => {
    try {
      const updatedProfile = await DatabaseService.updateEmployeeProfile(profile.empid, values);
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
      await FileService.deleteEmployeeDocument(documentId, profile.empid);
      message.success('Document deleted successfully!');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      message.error('Failed to delete document');
    }
  };

  // Generate Report - Updated for XLSX and DOCX
  const generateReport = async () => {
    try {
      const reportData = {
        employeeId: selectedEmployee || profile.empid,
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
      link.setAttribute('download', `${reportType}_report_${profile.empid}_${dayjs().format('YYYY-MM-DD')}.${extension}`);
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
  const OverviewTab = ({ profile, myTasks, myLeaves, attendanceData, salaryData, leaveBalance, getStatusColor, onMarkAttendance, onApplyLeave, onGenerateReport }) => (
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
              <Button type="primary" icon={<LoginOutlined />} onClick={onMarkAttendance} block>
                Mark Attendance
              </Button>
              <Button icon={<CalendarOutlined />} onClick={onApplyLeave} block>
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

  const LeavesTab = ({ myLeaves, leaveBalance, onApplyLeave, getStatusColor }) => (
    <div>
      <Card
        title="My Leaves"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={onApplyLeave}>
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
              render: (date) => dayjs(date).format('MMM D, YYYY')
            },
            {
              title: 'To Date',
              dataIndex: 'leavetodate',
              key: 'leavetodate',
              render: (date) => dayjs(date).format('MMM D, YYYY')
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

  const AttendanceTab = ({ attendanceData, onMarkAttendance }) => (
    <div>
      <Card
        title="My Attendance"
        extra={
          <Button type="primary" icon={<LoginOutlined />} onClick={onMarkAttendance}>
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

  const DocumentsTab = ({ documents, onUploadDocument }) => (
    <div>
      <Card
        title="My Documents"
        extra={
          <Button type="primary" icon={<UploadOutlined />} onClick={onUploadDocument}>
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
                render: (date) => dayjs(date).format('MMM D, YYYY')
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
            <Button type="primary" onClick={onUploadDocument} style={{ marginTop: '16px' }}>
              Upload Your First Document
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const LoansTab = ({ loanRequests, onApplyLoan, getStatusColor }) => (
    <div>
      <Card
        title="My Loans"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={onApplyLoan}>
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
              render: (date) => dayjs(date).format('MMM D, YYYY')
            }
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="loanrequestid"
          locale={{ emptyText: 'No loan applications yet' }}
        />
      </Card>
    </div>
  );

  const TrainingTab = ({ trainingRequests, onRequestTraining, getStatusColor }) => (
    <div>
      <Card
        title="Training Requests"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={onRequestTraining}>
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
              render: (date) => dayjs(date).format('MMM D, YYYY')
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

  const EpfEtfTab = ({ epfEtfRequests, onApplyEpfEtf, getStatusColor }) => (
    <div>
      <Card
        title="EPF/ETF Applications"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={onApplyEpfEtf}>
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

  const TeamTab = ({ teamMembers }) => (
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

  const FeedbackTab = ({ myFeedback, onSubmitFeedback }) => (
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
              render: (date) => dayjs(date).format('MMM D, YYYY')
            }
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          locale={{ emptyText: 'No feedback submitted yet' }}
        />
      </Card>
    </div>
  );

  const ProfileTab = ({ profileData, onUpdateProfile }) => (
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
          <Descriptions.Item label="Employee ID">{profileData.empid}</Descriptions.Item>
          <Descriptions.Item label="Name">{profileData.full_name}</Descriptions.Item>
          <Descriptions.Item label="Email">{profileData.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{profileData.phone}</Descriptions.Item>
          <Descriptions.Item label="Role">{profileData.role}</Descriptions.Item>
          <Descriptions.Item label="Department">{profileData.department}</Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            {profileData.dob ? dayjs(profileData.dob).format('MMM D, YYYY') : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Address">{profileData.empaddress}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(profileData.status)}>{profileData.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tenure">{profileData.tenure}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );

  // Tab items configuration
  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <OverviewTab
          profile={profile}
          myTasks={myTasks}
          myLeaves={myLeaves}
          attendanceData={attendanceData}
          salaryData={salaryData}
          leaveBalance={leaveBalance}
          getStatusColor={getStatusColor}
          onMarkAttendance={() => setAttendanceModalVisible(true)}
          onApplyLeave={() => setLeaveModalVisible(true)}
          onGenerateReport={generateReport}
        />
      )
    },
    {
      key: 'leaves',
      label: 'Leaves',
      children: (
        <LeavesTab
          myLeaves={myLeaves}
          leaveBalance={leaveBalance}
          onApplyLeave={() => setLeaveModalVisible(true)}
          getStatusColor={getStatusColor}
        />
      )
    },
    {
      key: 'attendance',
      label: 'Attendance',
      children: (
        <AttendanceTab
          attendanceData={attendanceData}
          onMarkAttendance={() => setAttendanceModalVisible(true)}
        />
      )
    },
    {
      key: 'profile',
      label: 'My Profile',
      children: (
        <ProfileTab 
          profileData={profileData} 
          onUpdateProfile={handleUpdateProfile} 
        />
      )
    },
    {
      key: 'documents',
      label: 'Documents',
      children: (
        <DocumentsTab 
          documents={documents} 
          onUploadDocument={() => setDocumentModalVisible(true)} 
        />
      )
    },
    {
      key: 'loans',
      label: 'Loans',
      children: (
        <LoansTab
          loanRequests={loanRequests}
          onApplyLoan={() => setLoanModalVisible(true)}
          getStatusColor={getStatusColor}
        />
      )
    },
    {
      key: 'training',
      label: 'Training',
      children: (
        <TrainingTab
          trainingRequests={trainingRequests}
          onRequestTraining={() => setTrainingModalVisible(true)}
          getStatusColor={getStatusColor}
        />
      )
    },
    {
      key: 'epf-etf',
      label: 'EPF/ETF',
      children: (
        <EpfEtfTab
          epfEtfRequests={epfEtfRequests}
          onApplyEpfEtf={() => setEpfModalVisible(true)}
          getStatusColor={getStatusColor}
        />
      )
    },
    {
      key: 'feedback',
      label: 'Feedback',
      children: (
        <FeedbackTab
          myFeedback={myFeedback}
          onSubmitFeedback={handleSubmitFeedback}
        />
      )
    }
  ];

  // Add Team tab for managers
  if (['manager', 'admin'].includes(profile.role)) {
    tabItems.splice(4, 0, {
      key: 'team',
      label: 'Team',
      children: <TeamTab teamMembers={teamMembers} />
    });
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
              Welcome back, {profile.full_name}!
            </Title>
            <Text type="secondary">
              {profile.role} • {profile.department} • Employee ID: {profile.empid}
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
              {['manager', 'admin'].includes(profile.role) && (
                <Button 
                  type="dashed" 
                  icon={<TeamOutlined />}
                  onClick={handleRoleNavigation}
                >
                  Switch to {profile.role === 'manager' ? 'Manager' : 'Admin'} View
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
            // Filter employees based on search
            const filtered = allEmployees.filter(emp => 
              emp.full_name?.toLowerCase().includes(value.toLowerCase()) ||
              emp.email?.toLowerCase().includes(value.toLowerCase()) ||
              emp.empid?.toLowerCase().includes(value.toLowerCase())
            );
            setAllEmployees(filtered);
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