import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Typography, Tag, Button, Space, Avatar,
  Progress, Badge, Tooltip, Input, Modal, Form, Select, InputNumber,
  DatePicker, Switch, message, Popconfirm, Upload
} from 'antd';
import {
  SearchOutlined, UserAddOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, RiseOutlined, StarOutlined, UserDeleteOutlined,
  DownloadOutlined, UploadOutlined, FilterOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const HREmployee = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPromoteModalVisible, setIsPromoteModalVisible] = useState(false);
  const [isKpiModalVisible, setIsKpiModalVisible] = useState(false);
  
  const [employeeForm] = Form.useForm();
  const [editEmployeeForm] = Form.useForm();
  const [promoteEmployeeForm] = Form.useForm();
  const [kpiForm] = Form.useForm();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees, departmentFilter, statusFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    setFilteredEmployees(filtered);
  };

  const handleAddEmployee = async (values) => {
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employee')
        .insert([{
          full_name: values.full_name,
          email: values.email,
          role: values.role,
          department: values.department,
          phone: values.phone,
          gender: values.gender,
          dob: values.dob?.format('YYYY-MM-DD'),
          empaddress: values.address,
          status: 'Active',
          is_active: true,
          basicsalary: values.basicsalary || 0,
          created_at: new Date().toISOString()
        }])
        .select();

      if (employeeError) throw employeeError;

      await supabase
        .from('position_history')
        .insert([{
          empid: employeeData[0].empid,
          position_title: values.role,
          department: values.department,
          start_date: new Date().toISOString().split('T')[0],
          is_current: true
        }]);

      await logHROperation('ADD_EMPLOYEE', employeeData[0].empid, {
        employeeName: values.full_name,
        role: values.role,
        department: values.department
      });

      message.success('Employee added successfully!');
      setIsAddModalVisible(false);
      employeeForm.resetFields();
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      message.error('Failed to add employee');
    }
  };

  const handleEditEmployee = async (values) => {
    try {
      const { error } = await supabase
        .from('employee')
        .update({
          full_name: values.full_name,
          email: values.email,
          role: values.role,
          department: values.department,
          phone: values.phone,
          gender: values.gender,
          dob: values.dob?.format('YYYY-MM-DD'),
          empaddress: values.address,
          status: values.status,
          is_active: values.is_active,
          basicsalary: values.basicsalary,
          updated_at: new Date().toISOString()
        })
        .eq('empid', values.empid);

      if (error) throw error;

      if (values.role || values.department) {
        await supabase
          .from('position_history')
          .update({ is_current: false })
          .eq('empid', values.empid)
          .eq('is_current', true);

        await supabase
          .from('position_history')
          .insert([{
            empid: values.empid,
            position_title: values.role,
            department: values.department,
            start_date: new Date().toISOString().split('T')[0],
            is_current: true
          }]);
      }

      await logHROperation('UPDATE_EMPLOYEE', values.empid, {
        updates: values
      });

      message.success('Employee updated successfully!');
      setIsEditModalVisible(false);
      editEmployeeForm.resetFields();
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      message.error('Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (employeeId, employeeName) => {
    try {
      const { error } = await supabase
        .from('employee')
        .update({
          is_active: false,
          status: 'Inactive',
          updated_at: new Date().toISOString()
        })
        .eq('empid', employeeId);

      if (error) throw error;

      await logHROperation('DELETE_EMPLOYEE', employeeId, {
        employeeName: employeeName
      });

      message.success('Employee deactivated successfully!');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      message.error('Failed to deactivate employee');
    }
  };

  const handlePromoteEmployee = async (values) => {
    try {
      if (!values.empid || !values.new_role) {
        message.error('Employee and new role are required');
        return;
      }

      const { error: updateError } = await supabase
        .from('employee')
        .update({
          role: values.new_role,
          department: values.department,
          updated_at: new Date().toISOString()
        })
        .eq('empid', values.empid);

      if (updateError) throw updateError;

      await supabase
        .from('position_history')
        .update({ is_current: false })
        .eq('empid', values.empid)
        .eq('is_current', true);

      await supabase
        .from('position_history')
        .insert([{
          empid: values.empid,
          position_title: values.new_role,
          department: values.department,
          start_date: new Date().toISOString().split('T')[0],
          is_current: true
        }]);

      const { error: promotionError } = await supabase
        .from('promotion_history')
        .insert([{
          empid: values.empid,
          previousrole: values.previous_role || 'Unknown',
          newrole: values.new_role,
          promotedby: profile?.empid,
          promotion_date: new Date().toISOString()
        }]);

      if (promotionError) {
        console.warn('Promotion history insert failed:', promotionError);
      }

      await logHROperation('PROMOTE_EMPLOYEE', values.empid, {
        previousRole: values.previous_role,
        newRole: values.new_role,
        department: values.department,
        recommendation: values.recommendation || ''
      });

      message.success('Employee promoted successfully!');
      setIsPromoteModalVisible(false);
      promoteEmployeeForm.resetFields();
      fetchEmployees();
    } catch (error) {
      console.error('Error promoting employee:', error);
      message.error('Failed to promote employee');
    }
  };

  const handleAddKPI = async (values) => {
    try {
      const kpiValue = parseFloat(values.kpivalue) || 0;

      if (kpiValue < 0 || kpiValue > 100) {
        message.error('KPI value must be between 0 and 100');
        return;
      }

      let kpirankingid = null;
      const { data: rankings } = await supabase
        .from('kpiranking')
        .select('*')
        .order('min_value', { ascending: true });

      if (rankings && rankings.length > 0) {
        const ranking = rankings.find(r =>
          kpiValue >= (r.min_value || 0) && kpiValue <= (r.max_value || 100)
        );
        kpirankingid = ranking?.kpirankingid || rankings[0].kpirankingid;
      }

      const { data, error } = await supabase
        .from('kpi')
        .insert([{
          empid: values.empid,
          kpivalue: Math.round(kpiValue),
          calculatedate: values.calculation_date.format('YYYY-MM-DD'),
          kpiyear: values.calculation_date.year(),
          kpirankingid: kpirankingid,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      await supabase
        .from('employee')
        .update({
          kpiscore: Math.round(kpiValue),
          updated_at: new Date().toISOString()
        })
        .eq('empid', values.empid);

      await logHROperation('ADD_KPI', data[0]?.kpiid, {
        employeeId: values.empid,
        kpiValue: Math.round(kpiValue),
        ranking: kpirankingid
      });

      message.success('KPI added successfully!');
      setIsKpiModalVisible(false);
      kpiForm.resetFields();
      fetchEmployees();
    } catch (error) {
      console.error('Error adding KPI:', error);
      message.error('Failed to add KPI');
    }
  };

  const logHROperation = async (operation, recordId, details) => {
    try {
      await supabase
        .from('hr_operations')
        .insert([{
          operation,
          record_id: recordId,
          hr_id: profile.empid,
          target_employee_id: details.employeeId || recordId,
          details,
          operation_time: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging HR operation:', error);
    }
  };

  const exportToExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const openEditEmployeeModal = (employee) => {
    editEmployeeForm.setFieldsValue({
      empid: employee.empid,
      full_name: employee.full_name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      phone: employee.phone,
      gender: employee.gender,
      dob: employee.dob ? dayjs(employee.dob) : null,
      address: employee.empaddress,
      status: employee.status,
      is_active: employee.is_active,
      basicsalary: employee.basicsalary
    });
    setIsEditModalVisible(true);
  };

  const openPromoteEmployeeModal = (employee) => {
    promoteEmployeeForm.setFieldsValue({
      empid: employee.empid,
      previous_role: employee.role,
      new_role: employee.role,
      department: employee.department
    });
    setIsPromoteModalVisible(true);
  };

  const openAddKPIModal = (employee) => {
    kpiForm.setFieldsValue({
      empid: employee.empid
    });
    setIsKpiModalVisible(true);
  };

  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'full_name',
      key: 'employee',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.full_name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
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
      title: 'KPI Score',
      dataIndex: 'kpiscore',
      key: 'kpiscore',
      render: (score) => score ? (
        <Progress percent={score} size="small" status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'} />
      ) : 'N/A'
    },
    {
      title: 'Join Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Employee">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditEmployeeModal(record)}
            />
          </Tooltip>
          <Tooltip title="Promote Employee">
            <Button
              type="link"
              size="small"
              icon={<RiseOutlined />}
              onClick={() => openPromoteEmployeeModal(record)}
            />
          </Tooltip>
          <Tooltip title="Add KPI">
            <Button
              type="link"
              size="small"
              icon={<StarOutlined />}
              onClick={() => openAddKPIModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to deactivate this employee?"
            onConfirm={() => handleDeleteEmployee(record.empid, record.full_name)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Deactivate Employee">
              <Button
                type="link"
                size="small"
                danger
                icon={<UserDeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Employee Management</Title>
        
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search employees..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Department"
              style={{ width: '100%' }}
              value={departmentFilter}
              onChange={setDepartmentFilter}
              allowClear
            >
              <Option value="Engineering">Engineering</Option>
              <Option value="Design">Design</Option>
              <Option value="Product">Product</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="Sales">Sales</Option>
              <Option value="HR">Human Resources</Option>
              <Option value="Finance">Finance</Option>
              <Option value="Operations">Operations</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="On Leave">On Leave</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => exportToExcel(employees, 'employees_list')}
              block
            >
              Export
            </Button>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setIsAddModalVisible(true)}
            >
              Add Employee
            </Button>
          </Col>
        </Row>

        <Table
          columns={employeeColumns}
          dataSource={filteredEmployees}
          rowKey="empid"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} employees`
          }}
        />
      </Card>

      {/* Add Employee Modal */}
      <Modal
        title="Add New Employee"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={employeeForm} layout="vertical" onFinish={handleAddEmployee}>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select placeholder="Select role">
                  <Option value="Manager">Manager</Option>
                  <Option value="Team Lead">Team Lead</Option>
                  <Option value="Senior Developer">Senior Developer</Option>
                  <Option value="Developer">Developer</Option>
                  <Option value="Designer">Designer</Option>
                  <Option value="QA Engineer">QA Engineer</Option>
                  <Option value="HR Specialist">HR Specialist</Option>
                  <Option value="Finance Manager">Finance Manager</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select placeholder="Select department">
                  <Option value="Engineering">Engineering</Option>
                  <Option value="Design">Design</Option>
                  <Option value="Product">Product</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="HR">Human Resources</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Operations">Operations</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                <Select placeholder="Select gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dob" label="Date of Birth">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item name="basicsalary" label="Basic Salary" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        title="Edit Employee"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={editEmployeeForm} layout="vertical" onFinish={handleEditEmployee}>
          <Form.Item name="empid" hidden>
            <Input />
          </Form.Item>
          
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select placeholder="Select role">
                  <Option value="Manager">Manager</Option>
                  <Option value="Team Lead">Team Lead</Option>
                  <Option value="Senior Developer">Senior Developer</Option>
                  <Option value="Developer">Developer</Option>
                  <Option value="Designer">Designer</Option>
                  <Option value="QA Engineer">QA Engineer</Option>
                  <Option value="HR Specialist">HR Specialist</Option>
                  <Option value="Finance Manager">Finance Manager</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select placeholder="Select department">
                  <Option value="Engineering">Engineering</Option>
                  <Option value="Design">Design</Option>
                  <Option value="Product">Product</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="HR">Human Resources</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Operations">Operations</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                <Select placeholder="Select gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dob" label="Date of Birth">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select placeholder="Select status">
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                  <Option value="On Leave">On Leave</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="is_active" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="basicsalary" label="Basic Salary" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Promote Employee Modal */}
      <Modal
        title="Promote Employee"
        open={isPromoteModalVisible}
        onCancel={() => setIsPromoteModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={promoteEmployeeForm} layout="vertical" onFinish={handlePromoteEmployee}>
          <Form.Item name="empid" hidden>
            <Input />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="previous_role" label="Current Position">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="new_role" label="New Position" rules={[{ required: true }]}>
                <Input placeholder="Enter new position" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Select placeholder="Select department">
              <Option value="Engineering">Engineering</Option>
              <Option value="Design">Design</Option>
              <Option value="Product">Product</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="Sales">Sales</Option>
              <Option value="HR">Human Resources</Option>
              <Option value="Finance">Finance</Option>
              <Option value="Operations">Operations</Option>
            </Select>
          </Form.Item>

          <Form.Item name="recommendation" label="Recommendation">
            <TextArea rows={4} placeholder="Enter promotion recommendation..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Promote Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add KPI Modal */}
      <Modal
        title="Add Employee KPI"
        open={isKpiModalVisible}
        onCancel={() => setIsKpiModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={kpiForm} layout="vertical" onFinish={handleAddKPI}>
          <Form.Item name="empid" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="kpivalue" label="KPI Value (0-100)" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              placeholder="Enter KPI value"
            />
          </Form.Item>

          <Form.Item name="calculation_date" label="Calculation Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add KPI
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HREmployee;