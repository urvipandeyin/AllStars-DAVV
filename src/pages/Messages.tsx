import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  getConversations, 
  getDirectMessages, 
  sendDirectMessage, 
  markMessagesAsRead, 
  getProfileByUserId,
  subscribeToDirectMessages,
  getUserGroupMemberships,
  getGroupById,
  getGroupMessages,
  subscribeToGroupMessages,
  sendGroupMessage
} from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  user_id?: string; // for DMs
  group_id?: string; // for groups
  name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread: boolean;
  isGroup?: boolean;
}

export default function Messages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      // If userId starts with 'group-', treat as group chat
      if (userId.startsWith('group-')) {
        setIsGroupChat(true);
        fetchGroupMessages(userId.replace('group-', ''));
        fetchGroupInfo(userId.replace('group-', ''));
      } else {
        setIsGroupChat(false);
        fetchMessages();
        fetchOtherUser();
      }
    } else {
      // Real-time conversation list (Instagram-like)
      if (!user) return;
      setLoading(true);
      const unsubscribe = subscribeToDirectMessages(user.uid, async (allMessages) => {
        // Group messages by conversation partner
        const convMap = new Map();
        allMessages.forEach(msg => {
          const partnerId = msg.sender_id === user.uid ? msg.receiver_id : msg.sender_id;
          const isUnread = msg.receiver_id === user.uid && !msg.read;
          const existing = convMap.get(partnerId);
          if (!existing || new Date(msg.created_at) > new Date(existing.last_message_at)) {
            convMap.set(partnerId, {
              user_id: partnerId,
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread: isUnread,
            });
          } else if (isUnread) {
            // If older but unread, mark as unread
            convMap.set(partnerId, {
              ...existing,
              unread: true,
            });
          }
        });
        // Fetch profile for each partner
        const conversations = await Promise.all(
          Array.from(convMap.values()).map(async (conv) => {
            const profile = await getProfileByUserId(conv.user_id);
            return {
              ...conv,
              name: profile?.name || 'Unknown',
              avatar_url: profile?.avatar_url || null,
            };
          })
        );
        // Sort by last message time
        setConversations(conversations.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)));
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!userId || !user) return;
    if (userId.startsWith('group-')) {
      // Real-time group messages
      const groupId = userId.replace('group-', '');
      const unsubscribe = subscribeToGroupMessages(groupId, (msgs) => setMessages(msgs));
      return () => unsubscribe();
    } else {
      // Real-time DMs
      const unsubscribe = subscribeToDirectMessages(user.uid, (allMessages) => {
        const filteredMessages = allMessages.filter(
          msg => (msg.sender_id === user.uid && msg.receiver_id === userId) ||
                 (msg.sender_id === userId && msg.receiver_id === user.uid)
        );
        setMessages(filteredMessages);
      });
      return () => unsubscribe();
    }
  }, [userId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Direct conversations
      const convs = await getConversations(user.uid);
      // Group conversations
      const groupIds = await getUserGroupMemberships(user.uid);
      const groupConvs = await Promise.all(
        groupIds.map(async (groupId) => {
          const group = await getGroupById(groupId);
          if (!group) return null;
          // Get last group message
          const msgs = await getGroupMessages(groupId);
          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
          return {
            group_id: groupId,
            name: group.name,
            avatar_url: null,
            last_message: lastMsg ? lastMsg.content : 'No messages yet',
            last_message_at: lastMsg ? lastMsg.created_at : group.created_at,
            unread: false, // You can enhance this with unread logic
            isGroup: true,
          };
        })
      );
      // Merge and deduplicate by group_id for groups and user_id for DMs
      const allConvs = [
        ...convs,
        ...groupConvs.filter(Boolean) as Conversation[],
      ];
      const uniqueConvsMap = new Map();
      allConvs.forEach(conv => {
        if (conv.isGroup && conv.group_id) {
          if (!uniqueConvsMap.has(`group-${conv.group_id}`)) {
            uniqueConvsMap.set(`group-${conv.group_id}`, conv);
          }
        } else if (conv.user_id) {
          if (!uniqueConvsMap.has(`user-${conv.user_id}`)) {
            uniqueConvsMap.set(`user-${conv.user_id}`, conv);
          }
        }
      });
      setConversations(Array.from(uniqueConvsMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user || !userId) return;
    setLoading(true);
    try {
      const data = await getDirectMessages(user.uid, userId);
      setMessages(data || []);
      await markMessagesAsRead(userId, user.uid);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMessages = async (groupId: string) => {
    setLoading(true);
    try {
      const msgs = await getGroupMessages(groupId);
      setMessages(msgs || []);
    } catch (error) {
      console.error('Error fetching group messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupInfo = async (groupId: string) => {
    const group = await getGroupById(groupId);
    if (group) {
      setOtherUser({ name: group.name, avatar_url: null });
    }
  };

  const fetchOtherUser = async () => {
    if (!userId) return;

    const profile = await getProfileByUserId(userId);
    if (profile) {
      setOtherUser({ name: profile.name, avatar_url: profile.avatar_url });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userId || !newMessage.trim()) return;
    setSending(true);
    try {
      if (isGroupChat) {
        await sendGroupMessage({
          group_id: userId.replace('group-', ''),
          user_id: user.uid,
          content: newMessage.trim(),
        });
      } else {
        await sendDirectMessage({
          sender_id: user.uid,
          receiver_id: userId,
          content: newMessage.trim(),
        });
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender_id: user.uid,
          receiver_id: userId,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          read: false,
        }]);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Conversation list view
  if (!userId) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-gradient mb-6">Messages</h1>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No conversations yet. Start one from someone's profile or group!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map(conv => (
                <Link
                  key={conv.isGroup ? `group-${conv.group_id}` : conv.user_id}
                  to={`/messages/${conv.isGroup ? `group-${conv.group_id}` : conv.user_id}`}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-muted/50',
                    conv.unread && 'bg-primary/5'
                  )}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {conv.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={cn('font-semibold truncate', conv.unread && 'text-primary')}>
                        {conv.name} {conv.isGroup && <span className="ml-2 text-xs text-purple-500">[Group]</span>}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn(
                      'text-sm truncate',
                      conv.unread ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}>
                      {conv.last_message}
                    </p>
                  </div>
                  {conv.unread && (
                    <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    );
  }

  // Chat view
  return (
    <div className="fixed inset-0 top-14 md:top-24 flex flex-col bg-background h-[100dvh] min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card shrink-0">
        <Link to="/messages">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        {otherUser && (
          <span className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={otherUser.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                {otherUser.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="font-semibold truncate">{otherUser.name}{isGroupChat && <span className="ml-2 text-xs text-purple-500">[Group]</span>}</h2>
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          messages.map(msg => {
            // For group messages, sender_id is user id
            const isMe = isGroupChat ? msg.user_id === user?.uid : msg.sender_id === user?.uid;
            return (
              <div
                key={msg.id}
                className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2',
                    isMe
                      ? 'bg-gradient-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn(
                    'text-xs mt-1',
                    isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input always visible, sticky at bottom */}
      <form onSubmit={handleSend} className="sticky bottom-0 left-0 right-0 z-10 p-3 border-t border-border bg-card safe-area-inset-bottom">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-9"
          />
          <Button type="submit" size="icon" className="h-9 w-9" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
