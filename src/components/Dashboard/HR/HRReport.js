import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Typography, Button, Space, DatePicker,
  Select, Statistic, Tag, Modal, Form, Input, Radio, message, Spin
} from 'antd';
import {
  FileTextOutlined, DownloadOutlined, EyeOutlined,
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  FileExcelOutlined, FileWordOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocTable, TableCell, TableRow, TextRun } from 'docx';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const HRReports = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [reportType, setReportType] = useState('employee');
  const [dateRange, setDateRange] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [generateForm] = Form.useForm();

  useEffect(() => {
    fetchReports();
    fetchEmployees();
    fetchAttendanceData();
    fetchLeaveData();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hr_reports')
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

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, employee(full_name, department)')
        .order('date', { ascending: false })
        .limit(100);

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
        .select('*, employee(full_name, department)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLeaveData(data || []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
      setLeaveData([]);
    }
  };

  const generateReport = async (values) => {
    try {
      setReportLoading(true);
      
      let reportData = [];
      let fileName = '';
      const startDate = dateRange[0]?.format('YYYY-MM-DD') || dayjs().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = dateRange[1]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD');

      switch (values.report_type) {
        case 'employee':
          reportData = employees;
          fileName = `employee_report_${startDate}_to_${endDate}`;
          break;
        case 'attendance':
          reportData = attendanceData.filter(item => 
            dayjs(item.date).isBetween(startDate, endDate, null, '[]')
          );
          fileName = `attendance_report_${startDate}_to_${endDate}`;
          break;
        case 'leave':
          reportData = leaveData.filter(item => 
            dayjs(item.leavefromdate).isBetween(startDate, endDate, null, '[]')
          );
          fileName = `leave_report_${startDate}_to_${endDate}`;
          break;
        case 'salary':
          reportData = await generateSalaryReport(startDate, endDate);
          fileName = `salary_report_${startDate}_to_${endDate}`;
          break;
        case 'performance':
          reportData = await generatePerformanceReport();
          fileName = `performance_report_${startDate}_to_${endDate}`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      const reportRecord = {
        report_name: fileName,
        report_type: values.report_type,
        generated_by: profile.empid,
        file_path: `${fileName}.${values.format}`,
        status: 'completed'
      };

      const { data, error } = await supabase
        .from('hr_reports')
        .insert([reportRecord])
        .select();

      if (error) throw error;

      if (values.format === 'excel') {
        await generateExcelReport(reportData, fileName);
      } else if (values.format === 'word') {
        await generateWordReport(reportData, fileName, values.report_type);
      }

      message.success('Report generated successfully!');
      setIsGenerateModalVisible(false);
      generateForm.resetFields();
      fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const generateSalaryReport = async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select('*, employee(full_name, department)')
        .gte('salarydate', startDate)
        .lte('salarydate', endDate);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error generating salary report:', error);
      return [];
    }
  };

  const generatePerformanceReport = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi')
        .select('*, employee(full_name, department), kpiranking(kpirank)')
        .order('calculatedate', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error generating performance report:', error);
      return [];
    }
  };

  const generateExcelReport = async (data, fileName) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel report:', error);
      throw error;
    }
  };

  const generateWordReport = async (data, fileName, reportType) => {
    try {
      if (!data || data.length === 0) {
        message.warning('No data available for the selected report');
        return;
      }

      const headers = Object.keys(data[0]);
      const tableRows = [
        new TableRow({
          children: headers.map(header =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(header)] })]
            })
          )
        }),
        ...data.map(item =>
          new TableRow({
            children: headers.map(header =>
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun(String(item[header] || ''))]
                })]
              })
            )
          })
        )
      ];

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({
                text: `${fileName.replace(/_/g, ' ').toUpperCase()}`,
                bold: true,
                size: 32
              })]
            }),
            new Paragraph({
              children: [new TextRun({
                text: `Generated on: ${dayjs().format('YYYY-MM-DD HH:mm')}`,
                size: 24
              })]
            }),
            new Paragraph({ children: [new TextRun('')] }),
            new DocTable({
              rows: tableRows
            })
          ]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.docx`;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Error generating Word report:', error);
      message.error('Failed to generate Word report');
    }
  };

  const downloadReport = (report) => {
    if (report.file_path) {
      const link = document.createElement('a');
      link.href = report.file_path;
      link.download = report.report_name;
      link.click();
    } else {
      message.info('This report is not available for download yet');
    }
  };

  const reportColumns = [
    {
      title: 'Report Name',
      dataIndex: 'report_name',
      key: 'report_name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Type: {record.report_type}
          </Text>
        </Space>
      )
    },
    {
      title: 'Generated By',
      dataIndex: 'generated_by',
      key: 'generated_by',
      render: (id) => <Text>HR Department</Text>
    },
    {
      title: 'Format',
      dataIndex: 'file_path',
      key: 'format',
      render: (path) => {
        const format = path?.split('.').pop() || 'unknown';
        return <Tag color="blue">{format.toUpperCase()}</Tag>;
      }
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
            onClick={() => downloadReport(record)}
          >
            Download
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2}>HR Reports</Title>
                <Text type="secondary">Generate comprehensive reports for various HR functions</Text>
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
                  title="Active Employees"
                  value={employees.length}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Attendance Records"
                  value={attendanceData.length}
                  prefix={<PieChartOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Leave Applications"
                  value={leaveData.length}
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Quick Export Buttons */}
        <Col span={24}>
          <Card title="Quick Export">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Button
                  icon={<FileExcelOutlined />}
                  block
                  size="large"
                  onClick={() => generateExcelReport(employees, 'employee_list')}
                >
                  Export Employee List (Excel)
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  icon={<FileWordOutlined />}
                  block
                  size="large"
                  onClick={() => generateWordReport(employees, 'employee_list', 'employee')}
                >
                  Export Employee List (Word)
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  icon={<FileExcelOutlined />}
                  block
                  size="large"
                  onClick={() => generateExcelReport(attendanceData, 'attendance_data')}
                >
                  Export Attendance (Excel)
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  icon={<FileExcelOutlined />}
                  block
                  size="large"
                  onClick={() => generateExcelReport(leaveData, 'leave_data')}
                >
                  Export Leave Data (Excel)
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  icon={<FileWordOutlined />}
                  block
                  size="large"
                  onClick={() => generateWordReport(leaveData, 'leave_report', 'leave')}
                >
                  Export Leave Report (Word)
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  icon={<FileExcelOutlined />}
                  block
                  size="large"
                  onClick={async () => {
                    const data = await generatePerformanceReport();
                    generateExcelReport(data, 'performance_report');
                  }}
                >
                  Export Performance (Excel)
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Generated Reports */}
        <Col span={24}>
          <Card title="Generated Reports">
            <Table
              columns={reportColumns}
              dataSource={reports}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Generate Report Modal */}
      <Modal
        title="Generate HR Report"
        open={isGenerateModalVisible}
        onCancel={() => {
          setIsGenerateModalVisible(false);
          generateForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={generateForm} layout="vertical" onFinish={generateReport}>
          <Form.Item name="report_type" label="Report Type" rules={[{ required: true }]}>
            <Select placeholder="Select report type">
              <Option value="employee">Employee List Report</Option>
              <Option value="attendance">Attendance Report</Option>
              <Option value="leave">Leave Report</Option>
              <Option value="salary">Salary Report</Option>
              <Option value="performance">Performance Report</Option>
            </Select>
          </Form.Item>

          <Form.Item name="format" label="Format" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="excel">
                <Space>
                  <FileExcelOutlined style={{ color: '#217346' }} />
                  Excel (.xlsx)
                </Space>
              </Radio>
              <Radio value="word">
                <Space>
                  <FileWordOutlined style={{ color: '#2b579a' }} />
                  Word (.docx)
                </Space>
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Date Range">
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={reportLoading}
              icon={<DownloadOutlined />}
            >
              Generate Report
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HRReports;