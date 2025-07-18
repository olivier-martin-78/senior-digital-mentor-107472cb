import React, { useState } from 'react';
import { Mail, Phone, User, Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Footer = () => {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [thematiques, setThematiques] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const thematiquesOptions = [
    "Support à l'utilisation de CaprIA",
    "Programmer une démonstration gratuite", 
    "Bénéficier d'une formation gratuite"
  ];

  const handleThematiqueChange = (thematique: string, checked: boolean) => {
    if (checked) {
      setThematiques([...thematiques, thematique]);
    } else {
      setThematiques(thematiques.filter(t => t !== thematique));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !message.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('=== DÉBUT ENVOI FORMULAIRE ===');
    
    try {
      // Upload attachment if provided
      let attachmentUrl = null;
      
      if (attachment) {
        console.log('Upload de la pièce jointe...');
        try {
          const fileExt = attachment.name.split('.').pop();
          const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('contact-attachments')
            .upload(filePath, attachment);

          if (uploadError) {
            console.error('Erreur upload:', uploadError);
            toast({
              title: "Attention",
              description: "La pièce jointe n'a pas pu être envoyée, mais votre message sera tout de même transmis.",
              variant: "destructive"
            });
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('contact-attachments')
              .getPublicUrl(filePath);
              
            attachmentUrl = publicUrl;
            console.log('Pièce jointe uploadée:', attachmentUrl);
          }
        } catch (error) {
          console.error('Exception durant upload:', error);
        }
      }
      
      // Préparer les données pour l'envoi
      const emailData = { 
        firstName: firstName.trim(),
        lastName: lastName.trim(), 
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        thematiques: thematiques,
        attachmentUrl 
      };
      
      console.log('Envoi email avec données:', emailData);
      
      // Tentative 1: Via supabase.functions.invoke (méthode recommandée)
      console.log('=== TENTATIVE 1: supabase.functions.invoke ===');
      
      try {
        const { data, error } = await supabase.functions.invoke('send-contact-email', {
          body: emailData
        });
        
        console.log('Réponse invoke:', { data, error });
        
        if (!error && data?.success) {
          toast({
            title: "Message envoyé",
            description: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
          });
          
          // Reset form
          setFirstName('');
          setLastName('');
          setEmail('');
          setPhone('');
          setMessage('');
          setThematiques([]);
          setAttachment(null);
          
          // Reset file input
          const fileInput = document.getElementById('attachment') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
          
          return; // Succès, on sort de la fonction
        }
        
        // Si invoke échoue, on essaie avec fetch direct
        throw new Error(`Invoke failed: ${error?.message || 'Réponse invalide'}`);
        
      } catch (invokeError) {
        console.warn('Invoke échoué, tentative avec fetch direct:', invokeError);
        
        // Tentative 2: Appel direct avec fetch
        console.log('=== TENTATIVE 2: fetch direct ===');
        
        const functionUrl = `https://cvcebcisijjmmmwuedcv.supabase.co/functions/v1/send-contact-email`;
        console.log('URL fonction:', functionUrl);
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y2ViY2lzaWpqbW1td3VlZGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTE5MTEsImV4cCI6MjA2MjcyNzkxMX0.ajg0CHVdVC6QenC9CVDN_5vikA6-JoUxXeX3yz64AUE`,
          },
          body: JSON.stringify(emailData)
        });
        
        console.log('Réponse fetch - Status:', response.status);
        console.log('Réponse fetch - Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erreur fetch:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Résultat fetch:', result);
        
        if (result?.success) {
          toast({
            title: "Message envoyé",
            description: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
          });
          
          // Reset form
          setFirstName('');
          setLastName('');
          setEmail('');
          setPhone('');
          setMessage('');
          setThematiques([]);
          setAttachment(null);
          
          // Reset file input
          const fileInput = document.getElementById('attachment') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        } else {
          throw new Error(result?.error || 'Réponse inattendue de la fonction');
        }
      }
      
    } catch (error: any) {
      console.error('=== ERREUR COMPLÈTE ===', error);
      
      toast({
        title: "Erreur d'envoi",
        description: `Impossible d'envoyer le message: ${error.message}. Veuillez réessayer ou nous contacter directement par email.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('=== FIN TRAITEMENT ===');
    }
  };

  return (
    <footer className="py-12 bg-tranches-beige border-t border-tranches-sage/50">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-serif text-tranches-charcoal mb-2">Senior Digital Mentor</h3>
            <p className="text-tranches-warmgray">Des activités digitales qui me font du bien et me sentir moins seul(e).</p>
          </div>
          
          <div className="w-full md:w-1/2 lg:w-2/5">
            <h4 className="text-lg font-serif text-tranches-charcoal mb-3">Contactez-nous</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input 
                    id="firstName" 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    placeholder="Votre prénom"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input 
                    id="lastName" 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    placeholder="Votre nom"
                    required 
                  />
                </div>
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
                <Label htmlFor="phone">N° de téléphone</Label>
                <Input 
                  id="phone" 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Votre numéro de téléphone"
                />
              </div>
              
              <div>
                <Label>Thématique</Label>
                <div className="space-y-2 mt-2">
                  {thematiquesOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={thematiques.includes(option)}
                        onCheckedChange={(checked) => handleThematiqueChange(option, checked as boolean)}
                      />
                      <Label htmlFor={option} className="text-sm font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">Votre message</Label>
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
