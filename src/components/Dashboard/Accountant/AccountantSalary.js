// AccountantSalary.js
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  InputNumber, 
  DatePicker, 
  Button, 
  Row, 
  Col, 
  Divider, 
  Statistic,
  Alert,
  Space,
  message,
  Table,
  Tag
} from 'antd';
import { 
  CalculatorOutlined, 
  DollarOutlined, 
  SaveOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../../services/supabase';

const { Option } = Select;

const AccountantSalary = ({ dateRange, onRefresh, currentUser }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [calculations, setCalculations] = useState(null);
  const [recentSalaries, setRecentSalaries] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchRecentSalaries();
  }, [dateRange]);

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

  const fetchRecentSalaries = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select(`
          salaryid,
          empid,
          basicsalary,
          otpay,
          bonuspay,
          incrementpay,
          totalsalary,
          salarydate,
          processed_at,
          employee:employee(full_name)
        `)
        .order('salarydate', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        key: item.salaryid,
        employee: item.employee?.full_name || 'Unknown',
        date: item.salarydate,
        amount: item.totalsalary,
        status: 'processed'
      })) || [];

      setRecentSalaries(formattedData);
    } catch (error) {
      console.error('Error fetching recent salaries:', error);
    }
  };

  const handleEmployeeChange = (empid) => {
    const employee = employees.find(e => e.empid === empid);
    setSelectedEmployee(employee);
    form.setFieldsValue({
      basicSalary: employee?.basicsalary || 0
    });
    calculateSalary();
  };

  const calculateSalary = () => {
    const values = form.getFieldsValue();
    const basicSalary = parseFloat(values.basicSalary) || 0;
    const otHours = parseFloat(values.otHours) || 0;
    const otRate = parseFloat(values.otRate) || 0;
    const bonusAmount = parseFloat(values.bonusAmount) || 0;
    const incrementAmount = parseFloat(values.incrementAmount) || 0;
    const noPayDays = parseFloat(values.noPayDays) || 0;

    const otPay = otHours * otRate;
    const noPayDeduction = noPayDays * (basicSalary / 30);
    const totalSalary = basicSalary + otPay + bonusAmount + incrementAmount - noPayDeduction;

    setCalculations({
      basicSalary,
      otPay,
      bonusAmount,
      incrementAmount,
      noPayDeduction,
      totalSalary,
      netPayable: totalSalary > 0 ? totalSalary : 0
    });
  };

  const handleProcessSalary = async (values) => {
    if (!calculations || calculations.netPayable <= 0) {
      message.error('Please calculate salary before processing');
      return;
    }

    if (!currentUser) {
      message.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Insert salary record
      const { data, error } = await supabase
        .from('salary')
        .insert({
          empid: values.employeeId,
          basicsalary: calculations.basicSalary,
          otpay: calculations.otPay,
          bonuspay: calculations.bonusAmount,
          incrementpay: calculations.incrementAmount,
          totalsalary: calculations.netPayable,
          salarydate: values.salaryDate.format('YYYY-MM-DD'),
          processed_by: currentUser.id,
          processed_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'SALARY_PROCESSING',
          record_id: data[0].salaryid,
          accountant_id: currentUser.id,
          details: `Processed salary for employee ${values.employeeId} - Amount: $${calculations.netPayable}`,
          operation_time: new Date().toISOString()
        });

      message.success('Salary processed successfully!');
      form.resetFields();
      setCalculations(null);
      setSelectedEmployee(null);
      fetchRecentSalaries();
      onRefresh?.();
    } catch (error) {
      console.error('Error processing salary:', error);
      message.error('Failed to process salary');
    } finally {
      setLoading(false);
    }
  };

  const recentColumns = [
    {
      title: 'Employee',
      dataIndex: 'employee',
      key: 'employee'
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => `$${val?.toLocaleString()}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="success">{status}</Tag>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24, color: '#1a1a2e' }}>
        <CalculatorOutlined /> Salary Processing
      </h1>

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card 
            title="Process New Salary"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProcessSalary}
              onValuesChange={calculateSalary}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="employeeId"
                    label="Select Employee"
                    rules={[{ required: true, message: 'Please select an employee' }]}
                  >
                    <Select
                      placeholder="Choose employee"
                      onChange={handleEmployeeChange}
                      showSearch
                      optionFilterProp="children"
                    >
                      {employees.map(emp => (
                        <Option key={emp.empid} value={emp.empid}>
                          {emp.full_name} - {emp.department}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="salaryDate"
                    label="Salary Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                    initialValue={dayjs()}
                  >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>Salary Components</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="basicSalary" label="Basic Salary">
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      prefix="$"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      disabled={!selectedEmployee}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="otHours" label="OT Hours" initialValue={0}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.5}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="otRate" label="OT Rate/Hour" initialValue={0}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      prefix="$"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="bonusAmount" label="Bonus" initialValue={0}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      prefix="$"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="incrementAmount" label="Increment" initialValue={0}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      prefix="$"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="noPayDays" label="No Pay Days" initialValue={0}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={31}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  form.resetFields();
                  setCalculations(null);
                  setSelectedEmployee(null);
                }}>
                  Reset
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  disabled={!calculations || calculations.netPayable <= 0}
                >
                  Process Salary
                </Button>
              </Space>
            </Form>
          </Card>

          <Card
            title={<><HistoryOutlined /> Recent Processed</>}
            style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <Table
              columns={recentColumns}
              dataSource={recentSalaries}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          {selectedEmployee && (
            <Card
              title="Employee Information"
              style={{ marginBottom: 24, borderRadius: 12, background: '#f6f8fa' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><strong>Name:</strong> {selectedEmployee.full_name}</div>
                <div><strong>Department:</strong> {selectedEmployee.department}</div>
                <div><strong>Base Salary:</strong> ${selectedEmployee.basicsalary?.toLocaleString()}</div>
              </Space>
            </Card>
          )}

          {calculations && (
            <Card
              title={<><DollarOutlined /> Salary Breakdown</>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Statistic
                  title="Basic Salary"
                  value={calculations.basicSalary}
                  prefix="$"
                  valueStyle={{ color: '#1890ff' }}
                />
                <Statistic
                  title="OT Payment"
                  value={calculations.otPay}
                  prefix="$"
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="Bonus"
                  value={calculations.bonusAmount}
                  prefix="$"
                  valueStyle={{ color: '#722ed1' }}
                />
                <Statistic
                  title="Increment"
                  value={calculations.incrementAmount}
                  prefix="$"
                  valueStyle={{ color: '#13c2c2' }}
                />
                {calculations.noPayDeduction > 0 && (
                  <Statistic
                    title="No Pay Deduction"
                    value={calculations.noPayDeduction}
                    prefix="-$"
                    valueStyle={{ color: '#f5222d' }}
                  />
                )}
                <Divider style={{ margin: '12px 0' }} />
                <Statistic
                  title="Total Salary"
                  value={calculations.netPayable}
                  prefix="$"
                  valueStyle={{ fontSize: 28, color: '#1890ff', fontWeight: 'bold' }}
                />
              </Space>

              {calculations.netPayable > 0 ? (
                <Alert
                  message="Ready to Process"
                  description="Click 'Process Salary' to save this calculation"
                  type="success"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              ) : (
                <Alert
                  message="Invalid Amount"
                  description="Total salary cannot be negative"
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AccountantSalary;