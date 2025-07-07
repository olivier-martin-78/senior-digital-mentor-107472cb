
import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCaregiversData } from '@/hooks/useCaregiversData';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Bell, User, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CommunicationSpace = () => {
  const { clients, messages, isLoading, sendMessage } = useCaregiversData();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notificationStates, setNotificationStates] = useState<Record<string, boolean>>({});
  const [sendingNotifications, setSendingNotifications] = useState<Record<string, boolean>>({});
  
  const { unreadMessageIds } = useUnreadMessages(selectedClient);

  const handleSendMessage = async () => {
    if (!selectedClient || !newMessage.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un patient et saisir un message',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    const success = await sendMessage(selectedClient, newMessage.trim());
    
    if (success) {
      setNewMessage('');
      toast({
        title: 'Message envoyé',
        description: 'Votre message a été publié avec succès',
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
        variant: 'destructive',
      });
    }
    setIsSending(false);
  };

  const handleNotifyParticipants = async (messageId: string, clientId: string) => {
    setSendingNotifications(prev => ({ ...prev, [messageId]: true }));
    
    try {
      const { error } = await supabase.functions.invoke('send-caregiver-notification', {
        body: {
          client_id: clientId,
          message_id: messageId
        }
      });

      if (error) {
        throw error;
      }

      setNotificationStates(prev => ({ ...prev, [messageId]: true }));
      toast({
        title: 'Notifications envoyées',
        description: 'Les participants ont été notifiés du nouveau message',
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer les notifications',
        variant: 'destructive',
      });
    } finally {
      setSendingNotifications(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const filteredMessages = selectedClient 
    ? messages.filter(m => m.client_id === selectedClient)
    : messages;

  const selectedClientName = selectedClient 
    ? clients.find(c => c.id === selectedClient)?.first_name + ' ' + clients.find(c => c.id === selectedClient)?.last_name
    : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélection du patient et formulaire de message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Nouvel échange
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Sélectionner un patient
            </label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un patient..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Votre message
            </label>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tapez votre message ici..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSendMessage}
              disabled={!selectedClient || !newMessage.trim() || isSending}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Envoi...' : 'Publier le message'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages existants */}
      <Card>
        <CardHeader>
          <CardTitle>
            Messages de coordination
            {selectedClientName && (
              <Badge variant="outline" className="ml-2">
                {selectedClientName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Aucun message pour le moment</p>
              <p className="text-sm">Soyez le premier à démarrer la conversation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => {
                const isUnread = unreadMessageIds.includes(message.id);
                const isNotificationSent = notificationStates[message.id];
                const isSendingNotification = sendingNotifications[message.id];
                
                return (
                  <div 
                    key={message.id} 
                    className={`border rounded-lg p-4 ${
                      isUnread 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {message.author_profile?.display_name || message.author_profile?.email}
                        </span>
                        {isUnread && (
                          <Badge variant="destructive" className="text-xs">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(message.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{message.message}</p>
                    
                    <div className="flex justify-end">
                      {isNotificationSent ? (
                        <div className="flex items-center text-sm text-green-600">
                          <Check className="h-4 w-4 mr-2" />
                          Notification envoyée
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotifyParticipants(message.id, message.client_id)}
                          disabled={isSendingNotification}
                          className="flex items-center gap-2"
                        >
                          <Bell className="h-4 w-4" />
                          {isSendingNotification ? 'Envoi...' : 'Notifier les participants'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationSpace;
