import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Typography, Button, Space, Avatar,
  Badge, Alert, Tabs, Spin
} from 'antd';
import {
  UserOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DollarOutlined, TeamOutlined, LineChartOutlined, LoginOutlined,
  LogoutOutlined, SearchOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const EmployeeDashboard = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({});
  const [myTasks, setMyTasks] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [salaryData, setSalaryData] = useState({});

  useEffect(() => {
    if (!profile) {
      navigate('/login');
      return;
    }
    initializeDashboard();
  }, [profile]);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAttendanceData(),
        fetchMyTasks(),
        fetchLeaveBalance(),
        fetchSalaryData()
      ]);
    } catch (error) {
      console.error('Error initializing employee dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('empid', profile.empid)
        .eq('date', today)
        .single();

      setAttendanceData({
        todayRecord: data,
        presentDays: 18,
        absentDays: 2,
        lateMarks: 1
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData({});
    }
  };

  const fetchMyTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', profile.empid)
        .order('due_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setMyTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setMyTasks([]);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('leavebalance')
        .select('*')
        .eq('empid', profile.empid)
        .single();

      setLeaveBalance(data || { days: 15, max_days: 21, taken: 6 });
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      setLeaveBalance({ days: 15, max_days: 21, taken: 6 });
    }
  };

  const fetchSalaryData = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select('*')
        .eq('empid', profile.empid)
        .order('salarydate', { ascending: false })
        .limit(1)
        .single();

      setSalaryData(data || { totalsalary: 0 });
    } catch (error) {
      console.error('Error fetching salary:', error);
      setSalaryData({ totalsalary: 0 });
    }
  };

  const handleMarkAttendance = async () => {
    try {
      const currentTime = new Date().toTimeString().split(' ')[0];
      const today = dayjs().format('YYYY-MM-DD');

      const existingAttendance = attendanceData.todayRecord;

      const attendanceDataToSend = {
        empid: profile.empid,
        date: today,
        status: 'present'
      };

      if (existingAttendance) {
        attendanceDataToSend.outtime = currentTime;
        await supabase
          .from('attendance')
          .update(attendanceDataToSend)
          .eq('attendanceid', existingAttendance.attendanceid);
      } else {
        attendanceDataToSend.intime = currentTime;
        await supabase
          .from('attendance')
          .insert([attendanceDataToSend]);
      }

      message.success(`Attendance ${existingAttendance ? 'updated' : 'marked'} successfully!`);
      fetchAttendanceData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      message.error('Failed to mark attendance');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Alert
          message="Authentication Error"
          description="Unable to load your profile. Please try logging in again."
          type="error"
          showIcon
        />
        <Button type="primary" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header Section */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <Avatar size={64} icon={<UserOutlined />} />
          </Col>
          <Col flex={1}>
            <Title level={2} style={{ margin: 0 }}>
              Welcome back, {profile?.full_name || 'Employee'}!
            </Title>
            <Text type="secondary">
              {profile?.role || 'Employee'} • {profile?.department || 'Department'} • Employee ID: {profile?.empid || 'N/A'}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<LineChartOutlined />}
                onClick={() => navigate('/employee/reports')}
              >
                Generate Report
              </Button>
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={logout}
              >
                Logout
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Card>
        <Tabs defaultActiveKey="overview">
          <TabPane tab="Overview" key="overview">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Today's Attendance"
                    value={attendanceData.todayRecord ? 'Present' : 'Absent'}
                    prefix={attendanceData.todayRecord ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    valueStyle={{ color: attendanceData.todayRecord ? '#3f8600' : '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Leave Balance"
                    value={leaveBalance.days || 0}
                    suffix={`/ ${leaveBalance.max_days || 0}`}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Pending Tasks"
                    value={myTasks.filter(task => task.status === 'pending').length}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Monthly Salary"
                    value={salaryData.totalsalary || 0}
                    prefix={<DollarOutlined />}
                    formatter={value => `LKR ${value}`}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="Quick Actions" style={{ textAlign: 'center' }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Button 
                      type="primary" 
                      icon={<LoginOutlined />} 
                      onClick={handleMarkAttendance}
                      block
                    >
                      {attendanceData.todayRecord ? 'Mark Out Time' : 'Mark In Time'}
                    </Button>
                    <Button 
                      icon={<CalendarOutlined />} 
                      onClick={() => navigate('/employee/leaves')}
                      block
                    >
                      Apply for Leave
                    </Button>
                    <Button 
                      icon={<LineChartOutlined />} 
                      onClick={() => navigate('/employee/reports')}
                      block
                    >
                      Generate Report
                    </Button>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Recent Tasks" extra={<Button type="link" onClick={() => navigate('/employee/tasks')}>View All</Button>}>
                  {myTasks.length > 0 ? (
                    <List
                      dataSource={myTasks.slice(0, 5)}
                      renderItem={task => (
                        <List.Item>
                          <List.Item.Meta
                            title={task.title}
                            description={task.description}
                          />
                          <Tag color={
                            task.status === 'completed' ? 'green' : 
                            task.status === 'in_progress' ? 'blue' : 'orange'
                          }>
                            {task.status}
                          </Tag>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      No tasks assigned
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;