import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Smartphone, Monitor, Wifi, WifiOff, Bell, BellOff } from 'lucide-react';

const PWAManager = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    try {
      // Verificar se já está instalado
      const checkInstalled = () => {
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
          setIsInstalled(true);
        }
      };

      // Listener para evento de instalação
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallPrompt(true);
      };

      // Listeners para status online/offline
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      // Verificar permissão de notificações
      const checkNotificationPermission = () => {
        if ('Notification' in window) {
          setNotificationsEnabled(Notification.permission === 'granted');
        }
      };

      // Registrar service worker
      const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registrado:', registration);
          } catch (error) {
            console.log('Erro ao registrar Service Worker:', error);
          }
        }
      };

      // Verificar se navigator está disponível
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
        checkInstalled();
        checkNotificationPermission();
        registerServiceWorker();

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        }
      };
    } catch (error) {
      console.error('Erro no PWAManager:', error);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');
      } catch (error) {
        console.error('Erro ao solicitar permissão de notificação:', error);
      }
    }
  };

  // Não renderizar nada se não houver recursos PWA disponíveis
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  return (
    <>
      {/* Status Bar - Apenas quando offline */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            Você está offline - Algumas funcionalidades podem estar limitadas
          </div>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="fixed bottom-4 right-4 z-40">
          <Card className="w-80 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5" />
                Instalar Lex Flow
              </CardTitle>
              <CardDescription>
                Instale o aplicativo para uma experiência melhor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Smartphone className="h-4 w-4" />
                <span>Funciona offline</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Bell className="h-4 w-4" />
                <span>Notificações push</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Monitor className="h-4 w-4" />
                <span>Acesso rápido</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  className="flex-1"
                  size="sm"
                >
                  Instalar
                </Button>
                <Button
                  onClick={() => setShowInstallPrompt(false)}
                  variant="outline"
                  size="sm"
                >
                  Agora não
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default PWAManager;

