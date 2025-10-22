
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
  Badge,
  Alert,
  Table
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  EyeOutlined,
  CalendarOutlined,
  BarChartOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ManagerDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState({});
  const [departmentStats, setDepartmentStats] = useState({});
  <EmployeeDetails employeeId={profile.empid} showActions={true} />

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeamMembers(),
        fetchTeamTasks(),
        fetchTeamPerformance(),
        fetchDepartmentStats()
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
        .select('*')
        .eq('managerid', profile.empid)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchTeamTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id (first_name, last_name)
        `)
        .in('assignee_id', teamMembers.map(member => member.empid))
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setTeamTasks(data || []);
    } catch (error) {
      console.error('Error fetching team tasks:', error);
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
        productivity: 92 // Mock data
      });
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div><Text strong>{text}</Text></div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: 'Assignee',
      dataIndex: ['assignee', 'first_name'],
      key: 'assignee',
      render: (text, record) => 
        `${record.assignee?.first_name} ${record.assignee?.last_name}`
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : 'orange'}>
          {status.replace('_', ' ')}
        </Tag>
      )
    }
  ];

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
                  {profile?.first_name} {profile?.last_name}
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
        message={`Welcome back, ${profile?.first_name || 'Manager'}!`}
        description="Manage your team, track performance, monitor tasks, and oversee department operations."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        
      />

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Team Members"
              value={teamPerformance.teamSize}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Present Today"
              value={departmentStats.presentToday}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Team KPI"
              value={teamPerformance.avgKPI}
              suffix="/100"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Productivity"
              value={departmentStats.productivity}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Team Members */}
        <Col xs={24} lg={12}>
          <Card 
            title="My Team" 
            extra={<Button type="link" icon={<EyeOutlined />}>View All</Button>}
            loading={loading}
          >
            <List
              dataSource={teamMembers}
              renderItem={member => (
                <List.Item
                  actions={[
                    <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    title={`${member.first_name} ${member.last_name}`}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{member.role}</Text>
                        <Space>
                          <Tag color="blue">{member.department}</Tag>
                          <Progress 
                            percent={member.kpiscore || 75} 
                            size="small" 
                            style={{ width: 100 }} 
                          />
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Team Tasks */}
        <Col xs={24} lg={12}>
          <Card title="Team Tasks" loading={loading}>
            <Table
              dataSource={teamTasks}
              columns={taskColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Team Performance */}
        <Col xs={24} lg={12}>
          <Card title="Team Performance Metrics">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Project Completion</Text>
                    <Progress percent={78} status="active" />
                    <Text type="secondary">12/15 projects on time</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Quality Score</Text>
                    <Progress percent={95} status="success" />
                    <Text type="secondary">Client satisfaction</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Budget Adherence</Text>
                    <Progress percent={88} status="active" />
                    <Text type="secondary">Within allocated budget</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Team Satisfaction</Text>
                    <Progress percent={teamPerformance.avgSatisfaction} status="active" />
                    <Text type="secondary">Based on surveys</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Quick Manager Actions */}
        <Col xs={24} lg={12}>
          <Card title="Manager Actions">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" hoverable style={{ textAlign: 'center', height: '100%' }}>
                  <Button type="primary" icon={<CheckCircleOutlined />} block size="large">
                    Approve Leaves
                  </Button>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable style={{ textAlign: 'center', height: '100%' }}>
                  <Button icon={<BarChartOutlined />} block size="large">
                    Performance Review
                  </Button>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable style={{ textAlign: 'center', height: '100%' }}>
                  <Button icon={<TeamOutlined />} block size="large">
                    Team Reports
                  </Button>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable style={{ textAlign: 'center', height: '100%' }}>
                  <Button icon={<RocketOutlined />} block size="large">
                    Set Goals
                  </Button>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManagerDashboard;