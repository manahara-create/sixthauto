// src/components/Dashboard/CEODashboard.js
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
  Progress,
  Badge,
  Alert,
  Table
} from 'antd';
import {
  RocketOutlined,
  TeamOutlined,
  PieChartOutlined,
  StarOutlined,
  TrophyOutlined,
  DollarOutlined,
  LineChartOutlined,
  EyeOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const CEODashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companyMetrics, setCompanyMetrics] = useState({});
  const [strategicGoals, setStrategicGoals] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [financialOverview, setFinancialOverview] = useState({});

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCompanyMetrics(),
        fetchStrategicGoals(),
        fetchDepartmentPerformance(),
        fetchFinancialOverview()
      ]);
    } catch (error) {
      console.error('Error initializing CEO dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyMetrics = async () => {
    try {
      const { data: employees } = await supabase
        .from('employee')
        .select('empid, is_active')
        .eq('is_active', true);

      const { data: revenue } = await supabase
        .from('financialreports')
        .select('totalrevenue')
        .order('quarterenddate', { ascending: false })
        .limit(1);

      // Mock data for other metrics
      setCompanyMetrics({
        totalEmployees: employees?.length || 0,
        companyRevenue: revenue?.[0]?.totalrevenue || 1250000,
        profitMargin: 28.5,
        customerSatisfaction: 4.7
      });
    } catch (error) {
      console.error('Error fetching company metrics:', error);
    }
  };

  const fetchStrategicGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('strategic_goals')
        .select('*')
        .eq('year', dayjs().year())
        .order('quarter', { ascending: true });

      if (error) throw error;
      setStrategicGoals(data || []);
    } catch (error) {
      console.error('Error fetching strategic goals:', error);
      // Mock data if table doesn't exist
      const mockGoals = [
        { 
          goal_id: 1, 
          goal_name: 'Revenue Growth', 
          description: 'Achieve 20% revenue growth YoY', 
          current_value: 15, 
          target_value: 20, 
          achieved: false, 
          quarter: 1, 
          year: 2024 
        },
        { 
          goal_id: 2, 
          goal_name: 'Market Expansion', 
          description: 'Expand to 2 new international markets', 
          current_value: 1, 
          target_value: 2, 
          achieved: false, 
          quarter: 2, 
          year: 2024 
        },
        { 
          goal_id: 3, 
          goal_name: 'Product Innovation', 
          description: 'Launch 3 new major product features', 
          current_value: 2, 
          target_value: 3, 
          achieved: false, 
          quarter: 1, 
          year: 2024 
        }
      ];
      setStrategicGoals(mockGoals);
    }
  };

  const fetchDepartmentPerformance = async () => {
    try {
      // Mock department performance data
      const performance = [
        { department: 'Sales', performance: 92, growth: 15, revenue: 450000 },
        { department: 'Marketing', performance: 88, growth: 12, revenue: 150000 },
        { department: 'Development', performance: 95, growth: 20, revenue: 300000 },
        { department: 'HR', performance: 85, growth: 8, revenue: 50000 },
        { department: 'Finance', performance: 90, growth: 10, revenue: 75000 }
      ];
      setDepartmentPerformance(performance);
    } catch (error) {
      console.error('Error fetching department performance:', error);
    }
  };

  const fetchFinancialOverview = async () => {
    try {
      // Mock financial overview
      setFinancialOverview({
        marketShare: 18.5,
        employeeRetention: 94,
        revenueGrowth: 22.3,
        operatingMargin: 28.5
      });
    } catch (error) {
      console.error('Error fetching financial overview:', error);
    }
  };

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Performance',
      dataIndex: 'performance',
      key: 'performance',
      render: (value) => (
        <Progress percent={value} status="active" style={{ width: 100 }} />
      )
    },
    {
      title: 'Growth',
      dataIndex: 'growth',
      key: 'growth',
      render: (value) => (
        <Space>
          <Text>{value}%</Text>
          <ArrowUpOutlined style={{ color: '#52c41a' }} />
        </Space>
      )
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value) => `$${value.toLocaleString()}`
    }
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Card size="small" style={{ 
        marginBottom: 16, 
        background: 'linear-gradient(135deg, #fa541c 0%, #d4380d 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <RocketOutlined style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                CEO Dashboard
              </Title>
              <Badge count={<RocketOutlined />} offset={[-5, 0]}>
                <Tag color="white" style={{ color: '#fa541c', fontWeight: 'bold' }}>
                  {profile?.first_name} {profile?.last_name}
                </Tag>
              </Badge>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'white' }}>
              Executive Overview • {dayjs().format('MMMM YYYY')}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Welcome Alert */}
      <Alert
        message={`Welcome back, ${profile?.first_name || 'CEO'}!`}
        description="Monitor company performance, strategic goals, department metrics, and overall business health."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Company Revenue"
              value={companyMetrics.companyRevenue}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
              suffix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Employee Count"
              value={companyMetrics.totalEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Profit Margin"
              value={companyMetrics.profitMargin}
              suffix="%"
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Customer Satisfaction"
              value={companyMetrics.customerSatisfaction}
              suffix="/5"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Strategic Goals */}
        <Col xs={24} lg={12}>
          <Card 
            title="Strategic Goals" 
            extra={<TrophyOutlined style={{ color: '#faad14' }} />}
            loading={loading}
          >
            <List
              dataSource={strategicGoals}
              renderItem={goal => (
                <List.Item>
                  <List.Item.Meta
                    title={goal.goal_name}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text>{goal.description}</Text>
                        <Progress 
                          percent={Math.round((goal.current_value / goal.target_value) * 100)} 
                          status={goal.achieved ? 'success' : 'active'}
                          style={{ marginTop: 8 }}
                        />
                        <Text type="secondary">
                          Progress: {goal.current_value} / {goal.target_value}
                        </Text>
                      </Space>
                    }
                  />
                  <Tag color={goal.achieved ? 'green' : 'blue'}>
                    Q{goal.quarter} {goal.year}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Department Performance */}
        <Col xs={24} lg={12}>
          <Card title="Department Performance" loading={loading}>
            <Table
              dataSource={departmentPerformance}
              columns={departmentColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Executive Summary */}
        <Col xs={24} lg={12}>
          <Card title="Executive Summary">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Market Share</Text>
                    <Statistic value={financialOverview.marketShare} suffix="%" 
                      valueStyle={{ color: '#1890ff', fontSize: '24px' }} />
                    <Text type="secondary">+2.3% from last quarter</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Employee Retention</Text>
                    <Statistic value={financialOverview.employeeRetention} suffix="%" 
                      valueStyle={{ color: '#52c41a', fontSize: '24px' }} />
                    <Text type="secondary">Industry average: 88%</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Revenue Growth</Text>
                    <Statistic value={financialOverview.revenueGrowth} suffix="%" 
                      valueStyle={{ color: '#fa8c16', fontSize: '24px' }} />
                    <Text type="secondary">YoY growth rate</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Operating Margin</Text>
                    <Statistic value={financialOverview.operatingMargin} suffix="%" 
                      valueStyle={{ color: '#722ed1', fontSize: '24px' }} />
                    <Text type="secondary">Above target: 25%</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Key Performance Indicators */}
        <Col xs={24} lg={12}>
          <Card title="Key Performance Indicators">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Financial Health</Text>
                <Progress percent={95} status="active" />
                <Text type="secondary">Strong cash flow and profitability</Text>
              </div>
              <div>
                <Text strong>Operational Efficiency</Text>
                <Progress percent={88} status="active" />
                <Text type="secondary">Process optimization ongoing</Text>
              </div>
              <div>
                <Text strong>Market Position</Text>
                <Progress percent={92} status="active" />
                <Text type="secondary">Leading in core markets</Text>
              </div>
              <div>
                <Text strong>Innovation Index</Text>
                <Progress percent={78} status="active" />
                <Text type="secondary">R&D investments paying off</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CEODashboard;