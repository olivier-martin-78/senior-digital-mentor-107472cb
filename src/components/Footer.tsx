
import React, { useState } from 'react';
import { Mail, Phone, User, Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
    
    try {
      // Upload attachment if provided
      let attachmentUrl = null;
      
      if (attachment) {
        try {
          const fileExt = attachment.name.split('.').pop();
          const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          
          // Vérifier d'abord si le bucket existe
          const { data: buckets, error: bucketError } = await supabase.storage
            .listBuckets();
            
          if (bucketError) {
            console.error('Erreur lors de la vérification des buckets:', bucketError);
            throw bucketError;
          }
          
          const contactAttachmentsBucketExists = buckets.some(b => b.name === 'contact-attachments');
          
          if (!contactAttachmentsBucketExists) {
            console.warn('Le bucket contact-attachments n\'existe pas, envoi sans pièce jointe.');
          } else {
            // Le bucket existe, on peut télécharger le fichier
            const { error: uploadError, data } = await supabase.storage
              .from('contact-attachments')
              .upload(filePath, attachment);
  
            if (uploadError) {
              throw uploadError;
            }
  
            const { data: { publicUrl } } = supabase.storage
              .from('contact-attachments')
              .getPublicUrl(filePath);
              
            attachmentUrl = publicUrl;
          }
        } catch (error) {
          console.error('Erreur lors du téléchargement de la pièce jointe:', error);
          // On continue sans pièce jointe plutôt que de bloquer l'envoi du message
          toast({
            title: "Pièce jointe ignorée",
            description: "Impossible d'envoyer la pièce jointe. Votre message sera envoyé sans pièce jointe.",
            variant: "default"
          });
        }
      }
      
      // Send email using edge function
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: { name, email, message, attachmentUrl }
      });
      
      if (error) throw error;
      
      console.log("Réponse de la fonction send-contact-email:", data);
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
      });
      
      // Reset form
      setName('');
      setEmail('');
      setMessage('');
      setAttachment(null);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de l'envoi du message: ${error.message || "Veuillez vérifier votre connexion et réessayer."}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          <p>© {new Date().getFullYear()} Senior Digital Menor. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
