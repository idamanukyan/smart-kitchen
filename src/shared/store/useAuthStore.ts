import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  userId: string | null;
  householdId: string | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function ensureHousehold(userId: string): Promise<string | null> {
  try {
    // Check if user already has a household
    const { data: userData } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', userId)
      .single();

    if (userData?.household_id) {
      return userData.household_id;
    }

    // Create a new household
    const { data: household, error: hError } = await supabase
      .from('households')
      .insert({
        name: 'Mein Haushalt',
        size: 2,
        created_by: userId,
        invite_code: generateInviteCode(),
      })
      .select('id')
      .single();

    if (hError || !household) {
      console.error('Failed to create household:', hError?.message);
      return null;
    }

    // Link user to household
    await supabase
      .from('users')
      .update({ household_id: household.id })
      .eq('id', userId);

    return household.id;
  } catch (err) {
    console.error('ensureHousehold error:', err);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  userId: null,
  householdId: null,
  isLoading: true,

  initialize: async () => {
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({ session, userId: session.user.id, isLoading: false });
        // Ensure household exists (async, non-blocking)
        ensureHousehold(session.user.id).then(householdId => {
          set({ householdId });
        });
        return;
      }

      // No session — sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('Anonymous auth failed:', error.message);
        set({ isLoading: false });
        return;
      }

      if (data.session) {
        set({
          session: data.session,
          userId: data.session.user.id,
          isLoading: false,
        });
        // Ensure household exists
        ensureHousehold(data.session.user.id).then(householdId => {
          set({ householdId });
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      set({ isLoading: false });
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        userId: session?.user.id ?? null,
      });
    });
  },
}));
