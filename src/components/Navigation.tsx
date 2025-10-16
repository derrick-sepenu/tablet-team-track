import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import PasswordExpiryPrompt from './PasswordExpiryPrompt';
import logo from "@/assets/logo.png";
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
      { href: "/data-managers", label: "Data Managers", icon: Users },
      { href: "/user-management", label: "User Management", icon: Settings },
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
    <>
      <PasswordExpiryPrompt />
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src={logo} alt="Logo" className="h-12 w-12 mr-3" />
              <span className="text-xl font-semibold text-foreground">Tablet Manager</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User info and actions */}
          <div className="flex items-center space-x-2 ml-8">
            {profile && (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-medium truncate max-w-[120px] leading-tight">{profile.full_name}</span>
              </div>
            )}
            
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex text-xs px-2">
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
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
                    <p className="text-sm font-medium">{profile.full_name}</p>
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
    </>
  );
};

export default Navigation;