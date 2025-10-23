import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, List, Typography, Tag, Button, Space, Avatar,
  Badge, Alert, Divider, Tabs, Form, Input, Select, DatePicker, Modal, Table,
  message, Descriptions, Timeline, Progress, InputNumber, Upload, Steps
} from 'antd';
import {
  UserOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DollarOutlined, TeamOutlined, LineChartOutlined, EyeOutlined, IdcardOutlined,
  PlusOutlined, UploadOutlined, HistoryOutlined, SolutionOutlined, BankOutlined,
  FileTextOutlined, LogoutOutlined, LoginOutlined, MessageOutlined
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

  // Modal states
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [epfModalVisible, setEpfModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);

  // Form states
  const [leaveForm] = Form.useForm();
  const [loanForm] = Form.useForm();
  const [trainingForm] = Form.useForm();
  const [epfForm] = Form.useForm();
  const [documentForm] = Form.useForm();

  useEffect(() => {
    if (profile) {
      initializeDashboard();
    }
  }, [profile]);

  const initializeDashboard = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await Promise.all([
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
        fetchDocuments()
      ]);
    } catch (error) {
      console.error('Error initializing employee dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Data fetching functions
  const fetchMyTasks = async () => {
    try {
      const data = await DatabaseService.getTasks(profile.empid);
      setMyTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const data = await DatabaseService.getEmployeeLeaves(profile.empid);
      setMyLeaves(data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const attendance = await DatabaseService.getAttendance(profile.empid, today);
      const currentRecord = attendance[0];

      const monthlyData = await DatabaseService.getAttendance(profile.empid);
      const monthlyPresent = monthlyData.filter(a => a.status === 'Present').length;

      setAttendanceData({
        todayStatus: currentRecord?.status || 'Not Recorded',
        monthlyPresent,
        lastPunch: currentRecord?.intime || 'N/A',
        todayRecord: currentRecord
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchSalaryData = async () => {
    try {
      const data = await DatabaseService.getSalaryData(profile.empid);
      setSalaryData(data[0] || {});
    } catch (error) {
      console.error('Error fetching salary data:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    setLeaveBalance({
      sick: profile.sickleavebalance || 14,
      fullDay: profile.fulldayleavebalance || 21,
      halfDay: profile.halfdayleavebalance || 5,
      short: profile.shortleavebalance || 7,
      maternity: profile.maternityleavebalance || 84
    });
  };

  const fetchPromotionHistory = async () => {
    try {
      // This would typically come from promotion_history table
      setPromotionHistory([]);
    } catch (error) {
      console.error('Error fetching promotion history:', error);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      const data = await DatabaseService.getLoans(profile.empid);
      setLoanRequests(data);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
    }
  };

  const fetchTrainingRequests = async () => {
    try {
      const data = await DatabaseService.getTrainings(profile.empid);
      setTrainingRequests(data);
    } catch (error) {
      console.error('Error fetching training requests:', error);
    }
  };

  const fetchEpfEtfRequests = async () => {
    try {
      const data = await DatabaseService.getEPFContributions(profile.empid);
      setEpfEtfRequests(data);
    } catch (error) {
      console.error('Error fetching EPF/ETF requests:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const employees = await DatabaseService.getEmployees();
      // Filter out current user and get active employees
      const team = employees.filter(emp => 
        emp.empid !== profile.empid && emp.is_active
      );
      setTeamMembers(team);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchDocuments = async () => {
    // This would typically fetch from a documents table
    setDocuments([]);
  };

  // Action handlers
  const handleApplyLeave = async (values) => {
    try {
      const fromDate = values.fromDate.format('YYYY-MM-DD');
      const toDate = values.toDate.format('YYYY-MM-DD');
      const duration = dayjs(toDate).diff(dayjs(fromDate), 'day') + 1;

      const leaveData = {
        empid: profile.empid,
        leavetypeid: values.leaveType,
        leavefromdate: fromDate,
        leavetodate: toDate,
        leavereason: values.reason,
        duration: duration,
        leavestatus: 'pending'
      };

      const result = await DatabaseService.insertData('employeeleave', leaveData);

      if (result) {
        message.success('Leave application submitted successfully!');
        setLeaveModalVisible(false);
        leaveForm.resetFields();
        fetchMyLeaves();
      } else {
        message.error('Failed to submit leave application');
      }
    } catch (error) {
      console.error('Error applying leave:', error);
      message.error('Failed to submit leave application');
    }
  };

  const handleMarkAttendance = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const currentTime = dayjs().format('HH:mm:ss');

      if (attendanceData.todayRecord) {
        // Update out time
        await DatabaseService.updateData(
          'attendance',
          {
            outtime: currentTime,
            status: 'Present'
          },
          { attendanceid: attendanceData.todayRecord.attendanceid }
        );
        message.success('Out time recorded successfully!');
      } else {
        // Create new attendance record
        await DatabaseService.insertData('attendance', {
          empid: profile.empid,
          date: today,
          intime: currentTime,
          status: 'Present'
        });
        message.success('In time recorded successfully!');
      }

      setAttendanceModalVisible(false);
      fetchAttendanceData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      message.error('Failed to record attendance');
    }
  };

  const handleApplyLoan = async (values) => {
    try {
      const loanData = {
        empid: profile.empid,
        loantypeid: values.loanType,
        amount: values.amount,
        duration: values.duration,
        date: dayjs().format('YYYY-MM-DD'),
        interestrate: 8.5,
        status: 'pending'
      };

      const result = await DatabaseService.insertData('loanrequest', loanData);

      if (result) {
        message.success('Loan application submitted successfully!');
        setLoanModalVisible(false);
        loanForm.resetFields();
        fetchLoanRequests();
      } else {
        message.error('Failed to submit loan application');
      }
    } catch (error) {
      console.error('Error applying for loan:', error);
      message.error('Failed to submit loan application');
    }
  };

  const handleRequestTraining = async (values) => {
    try {
      const trainingData = {
        topic: values.topic,
        venue: values.venue,
        trainer: values.trainer,
        duration: values.duration,
        date: values.trainingDate.format('YYYY-MM-DD'),
        empid: profile.empid
      };

      const result = await DatabaseService.insertData('training', trainingData);

      if (result) {
        message.success('Training request submitted successfully!');
        setTrainingModalVisible(false);
        trainingForm.resetFields();
        fetchTrainingRequests();
      } else {
        message.error('Failed to submit training request');
      }
    } catch (error) {
      console.error('Error requesting training:', error);
      message.error('Failed to submit training request');
    }
  };

  const handleApplyEpfEtf = async (values) => {
    try {
      const epfData = {
        empid: profile.empid,
        basicsalary: values.basicSalary,
        employeecontribution: values.basicSalary * 0.08,
        employercontribution: values.basicSalary * 0.12,
        totalcontribution: values.basicSalary * 0.20,
        month: dayjs().format('YYYY-MM-DD'),
        status: 'pending'
      };

      const result = await DatabaseService.insertData('epf_contributions', epfData);

      if (result) {
        message.success('EPF/ETF application submitted successfully!');
        setEpfModalVisible(false);
        epfForm.resetFields();
        fetchEpfEtfRequests();
      } else {
        message.error('Failed to submit EPF/ETF application');
      }
    } catch (error) {
      console.error('Error applying for EPF/ETF:', error);
      message.error('Failed to submit EPF/ETF application');
    }
  };

  const handleUploadDocument = async (values) => {
    try {
      const { file } = values;
      if (file) {
        const uploadResult = await FileService.uploadFile(file[0].originFileObj);
        
        if (uploadResult.success) {
          // Save document record to database
          const docData = {
            empid: profile.empid,
            document_name: file[0].name,
            file_path: uploadResult.filePath,
            file_url: uploadResult.publicUrl,
            upload_date: dayjs().format('YYYY-MM-DD'),
            document_type: values.documentType
          };

          // You would typically save this to a documents table
          message.success('Document uploaded successfully!');
          setDocumentModalVisible(false);
          documentForm.resetFields();
          fetchDocuments();
        } else {
          message.error('Failed to upload document: ' + uploadResult.error);
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      message.error('Failed to upload document');
    }
  };

  const handleRoleNavigation = () => {
    const roleRoutes = {
      'admin': '/admin/dashboard',
      'hr': '/hr/dashboard',
      'ceo': '/ceo/dashboard',
      'manager': '/manager/dashboard',
      'accountant': '/accountant/dashboard'
    };
    
    const route = roleRoutes[profile.role];
    if (route) {
      navigate(route);
    }
  };

  const generateReport = async (type) => {
    try {
      switch (type) {
        case 'salary':
          await ReportService.generateSalaryReport('month', profile.empid);
          break;
        case 'attendance':
          await ReportService.generateAttendanceReport('month', profile.empid);
          break;
        case 'leave':
          await ReportService.generateLeaveReport('month', profile.empid);
          break;
        default:
          message.warning('Report type not implemented');
      }
      message.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
      completed: 'green',
      'in_progress': 'blue',
      'Not Recorded': 'red',
      'Present': 'green'
    };
    return colors[status] || 'default';
  };

  if (!profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert message="Please log in to access the dashboard" type="warning" />
      </div>
    );
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
        items={[
          {
            key: 'overview',
            label: 'Overview',
            children: <OverviewTab 
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
          },
          {
            key: 'leaves',
            label: 'Leaves',
            children: <LeavesTab 
              myLeaves={myLeaves}
              leaveBalance={leaveBalance}
              onApplyLeave={() => setLeaveModalVisible(true)}
              getStatusColor={getStatusColor}
            />
          },
          {
            key: 'attendance',
            label: 'Attendance',
            children: <AttendanceTab 
              attendanceData={attendanceData}
              onMarkAttendance={() => setAttendanceModalVisible(true)}
            />
          },
          {
            key: 'documents',
            label: 'Documents',
            children: <DocumentsTab 
              documents={documents}
              onUploadDocument={() => setDocumentModalVisible(true)}
            />
          },
          {
            key: 'loans',
            label: 'Loans',
            children: <LoansTab 
              loanRequests={loanRequests}
              onApplyLoan={() => setLoanModalVisible(true)}
              getStatusColor={getStatusColor}
            />
          },
          {
            key: 'training',
            label: 'Training',
            children: <TrainingTab 
              trainingRequests={trainingRequests}
              onRequestTraining={() => setTrainingModalVisible(true)}
              getStatusColor={getStatusColor}
            />
          },
          {
            key: 'epf-etf',
            label: 'EPF/ETF',
            children: <EpfEtfTab 
              epfEtfRequests={epfEtfRequests}
              onApplyEpfEtf={() => setEpfModalVisible(true)}
              getStatusColor={getStatusColor}
            />
          },
          {
            key: 'team',
            label: 'Team Directory',
            children: <TeamTab teamMembers={teamMembers} />
          }
        ]}
      />

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
    </div>
  );
};

// Tab Components
const OverviewTab = ({ 
  profile, myTasks, myLeaves, attendanceData, salaryData, leaveBalance, 
  getStatusColor, onMarkAttendance, onApplyLeave, onGenerateReport 
}) => (
  <div>
    {/* Quick Stats */}
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Pending Tasks"
            value={myTasks.length}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Leave Balance"
            value={leaveBalance.fullDay}
            suffix="days"
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="KPI Score"
            value={profile.kpiscore || 88}
            suffix="/100"
            prefix={<LineChartOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="OT Hours"
            value={profile.othours || 12}
            suffix="hrs"
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>

    {/* Quick Actions */}
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="Quick Actions" size="small">
          <Space wrap>
            <Button type="primary" icon={<LoginOutlined />} onClick={onMarkAttendance}>
              Mark Attendance
            </Button>
            <Button icon={<CalendarOutlined />} onClick={onApplyLeave}>
              Apply Leave
            </Button>
            <Button 
              icon={<DollarOutlined />}
              onClick={() => onGenerateReport('salary')}
            >
              Salary Report
            </Button>
            <Button 
              icon={<FileTextOutlined />}
              onClick={() => onGenerateReport('attendance')}
            >
              Attendance Report
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Recent Tasks" size="small" extra={<Button type="link">View All</Button>}>
          <List
            dataSource={myTasks.slice(0, 5)}
            renderItem={task => (
              <List.Item>
                <List.Item.Meta
                  title={task.title}
                  description={
                    <Space>
                      <Text>Due: {dayjs(task.due_date).format('MMM D, YYYY')}</Text>
                      <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 'No pending tasks' }}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Recent Leave Applications" size="small" extra={<Button type="link">View All</Button>}>
          <List
            dataSource={myLeaves.slice(0, 5)}
            renderItem={leave => (
              <List.Item>
                <List.Item.Meta
                  title={`${dayjs(leave.leavefromdate).format('MMM D')} - ${dayjs(leave.leavetodate).format('MMM D, YYYY')}`}
                  description={
                    <Space>
                      <Text>{leave.leavetype?.leavetype}</Text>
                      <Tag color={getStatusColor(leave.leavestatus)}>{leave.leavestatus}</Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 'No leave applications' }}
          />
        </Card>
      </Col>
    </Row>

    {/* Salary Information */}
    <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
      <Col span={24}>
        <Card title="Salary Information" size="small">
          {salaryData.salaryid ? (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Basic Salary">
                ${salaryData.basicsalary?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="OT Pay">
                ${salaryData.otpay?.toFixed(2) || '0.00'}
              </Descriptions.Item>
              <Descriptions.Item label="Bonus Pay">
                ${salaryData.bonuspay?.toFixed(2) || '0.00'}
              </Descriptions.Item>
              <Descriptions.Item label="Total Salary">
                <Text strong>${salaryData.totalsalary?.toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Date">
                {dayjs(salaryData.salarydate).format('MMM D, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={salaryData.processed_by ? 'green' : 'orange'}>
                  {salaryData.processed_by ? 'Processed' : 'Pending'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              No salary data available
            </div>
          )}
        </Card>
      </Col>
    </Row>
  </div>
);

const LeavesTab = ({ myLeaves, leaveBalance, onApplyLeave, getStatusColor }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Leave Balance" 
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={onApplyLeave}>Apply Leave</Button>}
        >
          <Row gutter={[16, 16]}>
            {Object.entries(leaveBalance).map(([type, balance]) => (
              <Col xs={12} sm={8} md={4} key={type}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title={type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                    value={balance}
                    suffix="days"
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
    </Row>

    <Card title="Leave History">
      <Table
        dataSource={myLeaves}
        columns={[
          {
            title: 'Leave Type',
            dataIndex: ['leavetype', 'leavetype'],
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
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration) => `${duration} days`
          },
          {
            title: 'Status',
            dataIndex: 'leavestatus',
            key: 'leavestatus',
            render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
          },
          {
            title: 'Reason',
            dataIndex: 'leavereason',
            key: 'leavereason',
            ellipsis: true
          }
        ]}
        pagination={{ pageSize: 10 }}
        rowKey="leaveid"
        locale={{ emptyText: 'No leave applications' }}
      />
    </Card>
  </div>
);

const AttendanceTab = ({ attendanceData, onMarkAttendance }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Today's Status"
            value={attendanceData.todayStatus}
            valueStyle={{ 
              color: attendanceData.todayStatus === 'Present' ? '#52c41a' : '#f5222d' 
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Monthly Present"
            value={attendanceData.monthlyPresent}
            suffix="days"
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Last Punch"
            value={attendanceData.lastPunch}
          />
        </Card>
      </Col>
    </Row>

    <Card 
      title="Attendance Records" 
      extra={
        <Button type="primary" icon={<LoginOutlined />} onClick={onMarkAttendance}>
          Mark Attendance
        </Button>
      }
    >
      <Alert
        message="Attendance Instructions"
        description="Click 'Mark Attendance' to record your in/out time. Today's status will be updated automatically."
        type="info"
        showIcon
      />
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
              dataIndex: 'upload_date',
              key: 'upload_date',
              render: (date) => dayjs(date).format('MMM D, YYYY')
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button type="link" size="small">Download</Button>
                  <Button type="link" danger size="small">Delete</Button>
                </Space>
              )
            }
          ]}
          pagination={{ pageSize: 10 }}
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
      title="My Loan Applications" 
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={onApplyLoan}>Apply for Loan</Button>}
    >
      <Table
        dataSource={loanRequests}
        columns={[
          {
            title: 'Loan Type',
            dataIndex: ['loantype', 'loantype'],
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
            title: 'Interest Rate',
            dataIndex: 'interestrate',
            key: 'interestrate',
            render: (rate) => `${rate}%`
          },
          {
            title: 'Applied Date',
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
        rowKey="loanrequestid"
        locale={{ emptyText: 'No loan applications' }}
      />
    </Card>
  </div>
);

const TrainingTab = ({ trainingRequests, onRequestTraining, getStatusColor }) => (
  <div>
    <Card 
      title="My Training Requests" 
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={onRequestTraining}>Request Training</Button>}
    >
      <Table
        dataSource={trainingRequests}
        columns={[
          {
            title: 'Training Topic',
            dataIndex: 'topic',
            key: 'topic',
          },
          {
            title: 'Venue',
            dataIndex: 'venue',
            key: 'venue',
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
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={getStatusColor(status)}>{status || 'Requested'}</Tag>
          }
        ]}
        pagination={{ pageSize: 10 }}
        rowKey="trainingid"
        locale={{ emptyText: 'No training requests' }}
      />
    </Card>
  </div>
);

const EpfEtfTab = ({ epfEtfRequests, onApplyEpfEtf, getStatusColor }) => (
  <div>
    <Card 
      title="EPF/ETF Applications" 
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={onApplyEpfEtf}>Apply for EPF/ETF</Button>}
    >
      <Table
        dataSource={epfEtfRequests}
        columns={[
          {
            title: 'Applied Date',
            dataIndex: 'month',
            key: 'month',
            render: (date) => dayjs(date).format('MMM D, YYYY')
          },
          {
            title: 'Basic Salary',
            dataIndex: 'basicsalary',
            key: 'basicsalary',
            render: (salary) => `LKR ${salary?.toLocaleString()}`
          },
          {
            title: 'Employee EPF (8%)',
            dataIndex: 'employeecontribution',
            key: 'employeecontribution',
            render: (amount) => `LKR ${amount?.toLocaleString()}`
          },
          {
            title: 'Employer EPF (12%)',
            dataIndex: 'employercontribution',
            key: 'employercontribution',
            render: (amount) => `LKR ${amount?.toLocaleString()}`
          },
          {
            title: 'Total Contribution',
            dataIndex: 'totalcontribution',
            key: 'totalcontribution',
            render: (amount) => `LKR ${amount?.toLocaleString()}`
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
        locale={{ emptyText: 'No EPF/ETF applications' }}
      />
    </Card>
  </div>
);

const TeamTab = ({ teamMembers }) => (
  <div>
    <Card title="Team Directory">
      <Row gutter={[16, 16]}>
        {teamMembers.map(employee => (
          <Col xs={24} sm={12} md={8} lg={6} key={employee.empid}>
            <Card
              size="small"
              hoverable
              style={{ textAlign: 'center', height: '100%' }}
              bodyStyle={{ padding: '16px' }}
            >
              <Avatar
                size={64}
                icon={<UserOutlined />}
                src={employee.avatarurl}
                style={{ marginBottom: 12 }}
              />
              <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                {employee.first_name} {employee.last_name}
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                {employee.role}
              </Text>
              <Tag color="blue" style={{ marginBottom: 8 }}>
                {employee.department}
              </Tag>
              <div style={{ marginTop: 8 }}>
                <Button type="link" size="small" icon={<MailOutlined />}>
                  Email
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  </div>
);

export default EmployeeDashboard;