// src/components/Dashboard/AdminDashboard.js
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
  Switch,
  Badge,
  Alert,
  Table
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DashboardOutlined,
  CrownOutlined,
  SecurityScanOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({});
  const [users, setUsers] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSystemStats(),
        fetchUsers(),
        fetchSystemLogs(),
        fetchAuditLogs()
      ]);
    } catch (error) {
      console.error('Error initializing admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const { data: employees } = await supabase
        .from('employee')
        .select('empid, is_active')
        .eq('is_active', true);

      const { data: activeSessions } = await supabase
        .from('employee')
        .select('empid')
        .not('last_login', 'is', null)
        .gte('last_login', dayjs().subtract(1, 'hour').format());

      setSystemStats({
        totalUsers: employees?.length || 0,
        activeSessions: activeSessions?.length || 0,
        uptime: '99.9%',
        storageUsed: '75%'
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSystemLogs = async () => {
    // Mock system logs - in real app, fetch from system_logs table
    const logs = [
      { action: 'USER_LOGIN', table_name: 'auth', created_at: new Date().toISOString(), user: profile?.email },
      { action: 'DATA_UPDATE', table_name: 'employee', created_at: new Date(Date.now() - 300000).toISOString(), user: 'system' },
      { action: 'BACKUP_COMPLETED', table_name: 'system', created_at: new Date(Date.now() - 600000).toISOString(), user: 'admin' }
    ];
    setSystemLogs(logs);
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_id (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('employee')
        .update({ is_active: !currentStatus })
        .eq('empid', userId);

      if (error) throw error;
      
      // Refresh users
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const userColumns = [
    {
      title: 'User',
      dataIndex: 'first_name',
      key: 'user',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div>{`${record.first_name} ${record.last_name}`}</div>
            <Text type="secondary">{record.email}</Text>
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
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          onChange={() => handleToggleUserStatus(record.empid, record.is_active)}
          size="small"
        />
      )
    }
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Card size="small" style={{ 
        marginBottom: 16, 
        background: 'linear-gradient(135deg, #ff4d4f 0%, #a8071a 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <CrownOutlined style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                Administrator Dashboard
              </Title>
              <Badge count={<CrownOutlined />} offset={[-5, 0]}>
                <Tag color="white" style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
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
        message={`Welcome back, ${profile?.first_name || 'Administrator'}!`}
        description="Manage system settings, user accounts, security, and overall platform administration."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={systemStats.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={systemStats.uptime}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Sessions"
              value={systemStats.activeSessions}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Storage Used"
              value={systemStats.storageUsed}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* User Management */}
        <Col xs={24} lg={12}>
          <Card 
            title="User Management" 
            extra={<Button type="link" icon={<EyeOutlined />}>View All</Button>}
            loading={loading}
          >
            <Table
              dataSource={users}
              columns={userColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* System Activity */}
        <Col xs={24} lg={12}>
          <Card title="System Activity Log" loading={loading}>
            <Timeline>
              {systemLogs.map((log, index) => (
                <Timeline.Item 
                  key={index}
                  color={
                    log.action.includes('LOGIN') ? 'green' : 
                    log.action.includes('UPDATE') ? 'blue' : 
                    log.action.includes('BACKUP') ? 'purple' : 'gray'
                  }
                >
                  <Space direction="vertical" size={0}>
                    <Text strong>{log.action.replace('_', ' ')}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {log.table_name} • {dayjs(log.created_at).format('DD/MM/YYYY HH:mm')}
                    </Text>
                    {log.user && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        By: {log.user}
                      </Text>
                    )}
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* System Health */}
        <Col xs={24} lg={12}>
          <Card title="System Health Overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Server Performance</Text>
                    <Progress percent={98} status="active" />
                    <Text type="secondary">CPU: 45% • Memory: 67%</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Database Health</Text>
                    <Progress percent={100} status="success" />
                    <Text type="secondary">Connections: 24 • Queries: 1.2k/min</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Storage Usage</Text>
                    <Progress percent={75} status="active" />
                    <Text type="secondary">2.1GB / 2.8GB used</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Security Status</Text>
                    <Progress percent={100} status="success" />
                    <Text type="secondary">All systems secure</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Audit Logs */}
        <Col xs={24} lg={12}>
          <Card title="Recent Audit Logs" loading={loading}>
            <List
              dataSource={auditLogs.slice(0, 5)}
              renderItem={log => (
                <List.Item>
                  <List.Item.Meta
                    title={log.action}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          {log.user?.first_name} {log.user?.last_name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(log.created_at).format('DD/MM/YYYY HH:mm')}
                        </Text>
                      </Space>
                    }
                  />
                  <Tag color="blue">{log.table_name}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;