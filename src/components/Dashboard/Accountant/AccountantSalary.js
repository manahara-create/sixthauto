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

const { Option } = Select;

const AccountantSalary = ({ dateRange, onRefresh }) => {
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
    // Simulated data - Replace with Supabase
    const mockEmployees = [
      { empid: 'E001', full_name: 'John Doe', department: 'Engineering', basicsalary: 5000 },
      { empid: 'E002', full_name: 'Jane Smith', department: 'Marketing', basicsalary: 4500 },
      { empid: 'E003', full_name: 'Bob Johnson', department: 'Sales', basicsalary: 4000 }
    ];
    setEmployees(mockEmployees);
  };

  const fetchRecentSalaries = async () => {
    // Simulated data
    const mockRecent = [
      {
        key: '1',
        employee: 'John Doe',
        date: '2025-10-15',
        amount: 6500,
        status: 'processed'
      },
      {
        key: '2',
        employee: 'Jane Smith',
        date: '2025-10-14',
        amount: 5000,
        status: 'processed'
      }
    ];
    setRecentSalaries(mockRecent);
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

    setLoading(true);
    try {
      // Supabase insert query here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Salary processed successfully!');
      form.resetFields();
      setCalculations(null);
      setSelectedEmployee(null);
      fetchRecentSalaries();
      onRefresh?.();
    } catch (error) {
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
      render: (val) => `$${val.toLocaleString()}`
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