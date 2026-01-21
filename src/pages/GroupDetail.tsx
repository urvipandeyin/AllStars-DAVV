import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Send, ArrowLeft, Users, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InterestTag } from '@/components/ui/InterestTag';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getGroupById, 
  getGroupMembers, 
  getGroupMessages, 
  checkGroupMembership, 
  sendGroupMessage,
  subscribeToGroupMessages 
} from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface GroupMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url: string | null;
  };
}

interface GroupMember {
  user_id: string;
  role: string;
  profiles?: {
    name: string;
    avatar_url: string | null;
  };
}

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (groupId) {
      fetchGroup();
      fetchMembers();
      fetchMessages();
      checkMembershipStatus();
    }
  }, [groupId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!groupId || !isMember) return;

    // Subscribe to group messages using Firebase realtime
    const unsubscribe = subscribeToGroupMessages(groupId, (newMessages) => {
      setMessages(newMessages as GroupMessage[]);
    });

    return () => unsubscribe();
  }, [groupId, isMember]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroup = async () => {
    try {
      const data = await getGroupById(groupId!);
      setGroup(data);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMembershipStatus = async () => {
    if (!user) return;
    const member = await checkGroupMembership(groupId!, user.uid);
    setIsMember(member);
  };

  const fetchMembers = async () => {
    const data = await getGroupMembers(groupId!);
    setMembers(data as GroupMember[]);
  };

  const fetchMessages = async () => {
    const data = await getGroupMessages(groupId!);
    setMessages(data as GroupMessage[]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId || !newMessage.trim()) return;

    await sendGroupMessage({
      group_id: groupId,
      user_id: user.uid,
      content: newMessage.trim(),
    });

    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Group not found</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] min-h-0">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
        <Link to="/groups">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="font-display font-semibold">{group.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {group.member_count} members
          </div>
        </div>
        <InterestTag interest={group.interest} size="sm" />
      </div>

      {isMember ? (
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col mt-0 min-h-0">
            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.user_id === user?.uid;
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex gap-2', isMe && 'flex-row-reverse')}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {msg.profiles?.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2',
                          isMe
                            ? 'bg-gradient-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        {!isMe && (
                          <p className="text-xs font-medium mb-1">{msg.profiles?.name}</p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-border bg-card safe-area-inset-bottom">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="members" className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {members.map(member => (
                <Link
                  key={member.user_id}
                  to={`/user/${member.user_id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={member.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                      {member.profiles?.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{member.profiles?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Join this group to see messages and participate in discussions.
              </p>
              <Link to="/groups">
                <Button>Go to Groups</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
