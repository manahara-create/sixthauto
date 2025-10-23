// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { message } from 'antd';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
    
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

  const initializeAuth = async () => {
    try {
      // Check for stored profile first
      const storedProfile = sessionStorage.getItem('userProfile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        setUser(session.user);
        await fetchUserProfile(session.user);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userData) => {
    try {
      console.log('Fetching profile for:', userData.email);
      
      // For admin user, create virtual profile
      if (userData.email === 'admin@superadmin.com') {
        const adminProfile = {
          empid: 0,
          first_name: 'Super',
          last_name: 'Admin',
          email: 'admin@superadmin.com',
          role: 'admin',
          department: 'AUTOMOTIVE',
          is_active: true,
          auth_user_id: userData.id
        };
        setProfile(adminProfile);
        sessionStorage.setItem('userProfile', JSON.stringify(adminProfile));
        localStorage.setItem('userRole', 'admin');
        return;
      }

      // Try to get profile by auth_user_id
      let { data: profile, error } = await supabase
        .from('employee')
        .select('*')
        .eq('auth_user_id', userData.id)
        .single();

      // If not found, try by email
      if (error || !profile) {
        console.log('Trying to fetch by email...');
        const { data: profileByEmail, error: emailError } = await supabase
          .from('employee')
          .select('*')
          .eq('email', userData.email.toLowerCase())
          .single();

        if (emailError || !profileByEmail) {
          console.error('Profile not found for user:', userData.email);
          message.error('User profile not found. Please contact administrator.');
          await supabase.auth.signOut();
          return;
        }
        profile = profileByEmail;
      }

      if (!profile.is_active) {
        message.error('Your account has been deactivated. Please contact administrator.');
        await supabase.auth.signOut();
        return;
      }

      console.log('Profile loaded:', profile);
      setProfile(profile);
      sessionStorage.setItem('userProfile', JSON.stringify(profile));
      localStorage.setItem('userRole', profile.role);
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Failed to load user profile');
    }
  };

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