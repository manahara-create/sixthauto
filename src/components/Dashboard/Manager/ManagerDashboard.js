import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Alert,
  Tabs,
  Button,
  Space,
  Badge,
  Tag,
  Typography
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  LineChartOutlined,
  BarChartOutlined,
  RocketOutlined,
  ExclamationCircleOutlined,
  FundOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ManagerDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState({});
  const [departmentStats, setDepartmentStats] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);

  useEffect(() => {
    if (!profile?.empid) {
      console.error('Manager profile not found');
      return;
    }
    initializeDashboard();
  }, [profile?.empid]);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeamMembers(),
        fetchTeamPerformance(),
        fetchDepartmentStats(),
        fetchLeaveRequests(),
        fetchLoanRequests()
      ]);
    } catch (error) {
      console.error('Error initializing manager dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, full_name, email, role, department, status, kpiscore')
        .eq('managerid', profile.empid)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const fetchTeamPerformance = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('kpiscore, satisfaction_score')
        .eq('managerid', profile.empid)
        .eq('is_active', true);

      if (error) throw error;

      const avgKPI = data?.reduce((acc, emp) => acc + (emp.kpiscore || 0), 0) / (data?.length || 1);
      const avgSatisfaction = data?.reduce((acc, emp) => acc + (emp.satisfaction_score || 0), 0) / (data?.length || 1);

      setTeamPerformance({
        avgKPI: Math.round(avgKPI),
        avgSatisfaction: Math.round(avgSatisfaction),
        teamSize: data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching team performance:', error);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today)
        .in('empid', teamMembers.map(member => member.empid));

      const presentCount = attendance?.filter(a => a.status === 'Present').length || 0;

      setDepartmentStats({
        presentToday: presentCount,
        onLeave: teamMembers.length - presentCount,
        productivity: 92
      });
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const teamMemberIds = teamMembers.map(member => member.empid).filter(Boolean);
      if (teamMemberIds.length === 0) {
        setLeaveRequests([]);
        return;
      }

      const { data, error } = await supabase
        .from('employeeleave')
        .select('*')
        .in('empid', teamMemberIds)
        .eq('leavestatus', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setLeaveRequests([]);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      const teamMemberIds = teamMembers.map(member => member.empid).filter(Boolean);
      if (teamMemberIds.length === 0) {
        setLoanRequests([]);
        return;
      }

      const { data, error } = await supabase
        .from('loanrequest')
        .select('*')
        .in('empid', teamMemberIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoanRequests(data || []);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
      setLoanRequests([]);
    }
  };

  if (!profile?.empid) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Alert
          message="Profile Not Found"
          description="Manager profile information is not available. Please contact administrator."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Card size="small" style={{
        marginBottom: 16,
        background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <UserOutlined style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                Manager Dashboard
              </Title>
              <Badge count={<UserOutlined />} offset={[-5, 0]}>
                <Tag color="white" style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  {profile?.full_name}
                </Tag>
              </Badge>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'white' }}>
              Department: {profile?.department}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Welcome Alert */}
      <Alert
        message={`Welcome back, ${profile?.full_name || 'Manager'}!`}
        description="Manage your team, track performance, monitor tasks, and oversee department operations."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Team Members"
              value={teamPerformance.teamSize || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Present Today"
              value={departmentStats.presentToday || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Team KPI"
              value={teamPerformance.avgKPI || 0}
              suffix="/100"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Productivity"
              value={departmentStats.productivity || 0}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Approvals Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card loading={loading}>
            <Space>
              <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              <Text strong>Pending Leave Requests:</Text>
              <Badge count={leaveRequests.length} showZero style={{ backgroundColor: '#faad14' }} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card loading={loading}>
            <Space>
              <FundOutlined style={{ color: '#1890ff' }} />
              <Text strong>Pending Loan Requests:</Text>
              <Badge count={loanRequests.length} showZero style={{ backgroundColor: '#1890ff' }} />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Navigation Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            loading={loading}
            onClick={() => setActiveTab('team')}
            style={{ textAlign: 'center' }}
          >
            <TeamOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            <Title level={4} style={{ marginTop: '8px' }}>Team Management</Title>
            <Text type="secondary">Manage team members and assignments</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            loading={loading}
            onClick={() => setActiveTab('tasks')}
            style={{ textAlign: 'center' }}
          >
            <RocketOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
            <Title level={4} style={{ marginTop: '8px' }}>Tasks</Title>
            <Text type="secondary">Assign and track tasks</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            loading={loading}
            onClick={() => setActiveTab('approvals')}
            style={{ textAlign: 'center' }}
          >
            <ExclamationCircleOutlined style={{ fontSize: '32px', color: '#faad14' }} />
            <Title level={4} style={{ marginTop: '8px' }}>Approvals</Title>
            <Text type="secondary">Review requests and approvals</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            loading={loading}
            onClick={() => setActiveTab('reports')}
            style={{ textAlign: 'center' }}
          >
            <BarChartOutlined style={{ fontSize: '32px', color: '#722ed1' }} />
            <Title level={4} style={{ marginTop: '8px' }}>Reports</Title>
            <Text type="secondary">Generate and view reports</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManagerDashboard;