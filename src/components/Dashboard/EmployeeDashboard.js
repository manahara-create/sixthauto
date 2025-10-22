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
  Badge,
  Alert,
  Divider,
  Tabs,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  Table,
  message,
  Descriptions,
  Timeline,
  Progress,
  InputNumber,
  Upload,
  Radio,
  Switch
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  LineChartOutlined,
  EyeOutlined,
  IdcardOutlined,
  PlusOutlined,
  UploadOutlined,
  HistoryOutlined,
  SolutionOutlined,
  BankOutlined,
  FileTextOutlined,
  LogoutOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

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

  // Modal states
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [epfModalVisible, setEpfModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Form states
  const [leaveForm] = Form.useForm();
  const [attendanceForm] = Form.useForm();
  const [loanForm] = Form.useForm();
  const [trainingForm] = Form.useForm();
  const [epfForm] = Form.useForm();
  const [profileForm] = Form.useForm();

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
        fetchTeamMembers()
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
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', profile.empid)
        .order('due_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setMyTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('employeeleave')
        .select(`
          *,
          leavetype:leavetype_id(leavetype)
        `)
        .eq('empid', profile.empid)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setMyLeaves(data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('empid', profile.empid)
        .eq('date', today);

      if (error) throw error;

      const currentMonth = dayjs().format('YYYY-MM');
      const { data: monthlyData } = await supabase
        .from('attendance')
        .select('*')
        .eq('empid', profile.empid)
        .like('date', `${currentMonth}%`)
        .eq('status', 'Present');

      setAttendanceData({
        todayStatus: data?.[0]?.status || 'Not Recorded',
        monthlyPresent: monthlyData?.length || 0,
        lastPunch: data?.[0]?.intime || 'N/A',
        todayRecord: data?.[0]
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchSalaryData = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select('*')
        .eq('empid', profile.empid)
        .order('salarydate', { ascending: false })
        .limit(1);

      if (error) throw error;
      setSalaryData(data?.[0] || {});
    } catch (error) {
      console.error('Error fetching salary data:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      // Using employee table leave balances
      setLeaveBalance({
        sick: profile.sickleavebalance || 14,
        fullDay: profile.fulldayleavebalance || 21,
        halfDay: profile.halfdayleavebalance || 5,
        short: profile.shortleavebalance || 7,
        maternity: profile.maternityleavebalance || 84
      });
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const fetchPromotionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_history')
        .select('*')
        .eq('empid', profile.empid)
        .order('promotiondate', { ascending: false });

      if (error) throw error;
      setPromotionHistory(data || []);
    } catch (error) {
      console.error('Error fetching promotion history:', error);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('loanrequest')
        .select(`
          *,
          loantype:loantype_id(loantype, description)
        `)
        .eq('empid', profile.empid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoanRequests(data || []);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
    }
  };

  const fetchTrainingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('employeetraining')
        .select(`
          *,
          training:training_id(topic, venue, trainer, date)
        `)
        .eq('empid', profile.empid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrainingRequests(data || []);
    } catch (error) {
      console.error('Error fetching training requests:', error);
    }
  };

  const fetchEpfEtfRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('epfnetf')
        .select('*')
        .eq('empid', profile.empid)
        .order('applieddate', { ascending: false });

      if (error) throw error;
      setEpfEtfRequests(data || []);
    } catch (error) {
      console.error('Error fetching EPF/ETF requests:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, first_name, last_name, role, department, avatarurl')
        .eq('status', 'Active')
        .neq('empid', profile.empid)
        .order('first_name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Action handlers
  const handleApplyLeave = async (values) => {
    try {
      const { data, error } = await supabase
        .from('employeeleave')
        .insert([{
          empid: profile.empid,
          leavetypeid: values.leaveType,
          leavefromdate: values.fromDate.format('YYYY-MM-DD'),
          leavetodate: values.toDate.format('YYYY-MM-DD'),
          leavereason: values.reason,
          duration: dayjs(values.toDate).diff(values.fromDate, 'day') + 1,
          leavestatus: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      message.success('Leave application submitted successfully!');
      setLeaveModalVisible(false);
      leaveForm.resetFields();
      fetchMyLeaves();
      fetchLeaveBalance();
    } catch (error) {
      console.error('Error applying leave:', error);
      message.error('Failed to submit leave application');
    }
  };

  const handleMarkAttendance = async (values) => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const currentTime = dayjs().format('HH:mm:ss');

      if (attendanceData.todayRecord) {
        // Update out time
        const { error } = await supabase
          .from('attendance')
          .update({
            outtime: currentTime,
            status: 'Present'
          })
          .eq('attendanceid', attendanceData.todayRecord.attendanceid);

        if (error) throw error;
        message.success('Out time recorded successfully!');
      } else {
        // Create new attendance record
        const { error } = await supabase
          .from('attendance')
          .insert([{
            empid: profile.empid,
            date: today,
            intime: currentTime,
            status: 'Present',
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        message.success('In time recorded successfully!');
      }

      setAttendanceModalVisible(false);
      attendanceForm.resetFields();
      fetchAttendanceData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      message.error('Failed to record attendance');
    }
  };

  const handleApplyLoan = async (values) => {
    try {
      const { data, error } = await supabase
        .from('loanrequest')
        .insert([{
          empid: profile.empid,
          loantypeid: values.loanType,
          amount: values.amount,
          duration: values.duration,
          date: dayjs().format('YYYY-MM-DD'),
          interestrate: 8.5, // Default interest rate
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      message.success('Loan application submitted successfully!');
      setLoanModalVisible(false);
      loanForm.resetFields();
      fetchLoanRequests();
    } catch (error) {
      console.error('Error applying for loan:', error);
      message.error('Failed to submit loan application');
    }
  };

  const handleRequestTraining = async (values) => {
    try {
      // First create training record
      const { data: trainingData, error: trainingError } = await supabase
        .from('training')
        .insert([{
          topic: values.topic,
          venue: values.venue,
          trainer: values.trainer,
          duration: values.duration,
          date: values.trainingDate.format('YYYY-MM-DD'),
          created_at: new Date().toISOString()
        }])
        .select();

      if (trainingError) throw trainingError;

      // Then link to employee
      const { error: linkError } = await supabase
        .from('employeetraining')
        .insert([{
          empid: profile.empid,
          trainingid: trainingData[0].trainingid,
          starttime: values.startTime.format('HH:mm:ss'),
          endtime: values.endTime.format('HH:mm:ss'),
          created_at: new Date().toISOString()
        }]);

      if (linkError) throw linkError;

      message.success('Training request submitted successfully!');
      setTrainingModalVisible(false);
      trainingForm.resetFields();
      fetchTrainingRequests();
    } catch (error) {
      console.error('Error requesting training:', error);
      message.error('Failed to submit training request');
    }
  };

  const handleApplyEpfEtf = async (values) => {
    try {
      const { data, error } = await supabase
        .from('epfnetf')
        .insert([{
          empid: profile.empid,
          basicsalary: values.basicSalary,
          epfcalculation: values.basicSalary * 0.08, // 8% EPF
          etfcalculation: values.basicSalary * 0.03, // 3% ETF
          applieddate: new Date().toISOString(),
          status: 'pending'
        }]);

      if (error) throw error;

      message.success('EPF/ETF application submitted successfully!');
      setEpfModalVisible(false);
      epfForm.resetFields();
      fetchEpfEtfRequests();
    } catch (error) {
      console.error('Error applying for EPF/ETF:', error);
      message.error('Failed to submit EPF/ETF application');
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      const { error } = await supabase
        .from('employee')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
          empaddress: values.address,
          updated_at: new Date().toISOString()
        })
        .eq('empid', profile.empid);

      if (error) throw error;

      message.success('Profile updated successfully!');
      setProfileModalVisible(false);
      // Refresh the page to get updated profile
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
      in_progress: 'blue',
      completed: 'green',
      'Not Recorded': 'red',
      Present: 'green'
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
            key: 'career',
            label: 'My Career',
            children: <CareerTab 
              promotionHistory={promotionHistory}
              profile={profile}
            />
          },
          {
            key: 'team',
            label: 'Team Directory',
            children: <TeamTab teamMembers={teamMembers} />
          },
          {
            key: 'profile',
            label: 'My Profile',
            children: <ProfileTab 
              profile={profile}
              onEditProfile={() => {
                profileForm.setFieldsValue({
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  phone: profile.phone,
                  address: profile.empaddress,
                  email: profile.email
                });
                setProfileModalVisible(true);
              }}
            />
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
          <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select leave type">
              <Option value={1}>Sick Leave</Option>
              <Option value={2}>Full Day Leave</Option>
              <Option value={3}>Half Day Leave</Option>
              <Option value={4}>Short Leave</Option>
              <Option value={5}>Maternity Leave</Option>
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
            style={{ width: '150px', height: '150px', borderRadius: '75px' }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {attendanceData.todayRecord ? 'Punch Out' : 'Punch In'}
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                {dayjs().format('HH:mm:ss')}
              </div>
            </div>
          </Button>
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
          <Form.Item name="loanType" label="Loan Type" rules={[{ required: true }]}>
            <Select placeholder="Select loan type">
              <Option value={1}>House Loan</Option>
              <Option value={2}>Staff Loan</Option>
              <Option value={3}>Vehicle Loan</Option>
              <Option value={4}>Product Loan</Option>
              <Option value={5}>Emergency Loan</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Loan Amount" rules={[{ required: true }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              min={1000} 
              max={1000000}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item name="duration" label="Duration (Months)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} max={60} />
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
          <Form.Item name="topic" label="Training Topic" rules={[{ required: true }]}>
            <Input placeholder="Enter training topic" />
          </Form.Item>
          <Form.Item name="venue" label="Venue" rules={[{ required: true }]}>
            <Input placeholder="Enter training venue" />
          </Form.Item>
          <Form.Item name="trainer" label="Trainer" rules={[{ required: true }]}>
            <Input placeholder="Enter trainer name" />
          </Form.Item>
          <Form.Item name="duration" label="Duration" rules={[{ required: true }]}>
            <Input placeholder="e.g., 2 hours, 1 day" />
          </Form.Item>
          <Form.Item name="trainingDate" label="Training Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
                <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="End Time" rules={[{ required: true }]}>
                <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
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
          <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/LKR\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Alert
            message="EPF/ETF Calculation"
            description="EPF: 8% of basic salary | ETF: 3% of basic salary"
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
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email" label="Email">
            <Input disabled />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
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

// Tab Components
const OverviewTab = ({ profile, myTasks, myLeaves, attendanceData, salaryData, leaveBalance, getStatusColor, onMarkAttendance, onApplyLeave }) => (
  <div>
    <Alert
      message={`Welcome back, ${profile.first_name}!`}
      description="Here's your personalized dashboard with quick access to all features."
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
    />

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
            <Button icon={<DollarOutlined />}>
              View Salary
            </Button>
            <Button icon={<FileTextOutlined />}>
              My Documents
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Recent Tasks" size="small" extra={<Button type="link">View All</Button>}>
          <List
            dataSource={myTasks}
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
            dataSource={myLeaves}
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
                    title={type.charAt(0).toUpperCase() + type.slice(1)}
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
            dataIndex: ['training', 'topic'],
            key: 'topic',
          },
          {
            title: 'Venue',
            dataIndex: ['training', 'venue'],
            key: 'venue',
          },
          {
            title: 'Trainer',
            dataIndex: ['training', 'trainer'],
            key: 'trainer',
          },
          {
            title: 'Date',
            dataIndex: ['training', 'date'],
            key: 'date',
            render: (date) => dayjs(date).format('MMM D, YYYY')
          },
          {
            title: 'Duration',
            dataIndex: ['training', 'duration'],
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
            dataIndex: 'applieddate',
            key: 'applieddate',
            render: (date) => dayjs(date).format('MMM D, YYYY')
          },
          {
            title: 'Basic Salary',
            dataIndex: 'basicsalary',
            key: 'basicsalary',
            render: (salary) => `LKR ${salary?.toLocaleString()}`
          },
          {
            title: 'EPF Amount',
            dataIndex: 'epfcalculation',
            key: 'epfcalculation',
            render: (amount) => `LKR ${amount?.toLocaleString()}`
          },
          {
            title: 'ETF Amount',
            dataIndex: 'etfcalculation',
            key: 'etfcalculation',
            render: (amount) => `LKR ${amount?.toLocaleString()}`
          },
          {
            title: 'Total Contribution',
            key: 'total',
            render: (_, record) => `LKR ${((record.epfcalculation || 0) + (record.etfcalculation || 0))?.toLocaleString()}`
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
          }
        ]}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  </div>
);

const CareerTab = ({ promotionHistory, profile }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="Career Journey">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Current Position">{profile.role}</Descriptions.Item>
            <Descriptions.Item label="Department">{profile.department}</Descriptions.Item>
            <Descriptions.Item label="Tenure">{profile.tenure || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="KPI Score">{profile.kpiscore || 'N/A'}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    </Row>

    <Card title="Promotion History">
      <Timeline>
        {promotionHistory.length > 0 ? (
          promotionHistory.map((promotion, index) => (
            <Timeline.Item key={index} color="green">
              <Text strong>{dayjs(promotion.promotiondate).format('MMMM YYYY')}</Text>
              <br />
              <Text>{promotion.previousrole} → {promotion.newrole}</Text>
              <br />
              <Text type="secondary">Promoted by: {promotion.promotedby}</Text>
            </Timeline.Item>
          ))
        ) : (
          <Timeline.Item color="gray">
            <Text type="secondary">No promotion history available</Text>
          </Timeline.Item>
        )}
        <Timeline.Item color="blue">
          <Text strong>Joined Company</Text>
          <br />
          <Text>{profile.role} - {profile.department}</Text>
          <br />
          <Text type="secondary">{dayjs(profile.created_at).format('MMMM YYYY')}</Text>
        </Timeline.Item>
      </Timeline>
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
              style={{ textAlign: 'center' }}
            >
              <Avatar
                size={64}
                icon={<UserOutlined />}
                src={employee.avatarurl}
                style={{ marginBottom: 12 }}
              />
              <Title level={5} style={{ margin: 0 }}>
                {employee.first_name} {employee.last_name}
              </Title>
              <Text type="secondary">{employee.role}</Text>
              <br />
              <Tag color="blue" style={{ marginTop: 8 }}>
                {employee.department}
              </Tag>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  </div>
);

const ProfileTab = ({ profile, onEditProfile }) => (
  <div>
    <Card 
      title="Personal Information" 
      extra={<Button type="primary" onClick={onEditProfile}>Edit Profile</Button>}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Employee ID">{profile.empid}</Descriptions.Item>
        <Descriptions.Item label="Full Name">{profile.first_name} {profile.last_name}</Descriptions.Item>
        <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{profile.phone || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Role">{profile.role}</Descriptions.Item>
        <Descriptions.Item label="Department">{profile.department}</Descriptions.Item>
        <Descriptions.Item label="Date of Birth">
          {profile.dob ? dayjs(profile.dob).format('MMM D, YYYY') : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Gender">{profile.gender || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Address" span={2}>
          {profile.empaddress || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={profile.is_active ? 'green' : 'red'}>
            {profile.is_active ? 'Active' : 'Inactive'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Member Since">
          {dayjs(profile.created_at).format('MMM D, YYYY')}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  </div>
);

export default EmployeeDashboard;