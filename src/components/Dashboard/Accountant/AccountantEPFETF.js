import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Row,
  Col,
  Statistic,
  Alert,
  Space,
  message,
  Tag,
  Progress
} from 'antd';
import {
  BankOutlined,
  PlusOutlined,
  PercentageOutlined,
  DollarOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../../services/supabase';

const { Option } = Select;

const AccountantEPFETF = ({ dateRange, onRefresh, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('epf');
  const [employees, setEmployees] = useState([]);
  const [epfData, setEpfData] = useState([]);
  const [etfData, setEtfData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [basicSalary, setBasicSalary] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [calculation, setCalculation] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchContributions();
  }, [dateRange]);

  useEffect(() => {
    calculateContributions();
  }, [basicSalary, activeTab]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, full_name, department, basicsalary')
        .eq('status', 'Active')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to load employees');
    }
  };

  const fetchContributions = async () => {
    try {
      // Fetch EPF data
      const { data: epfData, error: epfError } = await supabase
        .from('epf_contributions')
        .select(`
          id,
          empid,
          basicsalary,
          employeecontribution,
          employercontribution,
          totalcontribution,
          month,
          status,
          processed_by,
          employee:employee(full_name, department)
        `)
        .order('month', { ascending: false });

      if (epfError) throw epfError;

      // Fetch ETF data
      const { data: etfData, error: etfError } = await supabase
        .from('etf_contributions')
        .select(`
          id,
          empid,
          basicsalary,
          employercontribution,
          month,
          status,
          processed_by,
          employee:employee(full_name, department)
        `)
        .order('month', { ascending: false });

      if (etfError) throw etfError;

      setEpfData(epfData || []);
      setEtfData(etfData || []);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      message.error('Failed to load contribution data');
    }
  };

  const calculateContributions = () => {
    if (!basicSalary) {
      setCalculation(null);
      return;
    }
    
    if (activeTab === 'epf') {
      const employeeEPF = Math.round(basicSalary * 0.08);
      const employerEPF = Math.round(basicSalary * 0.12);
      setCalculation({
        type: 'EPF',
        basicSalary,
        employeeContribution: employeeEPF,
        employerContribution: employerEPF,
        total: employeeEPF + employerEPF
      });
    } else {
      const employerETF = Math.round(basicSalary * 0.03);
      setCalculation({
        type: 'ETF',
        basicSalary,
        employerContribution: employerETF,
        total: employerETF
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !basicSalary) {
      message.error('Please select employee and enter salary');
      return;
    }

    if (!currentUser) {
      message.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'epf') {
        const { data, error } = await supabase
          .from('epf_contributions')
          .insert({
            empid: selectedEmployee,
            basicsalary: basicSalary,
            employeecontribution: calculation.employeeContribution,
            employercontribution: calculation.employerContribution,
            totalcontribution: calculation.total,
            month: selectedMonth.format('YYYY-MM-01'),
            processed_by: currentUser.id,
            status: 'processed'
          })
          .select();

        if (error) throw error;

        // Log operation
        await supabase
          .from('accountant_operations')
          .insert({
            operation: 'EPF_CONTRIBUTION',
            record_id: data[0].id,
            accountant_id: currentUser.id,
            details: `Processed EPF for employee ${selectedEmployee} - Amount: $${calculation.total}`,
            operation_time: new Date().toISOString()
          });
      } else {
        const { data, error } = await supabase
          .from('etf_contributions')
          .insert({
            empid: selectedEmployee,
            basicsalary: basicSalary,
            employercontribution: calculation.total,
            month: selectedMonth.format('YYYY-MM-01'),
            processed_by: currentUser.id,
            status: 'processed'
          })
          .select();

        if (error) throw error;

        // Log operation
        await supabase
          .from('accountant_operations')
          .insert({
            operation: 'ETF_CONTRIBUTION',
            record_id: data[0].id,
            accountant_id: currentUser.id,
            details: `Processed ETF for employee ${selectedEmployee} - Amount: $${calculation.total}`,
            operation_time: new Date().toISOString()
          });
      }

      message.success(`${activeTab.toUpperCase()} contribution processed successfully!`);
      resetForm();
      fetchContributions();
      onRefresh?.();
    } catch (error) {
      console.error('Error processing contribution:', error);
      message.error('Failed to process contribution');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record, type) => {
    try {
      if (type === 'epf') {
        const { error } = await supabase
          .from('epf_contributions')
          .delete()
          .eq('id', record.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('etf_contributions')
          .delete()
          .eq('id', record.id);

        if (error) throw error;
      }

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: `DELETE_${type.toUpperCase()}`,
          record_id: record.id,
          accountant_id: currentUser?.id,
          details: `Deleted ${type} contribution for employee ${record.empid}`,
          operation_time: new Date().toISOString()
        });

      message.success('Contribution record deleted successfully!');
      fetchContributions();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting record:', error);
      message.error('Failed to delete record');
    }
  };

  const handleEdit = (record, type) => {
    setEditRecord({ ...record, type });
    setSelectedEmployee(record.empid);
    setBasicSalary(record.basicsalary);
    setSelectedMonth(dayjs(record.month));
  };

  const handleUpdate = async () => {
    if (!editRecord || !basicSalary) {
      message.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editRecord.type === 'epf') {
        const employeeEPF = Math.round(basicSalary * 0.08);
        const employerEPF = Math.round(basicSalary * 0.12);
        
        const { error } = await supabase
          .from('epf_contributions')
          .update({
            basicsalary: basicSalary,
            employeecontribution: employeeEPF,
            employercontribution: employerEPF,
            totalcontribution: employeeEPF + employerEPF,
            month: selectedMonth.format('YYYY-MM-01')
          })
          .eq('id', editRecord.id);

        if (error) throw error;
      } else {
        const employerETF = Math.round(basicSalary * 0.03);
        
        const { error } = await supabase
          .from('etf_contributions')
          .update({
            basicsalary: basicSalary,
            employercontribution: employerETF,
            month: selectedMonth.format('YYYY-MM-01')
          })
          .eq('id', editRecord.id);

        if (error) throw error;
      }

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: `UPDATE_${editRecord.type.toUpperCase()}`,
          record_id: editRecord.id,
          accountant_id: currentUser?.id,
          details: `Updated ${editRecord.type} contribution for employee ${editRecord.empid}`,
          operation_time: new Date().toISOString()
        });

      message.success('Contribution record updated successfully!');
      resetForm();
      setEditRecord(null);
      fetchContributions();
      onRefresh?.();
    } catch (error) {
      console.error('Error updating record:', error);
      message.error('Failed to update record');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setBasicSalary(0);
    setSelectedMonth(dayjs());
    setCalculation(null);
    setEditRecord(null);
  };

  const epfColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee'
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department'
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (val) => `$${val?.toLocaleString()}`
    },
    {
      title: 'Employee (8%)',
      dataIndex: 'employeecontribution',
      key: 'employeecontribution',
      render: (val) => `$${val?.toLocaleString()}`
    },
    {
      title: 'Employer (12%)',
      dataIndex: 'employercontribution',
      key: 'employercontribution',
      render: (val) => `$${val?.toLocaleString()}`
    },
    {
      title: 'Total (20%)',
      dataIndex: 'totalcontribution',
      key: 'totalcontribution',
      render: (val) => <strong style={{ color: '#1890ff' }}>${val?.toLocaleString()}</strong>
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (date) => dayjs(date).format('MMM YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="success">{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'epf')}
            size="small"
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record, 'epf')}
            size="small"
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  const etfColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee'
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department'
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (val) => `$${val?.toLocaleString()}`
    },
    {
      title: 'Employer (3%)',
      dataIndex: 'employercontribution',
      key: 'employercontribution',
      render: (val) => <strong style={{ color: '#52c41a' }}>${val?.toLocaleString()}</strong>
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (date) => dayjs(date).format('MMM YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="success">{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'etf')}
            size="small"
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record, 'etf')}
            size="small"
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  const stats = {
    epf: {
      total: epfData.reduce((sum, d) => sum + (d.totalcontribution || 0), 0),
      records: epfData.length
    },
    etf: {
      total: etfData.reduce((sum, d) => sum + (d.employercontribution || 0), 0),
      records: etfData.length
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24, color: '#1a1a2e' }}>
        <BankOutlined /> EPF/ETF Management
      </h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total EPF Contributions"
              value={stats.epf.total}
              prefix="$"
              suffix={`(${stats.epf.records} records)`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total ETF Contributions"
              value={stats.etf.total}
              prefix="$"
              suffix={`(${stats.etf.records} records)`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={(key) => {
        setActiveTab(key);
        resetForm();
      }}>
        <Tabs.TabPane tab="EPF Contributions" key="epf">
          <Row gutter={24}>
            <Col xs={24} lg={14}>
              <Card
                title={<><PlusOutlined /> {editRecord ? 'Edit EPF' : 'Process EPF'}</>}
                style={{ marginBottom: 24 }}
              >
                <Alert
                  message="EPF Calculation"
                  description="Employee: 8% | Employer: 12% | Total: 20% of basic salary"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Employee</label>
                    <Select
                      placeholder="Select employee"
                      style={{ width: '100%' }}
                      value={selectedEmployee}
                      onChange={(empid) => {
                        setSelectedEmployee(empid);
                        const emp = employees.find(e => e.empid === empid);
                        setBasicSalary(emp?.basicsalary || 0);
                      }}
                      disabled={!!editRecord}
                    >
                      {employees.map(emp => (
                        <Option key={emp.empid} value={emp.empid}>
                          {emp.full_name} - {emp.department}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Month</label>
                    <DatePicker
                      picker="month"
                      style={{ width: '100%' }}
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Basic Salary</label>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      prefix="$"
                      value={basicSalary}
                      onChange={setBasicSalary}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </div>

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    {editRecord && (
                      <Button onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="primary"
                      loading={loading}
                      disabled={!calculation}
                      onClick={editRecord ? handleUpdate : handleSubmit}
                      style={{ flex: 1 }}
                    >
                      {editRecord ? 'Update EPF Contribution' : 'Process EPF Contribution'}
                    </Button>
                  </Space>
                </Space>
              </Card>

              <Card title="EPF Contribution Records">
                <Table
                  columns={epfColumns}
                  dataSource={epfData}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 1000 }}
                />
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              {calculation && calculation.type === 'EPF' && (
                <Card
                  title={<><PercentageOutlined /> EPF Breakdown</>}
                  style={{ position: 'sticky', top: 24 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    <div>
                      <div style={{ marginBottom: 8, color: '#666' }}>Employee Contribution (8%)</div>
                      <Progress
                        percent={8}
                        format={() => `$${calculation.employeeContribution.toLocaleString()}`}
                        strokeColor="#1890ff"
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, color: '#666' }}>Employer Contribution (12%)</div>
                      <Progress
                        percent={12}
                        format={() => `$${calculation.employerContribution.toLocaleString()}`}
                        strokeColor="#52c41a"
                      />
                    </div>
                    <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
                      <Statistic
                        title="Total EPF Contribution"
                        value={calculation.total}
                        prefix="$"
                        valueStyle={{ fontSize: 28, color: '#722ed1', fontWeight: 'bold' }}
                      />
                    </div>
                  </Space>
                </Card>
              )}
            </Col>
          </Row>
        </Tabs.TabPane>

        <Tabs.TabPane tab="ETF Contributions" key="etf">
          <Row gutter={24}>
            <Col xs={24} lg={14}>
              <Card
                title={<><PlusOutlined /> {editRecord ? 'Edit ETF' : 'Process ETF'}</>}
                style={{ marginBottom: 24 }}
              >
                <Alert
                  message="ETF Calculation"
                  description="Employer contribution: 3% of basic salary"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Employee</label>
                    <Select
                      placeholder="Select employee"
                      style={{ width: '100%' }}
                      value={selectedEmployee}
                      onChange={(empid) => {
                        setSelectedEmployee(empid);
                        const emp = employees.find(e => e.empid === empid);
                        setBasicSalary(emp?.basicsalary || 0);
                      }}
                      disabled={!!editRecord}
                    >
                      {employees.map(emp => (
                        <Option key={emp.empid} value={emp.empid}>
                          {emp.full_name} - {emp.department}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Month</label>
                    <DatePicker
                      picker="month"
                      style={{ width: '100%' }}
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Basic Salary</label>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      prefix="$"
                      value={basicSalary}
                      onChange={setBasicSalary}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </div>

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    {editRecord && (
                      <Button onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="primary"
                      loading={loading}
                      disabled={!calculation}
                      onClick={editRecord ? handleUpdate : handleSubmit}
                      style={{ flex: 1 }}
                    >
                      {editRecord ? 'Update ETF Contribution' : 'Process ETF Contribution'}
                    </Button>
                  </Space>
                </Space>
              </Card>

              <Card title="ETF Contribution Records">
                <Table
                  columns={etfColumns}
                  dataSource={etfData}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 900 }}
                />
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              {calculation && calculation.type === 'ETF' && (
                <Card
                  title={<><DollarOutlined /> ETF Breakdown</>}
                  style={{ position: 'sticky', top: 24 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    <div>
                      <div style={{ marginBottom: 8, color: '#666' }}>Employer Contribution (3%)</div>
                      <Progress
                        percent={3}
                        format={() => `$${calculation.employerContribution.toLocaleString()}`}
                        strokeColor="#52c41a"
                      />
                    </div>
                    <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
                      <Statistic
                        title="Total ETF Contribution"
                        value={calculation.total}
                        prefix="$"
                        valueStyle={{ fontSize: 28, color: '#52c41a', fontWeight: 'bold' }}
                      />
                    </div>
                  </Space>
                </Card>
              )}
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default AccountantEPFETF;