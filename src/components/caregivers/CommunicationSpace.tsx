
import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCaregiversData } from '@/hooks/useCaregiversData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Bell, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CommunicationSpace = () => {
  const { clients, messages, isLoading, sendMessage } = useCaregiversData();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

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
            
            <Button variant="outline" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifier les participants
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
              {filteredMessages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {message.profiles?.display_name || message.profiles?.email}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(message.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-gray-700">{message.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationSpace;
