import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Tabs, Button, Space,
  Modal, Form, DatePicker, message, List, Avatar
} from 'antd';
import {
  TeamOutlined, UserOutlined, DatabaseOutlined,
  CalendarOutlined, DollarOutlined, CheckCircleOutlined,
  PieChartOutlined, RocketOutlined, FilterOutlined,
  SettingOutlined, BarChartOutlined, FileTextOutlined
} from '@ant-design/icons';

import { supabase } from '../../../services/supabase';
import dayjs from 'dayjs';
import AdminEmployee from './AdminEmployee';
import AdminPayment from './AdminPayment';
import AdminReport from './AdminReport';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [systemStats, setSystemStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [isDateRangeModalVisible, setIsDateRangeModalVisible] = useState(false);
  const [dateRangeForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        await Promise.all([
          fetchSystemStats(),
          fetchRecentActivities()
        ]);
      }
    } catch (error) {
      console.error('Error initializing admin dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const { data: employees } = await supabase
        .from('employee')
        .select('*')
        .eq('is_active', true);

      const { data: pendingLeaves } = await supabase
        .from('employeeleave')
        .select('*')
        .eq('leavestatus', 'pending');

      const { data: departments } = await supabase
        .from('departments')
        .select('*');

      const { data: loans } = await supabase
        .from('loanrequest')
        .select('*')
        .eq('status', 'pending');

      const today = dayjs().format('YYYY-MM-DD');
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);

      const activeEmployees = employees?.filter(e => e.status === 'Active').length || 0;
      const totalDepartments = departments?.length || 0;
      const pendingLoans = loans?.length || 0;
      const todayAttendance = attendance || [];

      setSystemStats({
        totalEmployees: employees?.length || 0,
        activeEmployees,
        departments: totalDepartments,
        pendingLeaves: pendingLeaves?.length || 0,
        pendingLoans,
        todayPresent: todayAttendance.filter(a => a.status === 'Present').length,
        systemHealth: 95,
        storageUsed: 65,
        newHires: employees?.filter(e => {
          const joinDate = dayjs(e.created_at);
          const monthAgo = dayjs().subtract(1, 'month');
          return joinDate >= monthAgo;
        }).length || 0
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleUpdateDateRange = async (values) => {
    try {
      const { dateRange: newDateRange } = values;
      setDateRange(newDateRange);
      setIsDateRangeModalVisible(false);
      dateRangeForm.resetFields();
      
      message.info('Updating data for new date range...');
      
      await Promise.all([
        fetchRecentActivities()
      ]);
      
      message.success('Data updated for selected date range!');
    } catch (error) {
      console.error('Error updating date range:', error);
      message.error('Failed to update date range');
    }
  };

  const renderOverview = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Employees"
            value={systemStats.totalEmployees || 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Employees"
            value={systemStats.activeEmployees || 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Departments"
            value={systemStats.departments || 0}
            prefix={<DatabaseOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Pending Leaves"
            value={systemStats.pendingLeaves || 0}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Pending Loans"
            value={systemStats.pendingLoans || 0}
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#fa541c' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Today Present"
            value={systemStats.todayPresent || 0}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#13c2c2' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="System Health"
            value={systemStats.systemHealth || 0}
            suffix="%"
            prefix={<PieChartOutlined />}
            valueStyle={{ color: '#eb2f96' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="New Hires (30d)"
            value={systemStats.newHires || 0}
            prefix={<RocketOutlined />}
            valueStyle={{ color: '#a0d911' }}
          />
        </Card>
      </Col>

      {/* Recent Activities */}
      <Col span={24}>
        <Card 
          title="Recent Activities" 
          extra={
            <Button 
              type="link" 
              icon={<FilterOutlined />}
              onClick={() => setIsDateRangeModalVisible(true)}
            >
              Date Range
            </Button>
          }
        >
          <List
            dataSource={recentActivities}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<SettingOutlined />} />}
                  title={item.action}
                  description={
                    <Space direction="vertical" size={0}>
                      <div>Table: {item.table_name}</div>
                      <div>Time: {dayjs(item.created_at).format('MMM D, YYYY HH:mm')}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        IP: {item.ip_address}
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderDateRangeModal = () => (
    <Modal
      title="Select Date Range"
      open={isDateRangeModalVisible}
      onCancel={() => {
        setIsDateRangeModalVisible(false);
        dateRangeForm.resetFields();
      }}
      onOk={() => dateRangeForm.submit()}
    >
      <Form form={dateRangeForm} layout="vertical" onFinish={handleUpdateDateRange}>
        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Please select date range' }]}
          initialValue={dateRange}
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
          Admin Dashboard
        </h1>
        <p style={{ margin: 0, color: '#666' }}>
          Welcome back! Manage your HR system efficiently.
        </p>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <BarChartOutlined />
                  Overview
                </span>
              ),
              children: renderOverview(),
            },
            {
              key: 'employees',
              label: (
                <span>
                  <TeamOutlined />
                  Employee Management
                </span>
              ),
              children: <AdminEmployee dateRange={dateRange} />,
            },
            {
              key: 'payments',
              label: (
                <span>
                  <DollarOutlined />
                  Payment Management
                </span>
              ),
              children: <AdminPayment dateRange={dateRange} />,
            },
            {
              key: 'reports',
              label: (
                <span>
                  <FileTextOutlined />
                  Reports & Analytics
                </span>
              ),
              children: <AdminReport dateRange={dateRange} />,
            },
          ]}
        />
      </Card>

      {renderDateRangeModal()}
    </div>
  );
};

export default AdminDashboard;