import { getProfileByUserId, updateProfile as updateProfileInDb, createProfile as createProfileInDb } from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/integrations/firebase/types';

export type { Profile } from '@/integrations/firebase/types';

export function useProfile() {
  const { user, profile, profileLoading: loading, setProfile, refetchProfile } = useAuth();
  const { toast } = useToast();

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    try {
      await updateProfileInDb(profile.id, updates);

      setProfile(prev => prev ? { ...prev, ...updates } as Profile : null);
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
      return { error: null };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
      return { error: error as Error };
    }
  };

  const completeProfile = async (profileData: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Always fetch fresh profile from database
      const fetchedProfile = await getProfileByUserId(user.uid);

      const updatedProfileData = {
        ...profileData,
        profile_completed: true,
      };

      let finalProfile: Profile;

      // If profile exists, update it
      if (fetchedProfile && fetchedProfile.id) {
        await updateProfileInDb(fetchedProfile.id, updatedProfileData);
        finalProfile = { ...fetchedProfile, ...updatedProfileData } as Profile;
      } else {
        // If profile doesn't exist, create it
        finalProfile = await createProfileInDb({
          user_id: user.uid,
          name: profileData.name || user.displayName || 'User',
          bio: profileData.bio || null,
          interests: profileData.interests || [],
          sub_interests: profileData.sub_interests || [],
          skill_level: profileData.skill_level || null,
          city: profileData.city || null,
          looking_for: profileData.looking_for || null,
          student_type: profileData.student_type || null,
          department: profileData.department || null,
          branch: profileData.branch || null,
          year: profileData.year || null,
          avatar_url: profileData.avatar_url || user.photoURL || null,
          profile_completed: true,
        });
      }

      // Update local state immediately with the completed profile
      setProfile(finalProfile);

      toast({
        title: 'Profile completed',
        description: 'Welcome to AllStars DAVV!',
      });
      return { error: null };
    } catch (error) {
      console.error('Error completing profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
      return { error: error as Error };
    }
  };

  return { profile, loading, updateProfile, completeProfile, refetch: refetchProfile };
}
