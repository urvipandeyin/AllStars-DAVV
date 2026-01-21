import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';
import { createProfile, getProfileByUserId, updateProfile as updateProfileInDb } from '@/integrations/firebase/db';
import type { Profile } from '@/integrations/firebase/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const fetchedProfile = await getProfileByUserId(userId);
      setProfile(fetchedProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refetchProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(userCredential.user, { displayName: name });
      
      // Create a profile in Firestore
      await createProfile({
        user_id: userCredential.user.uid,
        name,
        bio: null,
        interests: [],
        sub_interests: [],
        skill_level: null,
        city: null,
        looking_for: null,
        student_type: null,
        department: null,
        branch: null,
        year: null,
        avatar_url: null,
        profile_completed: false,
      });
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if profile exists, if not create one
      const existingProfile = await getProfileByUserId(userCredential.user.uid);
      if (!existingProfile) {
        await createProfile({
          user_id: userCredential.user.uid,
          name: userCredential.user.displayName || 'User',
          bio: null,
          interests: [],
          sub_interests: [],
          skill_level: null,
          city: null,
          looking_for: null,
          student_type: null,
          department: null,
          branch: null,
          year: null,
          avatar_url: userCredential.user.photoURL,
          profile_completed: false,
        });
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      profile, 
      profileLoading, 
      signUp, 
      signIn, 
      signInWithGoogle, 
      signOut,
      refetchProfile,
      setProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
