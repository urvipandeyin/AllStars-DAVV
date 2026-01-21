import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Users, MessageCircle, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/groups', icon: Users, label: 'Groups' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <>
      {/* Mobile Top Header */}
      <nav className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-lg border-b border-border z-50">
        <div className="flex items-center justify-between h-full px-4">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>
    
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-24 bg-card/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link to="/">
            <Logo size="lg" />
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link key={path} to={path}>
                <Button
                  variant={location.pathname === path ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2',
                    location.pathname === path && 'bg-gradient-primary shadow-glow'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all',
                location.pathname === path
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', location.pathname === path && 'animate-scale-in')} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacers */}
      <div className="hidden md:block h-24" />
      <div className="md:hidden h-14" />
    </>
  );
}
