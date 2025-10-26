import React, { useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Space,
  Descriptions,
  Statistic,
  message,
  Radio,
  Spin
} from 'antd';
import {
  FileWordOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  DollarOutlined,
  BankOutlined,
  PieChartOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const AccountantReport = ({ dateRange }) => {
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null);

  const generatePayrollReport = async (format) => {
    setLoading(true);
    setActiveReport('payroll');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulated report data
      const reportData = {
        period: `${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`,
        totalSalary: 285000,
        records: 45,
        avgSalary: 6333,
        totalOT: 12500,
        totalBonus: 25000
      };

      if (format === 'docx') {
        // In real implementation, use docx library to generate Word document
        message.success('Payroll report (DOCX) generated successfully!');
      } else {
        // In real implementation, use xlsx library to generate Excel
        message.success('Payroll report (Excel) generated successfully!');
      }
      
      // Simulate download
      const filename = `payroll-report-${dayjs().format('YYYY-MM-DD')}.${format === 'docx' ? 'docx' : 'xlsx'}`;
      console.log('Downloading:', filename, reportData);
      
    } catch (error) {
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
      setActiveReport(null);
    }
  };

  const generateEPFReport = async (format) => {
    setLoading(true);
    setActiveReport('epf');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportData = {
        period: `${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`,
        totalEPF: 57000,
        totalETF: 8550,
        records: 45,
        employeeContribution: 22800,
        employerContribution: 34200
      };

      message.success(`EPF/ETF report (${format === 'docx' ? 'DOCX' : 'Excel'}) generated successfully!`);
      
      const filename = `epf-report-${dayjs().format('YYYY-MM-DD')}.${format === 'docx' ? 'docx' : 'xlsx'}`;
      console.log('Downloading:', filename, reportData);
      
    } catch (error) {
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
      setActiveReport(null);
    }
  };

  const generateLoanReport = async (format) => {
    setLoading(true);
    setActiveReport('loan');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportData = {
        period: `${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`,
        totalLoans: 12,
        totalAmount: 150000,
        pending: 5,
        approved: 6,
        rejected: 1
      };

      message.success(`Loan report (${format === 'docx' ? 'DOCX' : 'Excel'}) generated successfully!`);
      
      const filename = `loan-report-${dayjs().format('YYYY-MM-DD')}.${format === 'docx' ? 'docx' : 'xlsx'}`;
      console.log('Downloading:', filename, reportData);
      
    } catch (error) {
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
      setActiveReport(null);
    }
  };

  const generateFinancialSummary = async (format) => {
    setLoading(true);
    setActiveReport('financial');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportData = {
        period: `${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`,
        totalSalary: 285000,
        totalEPF: 57000,
        totalETF: 8550,
        totalBonus: 25000,
        totalOT: 12500,
        totalLaborCost: 388050
      };

      message.success(`Financial summary (${format === 'docx' ? 'DOCX' : 'Excel'}) generated successfully!`);
      
      const filename = `financial-summary-${dayjs().format('YYYY-MM-DD')}.${format === 'docx' ? 'docx' : 'xlsx'}`;
      console.log('Downloading:', filename, reportData);
      
    } catch (error) {
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
      setActiveReport(null);
    }
  };

  const reports = [
    {
      key: 'payroll',
      icon: <DollarOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'Payroll Report',
      description: 'Comprehensive payroll summary with employee details, salaries, OT, bonuses, and deductions',
      color: '#1890ff',
      onGenerate: generatePayrollReport
    },
    {
      key: 'epf',
      icon: <BankOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      title: 'EPF/ETF Report',
      description: 'Employee Provident Fund and Employer Trust Fund contributions breakdown',
      color: '#52c41a',
      onGenerate: generateEPFReport
    },
    {
      key: 'loan',
      icon: <PieChartOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      title: 'Loan Report',
      description: 'Employee loan requests, approvals, rejections, and repayment schedules',
      color: '#fa8c16',
      onGenerate: generateLoanReport
    },
    {
      key: 'financial',
      icon: <BarChartOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      title: 'Financial Summary',
      description: 'Complete financial overview with labor costs, contributions, and expenditure analysis',
      color: '#722ed1',
      onGenerate: generateFinancialSummary
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24, color: '#1a1a2e' }}>
        <DownloadOutlined /> Reports & Analytics
      </h1>

      <Card
        style={{ 
          marginBottom: 24, 
          borderRadius: 12,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        }}
      >
        <Row>
          <Col span={24}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <h2 style={{ color: '#fff', margin: 0 }}>Report Period</h2>
              <p style={{ color: '#fff', margin: 0, opacity: 0.9 }}>
                {dateRange[0].format('MMMM D, YYYY')} - {dateRange[1].format('MMMM D, YYYY')}
              </p>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {reports.map((report) => (
          <Col xs={24} lg={12} key={report.key}>
            <Card
              hoverable
              style={{
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: `2px solid ${report.color}15`,
                height: '100%'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <div style={{
                  background: `${report.color}15`,
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {report.icon}
                </div>

                <div>
                  <h3 style={{ margin: 0, color: '#1a1a2e' }}>{report.title}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                    {report.description}
                  </p>
                </div>

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Button
                    type="primary"
                    icon={<FileWordOutlined />}
                    onClick={() => report.onGenerate('docx')}
                    loading={loading && activeReport === report.key}
                    disabled={loading && activeReport !== report.key}
                    style={{ 
                      background: report.color,
                      borderColor: report.color,
                      flex: 1
                    }}
                  >
                    Generate DOCX
                  </Button>
                  <Button
                    icon={<FileExcelOutlined />}
                    onClick={() => report.onGenerate('excel')}
                    loading={loading && activeReport === report.key}
                    disabled={loading && activeReport !== report.key}
                    style={{
                      color: report.color,
                      borderColor: report.color,
                      flex: 1
                    }}
                  >
                    Generate Excel
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="Report Summary"
        style={{ 
          marginTop: 24, 
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Total Payroll">
            $285,000
          </Descriptions.Item>
          <Descriptions.Item label="Total EPF/ETF">
            $65,550
          </Descriptions.Item>
          <Descriptions.Item label="Active Employees">
            45
          </Descriptions.Item>
          <Descriptions.Item label="Pending Loans">
            5
          </Descriptions.Item>
          <Descriptions.Item label="Report Period">
            {dateRange[0].format('MMM D, YYYY')} to {dateRange[1].format('MMM D, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Generated On">
            {dayjs().format('MMMM D, YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Labor Cost"
              value={388050}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Average Salary"
              value={6333}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Bonus"
              value={25000}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total OT"
              value={12500}
              prefix="$"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>
      </Card>

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Card style={{ textAlign: 'center' }}>
            <Space direction="vertical" size={16}>
              <Spin size="large" />
              <div>
                <h3>Generating Report...</h3>
                <p>Please wait while we prepare your report</p>
              </div>
            </Space>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccountantReport;