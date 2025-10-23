// src/components/Common/Attendance.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Row,
  Col,
  Statistic,
  Divider,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  HistoryOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import DatabaseService from '../../services/databaseService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Attendance = () => {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);

  const isManagerOrHR = ['manager', 'hr', 'admin'].includes(profile?.role);

  useEffect(() => {
    fetchAttendance();
    checkTodayAttendance();
  }, []);

  const fetchAttendance = async (filters = {}) => {
    setLoading(true);
    try {
      const queryFilters = { ...filters };
      if (!isManagerOrHR) {
        queryFilters.employeeId = profile.empid;
      }
      const data = await DatabaseService.getAttendance(queryFilters);
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      message.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const data = await DatabaseService.getAttendance({
        employeeId: profile.empid,
        date: today
      });
      setTodayAttendance(data[0] || null);
    } catch (error) {
      console.error('Error checking today attendance:', error);
    }
  };

  const handlePunchIn = async () => {
    setPunchLoading(true);
    try {
      await DatabaseService.punchIn(profile.empid, {
        intime: new Date().toTimeString().split(' ')[0],
        status: 'Present'
      });
      message.success('Punched in successfully!');
      checkTodayAttendance();
      fetchAttendance();
    } catch (error) {
      console.error('Error punching in:', error);
      message.error('Failed to punch in');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setPunchLoading(true);
    try {
      const outTime = new Date().toTimeString().split(' ')[0];
      await DatabaseService.punchOut(todayAttendance.attendanceid, outTime);
      message.success('Punched out successfully!');
      checkTodayAttendance();
      fetchAttendance();
    } catch (error) {
      console.error('Error punching out:', error);
      message.error('Failed to punch out');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleDateFilter = (dates) => {
    if (dates && dates.length === 2) {
      const [start, end] = dates;
      fetchAttendance({
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD')
      });
    } else {
      fetchAttendance();
    }
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'first_name'],
      key: 'employee',
      render: (text, record) => 
        `${record.employee?.first_name} ${record.employee?.last_name}`
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Punch In',
      dataIndex: 'intime',
      key: 'intime'
    },
    {
      title: 'Punch Out',
      dataIndex: 'outtime',
      key: 'outtime',
      render: (time) => time || 'Not punched out'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Present' ? 'green' : 'red'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Working Hours',
      key: 'hours',
      render: (_, record) => {
        if (!record.intime || !record.outtime) return 'N/A';
        
        const inTime = dayjs(record.intime, 'HH:mm:ss');
        const outTime = dayjs(record.outtime, 'HH:mm:ss');
        const hours = outTime.diff(inTime, 'hour', true);
        
        return `${hours.toFixed(2)} hours`;
      }
    }
  ];

  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Attendance Management">
        {/* Punch In/Out Section */}
        {!isManagerOrHR && (
          <>
            <Alert
              message="Today's Attendance"
              description={
                todayAttendance ? (
                  <Space>
                    <Tag color="green">Punched In: {todayAttendance.intime}</Tag>
                    {todayAttendance.outtime && (
                      <Tag color="blue">Punched Out: {todayAttendance.outtime}</Tag>
                    )}
                  </Space>
                ) : (
                  "You haven't punched in today"
                )
              }
              type={todayAttendance ? "success" : "info"}
              style={{ marginBottom: 16 }}
              action={
                <Space>
                  {!todayAttendance ? (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      loading={punchLoading}
                      onClick={handlePunchIn}
                    >
                      Punch In
                    </Button>
                  ) : !todayAttendance.outtime ? (
                    <Button
                      type="primary"
                      danger
                      icon={<PauseCircleOutlined />}
                      loading={punchLoading}
                      onClick={handlePunchOut}
                    >
                      Punch Out
                    </Button>
                  ) : null}
                </Space>
              }
            />
            <Divider />
          </>
        )}

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Records"
                value={attendanceStats.total}
                prefix={<HistoryOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Present Days"
                value={attendanceStats.present}
                valueStyle={{ color: '#52c41a' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Absent Days"
                value={attendanceStats.absent}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <div style={{ marginBottom: 16 }}>
          <RangePicker
            onChange={handleDateFilter}
            style={{ width: 300 }}
          />
        </div>

        {/* Attendance Table */}
        <Table
          dataSource={attendance}
          columns={columns}
          loading={loading}
          rowKey="attendanceid"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Attendance;