import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  Select,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Badge,
  List,
  Progress,
  Input
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../../services/supabase';

const { Option } = Select;
const { Search } = Input;

const AccountantLoan = ({ dateRange, onRefresh, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [loanRequests, setLoanRequests] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [eligibilityVisible, setEligibilityVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form states
  const [formData, setFormData] = useState({
    employeeId: null,
    loanTypeId: null,
    amount: 0,
    duration: 12,
    interestRate: 5,
    loanDate: dayjs()
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch loan requests
      const { data: loanData, error: loanError } = await supabase
        .from('loanrequest')
        .select(`
          loanrequestid,
          empid,
          loantypeid,
          amount,
          duration,
          interestrate,
          date,
          status,
          processedby,
          processedat,
          remarks,
          employee:employee(full_name, department, basicsalary, role),
          loantype:loantype(loantype, description, max_amount, max_duration, interest_rate)
        `)
        .order('date', { ascending: false });

      if (loanError) throw loanError;

      // Fetch loan types
      const { data: loanTypeData, error: loanTypeError } = await supabase
        .from('loantype')
        .select('*')
        .order('loantype');

      if (loanTypeError) throw loanTypeError;

      // Fetch employees
      const { data: employeeData, error: employeeError } = await supabase
        .from('employee')
        .select('empid, full_name, department, basicsalary, role')
        .eq('status', 'Active')
        .order('full_name');

      if (employeeError) throw employeeError;

      setLoanRequests(loanData || []);
      setLoanTypes(loanTypeData || []);
      setEmployees(employeeData || []);
    } catch (error) {
      console.error('Error fetching loan data:', error);
      message.error('Failed to load loan data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLoan = async (loanId) => {
    try {
      const { error } = await supabase
        .from('loanrequest')
        .update({
          status: 'approved',
          processedby: currentUser?.id,
          processedat: new Date().toISOString()
        })
        .eq('loanrequestid', loanId);

      if (error) throw error;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'APPROVE_LOAN',
          record_id: loanId,
          accountant_id: currentUser?.id,
          details: `Approved loan request ${loanId}`,
          operation_time: new Date().toISOString()
        });

      message.success('Loan approved successfully!');
      fetchData();
      onRefresh?.();
    } catch (error) {
      console.error('Error approving loan:', error);
      message.error('Failed to approve loan');
    }
  };

  const handleRejectLoan = async (loanId) => {
    try {
      const { error } = await supabase
        .from('loanrequest')
        .update({
          status: 'rejected',
          processedby: currentUser?.id,
          processedat: new Date().toISOString()
        })
        .eq('loanrequestid', loanId);

      if (error) throw error;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'REJECT_LOAN',
          record_id: loanId,
          accountant_id: currentUser?.id,
          details: `Rejected loan request ${loanId}`,
          operation_time: new Date().toISOString()
        });

      message.success('Loan rejected');
      fetchData();
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting loan:', error);
      message.error('Failed to reject loan');
    }
  };

  const handleDeleteLoan = async (loanId) => {
    try {
      const { error } = await supabase
        .from('loanrequest')
        .delete()
        .eq('loanrequestid', loanId);

      if (error) throw error;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'DELETE_LOAN',
          record_id: loanId,
          accountant_id: currentUser?.id,
          details: `Deleted loan request ${loanId}`,
          operation_time: new Date().toISOString()
        });

      message.success('Loan request deleted successfully!');
      fetchData();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting loan:', error);
      message.error('Failed to delete loan');
    }
  };

  const handleCreateLoan = async () => {
    if (!formData.employeeId || !formData.loanTypeId || !formData.amount) {
      message.error('Please fill all required fields');
      return;
    }

    if (!currentUser) {
      message.error('User not authenticated');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('loanrequest')
        .insert({
          empid: formData.employeeId,
          loantypeid: formData.loanTypeId,
          amount: formData.amount,
          duration: formData.duration,
          interestrate: formData.interestRate,
          date: formData.loanDate.format('YYYY-MM-DD'),
          status: 'pending'
        })
        .select();

      if (error) throw error;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'CREATE_LOAN',
          record_id: data[0].loanrequestid,
          accountant_id: currentUser.id,
          details: `Created loan request for employee ${formData.employeeId} - Amount: $${formData.amount}`,
          operation_time: new Date().toISOString()
        });

      message.success('Loan request created successfully!');
      setCreateVisible(false);
      resetForm();
      fetchData();
      onRefresh?.();
    } catch (error) {
      console.error('Error creating loan:', error);
      message.error('Failed to create loan');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: null,
      loanTypeId: null,
      amount: 0,
      duration: 12,
      interestRate: 5,
      loanDate: dayjs()
    });
  };

  const checkEligibility = (employee) => {
    const eligibility = loanTypes.map(loanType => {
      let eligible = true;
      let maxAmount = employee.basicsalary * 3;
      let reasons = [];

      switch (loanType.loantype) {
        case 'Staff Loan':
          maxAmount = employee.basicsalary * 3;
          break;
        case 'Home Loan':
          maxAmount = employee.basicsalary * 60;
          if (employee.basicsalary < 50000) {
            eligible = false;
            reasons.push('Salary below minimum requirement');
          }
          break;
        case 'Emergency Loan':
          maxAmount = employee.basicsalary * 2;
          break;
        case 'Vehicle Loan':
          maxAmount = employee.basicsalary * 24;
          break;
        default:
          maxAmount = employee.basicsalary * 3;
      }

      if (employee.role === 'probation') {
        eligible = false;
        reasons.push('Employee on probation');
      }

      return {
        loanType: loanType.loantype,
        eligible,
        maxAmount,
        reasons: reasons.length > 0 ? reasons : ['Eligible']
      };
    });

    return eligibility;
  };

  const filteredData = loanRequests.filter(loan => {
    const matchesSearch = loan.employee?.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                         loan.employee?.department?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee',
      width: 150
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department',
      width: 130
    },
    {
      title: 'Loan Type',
      dataIndex: ['loantype', 'loantype'],
      key: 'loantype',
      width: 130
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val) => <strong style={{ color: '#1890ff' }}>${val?.toLocaleString()}</strong>
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (val) => `${val} months`
    },
    {
      title: 'Interest',
      dataIndex: 'interestrate',
      key: 'interestrate',
      width: 90,
      render: (val) => `${val}%`
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={
          status === 'approved' ? 'success' :
          status === 'rejected' ? 'error' : 'warning'
        }>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLoan(record);
              setDetailsVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="Approve this loan?"
                onConfirm={() => handleApproveLoan(record.loanrequestid)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="primary" size="small" icon={<CheckCircleOutlined />}>
                  Approve
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Reject this loan?"
                onConfirm={() => handleRejectLoan(record.loanrequestid)}
                okText="Yes"
                cancelText="No"
              >
                <Button danger size="small" icon={<CloseCircleOutlined />}>
                  Reject
                </Button>
              </Popconfirm>
            </>
          )}
          <Popconfirm
            title="Delete this loan request?"
            onConfirm={() => handleDeleteLoan(record.loanrequestid)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
          <Button
            size="small"
            onClick={() => {
              setSelectedEmployee(record.employee);
              setEligibilityVisible(true);
            }}
          >
            Check Eligibility
          </Button>
        </Space>
      )
    }
  ];

  const stats = {
    total: filteredData.length,
    pending: filteredData.filter(l => l.status === 'pending').length,
    approved: filteredData.filter(l => l.status === 'approved').length,
    rejected: filteredData.filter(l => l.status === 'rejected').length,
    totalAmount: filteredData.reduce((sum, l) => sum + (l.amount || 0), 0)
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24, color: '#1a1a2e' }}>
        <DollarOutlined /> Loan Management
      </h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.totalAmount}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Loan Requests"
        extra={
          <Space>
            <Search
              placeholder="Search by name or department"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateVisible(true)}
            >
              Create Loan Request
            </Button>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="loanrequestid"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title="Loan Details"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedLoan && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Employee" span={2}>
              <strong>{selectedLoan.employee?.full_name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {selectedLoan.employee?.department}
            </Descriptions.Item>
            <Descriptions.Item label="Base Salary">
              ${selectedLoan.employee?.basicsalary?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Loan Type" span={2}>
              {selectedLoan.loantype?.loantype}
            </Descriptions.Item>
            <Descriptions.Item label="Amount Requested">
              ${selectedLoan.amount?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {selectedLoan.duration} months
            </Descriptions.Item>
            <Descriptions.Item label="Interest Rate">
              {selectedLoan.interestrate}%
            </Descriptions.Item>
            <Descriptions.Item label="Monthly Payment">
              ${Math.round((selectedLoan.amount * (1 + selectedLoan.interestrate / 100)) / selectedLoan.duration).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Request Date" span={2}>
              {dayjs(selectedLoan.date).format('MMMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={2}>
              <Tag color={
                selectedLoan.status === 'approved' ? 'success' :
                selectedLoan.status === 'rejected' ? 'error' : 'warning'
              }>
                {selectedLoan.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Create Loan Modal */}
      <Modal
        title="Create Loan Request"
        open={createVisible}
        onCancel={() => {
          setCreateVisible(false);
          resetForm();
        }}
        onOk={handleCreateLoan}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Employee *</label>
            <Select
              placeholder="Select employee"
              style={{ width: '100%' }}
              value={formData.employeeId}
              onChange={(val) => setFormData({ ...formData, employeeId: val })}
            >
              {employees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.full_name} - {emp.department} (${emp.basicsalary?.toLocaleString()})
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Loan Type *</label>
            <Select
              placeholder="Select loan type"
              style={{ width: '100%' }}
              value={formData.loanTypeId}
              onChange={(val) => {
                const loanType = loanTypes.find(lt => lt.loantypeid === val);
                setFormData({
                  ...formData,
                  loanTypeId: val,
                  interestRate: loanType?.interest_rate || 5
                });
              }}
            >
              {loanTypes.map(lt => (
                <Option key={lt.loantypeid} value={lt.loantypeid}>
                  {lt.loantype} (Max: ${lt.max_amount?.toLocaleString()})
                </Option>
              ))}
            </Select>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <label style={{ display: 'block', marginBottom: 8 }}>Amount *</label>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                prefix="$"
                value={formData.amount}
                onChange={(val) => setFormData({ ...formData, amount: val })}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Col>
            <Col span={12}>
              <label style={{ display: 'block', marginBottom: 8 }}>Duration (months)</label>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={60}
                value={formData.duration}
                onChange={(val) => setFormData({ ...formData, duration: val })}
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <label style={{ display: 'block', marginBottom: 8 }}>Interest Rate (%)</label>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                step={0.1}
                value={formData.interestRate}
                onChange={(val) => setFormData({ ...formData, interestRate: val })}
              />
            </Col>
            <Col span={12}>
              <label style={{ display: 'block', marginBottom: 8 }}>Date</label>
              <DatePicker
                style={{ width: '100%' }}
                value={formData.loanDate}
                onChange={(val) => setFormData({ ...formData, loanDate: val })}
              />
            </Col>
          </Row>
        </Space>
      </Modal>

      {/* Eligibility Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined />
            Loan Eligibility Check
          </Space>
        }
        open={eligibilityVisible}
        onCancel={() => setEligibilityVisible(false)}
        footer={[
          <Button key="close" onClick={() => setEligibilityVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedEmployee && (
          <>
            <Descriptions bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Employee" span={3}>
                <strong>{selectedEmployee.full_name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedEmployee.department}
              </Descriptions.Item>
              <Descriptions.Item label="Basic Salary">
                ${selectedEmployee.basicsalary?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {selectedEmployee.role}
              </Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginBottom: 16 }}>Eligibility Results</h3>
            <List
              dataSource={checkEligibility(selectedEmployee)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge
                        status={item.eligible ? 'success' : 'error'}
                        text={item.eligible ? 'Eligible' : 'Not Eligible'}
                      />
                    }
                    title={<strong>{item.loanType}</strong>}
                    description={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>Maximum Amount: <strong>${item.maxAmount.toLocaleString()}</strong></div>
                        <div style={{ color: item.eligible ? '#52c41a' : '#f5222d' }}>
                          {item.reasons.join(', ')}
                        </div>
                        {item.eligible && (
                          <Progress
                            percent={100}
                            strokeColor="#52c41a"
                            format={() => 'Approved'}
                          />
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default AccountantLoan;