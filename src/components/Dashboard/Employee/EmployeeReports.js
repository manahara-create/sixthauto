import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Typography, Button, Space, DatePicker,
  Select, Statistic, Tag, Modal, Form, Input, message, Spin
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

const EmployeeReports = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState([]);

  const [generateForm] = Form.useForm();

  useEffect(() => {
    fetchReports();
    fetchAttendanceData();
    fetchLeaveData();
    fetchSalaryData();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('created_by', profile.empid)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('empid', profile.empid)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData([]);
    }
  };

  const fetchLeaveData = async () => {
    try {
      const { data, error } = await supabase
        .from('employeeleave')
        .select('*')
        .eq('empid', profile.empid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveData(data || []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
      setLeaveData([]);
    }
  };

  const fetchSalaryData = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select('*')
        .eq('empid', profile.empid)
        .order('salarydate', { ascending: false })
        .limit(12);

      if (error) throw error;
      setSalaryData(data || []);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      setSalaryData([]);
    }
  };

  const generateReport = async (values) => {
    try {
      setLoading(true);
      
      let reportData = [];
      let reportName = '';

      switch (values.report_type) {
        case 'attendance':
          reportData = attendanceData;
          reportName = 'Attendance Report';
          break;
        case 'leave':
          reportData = leaveData;
          reportName = 'Leave Report';
          break;
        case 'salary':
          reportData = salaryData;
          reportName = 'Salary Report';
          break;
        case 'performance':
          reportData = await generatePerformanceReport();
          reportName = 'Performance Report';
          break;
        default:
          throw new Error('Invalid report type');
      }

      const reportRecord = {
        name: `${reportName} - ${dayjs().format('YYYY-MM-DD')}`,
        type: values.report_type,
        format: values.format,
        status: 'completed',
        created_by: profile.empid,
        config: {
          date_range: dateRange,
          employee_id: profile.empid
        },
        download_url: null
      };

      const { data, error } = await supabase
        .from('reports')
        .insert([reportRecord])
        .select();

      if (error) throw error;

      if (values.format === 'excel') {
        exportToExcel(reportData, `${values.report_type}_report`);
      } else if (values.format === 'pdf') {
        message.info('PDF export would be implemented here');
      }

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

  const generatePerformanceReport = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi')
        .select('*')
        .eq('empid', profile.empid)
        .order('calculatedate', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error generating performance report:', error);
      return [];
    }
  };

  const exportToExcel = (data, filename) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, `${filename}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
      message.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export Excel file');
    }
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
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      render: (format) => <Tag color="blue">{format?.toUpperCase()}</Tag>
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

  const attendanceColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'In Time',
      dataIndex: 'intime',
      key: 'intime'
    },
    {
      title: 'Out Time',
      dataIndex: 'outtime',
      key: 'outtime'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'present' ? 'green' : 'red'}>{status}</Tag>
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
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
                  title="Attendance Records"
                  value={attendanceData.length}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Leave Applications"
                  value={leaveData.length}
                  prefix={<PieChartOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Salary Records"
                  value={salaryData.length}
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Recent Attendance */}
        <Col span={24}>
          <Card
            title="Recent Attendance"
            extra={
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportToExcel(attendanceData, 'attendance_report')}
              >
                Export
              </Button>
            }
          >
            <Table
              columns={attendanceColumns}
              dataSource={attendanceData.slice(0, 10)}
              rowKey="attendanceid"
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
              <Option value="attendance">Attendance Report</Option>
              <Option value="leave">Leave Report</Option>
              <Option value="salary">Salary Report</Option>
              <Option value="performance">Performance Report</Option>
            </Select>
          </Form.Item>
          <Form.Item name="format" label="Format" rules={[{ required: true }]}>
            <Select placeholder="Select format">
              <Option value="excel">Excel</Option>
              <Option value="pdf">PDF</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date_range" label="Date Range">
            <RangePicker style={{ width: '100%' }} />
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

export default EmployeeReports;