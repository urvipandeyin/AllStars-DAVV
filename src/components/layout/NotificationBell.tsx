import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, Heart, UserPlus, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  subscribeToNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  getProfileByUserId 
} from '@/integrations/firebase/db';
import { useToast } from '@/hooks/use-toast';
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
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'like':
      return <Heart className="h-4 w-4 text-red-500" />;
    case 'follow':
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case 'comment':
      return <MessageCircle className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationWithProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [profileCache, setProfileCache] = useState<Map<string, { name: string; avatar_url: string | null }>>(new Map());
  const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.uid, async (notifs) => {
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

      // Show toast for new notification if bell is closed
      if (!open && notifsWithProfiles.length > 0) {
        const latest = notifsWithProfiles[0];
        if (latest && latest.id !== lastNotifiedId && !latest.read) {
          toast({
            title: 'New Notification',
            description: latest.content,
            action: {
              label: 'View',
              onClick: () => setOpen(true),
            },
            duration: 6000,
          });
          setLastNotifiedId(latest.id);
        }
      }

      setNotifications(notifsWithProfiles);
    });

    return () => unsubscribe();
  }, [user, profileCache, open, lastNotifiedId, toast]);

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

  const handleNotificationClick = async (notification: NotificationWithProfile) => {
    if (!notification.read) {
      await handleMarkRead(notification.id);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link || '#'}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors',
                    !notification.read && 'bg-primary/5'
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={notification.fromProfile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                      {notification.fromProfile?.name?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">{notification.content}</p>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
