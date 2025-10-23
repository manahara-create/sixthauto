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
  StarOutlined, ProfileOutlined, EditOutlined, DownloadOutlined, DeleteOutlined
} from '@ant-design/icons';
import DatabaseService from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ReportService from '../../services/reportServices';
import FileService from '../../services/fileServices';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

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

  // Modal states
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [epfModalVisible, setEpfModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Form states
  const [leaveForm] = Form.useForm();
  const [loanForm] = Form.useForm();
  const [trainingForm] = Form.useForm();
  const [epfForm] = Form.useForm();
  const [documentForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [profileForm] = Form.useForm();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);

      // Use Promise.allSettled to handle individual failures gracefully
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
        fetchProfileData()
      ]);

      // Log any failed requests
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

  // Fetch functions
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

  // Status color helper function
  const getStatusColor = (status) => {
    const statusColors = {
      'approved': 'green',
      'pending': 'orange',
      'rejected': 'red',
      'completed': 'blue',
      'in-progress': 'purple',
      'Active': 'green',
      'Inactive': 'red'
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

  // Handle Apply Leave
  const handleApplyLeave = async (values) => {
    try {
      const leaveData = {
        empid: profile.empid,
        leave_type: values.leaveType,
        from_date: values.fromDate.format('YYYY-MM-DD'),
        to_date: values.toDate.format('YYYY-MM-DD'),
        reason: values.reason,
        status: 'pending'
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
      
      const attendanceData = {
        empid: profile.empid,
        time: currentTime
      };

      await DatabaseService.markAttendance(attendanceData);
      message.success('Attendance marked successfully!');
      setAttendanceModalVisible(false);
      fetchAttendanceData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      message.error('Failed to mark attendance');
    }
  };

  // Handle Apply Loan
  const handleApplyLoan = async (values) => {
    try {
      const loanData = {
        empid: profile.empid,
        loan_type: values.loanType,
        amount: values.amount,
        duration: values.duration,
        status: 'pending'
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
        empid: profile.empid,
        topic: values.topic,
        venue: values.venue,
        trainer: values.trainer,
        duration: values.duration,
        training_date: values.trainingDate.format('YYYY-MM-DD'),
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
        empid: profile.empid,
        basic_salary: values.basicSalary,
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

  // Handle Submit Feedback
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

  // Handle Update Profile
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

  // Generate Report
  const generateReport = async (type) => {
    try {
      const report = await ReportService.generateEmployeeReport(profile.empid, type);
      const url = window.URL.createObjectURL(new Blob([report]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${profile.empid}_${dayjs().format('YYYY-MM-DD')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success(`${type} report generated successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    }
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
              value={leaveBalance.remaining || 0}
              suffix={`/ ${leaveBalance.total || 0}`}
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
              value={salaryData.net_salary || 0}
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
              <Button icon={<LineChartOutlined />} onClick={() => onGenerateReport('monthly')} block>
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
              <Statistic title="Total Leaves" value={leaveBalance.total || 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Leaves Taken" value={leaveBalance.taken || 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Remaining" value={leaveBalance.remaining || 0} />
            </Card>
          </Col>
        </Row>
        <Table
          dataSource={myLeaves}
          columns={[
            {
              title: 'Leave Type',
              dataIndex: 'leave_type',
              key: 'leave_type',
            },
            {
              title: 'From Date',
              dataIndex: 'from_date',
              key: 'from_date',
              render: (date) => dayjs(date).format('MMM D, YYYY')
            },
            {
              title: 'To Date',
              dataIndex: 'to_date',
              key: 'to_date',
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
          rowKey="id"
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
        {/* Add attendance calendar or detailed list here */}
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
              dataIndex: 'loan_type',
              key: 'loan_type',
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
              dataIndex: 'applied_date',
              key: 'applied_date',
              render: (date) => dayjs(date).format('MMM D, YYYY')
            }
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="id"
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
              dataIndex: 'training_date',
              key: 'training_date',
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
          rowKey="id"
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
              dataIndex: 'basic_salary',
              key: 'basic_salary',
              render: (salary) => `LKR ${salary?.toLocaleString()}`
            },
            {
              title: 'Employee EPF (8%)',
              key: 'employee_epf',
              render: (_, record) => `LKR ${(record.basic_salary * 0.08)?.toFixed(2)}`
            },
            {
              title: 'Employer EPF (12%)',
              key: 'employer_epf',
              render: (_, record) => `LKR ${(record.basic_salary * 0.12)?.toFixed(2)}`
            },
            {
              title: 'Total Contribution (20%)',
              key: 'total_contribution',
              render: (_, record) => `LKR ${(record.basic_salary * 0.20)?.toFixed(2)}`
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
                    <div>{record.first_name} {record.last_name}</div>
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
          <Descriptions.Item label="Name">{profileData.first_name} {profileData.last_name}</Descriptions.Item>
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
      key: 'feedback',
      label: 'Feedback',
      children: (
        <FeedbackTab 
          myFeedback={myFeedback} 
          onSubmitFeedback={handleSubmitFeedback} 
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
    }
  ];

  // Add team tab only if user has team members
  if (teamMembers.length > 0) {
    tabItems.push({
      key: 'team',
      label: 'Team Directory',
      children: <TeamTab teamMembers={teamMembers} />
    });
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Card size="small" style={{
        marginBottom: 16,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Avatar
                size={40}
                icon={<UserOutlined />}
                src={profile.avatarurl}
                style={{ backgroundColor: '#87d068' }}
              />
              <div>
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                  {profile.first_name} {profile.last_name}
                </Title>
                <Text style={{ color: 'white', opacity: 0.9 }}>
                  {profile.role} • {profile.department}
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Text style={{ color: 'white' }}>
                Employee ID: {profile.empid}
              </Text>
              {profile.role !== 'employee' && (
                <Button
                  type="primary"
                  onClick={handleRoleNavigation}
                  icon={<TeamOutlined />}
                >
                  {profile.role.toUpperCase()} Dashboard
                </Button>
              )}
              <Button
                type="default"
                icon={<LogoutOutlined />}
                onClick={logout}
                style={{ color: 'white', borderColor: 'white' }}
              >
                Logout
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Alert
        message={`Welcome back, ${profile.first_name}!`}
        description="Here's your personalized dashboard with quick access to all features."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* All modals remain the same as in your original code */}
      {/* Leave Application Modal */}
      <Modal
        title="Apply for Leave"
        open={leaveModalVisible}
        onCancel={() => setLeaveModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={leaveForm} layout="vertical" onFinish={handleApplyLeave}>
          <Form.Item
            name="leaveType"
            label="Leave Type"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select placeholder="Select leave type">
              <Option value={1}>Sick Leave</Option>
              <Option value={2}>Full Day Leave</Option>
              <Option value={3}>Half Day Leave</Option>
              <Option value={4}>Short Leave</Option>
              <Option value={5}>Maternity Leave</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="fromDate"
            label="From Date"
            rules={[{ required: true, message: 'Please select from date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="toDate"
            label="To Date"
            rules={[{ required: true, message: 'Please select to date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <TextArea rows={4} placeholder="Enter reason for leave" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit Application
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        title="Mark Attendance"
        open={attendanceModalVisible}
        onCancel={() => setAttendanceModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text style={{ fontSize: '16px', display: 'block', marginBottom: '20px' }}>
            {attendanceData.todayRecord ? 'Record Out Time' : 'Record In Time'}
          </Text>
          <Button
            type="primary"
            size="large"
            icon={attendanceData.todayRecord ? <LogoutOutlined /> : <LoginOutlined />}
            onClick={handleMarkAttendance}
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '75px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            <div>
              <div>{attendanceData.todayRecord ? 'Punch Out' : 'Punch In'}</div>
              <div style={{ fontSize: '12px', marginTop: '8px', fontWeight: 'normal' }}>
                {dayjs().format('HH:mm:ss')}
              </div>
            </div>
          </Button>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            {attendanceData.todayRecord ?
              'Click to record your out time' :
              'Click to record your in time'
            }
          </div>
        </div>
      </Modal>

      {/* Loan Application Modal */}
      <Modal
        title="Apply for Loan"
        open={loanModalVisible}
        onCancel={() => setLoanModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={loanForm} layout="vertical" onFinish={handleApplyLoan}>
          <Form.Item
            name="loanType"
            label="Loan Type"
            rules={[{ required: true, message: 'Please select loan type' }]}
          >
            <Select placeholder="Select loan type">
              <Option value={1}>House Loan</Option>
              <Option value={2}>Staff Loan</Option>
              <Option value={3}>Vehicle Loan</Option>
              <Option value={4}>Product Loan</Option>
              <Option value={5}>Emergency Loan</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="Loan Amount"
            rules={[{ required: true, message: 'Please enter loan amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              max={1000000}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
              placeholder="Enter loan amount"
            />
          </Form.Item>
          <Form.Item
            name="duration"
            label="Duration (Months)"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={60}
              placeholder="Enter duration in months"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit Loan Application
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Training Request Modal */}
      <Modal
        title="Request Training"
        open={trainingModalVisible}
        onCancel={() => setTrainingModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={trainingForm} layout="vertical" onFinish={handleRequestTraining}>
          <Form.Item
            name="topic"
            label="Training Topic"
            rules={[{ required: true, message: 'Please enter training topic' }]}
          >
            <Input placeholder="Enter training topic" />
          </Form.Item>
          <Form.Item
            name="venue"
            label="Venue"
            rules={[{ required: true, message: 'Please enter venue' }]}
          >
            <Input placeholder="Enter training venue" />
          </Form.Item>
          <Form.Item
            name="trainer"
            label="Trainer"
            rules={[{ required: true, message: 'Please enter trainer name' }]}
          >
            <Input placeholder="Enter trainer name" />
          </Form.Item>
          <Form.Item
            name="duration"
            label="Duration"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <Input placeholder="e.g., 2 hours, 1 day" />
          </Form.Item>
          <Form.Item
            name="trainingDate"
            label="Training Date"
            rules={[{ required: true, message: 'Please select training date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit Training Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* EPF/ETF Modal */}
      <Modal
        title="Apply for EPF/ETF"
        open={epfModalVisible}
        onCancel={() => setEpfModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={epfForm} layout="vertical" onFinish={handleApplyEpfEtf}>
          <Form.Item
            name="basicSalary"
            label="Basic Salary"
            rules={[{ required: true, message: 'Please enter basic salary' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
              placeholder="Enter basic salary"
            />
          </Form.Item>
          <Alert
            message="EPF/ETF Calculation"
            description="Employee EPF: 8% | Employer EPF: 12% | Total Contribution: 20% of basic salary"
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit EPF/ETF Application
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Document Upload Modal */}
      <Modal
        title="Upload Document"
        open={documentModalVisible}
        onCancel={() => setDocumentModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={documentForm} layout="vertical" onFinish={handleUploadDocument}>
          <Form.Item
            name="documentType"
            label="Document Type"
            rules={[{ required: true, message: 'Please select document type' }]}
          >
            <Select placeholder="Select document type">
              <Option value="resume">Resume</Option>
              <Option value="certificate">Certificate</Option>
              <Option value="id_proof">ID Proof</Option>
              <Option value="educational">Educational</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="file"
            label="Document File"
            rules={[{ required: true, message: 'Please upload a file' }]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Upload Document
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        title="Submit Company Feedback"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={feedbackForm} layout="vertical" onFinish={handleSubmitFeedback}>
          <Form.Item
            name="feedbackType"
            label="Feedback Type"
            rules={[{ required: true, message: 'Please select feedback type' }]}
          >
            <Select placeholder="Select feedback type">
              <Option value="general">General Feedback</Option>
              <Option value="suggestion">Suggestion</Option>
              <Option value="complaint">Complaint</Option>
              <Option value="appreciation">Appreciation</Option>
              <Option value="improvement">Improvement Idea</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter subject' }]}
          >
            <Input placeholder="Enter feedback subject" />
          </Form.Item>
          <Form.Item
            name="rating"
            label="Rating (Optional)"
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter your feedback message' }]}
          >
            <TextArea rows={4} placeholder="Enter your detailed feedback..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit Feedback
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Profile Update Modal */}
      <Modal
        title="Update Profile"
        open={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="empaddress"
            label="Address"
          >
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;