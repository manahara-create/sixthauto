// src/components/Dashboard/HRDashboard.js
import React, { useState, useEffect } from 'react';
import EmployeeDetails from './EmployeeDetails';
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
  Divider
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
  PhoneOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const HRDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [recruitmentStats, setRecruitmentStats] = useState({});
  <EmployeeDetails employeeId={profile.empid} showActions={true} />

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployeeStats(),
        fetchEmployees(),
        fetchPendingLeaves(),
        fetchRecruitmentStats()
      ]);
    } catch (error) {
      console.error('Error initializing HR dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeStats = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, status, department, is_active')
        .eq('is_active', true);

      if (error) throw error;

      const totalEmployees = data?.length || 0;
      const departments = [...new Set(data?.map(emp => emp.department).filter(Boolean))];
      const activeEmployees = data?.filter(emp => emp.status === 'Active').length || 0;
      const newHires = data?.filter(emp => {
        const joinDate = dayjs(emp.created_at);
        return joinDate.isAfter(dayjs().subtract(30, 'day'));
      }).length || 0;

      setDashboardData(prev => ({
        ...prev,
        employeeStats: { totalEmployees, departments: departments.length, activeEmployees, newHires }
      }));
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

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
          employee:empid (first_name, last_name, email, department)
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

      setRecruitmentStats({
        openPositions: positions?.length || 0,
        newHiresThisMonth: newHires?.length || 0,
        interviewSchedule: 12 // Mock data
      });
    } catch (error) {
      console.error('Error fetching recruitment stats:', error);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const { error } = await supabase
        .from('employeeleave')
        .update({ 
          leavestatus: 'approved',
          approvedby: profile.empid
        })
        .eq('leaveid', leaveId);

      if (error) throw error;
      
      // Refresh leaves
      fetchPendingLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      const { error } = await supabase
        .from('employeeleave')
        .update({ 
          leavestatus: 'rejected',
          approvedby: profile.empid
        })
        .eq('leaveid', leaveId);

      if (error) throw error;
      
      // Refresh leaves
      fetchPendingLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
    }
  };

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
        description="Manage employees, leaves, recruitment, and HR operations from this dashboard."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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

      <Row gutter={[16, 16]}>
        {/* Employee List */}
        <Col xs={24} lg={12}>
          <Card 
            title="Recent Employees" 
            extra={<Button type="link" icon={<EyeOutlined />}>View All</Button>}
            loading={loading}
          >
            <List
              dataSource={employees}
              renderItem={emp => (
                <List.Item
                  actions={[
                    <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    title={`${emp.first_name} ${emp.last_name}`}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{emp.email}</Text>
                        <Space>
                          <Tag color="blue">{emp.department}</Tag>
                          <Tag color={emp.status === 'Active' ? 'green' : 'red'}>{emp.status}</Tag>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Pending Leave Requests */}
        <Col xs={24} lg={12}>
          <Card title="Pending Leave Requests" loading={loading}>
            <List
              dataSource={leaves}
              renderItem={leave => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small" 
                      style={{ color: '#52c41a' }}
                      onClick={() => handleApproveLeave(leave.leaveid)}
                    >
                      Approve
                    </Button>,
                    <Button 
                      type="link" 
                      size="small" 
                      danger
                      onClick={() => handleRejectLeave(leave.leaveid)}
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
            />
          </Card>
        </Col>

        {/* Recruitment Stats */}
        <Col xs={24} lg={12}>
          <Card title="Recruitment Overview">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="Open Positions"
                  value={recruitmentStats.openPositions}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="New Hires This Month"
                  value={recruitmentStats.newHiresThisMonth}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Interviews Scheduled"
                  value={recruitmentStats.interviewSchedule}
                  valueStyle={{ color: '#fa8c16' }}
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
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HRDashboard;