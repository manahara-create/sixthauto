import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Typography, Tag, Button, Space,
  Statistic, Progress, Modal, Form, Input, Select, DatePicker,
  InputNumber, message, Popconfirm
} from 'antd';
import {
  DollarOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, FileTextOutlined, DownloadOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CEOPayment = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [financialOverview, setFinancialOverview] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
    fetchFinancialOverview();
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

      const approvals = [
        ...(leaveRequests || []).map(req => ({
          ...req,
          type: 'leave',
          title: `Leave Request - ${employeeMap[req.empid]?.full_name || 'Unknown'}`,
          description: `${req.leavetype || 'Unknown'} - ${req.duration || 0} days`,
          employee_name: employeeMap[req.empid]?.full_name || 'Unknown',
          employee_role: employeeMap[req.empid]?.role || 'Unknown',
        })),
        ...(loanRequests || []).map(req => ({
          ...req,
          type: 'loan',
          title: `Loan Request - ${employeeMap[req.empid]?.full_name || 'Unknown'}`,
          description: `$${req.amount || 0} - ${req.loantype || 'Unknown'}`,
          employee_name: employeeMap[req.empid]?.full_name || 'Unknown',
          employee_role: employeeMap[req.empid]?.role || 'Unknown',
        }))
      ];

      setPendingApprovals(approvals);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      message.error('Failed to fetch pending approvals');
      setPendingApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialOverview = async () => {
    try {
      const { data: financialData } = await supabase
        .from('financialreports')
        .select('*')
        .order('quarterenddate', { ascending: false })
        .limit(2);

      const currentRevenue = financialData?.[0]?.totalrevenue || 1250000;
      const previousRevenue = financialData?.[1]?.totalrevenue || 1000000;
      const revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);

      setFinancialOverview({
        marketShare: 18.5,
        employeeRetention: 94,
        revenueGrowth: parseFloat(revenueGrowth),
        operatingMargin: 28.5
      });
    } catch (error) {
      console.error('Error fetching financial overview:', error);
      setFinancialOverview({
        marketShare: 18.5,
        employeeRetention: 94,
        revenueGrowth: 22.3,
        operatingMargin: 28.5
      });
    }
  };

  const handleApproval = async (type, id, status, remarks = '') => {
    try {
      if (type === 'leave') {
        const { error } = await supabase
          .from('employeeleave')
          .update({
            leavestatus: status,
            approvedby: profile.empid,
            remarks: remarks
          })
          .eq('leaveid', id);

        if (error) throw error;
      } else if (type === 'loan') {
        const { error } = await supabase
          .from('loanrequest')
          .update({
            status: status,
            processedby: profile.empid,
            processedat: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            remarks: remarks
          })
          .eq('loanrequestid', id);

        if (error) throw error;
      }

      await supabase
        .from('audit_logs')
        .insert([{
          user_id: profile.empid,
          action: `${type}_approval`,
          table_name: type === 'leave' ? 'employeeleave' : 'loanrequest',
          record_id: id,
          new_values: { status, approved_by: profile.empid, remarks }
        }]);

      message.success(`Request ${status} successfully!`);
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error('Failed to process request');
    }
  };

  const exportToExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Approvals');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const approvalColumns = [
    {
      title: 'Request Details',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary">{record.description}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Submitted: {dayjs(record.created_at).format('DD/MM/YYYY HH:mm')}
          </Text>
        </Space>
      )
    },
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.employee_role}</Text>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'leave' ? 'blue' : 'green'} style={{ fontWeight: 'bold' }}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Duration/Amount',
      key: 'details',
      render: (record) => (
        <Text strong style={{ color: record.type === 'loan' ? '#f50' : '#52c41a' }}>
          {record.type === 'leave' ? `${record.duration} days` : `$${record.amount}`}
        </Text>
      )
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
            onClick={() => handleApproval(record.type, record.leaveid || record.loanrequestid, 'approved')}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleApproval(record.type, record.leaveid || record.loanrequestid, 'rejected')}
          >
            Reject
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Title level={2}>Payment & Approvals</Title>
          </Card>
        </Col>

        {/* Financial Overview */}
        <Col span={24}>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Market Share"
                  value={financialOverview.marketShare}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Employee Retention"
                  value={financialOverview.employeeRetention}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Revenue Growth"
                  value={financialOverview.revenueGrowth}
                  suffix="%"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Operating Margin"
                  value={financialOverview.operatingMargin}
                  suffix="%"
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Pending Approvals */}
        <Col span={24}>
          <Card
            title="Pending Approvals"
            extra={
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportToExcel(pendingApprovals, 'pending_approvals')}
              >
                Export
              </Button>
            }
          >
            <Table
              columns={approvalColumns}
              dataSource={pendingApprovals}
              rowKey={record => `${record.type}_${record.leaveid || record.loanrequestid}`}
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CEOPayment;