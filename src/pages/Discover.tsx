import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, Users, Sparkles, UserPlus } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { UserCard } from '@/components/cards/UserCard';
import { GroupCard } from '@/components/cards/GroupCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BROAD_INTERESTS, SKILL_LEVELS } from '@/lib/constants';
import { getProfiles, getGroups, getSuggestedUsers, getUserGroupMemberships, joinGroup, leaveGroup } from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, type Profile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

export default function Discover() {
  const { user } = useAuth();
  const { profile: myProfile } = useProfile();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [myMemberships, setMyMemberships] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('people');

  useEffect(() => {
    if (myProfile) {
      fetchData();
    }
  }, [interestFilter, skillFilter, myProfile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profiles - prioritize those with shared interests
      const profileFilters: any = { skillLevel: skillFilter };
      
      if (interestFilter !== 'all') {
        profileFilters.interest = interestFilter;
      } else if (myProfile?.interests?.length) {
        // Show users with shared interests by default
        profileFilters.interests = myProfile.interests;
      }
      
      // Fetch main data in parallel - but with timeout protection
      const [profilesData, groupsData, memberships] = await Promise.all([
        getProfiles(user?.uid, profileFilters, 12).catch(() => []),
        getGroups(myProfile?.interests?.length ? { interests: myProfile.interests } : undefined, 12).catch(() => []),
        user ? getUserGroupMemberships(user.uid).catch(() => []) : [],
      ]);
      
      setProfiles(profilesData || []);
      setGroups(groupsData || []);
      setMyMemberships(memberships);
      
      // Don't wait for suggested users - load them in background
      setSuggestedUsers([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
    
    // Load suggested users after main content (non-blocking)
    if (user && myProfile?.interests?.length) {
      getSuggestedUsers(user.uid, myProfile.interests, 3)
        .then(suggested => setSuggestedUsers(suggested))
        .catch(() => setSuggestedUsers([]));
    }
  };

  const handleJoinGroup = async (groupId: string, isOpen: boolean) => {
    if (!user) return;
    try {
      await joinGroup(groupId, user.uid, isOpen);
      toast({
        title: isOpen ? 'Joined group!' : 'Request sent!',
        description: isOpen ? undefined : 'The group admin will review your request.',
      });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to join group.', variant: 'destructive' });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    try {
      await leaveGroup(groupId, user.uid);
      toast({ title: 'Left group' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to leave group.', variant: 'destructive' });
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(search.toLowerCase()) ||
    profile.bio?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    group.interest.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-gradient mb-2">Discover</h1>
          <p className="text-muted-foreground">
            {myProfile?.interests?.length 
              ? 'Find people and groups that match your interests'
              : 'Find people who share your interests and passion'
            }
          </p>
        </div>

        {/* Suggested Users Section */}
        {suggestedUsers.length > 0 && activeTab === 'people' && (
          <Card className="border-0 shadow-card bg-gradient-to-r from-primary/5 to-accent/5 mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                People you may like
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestedUsers.slice(0, 6).map(profile => (
                  <UserCard key={profile.id} profile={profile} compact />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="people" className="gap-2">
              <UserPlus className="h-4 w-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <Users className="h-4 w-4" />
              Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'people' ? 'Search by name or bio...' : 'Search groups...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-xl animate-fade-in">
              <div className="space-y-2">
                <label className="text-sm font-medium">Interest</label>
                <Select value={interestFilter} onValueChange={setInterestFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All interests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Interests</SelectItem>
                    {BROAD_INTERESTS.map(interest => (
                      <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeTab === 'people' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Skill Level</label>
                  <Select value={skillFilter} onValueChange={setSkillFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {SKILL_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => {
                  setInterestFilter('all');
                  setSkillFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'people' && (
              filteredProfiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No users found matching your interests.</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredProfiles.map(profile => (
                    <UserCard key={profile.id} profile={profile} />
                  ))}
                </div>
              )
            )}

            {activeTab === 'groups' && (
              filteredGroups.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No groups found matching your interests.</p>
                  <p className="text-sm text-muted-foreground mt-2">Why not create one?</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredGroups.map(group => (
                    <GroupCard 
                      key={group.id} 
                      group={group}
                      isMember={myMemberships.includes(group.id)}
                      onJoin={() => handleJoinGroup(group.id, group.is_open)}
                      onLeave={() => handleLeaveGroup(group.id)}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
