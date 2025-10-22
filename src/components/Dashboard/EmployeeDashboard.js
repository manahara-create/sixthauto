
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
  Tabs
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
  IdcardOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import EmployeeDetails from './EmployeeDetails';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const EmployeeDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myTasks, setMyTasks] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [salaryData, setSalaryData] = useState({});

  useEffect(() => {
    initializeDashboard();
  }, [profile]);

  const initializeDashboard = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchMyTasks(),
        fetchMyLeaves(),
        fetchAttendanceData(),
        fetchSalaryData()
      ]);
    } catch (error) {
      console.error('Error initializing employee dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', profile.empid)
        .in('status', ['pending', 'in_progress'])
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
        .select('*')
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
        lastPunch: data?.[0]?.intime || 'N/A'
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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
      in_progress: 'blue',
      completed: 'green'
    };
    return colors[status] || 'default';
  };

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
              <UserOutlined style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                Employee Dashboard
              </Title>
              <Badge count={<IdcardOutlined />} offset={[-5, 0]}>
                <Tag color="white" style={{ color: '#667eea', fontWeight: 'bold' }}>
                  {profile?.first_name} {profile?.last_name}
                </Tag>
              </Badge>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'white' }}>
              Employee ID: {profile?.empid} | Role: {profile?.role}
            </Text>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          {/* Your existing dashboard content */}
          <Alert
            message={`Welcome back, ${profile?.first_name || 'Employee'}!`}
            description="Here's your personalized dashboard with tasks, leaves, attendance, and personal information."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Quick Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
                  value={profile?.fulldayleavebalance || 18}
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
                  value={profile?.kpiscore || 88}
                  suffix="/100"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="OT Hours This Month"
                  value={profile?.othours || 12}
                  suffix="hrs"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Rest of your existing dashboard content */}
        </TabPane>

        <TabPane tab="My Profile" key="profile">
          <EmployeeDetails
            employeeId={profile?.empid}
            showActions={true}
          />
        </TabPane>

        <TabPane tab="Team Directory" key="team">
          <TeamDirectory currentEmployeeId={profile?.empid} />
        </TabPane>
      </Tabs>
    </div>
  );
};

// Additional component for team directory
const TeamDirectory = ({ currentEmployeeId }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .eq('status', 'Active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Team Directory" loading={loading}>
      <Row gutter={[16, 16]}>
        {employees.map(employee => (
          <Col xs={24} sm={12} md={8} lg={6} key={employee.empid}>
            <Card
              size="small"
              hoverable
              onClick={() => {
                // You can implement a modal or navigation to view employee details
                console.log('View employee:', employee.empid);
              }}
            >
              <div style={{ textAlign: 'center' }}>
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
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default EmployeeDashboard;