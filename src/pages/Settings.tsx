import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/Navigation';
import { Shield, Key, Clock, AlertCircle } from 'lucide-react';
import { PASSWORD_EXPIRY_DAYS, PASSWORD_REQUIREMENTS } from '@/utils/passwordValidation';

const Settings = () => {
  const { profile } = useAuth();

  if (profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground">
                  Only super administrators can access system settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground">
              Manage security policies and system configurations
            </p>
          </div>

          {/* Password Policy */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <CardTitle>Password Policy</CardTitle>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              <CardDescription>
                Current password security requirements for all users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Password Requirements</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {PASSWORD_REQUIREMENTS.map((req, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Password Expiration</h4>
                    <p className="text-sm text-muted-foreground">
                      Users must change their password every{' '}
                      <span className="font-semibold text-foreground">{PASSWORD_EXPIRY_DAYS} days</span>{' '}
                      (approximately 3 months)
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Users will receive warnings starting 7 days before expiration
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">First Login Policy</h4>
                    <p className="text-sm text-muted-foreground">
                      New users created by administrators must change their temporary password on first login
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg mt-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Additional Security Settings
                </h4>
                <p className="text-sm text-muted-foreground">
                  For enhanced security, enable "Leaked Password Protection" in your Supabase dashboard under 
                  Authentication → Policies. This prevents users from using passwords found in data breaches.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle>User Management Settings</CardTitle>
              <CardDescription>
                Policies for user account management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">Email Verification</p>
                  <p className="text-sm text-muted-foreground">
                    New user signups require email confirmation
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">Role-Based Access</p>
                  <p className="text-sm text-muted-foreground">
                    Super Admins can manage all resources, Data Managers can only access assigned projects
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">Account Deactivation</p>
                  <p className="text-sm text-muted-foreground">
                    Inactive users are automatically blocked from accessing the system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
