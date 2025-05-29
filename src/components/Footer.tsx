
import React, { useState } from 'react';
import { Mail, Phone, User, Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Constantes de configuration Supabase
const SUPABASE_URL = "https://cvcebcisijjmmmwuedcv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y2ViY2lzaWpqbW1td3VlZGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTE5MTEsImV4cCI6MjA2MjcyNzkxMX0.ajg0CHVdVC6QenC9CVDN_5vikA6-JoUxXeX3yz64AUE";

const Footer = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('=== DÉBUT DIAGNOSTIC ENVOI FORMULAIRE ===');
    console.log('Configuration Supabase URL:', SUPABASE_URL);
    console.log('Configuration Supabase Key (début):', SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    console.log('Données du formulaire:', { 
      name, 
      email, 
      messageLength: message.length, 
      hasAttachment: !!attachment 
    });
    
    try {
      // Test de connectivité basique
      console.log('=== TEST DE CONNECTIVITÉ SUPABASE ===');
      try {
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        console.log('Test connectivité Supabase:', { success: !testError, error: testError?.message });
      } catch (testErr) {
        console.error('Erreur test connectivité:', testErr);
      }

      // Upload attachment if provided
      let attachmentUrl = null;
      
      if (attachment) {
        console.log('=== DÉBUT UPLOAD PIÈCE JOINTE ===');
        console.log('Fichier à uploader:', {
          name: attachment.name,
          size: attachment.size,
          type: attachment.type
        });
        
        try {
          const fileExt = attachment.name.split('.').pop();
          const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          
          console.log('Tentative upload vers:', filePath);
          const { error: uploadError, data } = await supabase.storage
            .from('contact-attachments')
            .upload(filePath, attachment);

          if (uploadError) {
            console.error('Erreur upload détaillée:', {
              message: uploadError.message,
              details: uploadError
            });
            toast({
              title: "Attention",
              description: "La pièce jointe n'a pas pu être envoyée, mais votre message sera tout de même transmis.",
              variant: "destructive"
            });
          } else {
            console.log('Upload réussi:', data);
            const { data: { publicUrl } } = supabase.storage
              .from('contact-attachments')
              .getPublicUrl(filePath);
              
            attachmentUrl = publicUrl;
            console.log('URL publique générée:', attachmentUrl);
          }
        } catch (error) {
          console.error('Exception durant upload:', error);
          toast({
            title: "Attention",
            description: "La pièce jointe n'a pas pu être envoyée, mais votre message sera tout de même transmis.",
            variant: "destructive"
          });
        }
      }
      
      // Préparer les données pour la fonction edge
      const emailData = { name, email, message, attachmentUrl };
      console.log('=== APPEL FONCTION EDGE ===');
      console.log('URL fonction complète:', `${SUPABASE_URL}/functions/v1/send-contact-email`);
      console.log('Données envoyées:', emailData);
      console.log('Headers qui seront utilisés:', {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY?.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });
      
      // Test direct avec fetch pour diagnostic
      console.log('=== TEST DIRECT AVEC FETCH ===');
      try {
        const directResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-contact-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        });
        
        console.log('Réponse fetch directe:', {
          status: directResponse.status,
          statusText: directResponse.statusText,
          ok: directResponse.ok
        });
        
        if (!directResponse.ok) {
          const errorText = await directResponse.text();
          console.error('Contenu de l\'erreur fetch:', errorText);
        }
      } catch (fetchError) {
        console.error('Erreur fetch directe:', fetchError);
      }
      
      // Appel via le client Supabase
      console.log('=== APPEL VIA CLIENT SUPABASE ===');
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: emailData
      });
      
      console.log('Réponse brute de la fonction:', { data, error });
      
      if (error) {
        console.error('=== ERREUR FONCTION EDGE DÉTAILLÉE ===');
        console.error('Type d\'erreur:', error.constructor?.name);
        console.error('Message d\'erreur:', error.message);
        console.error('Objet erreur complet:', JSON.stringify(error, null, 2));
        
        // Essayer de déterminer le type d'erreur
        if (error.message?.includes('Failed to send a request')) {
          console.error('DIAGNOSTIC: Problème de connectivité réseau vers la fonction');
        } else if (error.message?.includes('timeout')) {
          console.error('DIAGNOSTIC: Timeout de la requête');
        } else if (error.message?.includes('CORS')) {
          console.error('DIAGNOSTIC: Problème CORS');
        }
        
        throw new Error(`Erreur d'envoi: ${error.message}`);
      }
      
      console.log('✓ Réponse fonction reçue:', data);
      
      if (data?.success) {
        console.log('✓ Email envoyé avec succès');
        toast({
          title: "Message envoyé",
          description: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
        });
        
        // Reset form
        setName('');
        setEmail('');
        setMessage('');
        setAttachment(null);
        
        // Reset file input
        const fileInput = document.getElementById('attachment') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        console.error('Fonction exécutée mais échec:', data);
        throw new Error(data?.error || 'Erreur inconnue dans la réponse');
      }
      
    } catch (error: any) {
      console.error('=== ERREUR COMPLÈTE ENVOI ===');
      console.error('Type d\'erreur:', error.constructor?.name);
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
      console.error('Objet erreur complet:', error);
      
      // Message d'erreur plus informatif
      let errorMessage = error.message;
      if (error.message?.includes('Failed to send a request to the Edge Function')) {
        errorMessage = 'Impossible de contacter le serveur d\'envoi d\'emails. Vérifiez votre connexion internet et réessayez.';
      }
      
      toast({
        title: "Erreur d'envoi",
        description: `Une erreur est survenue: ${errorMessage}. Veuillez réessayer ou nous contacter directement par email à contact@senior-digital-mentor.com.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('=== FIN DIAGNOSTIC ENVOI FORMULAIRE ===');
    }
  };

  return (
    <footer className="py-12 bg-tranches-beige border-t border-tranches-sage/50">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-serif text-tranches-charcoal mb-2">Senior Digital Mentor</h3>
            <p className="text-tranches-warmgray">Le digital à mon rythme</p>
          </div>
          
          <div className="w-full md:w-1/2 lg:w-2/5">
            <h4 className="text-lg font-serif text-tranches-charcoal mb-3">Contactez-nous</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom et prénom</Label>
                <Input 
                  id="name" 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Votre nom et prénom"
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Votre adresse email"
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="message">Demande</Label>
                <Textarea 
                  id="message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Votre message"
                  rows={4}
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="attachment">Fichier joint (optionnel)</Label>
                <div className="flex items-center mt-1">
                  <Input
                    id="attachment"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAttachment(file);
                    }}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('attachment')?.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {attachment ? attachment.name : 'Choisir un fichier'}
                  </Button>
                  {attachment && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setAttachment(null)}
                      className="ml-2"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full md:w-auto bg-tranches-sage hover:bg-tranches-sage/90"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Envoyer
              </Button>
            </form>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-tranches-sage/30 text-center text-sm text-tranches-warmgray">
          <p>© {new Date().getFullYear()} Senior Digital Mentor. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
