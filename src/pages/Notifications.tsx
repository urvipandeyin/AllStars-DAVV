import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, Heart, UserPlus, MessageCircle, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  subscribeToNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  getProfileByUserId 
} from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/integrations/firebase/types';
import { cn } from '@/lib/utils';

interface NotificationWithProfile extends Notification {
  fromProfile?: {
    name: string;
    avatar_url: string | null;
  };
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'message':
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'like':
      return <Heart className="h-5 w-5 text-red-500" />;
    case 'follow':
      return <UserPlus className="h-5 w-5 text-green-500" />;
    case 'comment':
      return <MessageCircle className="h-5 w-5 text-purple-500" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getNotificationTitle = (type: Notification['type']) => {
  switch (type) {
    case 'message':
      return 'New Message';
    case 'like':
      return 'New Like';
    case 'follow':
      return 'New Follower';
    case 'comment':
      return 'New Comment';
    default:
      return 'Notification';
  }
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileCache, setProfileCache] = useState<Map<string, { name: string; avatar_url: string | null }>>(new Map());

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.uid, async (notifs) => {
      setLoading(false);
      
      // Fetch profiles for notifications we don't have cached
      const uniqueUserIds = [...new Set(notifs.map(n => n.from_user_id))];
      const missingUserIds = uniqueUserIds.filter(id => !profileCache.has(id));
      
      if (missingUserIds.length > 0) {
        const profiles = await Promise.all(
          missingUserIds.map(async (id) => {
            const profile = await getProfileByUserId(id);
            return { id, profile };
          })
        );
        
        setProfileCache(prev => {
          const newCache = new Map(prev);
          profiles.forEach(({ id, profile }) => {
            if (profile) {
              newCache.set(id, { name: profile.name, avatar_url: profile.avatar_url });
            }
          });
          return newCache;
        });
      }

      // Add profile data to notifications
      const notifsWithProfiles = notifs.map(n => ({
        ...n,
        fromProfile: profileCache.get(n.from_user_id) || { name: 'User', avatar_url: null },
      }));
      
      setNotifications(notifsWithProfiles);
    });

    return () => unsubscribe();
  }, [user, profileCache]);

  const handleMarkRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gradient">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
              <Check className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold text-lg mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                When someone follows you, likes your post, or sends you a message, you'll see it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={notification.link || '#'}
                onClick={() => !notification.read && handleMarkRead(notification.id)}
              >
                <Card className={cn(
                  'transition-all hover:shadow-md',
                  !notification.read && 'bg-primary/5 border-primary/20'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={notification.fromProfile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {notification.fromProfile?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          <span className="font-medium text-sm">
                            {getNotificationTitle(notification.type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.content}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
