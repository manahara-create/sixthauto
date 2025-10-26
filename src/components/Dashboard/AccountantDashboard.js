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
  CalculatorFilled,
  FileWordOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocxTable, TableCell, TableRow, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Step } = Steps;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

const AccountantDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);

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

  // Date range state
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  // Search and filter states
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // Modal states
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [epfModalVisible, setEpfModalVisible] = useState(false);
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const [otModalVisible, setOtModalVisible] = useState(false);
  const [kpiModalVisible, setKpiModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [loanEligibilityModalVisible, setLoanEligibilityModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSelectionModalVisible, setEmployeeSelectionModalVisible] = useState(false);

  // Form states
  const [salaryForm] = Form.useForm();
  const [epfForm] = Form.useForm();
  const [bonusForm] = Form.useForm();
  const [otForm] = Form.useForm();
  const [kpiForm] = Form.useForm();
  const [loanForm] = Form.useForm();

  useEffect(() => {
    initializeDashboard();
  }, [dateRange]);

  useEffect(() => {
    filterEmployees();
  }, [employeeSearch, employees]);

  const filterEmployees = () => {
    if (!employeeSearch) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.email?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.department?.toLowerCase().includes(employeeSearch.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  };

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
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
      }
    } catch (error) {
      console.error('Error initializing accountant dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Data fetching functions with dynamic date range
  const fetchFinancialData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      // Total salary for selected date range
      const { data: salaryData } = await supabase
        .from('salary')
        .select('totalsalary, salarydate')
        .gte('salarydate', startDate)
        .lte('salarydate', endDate);

      // EPF contributions for selected date range
      const { data: epfData } = await supabase
        .from('epf_contributions')
        .select('totalcontribution, month')
        .gte('month', startDate)
        .lte('month', endDate)
        .eq('status', 'processed');

      // ETF contributions for selected date range
      const { data: etfData } = await supabase
        .from('etf_contributions')
        .select('employercontribution, month')
        .gte('month', startDate)
        .lte('month', endDate)
        .eq('status', 'processed');

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
        pendingPaymentsCount: pendingPayments.length,
        pendingLoansCount: pendingLoans?.length || 0,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const fetchPayrollData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('salary')
        .select('*')
        .gte('salarydate', startDate)
        .lte('salarydate', endDate)
        .order('salarydate', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Manually fetch employee data
      const employeeIds = [...new Set(data?.map(s => s.empid).filter(Boolean))];
      let employeeData = [];

      if (employeeIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name, email, department')
          .in('empid', employeeIds);
        employeeData = empData || [];
      }

      const employeeMap = {};
      employeeData.forEach(emp => {
        employeeMap[emp.empid] = emp;
      });

      const payrollWithEmployee = data?.map(salary => ({
        ...salary,
        employee: employeeMap[salary.empid] || { full_name: 'Unknown', email: 'N/A', department: 'N/A' }
      }));

      setPayrollData(payrollWithEmployee || []);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      setPayrollData([]);
    }
  };


  const fetchEPFData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('epf_contributions')
        .select('*')
        .gte('month', startDate)
        .lte('month', endDate)
        .order('month', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Manually fetch employee data
      const employeeIds = [...new Set(data?.map(e => e.empid).filter(Boolean))];
      let employeeData = [];

      if (employeeIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name, department')
          .in('empid', employeeIds);
        employeeData = empData || [];
      }

      const employeeMap = {};
      employeeData.forEach(emp => {
        employeeMap[emp.empid] = emp;
      });

      const epfWithEmployee = data?.map(epf => ({
        ...epf,
        employee: employeeMap[epf.empid] || { full_name: 'Unknown', department: 'N/A' }
      }));

      setEpfContributions(epfWithEmployee || []);
    } catch (error) {
      console.error('Error fetching EPF data:', error);
      setEpfContributions([]);
    }
  };

  const fetchETFData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('etf_contributions')
        .select('*')
        .gte('month', startDate)
        .lte('month', endDate)
        .order('month', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Manually fetch employee data
      const employeeIds = [...new Set(data?.map(e => e.empid).filter(Boolean))];
      let employeeData = [];

      if (employeeIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name, department')
          .in('empid', employeeIds);
        employeeData = empData || [];
      }

      const employeeMap = {};
      employeeData.forEach(emp => {
        employeeMap[emp.empid] = emp;
      });

      const etfWithEmployee = data?.map(etf => ({
        ...etf,
        employee: employeeMap[etf.empid] || { full_name: 'Unknown', department: 'N/A' }
      }));

      setEtfContributions(etfWithEmployee || []);
    } catch (error) {
      console.error('Error fetching ETF data:', error);
      setEtfContributions([]);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (full_name, department)
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
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('accountant_operations')
        .select('*')
        .gte('operation_time', startDate)
        .lte('operation_time', endDate)
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
        .select('empid, full_name, department, basicsalary, email, role, status, is_active')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSalaryCalculations = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('salary')
        .select(`
          *,
          employee:empid (full_name)
        `)
        .gte('salarydate', startDate)
        .lte('salarydate', endDate)
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
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('loanrequest')
        .select(`
          *,
          employee:empid (full_name, department, basicsalary),
          loantype:loantypeid (loantype, description)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
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
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('bonus')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('bonusdate', startDate)
        .lte('bonusdate', endDate)
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
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('ot')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
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
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('kpi')
        .select(`
          *,
          employee:empid (full_name, department)
        `)
        .gte('calculatedate', startDate)
        .lte('calculatedate', endDate)
        .order('calculatedate', { ascending: false })
        .limit(50);

      if (error) throw error;
      setKpiData(data || []);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  const handleProcessSalary = async (values) => {
    try {
      const basicSalary = parseFloat(values.basicSalary) || 0;
      const otHours = parseFloat(values.otHours) || 0;
      const otRate = parseFloat(values.otRate) || 0;
      const bonusPay = parseFloat(values.bonusAmount) || 0;
      const incrementPay = parseFloat(values.incrementAmount) || 0;
      const noPayDays = parseFloat(values.noPayDays) || 0;

      const otPay = otHours * otRate;
      const noPayDeduction = noPayDays * (basicSalary / 30);
      const totalSalary = basicSalary + otPay + bonusPay + incrementPay - noPayDeduction;

      if (totalSalary < 0) {
        message.error('Total salary cannot be negative');
        return;
      }

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
          processed_by: user?.id,
          processed_at: null, // Will be set when actually processed
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() // ADDED
        }])
        .select();

      if (error) throw error;

      await logAccountantOperation('PROCESS_SALARY', data[0]?.salaryid, {
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
      message.error(error.message || 'Failed to process salary');
    }
  };

  const handleProcessEPF = async (values) => {
    try {
      const basicSalary = parseFloat(values.basicSalary) || 0;

      if (basicSalary <= 0) {
        message.error('Basic salary must be greater than 0');
        return;
      }

      const employeeContribution = basicSalary * 0.08;
      const employerContribution = basicSalary * 0.12;
      const totalContribution = employeeContribution + employerContribution;

      const { data, error } = await supabase
        .from('epf_contributions')
        .insert([{
          empid: values.employeeId,
          basicsalary: Math.round(basicSalary),
          employeecontribution: Math.round(employeeContribution),
          employercontribution: Math.round(employerContribution),
          totalcontribution: Math.round(totalContribution),
          month: values.contributionMonth.format('YYYY-MM-DD'),
          processed_by: user?.id,
          status: 'processed',
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      await logAccountantOperation('PROCESS_EPF', data[0]?.id, {
        employeeId: values.employeeId,
        totalContribution: Math.round(totalContribution),
        employeeContribution: Math.round(employeeContribution),
        employerContribution: Math.round(employerContribution)
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
      const employerContribution = values.basicSalary * 0.03;

      const { data, error } = await supabase
        .from('etf_contributions')
        .insert([{
          empid: values.employeeId,
          basicsalary: values.basicSalary,
          employercontribution: employerContribution,
          month: values.contributionMonth.format('YYYY-MM-DD'),
          processed_by: user?.id,
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
      if (!values.employeeId || !values.amount || !values.bonusType) {
        message.error('Employee, amount, and bonus type are required');
        return;
      }

      const amount = parseFloat(values.amount) || 0;
      if (amount <= 0) {
        message.error('Bonus amount must be greater than 0');
        return;
      }

      const { data, error } = await supabase
        .from('bonus')
        .insert([{
          empid: values.employeeId,
          amount: Math.round(amount),
          type: values.bonusType,
          reason: values.reason?.trim() || null,
          bonusdate: values.bonusDate.format('YYYY-MM-DD'),
          processedby: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() // ADDED
        }])
        .select();

      if (error) throw error;

      await logAccountantOperation('ADD_BONUS', data[0]?.bonusid, {
        employeeId: values.employeeId,
        amount: Math.round(amount),
        type: values.bonusType
      });

      message.success('Bonus added successfully!');
      setBonusModalVisible(false);
      bonusForm.resetFields();
      await Promise.all([fetchBonusData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error adding bonus:', error);
      message.error(error.message || 'Failed to add bonus');
    }
  };

  const handleAddOT = async (values) => {
    try {
      if (!values.employeeId || !values.othours || !values.rate) {
        message.error('Employee, OT hours, and rate are required');
        return;
      }

      const othours = parseFloat(values.othours) || 0;
      const rate = parseFloat(values.rate) || 0;

      if (othours <= 0) {
        message.error('OT hours must be greater than 0');
        return;
      }

      if (rate <= 0) {
        message.error('Rate must be greater than 0');
        return;
      }

      const amount = othours * rate;

      const { data, error } = await supabase
        .from('ot')
        .insert([{
          empid: values.employeeId,
          othours: Math.round(othours * 100) / 100, // Round to 2 decimals
          rate: Math.round(rate),
          amount: Math.round(amount),
          type: values.otType || 'regular',
          status: 'approved',
          processed_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() // ADDED
        }])
        .select();

      if (error) throw error;

      await logAccountantOperation('ADD_OT', data[0]?.otid, {
        employeeId: values.employeeId,
        hours: othours,
        rate: rate,
        amount: amount
      });

      message.success('OT added successfully!');
      setOtModalVisible(false);
      otForm.resetFields();
      await Promise.all([fetchOTData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error adding OT:', error);
      message.error(error.message || 'Failed to add OT');
    }
  };

  const handleAddKPI = async (values) => {
    try {
      if (!values.employeeId || values.kpivalue == null) {
        message.error('Employee and KPI value are required');
        return;
      }

      const kpivalue = parseFloat(values.kpivalue) || 0;

      if (kpivalue < 0 || kpivalue > 100) {
        message.error('KPI value must be between 0 and 100');
        return;
      }

      // Determine kpirankingid based on value
      let kpirankingid = null;
      const { data: rankings } = await supabase
        .from('kpiranking')
        .select('*')
        .lte('min_value', kpivalue)
        .gte('max_value', kpivalue)
        .limit(1);

      if (rankings && rankings.length > 0) {
        kpirankingid = rankings[0].kpirankingid;
      }

      const { data, error } = await supabase
        .from('kpi')
        .insert([{
          empid: values.employeeId,
          kpivalue: Math.round(kpivalue),
          calculatedate: values.calculateDate.format('YYYY-MM-DD'),
          kpiyear: values.calculateDate.year(),
          kpirankingid: kpirankingid, // ADDED - required by schema
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() // ADDED
        }])
        .select();

      if (error) throw error;

      // Update employee's KPI score
      await supabase
        .from('employee')
        .update({
          kpiscore: Math.round(kpivalue),
          updated_at: new Date().toISOString()
        })
        .eq('empid', values.employeeId);

      await logAccountantOperation('ADD_KPI', data[0]?.kpiid, {
        employeeId: values.employeeId,
        kpiValue: Math.round(kpivalue)
      });

      message.success('KPI added successfully!');
      setKpiModalVisible(false);
      kpiForm.resetFields();
      await Promise.all([fetchKPIData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error adding KPI:', error);
      message.error(error.message || 'Failed to add KPI');
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
      if (!loanId) {
        message.error('Invalid loan ID');
        return;
      }

      const { error } = await supabase
        .from('loanrequest')
        .update({
          status: 'approved',
          processedby: user?.id,
          processedat: new Date().toISOString(),
          updated_at: new Date().toISOString() // ADDED
        })
        .eq('loanrequestid', loanId);

      if (error) throw error;

      await logAccountantOperation('APPROVE_LOAN', loanId, {
        action: 'loan_approved',
        timestamp: new Date().toISOString()
      });

      message.success('Loan approved successfully!');
      await Promise.all([fetchLoanRequests(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error approving loan:', error);
      message.error(error.message || 'Failed to approve loan');
    }
  };

  const handleRejectLoan = async (loanId) => {
    try {
      if (!loanId) {
        message.error('Invalid loan ID');
        return;
      }

      const { error } = await supabase
        .from('loanrequest')
        .update({
          status: 'rejected',
          processedby: user?.id,
          processedat: new Date().toISOString(),
          updated_at: new Date().toISOString() // ADDED
        })
        .eq('loanrequestid', loanId);

      if (error) throw error;

      await logAccountantOperation('REJECT_LOAN', loanId, {
        action: 'loan_rejected',
        timestamp: new Date().toISOString()
      });

      message.success('Loan rejected successfully!');
      await Promise.all([fetchLoanRequests(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error rejecting loan:', error);
      message.error(error.message || 'Failed to reject loan');
    }
  };

  const handleProcessPayment = async (salaryId) => {
    try {
      if (!salaryId) {
        message.error('Invalid salary ID');
        return;
      }

      const { error } = await supabase
        .from('salary')
        .update({
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString() // ADDED
        })
        .eq('salaryid', salaryId);

      if (error) throw error;

      await logAccountantOperation('PROCESS_PAYMENT', salaryId, {
        action: 'payment_processed',
        timestamp: new Date().toISOString()
      });

      message.success('Payment processed successfully!');
      await Promise.all([
        fetchPendingPayments(),
        fetchPayrollData(),
        fetchFinancialData(),
        fetchRecentActivities()
      ]);
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error(error.message || 'Failed to process payment');
    }
  };

  // DELETE Operations
  const handleDeleteSalary = async (salaryId) => {
    try {
      const { error } = await supabase
        .from('salary')
        .delete()
        .eq('salaryid', salaryId);

      if (error) throw error;

      await logAccountantOperation('DELETE_SALARY', salaryId, {
        action: 'salary_deleted'
      });

      message.success('Salary record deleted successfully!');
      await Promise.all([fetchPayrollData(), fetchFinancialData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error deleting salary:', error);
      message.error('Failed to delete salary record');
    }
  };

  const handleDeleteBonus = async (bonusId) => {
    try {
      const { error } = await supabase
        .from('bonus')
        .delete()
        .eq('bonusid', bonusId);

      if (error) throw error;

      await logAccountantOperation('DELETE_BONUS', bonusId, {
        action: 'bonus_deleted'
      });

      message.success('Bonus record deleted successfully!');
      await Promise.all([fetchBonusData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error deleting bonus:', error);
      message.error('Failed to delete bonus record');
    }
  };

  const handleDeleteOT = async (otId) => {
    try {
      const { error } = await supabase
        .from('ot')
        .delete()
        .eq('otid', otId);

      if (error) throw error;

      await logAccountantOperation('DELETE_OT', otId, {
        action: 'ot_deleted'
      });

      message.success('OT record deleted successfully!');
      await Promise.all([fetchOTData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error deleting OT:', error);
      message.error('Failed to delete OT record');
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
          accountant_id: user?.id,
          details,
          operation_time: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging operation:', error);
    }
  };

  // Employee Selection Handler
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeSelectionModalVisible(false);
  };

  const generatePayrollReport = async (format = 'xlsx') => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data: payrollData, error } = await supabase
        .from('salary')
        .select('*')
        .gte('salarydate', startDate)
        .lte('salarydate', endDate)
        .order('salarydate', { ascending: false });

      if (error) throw error;

      // Manually fetch employee data
      const employeeIds = [...new Set(payrollData?.map(p => p.empid).filter(Boolean))];
      let employeeData = [];

      if (employeeIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name, department, email')
          .in('empid', employeeIds);
        employeeData = empData || [];
      }

      const employeeMap = {};
      employeeData.forEach(emp => {
        employeeMap[emp.empid] = emp;
      });

      const payrollWithEmployee = payrollData?.map(salary => ({
        ...salary,
        employee: employeeMap[salary.empid] || {
          full_name: 'Unknown',
          department: 'N/A',
          email: 'N/A'
        }
      }));

      if (format === 'docx') {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: "Payroll Report",
                heading: HeadingLevel.HEADING_1,
                alignment: "center",
              }),
              new Paragraph({
                text: `Period: ${dateRange[0].format('MMMM D, YYYY')} to ${dateRange[1].format('MMMM D, YYYY')}`,
                alignment: "center",
              }),
              new Paragraph({
                text: `Generated on: ${dayjs().format('MMMM D, YYYY HH:mm')}`,
                alignment: "center",
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: `Total Payroll: $${payrollWithEmployee?.reduce((sum, item) => sum + (parseFloat(item.totalsalary) || 0), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({ text: "" }),
              new DocxTable({
                width: { size: 100, type: "pct" },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Employee", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Department", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Basic Salary", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "OT Pay", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Bonus", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Increment", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Salary", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                    ],
                  }),
                  ...(payrollWithEmployee?.map(item =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.employee?.full_name || 'N/A')] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.employee?.department || 'N/A')] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(parseFloat(item.basicsalary) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(parseFloat(item.otpay) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(parseFloat(item.bonuspay) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(parseFloat(item.incrementpay) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(parseFloat(item.totalsalary) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.salarydate ? dayjs(item.salarydate).format('MMM D, YYYY') : 'N/A')] })] }),
                      ],
                    })
                  ) || []),
                ],
              }),
            ],
          }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `payroll-report-${dayjs().format('YYYY-MM-DD')}.docx`);
      } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(
          payrollWithEmployee?.map(item => ({
            'Employee': item.employee?.full_name || 'N/A',
            'Department': item.employee?.department || 'N/A',
            'Email': item.employee?.email || 'N/A',
            'Basic Salary': parseFloat(item.basicsalary) || 0,
            'OT Pay': parseFloat(item.otpay) || 0,
            'Bonus Pay': parseFloat(item.bonuspay) || 0,
            'Increment Pay': parseFloat(item.incrementpay) || 0,
            'Total Salary': parseFloat(item.totalsalary) || 0,
            'Date': item.salarydate ? dayjs(item.salarydate).format('MMM D, YYYY') : 'N/A',
            'Processed By': item.processed_by || 'Pending',
            'Processed At': item.processed_at ? dayjs(item.processed_at).format('MMM D, YYYY HH:mm') : 'N/A'
          })) || []
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
        XLSX.writeFile(workbook, `payroll-report-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      }

      message.success(`Payroll report generated successfully!`);
    } catch (error) {
      console.error('Error generating payroll report:', error);
      message.error(error.message || 'Failed to generate report');
    }
  };

  const generateEPFReport = async (format = 'docx') => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data: epfData, error } = await supabase
        .from('epf_contributions')
        .select('*')
        .gte('month', startDate)
        .lte('month', endDate)
        .order('month', { ascending: false });

      if (error) throw error;

      // Manually fetch employee data
      const employeeIds = [...new Set(epfData?.map(e => e.empid).filter(Boolean))];
      let employeeData = [];

      if (employeeIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name, department')
          .in('empid', employeeIds);
        employeeData = empData || [];
      }

      const employeeMap = {};
      employeeData.forEach(emp => {
        employeeMap[emp.empid] = emp;
      });

      const epfWithEmployee = epfData?.map(epf => ({
        ...epf,
        employee: employeeMap[epf.empid] || {
          full_name: 'Unknown',
          department: 'N/A'
        }
      }));

      if (format === 'docx') {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: "EPF Contributions Report",
                heading: HeadingLevel.HEADING_1,
                alignment: "center",
              }),
              new Paragraph({
                text: `Period: ${dateRange[0].format('MMMM D, YYYY')} to ${dateRange[1].format('MMMM D, YYYY')}`,
                alignment: "center",
              }),
              new Paragraph({
                text: `Generated on: ${dayjs().format('MMMM D, YYYY HH:mm')}`,
                alignment: "center",
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: `Total EPF Contributions: $${epfWithEmployee?.reduce((sum, item) => sum + (parseInt(item.totalcontribution) || 0), 0)?.toLocaleString() || '0'}`,
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({ text: "" }),
              new DocxTable({
                width: { size: 100, type: "pct" },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Employee", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Department", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Basic Salary", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Employee EPF (8%)", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Employer EPF (12%)", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Month", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
                    ],
                  }),
                  ...(epfWithEmployee?.map(item =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.employee?.full_name || 'N/A')] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.employee?.department || 'N/A')] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(parseInt(item.basicsalary) || 0).toLocaleString()}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(parseInt(item.employeecontribution) || 0).toLocaleString()}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(parseInt(item.employercontribution) || 0).toLocaleString()}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(parseInt(item.totalcontribution) || 0).toLocaleString()}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.month ? dayjs(item.month).format('MMM YYYY') : 'N/A')] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.status || 'pending')] })] }),
                      ],
                    })
                  ) || []),
                ],
              }),
            ],
          }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `epf-report-${dayjs().format('YYYY-MM-DD')}.docx`);
      } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(
          epfWithEmployee?.map(item => ({
            'Employee': item.employee?.full_name || 'N/A',
            'Department': item.employee?.department || 'N/A',
            'Basic Salary': parseInt(item.basicsalary) || 0,
            'Employee EPF (8%)': parseInt(item.employeecontribution) || 0,
            'Employer EPF (12%)': parseInt(item.employercontribution) || 0,
            'Total Contribution': parseInt(item.totalcontribution) || 0,
            'Month': item.month ? dayjs(item.month).format('MMM YYYY') : 'N/A',
            'Status': item.status || 'pending',
            'Processed By': item.processed_by || 'N/A'
          })) || []
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'EPF Contributions');
        XLSX.writeFile(workbook, `epf-report-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      }

      message.success(`EPF report generated successfully!`);
    } catch (error) {
      console.error('Error generating EPF report:', error);
      message.error(error.message || 'Failed to generate report');
    }
  };

  const generateLoanReport = async (format = 'docx') => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data: loanData } = await supabase
        .from('loanrequest')
        .select(`
          *,
          employee:empid (full_name, department),
          loantype:loantypeid (loantype, description)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (format === 'docx') {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: "Loan Requests Report",
                heading: HeadingLevel.HEADING_1,
                alignment: "center",
              }),
              new Paragraph({
                text: `Period: ${dateRange[0].format('MMMM D, YYYY')} to ${dateRange[1].format('MMMM D, YYYY')}`,
                alignment: "center",
              }),
              new Paragraph({
                text: `Generated on: ${dayjs().format('MMMM D, YYYY')}`,
                alignment: "center",
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: `Total Loan Amount: $${loanData?.reduce((sum, item) => sum + (item.amount || 0), 0)?.toLocaleString() || '0'}`,
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                text: `Pending Requests: ${loanData?.filter(item => item.status === 'pending').length || 0}`,
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph({ text: "" }),
              new DocxTable({
                width: { size: 100, type: "pct" },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Employee")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Department")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Loan Type")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Amount")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Duration")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Interest")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Status")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Date")] })] }),
                    ],
                  }),
                  ...(loanData?.map(item =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.employee?.full_name || 'N/A')] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.employee?.department || 'N/A')] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.loantype?.loantype || 'N/A')] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${item.amount?.toLocaleString() || '0'}`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`${item.duration} months`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(`${item.interestrate}%`)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(item.status)] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun(dayjs(item.date).format('MMM D, YYYY'))] })] }),
                      ],
                    })
                  ) || []),
                ],
              }),
            ],
          }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `loan-report-${dayjs().format('YYYY-MM-DD')}.docx`);
      } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(
          loanData?.map(item => ({
            'Employee': item.employee?.full_name || 'N/A',
            'Department': item.employee?.department || 'N/A',
            'Loan Type': item.loantype?.loantype || 'N/A',
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

  const generateFinancialSummary = async (format = 'docx') => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      // Get data for summary
      const { data: salaryData } = await supabase
        .from('salary')
        .select('totalsalary, salarydate')
        .gte('salarydate', startDate)
        .lte('salarydate', endDate);

      const { data: epfData } = await supabase
        .from('epf_contributions')
        .select('totalcontribution')
        .gte('month', startDate)
        .lte('month', endDate);

      const { data: etfData } = await supabase
        .from('etf_contributions')
        .select('employercontribution')
        .gte('month', startDate)
        .lte('month', endDate);

      const { data: bonusData } = await supabase
        .from('bonus')
        .select('amount')
        .gte('bonusdate', startDate)
        .lte('bonusdate', endDate);

      const { data: otData } = await supabase
        .from('ot')
        .select('amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const totalSalary = salaryData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0;
      const totalEPF = epfData?.reduce((sum, item) => sum + (item.totalcontribution || 0), 0) || 0;
      const totalETF = etfData?.reduce((sum, item) => sum + (item.employercontribution || 0), 0) || 0;
      const totalBonus = bonusData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const totalOT = otData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      if (format === 'docx') {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: "Financial Summary Report",
                heading: HeadingLevel.HEADING_1,
                alignment: "center",
              }),
              new Paragraph({
                text: `Period: ${dateRange[0].format('MMMM D, YYYY')} to ${dateRange[1].format('MMMM D, YYYY')}`,
                alignment: "center",
              }),
              new Paragraph({
                text: `Generated on: ${dayjs().format('MMMM D, YYYY')}`,
                alignment: "center",
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: "Financial Overview",
                heading: HeadingLevel.HEADING_2,
              }),
              new DocxTable({
                width: { size: 100, type: "pct" },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Category")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Amount")] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Total Salary")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${totalSalary.toLocaleString()}`)] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Total Bonus")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${totalBonus.toLocaleString()}`)] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Total OT")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${totalOT.toLocaleString()}`)] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Total EPF")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${totalEPF.toLocaleString()}`)] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Total ETF")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${totalETF.toLocaleString()}`)] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun("Total Labor Cost")] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(`$${(totalSalary + totalEPF + totalETF).toLocaleString()}`)] })] }),
                    ],
                  }),
                ],
              }),
            ],
          }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `financial-summary-${dayjs().format('YYYY-MM-DD')}.docx`);
      } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet([
          {
            'Category': 'Total Salary',
            'Amount': totalSalary
          },
          {
            'Category': 'Total Bonus',
            'Amount': totalBonus
          },
          {
            'Category': 'Total OT',
            'Amount': totalOT
          },
          {
            'Category': 'Total EPF',
            'Amount': totalEPF
          },
          {
            'Category': 'Total ETF',
            'Amount': totalETF
          },
          {
            'Category': 'Total Labor Cost',
            'Amount': totalSalary + totalEPF + totalETF
          }
        ]);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Summary');
        XLSX.writeFile(workbook, `financial-summary-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      }

      message.success(`Financial summary generated successfully!`);
    } catch (error) {
      console.error('Error generating financial summary:', error);
      message.error('Failed to generate report');
    }
  };

  // Enhanced Table Columns with CRUD operations
  const payrollColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Date',
      dataIndex: 'salarydate',
      key: 'salarydate',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicsalary',
      key: 'basicsalary',
      render: (amount) => `$${amount?.toLocaleString() || '0'}`
    },
    {
      title: 'Total Salary',
      dataIndex: 'totalsalary',
      key: 'totalsalary',
      render: (amount) => `$${amount?.toLocaleString() || '0'}`
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
              Modal.info({
                title: 'Salary Details',
                content: (
                  <Descriptions column={1}>
                    <Descriptions.Item label="Employee">{record.employee?.full_name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Department">{record.employee?.department || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Basic Salary">${record.basicsalary?.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="OT Pay">${record.otpay?.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Bonus Pay">${record.bonuspay?.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Total Salary">${record.totalsalary?.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Date">{dayjs(record.salarydate).format('DD/MM/YYYY')}</Descriptions.Item>
                  </Descriptions>
                )
              });
            }}
          >
            View
          </Button>
          <Popconfirm
            title="Delete Salary Record"
            description="Are you sure you want to delete this salary record?"
            onConfirm={() => handleDeleteSalary(record.salaryid)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const loanColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Loan Type',
      dataIndex: ['loantype', 'loantype'],
      key: 'loantype',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount?.toLocaleString() || '0'}`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration || 0} months`
    },
    {
      title: 'Interest Rate',
      dataIndex: 'interestrate',
      key: 'interestrate',
      render: (rate) => `${rate || 0}%`
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'
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
          {status?.toUpperCase() || 'PENDING'}
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
      dataIndex: ['employee', 'full_name'],
      key: 'employee',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount?.toLocaleString() || '0'}`
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (text) => text || 'N/A'
    },
    {
      title: 'Date',
      dataIndex: 'bonusdate',
      key: 'bonusdate',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Delete Bonus Record"
            description="Are you sure you want to delete this bonus record?"
            onConfirm={() => handleDeleteBonus(record.bonusid)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const otColumns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'full_name'],
      key: 'employee',
      render: (text) => text || 'N/A'
    },
    {
      title: 'OT Hours',
      dataIndex: 'othours',
      key: 'othours',
      render: (hours) => hours || '0'
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate) => `$${rate || '0'}`
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount?.toLocaleString() || '0'}`
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : 'orange'}>
          {status || 'pending'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Delete OT Record"
            description="Are you sure you want to delete this OT record?"
            onConfirm={() => handleDeleteOT(record.otid)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (!user) {
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
                {user?.email}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Text style={{ color: 'white' }}>Date Range:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="YYYY-MM-DD"
                style={{ background: 'white' }}
              />
              <Button
                type="primary"
                icon={<UserOutlined />}
                onClick={() => setEmployeeSelectionModalVisible(true)}
              >
                Select Employee
              </Button>
              <Text style={{ color: 'white' }}>
                Last updated: {new Date().toLocaleTimeString()}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Welcome Alert */}
      <Alert
        message={`Welcome back! Managing data from ${dateRange[0].format('MMM D, YYYY')} to ${dateRange[1].format('MMM D, YYYY')}`}
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
            user={user}
            onProcessSalary={() => setSalaryModalVisible(true)}
            onGeneratePayrollReport={generatePayrollReport}
            onGenerateEPFReport={generateEPFReport}
            onGenerateLoanReport={generateLoanReport}
            loanRequests={loanRequests}
            dateRange={dateRange}
          />
        </TabPane>

        <TabPane tab="Payroll Management" key="payroll">
          <PayrollTab
            payrollData={payrollData}
            pendingPayments={pendingPayments}
            payrollColumns={payrollColumns}
            onProcessSalary={() => setSalaryModalVisible(true)}
            onProcessPayment={handleProcessPayment}
            dateRange={dateRange}
          />
        </TabPane>

        <TabPane tab="EPF/ETF" key="epf">
          <EPFTab
            epfContributions={epfContributions}
            etfContributions={etfContributions}
            onProcessEPF={() => setEpfModalVisible(true)}
            onGenerateEPFReport={generateEPFReport}
            dateRange={dateRange}
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
            dateRange={dateRange}
          />
        </TabPane>

        <TabPane tab="Bonus & OT" key="bonus">
          <BonusOTTab
            bonusData={bonusData}
            otData={otData}
            bonusColumns={bonusColumns}
            otColumns={otColumns}
            onAddBonus={() => setBonusModalVisible(true)}
            onAddOT={() => setOtModalVisible(true)}
            dateRange={dateRange}
          />
        </TabPane>

        <TabPane tab="KPI Management" key="kpi">
          <KPITab
            kpiData={kpiData}
            onAddKPI={() => setKpiModalVisible(true)}
            dateRange={dateRange}
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
            dateRange={dateRange}
          />
        </TabPane>

        <TabPane tab="Recent Activities" key="activities">
          <ActivitiesTab recentActivities={recentActivities} dateRange={dateRange} />
        </TabPane>
      </Tabs>

      {/* Employee Selection Modal */}
      <Modal
        title="Select Employee"
        open={employeeSelectionModalVisible}
        onCancel={() => setEmployeeSelectionModalVisible(false)}
        footer={null}
        width={800}
      >
        <Input
          placeholder="Search employees by name, email, or department..."
          prefix={<SearchOutlined />}
          value={employeeSearch}
          onChange={(e) => setEmployeeSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <List
          dataSource={filteredEmployees}
          renderItem={employee => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleEmployeeSelect(employee)}
                >
                  Select
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<UserOutlined />}
                title={employee.full_name}
                description={
                  <Space direction="vertical" size={0}>
                    <Text>Email: {employee.email}</Text>
                    <Text>Department: {employee.department}</Text>
                    <Text>Role: {employee.role}</Text>
                    <Text>Basic Salary: ${employee.basicsalary?.toLocaleString()}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

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
              <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: 'Please select an employee' }]}>
                <Select
                  placeholder="Select employee"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {employees.map(emp => (
                    <Option key={emp.empid} value={emp.empid}>
                      {emp.full_name} - {emp.department} (${emp.basicsalary?.toLocaleString()})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryDate" label="Salary Date" rules={[{ required: true, message: 'Please select salary date' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Salary Components</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true, message: 'Please enter basic salary' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Enter basic salary"
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="otHours" label="OT Hours">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Enter OT hours"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="otRate" label="OT Rate per Hour">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Enter OT rate"
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
                  placeholder="Enter bonus amount"
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
                  placeholder="Enter increment amount"
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="noPayDays" label="No Pay Days">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={31}
                  placeholder="Enter no pay days"
                />
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
                  <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: 'Please select an employee' }]}>
                    <Select
                      placeholder="Select employee"
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {employees.map(emp => (
                        <Option key={emp.empid} value={emp.empid}>
                          {emp.full_name} - ${emp.basicsalary?.toLocaleString()}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contributionMonth" label="Contribution Month" rules={[{ required: true, message: 'Please select contribution month' }]}>
                    <DatePicker picker="month" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true, message: 'Please enter basic salary' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Enter basic salary"
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
                  <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: 'Please select an employee' }]}>
                    <Select
                      placeholder="Select employee"
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {employees.map(emp => (
                        <Option key={emp.empid} value={emp.empid}>
                          {emp.full_name} - ${emp.basicsalary?.toLocaleString()}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contributionMonth" label="Contribution Month" rules={[{ required: true, message: 'Please select contribution month' }]}>
                    <DatePicker picker="month" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="basicSalary" label="Basic Salary" rules={[{ required: true, message: 'Please enter basic salary' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Enter basic salary"
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
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: 'Please select an employee' }]}>
            <Select
              placeholder="Select employee"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {employees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.full_name} - {emp.department}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="bonusType" label="Bonus Type" rules={[{ required: true, message: 'Please select bonus type' }]}>
            <Select placeholder="Select bonus type">
              <Option value="performance">Performance Bonus</Option>
              <Option value="annual">Annual Bonus</Option>
              <Option value="special">Special Bonus</Option>
              <Option value="festival">Festival Bonus</Option>
            </Select>
          </Form.Item>

          <Form.Item name="amount" label="Bonus Amount" rules={[{ required: true, message: 'Please enter bonus amount' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="Enter bonus amount"
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="bonusDate" label="Bonus Date" rules={[{ required: true, message: 'Please select bonus date' }]}>
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
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: 'Please select an employee' }]}>
            <Select
              placeholder="Select employee"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {employees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.full_name} - {emp.department}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="otType" label="OT Type" rules={[{ required: true, message: 'Please select OT type' }]}>
            <Select placeholder="Select OT type">
              <Option value="weekday">Weekday OT</Option>
              <Option value="weekend">Weekend OT</Option>
              <Option value="holiday">Holiday OT</Option>
            </Select>
          </Form.Item>

          <Form.Item name="othours" label="OT Hours" rules={[{ required: true, message: 'Please enter OT hours' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.5}
              placeholder="Enter OT hours"
            />
          </Form.Item>

          <Form.Item name="rate" label="OT Rate per Hour" rules={[{ required: true, message: 'Please enter OT rate' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="Enter OT rate per hour"
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
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: 'Please select an employee' }]}>
            <Select
              placeholder="Select employee"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {employees.map(emp => (
                <Option key={emp.empid} value={emp.empid}>
                  {emp.full_name} - {emp.department}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="kpivalue" label="KPI Value" rules={[{ required: true, message: 'Please enter KPI value' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              placeholder="Enter KPI value (0-100)"
            />
          </Form.Item>

          <Form.Item name="calculateDate" label="Calculation Date" rules={[{ required: true, message: 'Please select calculation date' }]}>
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
              <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: 'Please select an employee' }]}>
                <Select
                  placeholder="Select employee"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {employees.map(emp => (
                    <Option key={emp.empid} value={emp.empid}>
                      {emp.full_name} - {emp.department} (${emp.basicsalary?.toLocaleString()})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="loanTypeId" label="Loan Type" rules={[{ required: true, message: 'Please select loan type' }]}>
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
              <Form.Item name="amount" label="Loan Amount" rules={[{ required: true, message: 'Please enter loan amount' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Enter loan amount"
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="Duration (months)" rules={[{ required: true, message: 'Please enter duration' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={60}
                  placeholder="Enter duration in months"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="interestRate" label="Interest Rate (%)" rules={[{ required: true, message: 'Please enter interest rate' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="Enter interest rate"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="loanDate" label="Loan Date" rules={[{ required: true, message: 'Please select loan date' }]}>
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

// Enhanced Tab Components with date range
const OverviewTab = ({ financialData, pendingPayments, recentActivities, user, onProcessSalary, onGeneratePayrollReport, onGenerateEPFReport, onGenerateLoanReport, loanRequests, dateRange }) => {
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
              title={`Total Salary (${dateRange[0].format('MMM D')} - ${dateRange[1].format('MMM D')})`}
              value={financialData.totalSalary}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={value => `$${Number(value).toLocaleString()}`}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Selected period</Text>
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
              <Button icon={<FileWordOutlined />} onClick={() => onGeneratePayrollReport('docx')}>
                Payroll Report (DOCX)
              </Button>
              <Button icon={<FileExcelOutlined />} onClick={() => onGeneratePayrollReport('excel')}>
                Payroll Report (Excel)
              </Button>
              <Button icon={<FileWordOutlined />} onClick={() => onGenerateEPFReport('docx')}>
                EPF Report (DOCX)
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card title={`Recent Activities (${dateRange[0].format('MMM D')} - ${dateRange[1].format('MMM D')})`} size="small">
            {recentActivities.length > 0 ? (
              <Timeline>
                {recentActivities.slice(0, 5).map((activity, index) => (
                  <Timeline.Item
                    key={index}
                    dot={<SyncOutlined style={{ fontSize: '16px' }} />}
                    color="blue"
                  >
                    <Space direction="vertical" size={0}>
                      <Text strong>{activity.operation?.replace('_', ' ') || 'Unknown Operation'}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
                      </Text>
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="No recent activities" />
            )}
          </Card>
        </Col>

        {/* Pending Items */}
        <Col xs={24} lg={12}>
          <Card title="Pending Items" size="small">
            <Collapse ghost>
              <Panel header={`Pending Payments (${pendingPayments.length})`} key="1">
                {pendingPayments.length > 0 ? (
                  <List
                    dataSource={pendingPayments.slice(0, 3)}
                    renderItem={payment => (
                      <List.Item>
                        <List.Item.Meta
                          title={payment.employee?.full_name || 'Unknown Employee'}
                          description={`Amount: $${payment.totalsalary?.toLocaleString() || '0'}`}
                        />
                        <Tag color="orange">Pending</Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No pending payments" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Panel>
              <Panel header={`Pending Loans (${financialData.pendingLoansCount})`} key="2">
                {loanRequests.filter(loan => loan.status === 'pending').length > 0 ? (
                  <List
                    dataSource={loanRequests.filter(loan => loan.status === 'pending').slice(0, 3)}
                    renderItem={loan => (
                      <List.Item>
                        <List.Item.Meta
                          title={loan.employee?.full_name || 'Unknown Employee'}
                          description={`${loan.loantype?.loantype || 'Unknown Type'} - $${loan.amount?.toLocaleString() || '0'}`}
                        />
                        <Tag color="orange">Pending</Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No pending loans" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Panel>
            </Collapse>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const PayrollTab = ({ payrollData, pendingPayments, payrollColumns, onProcessSalary, onProcessPayment, dateRange }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card
          title={`Payroll Management (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onProcessSalary}>
              Process Salary
            </Button>
          }
        >
          <Alert
            message="Payroll Processing"
            description="Process salaries for employees, including OT, bonuses, increments, and deductions for the selected period."
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
          {pendingPayments.length > 0 ? (
            <Table
              dataSource={pendingPayments}
              columns={payrollColumns}
              pagination={{ pageSize: 10 }}
              rowKey="salaryid"
            />
          ) : (
            <Empty description="No pending payments" />
          )}
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col span={24}>
        <Card title={`Payroll History (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}>
          {payrollData.length > 0 ? (
            <Table
              dataSource={payrollData}
              columns={payrollColumns}
              pagination={{ pageSize: 10 }}
              rowKey="salaryid"
            />
          ) : (
            <Empty description="No payroll data for the selected period" />
          )}
        </Card>
      </Col>
    </Row>
  </div>
);

const EPFTab = ({ epfContributions, etfContributions, onProcessEPF, onGenerateEPFReport, dateRange }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card
          title={`EPF/ETF Management (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}
          extra={
            <Space>
              <Button onClick={() => onGenerateEPFReport('excel')} icon={<FileExcelOutlined />}>
                Excel Report
              </Button>
              <Button onClick={() => onGenerateEPFReport('docx')} icon={<FileWordOutlined />}>
                DOCX Report
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={onProcessEPF}>
                Process Contribution
              </Button>
            </Space>
          }
        >
          <Alert
            message="EPF/ETF Contributions"
            description="Employee Provident Fund (8% + 12%) and Employer Trust Fund (3%) contributions calculation and processing for the selected period."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Tabs defaultActiveKey="epf">
      <TabPane tab="EPF Contributions" key="epf">
        <Card title={`EPF Contributions History (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}>
          {epfContributions.length > 0 ? (
            <Table
              dataSource={epfContributions}
              columns={[
                {
                  title: 'Employee',
                  dataIndex: ['employee', 'full_name'],
                  key: 'employee',
                  render: (text) => text || 'N/A'
                },
                {
                  title: 'Department',
                  dataIndex: ['employee', 'department'],
                  key: 'department',
                  render: (text) => text || 'N/A'
                },
                {
                  title: 'Date',
                  dataIndex: 'month',
                  key: 'month',
                  render: (date) => date ? dayjs(date).format('MMMM D, YYYY') : 'N/A'
                },
                {
                  title: 'Basic Salary',
                  dataIndex: 'basicsalary',
                  key: 'basicsalary',
                  render: (amount) => `$${amount?.toLocaleString() || '0'}`
                },
                {
                  title: 'Employee EPF (8%)',
                  dataIndex: 'employeecontribution',
                  key: 'employeecontribution',
                  render: (amount) => `$${amount?.toLocaleString() || '0'}`
                },
                {
                  title: 'Employer EPF (12%)',
                  dataIndex: 'employercontribution',
                  key: 'employercontribution',
                  render: (amount) => `$${amount?.toLocaleString() || '0'}`
                },
                {
                  title: 'Total Contribution',
                  dataIndex: 'totalcontribution',
                  key: 'totalcontribution',
                  render: (amount) => `$${amount?.toLocaleString() || '0'}`
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 'processed' ? 'green' : 'orange'}>
                      {status || 'pending'}
                    </Tag>
                  )
                }
              ]}
              pagination={{ pageSize: 10 }}
              rowKey="id"
            />
          ) : (
            <Empty description="No EPF contributions for the selected period" />
          )}
        </Card>
      </TabPane>
      <TabPane tab="ETF Contributions" key="etf">
        <Card title={`ETF Contributions History (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}>
          {etfContributions.length > 0 ? (
            <Table
              dataSource={etfContributions}
              columns={[
                {
                  title: 'Employee',
                  dataIndex: ['employee', 'full_name'],
                  key: 'employee',
                  render: (text) => text || 'N/A'
                },
                {
                  title: 'Department',
                  dataIndex: ['employee', 'department'],
                  key: 'department',
                  render: (text) => text || 'N/A'
                },
                {
                  title: 'Date',
                  dataIndex: 'month',
                  key: 'month',
                  render: (date) => date ? dayjs(date).format('MMMM D, YYYY') : 'N/A'
                },
                {
                  title: 'Basic Salary',
                  dataIndex: 'basicsalary',
                  key: 'basicsalary',
                  render: (amount) => `$${amount?.toLocaleString() || '0'}`
                },
                {
                  title: 'Employer ETF (3%)',
                  dataIndex: 'employercontribution',
                  key: 'employercontribution',
                  render: (amount) => `$${amount?.toLocaleString() || '0'}`
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 'processed' ? 'green' : 'orange'}>
                      {status || 'pending'}
                    </Tag>
                  )
                }
              ]}
              pagination={{ pageSize: 10 }}
              rowKey="id"
            />
          ) : (
            <Empty description="No ETF contributions for the selected period" />
          )}
        </Card>
      </TabPane>
    </Tabs>
  </div>
);

const LoanTab = ({ loanRequests, loanColumns, employees, loanTypes, onProcessLoan, onCheckEligibility, onApproveLoan, onRejectLoan, onGenerateLoanReport, dateRange }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card
          title={`Loan Management (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}
          extra={
            <Space>
              <Button onClick={() => onGenerateLoanReport('excel')} icon={<FileExcelOutlined />}>
                Excel Report
              </Button>
              <Button onClick={() => onGenerateLoanReport('docx')} icon={<FileWordOutlined />}>
                DOCX Report
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={onProcessLoan}>
                Create Loan
              </Button>
            </Space>
          }
        >
          <Alert
            message="Loan Management"
            description="Manage staff loans including home loans, emergency loans, education loans, vehicle loans, and product loans for the selected period."
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

    <Card title={`Loan Requests (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}>
      {loanRequests.length > 0 ? (
        <Table
          dataSource={loanRequests}
          columns={loanColumns}
          pagination={{ pageSize: 10 }}
          rowKey="loanrequestid"
        />
      ) : (
        <Empty description="No loan requests for the selected period" />
      )}
    </Card>
  </div>
);

const BonusOTTab = ({ bonusData, otData, bonusColumns, otColumns, onAddBonus, onAddOT, dateRange }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card
          title={`Bonus & Overtime Management (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}
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
            description="Manage employee bonuses and overtime payments with different types and rates for the selected period."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Tabs defaultActiveKey="bonus">
      <TabPane tab="Bonus Management" key="bonus">
        <Card title={`Bonus History (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}>
          {bonusData.length > 0 ? (
            <Table
              dataSource={bonusData}
              columns={bonusColumns}
              pagination={{ pageSize: 10 }}
              rowKey="bonusid"
            />
          ) : (
            <Empty description="No bonus data for the selected period" />
          )}
        </Card>
      </TabPane>
      <TabPane tab="Overtime Management" key="ot">
        <Card title={`Overtime History (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}>
          {otData.length > 0 ? (
            <Table
              dataSource={otData}
              columns={otColumns}
              pagination={{ pageSize: 10 }}
              rowKey="otid"
            />
          ) : (
            <Empty description="No overtime data for the selected period" />
          )}
        </Card>
      </TabPane>
    </Tabs>
  </div>
);

const KPITab = ({ kpiData, onAddKPI, dateRange }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card
          title={`KPI Management (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddKPI}>
              Add KPI
            </Button>
          }
        >
          <Alert
            message="Key Performance Indicators"
            description="Manage employee performance metrics and track KPI scores for salary calculations and promotions for the selected period."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Card title={`KPI History (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}>
      {kpiData.length > 0 ? (
        <Table
          dataSource={kpiData}
          columns={[
            {
              title: 'Employee',
              dataIndex: ['employee', 'full_name'],
              key: 'employee',
              render: (text) => text || 'N/A'
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
              title: 'Calculation Date',
              dataIndex: 'calculatedate',
              key: 'calculatedate',
              render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'
            },
            {
              title: 'Year',
              dataIndex: 'kpiyear',
              key: 'kpiyear',
              render: (year) => year || 'N/A'
            }
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="kpiid"
        />
      ) : (
        <Empty description="No KPI data for the selected period" />
      )}
    </Card>
  </div>
);

const ReportsTab = ({
  onGeneratePayrollReport,
  onGenerateEPFReport,
  onGenerateLoanReport,
  onGenerateFinancialSummary,
  financialData,
  payrollData,
  loanRequests,
  dateRange
}) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title={`Financial Reports & Analytics (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`}>
          <Alert
            message="Report Generation"
            description="Generate comprehensive financial reports in DOCX (Word) and XLSX (Excel) formats with detailed analytics and charts for the selected period."
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
                  <Button type="link" icon={<FileWordOutlined />} onClick={() => onGeneratePayrollReport('docx')}>
                    DOCX
                  </Button>,
                  <Button type="link" icon={<FileExcelOutlined />} onClick={() => onGeneratePayrollReport('excel')}>
                    Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                  title="Payroll Report"
                  description="Payroll summary with employee details, OT, bonuses and totals"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                hoverable
                actions={[
                  <Button type="link" icon={<FileWordOutlined />} onClick={() => onGenerateEPFReport('docx')}>
                    DOCX
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
                  <Button type="link" icon={<FileWordOutlined />} onClick={() => onGenerateLoanReport('docx')}>
                    DOCX
                  </Button>,
                  <Button type="link" icon={<FileExcelOutlined />} onClick={() => onGenerateLoanReport('excel')}>
                    Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<DollarOutlined style={{ fontSize: '24px', color: '#faad14' }} />}
                  title="Loan Report"
                  description="Employee loan requests, approvals and repayment schedules"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                hoverable
                actions={[
                  <Button type="link" icon={<FileWordOutlined />} onClick={() => onGenerateFinancialSummary('docx')}>
                    DOCX
                  </Button>,
                  <Button type="link" icon={<FileExcelOutlined />} onClick={() => onGenerateFinancialSummary('excel')}>
                    Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<PieChartOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />}
                  title="Financial Summary"
                  description="Comprehensive financial overview with cost breakdowns"
                />
              </Card>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Report Summary">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Total Payroll Amount">
              ${financialData.totalSalary?.toLocaleString() || '0'}
            </Descriptions.Item>
            <Descriptions.Item label="Total EPF/ETF Contributions">
              ${(financialData.totalEPF + financialData.totalETF)?.toLocaleString() || '0'}
            </Descriptions.Item>
            <Descriptions.Item label="Total Processed Salaries">
              {payrollData.filter(p => p.processed_by).length} / {payrollData.length}
            </Descriptions.Item>
            <Descriptions.Item label="Pending Loan Requests">
              {loanRequests.filter(l => l.status === 'pending').length}
            </Descriptions.Item>
            <Descriptions.Item label="Report Period">
              {dateRange[0].format('MMM D, YYYY')} to {dateRange[1].format('MMM D, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Data Availability">
              {payrollData.length > 0 ? 'Data Available' : 'No Data'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    </Row>
  </div>
);

const ActivitiesTab = ({ recentActivities, dateRange }) => (
  <div>
    <Card title={`Accountant Activities Log (${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')})`} extra={<Tag color="blue">{recentActivities.length} activities</Tag>}>
      {recentActivities.length > 0 ? (
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
                      <Text strong>{activity.operation?.replace(/_/g, ' ') || 'Unknown Operation'}</Text>
                    </Col>
                    <Col>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
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
      ) : (
        <Empty description="No activities recorded in the selected period" />
      )}
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
      switch (loanType.loantype?.toLowerCase()) {
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

      if (employee.basicsalary < 25000 && loanType.loantype?.toLowerCase() !== 'emergency loan') {
        eligible = false;
        reasons.push('Basic salary below minimum requirement');
      }

      return {
        loanType: loanType.loantype || 'Unknown',
        eligible,
        maxAmount,
        reasons: reasons.length > 0 ? reasons : ['Eligible for this loan type']
      };
    });

    setEligibilityResults(results);
  };

  return (
    <div>
      <Descriptions title={`Loan Eligibility - ${employee.full_name || 'Unknown Employee'}`} bordered>
        <Descriptions.Item label="Department">{employee.department || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Basic Salary">${employee.basicsalary?.toLocaleString() || '0'}</Descriptions.Item>
        <Descriptions.Item label="Role">{employee.role || 'N/A'}</Descriptions.Item>
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