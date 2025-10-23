import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  List,
  Typography,
  Tag,
  Button,
  Space,
  Progress,
  Table,
  Tooltip,
  Alert,
  Tabs,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Divider,
  Timeline,
  Badge,
  message,
  Upload,
  Radio,
  Switch,
  Descriptions,
  Popconfirm,
  Steps,
  Collapse,
  Empty
} from 'antd';
import {
  DollarOutlined,
  PieChartOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalculatorOutlined,
  DownloadOutlined,
  HistoryOutlined,
  TeamOutlined,
  BankOutlined,
  PercentageOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SafetyCertificateOutlined,
  CalculatorFilled
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Step } = Steps;
const { Panel } = Collapse;

const AccountantDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for all features
  const [financialData, setFinancialData] = useState({});
  const [payrollData, setPayrollData] = useState([]);
  const [epfContributions, setEpfContributions] = useState([]);
  const [etfContributions, setEtfContributions] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [salaryCalculations, setSalaryCalculations] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  const [bonusData, setBonusData] = useState([]);
  const [otData, setOtData] = useState([]);
  const [kpiData, setKpiData] = useState([]);

  // Modal states
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [epfModalVisible, setEpfModalVisible] = useState(false);
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const [otModalVisible, setOtModalVisible] = useState(false);
  const [kpiModalVisible, setKpiModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [loanEligibilityModalVisible, setLoanEligibilityModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form states
  const [salaryForm] = Form.useForm();
  const [epfForm] = Form.useForm();
  const [bonusForm] = Form.useForm();
  const [otForm] = Form.useForm();
  const [kpiForm] = Form.useForm();
  const [loanForm] = Form.useForm();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchFinancialData(),
        fetchPayrollData(),
        fetchEPFData(),
        fetchETFData(),
        fetchPendingPayments(),
        fetchRecentActivities(),
        fetchEmployees(),
        fetchSalaryCalculations(),
        fetchLoanRequests(),
        fetchLoanTypes(),
        fetchBonusData(),
        fetchOTData(),
        fetchKPIData()
      ]);
    } catch (error) {
      console.error('Error initializing accountant dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Data fetching functions
  const fetchFinancialData = async () => {
    try {
      const currentMonth = dayjs().format('YYYY-MM');
      
      // Total salary for current month
      const { data: salaryData } = await supabase
        .from('salary')
        .select('totalsalary, salarydate')
        .gte('salarydate', `${currentMonth}-01`)
        .lte('salarydate', `${currentMonth}-31`);

      // EPF contributions for current month
      const { data: epfData } = await supabase
        .from('epf_contributions')
        .select('totalcontribution')
        .gte('month', `${currentMonth}-01`)
        .lte('month', `${currentMonth}-31`)
        .eq('status', 'processed');

      // ETF contributions for current month
      const { data: etfData } = await supabase
        .from('etf_contributions')
        .select('employercontribution')
        .gte('month', `${currentMonth}-01`)
        .lte('month', `${currentMonth}-31`)
        .eq('status', 'processed');

      // Recent financial reports
      const { data: revenueData } = await supabase
        .from('financialreports')
        .select('totalrevenue')
        .order('quarterenddate', { ascending: false })
        .limit(1);

      // Pending loan requests
      const { data: pendingLoans } = await supabase
        .from('loanrequest')
        .select('loanrequestid')
        .eq('status', 'pending');

      const totalSalary = salaryData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0;
      const totalEPF = epfData?.reduce((sum, item) => sum + (item.totalcontribution || 0), 0) || 0;
      const totalETF = etfData?.reduce((sum, item) => sum + (item.employercontribution || 0), 0) || 0;

      setFinancialData({
        totalSalary,
        totalEPF,
        totalETF,
        totalRevenue: revenueData?.[0]?.totalrevenue || 0,
        pendingPaymentsCount: pendingPayments.length,
        pendingLoansCount: pendingLoans?.length || 0
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const fetchPayrollData = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (first_name, last_name, email, department),
          processed_by_employee:processed_by (first_name, last_name)
        `)
        .order('salarydate', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPayrollData(data || []);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    }
  };

  const fetchEPFData = async () => {
    try {
      const { data, error } = await supabase
        .from('epf_contributions')
        .select(`
          *,
          employee:empid (first_name, last_name),
          processed_by_employee:processed_by (first_name, last_name)
        `)
        .order('month', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEpfContributions(data || []);
    } catch (error) {
      console.error('Error fetching EPF data:', error);
    }
  };

  const fetchETFData = async () => {
    try {
      const { data, error } = await supabase
        .from('etf_contributions')
        .select(`
          *,
          employee:empid (first_name, last_name),
          processed_by_employee:processed_by (first_name, last_name)
        `)
        .order('month', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEtfContributions(data || []);
    } catch (error) {
      console.error('Error fetching ETF data:', error);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (first_name, last_name, department)
        `)
        .is('processed_by', null)
        .order('salarydate', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPendingPayments(data || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('accountant_operations')
        .select(`
          *,
          accountant:accountant_id (first_name, last_name)
        `)
        .order('operation_time', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, first_name, last_name, department, basicsalary, email, role')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSalaryCalculations = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (first_name, last_name),
          bonus:bonus_id (amount, type),
          ot:ot_id (amount, othours)
        `)
        .order('salarydate', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSalaryCalculations(data || []);
    } catch (error) {
      console.error('Error fetching salary calculations:', error);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('loanrequest')
        .select(`
          *,
          employee:empid (first_name, last_name, department, basicsalary),
          loantype:loantypeid (loantype, description)
        `)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLoanRequests(data || []);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
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

  const fetchBonusData = async () => {
    try {
      const { data, error } = await supabase
        .from('bonus')
        .select(`
          *,
          employee:empid (first_name, last_name, department)
        `)
        .order('bonusdate', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBonusData(data || []);
    } catch (error) {
      console.error('Error fetching bonus data:', error);
    }
  };

  const fetchOTData = async () => {
    try {
      const { data, error } = await supabase
        .from('ot')
        .select(`
          *,
          employee:empid (first_name, last_name, department)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOtData(data || []);
    } catch (error) {
      console.error('Error fetching OT data:', error);
    }
  };

  const fetchKPIData = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi')
        .select(`
          *,
          employee:empid (first_name, last_name, department),
          kpiranking:kpirankingid (kpirank)
        `)
        .order('calculatedate', { ascending: false })
        .limit(50);

      if (error) throw error;
      setKpiData(data || []);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  // Enhanced Action handlers
  const handleProcessSalary = async (values) => {
    try {
      const basicSalary = values.basicSalary || 0;
      const otPay = values.otHours * values.otRate || 0;
      const bonusPay = values.bonusAmount || 0;
      const incrementPay = values.incrementAmount || 0;
      const noPayDeduction = values.noPayDays * (basicSalary / 30) || 0;
      
      const totalSalary = basicSalary + otPay + bonusPay + incrementPay - noPayDeduction;

      const { data, error } = await supabase
        .from('salary')
        .insert([{
          empid: values.employeeId,
          basicsalary: basicSalary,
          otpay: otPay,
          bonuspay: bonusPay,
          incrementpay: incrementPay,
          totalsalary: totalSalary,
          salarydate: values.salaryDate.format('YYYY-MM-DD'),
          processed_by: profile.empid,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await logAccountantOperation('PROCESS_SALARY', data[0].salaryid, {
        employeeId: values.employeeId,
        totalSalary,
        components: { basicSalary, otPay, bonusPay, incrementPay, noPayDeduction }
      });

      message.success('Salary processed successfully!');
      setSalaryModalVisible(false);
      salaryForm.resetFields();
      await Promise.all([fetchPayrollData(), fetchFinancialData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error processing salary:', error);
      message.error('Failed to process salary');
    }
  };

  const handleProcessEPF = async (values) => {
    try {
      const employeeContribution = values.basicSalary * 0.08;
      const employerContribution = values.basicSalary * 0.12;
      const totalContribution = employeeContribution + employerContribution;

      const { data, error } = await supabase
        .from('epf_contributions')
        .insert([{
          empid: values.employeeId,
          basicsalary: values.basicSalary,
          employeecontribution: employeeContribution,
          employercontribution: employerContribution,
          totalcontribution: totalContribution,
          month: values.contributionMonth.format('YYYY-MM-DD'),
          processed_by: profile.empid,
          status: 'processed',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await logAccountantOperation('PROCESS_EPF', data[0].id, {
        employeeId: values.employeeId,
        totalContribution,
        employeeContribution,
        employerContribution
      });

      message.success('EPF contribution processed successfully!');
      setEpfModalVisible(false);
      epfForm.resetFields();
      await Promise.all([fetchEPFData(), fetchFinancialData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error processing EPF:', error);
      message.error('Failed to process EPF contribution');
    }
  };

  const handleProcessETF = async (values) => {
    try {
      const employerContribution = values.basicSalary * 0.03; // 3% ETF

      const { data, error } = await supabase
        .from('etf_contributions')
        .insert([{
          empid: values.employeeId,
          basicsalary: values.basicSalary,
          employercontribution: employerContribution,
          month: values.contributionMonth.format('YYYY-MM-DD'),
          processed_by: profile.empid,
          status: 'processed',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await logAccountantOperation('PROCESS_ETF', data[0].id, {
        employeeId: values.employeeId,
        employerContribution
      });

      message.success('ETF contribution processed successfully!');
      setEpfModalVisible(false);
      await Promise.all([fetchETFData(), fetchFinancialData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error processing ETF:', error);
      message.error('Failed to process ETF contribution');
    }
  };

  const handleAddBonus = async (values) => {
    try {
      const { data, error } = await supabase
        .from('bonus')
        .insert([{
          empid: values.employeeId,
          amount: values.amount,
          type: values.bonusType,
          reason: values.reason,
          bonusdate: values.bonusDate.format('YYYY-MM-DD'),
          processedby: profile.empid,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await logAccountantOperation('ADD_BONUS', data[0].bonusid, {
        employeeId: values.employeeId,
        amount: values.amount,
        type: values.bonusType
      });

      message.success('Bonus added successfully!');
      setBonusModalVisible(false);
      bonusForm.resetFields();
      await Promise.all([fetchBonusData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error adding bonus:', error);
      message.error('Failed to add bonus');
    }
  };

  const handleAddOT = async (values) => {
    try {
      const amount = values.othours * values.rate;

      const { data, error } = await supabase
        .from('ot')
        .insert([{
          empid: values.employeeId,
          othours: values.othours,
          rate: values.rate,
          amount: amount,
          type: values.otType,
          status: 'approved',
          processed_by: profile.empid,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await logAccountantOperation('ADD_OT', data[0].otid, {
        employeeId: values.employeeId,
        hours: values.othours,
        rate: values.rate,
        amount: amount
      });

      message.success('OT added successfully!');
      setOtModalVisible(false);
      otForm.resetFields();
      await Promise.all([fetchOTData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error adding OT:', error);
      message.error('Failed to add OT');
    }
  };

  const handleAddKPI = async (values) => {
    try {
      const { data, error } = await supabase
        .from('kpi')
        .insert([{
          empid: values.employeeId,
          kpivalue: values.kpivalue,
          calculatedate: values.calculateDate.format('YYYY-MM-DD'),
          kpiyear: dayjs().year(),
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await logAccountantOperation('ADD_KPI', data[0].kpiid, {
        employeeId: values.employeeId,
        kpiValue: values.kpivalue
      });

      message.success('KPI added successfully!');
      setKpiModalVisible(false);
      kpiForm.resetFields();
      await Promise.all([fetchKPIData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error adding KPI:', error);
      message.error('Failed to add KPI');
    }
  };

  const handleProcessLoan = async (values) => {
    try {
      const { data, error } = await supabase
        .from('loanrequest')
        .insert([{
          empid: values.employeeId,
          loantypeid: values.loanTypeId,
          amount: values.amount,
          duration: values.duration,
          interestrate: values.interestRate,
          date: values.loanDate.format('YYYY-MM-DD'),
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await logAccountantOperation('CREATE_LOAN', data[0].loanrequestid, {
        employeeId: values.employeeId,
        amount: values.amount,
        loanType: values.loanTypeId
      });

      message.success('Loan request created successfully!');
      setLoanModalVisible(false);
      loanForm.resetFields();
      await Promise.all([fetchLoanRequests(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error creating loan:', error);
      message.error('Failed to create loan request');
    }
  };

  const handleApproveLoan = async (loanId) => {
    try {
      const { error } = await supabase
        .from('loanrequest')
        .update({
          status: 'approved',
          processedby: profile.empid,
          processedat: new Date().toISOString()
        })
        .eq('loanrequestid', loanId);

      if (error) throw error;

      await logAccountantOperation('APPROVE_LOAN', loanId, {
        action: 'loan_approved'
      });

      message.success('Loan approved successfully!');
      await Promise.all([fetchLoanRequests(), fetchRecentActivities()]);
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
          processedby: profile.empid,
          processedat: new Date().toISOString()
        })
        .eq('loanrequestid', loanId);

      if (error) throw error;

      await logAccountantOperation('REJECT_LOAN', loanId, {
        action: 'loan_rejected'
      });

      message.success('Loan rejected successfully!');
      await Promise.all([fetchLoanRequests(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error rejecting loan:', error);
      message.error('Failed to reject loan');
    }
  };

  const handleProcessPayment = async (salaryId) => {
    try {
      const { error } = await supabase
        .from('salary')
        .update({
          processed_by: profile.empid,
          processed_at: new Date().toISOString()
        })
        .eq('salaryid', salaryId);

      if (error) throw error;

      await logAccountantOperation('PROCESS_PAYMENT', salaryId, {
        action: 'payment_processed'
      });

      message.success('Payment processed successfully!');
      await Promise.all([fetchPendingPayments(), fetchPayrollData(), fetchFinancialData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error('Failed to process payment');
    }
  };

  const handleCheckLoanEligibility = async (employeeId) => {
    try {
      const employee = employees.find(emp => emp.empid === employeeId);
      setSelectedEmployee(employee);
      setLoanEligibilityModalVisible(true);
    } catch (error) {
      console.error('Error checking loan eligibility:', error);
      message.error('Failed to check loan eligibility');
    }
  };

  const logAccountantOperation = async (operation, recordId, details) => {
    try {
      await supabase
        .from('accountant_operations')
        .insert([{
          operation,
          record_id: recordId,
          accountant_id: profile.empid,
          details,
          operation_time: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging operation:', error);
    }
  };

  // Enhanced Report Generation
  const generatePayrollReport = async (format = 'pdf') => {
    try {
      const { data: payrollData } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (first_name, last_name, department, email)
        `)
        .gte('salarydate', dayjs().startOf('month').format('YYYY-MM-DD'))
        .lte('salarydate', dayjs().endOf('month').format('YYYY-MM-DD'))
        .order('salarydate', { ascending: false });

      if (format === 'pdf') {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Monthly Payroll Report', 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Generated on: ${dayjs().format('MMMM D, YYYY')}`, 105, 25, { align: 'center' });
        doc.text(`Generated by: ${profile.first_name} ${profile.last_name}`, 105, 32, { align: 'center' });

        const totalSalary = payrollData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0;
        doc.setFontSize(14);
        doc.text(`Total Payroll: $${totalSalary.toLocaleString()}`, 14, 45);

        const tableData = payrollData?.map(item => [
          `${item.employee?.first_name} ${item.employee?.last_name}`,
          item.employee?.department,
          `$${item.basicsalary?.toLocaleString()}`,
          `$${item.otpay?.toLocaleString()}`,
          `$${item.bonuspay?.toLocaleString()}`,
          `$${item.totalsalary?.toLocaleString()}`,
          dayjs(item.salarydate).format('MMM D, YYYY')
        ]) || [];

        doc.autoTable({
          startY: 50,
          head: [['Employee', 'Department', 'Basic Salary', 'OT Pay', 'Bonus', 'Total Salary', 'Date']],
          body: tableData,
          theme: 'grid'
        });

        doc.save(`payroll-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(
          payrollData?.map(item => ({
            'Employee': `${item.employee?.first_name} ${item.employee?.last_name}`,
            'Department': item.employee?.department,
            'Basic Salary': item.basicsalary,
            'OT Pay': item.otpay,
            'Bonus Pay': item.bonuspay,
            'Total Salary': item.totalsalary,
            'Date': dayjs(item.salarydate).format('MMM D, YYYY')
          })) || []
        );
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
        XLSX.writeFile(workbook, `payroll-report-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      }

      message.success(`Payroll report generated successfully!`);
    } catch (error) {
      console.error('Error generating payroll report:', error);
      message.error('Failed to generate report');
    }
  };

  const generateEPFReport = async (format = 'pdf') => {
    try {
      const { data: epfData } = await supabase
        .from('epf_contributions')
        .select(`
          *,
          employee:empid (first_name, last_name, department)
        `)
        .gte('month', dayjs().startOf('month').format('YYYY-MM-DD'))
        .lte('month', dayjs().endOf('month').format('YYYY-MM-DD'))
        .order('month', { ascending: false });

      if (format === 'pdf') {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('EPF Contributions Report', 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Generated on: ${dayjs().format('MMMM D, YYYY')}`, 105, 25, { align: 'center' });

        const totalEPF = epfData?.reduce((sum, item) => sum + (item.totalcontribution || 0), 0) || 0;
        doc.setFontSize(14);
        doc.text(`Total EPF Contributions: $${totalEPF.toLocaleString()}`, 14, 40);

        const tableData = epfData?.map(item => [
          `${item.employee?.first_name} ${item.employee?.last_name}`,
          item.employee?.department,
          `$${item.basicsalary?.toLocaleString()}`,
          `$${item.employeecontribution?.toLocaleString()}`,
          `$${item.employercontribution?.toLocaleString()}`,
          `$${item.totalcontribution?.toLocaleString()}`,
          dayjs(item.month).format('MMM YYYY')
        ]) || [];

        doc.autoTable({
          startY: 45,
          head: [['Employee', 'Department', 'Basic Salary', 'Employee EPF', 'Employer EPF', 'Total', 'Month']],
          body: tableData,
          theme: 'grid'
        });

        doc.save(`epf-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(
          epfData?.map(item => ({
            'Employee': `${item.employee?.first_name} ${item.employee?.last_name}`,
            'Department': item.employee?.department,
            'Basic Salary': item.basicsalary,
            'Employee EPF (8%)': item.employeecontribution,
            'Employer EPF (12%)': item.employercontribution,
            'Total Contribution': item.totalcontribution,
            'Month': dayjs(item.month).format('MMM YYYY')
          })) || []
        );
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'EPF Contributions');
        XLSX.writeFile(workbook, `epf-report-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      }

      message.success(`EPF report generated successfully!`);
    } catch (error) {
      console.error('Error generating EPF report:', error);
      message.error('Failed to generate report');
    }
  };

  const generateLoanReport = async (format = 'pdf') => {
    try {
      const { data: loanData } = await supabase
        .from('loanrequest')
        .select(`
          *,
          employee:empid (first_name, last_name, department),
          loantype:loantypeid (loantype, description)
        `)
        .order('date', { ascending: false });

      if (format === 'pdf') {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Loan Requests Report', 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Generated on: ${dayjs().format('MMMM D, YYYY')}`, 105, 25, { align: 'center' });

        const totalLoans = loanData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const pendingLoans = loanData?.filter(item => item.status === 'pending').length || 0;
        
        doc.setFontSize(14);
        doc.text(`Total Loan Amount: $${totalLoans.toLocaleString()}`, 14, 40);
        doc.text(`Pending Requests: ${pendingLoans}`, 14, 48);

        const tableData = loanData?.map(item => [
          `${item.employee?.first_name} ${item.employee?.last_name}`,
          item.employee?.department,
          item.loantype?.loantype,
          `$${item.amount?.toLocaleString()}`,
          `${item.duration} months`,
          `${item.interestrate}%`,
          item.status,
          dayjs(item.date).format('MMM D, YYYY')
        ]) || [];

        doc.autoTable({
          startY: 55,
          head: [['Employee', 'Department', 'Loan Type', 'Amount', 'Duration', 'Interest', 'Status', 'Date']],
          body: tableData,
          theme: 'grid'
        });

        doc.save(`loan-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(
          loanData?.map(item => ({
            'Employee': `${item.employee?.first_name} ${item.employee?.last_name}`,
            'Department': item.employee?.department,
            'Loan Type': item.loantype?.loantype,
            'Amount': item.amount,
            'Duration (months)': item.duration,
            'Interest Rate': item.interestrate,
            'Status': item.status,
            'Date': dayjs(item.date).format('MMM D, YYYY')
          })) || []
        );
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Loan Requests');
        XLSX.writeFile(workbook, `loan-report-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      }

      message.success(`Loan report generated successfully!`);
    } catch (error) {
      console.error('Error generating loan report:', error);
      message.error('Failed to generate report');
    }
  };

  const generateFinancialSummary = async (format = 'pdf') => {
    try {
      const currentMonth = dayjs().format('YYYY-MM');
      
      // Get data for summary
      const { data: salaryData } = await supabase
        .from('salary')
        .select('totalsalary')
        .gte('salarydate', `${currentMonth}-01`)
        .lte('salarydate', `${currentMonth}-31`);

      const { data: epfData } = await supabase
        .from('epf_contributions')
        .select('totalcontribution')
        .gte('month', `${currentMonth}-01`)
        .lte('month', `${currentMonth}-31`);

      const { data: etfData } = await supabase
        .from('etf_contributions')
        .select('employercontribution')
        .gte('month', `${currentMonth}-01`)
        .lte('month', `${currentMonth}-31`);

      const { data: bonusData } = await supabase
        .from('bonus')
        .select('amount')
        .gte('bonusdate', `${currentMonth}-01`)
        .lte('bonusdate', `${currentMonth}-31`);

      const { data: otData } = await supabase
        .from('ot')
        .select('amount')
        .gte('created_at', `${currentMonth}-01`)
        .lte('created_at', `${currentMonth}-31`);

      const totalSalary = salaryData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0;
      const totalEPF = epfData?.reduce((sum, item) => sum + (item.totalcontribution || 0), 0) || 0;
      const totalETF = etfData?.reduce((sum, item) => sum + (item.employercontribution || 0), 0) || 0;
      const totalBonus = bonusData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const totalOT = otData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      if (format === 'pdf') {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Financial Summary Report', 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Period: ${dayjs().format('MMMM YYYY')}`, 105, 25, { align: 'center' });
        doc.text(`Generated on: ${dayjs().format('MMMM D, YYYY')}`, 105, 32, { align: 'center' });

        // Summary statistics
        doc.setFontSize(14);
        doc.text('Financial Overview', 14, 45);
        
        const summaryData = [
          ['Total Salary', `$${totalSalary.toLocaleString()}`],
          ['Total Bonus', `$${totalBonus.toLocaleString()}`],
          ['Total OT', `$${totalOT.toLocaleString()}`],
          ['Total EPF', `$${totalEPF.toLocaleString()}`],
          ['Total ETF', `$${totalETF.toLocaleString()}`],
          ['Total Labor Cost', `$${(totalSalary + totalEPF + totalETF).toLocaleString()}`]
        ];

        doc.autoTable({
          startY: 50,
          head: [['Category', 'Amount']],
          body: summaryData,
          theme: 'grid'
        });

        // Department breakdown
        const { data: deptData } = await supabase
          .from('salary')
          .select(`
            totalsalary,
            employee:empid (department)
          `)
          .gte('salarydate', `${currentMonth}-01`)
          .lte('salarydate', `${currentMonth}-31`);

        const deptBreakdown = {};
        deptData?.forEach(item => {
          const dept = item.employee?.department || 'Unknown';
          deptBreakdown[dept] = (deptBreakdown[dept] || 0) + (item.totalsalary || 0);
        });

        const deptTableData = Object.entries(deptBreakdown).map(([dept, amount]) => [
          dept,
          `$${amount.toLocaleString()}`,
          `${((amount / totalSalary) * 100).toFixed(1)}%`
        ]);

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 10,
          head: [['Department', 'Salary Cost', 'Percentage']],
          body: deptTableData,
          theme: 'grid'
        });

        doc.save(`financial-summary-${dayjs().format('YYYY-MM-DD')}.pdf`);
      }

      message.success(`Financial summary generated successfully!`);
    } catch (error) {
      console.error('Error generating financial summary:', error);
      message.error('Failed to generate report');
    }
  };

  // Enhanced Table Columns
  const payrollColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'first_name'],
      key: 'employee',
      render: (text, record) => 
        `${record.employee?.first_name} ${record.employee?.last_name}`
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department'
    },
    {
      title: 'Date',
      dataIndex: 'salarydate',
      key: 'salarydate',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (amount) => `$${amount?.toLocaleString()}`
    },
    {
      title: 'Total Salary',
      dataIndex: 'totalsalary',
      key: 'totalsalary',
      render: (amount) => `$${amount?.toLocaleString()}`
    },
    {
      title: 'Processed By',
      dataIndex: ['processed_by_employee', 'first_name'],
      key: 'processed_by',
      render: (text, record) => 
        record.processed_by_employee ? 
          `${record.processed_by_employee.first_name} ${record.processed_by_employee.last_name}` : 
          'Pending'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.processed_by ? 'green' : 'orange'}>
          {record.processed_by ? 'Processed' : 'Pending'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            disabled={record.processed_by}
            onClick={() => handleProcessPayment(record.salaryid)}
          >
            Process
          </Button>
          <Button 
            size="small"
            onClick={() => {
              // View details action
              message.info('View salary details');
            }}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const loanColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'first_name'],
      key: 'employee',
      render: (text, record) => 
        `${record.employee?.first_name} ${record.employee?.last_name}`
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department'
    },
    {
      title: 'Loan Type',
      dataIndex: ['loantype', 'loantype'],
      key: 'loantype'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount?.toLocaleString()}`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} months`
    },
    {
      title: 'Interest Rate',
      dataIndex: 'interestrate',
      key: 'interestrate',
      render: (rate) => `${rate}%`
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'approved' ? 'green' : 
          status === 'rejected' ? 'red' : 'orange'
        }>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button 
                type="primary" 
                size="small"
                onClick={() => handleApproveLoan(record.loanrequestid)}
              >
                Approve
              </Button>
              <Button 
                danger
                size="small"
                onClick={() => handleRejectLoan(record.loanrequestid)}
              >
                Reject
              </Button>
            </>
          )}
          <Button 
            size="small"
            onClick={() => handleCheckLoanEligibility(record.empid)}
          >
            Check Eligibility
          </Button>
        </Space>
      )
    }
  ];

  const bonusColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'first_name'],
      key: 'employee',
      render: (text, record) => 
        `${record.employee?.first_name} ${record.employee?.last_name}`
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount?.toLocaleString()}`
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: 'Date',
      dataIndex: 'bonusdate',
      key: 'bonusdate',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            icon={<EditOutlined />}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this bonus?"
            onConfirm={() => {/* Handle delete */}}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (!profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert message="Please log in to access the dashboard" type="warning" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Card size="small" style={{ 
        marginBottom: 16, 
        background: 'linear-gradient(135deg, #722ed1 0%, #391085 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <CalculatorFilled style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                Accountant Dashboard
              </Title>
              <Tag color="white" style={{ color: '#722ed1', fontWeight: 'bold' }}>
                {profile?.first_name} {profile?.last_name}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'white' }}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Welcome Alert */}
      <Alert
        message={`Welcome back, ${profile?.first_name || 'Accountant'}!`}
        description="Manage payroll, EPF/ETF contributions, loans, financial reports, and accounting operations."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          <OverviewTab 
            financialData={financialData}
            pendingPayments={pendingPayments}
            recentActivities={recentActivities}
            profile={profile}
            onProcessSalary={() => setSalaryModalVisible(true)}
            onGeneratePayrollReport={generatePayrollReport}
            onGenerateEPFReport={generateEPFReport}
            onGenerateLoanReport={generateLoanReport}
            loanRequests={loanRequests}
          />
        </TabPane>
        
        <TabPane tab="Payroll Management" key="payroll">
          <PayrollTab 
            payrollData={payrollData}
            pendingPayments={pendingPayments}
            payrollColumns={payrollColumns}
            onProcessSalary={() => setSalaryModalVisible(true)}
            onProcessPayment={handleProcessPayment}
          />
        </TabPane>
        
        <TabPane tab="EPF/ETF" key="epf">
          <EPFTab 
            epfContributions={epfContributions}
            etfContributions={etfContributions}
            onProcessEPF={() => setEpfModalVisible(true)}
            onGenerateEPFReport={generateEPFReport}
          />
        </TabPane>

        <TabPane tab="Loan Management" key="loans">
          <LoanTab 
            loanRequests={loanRequests}
            loanColumns={loanColumns}
            employees={employees}
            loanTypes={loanTypes}
            onProcessLoan={() => setLoanModalVisible(true)}
            onCheckEligibility={handleCheckLoanEligibility}
            onApproveLoan={handleApproveLoan}
            onRejectLoan={handleRejectLoan}
            onGenerateLoanReport={generateLoanReport}
          />
        </TabPane>

        <TabPane tab="Bonus & OT" key="bonus">
          <BonusOTTab 
            bonusData={bonusData}
            otData={otData}
            bonusColumns={bonusColumns}
            onAddBonus={() => setBonusModalVisible(true)}
            onAddOT={() => setOtModalVisible(true)}
          />
        </TabPane>

        <TabPane tab="KPI Management" key="kpi">
          <KPITab 
            kpiData={kpiData}
            onAddKPI={() => setKpiModalVisible(true)}
          />
        </TabPane>
        
        <TabPane tab="Reports & Analytics" key="reports">
          <ReportsTab 
            onGeneratePayrollReport={generatePayrollReport}
            onGenerateEPFReport={generateEPFReport}
            onGenerateLoanReport={generateLoanReport}
            onGenerateFinancialSummary={generateFinancialSummary}
            financialData={financialData}
            payrollData={payrollData}
            loanRequests={loanRequests}
          />
        </TabPane>
        
        <TabPane tab="Recent Activities" key="activities">
          <ActivitiesTab recentActivities={recentActivities} />
        </TabPane>
      </Tabs>

      {/* Salary Processing Modal */}
      <Modal
        title="Process Salary"
        open={salaryModalVisible}
        onCancel={() => setSalaryModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={salaryForm} layout="vertical" onFinish={handleProcessSalary}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
                <Select placeholder="Select employee" showSearch>
                  {employees.map(emp => (
                    <Option key={emp.empid} value={emp.empid}>
                      {emp.first_name} {emp.last_name} - {emp.department}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryDate" label="Salary Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Salary Components</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true }]}>
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="otHours" label="OT Hours">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="otRate" label="OT Rate per Hour">
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bonusAmount" label="Bonus Amount">
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="incrementAmount" label="Increment Amount">
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="noPayDays" label="No Pay Days">
                <InputNumber style={{ width: '100%' }} min={0} max={31} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Process Salary
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* EPF Processing Modal */}
      <Modal
        title="Process EPF/ETF Contribution"
        open={epfModalVisible}
        onCancel={() => setEpfModalVisible(false)}
        footer={null}
        width={600}
      >
        <Tabs defaultActiveKey="epf">
          <TabPane tab="EPF Contribution" key="epf">
            <Form form={epfForm} layout="vertical" onFinish={handleProcessEPF}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
                    <Select placeholder="Select employee" showSearch>
                      {employees.map(emp => (
                        <Option key={emp.empid} value={emp.empid}>
                          {emp.first_name} {emp.last_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contributionMonth" label="Contribution Month" rules={[{ required: true }]}>
                    <DatePicker picker="month" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true }]}>
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>

              <Alert
                message="EPF Calculation"
                description="Employee: 8% | Employer: 12% | Total: 20% of basic salary"
                type="info"
                style={{ marginBottom: 16 }}
              />

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Process EPF Contribution
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="ETF Contribution" key="etf">
            <Form layout="vertical" onFinish={handleProcessETF}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
                    <Select placeholder="Select employee" showSearch>
                      {employees.map(emp => (
                        <Option key={emp.empid} value={emp.empid}>
                          {emp.first_name} {emp.last_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contributionMonth" label="Contribution Month" rules={[{ required: true }]}>
                    <DatePicker picker="month" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true }]}>
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>

              <Alert
                message="ETF Calculation"
                description="Employer: 3% of basic salary"
                type="info"
                style={{ marginBottom: 16 }}
              />

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Process ETF Contribution
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Modal>

      {/* Bonus Modal */}
      <Modal
        title="Add Bonus"
        open={bonusModalVisible}
        onCancel={() => setBonusModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={bonusForm} layout="vertical" onFinish={handleAddBonus}>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee" showSearch>
              {employees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="bonusType" label="Bonus Type" rules={[{ required: true }]}>
            <Select placeholder="Select bonus type">
              <Option value="performance">Performance Bonus</Option>
              <Option value="annual">Annual Bonus</Option>
              <Option value="special">Special Bonus</Option>
              <Option value="festival">Festival Bonus</Option>
            </Select>
          </Form.Item>

          <Form.Item name="amount" label="Bonus Amount" rules={[{ required: true }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="bonusDate" label="Bonus Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="reason" label="Reason">
            <TextArea rows={3} placeholder="Enter reason for bonus" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Bonus
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* OT Modal */}
      <Modal
        title="Add Overtime"
        open={otModalVisible}
        onCancel={() => setOtModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={otForm} layout="vertical" onFinish={handleAddOT}>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee" showSearch>
              {employees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="otType" label="OT Type" rules={[{ required: true }]}>
            <Select placeholder="Select OT type">
              <Option value="weekday">Weekday OT</Option>
              <Option value="weekend">Weekend OT</Option>
              <Option value="holiday">Holiday OT</Option>
            </Select>
          </Form.Item>

          <Form.Item name="othours" label="OT Hours" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
          </Form.Item>

          <Form.Item name="rate" label="OT Rate per Hour" rules={[{ required: true }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              formatter={value => `$ ${value}`}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Overtime
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* KPI Modal */}
      <Modal
        title="Add KPI"
        open={kpiModalVisible}
        onCancel={() => setKpiModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={kpiForm} layout="vertical" onFinish={handleAddKPI}>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee" showSearch>
              {employees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.first_name} {emp.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="kpivalue" label="KPI Value" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>

          <Form.Item name="calculateDate" label="Calculation Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add KPI
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Loan Modal */}
      <Modal
        title="Create Loan Request"
        open={loanModalVisible}
        onCancel={() => setLoanModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={loanForm} layout="vertical" onFinish={handleProcessLoan}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
                <Select placeholder="Select employee" showSearch>
                  {employees.map(emp => (
                    <Option key={emp.empid} value={emp.empid}>
                      {emp.first_name} {emp.last_name} - {emp.department}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="loanTypeId" label="Loan Type" rules={[{ required: true }]}>
                <Select placeholder="Select loan type">
                  {loanTypes.map(loanType => (
                    <Option key={loanType.loantypeid} value={loanType.loantypeid}>
                      {loanType.loantype}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="Loan Amount" rules={[{ required: true }]}>
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="Duration (months)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={60} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="interestRate" label="Interest Rate (%)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="loanDate" label="Loan Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Create Loan Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Loan Eligibility Modal */}
      <Modal
        title="Loan Eligibility Check"
        open={loanEligibilityModalVisible}
        onCancel={() => setLoanEligibilityModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedEmployee && (
          <LoanEligibilityCheck 
            employee={selectedEmployee}
            loanTypes={loanTypes}
          />
        )}
      </Modal>
    </div>
  );
};

// Enhanced Tab Components
const OverviewTab = ({ financialData, pendingPayments, recentActivities, profile, onProcessSalary, onGeneratePayrollReport, onGenerateEPFReport, onGenerateLoanReport, loanRequests }) => {
  const chartData = {
    payrollTrend: [65000, 72000, 68000, 75000, 80000, 78000],
    epfContributions: [12000, 13500, 12800, 14200, 15000, 14500],
    loanDistribution: [25000, 18000, 22000, 30000, 15000]
  };

  return (
    <div>
      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Salary (Monthly)"
              value={financialData.totalSalary}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={value => `$${Number(value).toLocaleString()}`}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Current month</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="EPF/ETF Contributions"
              value={financialData.totalEPF + financialData.totalETF}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={value => `$${Number(value).toLocaleString()}`}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">EPF 20% + ETF 3%</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Payments"
              value={financialData.pendingPaymentsCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Awaiting processing</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Loans"
              value={financialData.pendingLoansCount}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Loan requests</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Quick Actions" size="small">
            <Space wrap>
              <Button type="primary" icon={<CalculatorOutlined />} onClick={onProcessSalary}>
                Process Salary
              </Button>
              <Button icon={<BankOutlined />} onClick={() => {}}>
                Process EPF/ETF
              </Button>
              <Button icon={<BankOutlined />} onClick={() => {}}>
                Create Loan
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => onGeneratePayrollReport('pdf')}>
                Payroll Report
              </Button>
              <Button icon={<FileTextOutlined />} onClick={() => onGenerateEPFReport('pdf')}>
                EPF Report
              </Button>
              <Button icon={<FileExcelOutlined />} onClick={() => onGenerateLoanReport('excel')}>
                Loan Report
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activities" size="small">
            <Timeline>
              {recentActivities.slice(0, 5).map((activity, index) => (
                <Timeline.Item
                  key={index}
                  dot={<SyncOutlined style={{ fontSize: '16px' }} />}
                  color="blue"
                >
                  <Space direction="vertical" size={0}>
                    <Text strong>{activity.operation.replace('_', ' ')}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      By {activity.accountant?.first_name} {activity.accountant?.last_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
                    </Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Pending Items */}
        <Col xs={24} lg={12}>
          <Card title="Pending Items" size="small">
            <Collapse ghost>
              <Panel header={`Pending Payments (${pendingPayments.length})`} key="1">
                <List
                  dataSource={pendingPayments.slice(0, 3)}
                  renderItem={payment => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${payment.employee?.first_name} ${payment.employee?.last_name}`}
                        description={`Amount: $${payment.totalsalary?.toLocaleString()}`}
                      />
                      <Tag color="orange">Pending</Tag>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No pending payments' }}
                />
              </Panel>
              <Panel header={`Pending Loans (${financialData.pendingLoansCount})`} key="2">
                <List
                  dataSource={loanRequests.filter(loan => loan.status === 'pending').slice(0, 3)}
                  renderItem={loan => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${loan.employee?.first_name} ${loan.employee?.last_name}`}
                        description={`${loan.loantype?.loantype} - $${loan.amount?.toLocaleString()}`}
                      />
                      <Tag color="orange">Pending</Tag>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No pending loans' }}
                />
              </Panel>
            </Collapse>
          </Card>
        </Col>
      </Row>

      {/* Financial Charts Placeholder */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="Payroll Trend (Last 6 Months)" size="small">
            <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px' }}>
              {chartData.payrollTrend.map((value, index) => (
                <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                  <div
                    style={{
                      height: `${(value / 100000) * 150}px`,
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ${(value / 1000).toFixed(0)}k
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="EPF Contributions (Last 6 Months)" size="small">
            <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px' }}>
              {chartData.epfContributions.map((value, index) => (
                <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                  <div
                    style={{
                      height: `${(value / 20000) * 150}px`,
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ${(value / 1000).toFixed(0)}k
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Loan Distribution" size="small">
            <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px' }}>
              {chartData.loanDistribution.map((value, index) => (
                <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                  <div
                    style={{
                      height: `${(value / 50000) * 150}px`,
                      background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ${(value / 1000).toFixed(0)}k
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const PayrollTab = ({ payrollData, pendingPayments, payrollColumns, onProcessSalary, onProcessPayment }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Payroll Management" 
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onProcessSalary}>
              Process Salary
            </Button>
          }
        >
          <Alert
            message="Payroll Processing"
            description="Process salaries for employees, including OT, bonuses, increments, and deductions."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic
                title="Total Processed"
                value={payrollData.filter(p => p.processed_by).length}
                suffix={`/ ${payrollData.length}`}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Pending Payments"
                value={pendingPayments.length}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Amount"
                value={payrollData.reduce((sum, item) => sum + (item.totalsalary || 0), 0)}
                prefix="$"
                formatter={value => Number(value).toLocaleString()}
              />
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Pending Payments" extra={<Tag color="orange">{pendingPayments.length} pending</Tag>}>
          <Table
            dataSource={pendingPayments}
            columns={payrollColumns}
            pagination={{ pageSize: 10 }}
            rowKey="salaryid"
            locale={{ emptyText: 'No pending payments' }}
          />
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col span={24}>
        <Card title="Payroll History">
          <Table
            dataSource={payrollData}
            columns={payrollColumns}
            pagination={{ pageSize: 10 }}
            rowKey="salaryid"
          />
        </Card>
      </Col>
    </Row>
  </div>
);

const EPFTab = ({ epfContributions, etfContributions, onProcessEPF, onGenerateEPFReport }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="EPF/ETF Management" 
          extra={
            <Space>
              <Button onClick={() => onGenerateEPFReport('excel')} icon={<FileExcelOutlined />}>
                Excel Report
              </Button>
              <Button onClick={() => onGenerateEPFReport('pdf')} icon={<FilePdfOutlined />}>
                PDF Report
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={onProcessEPF}>
                Process Contribution
              </Button>
            </Space>
          }
        >
          <Alert
            message="EPF/ETF Contributions"
            description="Employee Provident Fund (8% + 12%) and Employer Trust Fund (3%) contributions calculation and processing."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Tabs defaultActiveKey="epf">
      <TabPane tab="EPF Contributions" key="epf">
        <Card title="EPF Contributions History">
          <Table
            dataSource={epfContributions}
            columns={[
              {
                title: 'Employee',
                dataIndex: ['employee', 'first_name'],
                key: 'employee',
                render: (text, record) => 
                  `${record.employee?.first_name} ${record.employee?.last_name}`
              },
              {
                title: 'Department',
                dataIndex: ['employee', 'department'],
                key: 'department'
              },
              {
                title: 'Month',
                dataIndex: 'month',
                key: 'month',
                render: (date) => dayjs(date).format('MMMM YYYY')
              },
              {
                title: 'Basic Salary',
                dataIndex: 'basicsalary',
                key: 'basicsalary',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Employee EPF (8%)',
                dataIndex: 'employeecontribution',
                key: 'employeecontribution',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Employer EPF (12%)',
                dataIndex: 'employercontribution',
                key: 'employercontribution',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Total Contribution',
                dataIndex: 'totalcontribution',
                key: 'totalcontribution',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Tag color={status === 'processed' ? 'green' : 'orange'}>
                    {status}
                  </Tag>
                )
              }
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      </TabPane>
      <TabPane tab="ETF Contributions" key="etf">
        <Card title="ETF Contributions History">
          <Table
            dataSource={etfContributions}
            columns={[
              {
                title: 'Employee',
                dataIndex: ['employee', 'first_name'],
                key: 'employee',
                render: (text, record) => 
                  `${record.employee?.first_name} ${record.employee?.last_name}`
              },
              {
                title: 'Department',
                dataIndex: ['employee', 'department'],
                key: 'department'
              },
              {
                title: 'Month',
                dataIndex: 'month',
                key: 'month',
                render: (date) => dayjs(date).format('MMMM YYYY')
              },
              {
                title: 'Basic Salary',
                dataIndex: 'basicsalary',
                key: 'basicsalary',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Employer ETF (3%)',
                dataIndex: 'employercontribution',
                key: 'employercontribution',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Tag color={status === 'processed' ? 'green' : 'orange'}>
                    {status}
                  </Tag>
                )
              }
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      </TabPane>
    </Tabs>
  </div>
);

const LoanTab = ({ loanRequests, loanColumns, employees, loanTypes, onProcessLoan, onCheckEligibility, onApproveLoan, onRejectLoan, onGenerateLoanReport }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Loan Management" 
          extra={
            <Space>
              <Button onClick={() => onGenerateLoanReport('excel')} icon={<FileExcelOutlined />}>
                Excel Report
              </Button>
              <Button onClick={() => onGenerateLoanReport('pdf')} icon={<FilePdfOutlined />}>
                PDF Report
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={onProcessLoan}>
                Create Loan
              </Button>
            </Space>
          }
        >
          <Alert
            message="Loan Management"
            description="Manage staff loans including home loans, emergency loans, education loans, vehicle loans, and product loans."
            type="info"
            showIcon
          />
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="Total Loans"
                value={loanRequests.length}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Pending"
                value={loanRequests.filter(l => l.status === 'pending').length}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Approved"
                value={loanRequests.filter(l => l.status === 'approved').length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Total Amount"
                value={loanRequests.reduce((sum, item) => sum + (item.amount || 0), 0)}
                prefix="$"
                formatter={value => Number(value).toLocaleString()}
              />
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Card title="Loan Requests">
      <Table
        dataSource={loanRequests}
        columns={loanColumns}
        pagination={{ pageSize: 10 }}
        rowKey="loanrequestid"
      />
    </Card>
  </div>
);

const BonusOTTab = ({ bonusData, otData, bonusColumns, onAddBonus, onAddOT }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Bonus & Overtime Management" 
          extra={
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={onAddBonus}>
                Add Bonus
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={onAddOT}>
                Add Overtime
              </Button>
            </Space>
          }
        >
          <Alert
            message="Bonus & Overtime"
            description="Manage employee bonuses and overtime payments with different types and rates."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Tabs defaultActiveKey="bonus">
      <TabPane tab="Bonus Management" key="bonus">
        <Card title="Bonus History">
          <Table
            dataSource={bonusData}
            columns={bonusColumns}
            pagination={{ pageSize: 10 }}
            rowKey="bonusid"
          />
        </Card>
      </TabPane>
      <TabPane tab="Overtime Management" key="ot">
        <Card title="Overtime History">
          <Table
            dataSource={otData}
            columns={[
              {
                title: 'Employee',
                dataIndex: ['employee', 'first_name'],
                key: 'employee',
                render: (text, record) => 
                  `${record.employee?.first_name} ${record.employee?.last_name}`
              },
              {
                title: 'Department',
                dataIndex: ['employee', 'department'],
                key: 'department'
              },
              {
                title: 'OT Hours',
                dataIndex: 'othours',
                key: 'othours'
              },
              {
                title: 'Rate',
                dataIndex: 'rate',
                key: 'rate',
                render: (rate) => `$${rate}`
              },
              {
                title: 'Amount',
                dataIndex: 'amount',
                key: 'amount',
                render: (amount) => `$${amount?.toLocaleString()}`
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type'
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Tag color={status === 'approved' ? 'green' : 'orange'}>
                    {status}
                  </Tag>
                )
              }
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="otid"
          />
        </Card>
      </TabPane>
    </Tabs>
  </div>
);

const KPITab = ({ kpiData, onAddKPI }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="KPI Management" 
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddKPI}>
              Add KPI
            </Button>
          }
        >
          <Alert
            message="Key Performance Indicators"
            description="Manage employee performance metrics and track KPI scores for salary calculations and promotions."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Card title="KPI History">
      <Table
        dataSource={kpiData}
        columns={[
          {
            title: 'Employee',
            dataIndex: ['employee', 'first_name'],
            key: 'employee',
            render: (text, record) => 
              `${record.employee?.first_name} ${record.employee?.last_name}`
          },
          {
            title: 'Department',
            dataIndex: ['employee', 'department'],
            key: 'department'
          },
          {
            title: 'KPI Value',
            dataIndex: 'kpivalue',
            key: 'kpivalue',
            render: (value) => (
              <Progress 
                percent={value} 
                size="small" 
                status={value >= 80 ? 'success' : value >= 60 ? 'normal' : 'exception'}
              />
            )
          },
          {
            title: 'Ranking',
            dataIndex: ['kpiranking', 'kpirank'],
            key: 'kpirank'
          },
          {
            title: 'Calculation Date',
            dataIndex: 'calculatedate',
            key: 'calculatedate',
            render: (date) => dayjs(date).format('DD/MM/YYYY')
          },
          {
            title: 'Year',
            dataIndex: 'kpiyear',
            key: 'kpiyear'
          }
        ]}
        pagination={{ pageSize: 10 }}
        rowKey="kpiid"
      />
    </Card>
  </div>
);

const ReportsTab = ({ onGeneratePayrollReport, onGenerateEPFReport, onGenerateLoanReport, onGenerateFinancialSummary, financialData, payrollData, loanRequests }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="Financial Reports & Analytics">
          <Alert
            message="Report Generation"
            description="Generate comprehensive financial reports in PDF and Excel formats with detailed analytics and charts."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card 
                size="small" 
                hoverable
                actions={[
                  <Button type="link" icon={<FilePdfOutlined />} onClick={() => onGeneratePayrollReport('pdf')}>
                    PDF
                  </Button>,
                  <Button type="link" icon={<FileExcelOutlined />} onClick={() => onGeneratePayrollReport('excel')}>
                    Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                  title="Payroll Report"
                  description="Monthly payroll summary with employee details, OT, bonuses and totals"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                size="small" 
                hoverable
                actions={[
                  <Button type="link" icon={<FilePdfOutlined />} onClick={() => onGenerateEPFReport('pdf')}>
                    PDF
                  </Button>,
                  <Button type="link" icon={<FileExcelOutlined />} onClick={() => onGenerateEPFReport('excel')}>
                    Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<BankOutlined style={{ fontSize: '24px', color: '#52c41a' }} />}
                  title="EPF/ETF Report"
                  description="Employee Provident Fund and Trust Fund contributions report"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                size="small" 
                hoverable
                actions={[
                  <Button type="link" icon={<FilePdfOutlined />} onClick={() => onGenerateLoanReport('pdf')}>
                    PDF
                  </Button>,
                  <Button type="link" icon={<FileExcelOutlined />} onClick={() => onGenerateLoanReport('excel')}>
                    Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<BankOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />}
                  title="Loan Report"
                  description="Loan requests, approvals, and repayment schedules"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                size="small" 
                hoverable
                actions={[
                  <Button type="link" icon={<FilePdfOutlined />} onClick={() => onGenerateFinancialSummary('pdf')}>
                    Generate
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<PieChartOutlined style={{ fontSize: '24px', color: '#722ed1' }} />}
                  title="Financial Summary"
                  description="Comprehensive financial overview with charts and analytics"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                size="small" 
                hoverable
                actions={[
                  <Button type="link" icon={<FilePdfOutlined />}>
                    PDF
                  </Button>,
                  <Button type="link" icon={<FileExcelOutlined />}>
                    Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<BarChartOutlined style={{ fontSize: '24px', color: '#f5222d' }} />}
                  title="Tax Report"
                  description="Tax deductions and liabilities summary"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                size="small" 
                hoverable
                actions={[
                  <Button type="link" icon={<FilePdfOutlined />}>
                    PDF
                  </Button>,
                  <Button type="link" icon={<FileExcelOutlined />}>
                    Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<PieChartOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />}
                  title="Department Analysis"
                  description="Department-wise cost and performance analysis"
                />
              </Card>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Report Templates & Scheduling">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Payroll Report" span={2}>
              Includes employee details, salary components, totals, department breakdown, and processing date with summary statistics
            </Descriptions.Item>
            <Descriptions.Item label="EPF/ETF Report">
              Contains EPF contributions breakdown (8% employee + 12% employer) and ETF (3% employer) by employee and month
            </Descriptions.Item>
            <Descriptions.Item label="Loan Report">
              Loan applications, approvals, types, amounts, interest rates, and repayment schedules
            </Descriptions.Item>
            <Descriptions.Item label="Financial Summary">
              Revenue, expenses, profit/loss, balance sheet overview with comparative analysis
            </Descriptions.Item>
            <Descriptions.Item label="Tax Report">
              Tax deductions, PAYE, VAT, and corporate tax calculations and filings
            </Descriptions.Item>
            <Descriptions.Item label="Custom Reports">
              Customizable reports with filters for date ranges, departments, and employee categories
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    </Row>
  </div>
);

const ActivitiesTab = ({ recentActivities }) => (
  <div>
    <Card title="Accountant Activities Log" extra={<Tag color="blue">{recentActivities.length} activities</Tag>}>
      <Timeline>
        {recentActivities.map((activity, index) => (
          <Timeline.Item
            key={index}
            dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
            color="green"
          >
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Col>
                    <Text strong>{activity.operation.replace(/_/g, ' ')}</Text>
                  </Col>
                  <Col>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
                    </Text>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Text type="secondary">
                      By: {activity.accountant?.first_name} {activity.accountant?.last_name}
                    </Text>
                  </Col>
                </Row>
                {activity.details && (
                  <Row>
                    <Col>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Details: {JSON.stringify(activity.details)}
                      </Text>
                    </Col>
                  </Row>
                )}
              </Space>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  </div>
);

// Loan Eligibility Component
const LoanEligibilityCheck = ({ employee, loanTypes }) => {
  const [eligibilityResults, setEligibilityResults] = useState([]);

  useEffect(() => {
    calculateEligibility();
  }, [employee, loanTypes]);

  const calculateEligibility = () => {
    const results = loanTypes.map(loanType => {
      let eligible = true;
      let maxAmount = 0;
      let reasons = [];
      
      // Basic eligibility criteria based on loan type
      switch(loanType.loantype.toLowerCase()) {
        case 'staff loan':
          maxAmount = employee.basicsalary * 3; // 3 months basic salary
          break;
        case 'home loan':
          maxAmount = employee.basicsalary * 60; // 5 years basic salary
          if (employee.basicsalary < 50000) {
            eligible = false;
            reasons.push('Basic salary too low for home loan');
          }
          break;
        case 'emergency loan':
          maxAmount = employee.basicsalary * 2; // 2 months basic salary
          break;
        case 'education loan':
          maxAmount = employee.basicsalary * 12; // 1 year basic salary
          break;
        case 'vehicle loan':
          maxAmount = employee.basicsalary * 24; // 2 years basic salary
          break;
        case 'product loan':
          maxAmount = employee.basicsalary * 6; // 6 months basic salary
          break;
        default:
          maxAmount = employee.basicsalary * 3;
      }

      // Additional criteria based on employee status
      if (employee.role === 'probation') {
        eligible = false;
        reasons.push('Employee is on probation');
      }

      if (employee.basicsalary < 25000 && loanType.loantype.toLowerCase() !== 'emergency loan') {
        eligible = false;
        reasons.push('Basic salary below minimum requirement');
      }

      return {
        loanType: loanType.loantype,
        eligible,
        maxAmount,
        reasons: reasons.length > 0 ? reasons : ['Eligible for this loan type']
      };
    });

    setEligibilityResults(results);
  };

  return (
    <div>
      <Descriptions title={`Loan Eligibility - ${employee.first_name} ${employee.last_name}`} bordered>
        <Descriptions.Item label="Department">{employee.department}</Descriptions.Item>
        <Descriptions.Item label="Basic Salary">${employee.basicsalary?.toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Role">{employee.role}</Descriptions.Item>
      </Descriptions>

      <Divider />

      <List
        header={<Text strong>Loan Eligibility Results</Text>}
        dataSource={eligibilityResults}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Badge 
                  status={item.eligible ? 'success' : 'error'} 
                  text={item.eligible ? 'Eligible' : 'Not Eligible'}
                />
              }
              title={item.loanType}
              description={
                <Space direction="vertical">
                  <Text>Maximum Amount: ${item.maxAmount.toLocaleString()}</Text>
                  <Text type="secondary">
                    {item.reasons.join(', ')}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default AccountantDashboard;