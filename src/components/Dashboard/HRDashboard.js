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
  Timeline,
  Badge,
  Tooltip,
  Alert,
  Divider,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Table,
  message,
  Upload,
  Switch,
  Descriptions,
  InputNumber,
  Radio,
  Popconfirm,
  Empty
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  StarOutlined,
  TrophyOutlined,
  FileTextOutlined,
  DownloadOutlined,
  HistoryOutlined,
  SolutionOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  RiseOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const HRDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for all features
  const [dashboardData, setDashboardData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [recruitmentStats, setRecruitmentStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [promotions, setPromotions] = useState([]);

  // Modal states
  const [addEmployeeModalVisible, setAddEmployeeModalVisible] = useState(false);
  const [editEmployeeModalVisible, setEditEmployeeModalVisible] = useState(false);
  const [promoteEmployeeModalVisible, setPromoteEmployeeModalVisible] = useState(false);
  const [kpiModalVisible, setKpiModalVisible] = useState(false);
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [viewEmployeeModalVisible, setViewEmployeeModalVisible] = useState(false);

  // Form states
  const [employeeForm] = Form.useForm();
  const [editEmployeeForm] = Form.useForm();
  const [promoteEmployeeForm] = Form.useForm();
  const [kpiForm] = Form.useForm();
  const [trainingForm] = Form.useForm();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    initializeDashboard();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees]);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployeeStats(),
        fetchEmployees(),
        fetchPendingLeaves(),
        fetchRecruitmentStats(),
        fetchRecentActivities(),
        fetchTrainingData(),
        fetchKpiData(),
        fetchPromotions()
      ]);
    } catch (error) {
      console.error('Error initializing HR dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeStats = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, status, department, is_active, created_at, role')
        .eq('is_active', true);

      if (error) throw error;

      const totalEmployees = data?.length || 0;
      const departments = [...new Set(data?.map(emp => emp.department).filter(Boolean))];
      const activeEmployees = data?.filter(emp => emp.status === 'Active').length || 0;
      const newHires = data?.filter(emp => {
        const joinDate = dayjs(emp.created_at);
        return joinDate.isAfter(dayjs().subtract(30, 'day'));
      }).length || 0;

      // Role distribution
      const roleDistribution = data?.reduce((acc, emp) => {
        acc[emp.role] = (acc[emp.role] || 0) + 1;
        return acc;
      }, {});

      setDashboardData({
        employeeStats: { totalEmployees, departments: departments.length, activeEmployees, newHires },
        roleDistribution
      });
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPendingLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('employeeleave')
        .select(`
          *,
          employee:empid (first_name, last_name, email, department, role),
          leavetype:leavetype_id(leavetype)
        `)
        .eq('leavestatus', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaves(data || []);
    } catch (error) {
      console.error('Error fetching pending leaves:', error);
    }
  };

  const fetchRecruitmentStats = async () => {
    try {
      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('status', 'open');

      const { data: newHires } = await supabase
        .from('employee')
        .select('empid')
        .gte('created_at', dayjs().startOf('month').format('YYYY-MM-DD'));

      const { data: applications } = await supabase
        .from('employee')
        .select('empid')
        .is('status', 'Applied');

      setRecruitmentStats({
        openPositions: positions?.length || 0,
        newHiresThisMonth: newHires?.length || 0,
        pendingApplications: applications?.length || 0,
        interviewSchedule: 8
      });
    } catch (error) {
      console.error('Error fetching recruitment stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_operations')
        .select(`
          *,
          hr:hr_id (first_name, last_name),
          target_employee:target_employee_id (first_name, last_name)
        `)
        .order('operation_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchTrainingData = async () => {
    try {
      const { data, error } = await supabase
        .from('training')
        .select(`
          *,
          employeetraining!inner (employee:empid (first_name, last_name))
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTrainingData(data || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
    }
  };

  const fetchKpiData = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi')
        .select(`
          *,
          employee:empid (first_name, last_name, department),
          kpiranking:kpiranking_id (kpirank)
        `)
        .order('calculatedate', { ascending: false })
        .limit(10);

      if (error) throw error;
      setKpiData(data || []);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_history')
        .select(`
          *,
          employee:empid (first_name, last_name)
        `)
        .order('promotiondate', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(emp => 
      emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  // Action handlers
  const handleAddEmployee = async (values) => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: 'defaultpassword123', // Default password
        options: {
          data: {
            full_name: `${values.first_name} ${values.last_name}`,
            role: values.role,
            email_confirm: true // Auto-confirm for HR manual registration
          }
        }
      });

      if (authError) throw authError;

      // Then create employee record
      const { data: employeeData, error: employeeError } = await supabase
        .from('employee')
        .insert([{
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role: values.role,
          department: values.department,
          phone: values.phone,
          gender: values.gender,
          dob: values.dob?.format('YYYY-MM-DD'),
          empaddress: values.address,
          status: 'Active',
          is_active: true,
          auth_user_id: authData.user?.id,
          created_at: new Date().toISOString(),
          // Initialize leave balances
          sickleavebalance: 14,
          fulldayleavebalance: 21,
          halfdayleavebalance: 5,
          shortleavebalance: 7,
          maternityleavebalance: 84
        }])
        .select();

      if (employeeError) throw employeeError;

      // Log HR operation
      await logHROperation('ADD_EMPLOYEE', employeeData[0].empid, {
        employeeName: `${values.first_name} ${values.last_name}`,
        role: values.role,
        department: values.department
      });

      message.success('Employee added successfully!');
      setAddEmployeeModalVisible(false);
      employeeForm.resetFields();
      fetchEmployees();
      fetchEmployeeStats();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error adding employee:', error);
      message.error('Failed to add employee');
    }
  };

  const handleEditEmployee = async (values) => {
    try {
      const { error } = await supabase
        .from('employee')
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role: values.role,
          department: values.department,
          phone: values.phone,
          gender: values.gender,
          dob: values.dob?.format('YYYY-MM-DD'),
          empaddress: values.address,
          status: values.status,
          is_active: values.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('empid', values.empid);

      if (error) throw error;

      await logHROperation('UPDATE_EMPLOYEE', values.empid, {
        updates: values
      });

      message.success('Employee updated successfully!');
      setEditEmployeeModalVisible(false);
      editEmployeeForm.resetFields();
      fetchEmployees();
      fetchEmployeeStats();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error updating employee:', error);
      message.error('Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (employeeId, employeeName) => {
    try {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('employee')
        .update({
          is_active: false,
          status: 'Inactive',
          updated_at: new Date().toISOString()
        })
        .eq('empid', employeeId);

      if (error) throw error;

      await logHROperation('DELETE_EMPLOYEE', employeeId, {
        employeeName: employeeName
      });

      message.success('Employee deactivated successfully!');
      fetchEmployees();
      fetchEmployeeStats();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error deleting employee:', error);
      message.error('Failed to deactivate employee');
    }
  };

  const handlePromoteEmployee = async (values) => {
    try {
      // Update employee role
      const { error: updateError } = await supabase
        .from('employee')
        .update({
          role: values.new_role,
          department: values.department,
          updated_at: new Date().toISOString()
        })
        .eq('empid', values.empid);

      if (updateError) throw updateError;

      // Add to promotion history
      const { error: promotionError } = await supabase
        .from('promotion_history')
        .insert([{
          empid: values.empid,
          previousrole: values.previous_role,
          newrole: values.new_role,
          promotedby: `${profile.first_name} ${profile.last_name}`,
          promotiondate: new Date().toISOString()
        }]);

      if (promotionError) throw promotionError;

      await logHROperation('PROMOTE_EMPLOYEE', values.empid, {
        previousRole: values.previous_role,
        newRole: values.new_role,
        department: values.department,
        recommendation: values.recommendation
      });

      message.success('Employee promoted successfully!');
      setPromoteEmployeeModalVisible(false);
      promoteEmployeeForm.resetFields();
      fetchEmployees();
      fetchPromotions();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error promoting employee:', error);
      message.error('Failed to promote employee');
    }
  };

  const handleAddKPI = async (values) => {
    try {
      // Determine KPI ranking based on value
      let kpirankingid = 1; // Default to lowest rank
      if (values.kpivalue >= 90) kpirankingid = 4; // Excellent
      else if (values.kpivalue >= 80) kpirankingid = 3; // Good
      else if (values.kpivalue >= 70) kpirankingid = 2; // Average

      const { data, error } = await supabase
        .from('kpi')
        .insert([{
          empid: values.empid,
          kpivalue: values.kpivalue,
          calculatedate: values.calculation_date.format('YYYY-MM-DD'),
          kpiyear: values.calculation_date.year(),
          kpirankingid: kpirankingid,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Update employee's KPI score
      await supabase
        .from('employee')
        .update({ kpiscore: values.kpivalue })
        .eq('empid', values.empid);

      await logHROperation('ADD_KPI', data[0].kpiid, {
        employeeId: values.empid,
        kpiValue: values.kpivalue,
        ranking: kpirankingid
      });

      message.success('KPI added successfully!');
      setKpiModalVisible(false);
      kpiForm.resetFields();
      fetchKpiData();
      fetchEmployees();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error adding KPI:', error);
      message.error('Failed to add KPI');
    }
  };

  const handleScheduleTraining = async (values) => {
    try {
      const { data, error } = await supabase
        .from('training')
        .insert([{
          topic: values.topic,
          venue: values.venue,
          trainer: values.trainer,
          duration: values.duration,
          date: values.training_date.format('YYYY-MM-DD'),
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Link employees to training if selected
      if (values.employees && values.employees.length > 0) {
        const trainingLinks = values.employees.map(empId => ({
          trainingid: data[0].trainingid,
          empid: empId,
          starttime: values.start_time?.format('HH:mm:ss'),
          endtime: values.end_time?.format('HH:mm:ss'),
          created_at: new Date().toISOString()
        }));

        await supabase
          .from('employeetraining')
          .insert(trainingLinks);
      }

      await logHROperation('SCHEDULE_TRAINING', data[0].trainingid, {
        topic: values.topic,
        trainer: values.trainer,
        date: values.training_date.format('YYYY-MM-DD'),
        participants: values.employees?.length || 0
      });

      message.success('Training scheduled successfully!');
      setTrainingModalVisible(false);
      trainingForm.resetFields();
      fetchTrainingData();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error scheduling training:', error);
      message.error('Failed to schedule training');
    }
  };

  const handleApproveLeave = async (leaveId, employeeName) => {
    try {
      const { error } = await supabase
        .from('employeeleave')
        .update({ 
          leavestatus: 'approved',
          approvedby: profile.empid
        })
        .eq('leaveid', leaveId);

      if (error) throw error;
      
      await logHROperation('APPROVE_LEAVE', leaveId, {
        employeeName: employeeName,
        action: 'approved'
      });

      message.success('Leave approved successfully!');
      fetchPendingLeaves();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error approving leave:', error);
      message.error('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId, employeeName) => {
    try {
      const { error } = await supabase
        .from('employeeleave')
        .update({ 
          leavestatus: 'rejected',
          approvedby: profile.empid
        })
        .eq('leaveid', leaveId);

      if (error) throw error;

      await logHROperation('REJECT_LEAVE', leaveId, {
        employeeName: employeeName,
        action: 'rejected'
      });
      
      message.success('Leave rejected successfully!');
      fetchPendingLeaves();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      message.error('Failed to reject leave');
    }
  };

  const logHROperation = async (operation, recordId, details) => {
    try {
      await supabase
        .from('hr_operations')
        .insert([{
          operation,
          record_id: recordId,
          hr_id: profile.empid,
          target_employee_id: details.employeeId || recordId,
          details,
          operation_time: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging HR operation:', error);
    }
  };

  const openEditEmployeeModal = (employee) => {
    editEmployeeForm.setFieldsValue({
      empid: employee.empid,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      phone: employee.phone,
      gender: employee.gender,
      dob: employee.dob ? dayjs(employee.dob) : null,
      address: employee.empaddress,
      status: employee.status,
      is_active: employee.is_active
    });
    setEditEmployeeModalVisible(true);
  };

  const openPromoteEmployeeModal = (employee) => {
    promoteEmployeeForm.setFieldsValue({
      empid: employee.empid,
      previous_role: employee.role,
      new_role: employee.role,
      department: employee.department
    });
    setPromoteEmployeeModalVisible(true);
  };

  const openAddKPIModal = (employee) => {
    kpiForm.setFieldsValue({
      empid: employee.empid
    });
    setKpiModalVisible(true);
  };

  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'first_name',
      key: 'employee',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatarurl} />
          <div>
            <div>{record.first_name} {record.last_name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color="blue">{role}</Tag>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {status} {record.is_active ? '' : '(Inactive)'}
        </Tag>
      )
    },
    {
      title: 'KPI Score',
      dataIndex: 'kpiscore',
      key: 'kpiscore',
      render: (score) => score ? `${score}/100` : 'N/A'
    },
    {
      title: 'Join Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => setViewEmployeeModalVisible(record)}
          >
            View
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => openEditEmployeeModal(record)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<RiseOutlined />}
            onClick={() => openPromoteEmployeeModal(record)}
          >
            Promote
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<StarOutlined />}
            onClick={() => openAddKPIModal(record)}
          >
            Add KPI
          </Button>
          <Popconfirm
            title="Are you sure to deactivate this employee?"
            onConfirm={() => handleDeleteEmployee(record.empid, `${record.first_name} ${record.last_name}`)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<UserDeleteOutlined />}
            >
              Deactivate
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

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
        background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <TeamOutlined style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                HR Manager Dashboard
              </Title>
              <Badge count={<TeamOutlined />} offset={[-5, 0]}>
                <Tag color="white" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  {profile?.first_name} {profile?.last_name}
                </Tag>
              </Badge>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'white' }}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Welcome Alert */}
      <Alert
        message={`Welcome back, ${profile?.first_name || 'HR Manager'}!`}
        description="Manage employees, leaves, recruitment, training, and all HR operations from this dashboard."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          <OverviewTab 
            dashboardData={dashboardData}
            recruitmentStats={recruitmentStats}
            leaves={leaves}
            recentActivities={recentActivities}
            onAddEmployee={() => setAddEmployeeModalVisible(true)}
            onApproveLeave={handleApproveLeave}
            onRejectLeave={handleRejectLeave}
          />
        </TabPane>
        
        <TabPane tab="Employee Management" key="employees">
          <EmployeeManagementTab 
            employees={filteredEmployees}
            employeeColumns={employeeColumns}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddEmployee={() => setAddEmployeeModalVisible(true)}
            loading={loading}
          />
        </TabPane>
        
        <TabPane tab="Performance & KPI" key="performance">
          <PerformanceTab 
            kpiData={kpiData}
            employees={employees}
            onAddKPI={() => setKpiModalVisible(true)}
          />
        </TabPane>
        
        <TabPane tab="Training & Development" key="training">
          <TrainingTab 
            trainingData={trainingData}
            employees={employees}
            onScheduleTraining={() => setTrainingModalVisible(true)}
          />
        </TabPane>
        
        <TabPane tab="Promotions" key="promotions">
          <PromotionsTab promotions={promotions} />
        </TabPane>
        
        <TabPane tab="HR Activities" key="activities">
          <ActivitiesTab recentActivities={recentActivities} />
        </TabPane>
      </Tabs>

      {/* Add Employee Modal */}
      <Modal
        title="Add New Employee"
        open={addEmployeeModalVisible}
        onCancel={() => setAddEmployeeModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={employeeForm} layout="vertical" onFinish={handleAddEmployee}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select placeholder="Select role">
                  <Option value="employee">Employee</Option>
                  <Option value="manager">Manager</Option>
                  <Option value="hr">HR</Option>
                  <Option value="accountant">Accountant</Option>
                  <Option value="ceo">CEO</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select placeholder="Select department">
                  <Option value="IT">IT</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Operations">Operations</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Marketing">Marketing</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                <Select placeholder="Select gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="dob" label="Date of Birth">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Add Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        title="Edit Employee"
        open={editEmployeeModalVisible}
        onCancel={() => setEditEmployeeModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={editEmployeeForm} layout="vertical" onFinish={handleEditEmployee}>
          <Form.Item name="empid" hidden>
            <Input />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select>
                  <Option value="employee">Employee</Option>
                  <Option value="manager">Manager</Option>
                  <Option value="hr">HR</Option>
                  <Option value="accountant">Accountant</Option>
                  <Option value="ceo">CEO</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select>
                  <Option value="IT">IT</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Operations">Operations</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Marketing">Marketing</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                <Select>
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="dob" label="Date of Birth">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select>
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                  <Option value="On Leave">On Leave</Option>
                  <Option value="Suspended">Suspended</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Promote Employee Modal */}
      <Modal
        title="Promote Employee"
        open={promoteEmployeeModalVisible}
        onCancel={() => setPromoteEmployeeModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={promoteEmployeeForm} layout="vertical" onFinish={handlePromoteEmployee}>
          <Form.Item name="empid" hidden>
            <Input />
          </Form.Item>
          
          <Form.Item name="previous_role" label="Current Role">
            <Input disabled />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="new_role" label="New Role" rules={[{ required: true }]}>
                <Select>
                  <Option value="employee">Employee</Option>
                  <Option value="manager">Manager</Option>
                  <Option value="hr">HR</Option>
                  <Option value="accountant">Accountant</Option>
                  <Option value="ceo">CEO</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select>
                  <Option value="IT">IT</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Operations">Operations</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Marketing">Marketing</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="recommendation" label="Recommendation">
            <TextArea rows={4} placeholder="Enter promotion recommendation and reasons..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Promote Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add KPI Modal */}
      <Modal
        title="Add KPI Score"
        open={kpiModalVisible}
        onCancel={() => setKpiModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={kpiForm} layout="vertical" onFinish={handleAddKPI}>
          <Form.Item name="empid" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="kpivalue" label="KPI Score (0-100)" rules={[{ required: true }]}>
            <InputNumber 
              min={0} 
              max={100} 
              style={{ width: '100%' }}
              placeholder="Enter KPI score"
            />
          </Form.Item>

          <Form.Item name="calculation_date" label="Calculation Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add KPI Score
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Schedule Training Modal */}
      <Modal
        title="Schedule Training"
        open={trainingModalVisible}
        onCancel={() => setTrainingModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={trainingForm} layout="vertical" onFinish={handleScheduleTraining}>
          <Form.Item name="topic" label="Training Topic" rules={[{ required: true }]}>
            <Input placeholder="Enter training topic" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="trainer" label="Trainer" rules={[{ required: true }]}>
                <Input placeholder="Enter trainer name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="venue" label="Venue" rules={[{ required: true }]}>
                <Input placeholder="Enter training venue" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="duration" label="Duration" rules={[{ required: true }]}>
            <Input placeholder="e.g., 2 hours, 1 day" />
          </Form.Item>

          <Form.Item name="training_date" label="Training Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_time" label="Start Time">
                <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="End Time">
                <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="employees" label="Participants">
            <Select
              mode="multiple"
              placeholder="Select employees for training"
              optionFilterProp="children"
            >
              {employees.filter(emp => emp.is_active).map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name} - {emp.department}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Schedule Training
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Employee Modal */}
      <Modal
        title="Employee Details"
        open={viewEmployeeModalVisible}
        onCancel={() => setViewEmployeeModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewEmployeeModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {viewEmployeeModalVisible && (
          <EmployeeDetails 
            employee={viewEmployeeModalVisible}
            showFullDetails={true}
          />
        )}
      </Modal>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ dashboardData, recruitmentStats, leaves, recentActivities, onAddEmployee, onApproveLeave, onRejectLeave }) => (
  <div>
    {/* Quick Stats */}
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Employees"
            value={dashboardData.employeeStats?.totalEmployees || 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Active Employees"
            value={dashboardData.employeeStats?.activeEmployees || 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Departments"
            value={dashboardData.employeeStats?.departments || 0}
            prefix={<BankOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Pending Leaves"
            value={leaves.length}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Card>
      </Col>
    </Row>

    {/* Quick Actions */}
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="Quick Actions" size="small">
          <Space wrap>
            <Button type="primary" icon={<UserAddOutlined />} onClick={onAddEmployee}>
              Add Employee
            </Button>
            <Button icon={<SolutionOutlined />}>
              Process Applications
            </Button>
            <Button icon={<FileTextOutlined />}>
              Generate Reports
            </Button>
            <Button icon={<BarChartOutlined />}>
              View Analytics
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      {/* Pending Leave Requests */}
      <Col xs={24} lg={12}>
        <Card title="Pending Leave Requests" size="small">
          <List
            dataSource={leaves.slice(0, 5)}
            renderItem={leave => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    size="small" 
                    style={{ color: '#52c41a' }}
                    onClick={() => onApproveLeave(leave.leaveid, `${leave.employee?.first_name} ${leave.employee?.last_name}`)}
                  >
                    Approve
                  </Button>,
                  <Button 
                    type="link" 
                    size="small" 
                    danger
                    onClick={() => onRejectLeave(leave.leaveid, `${leave.employee?.first_name} ${leave.employee?.last_name}`)}
                  >
                    Reject
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#faad14' }} />}
                  title={`${leave.employee?.first_name} ${leave.employee?.last_name}`}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text strong>{leave.leavereason}</Text>
                      <Text type="secondary">
                        {dayjs(leave.leavefromdate).format('DD/MM/YYYY')} - {dayjs(leave.leavetodate).format('DD/MM/YYYY')}
                      </Text>
                      <Text type="secondary">Duration: {leave.duration} days</Text>
                      <Tag color="blue">{leave.employee?.department}</Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 'No pending leave requests' }}
          />
        </Card>
      </Col>

      {/* Recent Activities */}
      <Col xs={24} lg={12}>
        <Card title="Recent HR Activities" size="small">
          <Timeline>
            {recentActivities.slice(0, 5).map((activity, index) => (
              <Timeline.Item
                key={index}
                dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
                color="blue"
              >
                <Space direction="vertical" size={0}>
                  <Text strong>{activity.operation.replace(/_/g, ' ')}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    By {activity.hr?.first_name} {activity.hr?.last_name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
                  </Text>
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </Col>

      {/* Recruitment Stats */}
      <Col xs={24} lg={12}>
        <Card title="Recruitment Overview">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic
                title="Open Positions"
                value={recruitmentStats.openPositions}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="New Hires This Month"
                value={recruitmentStats.newHiresThisMonth}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Pending Applications"
                value={recruitmentStats.pendingApplications}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Interviews Scheduled"
                value={recruitmentStats.interviewSchedule}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
        </Card>
      </Col>

      {/* HR Metrics */}
      <Col xs={24} lg={12}>
        <Card title="HR Metrics">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Employee Satisfaction</Text>
              <Progress percent={87} status="active" />
            </div>
            <div>
              <Text strong>Training Completion</Text>
              <Progress percent={92} status="success" />
            </div>
            <div>
              <Text strong>Retention Rate</Text>
              <Progress percent={94} status="active" />
            </div>
            <div>
              <Text strong>Recruitment Efficiency</Text>
              <Progress percent={78} status="active" />
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  </div>
);

const EmployeeManagementTab = ({ employees, employeeColumns, searchTerm, onSearchChange, onAddEmployee, loading }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Employee Management" 
          extra={
            <Space>
              <Input
                placeholder="Search employees..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ width: 300 }}
              />
              <Button type="primary" icon={<UserAddOutlined />} onClick={onAddEmployee}>
                Add Employee
              </Button>
            </Space>
          }
        >
          <Alert
            message="Employee Management"
            description="Manage all employee records, update information, promote employees, and track performance."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Card>
      <Table
        dataSource={employees}
        columns={employeeColumns}
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowKey="empid"
        locale={{
          emptyText: (
            <Empty
              description="No employees found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
        }}
      />
    </Card>
  </div>
);

const PerformanceTab = ({ kpiData, employees, onAddKPI }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Performance & KPI Management" 
          extra={
            <Button type="primary" icon={<StarOutlined />} onClick={onAddKPI}>
              Add KPI Score
            </Button>
          }
        >
          <Alert
            message="KPI Management"
            description="Track employee performance through KPI scores, rankings, and performance metrics."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Card title="Recent KPI Scores">
      <Table
        dataSource={kpiData}
        columns={[
          {
            title: 'Employee',
            dataIndex: ['employee', 'first_name'],
            key: 'employee',
            render: (text, record) => 
              `${record.employee?.first_name} ${record.employee?.last_name}`
          },
          {
            title: 'Department',
            dataIndex: ['employee', 'department'],
            key: 'department'
          },
          {
            title: 'KPI Score',
            dataIndex: 'kpivalue',
            key: 'kpivalue',
            render: (value) => (
              <Tag color={
                value >= 90 ? 'green' : 
                value >= 80 ? 'blue' : 
                value >= 70 ? 'orange' : 'red'
              }>
                {value}/100
              </Tag>
            )
          },
          {
            title: 'Ranking',
            dataIndex: ['kpiranking', 'kpirank'],
            key: 'kpirank'
          },
          {
            title: 'Calculation Date',
            dataIndex: 'calculatedate',
            key: 'calculatedate',
            render: (date) => dayjs(date).format('MMM D, YYYY')
          }
        ]}
        pagination={{ pageSize: 10 }}
        rowKey="kpiid"
      />
    </Card>
  </div>
);

const TrainingTab = ({ trainingData, employees, onScheduleTraining }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Training & Development" 
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onScheduleTraining}>
              Schedule Training
            </Button>
          }
        >
          <Alert
            message="Training Management"
            description="Schedule training sessions, track participation, and manage employee development programs."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Card title="Upcoming Training Sessions">
      <List
        dataSource={trainingData}
        renderItem={training => (
          <List.Item
            actions={[
              <Button type="link" size="small">View Details</Button>,
              <Button type="link" size="small">Edit</Button>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<SolutionOutlined />} style={{ backgroundColor: '#1890ff' }} />}
              title={training.topic}
              description={
                <Space direction="vertical" size={0}>
                  <Text>Trainer: {training.trainer}</Text>
                  <Text>Venue: {training.venue}</Text>
                  <Text>Date: {dayjs(training.date).format('MMM D, YYYY')}</Text>
                  <Text>Duration: {training.duration}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No upcoming training sessions' }}
      />
    </Card>
  </div>
);

const PromotionsTab = ({ promotions }) => (
  <div>
    <Card title="Promotion History">
      <Table
        dataSource={promotions}
        columns={[
          {
            title: 'Employee',
            dataIndex: ['employee', 'first_name'],
            key: 'employee',
            render: (text, record) => 
              `${record.employee?.first_name} ${record.employee?.last_name}`
          },
          {
            title: 'Previous Role',
            dataIndex: 'previousrole',
            key: 'previousrole'
          },
          {
            title: 'New Role',
            dataIndex: 'newrole',
            key: 'newrole'
          },
          {
            title: 'Promoted By',
            dataIndex: 'promotedby',
            key: 'promotedby'
          },
          {
            title: 'Promotion Date',
            dataIndex: 'promotiondate',
            key: 'promotiondate',
            render: (date) => dayjs(date).format('MMM D, YYYY')
          }
        ]}
        pagination={{ pageSize: 10 }}
        rowKey="id"
      />
    </Card>
  </div>
);

const ActivitiesTab = ({ recentActivities }) => (
  <div>
    <Card title="HR Activities Log">
      <Timeline>
        {recentActivities.map((activity, index) => (
          <Timeline.Item
            key={index}
            dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
            color="green"
          >
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Col>
                    <Text strong>{activity.operation.replace(/_/g, ' ')}</Text>
                  </Col>
                  <Col>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
                    </Text>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Text type="secondary">
                      By: {activity.hr?.first_name} {activity.hr?.last_name}
                    </Text>
                  </Col>
                </Row>
                {activity.target_employee && (
                  <Row>
                    <Col>
                      <Text type="secondary">
                        Employee: {activity.target_employee.first_name} {activity.target_employee.last_name}
                      </Text>
                    </Col>
                  </Row>
                )}
                {activity.details && (
                  <Row>
                    <Col>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Details: {JSON.stringify(activity.details)}
                      </Text>
                    </Col>
                  </Row>
                )}
              </Space>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  </div>
);

// Employee Details Component
const EmployeeDetails = ({ employee, showFullDetails = false }) => (
  <Descriptions bordered column={2}>
    <Descriptions.Item label="Employee ID">{employee.empid}</Descriptions.Item>
    <Descriptions.Item label="Full Name">{employee.first_name} {employee.last_name}</Descriptions.Item>
    <Descriptions.Item label="Email">{employee.email}</Descriptions.Item>
    <Descriptions.Item label="Phone">{employee.phone || 'N/A'}</Descriptions.Item>
    <Descriptions.Item label="Role">
      <Tag color="blue">{employee.role}</Tag>
    </Descriptions.Item>
    <Descriptions.Item label="Department">{employee.department}</Descriptions.Item>
    <Descriptions.Item label="Gender">{employee.gender || 'N/A'}</Descriptions.Item>
    <Descriptions.Item label="Date of Birth">
      {employee.dob ? dayjs(employee.dob).format('MMM D, YYYY') : 'N/A'}
    </Descriptions.Item>
    <Descriptions.Item label="Status">
      <Tag color={employee.is_active ? 'green' : 'red'}>
        {employee.status} {employee.is_active ? '' : '(Inactive)'}
      </Tag>
    </Descriptions.Item>
    <Descriptions.Item label="KPI Score">
      {employee.kpiscore ? `${employee.kpiscore}/100` : 'N/A'}
    </Descriptions.Item>
    {showFullDetails && (
      <>
        <Descriptions.Item label="Address" span={2}>
          {employee.empaddress || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Join Date">
          {dayjs(employee.created_at).format('MMM D, YYYY')}
        </Descriptions.Item>
        <Descriptions.Item label="Tenure">
          {employee.tenure || 'N/A'}
        </Descriptions.Item>
      </>
    )}
  </Descriptions>
);

export default HRDashboard;