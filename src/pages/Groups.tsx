import { useState, useEffect } from 'react';
import { Plus, Loader2, Search } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { GroupCard } from '@/components/cards/GroupCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BROAD_INTERESTS, INTEREST_CATEGORIES } from '@/lib/constants';
import { getGroups, getUserGroupMemberships, createGroup, joinGroup, leaveGroup } from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface Group {
  id: string;
  name: string;
  description: string | null;
  interest: string;
  sub_interest: string | null;
  is_open: boolean;
  member_count: number;
  creator_id: string;
}

export default function Groups() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myMemberships, setMyMemberships] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState('all');

  // Create form state
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    interest: '',
    sub_interest: '',
    is_open: true,
  });
  const [creating, setCreating] = useState(false);

  // Get available sub-interests based on selected interest
  const availableSubInterests = newGroup.interest 
    ? INTEREST_CATEGORIES[newGroup.interest as keyof typeof INTEREST_CATEGORIES] || []
    : [];

  useEffect(() => {
    fetchGroups();
    fetchMyMemberships();
  }, [profile]);

  const fetchGroups = async () => {
    try {
      // Filter groups by user's interests if available
      const filters = profile?.interests?.length 
        ? { interests: profile.interests }
        : undefined;
      const data = await getGroups(filters);
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyMemberships = async () => {
    if (!user) return;
    try {
      const memberships = await getUserGroupMemberships(user.uid);
      setMyMemberships(memberships);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroup.name || !newGroup.interest) return;

    setCreating(true);
    try {
      const groupData = await createGroup({
        name: newGroup.name,
        description: newGroup.description || null,
        interest: newGroup.interest,
        sub_interest: newGroup.sub_interest || null,
        is_open: newGroup.is_open,
        creator_id: user.uid,
      });

      // Add creator as admin member
      await joinGroup(groupData.id, user.uid, true, 'admin');

      toast({ title: 'Group created!' });
      setCreateOpen(false);
      setNewGroup({ name: '', description: '', interest: '', sub_interest: '', is_open: true });
      fetchGroups();
      fetchMyMemberships();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
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
      fetchGroups();
      fetchMyMemberships();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join group.',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      await leaveGroup(groupId, user.uid);

      toast({ title: 'Left group' });
      fetchGroups();
      fetchMyMemberships();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to leave group.',
        variant: 'destructive',
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    group.interest.toLowerCase().includes(search.toLowerCase())
  );

  const myGroups = filteredGroups.filter(g => myMemberships.includes(g.id));
  const otherGroups = filteredGroups.filter(g => !myMemberships.includes(g.id));

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gradient mb-2">Groups</h1>
            <p className="text-muted-foreground">Join communities based on your interests</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="e.g., Badminton Beginners"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest">Interest Category</Label>
                  <Select
                    value={newGroup.interest}
                    onValueChange={(v) => setNewGroup({ ...newGroup, interest: v, sub_interest: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an interest" />
                    </SelectTrigger>
                    <SelectContent>
                      {BROAD_INTERESTS.map(interest => (
                        <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newGroup.interest && availableSubInterests.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="sub_interest">Specific Activity (Optional)</Label>
                    <Select
                      value={newGroup.sub_interest}
                      onValueChange={(v) => setNewGroup({ ...newGroup, sub_interest: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a specific activity" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubInterests.map(sub => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="What's this group about?"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_open">Open Group</Label>
                    <p className="text-sm text-muted-foreground">Anyone can join without approval</p>
                  </div>
                  <Switch
                    id="is_open"
                    checked={newGroup.is_open}
                    onCheckedChange={(v) => setNewGroup({ ...newGroup, is_open: v })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Group
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Groups</TabsTrigger>
            <TabsTrigger value="my">My Groups ({myGroups.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No groups found. Create the first one!</p>
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
            )}
          </TabsContent>

          <TabsContent value="my">
            {myGroups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">You haven't joined any groups yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myGroups.map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isMember={true}
                    onLeave={() => handleLeaveGroup(group.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
