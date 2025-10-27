import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input,
  Select, InputNumber, message, Tooltip, Popconfirm, Tabs
} from 'antd';
import {
  DollarOutlined, FileExcelOutlined, PlusOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';

import { supabase } from '../../../services/supabase';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const AdminPayment = ({ dateRange }) => {
  const [loading, setLoading] = useState(false);
  const [salaryData, setSalaryData] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [bonusData, setBonusData] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  
  // Modal states
  const [isSalaryModalVisible, setIsSalaryModalVisible] = useState(false);
  const [isLoanModalVisible, setIsLoanModalVisible] = useState(false);
  const [isBonusModalVisible, setIsBonusModalVisible] = useState(false);
  const [isEditLoanModalVisible, setIsEditLoanModalVisible] = useState(false);
  
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activePaymentTab, setActivePaymentTab] = useState('salary');
  
  // Forms
  const [salaryForm] = Form.useForm();
  const [loanForm] = Form.useForm();
  const [bonusForm] = Form.useForm();
  const [editLoanForm] = Form.useForm();

  useEffect(() => {
    fetchPaymentData();
  }, [dateRange]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSalaryData(),
        fetchLoanRequests(),
        fetchBonusData(),
        fetchAllEmployees(),
        fetchLoanTypes()
      ]);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      message.error('Failed to load payment data');
    } finally {
      setLoading(false);
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

  const fetchBonusData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('bonus')
        .select('*')
        .gte('bonusdate', startDate)
        .lte('bonusdate', endDate)
        .order('bonusdate', { ascending: false });

      if (error) throw error;
      
      const bonusWithEmployee = await Promise.all(
        (data || []).map(async (bonus) => {
          const { data: employeeData } = await supabase
            .from('employee')
            .select('full_name, department')
            .eq('empid', bonus.empid)
            .single();

          return {
            ...bonus,
            employee: employeeData || { full_name: 'Unknown', department: 'Unknown' }
          };
        })
      );
      
      setBonusData(bonusWithEmployee);
    } catch (error) {
      console.error('Error fetching bonus data:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, full_name, department, basicsalary')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setAllEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
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

        case 'loans':
          reportData = loanRequests.map(loan => ({
            'Employee': loan.employee?.full_name || 'N/A',
            'Loan Type': loan.loantype?.loantype || 'N/A',
            'Amount': `LKR ${loan.amount?.toLocaleString() || '0'}`,
            'Duration': `${loan.duration} months`,
            'Interest Rate': `${loan.interestrate}%`,
            'Status': loan.status,
            'Applied Date': loan.date
          }));
          fileName = 'Loan_Report';
          break;

        case 'bonus':
          reportData = bonusData.map(bonus => ({
            'Employee': bonus.employee?.full_name || 'N/A',
            'Type': bonus.type,
            'Reason': bonus.reason,
            'Amount': `LKR ${bonus.amount?.toLocaleString() || '0'}`,
            'Bonus Date': bonus.bonusdate
          }));
          fileName = 'Bonus_Report';
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

  const handleAddSalary = async (values) => {
    try {
      const salaryData = {
        empid: values.empid,
        basicsalary: values.basicsalary,
        otpay: values.otpay || 0,
        bonuspay: values.bonuspay || 0,
        incrementpay: values.incrementpay || 0,
        totalsalary: (values.basicsalary || 0) + (values.otpay || 0) + (values.bonuspay || 0) + (values.incrementpay || 0),
        salarydate: values.salarydate.format('YYYY-MM-DD'),
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('salary')
        .insert([salaryData]);

      if (error) throw error;

      message.success('Salary record added successfully!');
      setIsSalaryModalVisible(false);
      salaryForm.resetFields();
      fetchSalaryData();
    } catch (error) {
      console.error('Error adding salary:', error);
      message.error('Failed to add salary record');
    }
  };

  const handleAddLoan = async (values) => {
    try {
      const loanData = {
        empid: values.empid,
        loantypeid: values.loantypeid,
        amount: values.amount,
        duration: values.duration,
        interestrate: values.interestrate,
        date: values.date.format('YYYY-MM-DD'),
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('loanrequest')
        .insert([loanData]);

      if (error) throw error;

      message.success('Loan request submitted successfully!');
      setIsLoanModalVisible(false);
      loanForm.resetFields();
      fetchLoanRequests();
    } catch (error) {
      console.error('Error adding loan:', error);
      message.error('Failed to submit loan request');
    }
  };

  const handleAddBonus = async (values) => {
    try {
      const bonusData = {
        empid: values.empid,
        type: values.type,
        reason: values.reason,
        amount: values.amount,
        bonusdate: values.bonusdate.format('YYYY-MM-DD'),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bonus')
        .insert([bonusData]);

      if (error) throw error;

      message.success('Bonus added successfully!');
      setIsBonusModalVisible(false);
      bonusForm.resetFields();
      fetchBonusData();
    } catch (error) {
      console.error('Error adding bonus:', error);
      message.error('Failed to add bonus');
    }
  };

  const handleUpdateLoanStatus = async (loanId, status) => {
    try {
      const { error } = await supabase
        .from('loanrequest')
        .update({ 
          status: status,
          processedat: new Date().toISOString()
        })
        .eq('loanrequestid', loanId);

      if (error) throw error;

      message.success(`Loan ${status} successfully!`);
      fetchLoanRequests();
    } catch (error) {
      console.error('Error updating loan status:', error);
      message.error('Failed to update loan status');
    }
  };

  const handleDeleteSalary = async (salaryId) => {
    try {
      const { error } = await supabase
        .from('salary')
        .delete()
        .eq('salaryid', salaryId);

      if (error) throw error;

      message.success('Salary record deleted successfully!');
      fetchSalaryData();
    } catch (error) {
      console.error('Error deleting salary:', error);
      message.error('Failed to delete salary record');
    }
  };

  const salaryColumns = [
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure to delete this salary record?"
            onConfirm={() => handleDeleteSalary(record.salaryid)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <Button 
                  type="link" 
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleUpdateLoanStatus(record.loanrequestid, 'approved')}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button 
                  type="link" 
                  danger 
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleUpdateLoanStatus(record.loanrequestid, 'rejected')}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const bonusColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee_name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `LKR ${amount?.toLocaleString() || '0'}`,
    },
    {
      title: 'Bonus Date',
      dataIndex: 'bonusdate',
      key: 'bonusdate',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
  ];

  const renderSalaryManagement = () => (
    <Card
      title="Salary Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsSalaryModalVisible(true)}
          >
            Add Salary
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('salary')}
          >
            Export Report
          </Button>
        </Space>
      }
    >
      <Table
        columns={salaryColumns}
        dataSource={salaryData}
        rowKey="salaryid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
        loading={loading}
      />
    </Card>
  );

  const renderLoanManagement = () => (
    <Card
      title="Loan Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsLoanModalVisible(true)}
          >
            Add Loan
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('loans')}
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
        loading={loading}
      />
    </Card>
  );

  const renderBonusManagement = () => (
    <Card
      title="Bonus Management"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsBonusModalVisible(true)}
          >
            Add Bonus
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => generateReport('bonus')}
          >
            Export Report
          </Button>
        </Space>
      }
    >
      <Table
        columns={bonusColumns}
        dataSource={bonusData}
        rowKey="bonusid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
        loading={loading}
      />
    </Card>
  );

  const renderSalaryModal = () => (
    <Modal
      title="Add Salary Record"
      open={isSalaryModalVisible}
      onCancel={() => {
        setIsSalaryModalVisible(false);
        salaryForm.resetFields();
      }}
      onOk={() => salaryForm.submit()}
      width={600}
    >
      <Form form={salaryForm} layout="vertical" onFinish={handleAddSalary}>
        <Form.Item
          name="empid"
          label="Employee"
          rules={[{ required: true, message: 'Please select employee' }]}
        >
          <Select placeholder="Select employee" showSearch optionFilterProp="children">
            {allEmployees.map(emp => (
              <Option key={emp.empid} value={emp.empid}>
                {emp.full_name} - {emp.department} (LKR {emp.basicsalary?.toLocaleString() || '0'})
              </Option>
            ))}
          </Select>
        </Form.Item>

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

        <Form.Item
          name="otpay"
          label="OT Pay"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter OT pay"
            min={0}
            formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/LKR\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="bonuspay"
          label="Bonus Pay"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter bonus pay"
            min={0}
            formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/LKR\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="salarydate"
          label="Salary Date"
          rules={[{ required: true, message: 'Please select salary date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderLoanModal = () => (
    <Modal
      title="Add Loan Request"
      open={isLoanModalVisible}
      onCancel={() => {
        setIsLoanModalVisible(false);
        loanForm.resetFields();
      }}
      onOk={() => loanForm.submit()}
      width={600}
    >
      <Form form={loanForm} layout="vertical" onFinish={handleAddLoan}>
        <Form.Item
          name="empid"
          label="Employee"
          rules={[{ required: true, message: 'Please select employee' }]}
        >
          <Select placeholder="Select employee" showSearch optionFilterProp="children">
            {allEmployees.map(emp => (
              <Option key={emp.empid} value={emp.empid}>
                {emp.full_name} - {emp.department}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="loantypeid"
          label="Loan Type"
          rules={[{ required: true, message: 'Please select loan type' }]}
        >
          <Select placeholder="Select loan type">
            {loanTypes.map(type => (
              <Option key={type.loantypeid} value={type.loantypeid}>
                {type.loantype} (Max: LKR {type.max_amount?.toLocaleString() || '0'})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label="Loan Amount"
          rules={[{ required: true, message: 'Please enter loan amount' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter loan amount"
            min={0}
            formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/LKR\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="duration"
          label="Duration (months)"
          rules={[{ required: true, message: 'Please enter duration' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter duration in months"
            min={1}
            max={60}
          />
        </Form.Item>

        <Form.Item
          name="date"
          label="Application Date"
          rules={[{ required: true, message: 'Please select date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );

  const renderBonusModal = () => (
    <Modal
      title="Add Bonus"
      open={isBonusModalVisible}
      onCancel={() => {
        setIsBonusModalVisible(false);
        bonusForm.resetFields();
      }}
      onOk={() => bonusForm.submit()}
      width={600}
    >
      <Form form={bonusForm} layout="vertical" onFinish={handleAddBonus}>
        <Form.Item
          name="empid"
          label="Employee"
          rules={[{ required: true, message: 'Please select employee' }]}
        >
          <Select placeholder="Select employee" showSearch optionFilterProp="children">
            {allEmployees.map(emp => (
              <Option key={emp.empid} value={emp.empid}>
                {emp.full_name} - {emp.department}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="type"
          label="Bonus Type"
          rules={[{ required: true, message: 'Please enter bonus type' }]}
        >
          <Input placeholder="Enter bonus type (e.g., Performance, Festival, etc.)" />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: 'Please enter reason' }]}
        >
          <TextArea placeholder="Enter bonus reason" rows={3} />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Bonus Amount"
          rules={[{ required: true, message: 'Please enter bonus amount' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter bonus amount"
            min={0}
            formatter={value => `LKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/LKR\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="bonusdate"
          label="Bonus Date"
          rules={[{ required: true, message: 'Please select bonus date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activePaymentTab}
          onChange={setActivePaymentTab}
          items={[
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
              key: 'bonus',
              label: (
                <span>
                  <DollarOutlined />
                  Bonus Management
                </span>
              ),
              children: renderBonusManagement(),
            },
          ]}
        />
      </Card>

      {/* Modals */}
      {renderSalaryModal()}
      {renderLoanModal()}
      {renderBonusModal()}
    </div>
  );
};

export default AdminPayment;