import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Typography, Tag, Button, Space,
  Statistic, Modal, Form, Select, InputNumber, DatePicker,
  message, Popconfirm
} from 'antd';
import {
  DollarOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, DownloadOutlined, FileTextOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;

const HRPayments = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [bonusData, setBonusData] = useState([]);

  useEffect(() => {
    fetchPendingApprovals();
    fetchSalaryData();
    fetchBonusData();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      
      const { data: leaveRequests, error: leaveError } = await supabase
        .from('employeeleave')
        .select('*')
        .eq('leavestatus', 'pending')
        .order('created_at', { ascending: false });

      if (leaveError) throw leaveError;

      const { data: loanRequests, error: loanError } = await supabase
        .from('loanrequest')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (loanError) throw loanError;

      const leaveEmpIds = [...new Set(leaveRequests?.map(l => l.empid).filter(Boolean))];
      const loanEmpIds = [...new Set(loanRequests?.map(l => l.empid).filter(Boolean))];
      const allEmpIds = [...new Set([...leaveEmpIds, ...loanEmpIds])];

      let employeeData = [];
      if (allEmpIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name, role, department')
          .in('empid', allEmpIds);
        employeeData = empData || [];
      }

      const employeeMap = {};
      employeeData.forEach(emp => {
        employeeMap[emp.empid] = emp;
      });

      const leavesWithEmployee = leaveRequests?.map(leave => ({
        ...leave,
        employee: employeeMap[leave.empid] || {
          full_name: 'Unknown Employee',
          role: 'Unknown',
          department: 'Unknown'
        }
      })) || [];

      const loansWithEmployee = loanRequests?.map(loan => ({
        ...loan,
        employee: employeeMap[loan.empid] || {
          full_name: 'Unknown Employee',
          role: 'Unknown',
          department: 'Unknown'
        }
      })) || [];

      setPendingLeaves(leavesWithEmployee);
      setPendingLoans(loansWithEmployee);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      message.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryData = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select('*, employee(full_name, department)')
        .order('salarydate', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSalaryData(data || []);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      setSalaryData([]);
    }
  };

  const fetchBonusData = async () => {
    try {
      const { data, error } = await supabase
        .from('bonus')
        .select('*, employee(full_name, department)')
        .order('bonusdate', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBonusData(data || []);
    } catch (error) {
      console.error('Error fetching bonus data:', error);
      setBonusData([]);
    }
  };

  const handleLeaveApproval = async (leaveId, status, employeeName) => {
    try {
      const { error } = await supabase
        .from('employeeleave')
        .update({
          leavestatus: status,
          approvedby: profile.empid
        })
        .eq('leaveid', leaveId);

      if (error) throw error;

      await supabase
        .from('hr_operations')
        .insert([{
          operation: `${status.toUpperCase()}_LEAVE`,
          record_id: leaveId,
          hr_id: profile.empid,
          target_employee_id: leaveId,
          details: { employeeName, status },
          operation_time: new Date().toISOString()
        }]);

      message.success(`Leave ${status} successfully!`);
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error processing leave:', error);
      message.error('Failed to process leave');
    }
  };

  const handleLoanApproval = async (loanId, status, employeeName) => {
    try {
      const { error } = await supabase
        .from('loanrequest')
        .update({
          status: status,
          processedby: profile.empid,
          processedat: dayjs().format('YYYY-MM-DD HH:mm:ss')
        })
        .eq('loanrequestid', loanId);

      if (error) throw error;

      await supabase
        .from('hr_operations')
        .insert([{
          operation: `${status.toUpperCase()}_LOAN`,
          record_id: loanId,
          hr_id: profile.empid,
          target_employee_id: loanId,
          details: { employeeName, status },
          operation_time: new Date().toISOString()
        }]);

      message.success(`Loan ${status} successfully!`);
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error processing loan:', error);
      message.error('Failed to process loan');
    }
  };

  const exportToExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const leaveColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee_name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee?.department} • {record.employee?.role}
          </Text>
        </Space>
      )
    },
    {
      title: 'Leave Type',
      dataIndex: 'leavetype',
      key: 'leavetype'
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} days`
    },
    {
      title: 'Date Range',
      key: 'date_range',
      render: (record) => (
        <Text>
          {dayjs(record.leavefromdate).format('MMM D')} - {dayjs(record.leavetodate).format('MMM D, YYYY')}
        </Text>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'leavereason',
      key: 'leavereason',
      ellipsis: true
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleLeaveApproval(record.leaveid, 'approved', record.employee?.full_name)}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleLeaveApproval(record.leaveid, 'rejected', record.employee?.full_name)}
          >
            Reject
          </Button>
        </Space>
      )
    }
  ];

  const loanColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee_name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee?.department} • {record.employee?.role}
          </Text>
        </Space>
      )
    },
    {
      title: 'Loan Type',
      dataIndex: 'loantype',
      key: 'loantype'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `LKR ${amount?.toLocaleString()}`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} months`
    },
    {
      title: 'Applied Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleLoanApproval(record.loanrequestid, 'approved', record.employee?.full_name)}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleLoanApproval(record.loanrequestid, 'rejected', record.employee?.full_name)}
          >
            Reject
          </Button>
        </Space>
      )
    }
  ];

  const salaryColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee_name'
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department'
    },
    {
      title: 'Salary Date',
      dataIndex: 'salarydate',
      key: 'salarydate',
      render: (date) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (salary) => `LKR ${salary?.toLocaleString()}`
    },
    {
      title: 'Total Salary',
      dataIndex: 'totalsalary',
      key: 'totalsalary',
      render: (salary) => <Text strong>LKR {salary?.toLocaleString()}</Text>
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="green">Processed</Tag>
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Payments & Approvals</Title>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportToExcel([...pendingLeaves, ...pendingLoans, ...salaryData], 'payments_data')}
            >
              Export All Data
            </Button>
          </Col>
        </Row>

        {/* Pending Leave Approvals */}
        <Card 
          title="Pending Leave Approvals" 
          style={{ marginBottom: 24 }}
          extra={
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportToExcel(pendingLeaves, 'pending_leaves')}
            >
              Export
            </Button>
          }
        >
          <Table
            columns={leaveColumns}
            dataSource={pendingLeaves}
            rowKey="leaveid"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Pending Loan Approvals */}
        <Card 
          title="Pending Loan Approvals" 
          style={{ marginBottom: 24 }}
          extra={
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportToExcel(pendingLoans, 'pending_loans')}
            >
              Export
            </Button>
          }
        >
          <Table
            columns={loanColumns}
            dataSource={pendingLoans}
            rowKey="loanrequestid"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Salary History */}
        <Card 
          title="Recent Salary Payments"
          extra={
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportToExcel(salaryData, 'salary_history')}
            >
              Export
            </Button>
          }
        >
          <Table
            columns={salaryColumns}
            dataSource={salaryData}
            rowKey="salaryid"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default HRPayments;