
import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Avatar,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Row,
  Col,
  Statistic,
  Divider
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const EmployeeDetails = ({ employeeId, showActions = false }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [additionalData, setAdditionalData] = useState({
    attendance: {},
    tasks: [],
    leaves: []
  });

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails();
    }
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    setLoading(true);
    try {
      // Fetch basic employee info
      const { data: employeeData, error } = await supabase
        .from('employee')
        .select('*')
        .eq('empid', employeeId)
        .single();

      if (error) throw error;
      setEmployee(employeeData);

      // Fetch additional data in parallel
      await Promise.all([
        fetchAttendanceData(employeeId),
        fetchTasks(employeeId),
        fetchLeaves(employeeId)
      ]);

    } catch (error) {
      console.error('Error fetching employee details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async (empId) => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('empid', empId)
        .eq('date', today);

      const currentMonth = dayjs().format('YYYY-MM');
      const { data: monthlyData } = await supabase
        .from('attendance')
        .select('*')
        .eq('empid', empId)
        .like('date', `${currentMonth}%`)
        .eq('status', 'Present');

      setAdditionalData(prev => ({
        ...prev,
        attendance: {
          todayStatus: data?.[0]?.status || 'Not Recorded',
          monthlyPresent: monthlyData?.length || 0,
          lastPunch: data?.[0]?.intime || 'N/A'
        }
      }));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchTasks = async (empId) => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', empId)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(3);

      setAdditionalData(prev => ({
        ...prev,
        tasks: data || []
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchLeaves = async (empId) => {
    try {
      const { data } = await supabase
        .from('employeeleave')
        .select('*')
        .eq('empid', empId)
        .order('created_at', { ascending: false })
        .limit(3);

      setAdditionalData(prev => ({
        ...prev,
        leaves: data || []
      }));
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'green',
      'Inactive': 'red',
      'On Leave': 'orange',
      'Suspended': 'red'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="secondary">Employee not found</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <Card>
        {/* Header Section */}
        <div style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                src={employee.avatarurl}
                style={{ backgroundColor: '#1890ff' }}
              />
            </Col>
            <Col flex="1">
              <Title level={2} style={{ margin: 0 }}>
                {employee.first_name} {employee.last_name}
              </Title>
              <Space size="middle">
                <Tag color="blue">ID: {employee.empid}</Tag>
                <Tag color={getStatusColor(employee.status)}>
                  {employee.status}
                </Tag>
                <Tag color="purple">{employee.role}</Tag>
              </Space>
            </Col>
            {showActions && (
              <Col>
                <Space>
                  <Button type="primary">Edit Profile</Button>
                  <Button>Send Message</Button>
                </Space>
              </Col>
            )}
          </Row>
        </div>

        <Divider />

        {/* Quick Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Monthly Attendance"
              value={additionalData.attendance.monthlyPresent}
              suffix="days"
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Pending Tasks"
              value={additionalData.tasks.length}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="KPI Score"
              value={employee.kpiscore || 0}
              suffix="/100"
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Leave Balance"
              value={employee.fulldayleavebalance || 0}
              suffix="days"
            />
          </Col>
        </Row>

        {/* Main Information */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card size="small" title="Personal Information">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Employee ID">
                  <Text strong>{employee.empid}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <Space>
                    <MailOutlined />
                    {employee.email}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  <Space>
                    <PhoneOutlined />
                    {employee.phone || 'N/A'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Date of Birth">
                  <Space>
                    <CalendarOutlined />
                    {employee.dob ? dayjs(employee.dob).format('DD/MM/YYYY') : 'N/A'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Address">
                  <Space>
                    <EnvironmentOutlined />
                    {employee.empaddress || 'N/A'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Gender">
                  {employee.gender || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card size="small" title="Employment Details">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Department">
                  <Space>
                    <TeamOutlined />
                    {employee.department || 'Not assigned'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Role">
                  {employee.role}
                </Descriptions.Item>
                <Descriptions.Item label="Tenure">
                  {employee.tenure || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(employee.status)}>
                    {employee.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Today's Attendance">
                  <Tag color={additionalData.attendance.todayStatus === 'Present' ? 'green' : 'red'}>
                    {additionalData.attendance.todayStatus}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Last Login">
                  {employee.last_login ? dayjs(employee.last_login).format('DD/MM/YYYY HH:mm') : 'Never'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* Leave Balances */}
        <Card size="small" title="Leave Balances" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="Full Day" value={employee.fulldayleavebalance || 0} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="Half Day" value={employee.halfdayleavebalance || 0} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="Sick Leave" value={employee.sickleavebalance || 0} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="Short Leave" value={employee.shortleavebalance || 0} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="Maternity" value={employee.maternityleavebalance || 0} />
            </Col>
          </Row>
        </Card>
      </Card>
    </div>
  );
};

export default EmployeeDetails;