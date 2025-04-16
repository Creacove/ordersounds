
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to log authentication events to both console and database
 * Uses conditional database logging based on availability of tables
 */
export const logAuthEvent = async (
  eventCategory: string,
  eventName: string,
  details: Record<string, any> = {},
  userId: string | null = null
) => {
  try {
    const eventType = `${eventCategory}_${eventName}`;
    const eventTime = new Date().toISOString();
    const userIdValue = userId || 'anonymous';
    
    // Log to console immediately
    console.log('Auth event:', {
      event_type: eventType,
      user_id: userIdValue,
      details: {
        ...details,
        timestamp: eventTime,
      },
    });
    
    // Try to insert into the database, handling potential errors gracefully
    try {
      // Insert into the auth_logs table (now available in the database)
      const { error } = await supabase.from('auth_logs').insert({
        event_type: eventType,
        user_id: userIdValue !== 'anonymous' ? userIdValue : null,
        details: details,
        created_at: eventTime
      });
      
      if (error) {
        console.warn('Could not log auth event to database:', error.message);
      }
    } catch (dbError) {
      // Silent fallback - database logging is a non-critical operation
      console.warn('Database logging failed:', dbError);
    }
  } catch (error) {
    // Never let errors in logging disrupt the main application flow
    console.error('Error in auth logging system:', error);
  }
};

/**
 * Helper method specifically for Google auth events
 */
export const logGoogleAuthEvent = async (
  event: string,
  details: Record<string, any> = {},
  userId: string | null = null
) => {
  return logAuthEvent('google', event, details, userId);
};

/**
 * Helper method specifically for auth callback events
 */
export const logCallbackEvent = async (
  event: string,
  details: Record<string, any> = {},
  userId: string | null = null
) => {
  return logAuthEvent('callback', event, details, userId);
};

/**
 * Helper method to log session-related events
 */
export const logSessionEvent = async (
  event: string,
  details: Record<string, any> = {},
  userId: string | null = null
) => {
  return logAuthEvent('session', event, details, userId);
};

/**
 * Force a re-authentication flow for users experiencing issues
 * @param email Optional email to pre-populate the login form
 */
export const initiateRecoveryFlow = (email?: string) => {
  try {
    // Clear any existing auth data that might be causing problems
    supabase.auth.signOut({ scope: 'local' });
    
    // Remove any OAuth-related data
    localStorage.removeItem('oauth_initiated');
    localStorage.removeItem('oauth_provider');
    localStorage.removeItem('oauth_mode');
    
    // Clear any Supabase-related error states
    localStorage.removeItem('supabase.auth.error');
    sessionStorage.removeItem('supabase.auth.error');
    
    // Log this recovery attempt
    logAuthEvent('recovery', 'initiated', { email });
    
    // Redirect to login with recovery parameter
    const loginUrl = `/login${email ? `?email=${encodeURIComponent(email)}&recovery=true` : '?recovery=true'}`;
    window.location.href = loginUrl;
  } catch (error) {
    console.error('Failed to initiate recovery flow:', error);
    // Fallback to simple redirect if something fails
    window.location.href = '/login?recovery=true';
  }
};
