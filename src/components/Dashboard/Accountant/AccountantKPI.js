import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Select,
  InputNumber,
  DatePicker,
  message,
  Progress,
  Tag,
  Modal
} from 'antd';
import {
  TrophyOutlined,
  PlusOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const AccountantKPI = ({ dateRange, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: null,
    kpiValue: 0,
    calculateDate: dayjs()
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data - Replace with Supabase
      const mockKPI = [
        {
          kpiid: '1',
          employee: { full_name: 'John Doe', department: 'Engineering' },
          kpivalue: 85,
          calculatedate: '2025-10-15',
          kpiyear: 2025,
          empid: 'E001'
        },
        {
          kpiid: '2',
          employee: { full_name: 'Jane Smith', department: 'Marketing' },
          kpivalue: 92,
          calculatedate: '2025-10-14',
          kpiyear: 2025,
          empid: 'E002'
        },
        {
          kpiid: '3',
          employee: { full_name: 'Bob Johnson', department: 'Sales' },
          kpivalue: 78,
          calculatedate: '2025-10-13',
          kpiyear: 2025,
          empid: 'E003'
        }
      ];

      const mockEmployees = [
        { empid: 'E001', full_name: 'John Doe', department: 'Engineering', kpiscore: 85 },
        { empid: 'E002', full_name: 'Jane Smith', department: 'Marketing', kpiscore: 92 },
        { empid: 'E003', full_name: 'Bob Johnson', department: 'Sales', kpiscore: 78 }
      ];

      await new Promise(resolve => setTimeout(resolve, 800));
      
      setKpiData(mockKPI);
      setEmployees(mockEmployees);
    } catch (error) {
      message.error('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.employeeId || formData.kpiValue <= 0) {
      message.error('Please select employee and enter valid KPI value');
      return;
    }

    if (formData.kpiValue > 100) {
      message.error('KPI value cannot exceed 100');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('KPI added successfully!');
      setModalVisible(false);
      resetForm();
      fetchData();
      onRefresh?.();
    } catch (error) {
      message.error('Failed to add KPI');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: null,
      kpiValue: 0,
      calculateDate: dayjs()
    });
  };

  const getKPIStatus = (value) => {
    if (value >= 90) return { status: 'success', text: 'Excellent', color: '#52c41a' };
    if (value >= 80) return { status: 'normal', text: 'Good', color: '#1890ff' };
    if (value >= 70) return { status: 'normal', text: 'Average', color: '#fa8c16' };
    return { status: 'exception', text: 'Below Average', color: '#f5222d' };
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee',
      width: 180,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department',
      width: 150
    },
    {
      title: 'KPI Score',
      dataIndex: 'kpivalue',
      key: 'kpivalue',
      width: 300,
      render: (value) => {
        const status = getKPIStatus(value);
        return (
          <Space direction="vertical" style={{ width: '100%' }} size={4}>
            <Progress
              percent={value}
              status={status.status}
              strokeColor={status.color}
              format={percent => `${percent}%`}
            />
            <Tag color={status.color}>{status.text}</Tag>
          </Space>
        );
      }
    },
    {
      title: 'Calculation Date',
      dataIndex: 'calculatedate',
      key: 'calculatedate',
      width: 150,
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Year',
      dataIndex: 'kpiyear',
      key: 'kpiyear',
      width: 100
    },
    {
      title: 'Trend',
      key: 'trend',
      width: 100,
      render: (_, record) => {
        // Simulated trend - in real app, compare with previous KPI
        const trend = Math.random() > 0.5;
        return trend ? (
          <Tag icon={<RiseOutlined />} color="success">+5%</Tag>
        ) : (
          <Tag icon={<FallOutlined />} color="error">-2%</Tag>
        );
      }
    }
  ];

  const stats = {
    total: kpiData.length,
    avgScore: kpiData.length > 0 
      ? Math.round(kpiData.reduce((sum, k) => sum + k.kpivalue, 0) / kpiData.length)
      : 0,
    excellent: kpiData.filter(k => k.kpivalue >= 90).length,
    good: kpiData.filter(k => k.kpivalue >= 80 && k.kpivalue < 90).length
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24, color: '#1a1a2e' }}>
        <TrophyOutlined /> KPI Management
      </h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Records"
              value={stats.total}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={stats.avgScore}
              suffix="/100"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Excellent (≥90)"
              value={stats.excellent}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Good (80-89)"
              value={stats.good}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="KPI Records"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Add KPI
          </Button>
        }
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <Table
          columns={columns}
          dataSource={kpiData}
          loading={loading}
          rowKey="kpiid"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Add KPI Modal */}
      <Modal
        title={<><TrophyOutlined /> Add KPI Score</>}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          resetForm();
        }}
        onOk={handleSubmit}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Employee *</label>
            <Select
              placeholder="Select employee"
              style={{ width: '100%' }}
              value={formData.employeeId}
              onChange={(val) => setFormData({ ...formData, employeeId: val })}
              showSearch
              optionFilterProp="children"
            >
              {employees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.full_name} - {emp.department} (Current: {emp.kpiscore || 0})
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>KPI Value (0-100) *</label>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              value={formData.kpiValue}
              onChange={(val) => setFormData({ ...formData, kpiValue: val })}
              placeholder="Enter KPI score"
            />
            {formData.kpiValue > 0 && (
              <div style={{ marginTop: 12 }}>
                <Progress
                  percent={formData.kpiValue}
                  status={getKPIStatus(formData.kpiValue).status}
                  strokeColor={getKPIStatus(formData.kpiValue).color}
                />
                <Tag 
                  color={getKPIStatus(formData.kpiValue).color}
                  style={{ marginTop: 8 }}
                >
                  {getKPIStatus(formData.kpiValue).text}
                </Tag>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Calculation Date</label>
            <DatePicker
              style={{ width: '100%' }}
              value={formData.calculateDate}
              onChange={(val) => setFormData({ ...formData, calculateDate: val })}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default AccountantKPI;