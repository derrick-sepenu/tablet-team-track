import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { 
  Tablet, 
  Users, 
  FolderOpen, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogOut,
  Wrench
} from "lucide-react";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/tablets", label: "Tablets", icon: Tablet },
    { href: "/workers", label: "Field Workers", icon: Users },
    { href: "/projects", label: "Projects", icon: FolderOpen },
    ...(profile?.role === 'super_admin' ? [
      { href: "/repair-requests", label: "Repair Requests", icon: Wrench },
    ] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Tablet className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-semibold text-foreground">TabletManager</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User info and actions */}
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm font-medium">{profile.full_name}</span>
                <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'}>
                  {profile.role === 'super_admin' ? 'Super Admin' : 'Data Manager'}
                </Badge>
              </div>
            )}
            
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile user info and sign out */}
              <div className="pt-4 border-t border-border">
                {profile && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{profile.full_name}</p>
                      <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'} className="text-xs mt-1">
                        {profile.role === 'super_admin' ? 'Super Admin' : 'Data Manager'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;