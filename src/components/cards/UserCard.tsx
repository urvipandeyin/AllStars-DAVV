import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InterestTag } from '@/components/ui/InterestTag';
import { SkillBadge } from '@/components/ui/SkillBadge';
import { LookingForBadge } from '@/components/ui/LookingForBadge';
import { Profile } from '@/hooks/useProfile';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface UserCardProps {
  profile: Profile;
  showMessageButton?: boolean;
  compact?: boolean;
}

export function UserCard({ profile, showMessageButton = true, compact = false }: UserCardProps) {
  const { user } = useAuth();
  const { isFollowing, loading, toggleFollow } = useFollows(profile.user_id);
  const isOwnProfile = user?.uid === profile.user_id;

  if (compact) {
    return (
      <Card className="card-hover overflow-hidden">
        <CardContent className="p-3">
          <Link to={`/user/${profile.user_id}`} className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-sm">
                {profile.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm hover:text-primary transition-colors truncate">
                {profile.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {profile.interests?.slice(0, 2).join(', ')}
              </p>
            </div>

            {!isOwnProfile && (
              <Button
                size="sm"
                variant={isFollowing ? 'outline' : 'default'}
                onClick={(e) => { e.preventDefault(); toggleFollow(); }}
                disabled={loading}
                className="shrink-0 text-xs h-7"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isFollowing ? (
                  'Following'
                ) : (
                  'Connect'
                )}
              </Button>
            )}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Link to={`/user/${profile.user_id}`}>
            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                {profile.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/user/${profile.user_id}`}>
                <h3 className="font-display font-semibold text-lg hover:text-primary transition-colors truncate">
                  {profile.name}
                </h3>
              </Link>
              
              {!isOwnProfile && (
                <Button
                  size="sm"
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={toggleFollow}
                  disabled={loading}
                  className={cn(
                    "shrink-0 gap-1.5",
                    isFollowing && "text-muted-foreground"
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </div>

            {profile.city && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {profile.city}
              </p>
            )}

            {profile.student_type && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile.student_type === 'Hosteler' ? '🏠' : '🏡'} {profile.student_type}
              </p>
            )}

            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <SkillBadge level={profile.skill_level} size="sm" />
              <LookingForBadge status={profile.looking_for} size="sm" />
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.interests.slice(0, 3).map(interest => (
                  <InterestTag key={interest} interest={interest} size="sm" />
                ))}
                {profile.interests.length > 3 && (
                  <span className="text-xs text-muted-foreground px-2 py-0.5">
                    +{profile.interests.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {showMessageButton && !isOwnProfile && (
          <div className="mt-4 pt-3 border-t flex justify-end">
            <Link to={`/messages/${profile.user_id}`}>
              <Button size="sm" variant="ghost" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Send a message
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
