import { Link } from 'react-router-dom';
import { Users, Lock, Unlock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InterestTag } from '@/components/ui/InterestTag';
import { getInterestColor } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    interest: string;
    sub_interest?: string | null;
    is_open: boolean;
    member_count: number;
    creator_id: string;
  };
  isMember?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}

export function GroupCard({ group, isMember, onJoin, onLeave }: GroupCardProps) {
  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link to={`/groups/${group.id}`}>
                <h3 className="font-display font-semibold text-lg hover:text-primary transition-colors truncate">
                  {group.name}
                </h3>
              </Link>
              {group.is_open ? (
                <Unlock className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>

            {group.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {group.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <InterestTag interest={group.interest} size="sm" />
              {group.sub_interest && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium border",
                  getInterestColor(group.interest)
                )}>
                  {group.sub_interest}
                </span>
              )}
            </div>

            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
            </span>
          </div>

          <div className="shrink-0">
            {isMember ? (
              <Button variant="outline" size="sm" onClick={onLeave}>
                Leave
              </Button>
            ) : (
              <Button size="sm" onClick={onJoin}>
                {group.is_open ? 'Join' : 'Request to Join'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
