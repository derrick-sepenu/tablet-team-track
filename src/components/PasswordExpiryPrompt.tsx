import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import ChangePasswordDialog from './ChangePasswordDialog';
import { getDaysUntilExpiry, isPasswordExpired } from '@/utils/passwordValidation';

const PasswordExpiryPrompt: React.FC = () => {
  const { profile } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    if (!profile?.last_password_change) return;

    const expired = isPasswordExpired(profile.last_password_change);
    const days = getDaysUntilExpiry(profile.last_password_change);
    
    setDaysRemaining(days);
    
    // Show alert if password is expired or will expire within 7 days
    if (expired || days <= 7) {
      setShowAlert(true);
    }
  }, [profile]);

  if (!showAlert || !profile) return null;

  const expired = isPasswordExpired(profile.last_password_change);

  return (
    <>
      <Alert variant={expired ? "destructive" : "default"} className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>
            {expired ? 'Password Expired' : 'Password Expiring Soon'}
          </span>
          <Button 
            variant={expired ? "destructive" : "outline"} 
            size="sm"
            onClick={() => setShowDialog(true)}
          >
            Change Password
          </Button>
        </AlertTitle>
        <AlertDescription>
          {expired ? (
            'Your password has expired. For security reasons, please change it now.'
          ) : (
            <>
              <Clock className="inline h-4 w-4 mr-1" />
              Your password will expire in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}. 
              Please change it soon to maintain security.
            </>
          )}
        </AlertDescription>
      </Alert>

      <ChangePasswordDialog 
        open={showDialog} 
        onClose={() => setShowDialog(false)} 
      />
    </>
  );
};

export default PasswordExpiryPrompt;
