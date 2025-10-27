import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input,
  Select, InputNumber, Switch, Tooltip, Popconfirm, Avatar,
  Descriptions, Tabs, message
} from 'antd';
import {
  UserOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined,
  MailOutlined, PhoneOutlined, CalendarOutlined,
  FileExcelOutlined, TeamOutlined
} from '@ant-design/icons';

import { supabase } from '../../../services/supabase';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const AdminEmployee = ({ dateRange }) => {
  const [loading, setLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  
  // Modal states
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [isEditUserModalVisible, setIsEditUserModalVisible] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isEmployeeDetailVisible, setIsEmployeeDetailVisible] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeEmployeeTab, setActiveEmployeeTab] = useState('employees');
  
  // Forms
  const [userForm] = Form.useForm();
  const [editUserForm] = Form.useForm();
  const [leaveForm] = Form.useForm();

  useEffect(() => {
    fetchEmployeeData();
  }, [dateRange]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAllEmployees(),
        fetchDepartments(),
        fetchLeaveRequests(),
        fetchAttendanceData()
      ]);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      message.error('Failed to load employee data');
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
      
      const employeeIds = [...new Set(data?.map(leave => leave.empid).filter(Boolean))];
      
      let employeeData = [];
      if (employeeIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name, department')
          .in('empid', employeeIds);
        employeeData = empData || [];
      }

      const employeeMap = {};
      employeeData.forEach(emp => {
        employeeMap[emp.empid] = emp;
      });

      const leavesWithDetails = data?.map(leave => ({
        ...leave,
        employee: employeeMap[leave.empid] || { full_name: 'Unknown', department: 'Unknown' }
      }));
      
      setLeaveRequests(leavesWithDetails || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setLeaveRequests([]);
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
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error(error.message || 'Failed to delete user');
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

  const attendanceColumns = [
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
  ];

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
        loading={loading}
      />
    </Card>
  );

  const renderLeaveManagement = () => (
    <Card
      title="Leave Management"
      extra={
        <Button 
          icon={<FileExcelOutlined />}
          onClick={() => generateReport('leave')}
        >
          Export Report
        </Button>
      }
    >
      <Table
        columns={leaveColumns}
        dataSource={leaveRequests}
        rowKey="leaveid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
        loading={loading}
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
        columns={attendanceColumns}
        dataSource={attendanceData}
        rowKey="attendanceid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
        loading={loading}
      />
    </Card>
  );

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
    <div>
      <Card>
        <Tabs
          activeKey={activeEmployeeTab}
          onChange={setActiveEmployeeTab}
          items={[
            {
              key: 'employees',
              label: (
                <span>
                  <TeamOutlined />
                  Employees
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
              key: 'attendance',
              label: (
                <span>
                  <UserOutlined />
                  Attendance
                </span>
              ),
              children: renderAttendanceManagement(),
            },
          ]}
        />
      </Card>

      {/* Modals */}
      {renderAddUserModal()}
      {renderEditUserModal()}
      {renderEmployeeDetailDrawer()}
    </div>
  );
};

export default AdminEmployee;