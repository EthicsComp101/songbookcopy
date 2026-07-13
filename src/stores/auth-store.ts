import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Session } from '@supabase/supabase-js';
import { supabase } from 'src/util/supabase';

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null);
  const displayName = ref<string | null>(null);
  // True once the initial getSession() has resolved, so pages can tell
  // "signed out" apart from "still checking".
  const initialized = ref(false);

  const signedIn = computed(() => session.value != null);
  const email = computed(() => session.value?.user.email ?? '');
  const userId = computed(() => session.value?.user.id ?? null);

  async function loadProfile() {
    if (session.value == null) {
      displayName.value = null;
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.value.user.id)
      .single();
    if (error) {
      console.error('Failed to load profile: ' + error.message);
      displayName.value = null;
      return;
    }
    displayName.value = data.display_name;
  }

  async function init() {
    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    await loadProfile();
    initialized.value = true;
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession;
      // Supabase warns against awaiting its own calls inside this callback
      // (deadlock risk) — defer the profile fetch out of it.
      setTimeout(() => void loadProfile(), 0);
    });
  }

  async function signInWithEmail(emailAddress: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: emailAddress,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    });
    if (error) throw new Error(error.message);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async function updateDisplayName(name: string) {
    if (session.value == null) throw new Error('Not signed in');
    const trimmed = name.trim();
    if (trimmed === '') throw new Error('Display name cannot be empty');
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', session.value.user.id);
    if (error) throw new Error(error.message);
    displayName.value = trimmed;
  }

  return {
    session,
    displayName,
    initialized,
    signedIn,
    email,
    userId,
    init,
    signInWithEmail,
    signOut,
    updateDisplayName,
  };
});
