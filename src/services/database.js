import { supabase } from './supabase';

export const DatabaseService = {
  // Check if email exists in both profiles and employee tables
  async checkEmailExists(email) {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Check in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, department_id')
        .eq('email', normalizedEmail)
        .single();

      if (!profileError && profile) {
        return { exists: true, table: 'profiles', data: profile };
      }

      // Check in employee table
      const { data: employee, error: employeeError } = await supabase
        .from('employee')
        .select('empid, email, full_name, role, status')
        .eq('email', normalizedEmail)
        .single();

      if (!employeeError && employee) {
        return { exists: true, table: 'employee', data: employee };
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking email existence:', error);
      return { exists: false, error: error.message };
    }
  },

  // Get or create automotive department
  async getAutomotiveDepartment() {
    try {
      // Try to get existing automotive department
      const { data: department, error } = await supabase
        .from('departments')
        .select('*')
        .eq('name', 'Automotive')
        .single();

      if (!error && department) {
        return department;
      }

      // Create automotive department if it doesn't exist
      const { data: newDepartment, error: createError } = await supabase
        .from('departments')
        .insert([{ name: 'Automotive' }])
        .select()
        .single();

      if (createError) {
        throw new Error('Failed to create automotive department');
      }

      return newDepartment;
    } catch (error) {
      console.error('Error getting automotive department:', error);
      throw error;
    }
  },

  // Create user profile in profiles table
  async createUserProfile(userData, authUserId) {
    try {
      const automotiveDept = await this.getAutomotiveDepartment();

      const profileData = {
        id: authUserId,
        email: userData.email.toLowerCase(),
        full_name: userData.full_name,
        department_id: automotiveDept.id,
        role: userData.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        // If profile already exists, update it
        if (error.code === '23505') {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('email', userData.email.toLowerCase())
            .select()
            .single();

          if (updateError) throw updateError;
          return updatedProfile;
        }
        throw error;
      }

      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Create employee record (backward compatibility)
  async createEmployeeRecord(userData, authUserId) {
    try {
      const nameParts = userData.full_name.trim().split(' ');
      const full_name = nameParts[0] || '';

      const employeeData = {
        email: userData.email.toLowerCase(),
        full_name: full_name,
        role: userData.role,
        status: 'active',
        auth_user_id: authUserId,
        department: 'Automotive',
        created_at: new Date().toISOString(),
        is_active: true,
      };

      const { data: employee, error } = await supabase
        .from('employee')
        .insert([employeeData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          const { data: updatedEmployee, error: updateError } = await supabase
            .from('employee')
            .update(employeeData)
            .eq('email', userData.email.toLowerCase())
            .select()
            .single();

          if (updateError) throw updateError;
          return updatedEmployee;
        }
        throw error;
      }

      return employee;
    } catch (error) {
      console.error('Error creating employee record:', error);
      throw error;
    }
  },
};