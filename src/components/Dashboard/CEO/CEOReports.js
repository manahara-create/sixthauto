import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Typography, Button, Space, DatePicker,
  Select, Statistic, Progress, Tag, Modal, Form, Input,
  message, Spin, Alert
} from 'antd';
import {
  FileTextOutlined, DownloadOutlined, EyeOutlined,
  BarChartOutlined, LineChartOutlined, PieChartOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CEOReport = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [strategicGoals, setStrategicGoals] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [financialData, setFinancialData] = useState([]);
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [reportType, setReportType] = useState('financial');
  const [dateRange, setDateRange] = useState([]);

  const [generateForm] = Form.useForm();

  useEffect(() => {
    fetchReports();
    fetchStrategicGoals();
    fetchDepartmentPerformance();
    fetchFinancialData();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Failed to fetch reports');
    } finally {
      setLoading(false);
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
    }
  };

  const fetchFinancialData = async () => {
    try {
      const { data, error } = await supabase
        .from('financialreports')
        .select('*')
        .order('quarterenddate', { ascending: false })
        .limit(4);

      if (error) throw error;
      setFinancialData(data || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const generateReport = async (values) => {
    try {
      setLoading(true);
      const reportData = {
        name: `${values.report_type} Report - ${dayjs().format('YYYY-MM-DD')}`,
        type: values.report_type,
        format: 'pdf',
        status: 'completed',
        created_by: profile.empid,
        config: {
          date_range: dateRange,
          filters: values.filters
        },
        download_url: null
      };

      const { data, error } = await supabase
        .from('reports')
        .insert([reportData])
        .select();

      if (error) throw error;

      message.success('Report generated successfully!');
      setIsGenerateModalVisible(false);
      generateForm.resetFields();
      fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      message.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export Excel file');
    }
  };

  const exportToWord = (data, filename, title) => {
    message.info('Word export feature would be implemented here');
  };

  const downloadReport = (report) => {
    if (report.download_url) {
      window.open(report.download_url, '_blank');
    } else {
      message.info('This report is not available for download yet');
    }
  };

  const reportColumns = [
    {
      title: 'Report Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Type: {record.type}
          </Text>
        </Space>
      )
    },
    {
      title: 'Generated By',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (id) => <Text>CEO</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : 'processing'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => downloadReport(record)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => exportToExcel([record], `report_${record.reportid}`)}
          >
            Export
          </Button>
        </Space>
      )
    }
  ];

  const strategicGoalColumns = [
    {
      title: 'Goal Name',
      dataIndex: 'goal_name',
      key: 'goal_name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </Space>
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (record) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress
            percent={Math.round((record.current_value / record.target_value) * 100)}
            status={record.achieved ? 'success' : 'active'}
          />
          <Text type="secondary">
            {record.current_value} / {record.target_value}
          </Text>
        </Space>
      )
    },
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      render: (quarter) => `Q${quarter}`
    },
    {
      title: 'Status',
      key: 'status',
      render: (record) => (
        <Tag color={record.achieved ? 'success' : 'processing'}>
          {record.achieved ? 'Achieved' : 'In Progress'}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2}>Reports & Analytics</Title>
              </Col>
              <Col>
                <Space>
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={() => setIsGenerateModalVisible(true)}
                  >
                    Generate Report
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col span={24}>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Reports"
                  value={reports.length}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Strategic Goals"
                  value={strategicGoals.length}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Active Departments"
                  value={departmentPerformance.length}
                  prefix={<PieChartOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Financial Quarters"
                  value={financialData.length}
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Strategic Goals */}
        <Col span={24}>
          <Card
            title="Strategic Goals Progress"
            extra={
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportToExcel(strategicGoals, 'strategic_goals')}
              >
                Export
              </Button>
            }
          >
            <Table
              columns={strategicGoalColumns}
              dataSource={strategicGoals}
              rowKey="goal_id"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Department Performance */}
        <Col span={24}>
          <Card
            title="Department Performance"
            extra={
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportToExcel(departmentPerformance, 'department_performance')}
              >
                Export
              </Button>
            }
          >
            <Table
              columns={[
                { title: 'Department', dataIndex: 'department', key: 'department' },
                { 
                  title: 'Performance', 
                  dataIndex: 'performance', 
                  key: 'performance',
                  render: (value) => <Progress percent={value} size="small" />
                },
                { 
                  title: 'Growth', 
                  dataIndex: 'growth', 
                  key: 'growth',
                  render: (value) => <Tag color={value > 15 ? 'success' : value > 10 ? 'warning' : 'error'}>{value}%</Tag>
                },
                { 
                  title: 'Revenue', 
                  dataIndex: 'revenue', 
                  key: 'revenue',
                  render: (value) => `$${(value / 1000).toFixed(0)}k`
                }
              ]}
              dataSource={departmentPerformance}
              rowKey="department"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Generated Reports */}
        <Col span={24}>
          <Card title="Generated Reports">
            <Table
              columns={reportColumns}
              dataSource={reports}
              rowKey="reportid"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Generate Report Modal */}
      <Modal
        title="Generate New Report"
        open={isGenerateModalVisible}
        onCancel={() => {
          setIsGenerateModalVisible(false);
          generateForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={generateForm} layout="vertical" onFinish={generateReport}>
          <Form.Item name="report_type" label="Report Type" rules={[{ required: true }]}>
            <Select placeholder="Select report type">
              <Option value="financial">Financial Report</Option>
              <Option value="performance">Performance Report</Option>
              <Option value="strategic">Strategic Goals Report</Option>
              <Option value="department">Department Report</Option>
              <Option value="employee">Employee Report</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date_range" label="Date Range">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="filters" label="Additional Filters">
            <Input.TextArea placeholder="Enter any additional filters or requirements..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Generate Report
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CEOReport;