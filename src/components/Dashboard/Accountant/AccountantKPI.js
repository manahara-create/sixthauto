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
  Modal,
  Popconfirm
} from 'antd';
import {
  TrophyOutlined,
  PlusOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../../services/supabase';

const { Option } = Select;

const AccountantKPI = ({ dateRange, onRefresh, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
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
      // Fetch KPI data
      const { data: kpiData, error: kpiError } = await supabase
        .from('kpi')
        .select(`
          kpiid,
          empid,
          kpivalue,
          calculatedate,
          kpiyear,
          employee:employee(full_name, department)
        `)
        .order('calculatedate', { ascending: false });

      if (kpiError) throw kpiError;

      // Fetch employees
      const { data: employeeData, error: employeeError } = await supabase
        .from('employee')
        .select('empid, full_name, department, kpiscore')
        .eq('status', 'Active')
        .order('full_name');

      if (employeeError) throw employeeError;

      setKpiData(kpiData || []);
      setEmployees(employeeData || []);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
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

    if (!currentUser) {
      message.error('User not authenticated');
      return;
    }

    try {
      if (editRecord) {
        // Update existing KPI
        const { error } = await supabase
          .from('kpi')
          .update({
            kpivalue: formData.kpiValue,
            calculatedate: formData.calculateDate.format('YYYY-MM-DD'),
            kpiyear: formData.calculateDate.year()
          })
          .eq('kpiid', editRecord.kpiid);

        if (error) throw error;

        // Log operation
        await supabase
          .from('accountant_operations')
          .insert({
            operation: 'UPDATE_KPI',
            record_id: editRecord.kpiid,
            accountant_id: currentUser.id,
            details: `Updated KPI for employee ${formData.employeeId} - Score: ${formData.kpiValue}`,
            operation_time: new Date().toISOString()
          });

        message.success('KPI updated successfully!');
      } else {
        // Create new KPI
        const { data, error } = await supabase
          .from('kpi')
          .insert({
            empid: formData.employeeId,
            kpivalue: formData.kpiValue,
            calculatedate: formData.calculateDate.format('YYYY-MM-DD'),
            kpiyear: formData.calculateDate.year()
          })
          .select();

        if (error) throw error;

        // Log operation
        await supabase
          .from('accountant_operations')
          .insert({
            operation: 'CREATE_KPI',
            record_id: data[0].kpiid,
            accountant_id: currentUser.id,
            details: `Added KPI for employee ${formData.employeeId} - Score: ${formData.kpiValue}`,
            operation_time: new Date().toISOString()
          });

        message.success('KPI added successfully!');
      }

      setModalVisible(false);
      resetForm();
      fetchData();
      onRefresh?.();
    } catch (error) {
      console.error('Error saving KPI:', error);
      message.error('Failed to save KPI');
    }
  };

  const handleDelete = async (kpiId) => {
    try {
      const { error } = await supabase
        .from('kpi')
        .delete()
        .eq('kpiid', kpiId);

      if (error) throw error;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'DELETE_KPI',
          record_id: kpiId,
          accountant_id: currentUser?.id,
          details: `Deleted KPI record ${kpiId}`,
          operation_time: new Date().toISOString()
        });

      message.success('KPI record deleted successfully!');
      fetchData();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      message.error('Failed to delete KPI');
    }
  };

  const handleEdit = (record) => {
    setEditRecord(record);
    setFormData({
      employeeId: record.empid,
      kpiValue: record.kpivalue,
      calculateDate: dayjs(record.calculatedate)
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      employeeId: null,
      kpiValue: 0,
      calculateDate: dayjs()
    });
    setEditRecord(null);
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
        // Calculate trend based on previous KPI (simplified)
        const trend = record.kpivalue > 80;
        return trend ? (
          <Tag icon={<RiseOutlined />} color="success">Good</Tag>
        ) : (
          <Tag icon={<FallOutlined />} color="error">Needs Improvement</Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this KPI record?"
            onConfirm={() => handleDelete(record.kpiid)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
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
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit KPI Modal */}
      <Modal
        title={<><TrophyOutlined /> {editRecord ? 'Edit KPI Score' : 'Add KPI Score'}</>}
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
              disabled={!!editRecord}
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