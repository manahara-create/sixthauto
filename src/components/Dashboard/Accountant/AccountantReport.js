import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Space,
  Descriptions,
  Statistic,
  message,
  Spin,
  DatePicker,
  Select
} from 'antd';
import {
  FileWordOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  DollarOutlined,
  BankOutlined,
  PieChartOutlined,
  BarChartOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../../services/supabase';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AccountantReport = ({ dateRange, onRefresh, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState({});
  const [reportPeriod, setReportPeriod] = useState(dateRange);
  const [reportType, setReportType] = useState('monthly');

  useEffect(() => {
    fetchReportSummary();
  }, [reportPeriod, reportType]);

  const fetchReportSummary = async () => {
    try {
      const startDate = reportPeriod[0].format('YYYY-MM-DD');
      const endDate = reportPeriod[1].format('YYYY-MM-DD');

      // Fetch payroll summary
      const { data: payrollData, error: payrollError } = await supabase
        .from('salary')
        .select('totalsalary, basicsalary, otpay, bonuspay')
        .gte('salarydate', startDate)
        .lte('salarydate', endDate);

      if (payrollError) throw payrollError;

      // Fetch EPF/ETF summary
      const { data: epfData, error: epfError } = await supabase
        .from('epf_contributions')
        .select('totalcontribution')
        .gte('month', startDate)
        .lte('month', endDate);

      const { data: etfData, error: etfError } = await supabase
        .from('etf_contributions')
        .select('employercontribution')
        .gte('month', startDate)
        .lte('month', endDate);

      if (epfError) throw epfError;
      if (etfError) throw etfError;

      // Fetch loan summary
      const { data: loanData, error: loanError } = await supabase
        .from('loanrequest')
        .select('amount, status')
        .gte('date', startDate)
        .lte('date', endDate);

      if (loanError) throw loanError;

      // Fetch employee count
      const { count: employeeCount, error: employeeError } = await supabase
        .from('employee')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');

      if (employeeError) throw employeeError;

      const totalSalary = payrollData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0;
      const totalOT = payrollData?.reduce((sum, item) => sum + (item.otpay || 0), 0) || 0;
      const totalBonus = payrollData?.reduce((sum, item) => sum + (item.bonuspay || 0), 0) || 0;
      const totalEPF = epfData?.reduce((sum, item) => sum + (item.totalcontribution || 0), 0) || 0;
      const totalETF = etfData?.reduce((sum, item) => sum + (item.employercontribution || 0), 0) || 0;
      const pendingLoans = loanData?.filter(loan => loan.status === 'pending').length || 0;

      setReportData({
        totalSalary,
        totalOT,
        totalBonus,
        totalEPF,
        totalETF,
        totalLaborCost: totalSalary + totalEPF + totalETF + totalBonus,
        employeeCount: employeeCount || 0,
        pendingLoans,
        avgSalary: payrollData?.length > 0 ? Math.round(totalSalary / payrollData.length) : 0,
        records: payrollData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching report summary:', error);
      message.error('Failed to load report data');
    }
  };

  const generatePayrollReport = async (format) => {
    setLoading(true);
    setActiveReport('payroll');
    try {
      const startDate = reportPeriod[0].format('YYYY-MM-DD');
      const endDate = reportPeriod[1].format('YYYY-MM-DD');

      // Fetch detailed payroll data
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
          employee:employee(full_name, department)
        `)
        .gte('salarydate', startDate)
        .lte('salarydate', endDate)
        .order('salarydate', { ascending: false });

      if (error) throw error;

      // Save report record
      const { data: reportRecord, error: reportError } = await supabase
        .from('reports')
        .insert({
          name: `Payroll Report - ${reportPeriod[0].format('MMM D, YYYY')} to ${reportPeriod[1].format('MMM D, YYYY')}`,
          type: 'payroll',
          format: format,
          created_by: currentUser?.id,
          status: 'completed',
          config: {
            period: { start: startDate, end: endDate },
            recordCount: data.length,
            totalAmount: reportData.totalSalary
          }
        })
        .select();

      if (reportError) throw reportError;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'GENERATE_PAYROLL_REPORT',
          record_id: reportRecord[0].reportid,
          accountant_id: currentUser?.id,
          details: `Generated payroll report (${format}) for period ${startDate} to ${endDate}`,
          operation_time: new Date().toISOString()
        });

      // Simulate file generation and download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const filename = `payroll-report-${dayjs().format('YYYY-MM-DD')}.${format === 'docx' ? 'docx' : 'xlsx'}`;
      
      // Create a blob and download link (simulated)
      const blob = new Blob([JSON.stringify({
        reportData: data,
        summary: reportData,
        period: `${reportPeriod[0].format('MMM D, YYYY')} - ${reportPeriod[1].format('MMM D, YYYY')}`
      })], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      message.success(`Payroll report (${format.toUpperCase()}) generated successfully!`);
      
    } catch (error) {
      console.error('Error generating payroll report:', error);
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
      const startDate = reportPeriod[0].format('YYYY-MM-DD');
      const endDate = reportPeriod[1].format('YYYY-MM-DD');

      // Fetch EPF/ETF data
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
          employee:employee(full_name, department)
        `)
        .gte('month', startDate)
        .lte('month', endDate)
        .order('month', { ascending: false });

      const { data: etfData, error: etfError } = await supabase
        .from('etf_contributions')
        .select(`
          id,
          empid,
          basicsalary,
          employercontribution,
          month,
          employee:employee(full_name, department)
        `)
        .gte('month', startDate)
        .lte('month', endDate)
        .order('month', { ascending: false });

      if (epfError) throw epfError;
      if (etfError) throw etfError;

      // Save report record
      const { data: reportRecord, error: reportError } = await supabase
        .from('reports')
        .insert({
          name: `EPF/ETF Report - ${reportPeriod[0].format('MMM D, YYYY')} to ${reportPeriod[1].format('MMM D, YYYY')}`,
          type: 'epf_etf',
          format: format,
          created_by: currentUser?.id,
          status: 'completed',
          config: {
            period: { start: startDate, end: endDate },
            epfRecords: epfData.length,
            etfRecords: etfData.length,
            totalEPF: reportData.totalEPF,
            totalETF: reportData.totalETF
          }
        })
        .select();

      if (reportError) throw reportError;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'GENERATE_EPF_REPORT',
          record_id: reportRecord[0].reportid,
          accountant_id: currentUser?.id,
          details: `Generated EPF/ETF report (${format}) for period ${startDate} to ${endDate}`,
          operation_time: new Date().toISOString()
        });

      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success(`EPF/ETF report (${format.toUpperCase()}) generated successfully!`);
      
    } catch (error) {
      console.error('Error generating EPF report:', error);
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
      const startDate = reportPeriod[0].format('YYYY-MM-DD');
      const endDate = reportPeriod[1].format('YYYY-MM-DD');

      // Fetch loan data
      const { data, error } = await supabase
        .from('loanrequest')
        .select(`
          loanrequestid,
          empid,
          amount,
          duration,
          interestrate,
          date,
          status,
          processedat,
          employee:employee(full_name, department),
          loantype:loantype(loantype)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Save report record
      const { data: reportRecord, error: reportError } = await supabase
        .from('reports')
        .insert({
          name: `Loan Report - ${reportPeriod[0].format('MMM D, YYYY')} to ${reportPeriod[1].format('MMM D, YYYY')}`,
          type: 'loan',
          format: format,
          created_by: currentUser?.id,
          status: 'completed',
          config: {
            period: { start: startDate, end: endDate },
            totalLoans: data.length,
            pendingLoans: data.filter(loan => loan.status === 'pending').length,
            approvedLoans: data.filter(loan => loan.status === 'approved').length,
            totalAmount: data.reduce((sum, loan) => sum + (loan.amount || 0), 0)
          }
        })
        .select();

      if (reportError) throw reportError;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'GENERATE_LOAN_REPORT',
          record_id: reportRecord[0].reportid,
          accountant_id: currentUser?.id,
          details: `Generated loan report (${format}) for period ${startDate} to ${endDate}`,
          operation_time: new Date().toISOString()
        });

      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success(`Loan report (${format.toUpperCase()}) generated successfully!`);
      
    } catch (error) {
      console.error('Error generating loan report:', error);
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
      const startDate = reportPeriod[0].format('YYYY-MM-DD');
      const endDate = reportPeriod[1].format('YYYY-MM-DD');

      // Save report record
      const { data: reportRecord, error: reportError } = await supabase
        .from('reports')
        .insert({
          name: `Financial Summary - ${reportPeriod[0].format('MMM D, YYYY')} to ${reportPeriod[1].format('MMM D, YYYY')}`,
          type: 'financial_summary',
          format: format,
          created_by: currentUser?.id,
          status: 'completed',
          config: {
            period: { start: startDate, end: endDate },
            summary: reportData
          }
        })
        .select();

      if (reportError) throw reportError;

      // Log operation
      await supabase
        .from('accountant_operations')
        .insert({
          operation: 'GENERATE_FINANCIAL_REPORT',
          record_id: reportRecord[0].reportid,
          accountant_id: currentUser?.id,
          details: `Generated financial summary (${format}) for period ${startDate} to ${endDate}`,
          operation_time: new Date().toISOString()
        });

      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success(`Financial summary (${format.toUpperCase()}) generated successfully!`);
      
    } catch (error) {
      console.error('Error generating financial summary:', error);
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
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <h2 style={{ color: '#fff', margin: 0 }}>Report Period</h2>
              <p style={{ color: '#fff', margin: 0, opacity: 0.9 }}>
                {reportPeriod[0].format('MMMM D, YYYY')} - {reportPeriod[1].format('MMMM D, YYYY')}
              </p>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ color: '#fff', marginBottom: 8 }}>Select Period</div>
              <RangePicker
                value={reportPeriod}
                onChange={setReportPeriod}
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
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
            ${reportData.totalSalary?.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Total EPF/ETF">
            ${(reportData.totalEPF + reportData.totalETF)?.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Active Employees">
            {reportData.employeeCount}
          </Descriptions.Item>
          <Descriptions.Item label="Pending Loans">
            {reportData.pendingLoans}
          </Descriptions.Item>
          <Descriptions.Item label="Report Period">
            {reportPeriod[0].format('MMM D, YYYY')} to {reportPeriod[1].format('MMM D, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Generated On">
            {dayjs().format('MMMM D, YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Labor Cost"
              value={reportData.totalLaborCost}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Average Salary"
              value={reportData.avgSalary}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Bonus"
              value={reportData.totalBonus}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total OT"
              value={reportData.totalOT}
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