import { useState, useEffect } from 'react';
import { checkFollowStatus, getFollowCounts, followUser, unfollowUser } from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useFollows(targetUserId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (targetUserId) {
      fetchFollowStatus();
      fetchCounts();
    }
  }, [targetUserId, user]);

  const fetchFollowStatus = async () => {
    if (!user || !targetUserId || user.uid === targetUserId) {
      setLoading(false);
      return;
    }

    try {
      const following = await checkFollowStatus(user.uid, targetUserId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error fetching follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    if (!targetUserId) return;

    try {
      const counts = await getFollowCounts(targetUserId);
      setFollowerCount(counts.followers);
      setFollowingCount(counts.following);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.uid === targetUserId) return;

    try {
      if (isFollowing) {
        await unfollowUser(user.uid, targetUserId);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await followUser(user.uid, targetUserId);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast({
          title: 'Following',
          description: "You'll see their updates in your feed!",
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  return {
    isFollowing,
    followerCount,
    followingCount,
    loading,
    toggleFollow,
    refetch: () => {
      fetchFollowStatus();
      fetchCounts();
    },
  };
}
