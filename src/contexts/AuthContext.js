import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { message } from 'antd';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from employee table
  const fetchUserProfile = async (userData) => {
    try {
      console.log('Fetching profile for user:', userData.id, userData.email);

      // Hardcoded admin profile
      if (userData.email === 'admin@superadmin.com') {
        const adminProfile = {
          empid: 0,
          full_name: 'Super Admin',
          email: 'admin@superadmin.com',
          role: 'admin',
          department: 'AUTOMOTIVE',
          is_active: true,
          auth_user_id: userData.id
        };
        setProfile(adminProfile);
        sessionStorage.setItem('userProfile', JSON.stringify(adminProfile));
        localStorage.setItem('userRole', 'admin');
        return adminProfile;
      }

      // Try to get profile by auth_user_id first
      let { data: profile, error } = await supabase
        .from('employee')
        .select('*')
        .eq('auth_user_id', userData.id)
        .single();

      // If not found, try by email
      if (error || !profile) {
        console.log('Profile not found by auth_user_id, trying email...');
        const { data: profileByEmail, error: emailError } = await supabase
          .from('employee')
          .select('*')
          .eq('email', userData.email.toLowerCase())
          .single();

        if (emailError || !profileByEmail) {
          console.error('Profile not found for user:', userData.email);
          message.error('User profile not found. Please contact administrator.');
          await logout();
          return null;
        }
        profile = profileByEmail;
      }

      // Check if account is active
      if (!profile.is_active && profile.role !== 'admin') {
        message.error('Your account has been deactivated. Please contact administrator.');
        await logout();
        return null;
      }

      console.log('Profile loaded successfully:', profile);
      setProfile(profile);
      sessionStorage.setItem('userProfile', JSON.stringify(profile));
      localStorage.setItem('userRole', profile.role);
      
      return profile;

    } catch (error) {
      console.error('Error fetching user profile:', error);
      message.error('Failed to load user profile');
      return null;
    }
  };

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      if (session) {
        setUser(session.user);
        await fetchUserProfile(session.user);
      } else {
        // Check for stored profile in sessionStorage
        const storedProfile = sessionStorage.getItem('userProfile');
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear invalid session
      await logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (session) {
          setUser(session.user);
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          sessionStorage.removeItem('userProfile');
          localStorage.removeItem('userRole');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      sessionStorage.removeItem('userProfile');
      localStorage.removeItem('userRole');
      message.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Failed to logout');
    }
  };

  const value = {
    user,
    profile,
    loading,
    refreshProfile,
    logout,
    setProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};