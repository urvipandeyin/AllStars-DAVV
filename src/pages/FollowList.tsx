import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserCard } from '@/components/cards/UserCard';
import { getFollowers, getFollowing, getProfileByUserId } from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile } from '@/integrations/firebase/types';

interface FollowListProps {
  type: 'followers' | 'following';
}

export default function FollowList({ type }: FollowListProps) {
  const { userId } = useParams();
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [profileName, setProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?.uid === userId;
  const title = type === 'followers' ? 'Followers' : 'Following';

  useEffect(() => {
    if (userId) {
      fetchUsers();
      fetchProfileName();
    }
  }, [userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = type === 'followers' 
        ? await getFollowers(userId!)
        : await getFollowing(userId!);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileName = async () => {
    try {
      const profile = await getProfileByUserId(userId!);
      if (profile) {
        setProfileName(profile.name);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const backLink = isOwnProfile ? '/profile' : `/user/${userId}`;

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={backLink}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {isOwnProfile ? 'Your' : `${profileName}'s`} {title.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {type === 'followers' 
                  ? (isOwnProfile ? "You don't have any followers yet" : `${profileName} doesn't have any followers yet`)
                  : (isOwnProfile ? "You're not following anyone yet" : `${profileName} isn't following anyone yet`)}
              </p>
              {type === 'followers' && isOwnProfile && (
                <Link to="/discover">
                  <Button className="mt-4">Discover People</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map(profile => (
              <UserCard key={profile.id} profile={profile} compact />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
