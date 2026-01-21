import { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { CreatePostForm } from '@/components/forms/CreatePostForm';
import { PostCard } from '@/components/cards/PostCard';
import { UserCard } from '@/components/cards/UserCard';
import { getPosts, getSuggestedUsers, getFollowingIds } from '@/integrations/firebase/db';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      // Filter posts by user's interests
      const filters = profile?.interests?.length 
        ? { interests: profile.interests, subInterests: profile.sub_interests }
        : undefined;
      
      let data = await getPosts(filters, 10).catch(() => []);
      
      // Prioritize posts from users we follow
      if (followingIds.length > 0 && data.length > 0) {
        const followedPosts = data.filter(p => followingIds.includes(p.user_id));
        const otherPosts = data.filter(p => !followingIds.includes(p.user_id));
        data = [...followedPosts, ...otherPosts];
      }
      
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user || !profile?.interests?.length) return;
    try {
      const users = await getSuggestedUsers(user.uid, profile.interests, 3).catch(() => []);
      setSuggestedUsers(users);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setSuggestedUsers([]);
    }
  };

  const fetchFollowingIds = async () => {
    if (!user) return;
    try {
      const ids = await getFollowingIds(user.uid).catch(() => []);
      setFollowingIds(ids);
    } catch (error) {
      console.error('Error fetching following ids:', error);
      setFollowingIds([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFollowingIds();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchPosts();
      // Load suggested users in background (non-blocking)
      setTimeout(() => fetchSuggestedUsers(), 500);
    }
  }, [profile]);

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-gradient mb-2">Your Feed</h1>
              <p className="text-muted-foreground">
                {profile?.interests?.length 
                  ? `Posts matching your interests: ${profile.interests.join(', ')}`
                  : 'See what others are working on and find your next team'
                }
              </p>
            </div>

            <CreatePostForm onPostCreated={fetchPosts} />

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts matching your interests yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Be the first to share something!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onDelete={fetchPosts} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - People You May Like */}
          <div className="hidden lg:block space-y-6">
            {suggestedUsers.length > 0 && (
              <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    People you may like
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {suggestedUsers.slice(0, 4).map(suggestedProfile => (
                    <div 
                      key={suggestedProfile.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/user/${suggestedProfile.user_id}`)}
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                        {suggestedProfile.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{suggestedProfile.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {suggestedProfile.interests?.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    className="w-full text-primary"
                    onClick={() => navigate('/discover')}
                  >
                    Discover more people
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
