import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Statistic, Row, Col,
  Progress, List, Avatar, Tag, DatePicker, Form,
  Select, message, Modal, Input
} from 'antd';
import {
  FileExcelOutlined, DownloadOutlined, BarChartOutlined,
  PieChartOutlined, TeamOutlined, DollarOutlined,
  CalendarOutlined, UserOutlined, RocketOutlined,
  EyeOutlined, FilterOutlined
} from '@ant-design/icons';

import { supabase } from '../../../services/supabase';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminReport = ({ dateRange }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [financialReports, setFinancialReports] = useState([]);
  const [hrReports, setHrReports] = useState([]);
  const [isCustomReportModalVisible, setIsCustomReportModalVisible] = useState(false);
  const [customReportForm] = Form.useForm();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAllEmployees(),
        fetchDepartments(),
        fetchFinancialReports(),
        fetchHrReports(),
        generateDashboardStats()
      ]);
    } catch (error) {
      console.error('Error fetching report data:', error);
      message.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setAllEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('departmentname');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchFinancialReports = async () => {
    try {
      const { data, error } = await supabase
        .from('financialreports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFinancialReports(data || []);
    } catch (error) {
      console.error('Error fetching financial reports:', error);
    }
  };

  const fetchHrReports = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHrReports(data || []);
    } catch (error) {
      console.error('Error fetching HR reports:', error);
    }
  };

  const generateDashboardStats = async () => {
    try {
      // Fetch various data for comprehensive reporting
      const [
        { data: employees },
        { data: leaveRequests },
        { data: loanRequests },
        { data: salaryData },
        { data: attendanceData }
      ] = await Promise.all([
        supabase.from('employee').select('*').eq('is_active', true),
        supabase.from('employeeleave').select('*').gte('created_at', dateRange[0].format('YYYY-MM-DD')).lte('created_at', dateRange[1].format('YYYY-MM-DD')),
        supabase.from('loanrequest').select('*').gte('created_at', dateRange[0].format('YYYY-MM-DD')).lte('created_at', dateRange[1].format('YYYY-MM-DD')),
        supabase.from('salary').select('*').gte('salarydate', dateRange[0].format('YYYY-MM-DD')).lte('salarydate', dateRange[1].format('YYYY-MM-DD')),
        supabase.from('attendance').select('*').gte('date', dateRange[0].format('YYYY-MM-DD')).lte('date', dateRange[1].format('YYYY-MM-DD'))
      ]);

      const stats = {
        totalEmployees: employees?.length || 0,
        activeEmployees: employees?.filter(e => e.status === 'Active').length || 0,
        departments: departments.length,
        pendingLeaves: leaveRequests?.filter(l => l.leavestatus === 'pending').length || 0,
        approvedLeaves: leaveRequests?.filter(l => l.leavestatus === 'approved').length || 0,
        pendingLoans: loanRequests?.filter(l => l.status === 'pending').length || 0,
        totalSalary: salaryData?.reduce((sum, s) => sum + (s.totalsalary || 0), 0) || 0,
        avgAttendance: attendanceData?.filter(a => a.status === 'Present').length / (attendanceData?.length || 1) * 100 || 0,
        newHires: employees?.filter(e => {
          const joinDate = dayjs(e.created_at);
          const monthAgo = dayjs().subtract(1, 'month');
          return joinDate >= monthAgo;
        }).length || 0
      };

      setReportData(stats);
    } catch (error) {
      console.error('Error generating dashboard stats:', error);
    }
  };

  const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${fileName}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
      message.success(`${fileName} exported successfully!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export to Excel');
    }
  };

  const generateComprehensiveReport = async () => {
    try {
      message.info('Generating comprehensive report...');

      // Employee Report
      const employeeReport = allEmployees.map(emp => ({
        'Employee ID': emp.empid,
        'Full Name': emp.full_name,
        'Email': emp.email,
        'Phone': emp.phone,
        'Role': emp.role,
        'Department': emp.department,
        'Gender': emp.gender,
        'Status': emp.status,
        'Basic Salary': `LKR ${emp.basicsalary?.toLocaleString() || '0'}`,
        'Join Date': dayjs(emp.created_at).format('MMM D, YYYY'),
        'Address': emp.empaddress
      }));

      // Department Summary
      const departmentSummary = departments.map(dept => {
        const deptEmployees = allEmployees.filter(emp => emp.department === dept.departmentname);
        const activeEmployees = deptEmployees.filter(emp => emp.status === 'Active');
        const totalSalary = deptEmployees.reduce((sum, emp) => sum + (emp.basicsalary || 0), 0);
        
        return {
          'Department': dept.departmentname,
          'Total Employees': deptEmployees.length,
          'Active Employees': activeEmployees.length,
          'Total Salary Budget': `LKR ${totalSalary.toLocaleString()}`,
          'Average Salary': `LKR ${(totalSalary / (deptEmployees.length || 1)).toLocaleString()}`,
          'Description': dept.description
        };
      });

      // Financial Summary
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data: salaryData } = await supabase
        .from('salary')
        .select('*')
        .gte('salarydate', startDate)
        .lte('salarydate', endDate);

      const financialSummary = [{
        'Report Period': `${startDate} to ${endDate}`,
        'Total Salary Paid': `LKR ${salaryData?.reduce((sum, s) => sum + (s.totalsalary || 0), 0).toLocaleString() || '0'}`,
        'Number of Salary Records': salaryData?.length || 0,
        'Average Salary': `LKR ${(salaryData?.reduce((sum, s) => sum + (s.totalsalary || 0), 0) / (salaryData?.length || 1)).toLocaleString() || '0'}`,
        'Generated Date': dayjs().format('MMM D, YYYY HH:mm')
      }];

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(workbook, 
        XLSX.utils.json_to_sheet(employeeReport), 
        'Employee_Report'
      );
      
      XLSX.utils.book_append_sheet(workbook, 
        XLSX.utils.json_to_sheet(departmentSummary), 
        'Department_Summary'
      );
      
      XLSX.utils.book_append_sheet(workbook, 
        XLSX.utils.json_to_sheet(financialSummary), 
        'Financial_Summary'
      );

      XLSX.writeFile(workbook, `Comprehensive_Report_${dayjs().format('YYYY-MM-DD')}.xlsx`);
      message.success('Comprehensive report exported successfully!');
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      message.error('Failed to generate comprehensive report');
    }
  };

  const generateDepartmentReport = async (department) => {
    try {
      message.info(`Generating ${department} department report...`);

      const deptEmployees = allEmployees.filter(emp => emp.department === department);
      const { data: deptAttendance } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', dateRange[0].format('YYYY-MM-DD'))
        .lte('date', dateRange[1].format('YYYY-MM-DD'));

      const { data: deptLeaves } = await supabase
        .from('employeeleave')
        .select('*')
        .gte('created_at', dateRange[0].format('YYYY-MM-DD'))
        .lte('created_at', dateRange[1].format('YYYY-MM-DD'));

      const reportData = deptEmployees.map(emp => {
        const empAttendance = deptAttendance?.filter(a => a.empid === emp.empid) || [];
        const empLeaves = deptLeaves?.filter(l => l.empid === emp.empid) || [];
        
        return {
          'Employee ID': emp.empid,
          'Full Name': emp.full_name,
          'Email': emp.email,
          'Role': emp.role,
          'Status': emp.status,
          'Basic Salary': `LKR ${emp.basicsalary?.toLocaleString() || '0'}`,
          'Attendance Days': empAttendance.length,
          'Present Days': empAttendance.filter(a => a.status === 'Present').length,
          'Leave Days': empLeaves.filter(l => l.leavestatus === 'approved').reduce((sum, l) => sum + (l.duration || 0), 0),
          'Join Date': dayjs(emp.created_at).format('MMM D, YYYY')
        };
      });

      exportToExcel(reportData, `${department}_Department_Report`);
    } catch (error) {
      console.error('Error generating department report:', error);
      message.error('Failed to generate department report');
    }
  };

  const handleCustomReport = async (values) => {
    try {
      const { reportType, department, startDate, endDate } = values;
      
      message.info(`Generating custom ${reportType} report...`);

      let reportData = [];
      let fileName = '';

      switch (reportType) {
        case 'employee':
          let filteredEmployees = allEmployees;
          if (department && department !== 'all') {
            filteredEmployees = allEmployees.filter(emp => emp.department === department);
          }
          
          reportData = filteredEmployees.map(emp => ({
            'Employee ID': emp.empid,
            'Full Name': emp.full_name,
            'Email': emp.email,
            'Phone': emp.phone,
            'Role': emp.role,
            'Department': emp.department,
            'Status': emp.status,
            'Basic Salary': `LKR ${emp.basicsalary?.toLocaleString() || '0'}`,
            'Join Date': dayjs(emp.created_at).format('MMM D, YYYY')
          }));
          fileName = `Employee_Report_${department || 'All'}`;
          break;

        case 'attendance':
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('*, employee(full_name, department)')
            .gte('date', startDate.format('YYYY-MM-DD'))
            .lte('date', endDate.format('YYYY-MM-DD'));

          reportData = attendanceData?.map(att => ({
            'Employee': att.employee?.full_name || 'N/A',
            'Department': att.employee?.department || 'N/A',
            'Date': att.date,
            'In Time': att.intime,
            'Out Time': att.outtime,
            'Status': att.status
          })) || [];
          fileName = `Attendance_Report_${startDate.format('YYYY-MM-DD')}_to_${endDate.format('YYYY-MM-DD')}`;
          break;

        case 'financial':
          const { data: financialData } = await supabase
            .from('salary')
            .select('*, employee(full_name, department)')
            .gte('salarydate', startDate.format('YYYY-MM-DD'))
            .lte('salarydate', endDate.format('YYYY-MM-DD'));

          reportData = financialData?.map(salary => ({
            'Employee': salary.employee?.full_name || 'N/A',
            'Department': salary.employee?.department || 'N/A',
            'Basic Salary': `LKR ${salary.basicsalary?.toLocaleString() || '0'}`,
            'OT Pay': `LKR ${salary.otpay?.toLocaleString() || '0'}`,
            'Bonus Pay': `LKR ${salary.bonuspay?.toLocaleString() || '0'}`,
            'Total Salary': `LKR ${salary.totalsalary?.toLocaleString() || '0'}`,
            'Salary Date': salary.salarydate
          })) || [];
          fileName = `Financial_Report_${startDate.format('YYYY-MM-DD')}_to_${endDate.format('YYYY-MM-DD')}`;
          break;

        default:
          message.error('Unknown report type');
          return;
      }

      exportToExcel(reportData, fileName);
      setIsCustomReportModalVisible(false);
      customReportForm.resetFields();
    } catch (error) {
      console.error('Error generating custom report:', error);
      message.error('Failed to generate custom report');
    }
  };

  const renderDashboardStats = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Employees"
            value={reportData.totalEmployees || 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Employees"
            value={reportData.activeEmployees || 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Departments"
            value={reportData.departments || 0}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="New Hires (30d)"
            value={reportData.newHires || 0}
            prefix={<RocketOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Salary"
            value={reportData.totalSalary ? `LKR ${(reportData.totalSalary / 1000).toFixed(0)}K` : 'LKR 0'}
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#fa541c' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Pending Leaves"
            value={reportData.pendingLeaves || 0}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#13c2c2' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <div>
            <div style={{ marginBottom: 8, color: '#666' }}>Attendance Rate</div>
            <Progress 
              percent={Math.round(reportData.avgAttendance || 0)} 
              status="active" 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Pending Loans"
            value={reportData.pendingLoans || 0}
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#eb2f96' }}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderQuickReports = () => (
    <Card title="Quick Reports" style={{ marginTop: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card 
            size="small" 
            actions={[
              <Button 
                type="link" 
                icon={<DownloadOutlined />}
                onClick={() => generateComprehensiveReport()}
              >
                Generate
              </Button>
            ]}
          >
            <Card.Meta
              avatar={<Avatar icon={<FileExcelOutlined />} style={{ backgroundColor: '#52c41a' }} />}
              title="Comprehensive Report"
              description="Complete HR system report with all data"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card 
            size="small" 
            actions={[
              <Button 
                type="link" 
                icon={<EyeOutlined />}
                onClick={() => setIsCustomReportModalVisible(true)}
              >
                Configure
              </Button>
            ]}
          >
            <Card.Meta
              avatar={<Avatar icon={<FilterOutlined />} style={{ backgroundColor: '#1890ff' }} />}
              title="Custom Report"
              description="Generate customized reports with filters"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card 
            size="small" 
            actions={[
              <Button 
                type="link" 
                icon={<DownloadOutlined />}
                onClick={() => exportToExcel(
                  allEmployees.map(emp => ({
                    'Employee ID': emp.empid,
                    'Full Name': emp.full_name,
                    'Email': emp.email,
                    'Department': emp.department,
                    'Status': emp.status
                  })),
                  'Employee_Directory'
                )}
              >
                Export
              </Button>
            ]}
          >
            <Card.Meta
              avatar={<Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#722ed1' }} />}
              title="Employee Directory"
              description="Complete list of all employees"
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 16 }}>
        <h4>Department Reports</h4>
        <Space wrap>
          {departments.map(dept => (
            <Button
              key={dept.departmentid}
              icon={<FileExcelOutlined />}
              onClick={() => generateDepartmentReport(dept.departmentname)}
            >
              {dept.departmentname}
            </Button>
          ))}
        </Space>
      </div>
    </Card>
  );

  const renderReportHistory = () => (
    <Card title="Report History" style={{ marginTop: 16 }}>
      <Tabs defaultActiveKey="financial">
        <TabPane tab="Financial Reports" key="financial">
          <List
            dataSource={financialReports}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button type="link" icon={<DownloadOutlined />}>Download</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<DollarOutlined />} />}
                  title={`Quarterly Report - ${dayjs(item.quarterenddate).format('MMM YYYY')}`}
                  description={
                    <Space direction="vertical" size={0}>
                      <div>Total Revenue: LKR {item.totalrevenue?.toLocaleString() || '0'}</div>
                      <div>Net Profit: LKR {item.netprofit?.toLocaleString() || '0'}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        Generated: {dayjs(item.created_at).format('MMM D, YYYY HH:mm')}
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab="HR Reports" key="hr">
          <List
            dataSource={hrReports}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button type="link" icon={<DownloadOutlined />}>Download</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<TeamOutlined />} />}
                  title={item.report_name}
                  description={
                    <Space direction="vertical" size={0}>
                      <div>Type: {item.report_type}</div>
                      <div>Status: <Tag color="green">{item.status}</Tag></div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        Generated: {dayjs(item.created_at).format('MMM D, YYYY HH:mm')}
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </Card>
  );

  const renderCustomReportModal = () => (
    <Modal
      title="Generate Custom Report"
      open={isCustomReportModalVisible}
      onCancel={() => {
        setIsCustomReportModalVisible(false);
        customReportForm.resetFields();
      }}
      onOk={() => customReportForm.submit()}
      width={600}
    >
      <Form form={customReportForm} layout="vertical" onFinish={handleCustomReport}>
        <Form.Item
          name="reportType"
          label="Report Type"
          rules={[{ required: true, message: 'Please select report type' }]}
        >
          <Select placeholder="Select report type">
            <Option value="employee">Employee Report</Option>
            <Option value="attendance">Attendance Report</Option>
            <Option value="financial">Financial Report</Option>
            <Option value="leave">Leave Report</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="department"
          label="Department (Optional)"
        >
          <Select placeholder="Select department" allowClear>
            <Option value="all">All Departments</Option>
            {departments.map(dept => (
              <Option key={dept.departmentid} value={dept.departmentname}>
                {dept.departmentname}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Please select date range' }]}
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="filters"
          label="Additional Filters (Optional)"
        >
          <Input.TextArea 
            placeholder="Enter any additional filter criteria..."
            rows={3}
          />
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div>
      {renderDashboardStats()}
      {renderQuickReports()}
      {renderReportHistory()}
      {renderCustomReportModal()}
    </div>
  );
};

export default AdminReport;