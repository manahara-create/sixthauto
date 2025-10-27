import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Select,
  DatePicker,
  List,
  message,
  Empty
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocTable, TableCell, TableRow, WidthType } from 'docx';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ManagerReports = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [reports, setReports] = useState([]);
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [reportForm] = Form.useForm();

  useEffect(() => {
    if (profile?.empid) {
      fetchTeamMembers();
      fetchGeneratedReports();
    }
  }, [profile?.empid]);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, full_name, role, department')
        .eq('managerid', profile.empid)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const fetchGeneratedReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('created_by', profile.empid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    }
  };

  const generateReport = async (values) => {
    setLoading(true);
    try {
      const { report_type, date_range, employee } = values;
      const [startDate, endDate] = date_range || [dayjs().startOf('month'), dayjs().endOf('month')];

      let reportData = [];
      let reportTitle = '';

      switch (report_type) {
        case 'attendance':
          reportData = await generateAttendanceReport(startDate, endDate, employee);
          reportTitle = 'Attendance Report';
          break;
        case 'performance':
          reportData = await generatePerformanceReport(startDate, endDate, employee);
          reportTitle = 'Performance Report';
          break;
        case 'tasks':
          reportData = await generateTaskReport(startDate, endDate, employee);
          reportTitle = 'Task Report';
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Save report record
      const { data: reportRecord } = await supabase
        .from('reports')
        .insert([{
          name: `${reportTitle} - ${dayjs().format('YYYY-MM-DD HH:mm')}`,
          type: report_type,
          format: 'excel',
          created_by: profile.empid,
          config: {
            start_date: startDate.format('YYYY-MM-DD'),
            end_date: endDate.format('YYYY-MM-DD'),
            employee_id: employee
          },
          created_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }])
        .select();

      // Log the operation
      await supabase
        .from('manager_operations')
        .insert([{
          operation: 'generate_report',
          record_id: reportRecord?.[0]?.reportid,
          manager_id: profile.empid,
          details: {
            report_type,
            report_title: reportTitle,
            date_range: {
              start: startDate.format('YYYY-MM-DD'),
              end: endDate.format('YYYY-MM-DD')
            }
          },
          operation_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }]);

      message.success('Report generated successfully!');
      setIsGenerateModalVisible(false);
      reportForm.resetFields();
      fetchGeneratedReports();
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceReport = async (startDate, endDate, employeeId) => {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate.format('YYYY-MM-DD'))
        .lte('date', endDate.format('YYYY-MM-DD'));

      if (employeeId && employeeId !== 'all') {
        query = query.eq('empid', employeeId);
      } else {
        const teamMemberIds = teamMembers.map(member => member.empid);
        query = query.in('empid', teamMemberIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error generating attendance report:', error);
      return [];
    }
  };

  const generatePerformanceReport = async (startDate, endDate, employeeId) => {
    try {
      let query = supabase
        .from('employee')
        .select('empid, full_name, department, kpiscore, satisfaction_score, status')
        .eq('is_active', true);

      if (employeeId && employeeId !== 'all') {
        query = query.eq('empid', employeeId);
      } else {
        const teamMemberIds = teamMembers.map(member => member.empid);
        query = query.in('empid', teamMemberIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error generating performance report:', error);
      return [];
    }
  };

  const generateTaskReport = async (startDate, endDate, employeeId) => {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .gte('created_at', startDate.format('YYYY-MM-DD'))
        .lte('created_at', endDate.format('YYYY-MM-DD'));

      if (employeeId && employeeId !== 'all') {
        query = query.eq('assignee_id', employeeId);
      } else {
        const teamMemberIds = teamMembers.map(member => member.empid);
        query = query.in('assignee_id', teamMemberIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error generating task report:', error);
      return [];
    }
  };

  const exportToExcel = (data, filename) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      message.success('Report exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export report');
    }
  };

  const exportToWord = async (data, filename) => {
    try {
      const table = new DocTable({
        rows: [
          new TableRow({
            children: Object.keys(data[0] || {}).map(key => 
              new TableCell({
                children: [new Paragraph(key.toUpperCase())]
              })
            )
          }),
          ...data.map(row => 
            new TableRow({
              children: Object.values(row).map(value => 
                new TableCell({
                  children: [new Paragraph(String(value || ''))]
                })
              )
            })
          )
        ]
      });

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph(`${filename} - Generated on ${dayjs().format('YYYY-MM-DD HH:mm')}`),
            table
          ]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.docx`;
      link.click();
      URL.revokeObjectURL(link.href);
      message.success('Report exported to Word successfully!');
    } catch (error) {
      console.error('Error exporting to Word:', error);
      message.error('Failed to export report');
    }
  };

  if (!profile?.empid) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Empty
          description="Manager profile not found. Please contact administrator."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3}>
              <BarChartOutlined /> Reports & Analytics
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => setIsGenerateModalVisible(true)}
            >
              Generate Report
            </Button>
          </Col>
        </Row>

        {reports.length === 0 ? (
          <Empty
            description="No reports generated yet. Generate your first report to see them here."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={reports}
            renderItem={(report) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={() => exportToExcel([report], report.name)}
                  >
                    Excel
                  </Button>,
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={() => exportToWord([report], report.name)}
                  >
                    Word
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={<Text strong>{report.name}</Text>}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">Type: {report.type}</Text>
                      <Text type="secondary">
                        Generated: {dayjs(report.created_at).format('DD/MM/YYYY HH:mm')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} reports`
            }}
          />
        )}
      </Card>

      {/* Generate Report Modal */}
      <Modal
        title="Generate Report"
        open={isGenerateModalVisible}
        onCancel={() => {
          setIsGenerateModalVisible(false);
          reportForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={reportForm} layout="vertical" onFinish={generateReport}>
          <Form.Item name="report_type" label="Report Type" rules={[{ required: true }]}>
            <Select placeholder="Select report type">
              <Option value="attendance">Attendance Report</Option>
              <Option value="performance">Performance Report</Option>
              <Option value="tasks">Task Report</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date_range" label="Date Range" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="employee" label="Employee" initialValue="all">
            <Select placeholder="Select employee">
              <Option value="all">All Team Members</Option>
              {teamMembers.map(member => (
                <Option key={member.empid} value={member.empid}>
                  {member.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate Report
              </Button>
              <Button onClick={() => {
                setIsGenerateModalVisible(false);
                reportForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerReports;