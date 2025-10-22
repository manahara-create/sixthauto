// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return null;
    }

    try {
      console.log('Fetching profile for user:', authUser.id);
      
      // Try to find by auth_user_id first
      let { data: profile, error } = await supabase
        .from('employee')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      // If not found, try by email
      if (error || !profile) {
        console.log('Profile not found by auth_user_id, trying email...');
        const { data: profileByEmail, error: emailError } = await supabase
          .from('employee')
          .select('*')
          .eq('email', authUser.email)
          .single();

        if (profileByEmail) {
          profile = profileByEmail;
          // Update the profile with auth_user_id for future logins
          await supabase
            .from('employee')
            .update({ auth_user_id: authUser.id })
            .eq('empid', profile.empid);
        } else if (emailError) {
          console.error('Error fetching profile by email:', emailError);
        }
      }

      if (profile) {
        console.log('User profile loaded:', profile);
        setProfile(profile);
        return profile;
      } else {
        console.log('No profile found, creating new one...');
        // Create a basic employee profile if none exists
        const newProfile = {
          email: authUser.email,
          first_name: authUser.user_metadata?.full_name?.split(' ')[0] || authUser.email.split('@')[0],
          last_name: authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          role: authUser.user_metadata?.role || 'employee',
          department: authUser.user_metadata?.department || 'General',
          status: 'Active',
          auth_user_id: authUser.id,
          created_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('employee')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return null;
        }

        console.log('New profile created:', createdProfile);
        setProfile(createdProfile);
        return createdProfile;
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Get dashboard route based on role
  const getDashboardRoute = (userRole) => {
    const roleRoutes = {
      'ceo': '/ceo-dashboard',
      'admin': '/admin-dashboard',
      'hr': '/hr-dashboard',
      'manager': '/manager-dashboard',
      'accountant': '/accountant-dashboard',
      'employee': '/employee-dashboard'
    };
    return roleRoutes[userRole?.toLowerCase()] || '/employee-dashboard';
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user ?? null;
        setUser(authUser);

        if (authUser) {
          await fetchUserProfile(authUser);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        await fetchUserProfile(authUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    signOut: () => supabase.auth.signOut(),
    refreshProfile: () => user && fetchUserProfile(user),
    getDashboardRoute
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};