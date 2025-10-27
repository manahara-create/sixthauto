import { supabase } from '../../../services/supabase'

export const accountantService = {
  // Dashboard Statistics
  async getDashboardStats(dateRange) {
    const [startDate, endDate] = dateRange
    
    // Get total salary processed
    const { data: salaryData, error: salaryError } = await supabase
      .from('salary')
      .select('totalsalary')
      .gte('salarydate', startDate.format('YYYY-MM-DD'))
      .lte('salarydate', endDate.format('YYYY-MM-DD'))

    // Get EPF contributions
    const { data: epfData, error: epfError } = await supabase
      .from('epf_contributions')
      .select('totalcontribution')
      .gte('month', startDate.format('YYYY-MM-DD'))
      .lte('month', endDate.format('YYYY-MM-DD'))

    // Get ETF contributions
    const { data: etfData, error: etfError } = await supabase
      .from('etf_contributions')
      .select('employercontribution')
      .gte('month', startDate.format('YYYY-MM-DD'))
      .lte('month', endDate.format('YYYY-MM-DD'))

    // Get pending loans
    const { data: loanData, error: loanError } = await supabase
      .from('loanrequest')
      .select('*')
      .eq('status', 'pending')

    // Get active employees
    const { data: employeeData, error: employeeError } = await supabase
      .from('employee')
      .select('empid')
      .eq('is_active', true)

    // Get pending payments (salary not processed)
    const { data: pendingSalaryData, error: pendingSalaryError } = await supabase
      .from('salary')
      .select('salaryid')
      .is('processed_by', null)

    if (salaryError || epfError || etfError || loanError || employeeError || pendingSalaryError) {
      throw new Error('Failed to fetch dashboard statistics')
    }

    return {
      totalSalary: salaryData?.reduce((sum, item) => sum + (item.totalsalary || 0), 0) || 0,
      totalEPF: epfData?.reduce((sum, item) => sum + (item.totalcontribution || 0), 0) || 0,
      totalETF: etfData?.reduce((sum, item) => sum + (item.employercontribution || 0), 0) || 0,
      pendingLoans: loanData?.length || 0,
      activeEmployees: employeeData?.length || 0,
      pendingPayments: pendingSalaryData?.length || 0
    }
  },

  // Employee Management
  async getEmployees() {
    const { data, error } = await supabase
      .from('employee')
      .select('*')
      .eq('is_active', true)
      .order('full_name')

    if (error) throw error
    return data
  },

  // Salary Operations
  async getSalaries(dateRange) {
    const [startDate, endDate] = dateRange
    const { data, error } = await supabase
      .from('salary')
      .select(`
        *,
        employee:empid (full_name, department, email)
      `)
      .gte('salarydate', startDate.format('YYYY-MM-DD'))
      .lte('salarydate', endDate.format('YYYY-MM-DD'))
      .order('salarydate', { ascending: false })

    if (error) throw error
    return data
  },

  async createSalary(salaryData) {
    const { data, error } = await supabase
      .from('salary')
      .insert([{
        empid: salaryData.employeeId,
        basicsalary: salaryData.basicSalary,
        otpay: salaryData.otPay,
        bonuspay: salaryData.bonusAmount,
        incrementpay: salaryData.incrementAmount,
        totalsalary: salaryData.totalSalary,
        salarydate: salaryData.salaryDate,
        processed_by: salaryData.processedBy
      }])
      .select()

    if (error) throw error
    return data[0]
  },

  async updateSalary(salaryId, updates) {
    const { data, error } = await supabase
      .from('salary')
      .update(updates)
      .eq('salaryid', salaryId)
      .select()

    if (error) throw error
    return data[0]
  },

  async processSalaryPayment(salaryId, accountantId) {
    return this.updateSalary(salaryId, {
      processed_by: accountantId,
      processed_at: new Date().toISOString()
    })
  },

  // EPF Operations
  async getEPFContributions(dateRange) {
    const [startDate, endDate] = dateRange
    const { data, error } = await supabase
      .from('epf_contributions')
      .select(`
        *,
        employee:empid (full_name, department)
      `)
      .gte('month', startDate.format('YYYY-MM-DD'))
      .lte('month', endDate.format('YYYY-MM-DD'))
      .order('month', { ascending: false })

    if (error) throw error
    return data
  },

  async createEPFContribution(epfData) {
    const { data, error } = await supabase
      .from('epf_contributions')
      .insert([{
        empid: epfData.employeeId,
        basicsalary: epfData.basicSalary,
        employeecontribution: epfData.employeeContribution,
        employercontribution: epfData.employerContribution,
        totalcontribution: epfData.totalContribution,
        month: epfData.month,
        processed_by: epfData.processedBy,
        status: 'processed'
      }])
      .select()

    if (error) throw error
    return data[0]
  },

  // ETF Operations
  async getETFContributions(dateRange) {
    const [startDate, endDate] = dateRange
    const { data, error } = await supabase
      .from('etf_contributions')
      .select(`
        *,
        employee:empid (full_name, department)
      `)
      .gte('month', startDate.format('YYYY-MM-DD'))
      .lte('month', endDate.format('YYYY-MM-DD'))
      .order('month', { ascending: false })

    if (error) throw error
    return data
  },

  async createETFContribution(etfData) {
    const { data, error } = await supabase
      .from('etf_contributions')
      .insert([{
        empid: etfData.employeeId,
        basicsalary: etfData.basicSalary,
        employercontribution: etfData.employerContribution,
        month: etfData.month,
        processed_by: etfData.processedBy,
        status: 'processed'
      }])
      .select()

    if (error) throw error
    return data[0]
  },

  // Loan Operations
  async getLoanRequests() {
    const { data, error } = await supabase
      .from('loanrequest')
      .select(`
        *,
        employee:empid (full_name, department, basicsalary),
        loantype:loantypeid (loantype, description)
      `)
      .order('date', { ascending: false })

    if (error) throw error
    return data
  },

  async getLoanTypes() {
    const { data, error } = await supabase
      .from('loantype')
      .select('*')
      .order('loantype')

    if (error) throw error
    return data
  },

  async createLoanRequest(loanData) {
    const { data, error } = await supabase
      .from('loanrequest')
      .insert([{
        empid: loanData.employeeId,
        loantypeid: loanData.loanTypeId,
        amount: loanData.amount,
        duration: loanData.duration,
        interestrate: loanData.interestRate,
        date: loanData.loanDate,
        status: 'pending'
      }])
      .select()

    if (error) throw error
    return data[0]
  },

  async updateLoanStatus(loanId, status, processedBy, remarks = '') {
    const { data, error } = await supabase
      .from('loanrequest')
      .update({
        status,
        processedby: processedBy,
        processedat: status === 'approved' ? new Date().toISOString() : null,
        remarks
      })
      .eq('loanrequestid', loanId)
      .select()

    if (error) throw error
    return data[0]
  },

  // KPI Operations
  async getKPIs(dateRange) {
    const [startDate, endDate] = dateRange
    const { data, error } = await supabase
      .from('kpi')
      .select(`
        *,
        employee:empid (full_name, department)
      `)
      .gte('calculatedate', startDate.format('YYYY-MM-DD'))
      .lte('calculatedate', endDate.format('YYYY-MM-DD'))
      .order('calculatedate', { ascending: false })

    if (error) throw error
    return data
  },

  async createKPI(kpiData) {
    const { data, error } = await supabase
      .from('kpi')
      .insert([{
        empid: kpiData.employeeId,
        kpivalue: kpiData.kpiValue,
        calculatedate: kpiData.calculateDate,
        kpiyear: kpiData.calculateDate.getFullYear()
      }])
      .select()

    if (error) throw error
    return data[0]
  },

  async updateKPI(kpiId, updates) {
    const { data, error } = await supabase
      .from('kpi')
      .update(updates)
      .eq('kpiid', kpiId)
      .select()

    if (error) throw error
    return data[0]
  },

  async deleteKPI(kpiId) {
    const { error } = await supabase
      .from('kpi')
      .delete()
      .eq('kpiid', kpiId)

    if (error) throw error
  },

  // Audit Logging
  async logOperation(operationData) {
    const { error } = await supabase
      .from('accountant_operations')
      .insert([{
        operation: operationData.operation,
        record_id: operationData.recordId,
        accountant_id: operationData.accountantId,
        details: operationData.details,
        operation_time: new Date().toISOString()
      }])

    if (error) console.error('Failed to log operation:', error)
  }
}