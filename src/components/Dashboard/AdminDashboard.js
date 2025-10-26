import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Table, Button, Space, Tag,
  Modal, Form, Input, Select, DatePicker, message, Tabs,
  Descriptions, Alert, Progress, List, Avatar, Divider,
  Tooltip, Popconfirm, InputNumber, Switch
} from 'antd';
import {
  TeamOutlined, UserOutlined, SettingOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined,
  PlusOutlined, BarChartOutlined, DatabaseOutlined,
  MailOutlined, PhoneOutlined, CalendarOutlined,
  DollarOutlined, PieChartOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SyncOutlined,
  RocketOutlined, FilterOutlined, DownloadOutlined, FileExcelOutlined
} from '@ant-design/icons';

import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [systemStats, setSystemStats] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  
  // Date Range State
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  
  // Modal states
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [isEditUserModalVisible, setIsEditUserModalVisible] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isEmployeeDetailVisible, setIsEmployeeDetailVisible] = useState(false);
  const [isDateRangeModalVisible, setIsDateRangeModalVisible] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Forms
  const [userForm] = Form.useForm();
  const [editUserForm] = Form.useForm();
  const [leaveForm] = Form.useForm();
  const [dateRangeForm] = Form.useForm();

  // Data states
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [salaryData, setSalaryData] = useState([]);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        await Promise.all([
          fetchSystemStats(),
          fetchAllEmployees(),
          fetchDepartments(),
          fetchRecentActivities(),
          fetchLeaveRequests(),
          fetchLoanRequests(),
          fetchAttendanceData(),
          fetchSalaryData(),
          fetchLeaveTypes(),
          fetchLoanTypes()
        ]);
      }
    } catch (error) {
      console.error('Error initializing admin dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Data fetching functions
  const fetchSystemStats = async () => {
    try {
      const { data: employees } = await supabase
        .from('employee')
        .select('*')
        .eq('is_active', true);

      const { data: pendingLeaves } = await supabase
        .from('employeeleave')
        .select('*')
        .eq('leavestatus', 'pending');

      const { data: departments } = await supabase
        .from('departments')
        .select('*');

      const { data: loans } = await supabase
        .from('loanrequest')
        .select('*')
        .eq('status', 'pending');

      const today = dayjs().format('YYYY-MM-DD');
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);

      const activeEmployees = employees?.filter(e => e.status === 'Active').length || 0;
      const totalDepartments = departments?.length || 0;
      const pendingLoans = loans?.length || 0;
      const todayAttendance = attendance || [];

      setSystemStats({
        totalEmployees: employees?.length || 0,
        activeEmployees,
        departments: totalDepartments,
        pendingLeaves: pendingLeaves?.length || 0,
        pendingLoans,
        todayPresent: todayAttendance.filter(a => a.status === 'Present').length,
        systemHealth: 95,
        storageUsed: 65,
        newHires: employees?.filter(e => {
          const joinDate = dayjs(e.created_at);
          const monthAgo = dayjs().subtract(1, 'month');
          return joinDate >= monthAgo;
        }).length || 0
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
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

  const fetchLeaveTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('leavetype')
        .select('*')
        .order('leavetype');

      if (error) throw error;
      setLeaveTypes(data || []);
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const fetchLoanTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('loantype')
        .select('*')
        .order('loantype');

      if (error) throw error;
      setLoanTypes(data || []);
    } catch (error) {
      console.error('Error fetching loan types:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

const fetchLeaveRequests = async () => {
  try {
    const startDate = dateRange[0].format('YYYY-MM-DD');
    const endDate = dateRange[1].format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('employeeleave')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Manually join employee data
    const employeeIds = [...new Set(data?.map(leave => leave.empid).filter(Boolean))];
    const leaveTypeIds = [...new Set(data?.map(leave => leave.leavetypeid).filter(Boolean))];
    
    let employeeData = [];
    let leaveTypeData = [];
    
    if (employeeIds.length > 0) {
      const { data: empData } = await supabase
        .from('employee')
        .select('empid, full_name, department')
        .in('empid', employeeIds);
      employeeData = empData || [];
    }
    
    if (leaveTypeIds.length > 0) {
      const { data: ltData } = await supabase
        .from('leavetype')
        .select('leavetypeid, leavetype')
        .in('leavetypeid', leaveTypeIds);
      leaveTypeData = ltData || [];
    }

    const employeeMap = {};
    employeeData.forEach(emp => {
      employeeMap[emp.empid] = emp;
    });

    const leaveTypeMap = {};
    leaveTypeData.forEach(lt => {
      leaveTypeMap[lt.leavetypeid] = lt;
    });

    const leavesWithDetails = data?.map(leave => ({
      ...leave,
      employee: employeeMap[leave.empid] || { full_name: 'Unknown', department: 'Unknown' },
      leavetype: leaveTypeMap[leave.leavetypeid] || { leavetype: 'Unknown' }
    }));
    
    setLeaveRequests(leavesWithDetails || []);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    setLeaveRequests([]);
  }
};

const fetchLoanRequests = async () => {
  try {
    const startDate = dateRange[0].format('YYYY-MM-DD');
    const endDate = dateRange[1].format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('loanrequest')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Manually join data
    const employeeIds = [...new Set(data?.map(loan => loan.empid).filter(Boolean))];
    const loanTypeIds = [...new Set(data?.map(loan => loan.loantypeid).filter(Boolean))];
    
    let employeeData = [];
    let loanTypeData = [];
    
    if (employeeIds.length > 0) {
      const { data: empData } = await supabase
        .from('employee')
        .select('empid, full_name, department')
        .in('empid', employeeIds);
      employeeData = empData || [];
    }
    
    if (loanTypeIds.length > 0) {
      const { data: ltData } = await supabase
        .from('loantype')
        .select('loantypeid, loantype')
        .in('loantypeid', loanTypeIds);
      loanTypeData = ltData || [];
    }

    const employeeMap = {};
    employeeData.forEach(emp => {
      employeeMap[emp.empid] = emp;
    });

    const loanTypeMap = {};
    loanTypeData.forEach(lt => {
      loanTypeMap[lt.loantypeid] = lt;
    });

    const loansWithDetails = data?.map(loan => ({
      ...loan,
      employee: employeeMap[loan.empid] || { full_name: 'Unknown', department: 'Unknown' },
      loantype: loanTypeMap[loan.loantypeid] || { loantype: 'Unknown' }
    }));
    
    setLoanRequests(loansWithDetails || []);
  } catch (error) {
    console.error('Error fetching loan requests:', error);
    setLoanRequests([]);
  }
};

  const fetchAttendanceData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Manually join employee data
      const attendanceWithEmployee = await Promise.all(
        (data || []).map(async (attendance) => {
          const { data: employeeData } = await supabase
            .from('employee')
            .select('full_name, department')
            .eq('empid', attendance.empid)
            .single();

          return {
            ...attendance,
            employee: employeeData || { full_name: 'Unknown', department: 'Unknown' }
          };
        })
      );
      
      setAttendanceData(attendanceWithEmployee);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchSalaryData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('salary')
        .select('*')
        .gte('salarydate', startDate)
        .lte('salarydate', endDate)
        .order('salarydate', { ascending: false });

      if (error) throw error;
      
      // Manually join employee data
      const salaryWithEmployee = await Promise.all(
        (data || []).map(async (salary) => {
          const { data: employeeData } = await supabase
            .from('employee')
            .select('full_name, department')
            .eq('empid', salary.empid)
            .single();

          return {
            ...salary,
            employee: employeeData || { full_name: 'Unknown', department: 'Unknown' }
          };
        })
      );
      
      setSalaryData(salaryWithEmployee);
    } catch (error) {
      console.error('Error fetching salary data:', error);
    }
  };

  // Export Functions
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

  // Report Generation Functions
  const generateReport = async (type) => {
    try {
      message.info(`Generating ${type} report...`);
      
      let reportData = [];
      let fileName = '';

      switch (type) {
        case 'staff':
          reportData = allEmployees.map(emp => ({
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
          fileName = 'Staff_Report';
          break;

        case 'salary':
          reportData = salaryData.map(salary => ({
            'Employee': salary.employee?.full_name || 'N/A',
            'Department': salary.employee?.department || 'N/A',
            'Basic Salary': `LKR ${salary.basicsalary?.toLocaleString() || '0'}`,
            'OT Pay': `LKR ${salary.otpay?.toLocaleString() || '0'}`,
            'Bonus Pay': `LKR ${salary.bonuspay?.toLocaleString() || '0'}`,
            'Increment Pay': `LKR ${salary.incrementpay?.toLocaleString() || '0'}`,
            'Total Salary': `LKR ${salary.totalsalary?.toLocaleString() || '0'}`,
            'Salary Date': salary.salarydate
          }));
          fileName = 'Salary_Report';
          break;

        case 'attendance':
          reportData = attendanceData.map(att => ({
            'Employee': att.employee?.full_name || 'N/A',
            'Department': att.employee?.department || 'N/A',
            'Date': att.date,
            'In Time': att.intime,
            'Out Time': att.outtime,
            'Status': att.status
          }));
          fileName = 'Attendance_Report';
          break;

        case 'leave':
          reportData = leaveRequests.map(leave => ({
            'Employee': leave.employee?.full_name || 'N/A',
            'Leave Type': leave.leavetype?.leavetype || 'N/A',
            'From Date': leave.leavefromdate,
            'To Date': leave.leavetodate,
            'Duration': `${leave.duration} days`,
            'Status': leave.leavestatus,
            'Reason': leave.leavereason
          }));
          fileName = 'Leave_Report';
          break;

        default:
          message.error('Unknown report type');
          return;
      }

      exportToExcel(reportData, fileName);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error(error.message || 'Failed to generate report');
    }
  };

const handleAddUser = async (values) => {
  try {
    // Validate required fields
    if (!values.full_name || !values.email) {
      message.error('Name and email are required');
      return;
    }

    const employeeData = {
      full_name: values.full_name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role || 'employee',
      department: values.department || 'AUTOMOTIVE',
      phone: values.phone?.trim() || null,
      gender: values.gender || null,
      empaddress: values.address?.trim() || null,
      status: 'Active',
      is_active: true,
      basicsalary: parseFloat(values.basicsalary) || 0,
      created_at: new Date().toISOString()
    };

    // Validate basic salary
    if (employeeData.basicsalary < 0) {
      message.error('Basic salary cannot be negative');
      return;
    }

    const { data, error } = await supabase
      .from('employee')
      .insert([employeeData])
      .select();

    if (error) throw error;

    message.success('User created successfully!');
    setIsAddUserModalVisible(false);
    userForm.resetFields();
    fetchAllEmployees();
    fetchSystemStats();
  } catch (error) {
    console.error('Error adding user:', error);
    message.error(error.message || 'Failed to add user');
  }
};

  const handleEditUser = async (values) => {
    try {
      if (!selectedEmployee) return;

      const updates = {
        full_name: values.full_name,
        email: values.email,
        role: values.role,
        department: values.department,
        phone: values.phone,
        gender: values.gender,
        empaddress: values.address,
        status: values.status,
        is_active: values.is_active,
        basicsalary: values.basicsalary || 0,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('employee')
        .update(updates)
        .eq('empid', selectedEmployee.empid);

      if (error) throw error;

      message.success('User updated successfully!');
      setIsEditUserModalVisible(false);
      setSelectedEmployee(null);
      fetchAllEmployees();
    } catch (error) {
      console.error('Error updating user:', error);
      message.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (employee) => {
    try {
      const { error } = await supabase
        .from('employee')
        .update({ is_active: false, status: 'Inactive' })
        .eq('empid', employee.empid);

      if (error) throw error;

      message.success('User deactivated successfully!');
      fetchAllEmployees();
      fetchSystemStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error(error.message || 'Failed to delete user');
    }
  };

  const handleApplyLeaveForUser = async (values) => {
    try {
      const leaveData = {
        empid: values.empid,
        leavetypeid: values.leavetypeid,
        leavefromdate: values.leavefromdate.format('YYYY-MM-DD'),
        leavetodate: values.leavetodate.format('YYYY-MM-DD'),
        leavereason: values.leavereason,
        leavestatus: 'approved',
        approvedby: user?.id,
        duration: values.leavetodate.diff(values.leavefromdate, 'day') + 1,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('employeeleave')
        .insert([leaveData]);

      if (error) throw error;

      message.success('Leave applied successfully!');
      setIsLeaveModalVisible(false);
      leaveForm.resetFields();
      fetchLeaveRequests();
      fetchSystemStats();
    } catch (error) {
      console.error('Error applying leave:', error);
      message.error('Failed to apply leave');
    }
  };

  const handleUpdateDateRange = async (values) => {
    try {
      const { dateRange: newDateRange } = values;
      setDateRange(newDateRange);
      setIsDateRangeModalVisible(false);
      dateRangeForm.resetFields();
      
      message.info('Updating data for new date range...');
      
      await Promise.all([
        fetchRecentActivities(),
        fetchLeaveRequests(),
        fetchLoanRequests(),
        fetchAttendanceData(),
        fetchSalaryData()
      ]);
      
      message.success('Data updated for selected date range!');
    } catch (error) {
      console.error('Error updating date range:', error);
      message.error('Failed to update date range');
    }
  };

  const handleViewEmployeeDetails = async (employee) => {
    try {
      setSelectedEmployee(employee);
      setIsEmployeeDetailVisible(true);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      message.error('Failed to load employee details');
    }
  };

  // Table columns
  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department) => <Tag color="blue">{department}</Tag>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color={role === 'admin' ? 'red' : 'green'}>{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status === 'Active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {status}
        </Tag>
      ),
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (salary) => `LKR ${salary?.toLocaleString() || '0'}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewEmployeeDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => {
                setSelectedEmployee(record);
                editUserForm.setFieldsValue({
                  full_name: record.full_name,
                  email: record.email,
                  role: record.role,
                  department: record.department,
                  phone: record.phone,
                  gender: record.gender,
                  address: record.empaddress,
                  status: record.status,
                  is_active: record.is_active,
                  basicsalary: record.basicsalary
                });
                setIsEditUserModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure to deactivate this user?"
            onConfirm={() => handleDeleteUser(record)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Deactivate">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const leaveColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee_name',
    },
    {
      title: 'Leave Type',
      dataIndex: ['leavetype', 'leavetype'],
      key: 'leavetype',
    },
    {
      title: 'From Date',
      dataIndex: 'leavefromdate',
      key: 'leavefromdate',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'To Date',
      dataIndex: 'leavetodate',
      key: 'leavetodate',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} days`,
    },
    {
      title: 'Status',
      dataIndex: 'leavestatus',
      key: 'leavestatus',
      render: (status) => {
        const statusColors = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red'
        };
        return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Reason',
      dataIndex: 'leavereason',
      key: 'leavereason',
      ellipsis: true,
    },
  ];

  const loanColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee_name',
    },
    {
      title: 'Loan Type',
      dataIndex: ['loantype', 'loantype'],
      key: 'loantype',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `LKR ${amount?.toLocaleString() || '0'}`,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} months`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red'
        };
        return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Applied Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
  ];

  // Render components
  const renderOverview = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Employees"
            value={systemStats.totalEmployees || 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Employees"
            value={systemStats.activeEmployees || 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Departments"
            value={systemStats.departments || 0}
            prefix={<DatabaseOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Pending Leaves"
            value={systemStats.pendingLeaves || 0}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Pending Loans"
            value={systemStats.pendingLoans || 0}
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#fa541c' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Today Present"
            value={systemStats.todayPresent || 0}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#13c2c2' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="System Health"
            value={systemStats.systemHealth || 0}
            suffix="%"
            prefix={<PieChartOutlined />}
            valueStyle={{ color: '#eb2f96' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="New Hires (30d)"
            value={systemStats.newHires || 0}
            prefix={<RocketOutlined />}
            valueStyle={{ color: '#a0d911' }}
          />
        </Card>
      </Col>

      {/* Recent Activities */}
      <Col span={24}>
        <Card 
          title="Recent Activities" 
          extra={
            <Button 
              type="link" 
              icon={<FilterOutlined />}
              onClick={() => setIsDateRangeModalVisible(true)}
            >
              Date Range
            </Button>
          }
        >
          <List
            dataSource={recentActivities}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<SettingOutlined />} />}
                  title={item.action}
                  description={
                    <Space direction="vertical" size={0}>
                      <div>Table: {item.table_name}</div>
                      <div>Time: {dayjs(item.created_at).format('MMM D, YYYY HH:mm')}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        IP: {item.ip_address}
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderEmployeeManagement = () => (
    <Card
      title="Employee Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsAddUserModalVisible(true)}
          >
            Add Employee
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('staff')}
          >
            Export Staff
          </Button>
        </Space>
      }
    >
      <Table
        columns={employeeColumns}
        dataSource={allEmployees}
        rowKey="empid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const renderLeaveManagement = () => (
    <Card
      title="Leave Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsLeaveModalVisible(true)}
          >
            Apply Leave
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('leave')}
          >
            Export Report
          </Button>
        </Space>
      }
    >
      <Table
        columns={leaveColumns}
        dataSource={leaveRequests}
        rowKey="leaveid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const renderLoanManagement = () => (
    <Card
      title="Loan Management"
      extra={
        <Space>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('financial')}
          >
            Export Report
          </Button>
        </Space>
      }
    >
      <Table
        columns={loanColumns}
        dataSource={loanRequests}
        rowKey="loanrequestid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const renderAttendanceManagement = () => (
    <Card
      title="Attendance Management"
      extra={
        <Button 
          icon={<FileExcelOutlined />}
          onClick={() => generateReport('attendance')}
        >
          Export Report
        </Button>
      }
    >
      <Table
        columns={[
          {
            title: 'Employee',
            dataIndex: ['employee', 'full_name'],
            key: 'employee_name',
          },
          {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format('MMM D, YYYY'),
          },
          {
            title: 'In Time',
            dataIndex: 'intime',
            key: 'intime',
          },
          {
            title: 'Out Time',
            dataIndex: 'outtime',
            key: 'outtime',
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={status === 'Present' ? 'green' : 'red'}>{status}</Tag>,
          },
        ]}
        dataSource={attendanceData}
        rowKey="attendanceid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const renderSalaryManagement = () => (
    <Card
      title="Salary Management"
      extra={
        <Button 
          icon={<FileExcelOutlined />}
          onClick={() => generateReport('salary')}
        >
          Export Report
        </Button>
      }
    >
      <Table
        columns={[
          {
            title: 'Employee',
            dataIndex: ['employee', 'full_name'],
            key: 'employee_name',
          },
          {
            title: 'Basic Salary',
            dataIndex: 'basicsalary',
            key: 'basicsalary',
            render: (salary) => `LKR ${salary?.toLocaleString() || '0'}`,
          },
          {
            title: 'OT Pay',
            dataIndex: 'otpay',
            key: 'otpay',
            render: (pay) => `LKR ${pay?.toLocaleString() || '0'}`,
          },
          {
            title: 'Bonus Pay',
            dataIndex: 'bonuspay',
            key: 'bonuspay',
            render: (pay) => `LKR ${pay?.toLocaleString() || '0'}`,
          },
          {
            title: 'Total Salary',
            dataIndex: 'totalsalary',
            key: 'totalsalary',
            render: (salary) => `LKR ${salary?.toLocaleString() || '0'}`,
          },
          {
            title: 'Salary Date',
            dataIndex: 'salarydate',
            key: 'salarydate',
            render: (date) => dayjs(date).format('MMM D, YYYY'),
          },
        ]}
        dataSource={salaryData}
        rowKey="salaryid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  // Modal forms
  const renderAddUserModal = () => (
    <Modal
      title="Add New Employee"
      open={isAddUserModalVisible}
      onCancel={() => {
        setIsAddUserModalVisible(false);
        userForm.resetFields();
      }}
      onOk={() => userForm.submit()}
      width={600}
    >
      <Form form={userForm} layout="vertical" onFinish={handleAddUser}>
        <Form.Item
          name="full_name"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter full name' }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter valid email' }
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select role' }]}
            >
              <Select placeholder="Select role">
                <Option value="employee">Employee</Option>
                <Option value="manager">Manager</Option>
                <Option value="admin">Admin</Option>
                <Option value="hr">HR</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Please select department' }]}
            >
              <Select placeholder="Select department">
                {departments.map(dept => (
                  <Option key={dept.departmentid} value={dept.departmentname}>
                    {dept.departmentname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Please select gender' }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="basicsalary"
              label="Basic Salary"
              rules={[{ required: true, message: 'Please enter basic salary' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter basic salary"
                min={0}
                formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/LKR\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Please enter address' }]}
        >
          <TextArea placeholder="Enter address" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderEditUserModal = () => (
    <Modal
      title="Edit Employee"
      open={isEditUserModalVisible}
      onCancel={() => {
        setIsEditUserModalVisible(false);
        setSelectedEmployee(null);
        editUserForm.resetFields();
      }}
      onOk={() => editUserForm.submit()}
      width={600}
    >
      <Form form={editUserForm} layout="vertical" onFinish={handleEditUser}>
        <Form.Item
          name="full_name"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter full name' }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter valid email' }
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select role' }]}
            >
              <Select placeholder="Select role">
                <Option value="employee">Employee</Option>
                <Option value="manager">Manager</Option>
                <Option value="admin">Admin</Option>
                <Option value="hr">HR</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Please select department' }]}
            >
              <Select placeholder="Select department">
                {departments.map(dept => (
                  <Option key={dept.departmentid} value={dept.departmentname}>
                    {dept.departmentname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Please select gender' }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="basicsalary"
              label="Basic Salary"
              rules={[{ required: true, message: 'Please enter basic salary' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter basic salary"
                min={0}
                formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/LKR\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="is_active"
              label="Active Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Please enter address' }]}
        >
          <TextArea placeholder="Enter address" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderLeaveModal = () => (
    <Modal
      title="Apply Leave"
      open={isLeaveModalVisible}
      onCancel={() => {
        setIsLeaveModalVisible(false);
        leaveForm.resetFields();
      }}
      onOk={() => leaveForm.submit()}
      width={600}
    >
      <Form form={leaveForm} layout="vertical" onFinish={handleApplyLeaveForUser}>
        <Form.Item
          name="empid"
          label="Employee"
          rules={[{ required: true, message: 'Please select employee' }]}
        >
          <Select placeholder="Select employee" showSearch optionFilterProp="children">
            {allEmployees.filter(emp => emp.is_active).map(emp => (
              <Option key={emp.empid} value={emp.empid}>
                {emp.full_name} - {emp.department}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="leavetypeid"
          label="Leave Type"
          rules={[{ required: true, message: 'Please select leave type' }]}
        >
          <Select placeholder="Select leave type">
            {leaveTypes.map(type => (
              <Option key={type.leavetypeid} value={type.leavetypeid}>
                {type.leavetype} (Max: {type.max_days} days)
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="leavefromdate"
              label="From Date"
              rules={[{ required: true, message: 'Please select from date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="leavetodate"
              label="To Date"
              rules={[{ required: true, message: 'Please select to date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="leavereason"
          label="Reason"
          rules={[{ required: true, message: 'Please enter reason' }]}
        >
          <TextArea placeholder="Enter leave reason" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderDateRangeModal = () => (
    <Modal
      title="Select Date Range"
      open={isDateRangeModalVisible}
      onCancel={() => {
        setIsDateRangeModalVisible(false);
        dateRangeForm.resetFields();
      }}
      onOk={() => dateRangeForm.submit()}
    >
      <Form form={dateRangeForm} layout="vertical" onFinish={handleUpdateDateRange}>
        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Please select date range' }]}
          initialValue={dateRange}
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderEmployeeDetailDrawer = () => (
    <Modal
      title="Employee Details"
      open={isEmployeeDetailVisible}
      onCancel={() => {
        setIsEmployeeDetailVisible(false);
        setSelectedEmployee(null);
      }}
      footer={null}
      width={600}
    >
      {selectedEmployee && (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Full Name">
            {selectedEmployee.full_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {selectedEmployee.email}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {selectedEmployee.phone}
          </Descriptions.Item>
          <Descriptions.Item label="Role">
            <Tag color="blue">{selectedEmployee.role}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {selectedEmployee.department}
          </Descriptions.Item>
          <Descriptions.Item label="Gender">
            {selectedEmployee.gender}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={selectedEmployee.status === 'Active' ? 'green' : 'red'}>
              {selectedEmployee.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Basic Salary">
            LKR {selectedEmployee.basicsalary?.toLocaleString() || '0'}
          </Descriptions.Item>
          <Descriptions.Item label="Address">
            {selectedEmployee.empaddress}
          </Descriptions.Item>
          <Descriptions.Item label="Join Date">
            {dayjs(selectedEmployee.created_at).format('MMM D, YYYY')}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
          Admin Dashboard
        </h1>
        <p style={{ margin: 0, color: '#666' }}>
          Welcome back! Manage your HR system efficiently.
        </p>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <BarChartOutlined />
                  Overview
                </span>
              ),
              children: renderOverview(),
            },
            {
              key: 'employees',
              label: (
                <span>
                  <TeamOutlined />
                  Employee Management
                </span>
              ),
              children: renderEmployeeManagement(),
            },
            {
              key: 'leave',
              label: (
                <span>
                  <CalendarOutlined />
                  Leave Management
                </span>
              ),
              children: renderLeaveManagement(),
            },
            {
              key: 'loans',
              label: (
                <span>
                  <DollarOutlined />
                  Loan Management
                </span>
              ),
              children: renderLoanManagement(),
            },
            {
              key: 'attendance',
              label: (
                <span>
                  <FileTextOutlined />
                  Attendance
                </span>
              ),
              children: renderAttendanceManagement(),
            },
            {
              key: 'salary',
              label: (
                <span>
                  <DollarOutlined />
                  Salary Management
                </span>
              ),
              children: renderSalaryManagement(),
            },
          ]}
        />
      </Card>

      {/* Modals */}
      {renderAddUserModal()}
      {renderEditUserModal()}
      {renderLeaveModal()}
      {renderDateRangeModal()}
      {renderEmployeeDetailDrawer()}
    </div>
  );
};

export default AdminDashboard;