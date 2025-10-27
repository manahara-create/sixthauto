import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Typography, Button, Space, Avatar,
  Badge, Alert, Tabs, Timeline, List, Empty, Spin
} from 'antd';
import {
  TeamOutlined, UserOutlined, CalendarOutlined, BankOutlined,
  CheckCircleOutlined, ClockCircleOutlined, RiseOutlined,
  HistoryOutlined, SolutionOutlined, TrophyOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const HRDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [trainingData, setTrainingData] = useState([]);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployeeStats(),
        fetchPendingLeaves(),
        fetchRecentActivities(),
        fetchPromotions(),
        fetchTrainingData()
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
        .select('empid, status, department, is_active, created_at, role, gender')
        .eq('is_active', true);

      if (error) throw error;

      const totalEmployees = data?.length || 0;
      const departments = [...new Set(data?.map(emp => emp.department).filter(Boolean))];
      const activeEmployees = data?.filter(emp => emp.status === 'Active').length || 0;
      const newHires = data?.filter(emp => {
        const joinDate = dayjs(emp.created_at);
        return joinDate.isAfter(dayjs().subtract(30, 'day'));
      }).length || 0;

      setDashboardData({
        employeeStats: { totalEmployees, departments: departments.length, activeEmployees, newHires }
      });
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const fetchPendingLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('employeeleave')
        .select('*')
        .eq('leavestatus', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const employeeIds = [...new Set(data?.map(leave => leave.empid).filter(Boolean))];
      let employeeData = [];

      if (employeeIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name, email, department, role')
          .in('empid', employeeIds);
        employeeData = empData || [];
      }

      const employeeMap = {};
      employeeData.forEach(emp => {
        employeeMap[emp.empid] = emp;
      });

      const leavesWithEmployee = data?.map(leave => ({
        ...leave,
        employee: employeeMap[leave.empid] || {
          full_name: 'Unknown Employee',
          email: 'N/A',
          department: 'N/A',
          role: 'N/A'
        }
      }));

      setLeaves(leavesWithEmployee || []);
    } catch (error) {
      console.error('Error fetching pending leaves:', error);
      setLeaves([]);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_operations')
        .select('*')
        .order('operation_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      const hrIds = [...new Set(data?.map(activity => activity.hr_id).filter(Boolean))];
      let hrData = [];

      if (hrIds.length > 0) {
        const { data: hrEmpData } = await supabase
          .from('employee')
          .select('empid, full_name')
          .in('empid', hrIds);
        hrData = hrEmpData || [];
      }

      const hrMap = {};
      hrData.forEach(hr => {
        hrMap[hr.empid] = hr;
      });

      const activitiesWithHR = data?.map(activity => ({
        ...activity,
        hr: hrMap[activity.hr_id] || { full_name: 'Unknown HR' }
      }));

      setRecentActivities(activitiesWithHR || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_history')
        .select('*')
        .order('promotion_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const employeeIds = [...new Set(data?.map(promo => promo.empid).filter(Boolean))];
      let employeeData = [];

      if (employeeIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name')
          .in('empid', employeeIds);
        employeeData = empData || [];
      }

      const employeeMap = {};
      employeeData.forEach(emp => {
        employeeMap[emp.empid] = emp;
      });

      const promotionsWithEmployee = data?.map(promo => ({
        ...promo,
        employee: employeeMap[promo.empid] || { full_name: 'Unknown Employee' }
      }));

      setPromotions(promotionsWithEmployee || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const fetchTrainingData = async () => {
    try {
      const { data, error } = await supabase
        .from('training')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTrainingData(data || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <BankOutlined /> HR Management Dashboard
        </Title>
        <Text type="secondary">
          Welcome back, {profile?.full_name}! Manage your workforce efficiently.
        </Text>
      </div>

      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            {/* Employee Statistics */}
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Employees"
                  value={dashboardData.employeeStats?.totalEmployees || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Active Employees"
                  value={dashboardData.employeeStats?.activeEmployees || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Departments"
                  value={dashboardData.employeeStats?.departments || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="New Hires (30d)"
                  value={dashboardData.employeeStats?.newHires || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* Pending Leaves */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <CalendarOutlined />
                    <span>Pending Leave Requests</span>
                    <Badge count={leaves.length} showZero />
                  </Space>
                }
              >
                {leaves.length > 0 ? (
                  <List
                    dataSource={leaves.slice(0, 5)}
                    renderItem={leave => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={leave.employee?.full_name}
                          description={`${leave.leavetype} - ${dayjs(leave.leavefromdate).format('MMM D')} to ${dayjs(leave.leavetodate).format('MMM D')}`}
                        />
                        <Space>
                          <Button type="link" size="small">
                            Approve
                          </Button>
                          <Button type="link" size="small" danger>
                            Reject
                          </Button>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No pending leave requests" />
                )}
              </Card>
            </Col>

            {/* Recent Promotions */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <RiseOutlined />
                    <span>Recent Promotions</span>
                  </Space>
                }
              >
                {promotions.length > 0 ? (
                  <Timeline>
                    {promotions.slice(0, 5).map(promo => (
                      <Timeline.Item
                        key={promo.id}
                        dot={<TrophyOutlined style={{ fontSize: '16px' }} />}
                        color="green"
                      >
                        <Text strong>{promo.employee?.full_name}</Text>
                        <br />
                        <Text type="secondary">
                          {promo.previousrole} → {promo.newrole}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(promo.promotion_date).format('MMM D, YYYY')}
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <Empty description="No recent promotions" />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* Recent Activities */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <HistoryOutlined />
                    <span>Recent HR Activities</span>
                  </Space>
                }
              >
                {recentActivities.length > 0 ? (
                  <List
                    dataSource={recentActivities.slice(0, 5)}
                    renderItem={activity => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={activity.hr?.full_name}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>{activity.operation}</Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No recent activities" />
                )}
              </Card>
            </Col>

            {/* Upcoming Training */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <SolutionOutlined />
                    <span>Upcoming Training Sessions</span>
                  </Space>
                }
              >
                {trainingData.length > 0 ? (
                  <List
                    dataSource={trainingData.slice(0, 5)}
                    renderItem={training => (
                      <List.Item>
                        <List.Item.Meta
                          title={training.topic}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>Trainer: {training.trainer}</Text>
                              <Text>Date: {dayjs(training.date).format('MMM D, YYYY')}</Text>
                              <Text>Venue: {training.venue}</Text>
                            </Space>
                          }
                        />
                        <Tag color={training.status === 'completed' ? 'green' : 'blue'}>
                          {training.status}
                        </Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No upcoming training sessions" />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default HRDashboard;