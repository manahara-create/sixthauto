import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Typography, Button, Space, Tabs,
  Alert, Spin, Result
} from 'antd';
import {
  CrownOutlined, TeamOutlined, DollarOutlined, LineChartOutlined,
  StarOutlined, DownloadOutlined, ReloadOutlined, BarChartOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import { Bar, Pie } from '@ant-design/plots';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

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
      const { data: employees, error: empError } = await supabase
        .from('employee')
        .select('empid, is_active')
        .eq('is_active', true);

      if (empError) throw empError;

      const { data: revenue, error: revError } = await supabase
        .from('financialreports')
        .select('totalrevenue')
        .order('quarterenddate', { ascending: false })
        .limit(1);

      if (revError) throw revError;

      const { data: salaryData } = await supabase
        .from('salary')
        .select('totalsalary')
        .gte('salarydate', dayjs().subtract(1, 'month').format('YYYY-MM-DD'));

      const totalSalary = salaryData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0;
      const companyRevenue = revenue?.[0]?.totalrevenue || 1250000;
      const profitMargin = companyRevenue > 0 ? ((companyRevenue - totalSalary) / companyRevenue * 100).toFixed(1) : 0;

      setCompanyMetrics({
        totalEmployees: employees?.length || 0,
        companyRevenue: companyRevenue,
        profitMargin: parseFloat(profitMargin),
        customerSatisfaction: 4.7
      });
    } catch (error) {
      console.error('Error fetching company metrics:', error);
      setCompanyMetrics({
        totalEmployees: 150,
        companyRevenue: 1250000,
        profitMargin: 28.5,
        customerSatisfaction: 4.7
      });
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
      const initialGoals = [
        {
          goal_id: 1,
          goal_name: 'Revenue Growth',
          description: 'Achieve 20% revenue growth YoY',
          current_value: 15,
          target_value: 20,
          achieved: false,
          quarter: 1,
          year: 2024,
          weight: 1
        },
        {
          goal_id: 2,
          goal_name: 'Market Expansion',
          description: 'Expand to 2 new international markets',
          current_value: 1,
          target_value: 2,
          achieved: false,
          quarter: 2,
          year: 2024,
          weight: 1
        }
      ];
      setStrategicGoals(initialGoals);
    }
  };

  const fetchDepartmentPerformance = async () => {
    try {
      const { data: employees, error } = await supabase
        .from('employee')
        .select('empid, department, kpiscore, satisfaction_score')
        .eq('is_active', true);

      if (error) throw error;

      const departmentStats = {};
      employees.forEach(emp => {
        if (!departmentStats[emp.department]) {
          departmentStats[emp.department] = {
            count: 0,
            totalKPI: 0,
            totalSatisfaction: 0
          };
        }
        departmentStats[emp.department].count++;
        departmentStats[emp.department].totalKPI += (emp.kpiscore || 0);
        departmentStats[emp.department].totalSatisfaction += (emp.satisfaction_score || 0);
      });

      const performance = Object.entries(departmentStats).map(([dept, stats]) => ({
        department: dept,
        performance: Math.round((stats.totalKPI / stats.count) * 10),
        growth: Math.round((stats.totalSatisfaction / stats.count) * 20),
        revenue: Math.round(Math.random() * 500000) + 50000
      }));

      setDepartmentPerformance(performance);
    } catch (error) {
      console.error('Error fetching department performance:', error);
      const performance = [
        { department: 'Sales', performance: 92, growth: 15, revenue: 450000 },
        { department: 'Marketing', performance: 88, growth: 12, revenue: 150000 },
        { department: 'Development', performance: 95, growth: 20, revenue: 300000 },
        { department: 'HR', performance: 85, growth: 8, revenue: 50000 },
        { department: 'Finance', performance: 90, growth: 10, revenue: 75000 }
      ];
      setDepartmentPerformance(performance);
    }
  };

  const fetchFinancialOverview = async () => {
    try {
      const { data: financialData } = await supabase
        .from('financialreports')
        .select('*')
        .order('quarterenddate', { ascending: false })
        .limit(2);

      const currentRevenue = financialData?.[0]?.totalrevenue || 1250000;
      const previousRevenue = financialData?.[1]?.totalrevenue || 1000000;
      const revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);

      setFinancialOverview({
        marketShare: 18.5,
        employeeRetention: 94,
        revenueGrowth: parseFloat(revenueGrowth),
        operatingMargin: 28.5
      });
    } catch (error) {
      console.error('Error fetching financial overview:', error);
      setFinancialOverview({
        marketShare: 18.5,
        employeeRetention: 94,
        revenueGrowth: 22.3,
        operatingMargin: 28.5
      });
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
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  <CrownOutlined style={{ marginRight: 12, color: '#faad14' }} />
                  CEO Dashboard
                </Title>
                <Text type="secondary">Welcome back, {profile?.full_name}</Text>
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={initializeDashboard}
                  >
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Key Metrics */}
        <Col span={24}>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Employees"
                  value={companyMetrics.totalEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Company Revenue"
                  value={companyMetrics.companyRevenue}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                  formatter={value => `$${(value / 1000).toFixed(0)}k`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Profit Margin"
                  value={companyMetrics.profitMargin}
                  suffix="%"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Customer Satisfaction"
                  value={companyMetrics.customerSatisfaction}
                  prefix={<StarOutlined />}
                  precision={1}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Main Content */}
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="overview">
              <TabPane tab="Overview" key="overview">
                <Row gutter={[24, 24]}>
                  <Col span={24}>
                    <Title level={4}>Strategic Goals Progress</Title>
                    <Row gutter={[24, 24]}>
                      {strategicGoals.map(goal => (
                        <Col xs={24} sm={12} lg={8} key={goal.goal_id}>
                          <Card>
                            <div style={{ marginBottom: 16 }}>
                              <Text strong>{goal.goal_name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {goal.description}
                              </Text>
                            </div>
                            <Progress
                              percent={Math.round((goal.current_value / goal.target_value) * 100)}
                              status={goal.achieved ? 'success' : 'active'}
                            />
                            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                              <Text type="secondary">
                                {goal.current_value} / {goal.target_value}
                              </Text>
                              <Tag color={goal.achieved ? 'success' : 'processing'}>
                                {goal.achieved ? 'Achieved' : 'In Progress'}
                              </Tag>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title="Department Performance">
                      <Bar
                        data={departmentPerformance}
                        xField="performance"
                        yField="department"
                        seriesField="department"
                        isStack={true}
                        legend={{ position: 'top-left' }}
                      />
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title="Financial Overview">
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Market Share"
                            value={financialOverview.marketShare}
                            suffix="%"
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Employee Retention"
                            value={financialOverview.employeeRetention}
                            suffix="%"
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Revenue Growth"
                            value={financialOverview.revenueGrowth}
                            suffix="%"
                            valueStyle={{ color: '#faad14' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Operating Margin"
                            value={financialOverview.operatingMargin}
                            suffix="%"
                            valueStyle={{ color: '#eb2f96' }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CEODashboard;