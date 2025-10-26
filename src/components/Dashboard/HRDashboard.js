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
  Avatar,
  Progress,
  Timeline,
  Badge,
  Tooltip,
  Alert,
  Divider,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Table,
  message,
  Upload,
  Switch,
  Descriptions,
  InputNumber,
  Radio,
  Popconfirm,
  Empty,
  Dropdown,
  Menu,
  Spin,
  Result
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  MailOutlined,
  MinusCircleOutlined,
  PhoneOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  StarOutlined,
  TrophyOutlined,
  FileTextOutlined,
  DownloadOutlined,
  HistoryOutlined,
  SolutionOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  RiseOutlined,
  BarChartOutlined,
  SettingOutlined,
  MoreOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  CrownOutlined,
  IdcardOutlined,
  ClusterOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocTable, TableCell, TableRow, TextRun } from 'docx';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const HRDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for all features
  const [dashboardData, setDashboardData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [recruitmentStats, setRecruitmentStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [positions, setPositions] = useState([]);
  const [positionHistory, setPositionHistory] = useState([]);
  const [trainingParticipants, setTrainingParticipants] = useState([]);
  const [kpiCategories, setKpiCategories] = useState([]);

  // Modal states
  const [addEmployeeModalVisible, setAddEmployeeModalVisible] = useState(false);
  const [editEmployeeModalVisible, setEditEmployeeModalVisible] = useState(false);
  const [promoteEmployeeModalVisible, setPromoteEmployeeModalVisible] = useState(false);
  const [kpiModalVisible, setKpiModalVisible] = useState(false);
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [viewEmployeeModalVisible, setViewEmployeeModalVisible] = useState(false);
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);

  // Form states
  const [employeeForm] = Form.useForm();
  const [editEmployeeForm] = Form.useForm();
  const [promoteEmployeeForm] = Form.useForm();
  const [kpiForm] = Form.useForm();
  const [trainingForm] = Form.useForm();
  const [positionForm] = Form.useForm();
  const [reportForm] = Form.useForm();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Date range for reports
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  useEffect(() => {
    initializeDashboard();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees, departmentFilter, statusFilter]);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployeeStats(),
        fetchEmployees(),
        fetchPendingLeaves(),
        fetchRecruitmentStats(),
        fetchRecentActivities(),
        fetchTrainingData(),
        fetchKpiData(),
        fetchPromotions(),
        fetchPositions(),
        fetchPositionHistory(),
        fetchKpiCategories()
      ]);
    } catch (error) {
      console.error('Error initializing HR dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeStats = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, status, department, is_active, created_at, role, gender')
        .eq('is_active', true);

      if (error) throw error;

      const totalEmployees = data?.length || 0;
      const departments = [...new Set(data?.map(emp => emp.department).filter(Boolean))];
      const activeEmployees = data?.filter(emp => emp.status === 'Active').length || 0;
      const newHires = data?.filter(emp => {
        const joinDate = dayjs(emp.created_at);
        return joinDate.isAfter(dayjs().subtract(30, 'day'));
      }).length || 0;

      // Gender distribution
      const genderDistribution = data?.reduce((acc, emp) => {
        acc[emp.gender] = (acc[emp.gender] || 0) + 1;
        return acc;
      }, {});

      // Role distribution
      const roleDistribution = data?.reduce((acc, emp) => {
        acc[emp.role] = (acc[emp.role] || 0) + 1;
        return acc;
      }, {});

      setDashboardData({
        employeeStats: { totalEmployees, departments: departments.length, activeEmployees, newHires },
        roleDistribution,
        genderDistribution
      });
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPendingLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('employeeleave')
        .select(`
          *,
          employee:empid (first_name, last_name, email, department, role),
          leavetype:leavetype_id(leavetype)
        `)
        .eq('leavestatus', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaves(data || []);
    } catch (error) {
      console.error('Error fetching pending leaves:', error);
    }
  };

  const fetchRecruitmentStats = async () => {
    try {
      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('status', 'open');

      const { data: newHires } = await supabase
        .from('employee')
        .select('empid')
        .gte('created_at', dayjs().startOf('month').format('YYYY-MM-DD'));

      const { data: applications } = await supabase
        .from('employee')
        .select('empid')
        .is('status', 'Applied');

      setRecruitmentStats({
        openPositions: positions?.length || 0,
        newHiresThisMonth: newHires?.length || 0,
        pendingApplications: applications?.length || 0,
        interviewSchedule: 8
      });
    } catch (error) {
      console.error('Error fetching recruitment stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_operations')
        .select(`
          *,
          hr:hr_id (first_name, last_name),
          target_employee:target_employee_id (first_name, last_name)
        `)
        .order('operation_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchTrainingData = async () => {
    try {
      const { data, error } = await supabase
        .from('training')
        .select(`
          *,
          training_participants!inner (employee:empid (first_name, last_name))
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTrainingData(data || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
    }
  };

  const fetchKpiData = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi')
        .select(`
          *,
          employee:empid (first_name, last_name, department),
          kpiranking:kpiranking_id (kpirank)
        `)
        .order('calculatedate', { ascending: false })
        .limit(10);

      if (error) throw error;
      setKpiData(data || []);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_history')
        .select(`
          *,
          employee:empid (first_name, last_name)
        `)
        .order('promotion_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchPositionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('position_history')
        .select(`
          *,
          employee:empid (first_name, last_name)
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPositionHistory(data || []);
    } catch (error) {
      console.error('Error fetching position history:', error);
    }
  };

  const fetchKpiCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi_categories')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setKpiCategories(data || []);
    } catch (error) {
      console.error('Error fetching KPI categories:', error);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    setFilteredEmployees(filtered);
  };

  // Enhanced Action handlers
  const handleAddEmployee = async (values) => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password || 'defaultpassword123',
        options: {
          data: {
            full_name: `${values.first_name} ${values.last_name}`,
            role: values.role,
            email_confirm: true
          }
        }
      });

      if (authError) throw authError;

      // Then create employee record
      const { data: employeeData, error: employeeError } = await supabase
        .from('employee')
        .insert([{
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role: values.role,
          department: values.department,
          phone: values.phone,
          gender: values.gender,
          dob: values.dob?.format('YYYY-MM-DD'),
          empaddress: values.address,
          status: 'Active',
          is_active: true,
          auth_user_id: authData.user?.id,
          created_at: new Date().toISOString(),
          basicsalary: values.basicsalary || 0
        }])
        .select();

      if (employeeError) throw employeeError;

      // Add position history
      await supabase
        .from('position_history')
        .insert([{
          empid: employeeData[0].empid,
          position_title: values.role,
          department: values.department,
          start_date: new Date().toISOString().split('T')[0],
          is_current: true
        }]);

      await logHROperation('ADD_EMPLOYEE', employeeData[0].empid, {
        employeeName: `${values.first_name} ${values.last_name}`,
        role: values.role,
        department: values.department
      });

      message.success('Employee added successfully!');
      setAddEmployeeModalVisible(false);
      employeeForm.resetFields();
      fetchEmployees();
      fetchEmployeeStats();
      fetchRecentActivities();
      fetchPositionHistory();
    } catch (error) {
      console.error('Error adding employee:', error);
      message.error('Failed to add employee');
    }
  };

  const handleEditEmployee = async (values) => {
    try {
      const { error } = await supabase
        .from('employee')
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role: values.role,
          department: values.department,
          phone: values.phone,
          gender: values.gender,
          dob: values.dob?.format('YYYY-MM-DD'),
          empaddress: values.address,
          status: values.status,
          is_active: values.is_active,
          basicsalary: values.basicsalary,
          updated_at: new Date().toISOString()
        })
        .eq('empid', values.empid);

      if (error) throw error;

      // Update position history if role or department changed
      if (values.role || values.department) {
        await supabase
          .from('position_history')
          .update({ is_current: false })
          .eq('empid', values.empid)
          .eq('is_current', true);

        await supabase
          .from('position_history')
          .insert([{
            empid: values.empid,
            position_title: values.role,
            department: values.department,
            start_date: new Date().toISOString().split('T')[0],
            is_current: true
          }]);
      }

      await logHROperation('UPDATE_EMPLOYEE', values.empid, {
        updates: values
      });

      message.success('Employee updated successfully!');
      setEditEmployeeModalVisible(false);
      editEmployeeForm.resetFields();
      fetchEmployees();
      fetchEmployeeStats();
      fetchRecentActivities();
      fetchPositionHistory();
    } catch (error) {
      console.error('Error updating employee:', error);
      message.error('Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (employeeId, employeeName) => {
    try {
      const { error } = await supabase
        .from('employee')
        .update({
          is_active: false,
          status: 'Inactive',
          updated_at: new Date().toISOString()
        })
        .eq('empid', employeeId);

      if (error) throw error;

      await logHROperation('DELETE_EMPLOYEE', employeeId, {
        employeeName: employeeName
      });

      message.success('Employee deactivated successfully!');
      fetchEmployees();
      fetchEmployeeStats();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error deleting employee:', error);
      message.error('Failed to deactivate employee');
    }
  };

  const handlePromoteEmployee = async (values) => {
    try {
      // Update employee role
      const { error: updateError } = await supabase
        .from('employee')
        .update({
          role: values.new_role,
          department: values.department,
          updated_at: new Date().toISOString()
        })
        .eq('empid', values.empid);

      if (updateError) throw updateError;

      // Update position history
      await supabase
        .from('position_history')
        .update({ is_current: false })
        .eq('empid', values.empid)
        .eq('is_current', true);

      await supabase
        .from('position_history')
        .insert([{
          empid: values.empid,
          position_title: values.new_role,
          department: values.department,
          start_date: new Date().toISOString().split('T')[0],
          is_current: true
        }]);

      // Add to promotion history
      const { error: promotionError } = await supabase
        .from('promotion_history')
        .insert([{
          empid: values.empid,
          previousrole: values.previous_role,
          newrole: values.new_role,
          promotedby: profile.empid,
          promotion_date: new Date().toISOString()
        }]);

      if (promotionError) throw promotionError;

      await logHROperation('PROMOTE_EMPLOYEE', values.empid, {
        previousRole: values.previous_role,
        newRole: values.new_role,
        department: values.department,
        recommendation: values.recommendation
      });

      message.success('Employee promoted successfully!');
      setPromoteEmployeeModalVisible(false);
      promoteEmployeeForm.resetFields();
      fetchEmployees();
      fetchPromotions();
      fetchRecentActivities();
      fetchPositionHistory();
    } catch (error) {
      console.error('Error promoting employee:', error);
      message.error('Failed to promote employee');
    }
  };

  const handleAddKPI = async (values) => {
    try {
      // Determine KPI ranking based on value
      let kpirankingid = 1; // Default to lowest rank
      if (values.kpivalue >= 90) kpirankingid = 4; // Excellent
      else if (values.kpivalue >= 80) kpirankingid = 3; // Good
      else if (values.kpivalue >= 70) kpirankingid = 2; // Average

      const { data, error } = await supabase
        .from('kpi')
        .insert([{
          empid: values.empid,
          kpivalue: values.kpivalue,
          calculatedate: values.calculation_date.format('YYYY-MM-DD'),
          kpiyear: values.calculation_date.year(),
          kpirankingid: kpirankingid,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Add KPI details for categories
      if (values.categories && values.categories.length > 0) {
        const kpiDetails = values.categories.map(cat => ({
          kpiid: data[0].kpiid,
          category_id: cat.category_id,
          score: cat.score,
          comments: cat.comments
        }));

        await supabase
          .from('kpi_details')
          .insert(kpiDetails);
      }

      // Update employee's KPI score
      await supabase
        .from('employee')
        .update({ kpiscore: values.kpivalue })
        .eq('empid', values.empid);

      await logHROperation('ADD_KPI', data[0].kpiid, {
        employeeId: values.empid,
        kpiValue: values.kpivalue,
        ranking: kpirankingid
      });

      message.success('KPI added successfully!');
      setKpiModalVisible(false);
      kpiForm.resetFields();
      fetchKpiData();
      fetchEmployees();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error adding KPI:', error);
      message.error('Failed to add KPI');
    }
  };

  const handleScheduleTraining = async (values) => {
    try {
      const { data, error } = await supabase
        .from('training')
        .insert([{
          topic: values.topic,
          venue: values.venue,
          trainer: values.trainer,
          duration: values.duration,
          date: values.training_date.format('YYYY-MM-DD'),
          starttime: values.start_time?.format('HH:mm:ss'),
          endtime: values.end_time?.format('HH:mm:ss'),
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Link employees to training
      if (values.employees && values.employees.length > 0) {
        // Add to training_participants
        const participants = values.employees.map(empId => ({
          trainingid: data[0].trainingid,
          empid: empId,
          status: 'scheduled'
        }));

        await supabase
          .from('training_participants')
          .insert(participants);
      }

      await logHROperation('SCHEDULE_TRAINING', data[0].trainingid, {
        topic: values.topic,
        trainer: values.trainer,
        date: values.training_date.format('YYYY-MM-DD'),
        participants: values.employees?.length || 0
      });

      message.success('Training scheduled successfully!');
      setTrainingModalVisible(false);
      trainingForm.resetFields();
      fetchTrainingData();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error scheduling training:', error);
      message.error('Failed to schedule training');
    }
  };

  const handleAddPosition = async (values) => {
    try {
      const { error } = await supabase
        .from('positions')
        .insert([{
          title: values.title,
          department: values.department,
          status: values.status,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      message.success('Position added successfully!');
      setPositionModalVisible(false);
      positionForm.resetFields();
      fetchPositions();
    } catch (error) {
      console.error('Error adding position:', error);
      message.error('Failed to add position');
    }
  };

  const handleApproveLeave = async (leaveId, employeeName) => {
    try {
      const { error } = await supabase
        .from('employeeleave')
        .update({ 
          leavestatus: 'approved',
          approvedby: profile.empid
        })
        .eq('leaveid', leaveId);

      if (error) throw error;
      
      await logHROperation('APPROVE_LEAVE', leaveId, {
        employeeName: employeeName,
        action: 'approved'
      });

      message.success('Leave approved successfully!');
      fetchPendingLeaves();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error approving leave:', error);
      message.error('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId, employeeName) => {
    try {
      const { error } = await supabase
        .from('employeeleave')
        .update({ 
          leavestatus: 'rejected',
          approvedby: profile.empid
        })
        .eq('leaveid', leaveId);

      if (error) throw error;

      await logHROperation('REJECT_LEAVE', leaveId, {
        employeeName: employeeName,
        action: 'rejected'
      });
      
      message.success('Leave rejected successfully!');
      fetchPendingLeaves();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      message.error('Failed to reject leave');
    }
  };

  // Report Generation Functions
  const generateEmployeeReport = async (reportType, format, dateRange) => {
    setReportLoading(true);
    try {
      let data;
      let fileName;
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      switch (reportType) {
        case 'employee_list':
          const { data: employeeData } = await supabase
            .from('employee')
            .select('*')
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          data = employeeData || [];
          fileName = `employee_list_${startDate}_to_${endDate}`;
          break;
        case 'kpi_report':
          const { data: kpiReportData } = await supabase
            .from('kpi')
            .select(`
              *,
              employee:empid (first_name, last_name, department),
              kpiranking:kpiranking_id (kpirank)
            `)
            .gte('calculatedate', startDate)
            .lte('calculatedate', endDate);
          data = kpiReportData || [];
          fileName = `kpi_report_${startDate}_to_${endDate}`;
          break;
        case 'training_report':
          const { data: trainingReportData } = await supabase
            .from('training')
            .select(`
              *,
              training_participants (employee:empid (first_name, last_name))
            `)
            .gte('date', startDate)
            .lte('date', endDate);
          data = trainingReportData || [];
          fileName = `training_report_${startDate}_to_${endDate}`;
          break;
        case 'promotion_report':
          const { data: promotionReportData } = await supabase
            .from('promotion_history')
            .select(`
              *,
              employee:empid (first_name, last_name, department)
            `)
            .gte('promotion_date', startDate)
            .lte('promotion_date', endDate);
          data = promotionReportData || [];
          fileName = `promotion_report_${startDate}_to_${endDate}`;
          break;
        case 'attendance_report':
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select(`
              *,
              employee:empid (first_name, last_name, department)
            `)
            .gte('date', startDate)
            .lte('date', endDate);
          data = attendanceData || [];
          fileName = `attendance_report_${startDate}_to_${endDate}`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      if (format === 'excel') {
        await generateExcelReport(data, fileName);
      } else if (format === 'docx') {
        await generateDOCXReport(data, fileName, reportType);
      }

      // Log report generation
      await supabase
        .from('hr_reports')
        .insert([{
          report_name: fileName,
          report_type: reportType,
          generated_by: profile.empid,
          file_path: `${fileName}.${format}`,
          status: 'completed'
        }]);

      message.success(`Report generated successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setReportLoading(false);
      setReportModalVisible(false);
    }
  };

  const generateExcelReport = async (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const generateDOCXReport = async (data, fileName, reportType) => {
    if (!data || data.length === 0) {
      message.warning('No data available for the selected report');
      return;
    }

    try {
      // Create table headers from the first object's keys
      const headers = Object.keys(data[0]);
      
      const tableRows = [
        new TableRow({
          children: headers.map(header => 
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(header)] })]
            })
          )
        }),
        ...data.map(item => 
          new TableRow({
            children: headers.map(header => 
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun(String(item[header] || ''))] 
                })]
              })
            )
          })
        )
      ];

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({
                text: `${fileName.replace(/_/g, ' ').toUpperCase()}`,
                bold: true,
                size: 32
              })]
            }),
            new Paragraph({
              children: [new TextRun({
                text: `Generated on: ${dayjs().format('YYYY-MM-DD HH:mm')}`,
                size: 24
              })]
            }),
            new Paragraph({ children: [new TextRun('')] }), // Empty line
            new DocTable({
              rows: tableRows
            })
          ]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.docx`;
      link.click();
      URL.revokeObjectURL(link.href);
      
    } catch (error) {
      console.error('Error generating DOCX report:', error);
      message.error('Failed to generate DOCX report');
    }
  };

  const handleBulkAction = async (action, employeeIds) => {
    try {
      switch (action) {
        case 'activate':
          await supabase
            .from('employee')
            .update({ is_active: true, status: 'Active' })
            .in('empid', employeeIds);
          message.success('Employees activated successfully!');
          break;
        case 'deactivate':
          await supabase
            .from('employee')
            .update({ is_active: false, status: 'Inactive' })
            .in('empid', employeeIds);
          message.success('Employees deactivated successfully!');
          break;
        case 'assign_department':
          const department = prompt('Enter department:');
          if (department) {
            await supabase
              .from('employee')
              .update({ department })
              .in('empid', employeeIds);
            message.success('Department assigned successfully!');
          }
          break;
        default:
          throw new Error('Invalid bulk action');
      }

      fetchEmployees();
      setSelectedEmployees([]);
      setBulkActionModalVisible(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      message.error('Failed to perform bulk action');
    }
  };

  const logHROperation = async (operation, recordId, details) => {
    try {
      await supabase
        .from('hr_operations')
        .insert([{
          operation,
          record_id: recordId,
          hr_id: profile.empid,
          target_employee_id: details.employeeId || recordId,
          details,
          operation_time: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging HR operation:', error);
    }
  };

  const openEditEmployeeModal = (employee) => {
    editEmployeeForm.setFieldsValue({
      empid: employee.empid,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      phone: employee.phone,
      gender: employee.gender,
      dob: employee.dob ? dayjs(employee.dob) : null,
      address: employee.empaddress,
      status: employee.status,
      is_active: employee.is_active,
      basicsalary: employee.basicsalary
    });
    setEditEmployeeModalVisible(true);
  };

  const openPromoteEmployeeModal = (employee) => {
    promoteEmployeeForm.setFieldsValue({
      empid: employee.empid,
      previous_role: employee.role,
      new_role: employee.role,
      department: employee.department
    });
    setPromoteEmployeeModalVisible(true);
  };

  const openAddKPIModal = (employee) => {
    kpiForm.setFieldsValue({
      empid: employee.empid
    });
    setKpiModalVisible(true);
  };

  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'first_name',
      key: 'employee',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.first_name} {record.last_name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color="blue">{role}</Tag>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {status} {record.is_active ? '' : '(Inactive)'}
        </Tag>
      )
    },
    {
      title: 'KPI Score',
      dataIndex: 'kpiscore',
      key: 'kpiscore',
      render: (score) => score ? `${score}/100` : 'N/A'
    },
    {
      title: 'Join Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => setViewEmployeeModalVisible(record)}
          >
            View
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => openEditEmployeeModal(record)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<RiseOutlined />}
            onClick={() => openPromoteEmployeeModal(record)}
          >
            Promote
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<StarOutlined />}
            onClick={() => openAddKPIModal(record)}
          >
            Add KPI
          </Button>
          <Popconfirm
            title="Are you sure you want to deactivate this employee?"
            onConfirm={() => handleDeleteEmployee(record.empid, `${record.first_name} ${record.last_name}`)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<UserDeleteOutlined />}
            >
              Deactivate
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Enhanced Dashboard Overview
  const renderDashboardOverview = () => (
    <div>
      <Row gutter={[16, 16]}>
        {/* Employee Statistics */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={dashboardData.employeeStats?.totalEmployees || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Employees"
              value={dashboardData.employeeStats?.activeEmployees || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Departments"
              value={dashboardData.employeeStats?.departments || 0}
              prefix={<ClusterOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="New Hires (30d)"
              value={dashboardData.employeeStats?.newHires || 0}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Pending Leaves */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <CalendarOutlined />
                <span>Pending Leave Requests</span>
                <Badge count={leaves.length} showZero />
              </Space>
            }
            extra={<Button type="link" onClick={() => setActiveTab('leaves')}>View All</Button>}
          >
            {leaves.length > 0 ? (
              <List
                dataSource={leaves.slice(0, 5)}
                renderItem={leave => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={() => handleApproveLeave(leave.leaveid, leave.employee?.first_name)}
                      >
                        Approve
                      </Button>,
                      <Button 
                        type="link" 
                        size="small" 
                        danger
                        onClick={() => handleRejectLeave(leave.leaveid, leave.employee?.first_name)}
                      >
                        Reject
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={`${leave.employee?.first_name} ${leave.employee?.last_name}`}
                      description={`${leave.leavetype} - ${dayjs(leave.leavefromdate).format('MMM D')} to ${dayjs(leave.leavetodate).format('MMM D')}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No pending leave requests" />
            )}
          </Card>
        </Col>

        {/* Recent Promotions */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <RiseOutlined />
                <span>Recent Promotions</span>
              </Space>
            }
            extra={<Button type="link" onClick={() => setActiveTab('promotions')}>View All</Button>}
          >
            {promotions.length > 0 ? (
              <Timeline>
                {promotions.slice(0, 5).map(promo => (
                  <Timeline.Item
                    key={promo.id}
                    dot={<TrophyOutlined style={{ fontSize: '16px' }} />}
                    color="green"
                  >
                    <Text strong>{promo.employee?.first_name} {promo.employee?.last_name}</Text>
                    <br />
                    <Text type="secondary">
                      {promo.previousrole} → {promo.newrole}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(promo.promotion_date).format('MMM D, YYYY')}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="No recent promotions" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <HistoryOutlined />
                <span>Recent HR Activities</span>
              </Space>
            }
          >
            {recentActivities.length > 0 ? (
              <List
                dataSource={recentActivities.slice(0, 5)}
                renderItem={activity => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Text>
                          {activity.hr?.first_name} {activity.hr?.last_name}
                        </Text>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text>{activity.operation}</Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {dayjs(activity.operation_time).format('MMM D, YYYY HH:mm')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No recent activities" />
            )}
          </Card>
        </Col>

        {/* Upcoming Training */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <SolutionOutlined />
                <span>Upcoming Training Sessions</span>
              </Space>
            }
            extra={<Button type="link" onClick={() => setActiveTab('training')}>View All</Button>}
          >
            {trainingData.length > 0 ? (
              <List
                dataSource={trainingData.slice(0, 5)}
                renderItem={training => (
                  <List.Item>
                    <List.Item.Meta
                      title={training.topic}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text>Trainer: {training.trainer}</Text>
                          <Text>Date: {dayjs(training.date).format('MMM D, YYYY')}</Text>
                          <Text>Venue: {training.venue}</Text>
                        </Space>
                      }
                    />
                    <Tag color={training.status === 'completed' ? 'green' : 'blue'}>
                      {training.status}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No upcoming training sessions" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Enhanced Employee Management
  const renderEmployeeManagement = () => (
    <div>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search employees..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Department"
              style={{ width: '100%' }}
              value={departmentFilter}
              onChange={setDepartmentFilter}
              allowClear
            >
              {dashboardData.employeeStats?.departments && 
                Array.from({ length: dashboardData.employeeStats.departments }).map((_, i) => (
                  <Option key={i} value={`Department ${i + 1}`}>
                    Department {i + 1}
                  </Option>
                ))
              }
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="On Leave">On Leave</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button 
              type="primary" 
              icon={<ExportOutlined />}
              onClick={() => setReportModalVisible(true)}
              block
            >
              Reports
            </Button>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col>
            <Button 
              type="primary" 
              icon={<UserAddOutlined />}
              onClick={() => setAddEmployeeModalVisible(true)}
            >
              Add Employee
            </Button>
          </Col>
          <Col>
            <Button 
              icon={<FileExcelOutlined />}
              onClick={() => generateEmployeeReport('employee_list', 'excel', dateRange)}
            >
              Export Excel
            </Button>
          </Col>
          <Col>
            <Button 
              icon={<FileWordOutlined />}
              onClick={() => generateEmployeeReport('employee_list', 'docx', dateRange)}
            >
              Export Word
            </Button>
          </Col>
          <Col>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => setBulkActionModalVisible(true)}
              disabled={selectedEmployees.length === 0}
            >
              Bulk Actions ({selectedEmployees.length})
            </Button>
          </Col>
        </Row>

        <Table
          columns={employeeColumns}
          dataSource={filteredEmployees}
          rowKey="empid"
          loading={loading}
          rowSelection={{
            selectedRowKeys: selectedEmployees,
            onChange: setSelectedEmployees,
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} employees`
          }}
        />
      </Card>
    </div>
  );

  // Enhanced Reports Section
  const renderReportsSection = () => (
    <Card>
      <Title level={3}>HR Reports</Title>
      <Text type="secondary">Generate comprehensive reports for various HR functions</Text>
      
      <Divider />
      
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Report Generator"
            extra={
              <Button 
                type="primary" 
                icon={<FileTextOutlined />}
                onClick={() => setReportModalVisible(true)}
              >
                Generate Report
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Report Features"
                description="Generate reports in Excel (.xlsx) or Word (.docx) format for any date range. Default range is 7 days."
                type="info"
                showIcon
              />
              
              <div>
                <Text strong>Available Reports:</Text>
                <ul>
                  <li>Employee List Report</li>
                  <li>KPI Performance Report</li>
                  <li>Training Sessions Report</li>
                  <li>Promotion History Report</li>
                  <li>Attendance Report</li>
                </ul>
              </div>

              <div>
                <Text strong>Date Range:</Text>
                <br />
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Quick Export">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Button 
                  icon={<FileExcelOutlined />}
                  block
                  size="large"
                  onClick={() => generateEmployeeReport('employee_list', 'excel', dateRange)}
                  loading={reportLoading}
                >
                  Export Employee List (Excel)
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button 
                  icon={<FileWordOutlined />}
                  block
                  size="large"
                  onClick={() => generateEmployeeReport('employee_list', 'docx', dateRange)}
                  loading={reportLoading}
                >
                  Export Employee List (Word)
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button 
                  icon={<FileExcelOutlined />}
                  block
                  size="large"
                  onClick={() => generateEmployeeReport('kpi_report', 'excel', dateRange)}
                  loading={reportLoading}
                >
                  Export KPI Report (Excel)
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button 
                  icon={<FileWordOutlined />}
                  block
                  size="large"
                  onClick={() => generateEmployeeReport('kpi_report', 'docx', dateRange)}
                  loading={reportLoading}
                >
                  Export KPI Report (Word)
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <BankOutlined /> HR Management Dashboard
        </Title>
        <Text type="secondary">
          Welcome back, {profile?.first_name}! Manage your workforce efficiently.
        </Text>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <BarChartOutlined />
                Overview
              </span>
            ),
            children: renderDashboardOverview()
          },
          {
            key: 'employees',
            label: (
              <span>
                <TeamOutlined />
                Employee Management
              </span>
            ),
            children: renderEmployeeManagement()
          },
          {
            key: 'reports',
            label: (
              <span>
                <FileTextOutlined />
                Reports
              </span>
            ),
            children: renderReportsSection()
          }
        ]}
      />

      {/* Add Employee Modal */}
      <Modal
        title="Add New Employee"
        open={addEmployeeModalVisible}
        onCancel={() => setAddEmployeeModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={employeeForm}
          layout="vertical"
          onFinish={handleAddEmployee}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  <Option value="Manager">Manager</Option>
                  <Option value="Team Lead">Team Lead</Option>
                  <Option value="Senior Developer">Senior Developer</Option>
                  <Option value="Developer">Developer</Option>
                  <Option value="Designer">Designer</Option>
                  <Option value="QA Engineer">QA Engineer</Option>
                  <Option value="HR Specialist">HR Specialist</Option>
                  <Option value="Finance Manager">Finance Manager</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="department"
                label="Department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department">
                  <Option value="Engineering">Engineering</Option>
                  <Option value="Design">Design</Option>
                  <Option value="Product">Product</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="HR">Human Resources</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Operations">Operations</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: 'Please select gender' }]}
              >
                <Select placeholder="Select gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="dob"
                label="Date of Birth"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="basicsalary"
            label="Basic Salary"
            rules={[{ required: true, message: 'Please enter basic salary' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Report Generation Modal */}
      <Modal
        title="Generate HR Report"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={reportForm}
          layout="vertical"
          onFinish={(values) => generateEmployeeReport(values.reportType, values.format, dateRange)}
        >
          <Form.Item
            name="reportType"
            label="Report Type"
            rules={[{ required: true, message: 'Please select report type' }]}
          >
            <Select placeholder="Select report type">
              <Option value="employee_list">Employee List Report</Option>
              <Option value="kpi_report">KPI Performance Report</Option>
              <Option value="training_report">Training Sessions Report</Option>
              <Option value="promotion_report">Promotion History Report</Option>
              <Option value="attendance_report">Attendance Report</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="format"
            label="Format"
            rules={[{ required: true, message: 'Please select format' }]}
          >
            <Radio.Group>
              <Radio value="excel">Excel (.xlsx)</Radio>
              <Radio value="docx">Word (.docx)</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Date Range">
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={reportLoading}
              icon={<DownloadOutlined />}
            >
              Generate Report
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Loading HR Dashboard...</Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;