import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Table, Button, Space, Tag,
  Modal, Form, Input, Select, DatePicker, message, Tabs,
  Descriptions, Alert, Progress, List, Avatar, Divider,
  Tooltip, Popconfirm
} from 'antd';
import {
  TeamOutlined, UserOutlined, SettingOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined,
  PlusOutlined, BarChartOutlined, DatabaseOutlined,
  MailOutlined, PhoneOutlined, CalendarOutlined
} from '@ant-design/icons';
import DatabaseService from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';
import ReportService from '../../services/reportServices';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [isEditUserModalVisible, setIsEditUserModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [userForm] = Form.useForm();
  const [editUserForm] = Form.useForm();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSystemStats(),
        fetchAllEmployees(),
        fetchDepartments(),
        fetchRecentActivities()
      ]);
    } catch (error) {
      console.error('Error initializing admin dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const employees = await DatabaseService.getEmployees();
      const pendingLeaves = await DatabaseService.getPendingLeaves();
      const departments = await DatabaseService.getDepartments();
      
      const activeEmployees = employees.filter(e => e.status === 'Active').length;
      const totalDepartments = departments.length;
      
      setSystemStats({
        totalEmployees: employees.length,
        activeEmployees,
        departments: totalDepartments,
        pendingLeaves: pendingLeaves.length,
        systemHealth: 95,
        storageUsed: 65,
        newHires: employees.filter(e => {
          const joinDate = new Date(e.created_at);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return joinDate > monthAgo;
        }).length
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const employees = await DatabaseService.getEmployees();
      setAllEmployees(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const depts = await DatabaseService.getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchRecentActivities = async () => {
    // This would typically come from an audit log table
    const activities = [
      { action: 'User Login', user: 'System', time: new Date().toISOString() },
      { action: 'Report Generated', user: 'HR Manager', time: new Date(Date.now() - 300000).toISOString() },
      { action: 'Employee Updated', user: 'Admin', time: new Date(Date.now() - 600000).toISOString() },
    ];
    setRecentActivities(activities);
  };

  const handleAddUser = async (values) => {
    try {
      // Note: In a real application, you'd create the auth user first
      // For now, we'll just create the employee record
      const employeeData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role,
        department: values.department,
        phone: values.phone,
        gender: values.gender,
        empaddress: values.address,
        status: 'Active',
        is_active: true,
        // Set default leave balances
        sickleavebalance: 14,
        fulldayleavebalance: 21,
        halfdayleavebalance: 5,
        shortleavebalance: 7,
        maternityleavebalance: 84
      };

      const result = await DatabaseService.insertData('employee', employeeData);

      if (result) {
        message.success('User created successfully!');
        setIsAddUserModalVisible(false);
        userForm.resetFields();
        fetchAllEmployees();
        fetchSystemStats();
      } else {
        message.error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      message.error('Failed to create user');
    }
  };

  const handleEditUser = async (values) => {
    try {
      const updateData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role,
        department: values.department,
        phone: values.phone,
        gender: values.gender,
        empaddress: values.address,
        status: values.status,
        is_active: values.is_active
      };

      const result = await DatabaseService.updateData(
        'employee',
        updateData,
        { empid: selectedEmployee.empid }
      );

      if (result) {
        message.success('User updated successfully!');
        setIsEditUserModalVisible(false);
        editUserForm.resetFields();
        setSelectedEmployee(null);
        fetchAllEmployees();
        fetchSystemStats();
      } else {
        message.error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      message.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (employee) => {
    try {
      const result = await DatabaseService.deleteData('employee', { empid: employee.empid });
      
      if (result) {
        message.success('User deactivated successfully!');
        fetchAllEmployees();
        fetchSystemStats();
      } else {
        message.error('Failed to deactivate user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Failed to deactivate user');
    }
  };

  const openEditUserModal = (employee) => {
    setSelectedEmployee(employee);
    editUserForm.setFieldsValue({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      phone: employee.phone,
      gender: employee.gender,
      address: employee.empaddress,
      status: employee.status,
      is_active: employee.is_active
    });
    setIsEditUserModalVisible(true);
  };

  const generateReport = async (type) => {
    try {
      switch (type) {
        case 'staff':
          await ReportService.generateStaffReport();
          break;
        case 'salary':
          await ReportService.generateSalaryReport();
          break;
        case 'attendance':
          await ReportService.generateAttendanceReport();
          break;
        default:
          message.warning('Report type not implemented');
      }
      message.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    }
  };

  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'first_name',
      key: 'employee',
      render: (text, record) => (
        <Space>
          <Avatar 
            size="small" 
            icon={<UserOutlined />} 
            src={record.avatarurl}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.first_name} {record.last_name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color="blue">{role}</Tag>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {status} {record.is_active ? '' : '(Inactive)'}
        </Tag>
      )
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'N/A'
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
              size="small"
              onClick={() => openEditUserModal(record)}
            >
              View
            </Button>
          </Tooltip>
          <Tooltip title="Edit User">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => openEditUserModal(record)}
            >
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="Deactivate User">
            <Popconfirm
              title="Are you sure to deactivate this user?"
              onConfirm={() => handleDeleteUser(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
              >
                Deactivate
              </Button>
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Card size="small" style={{ 
        marginBottom: 16, 
        background: 'linear-gradient(135deg, #f5222d 0%, #cf1322 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <SettingOutlined style={{ color: 'white', fontSize: '24px' }} />
              <h2 style={{ color: 'white', margin: 0 }}>Admin Dashboard</h2>
              <Tag color="white" style={{ color: '#f5222d', fontWeight: 'bold' }}>
                System Administrator
              </Tag>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'white' }}>
              Welcome, {profile?.first_name} {profile?.last_name}
            </Text>
          </Col>
        </Row>
      </Card>

      <Alert
        message="System Administration"
        description="Manage users, monitor system health, and configure application settings."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs defaultActiveKey="overview">
        <TabPane tab="System Overview" key="overview">
          {/* Quick Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Employees"
                  value={systemStats.totalEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Active Employees"
                  value={systemStats.activeEmployees}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Departments"
                  value={systemStats.departments}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="New Hires (30 days)"
                  value={systemStats.newHires}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="System Health" extra={<DatabaseOutlined />}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>System Performance</span>
                      <span>{systemStats.systemHealth}%</span>
                    </div>
                    <Progress percent={systemStats.systemHealth} status="active" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Storage Usage</span>
                      <span>{systemStats.storageUsed}%</span>
                    </div>
                    <Progress percent={systemStats.storageUsed} status="active" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Database Health</span>
                      <span>98%</span>
                    </div>
                    <Progress percent={98} status="active" />
                  </div>
                </Space>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Quick Actions">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card 
                      size="small" 
                      hoverable
                      onClick={() => setIsAddUserModalVisible(true)}
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                    >
                      <PlusOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: 8 }} />
                      <div>Add User</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card 
                      size="small" 
                      hoverable
                      onClick={() => generateReport('staff')}
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                    >
                      <BarChartOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: 8 }} />
                      <div>Staff Report</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card 
                      size="small" 
                      hoverable
                      onClick={() => generateReport('salary')}
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                    >
                      <BarChartOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: 8 }} />
                      <div>Salary Report</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card 
                      size="small" 
                      hoverable
                      onClick={() => generateReport('attendance')}
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                    >
                      <CalendarOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: 8 }} />
                      <div>Attendance Report</div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card title="Recent System Activities">
                <List
                  dataSource={recentActivities}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.action}
                        description={
                          <Space>
                            <span>By: {item.user}</span>
                            <span>•</span>
                            <span>{new Date(item.time).toLocaleString()}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No recent activities' }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="User Management" key="users">
          <Card
            title="All Users"
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddUserModalVisible(true)}
                >
                  Add User
                </Button>
                <Button 
                  icon={<BarChartOutlined />}
                  onClick={() => generateReport('staff')}
                >
                  Generate Report
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={allEmployees}
              columns={employeeColumns}
              loading={loading}
              rowKey="empid"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} items`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Department Management" key="departments">
          <Card title="Departments">
            <Row gutter={[16, 16]}>
              {departments.map(dept => (
                <Col xs={24} sm={12} md={8} key={dept.departmentid}>
                  <Card 
                    size="small" 
                    title={dept.departmentname}
                    extra={<Tag color="blue">{dept.employees?.length || 0} employees</Tag>}
                  >
                    {dept.manager && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>Manager:</strong> {dept.manager.first_name} {dept.manager.last_name}
                      </div>
                    )}
                    <div>
                      <strong>Created:</strong> {new Date(dept.created_at).toLocaleDateString()}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* Add User Modal */}
      <Modal
        title="Add New User"
        open={isAddUserModalVisible}
        onCancel={() => {
          setIsAddUserModalVisible(false);
          userForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={userForm} layout="vertical" onFinish={handleAddUser}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="first_name" 
                label="First Name" 
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="last_name" 
                label="Last Name" 
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="email" 
            label="Email" 
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

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
                  <Option value="hr">HR</Option>
                  <Option value="accountant">Accountant</Option>
                  <Option value="ceo">CEO</Option>
                  <Option value="admin">Admin</Option>
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
                  <Option value="IT">IT</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Operations">Operations</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="AUTOMOTIVE">AUTOMOTIVE</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="phone" 
                label="Phone" 
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
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
          </Row>

          <Form.Item name="address" label="Address">
            <TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Create User
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isEditUserModalVisible}
        onCancel={() => {
          setIsEditUserModalVisible(false);
          editUserForm.resetFields();
          setSelectedEmployee(null);
        }}
        footer={null}
        width={700}
      >
        {selectedEmployee && (
          <Form form={editUserForm} layout="vertical" onFinish={handleEditUser}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="first_name" 
                  label="First Name" 
                  rules={[{ required: true, message: 'Please enter first name' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="last_name" 
                  label="Last Name" 
                  rules={[{ required: true, message: 'Please enter last name' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="email" label="Email">
              <Input disabled />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="role" 
                  label="Role" 
                  rules={[{ required: true, message: 'Please select role' }]}
                >
                  <Select>
                    <Option value="employee">Employee</Option>
                    <Option value="manager">Manager</Option>
                    <Option value="hr">HR</Option>
                    <Option value="accountant">Accountant</Option>
                    <Option value="ceo">CEO</Option>
                    <Option value="admin">Admin</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="department" 
                  label="Department" 
                  rules={[{ required: true, message: 'Please select department' }]}
                >
                  <Select>
                    <Option value="IT">IT</Option>
                    <Option value="HR">HR</Option>
                    <Option value="Finance">Finance</Option>
                    <Option value="Operations">Operations</Option>
                    <Option value="Sales">Sales</Option>
                    <Option value="Marketing">Marketing</Option>
                    <Option value="AUTOMOTIVE">AUTOMOTIVE</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="phone" 
                  label="Phone" 
                  rules={[{ required: true, message: 'Please enter phone number' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="gender" 
                  label="Gender" 
                  rules={[{ required: true, message: 'Please select gender' }]}
                >
                  <Select>
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="address" label="Address">
              <TextArea rows={3} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="status" 
                  label="Status" 
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select>
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                    <Option value="On Leave">On Leave</Option>
                    <Option value="Suspended">Suspended</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="is_active" 
                  label="Active" 
                  valuePropName="checked"
                >
                  <Select>
                    <Option value={true}>Yes</Option>
                    <Option value={false}>No</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update User
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;