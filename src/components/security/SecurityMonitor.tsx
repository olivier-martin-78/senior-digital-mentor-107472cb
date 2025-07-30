import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuthStateManager } from '@/hooks/useAuthStateManager';
import { rateLimiter } from '@/utils/securityUtils';

interface SecurityEvent {
  id: string;
  type: 'auth_error' | 'rate_limit' | 'suspicious_activity' | 'recovery_attempt';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

export const SecurityMonitor: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  const { authError, isRecovering, refreshSession, secureSignOut } = useAuthStateManager({
    onAuthError: (error) => {
      addSecurityEvent({
        type: 'auth_error',
        message: `Erreur d'authentification: ${error.message}`,
        severity: 'high'
      });
    },
    enableRecovery: true
  });

  const addSecurityEvent = (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const newEvent: SecurityEvent = {
      ...event,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, 9)]); // Keep last 10 events
    setIsVisible(true);
  };

  // Monitor rate limiting attempts
  useEffect(() => {
    const originalIsAllowed = rateLimiter.isAllowed.bind(rateLimiter);
    
    rateLimiter.isAllowed = (identifier: string) => {
      const allowed = originalIsAllowed(identifier);
      
      if (!allowed) {
        addSecurityEvent({
          type: 'rate_limit',
          message: `Limite de taux atteinte pour: ${identifier}`,
          severity: 'medium'
        });
      }
      
      return allowed;
    };
  }, []);

  // Monitor recovery attempts
  useEffect(() => {
    if (isRecovering) {
      addSecurityEvent({
        type: 'recovery_attempt',
        message: 'Tentative de récupération automatique en cours',
        severity: 'medium'
      });
    }
  }, [isRecovering]);

  // Auto-hide events after 10 seconds for low severity
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[0];
      if (latestEvent.severity === 'low') {
        const timer = setTimeout(() => {
          setEvents(prev => prev.filter(e => e.id !== latestEvent.id));
          if (events.length === 1) setIsVisible(false);
        }, 10000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [events]);

  const handleRecover = async () => {
    try {
      const session = await refreshSession();
      if (session) {
        addSecurityEvent({
          type: 'recovery_attempt',
          message: 'Récupération réussie',
          severity: 'low'
        });
      }
    } catch (error) {
      addSecurityEvent({
        type: 'auth_error',
        message: 'Échec de la récupération',
        severity: 'high'
      });
    }
  };

  const handleSecureLogout = async () => {
    await secureSignOut();
    addSecurityEvent({
      type: 'recovery_attempt',
      message: 'Déconnexion sécurisée effectuée',
      severity: 'low'
    });
  };

  if (!isVisible || events.length === 0) {
    return null;
  }

  const highSeverityEvents = events.filter(e => e.severity === 'high');
  
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-2">
      {highSeverityEvents.map(event => (
        <Alert key={event.id} variant="destructive" className="shadow-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">{event.message}</span>
            <div className="flex gap-2 ml-2">
              {event.type === 'auth_error' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRecover}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Récupérer
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleSecureLogout}
                    className="h-6 px-2 text-xs"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Déconnecter
                  </Button>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ))}
      
      {/* Show latest medium severity events */}
      {events.filter(e => e.severity === 'medium').slice(0, 2).map(event => (
        <Alert key={event.id} className="shadow-lg border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm text-orange-800">
            {event.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};