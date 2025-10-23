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
  FilePdfOutlined,
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

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

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
          employeetraining!inner (employee:empid (first_name, last_name))
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
        .order('promotiondate', { ascending: false })
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
          sickleavebalance: 14,
          fulldayleavebalance: 21,
          halfdayleavebalance: 5,
          shortleavebalance: 7,
          maternityleavebalance: 84
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
          promotedby: `${profile.first_name} ${profile.last_name}`,
          promotiondate: new Date().toISOString()
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
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Link employees to training
      if (values.employees && values.employees.length > 0) {
        const trainingLinks = values.employees.map(empId => ({
          trainingid: data[0].trainingid,
          empid: empId,
          starttime: values.start_time?.format('HH:mm:ss'),
          endtime: values.end_time?.format('HH:mm:ss'),
          created_at: new Date().toISOString()
        }));

        await supabase
          .from('employeetraining')
          .insert(trainingLinks);

        // Also add to training_participants
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
  const generateEmployeeReport = async (reportType, format) => {
    setReportLoading(true);
    try {
      let data;
      let fileName;

      switch (reportType) {
        case 'employee_list':
          data = employees;
          fileName = `employee_list_${dayjs().format('YYYY-MM-DD')}`;
          break;
        case 'kpi_report':
          data = kpiData;
          fileName = `kpi_report_${dayjs().format('YYYY-MM-DD')}`;
          break;
        case 'training_report':
          data = trainingData;
          fileName = `training_report_${dayjs().format('YYYY-MM-DD')}`;
          break;
        case 'promotion_report':
          data = promotions;
          fileName = `promotion_report_${dayjs().format('YYYY-MM-DD')}`;
          break;
        case 'attendance_report':
          // Fetch attendance data
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select(`
              *,
              employee:empid (first_name, last_name, department)
            `)
            .gte('date', dayjs().startOf('month').format('YYYY-MM-DD'));
          data = attendanceData || [];
          fileName = `attendance_report_${dayjs().format('YYYY-MM-DD')}`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      if (format === 'excel') {
        await generateExcelReport(data, fileName);
      } else if (format === 'pdf') {
        await generatePDFReport(data, fileName);
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

  const generatePDFReport = async (data, fileName) => {
    // Simple PDF generation - in a real app, you might use a library like jsPDF
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${fileName}</h1>
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
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
          // You would get department from a form
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
      is_active: employee.is_active
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
          <Avatar icon={<UserOutlined />} src={record.avatarurl} />
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
            title="Are you sure to deactivate this employee?"
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
        background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
        border: 'none'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <TeamOutlined style={{ color: 'white', fontSize: '24px' }} />
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                HR Manager Dashboard
              </Title>
              <Badge count={<TeamOutlined />} offset={[-5, 0]}>
                <Tag color="white" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  {profile?.first_name} {profile?.last_name}
                </Tag>
              </Badge>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                onClick={() => setReportModalVisible(true)}
              >
                Generate Reports
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={initializeDashboard}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Welcome Alert */}
      <Alert
        message={`Welcome back, ${profile?.first_name || 'HR Manager'}!`}
        description="Manage employees, leaves, recruitment, training, and all HR operations from this dashboard."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          <OverviewTab 
            dashboardData={dashboardData}
            recruitmentStats={recruitmentStats}
            leaves={leaves}
            recentActivities={recentActivities}
            onAddEmployee={() => setAddEmployeeModalVisible(true)}
            onApproveLeave={handleApproveLeave}
            onRejectLeave={handleRejectLeave}
          />
        </TabPane>
        
        <TabPane tab="Employee Management" key="employees">
          <EmployeeManagementTab 
            employees={filteredEmployees}
            employeeColumns={employeeColumns}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            departmentFilter={departmentFilter}
            onDepartmentFilterChange={setDepartmentFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onAddEmployee={() => setAddEmployeeModalVisible(true)}
            onBulkAction={() => setBulkActionModalVisible(true)}
            selectedEmployees={selectedEmployees}
            onSelectedEmployeesChange={setSelectedEmployees}
            loading={loading}
          />
        </TabPane>
        
        <TabPane tab="Positions" key="positions">
          <PositionsTab 
            positions={positions}
            onAddPosition={() => setPositionModalVisible(true)}
          />
        </TabPane>
        
        <TabPane tab="Performance & KPI" key="performance">
          <PerformanceTab 
            kpiData={kpiData}
            employees={employees}
            kpiCategories={kpiCategories}
            onAddKPI={() => setKpiModalVisible(true)}
          />
        </TabPane>
        
        <TabPane tab="Training & Development" key="training">
          <TrainingTab 
            trainingData={trainingData}
            employees={employees}
            onScheduleTraining={() => setTrainingModalVisible(true)}
          />
        </TabPane>
        
        <TabPane tab="Promotions" key="promotions">
          <PromotionsTab 
            promotions={promotions} 
            positionHistory={positionHistory}
          />
        </TabPane>
        
        <TabPane tab="HR Activities" key="activities">
          <ActivitiesTab recentActivities={recentActivities} />
        </TabPane>
      </Tabs>

      {/* All Modals */}
      <AddEmployeeModal
        visible={addEmployeeModalVisible}
        onCancel={() => setAddEmployeeModalVisible(false)}
        form={employeeForm}
        onFinish={handleAddEmployee}
      />

      <EditEmployeeModal
        visible={editEmployeeModalVisible}
        onCancel={() => setEditEmployeeModalVisible(false)}
        form={editEmployeeForm}
        onFinish={handleEditEmployee}
      />

      <PromoteEmployeeModal
        visible={promoteEmployeeModalVisible}
        onCancel={() => setPromoteEmployeeModalVisible(false)}
        form={promoteEmployeeForm}
        onFinish={handlePromoteEmployee}
      />

      <AddKPIModal
        visible={kpiModalVisible}
        onCancel={() => setKpiModalVisible(false)}
        form={kpiForm}
        onFinish={handleAddKPI}
        kpiCategories={kpiCategories}
      />

      <TrainingModal
        visible={trainingModalVisible}
        onCancel={() => setTrainingModalVisible(false)}
        form={trainingForm}
        onFinish={handleScheduleTraining}
        employees={employees}
      />

      <PositionModal
        visible={positionModalVisible}
        onCancel={() => setPositionModalVisible(false)}
        form={positionForm}
        onFinish={handleAddPosition}
      />

      <ReportModal
        visible={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        onGenerate={generateEmployeeReport}
        loading={reportLoading}
      />

      <BulkActionModal
        visible={bulkActionModalVisible}
        onCancel={() => setBulkActionModalVisible(false)}
        onFinish={handleBulkAction}
        selectedCount={selectedEmployees.length}
      />

      <ViewEmployeeModal
        visible={viewEmployeeModalVisible}
        onCancel={() => setViewEmployeeModalVisible(false)}
        employee={viewEmployeeModalVisible}
      />
    </div>
  );
};

// Enhanced Tab Components with all features
const OverviewTab = ({ dashboardData, recruitmentStats, leaves, recentActivities, onAddEmployee, onApproveLeave, onRejectLeave }) => (
  <div>
    {/* Quick Stats */}
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Employees"
            value={dashboardData.employeeStats?.totalEmployees || 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Active Employees"
            value={dashboardData.employeeStats?.activeEmployees || 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Departments"
            value={dashboardData.employeeStats?.departments || 0}
            prefix={<BankOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Pending Leaves"
            value={leaves.length}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Card>
      </Col>
    </Row>

    {/* Quick Actions */}
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="Quick Actions" size="small">
          <Space wrap>
            <Button type="primary" icon={<UserAddOutlined />} onClick={onAddEmployee}>
              Add Employee
            </Button>
            <Button icon={<SolutionOutlined />}>
              Process Applications
            </Button>
            <Button icon={<FileTextOutlined />}>
              Generate Reports
            </Button>
            <Button icon={<BarChartOutlined />}>
              View Analytics
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      {/* Pending Leave Requests */}
      <Col xs={24} lg={12}>
        <Card title="Pending Leave Requests" size="small">
          <List
            dataSource={leaves.slice(0, 5)}
            renderItem={leave => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    size="small" 
                    style={{ color: '#52c41a' }}
                    onClick={() => onApproveLeave(leave.leaveid, `${leave.employee?.first_name} ${leave.employee?.last_name}`)}
                  >
                    Approve
                  </Button>,
                  <Button 
                    type="link" 
                    size="small" 
                    danger
                    onClick={() => onRejectLeave(leave.leaveid, `${leave.employee?.first_name} ${leave.employee?.last_name}`)}
                  >
                    Reject
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#faad14' }} />}
                  title={`${leave.employee?.first_name} ${leave.employee?.last_name}`}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text strong>{leave.leavereason}</Text>
                      <Text type="secondary">
                        {dayjs(leave.leavefromdate).format('DD/MM/YYYY')} - {dayjs(leave.leavetodate).format('DD/MM/YYYY')}
                      </Text>
                      <Text type="secondary">Duration: {leave.duration} days</Text>
                      <Tag color="blue">{leave.employee?.department}</Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 'No pending leave requests' }}
          />
        </Card>
      </Col>

      {/* Recent Activities */}
      <Col xs={24} lg={12}>
        <Card title="Recent HR Activities" size="small">
          <Timeline>
            {recentActivities.slice(0, 5).map((activity, index) => (
              <Timeline.Item
                key={index}
                dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
                color="blue"
              >
                <Space direction="vertical" size={0}>
                  <Text strong>{activity.operation.replace(/_/g, ' ')}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    By {activity.hr?.first_name} {activity.hr?.last_name}
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

      {/* Recruitment Stats */}
      <Col xs={24} lg={12}>
        <Card title="Recruitment Overview">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic
                title="Open Positions"
                value={recruitmentStats.openPositions}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="New Hires This Month"
                value={recruitmentStats.newHiresThisMonth}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Pending Applications"
                value={recruitmentStats.pendingApplications}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Interviews Scheduled"
                value={recruitmentStats.interviewSchedule}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
        </Card>
      </Col>

      {/* HR Metrics */}
      <Col xs={24} lg={12}>
        <Card title="HR Metrics">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Employee Satisfaction</Text>
              <Progress percent={87} status="active" />
            </div>
            <div>
              <Text strong>Training Completion</Text>
              <Progress percent={92} status="success" />
            </div>
            <div>
              <Text strong>Retention Rate</Text>
              <Progress percent={94} status="active" />
            </div>
            <div>
              <Text strong>Recruitment Efficiency</Text>
              <Progress percent={78} status="active" />
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  </div>
);

const EmployeeManagementTab = ({ 
  employees, 
  employeeColumns, 
  searchTerm, 
  onSearchChange, 
  departmentFilter,
  onDepartmentFilterChange,
  statusFilter,
  onStatusFilterChange,
  onAddEmployee, 
  onBulkAction,
  selectedEmployees,
  onSelectedEmployeesChange,
  loading 
}) => {
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  const statuses = [...new Set(employees.map(emp => emp.status).filter(Boolean))];

  const rowSelection = {
    selectedRowKeys: selectedEmployees,
    onChange: onSelectedEmployeesChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card 
            title="Employee Management" 
            extra={
              <Space>
                <Input
                  placeholder="Search employees..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  style={{ width: 200 }}
                />
                <Select
                  placeholder="Department"
                  value={departmentFilter}
                  onChange={onDepartmentFilterChange}
                  style={{ width: 150 }}
                  allowClear
                >
                  {departments.map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
                </Select>
                <Select
                  placeholder="Status"
                  value={statusFilter}
                  onChange={onStatusFilterChange}
                  style={{ width: 150 }}
                  allowClear
                >
                  {statuses.map(status => (
                    <Option key={status} value={status}>{status}</Option>
                  ))}
                </Select>
                {selectedEmployees.length > 0 && (
                  <Button 
                    icon={<SettingOutlined />}
                    onClick={onBulkAction}
                  >
                    Bulk Actions ({selectedEmployees.length})
                  </Button>
                )}
                <Button type="primary" icon={<UserAddOutlined />} onClick={onAddEmployee}>
                  Add Employee
                </Button>
              </Space>
            }
          >
            <Alert
              message="Employee Management"
              description="Manage all employee records, update information, promote employees, and track performance."
              type="info"
              showIcon
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={employees}
          columns={employeeColumns}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="empid"
          rowSelection={rowSelection}
          locale={{
            emptyText: (
              <Empty
                description="No employees found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>
    </div>
  );
};

const PositionsTab = ({ positions, onAddPosition }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Position Management" 
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddPosition}>
              Add Position
            </Button>
          }
        >
          <Alert
            message="Position Management"
            description="Manage job positions, track open positions, and assign roles to employees."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Card>
      <Table
        dataSource={positions}
        columns={[
          {
            title: 'Position Title',
            dataIndex: 'title',
            key: 'title',
          },
          {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
              <Tag color={status === 'open' ? 'green' : 'red'}>
                {status?.toUpperCase()}
              </Tag>
            )
          },
          {
            title: 'Created Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => dayjs(date).format('MMM D, YYYY')
          }
        ]}
        pagination={{ pageSize: 10 }}
        rowKey="position_id"
      />
    </Card>
  </div>
);

const PerformanceTab = ({ kpiData, employees, kpiCategories, onAddKPI }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Performance & KPI Management" 
          extra={
            <Button type="primary" icon={<StarOutlined />} onClick={onAddKPI}>
              Add KPI Score
            </Button>
          }
        >
          <Alert
            message="KPI Management"
            description="Track employee performance through KPI scores, rankings, and performance metrics."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Recent KPI Scores">
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
                title: 'KPI Score',
                dataIndex: 'kpivalue',
                key: 'kpivalue',
                render: (value) => (
                  <Tag color={
                    value >= 90 ? 'green' : 
                    value >= 80 ? 'blue' : 
                    value >= 70 ? 'orange' : 'red'
                  }>
                    {value}/100
                  </Tag>
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
                render: (date) => dayjs(date).format('MMM D, YYYY')
              }
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="kpiid"
          />
        </Card>
      </Col>
    </Row>
  </div>
);

const TrainingTab = ({ trainingData, employees, onScheduleTraining }) => (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card 
          title="Training & Development" 
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onScheduleTraining}>
              Schedule Training
            </Button>
          }
        >
          <Alert
            message="Training Management"
            description="Schedule training sessions, track participation, and manage employee development programs."
            type="info"
            showIcon
          />
        </Card>
      </Col>
    </Row>

    <Card title="Upcoming Training Sessions">
      <List
        dataSource={trainingData}
        renderItem={training => (
          <List.Item
            actions={[
              <Button type="link" size="small">View Details</Button>,
              <Button type="link" size="small">Edit</Button>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<SolutionOutlined />} style={{ backgroundColor: '#1890ff' }} />}
              title={training.topic}
              description={
                <Space direction="vertical" size={0}>
                  <Text>Trainer: {training.trainer}</Text>
                  <Text>Venue: {training.venue}</Text>
                  <Text>Date: {dayjs(training.date).format('MMM D, YYYY')}</Text>
                  <Text>Duration: {training.duration}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No upcoming training sessions' }}
      />
    </Card>
  </div>
);

const PromotionsTab = ({ promotions, positionHistory }) => (
  <div>
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Card title="Promotion History">
          <Table
            dataSource={promotions}
            columns={[
              {
                title: 'Employee',
                dataIndex: ['employee', 'first_name'],
                key: 'employee',
                render: (text, record) => 
                  `${record.employee?.first_name} ${record.employee?.last_name}`
              },
              {
                title: 'Previous Role',
                dataIndex: 'previousrole',
                key: 'previousrole'
              },
              {
                title: 'New Role',
                dataIndex: 'newrole',
                key: 'newrole'
              },
              {
                title: 'Promoted By',
                dataIndex: 'promotedby',
                key: 'promotedby'
              },
              {
                title: 'Promotion Date',
                dataIndex: 'promotiondate',
                key: 'promotiondate',
                render: (date) => dayjs(date).format('MMM D, YYYY')
              }
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card title="Position History">
          <Table
            dataSource={positionHistory}
            columns={[
              {
                title: 'Employee',
                dataIndex: ['employee', 'first_name'],
                key: 'employee',
                render: (text, record) => 
                  `${record.employee?.first_name} ${record.employee?.last_name}`
              },
              {
                title: 'Position',
                dataIndex: 'position_title',
                key: 'position_title'
              },
              {
                title: 'Department',
                dataIndex: 'department',
                key: 'department'
              },
              {
                title: 'Start Date',
                dataIndex: 'start_date',
                key: 'start_date',
                render: (date) => dayjs(date).format('MMM D, YYYY')
              },
              {
                title: 'Current',
                dataIndex: 'is_current',
                key: 'is_current',
                render: (current) => (
                  <Tag color={current ? 'green' : 'default'}>
                    {current ? 'Yes' : 'No'}
                  </Tag>
                )
              }
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      </Col>
    </Row>
  </div>
);

const ActivitiesTab = ({ recentActivities }) => (
  <div>
    <Card title="HR Activities Log">
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
                      By: {activity.hr?.first_name} {activity.hr?.last_name}
                    </Text>
                  </Col>
                </Row>
                {activity.target_employee && (
                  <Row>
                    <Col>
                      <Text type="secondary">
                        Employee: {activity.target_employee.first_name} {activity.target_employee.last_name}
                      </Text>
                    </Col>
                  </Row>
                )}
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

// Modal Components
const AddEmployeeModal = ({ visible, onCancel, form, onFinish }) => (
  <Modal
    title="Add New Employee"
    open={visible}
    onCancel={onCancel}
    footer={null}
    width={700}
  >
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
            <Input placeholder="Enter first name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
            <Input placeholder="Enter last name" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="Enter email address" />
      </Form.Item>

      <Form.Item name="password" label="Temporary Password" rules={[{ required: true }]}>
        <Input.Password placeholder="Enter temporary password" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select role">
              <Option value="employee">Employee</Option>
              <Option value="manager">Manager</Option>
              <Option value="hr">HR</Option>
              <Option value="accountant">Accountant</Option>
              <Option value="ceo">CEO</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Select placeholder="Select department">
              <Option value="IT">IT</Option>
              <Option value="HR">HR</Option>
              <Option value="Finance">Finance</Option>
              <Option value="Operations">Operations</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Marketing">Marketing</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input placeholder="Enter phone number" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
            <Select placeholder="Select gender">
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="dob" label="Date of Birth">
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="address" label="Address">
        <TextArea rows={3} placeholder="Enter address" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Add Employee
        </Button>
      </Form.Item>
    </Form>
  </Modal>
);

const EditEmployeeModal = ({ visible, onCancel, form, onFinish }) => (
  <Modal
    title="Edit Employee"
    open={visible}
    onCancel={onCancel}
    footer={null}
    width={700}
  >
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="empid" hidden>
        <Input />
      </Form.Item>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
        <Input />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select>
              <Option value="employee">Employee</Option>
              <Option value="manager">Manager</Option>
              <Option value="hr">HR</Option>
              <Option value="accountant">Accountant</Option>
              <Option value="ceo">CEO</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Select>
              <Option value="IT">IT</Option>
              <Option value="HR">HR</Option>
              <Option value="Finance">Finance</Option>
              <Option value="Operations">Operations</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Marketing">Marketing</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
            <Select>
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="dob" label="Date of Birth">
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="address" label="Address">
        <TextArea rows={3} />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="On Leave">On Leave</Option>
              <Option value="Suspended">Suspended</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Update Employee
        </Button>
      </Form.Item>
    </Form>
  </Modal>
);

const PromoteEmployeeModal = ({ visible, onCancel, form, onFinish }) => (
  <Modal
    title="Promote Employee"
    open={visible}
    onCancel={onCancel}
    footer={null}
    width={600}
  >
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="empid" hidden>
        <Input />
      </Form.Item>
      
      <Form.Item name="previous_role" label="Current Role">
        <Input disabled />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="new_role" label="New Role" rules={[{ required: true }]}>
            <Select>
              <Option value="employee">Employee</Option>
              <Option value="manager">Manager</Option>
              <Option value="hr">HR</Option>
              <Option value="accountant">Accountant</Option>
              <Option value="ceo">CEO</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Select>
              <Option value="IT">IT</Option>
              <Option value="HR">HR</Option>
              <Option value="Finance">Finance</Option>
              <Option value="Operations">Operations</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Marketing">Marketing</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="recommendation" label="Recommendation">
        <TextArea rows={4} placeholder="Enter promotion recommendation and reasons..." />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Promote Employee
        </Button>
      </Form.Item>
    </Form>
  </Modal>
);

const AddKPIModal = ({ visible, onCancel, form, onFinish, kpiCategories }) => (
  <Modal
    title="Add KPI Score"
    open={visible}
    onCancel={onCancel}
    footer={null}
    width={600}
  >
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="empid" hidden>
        <Input />
      </Form.Item>

      <Form.Item name="kpivalue" label="Overall KPI Score (0-100)" rules={[{ required: true }]}>
        <InputNumber 
          min={0} 
          max={100} 
          style={{ width: '100%' }}
          placeholder="Enter overall KPI score"
        />
      </Form.Item>

      <Form.Item name="calculation_date" label="Calculation Date" rules={[{ required: true }]}>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.List name="categories">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name, 'category_id']}
                  rules={[{ required: true, message: 'Missing category' }]}
                >
                  <Select placeholder="Select category" style={{ width: 200 }}>
                    {kpiCategories.map(cat => (
                      <Option key={cat.id} value={cat.id}>{cat.category_name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'score']}
                  rules={[{ required: true, message: 'Missing score' }]}
                >
                  <InputNumber placeholder="Score" min={0} max={100} />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'comments']}
                >
                  <Input placeholder="Comments" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add Category Score
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Add KPI Score
        </Button>
      </Form.Item>
    </Form>
  </Modal>
);

const TrainingModal = ({ visible, onCancel, form, onFinish, employees }) => (
  <Modal
    title="Schedule Training"
    open={visible}
    onCancel={onCancel}
    footer={null}
    width={700}
  >
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="topic" label="Training Topic" rules={[{ required: true }]}>
        <Input placeholder="Enter training topic" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="trainer" label="Trainer" rules={[{ required: true }]}>
            <Input placeholder="Enter trainer name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="venue" label="Venue" rules={[{ required: true }]}>
            <Input placeholder="Enter training venue" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="duration" label="Duration" rules={[{ required: true }]}>
        <Input placeholder="e.g., 2 hours, 1 day" />
      </Form.Item>

      <Form.Item name="training_date" label="Training Date" rules={[{ required: true }]}>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="start_time" label="Start Time">
            <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="end_time" label="End Time">
            <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="employees" label="Participants">
        <Select
          mode="multiple"
          placeholder="Select employees for training"
          optionFilterProp="children"
        >
          {employees.filter(emp => emp.is_active).map(emp => (
            <Option key={emp.empid} value={emp.empid}>
              {emp.first_name} {emp.last_name} - {emp.department}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Schedule Training
        </Button>
      </Form.Item>
    </Form>
  </Modal>
);

const PositionModal = ({ visible, onCancel, form, onFinish }) => (
  <Modal
    title="Add New Position"
    open={visible}
    onCancel={onCancel}
    footer={null}
    width={500}
  >
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="title" label="Position Title" rules={[{ required: true }]}>
        <Input placeholder="Enter position title" />
      </Form.Item>

      <Form.Item name="department" label="Department" rules={[{ required: true }]}>
        <Select placeholder="Select department">
          <Option value="IT">IT</Option>
          <Option value="HR">HR</Option>
          <Option value="Finance">Finance</Option>
          <Option value="Operations">Operations</Option>
          <Option value="Sales">Sales</Option>
          <Option value="Marketing">Marketing</Option>
        </Select>
      </Form.Item>

      <Form.Item name="status" label="Status" rules={[{ required: true }]}>
        <Select placeholder="Select status">
          <Option value="open">Open</Option>
          <Option value="closed">Closed</Option>
          <Option value="on-hold">On Hold</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Add Position
        </Button>
      </Form.Item>
    </Form>
  </Modal>
);

const ReportModal = ({ visible, onCancel, onGenerate, loading }) => {
  const [reportType, setReportType] = useState('employee_list');
  const [format, setFormat] = useState('excel');

  const handleGenerate = () => {
    onGenerate(reportType, format);
  };

  return (
    <Modal
      title="Generate Report"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="generate" 
          type="primary" 
          loading={loading}
          onClick={handleGenerate}
        >
          Generate Report
        </Button>
      ]}
    >
      <Form layout="vertical">
        <Form.Item label="Report Type">
          <Select value={reportType} onChange={setReportType}>
            <Option value="employee_list">Employee List</Option>
            <Option value="kpi_report">KPI Report</Option>
            <Option value="training_report">Training Report</Option>
            <Option value="promotion_report">Promotion Report</Option>
            <Option value="attendance_report">Attendance Report</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Format">
          <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)}>
            <Radio value="excel">Excel</Radio>
            <Radio value="pdf">PDF</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const BulkActionModal = ({ visible, onCancel, onFinish, selectedCount }) => {
  const [action, setAction] = useState('');

  const handleSubmit = () => {
    if (action) {
      onFinish(action, []); // The actual employee IDs would be passed from parent
      onCancel();
    }
  };

  return (
    <Modal
      title="Bulk Actions"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          disabled={!action}
        >
          Apply Action
        </Button>
      ]}
    >
      <Alert
        message={`${selectedCount} employees selected`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Form layout="vertical">
        <Form.Item label="Action">
          <Select value={action} onChange={setAction} placeholder="Select action">
            <Option value="activate">Activate Employees</Option>
            <Option value="deactivate">Deactivate Employees</Option>
            <Option value="assign_department">Assign Department</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ViewEmployeeModal = ({ visible, onCancel, employee }) => (
  <Modal
    title="Employee Details"
    open={!!visible}
    onCancel={onCancel}
    footer={[
      <Button key="close" onClick={onCancel}>
        Close
      </Button>
    ]}
    width={800}
  >
    {employee && (
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Employee ID">{employee.empid}</Descriptions.Item>
        <Descriptions.Item label="Full Name">{employee.first_name} {employee.last_name}</Descriptions.Item>
        <Descriptions.Item label="Email">{employee.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{employee.phone || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Role">
          <Tag color="blue">{employee.role}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Department">{employee.department}</Descriptions.Item>
        <Descriptions.Item label="Gender">{employee.gender || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Date of Birth">
          {employee.dob ? dayjs(employee.dob).format('MMM D, YYYY') : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={employee.is_active ? 'green' : 'red'}>
            {employee.status} {employee.is_active ? '' : '(Inactive)'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="KPI Score">
          {employee.kpiscore ? `${employee.kpiscore}/100` : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Address" span={2}>
          {employee.empaddress || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Join Date">
          {dayjs(employee.created_at).format('MMM D, YYYY')}
        </Descriptions.Item>
      </Descriptions>
    )}
  </Modal>
);

export default HRDashboard;