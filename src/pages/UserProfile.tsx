import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, MessageCircle, MapPin, ArrowLeft, GraduationCap, BookOpen, Calendar, Home, UserPlus, UserMinus } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InterestTag } from '@/components/ui/InterestTag';
import { SkillBadge } from '@/components/ui/SkillBadge';
import { LookingForBadge } from '@/components/ui/LookingForBadge';
import { PostCard } from '@/components/cards/PostCard';
import { getProfileByUserId, getPostsByUserId, getFollowCounts } from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useFollows } from '@/hooks/useFollows';
import type { Profile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

export default function UserProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const { isFollowing, loading: followLoading, toggleFollow } = useFollows(userId || '');

  const isOwnProfile = user?.uid === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchPosts();
      fetchFollowCounts();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const data = await getProfileByUserId(userId!);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const data = await getPostsByUserId(userId!, 10);
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const counts = await getFollowCounts(userId!);
      setFollowCounts(counts);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-4 pb-20">
        {/* Back button */}
        <Link to="/discover">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="h-20 sm:h-24 bg-gradient-hero" />
          <CardContent className="relative pt-0 pb-4">
            <div className="flex flex-col items-center -mt-10 sm:-mt-12">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-background shadow-xl">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl sm:text-2xl font-bold">
                  {profile?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <h1 className="font-display text-xl sm:text-2xl font-bold mt-3">{profile?.name}</h1>
              
              {profile?.city && (
                <p className="text-muted-foreground flex items-center gap-1 text-sm mt-1">
                  <MapPin className="h-3 w-3" />
                  {profile.city}
                </p>
              )}

              {/* Follower Stats */}
              <div className="flex items-center gap-8 mt-3">
                <Link to={`/user/${userId}/followers`} className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{followCounts.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </Link>
                <Link to={`/user/${userId}/following`} className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{followCounts.following}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </Link>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={cn('gap-2', !isFollowing && 'bg-gradient-primary')}
                  >
                    {followLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Link to={`/messages/${userId}`}>
                    <Button variant="outline" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {profile?.bio && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Academic Details */}
        {(profile?.department || profile?.branch || profile?.year) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile?.department && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm"><strong>Department:</strong> {profile.department}</span>
                  </div>
                )}
                {profile?.branch && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm"><strong>Branch:</strong> {profile.branch}</span>
                  </div>
                )}
                {profile?.year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm"><strong>Year:</strong> {profile.year}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {profile?.student_type && (
            <Card className="p-4 text-center">
              <Home className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">{profile.student_type}</p>
              <p className="text-xs text-muted-foreground">Student Type</p>
            </Card>
          )}
          {profile?.skill_level && (
            <Card className="p-4 text-center">
              <SkillBadge level={profile.skill_level} />
              <p className="text-xs text-muted-foreground mt-1">Skill Level</p>
            </Card>
          )}
          {profile?.looking_for && (
            <Card className="p-4 text-center">
              <LookingForBadge status={profile.looking_for} />
              <p className="text-xs text-muted-foreground mt-1">Looking For</p>
            </Card>
          )}
        </div>

        {/* Interests */}
        {profile?.interests && profile.interests.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(interest => (
                  <InterestTag key={interest} interest={interest} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sub-Interests / Skills */}
        {profile?.sub_interests && profile.sub_interests.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Skills & Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.sub_interests.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts */}
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Recent Posts</h2>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No posts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
