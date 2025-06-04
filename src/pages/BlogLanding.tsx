
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Smartphone, Heart, Users, BookOpen, PenTool, MessageCircle, Star, Mail, Phone, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SeniorDigitalLogo from '@/SeniorDigital.png';

const BlogLanding = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
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
      // Préparer les données pour l'envoi
      const emailData = { 
        name: formData.name.trim(), 
        email: formData.email.trim(), 
        message: formData.message.trim()
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
          setFormData({
            name: '',
            email: '',
            message: ''
          });
          
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
          setFormData({
            name: '',
            email: '',
            message: ''
          });
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

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-30 border-b border-gray-100">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <Link to="/" className="flex items-center space-x-2">
            <img src={SeniorDigitalLogo} alt="Senior Digital Mentor" width="110"/>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-tranches-sage transition-colors">
              Accueil
            </Link>
            <button onClick={() => scrollToSection('activites')} className="text-gray-600 hover:text-tranches-sage transition-colors">
              Nos Activités
            </button>
            <button onClick={() => scrollToSection('testimonials')} className="text-gray-600 hover:text-tranches-sage transition-colors">
              Témoignages
            </button>
            <button onClick={() => scrollToSection('faq')} className="text-gray-600 hover:text-tranches-sage transition-colors">
              FAQ
            </button>
            <button onClick={() => scrollToSection('contact')} className="text-gray-600 hover:text-tranches-sage transition-colors">
              Contact
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="accueil" className="pt-16 section bg-gradient-to-br from-tranches-sage/10 to-white">
        <div className="container text-center">
          <h1 className="text-4xl md:text-6xl font-serif text-tranches-charcoal mb-6">
            🌿 Vivre mieux, plus sereinement à partir de 70 ans
          </h1>
          <p className="text-xl md:text-2xl text-tranches-warmgray mb-8 max-w-4xl mx-auto">
            Des activités sur-mesure pour le bien-être global des seniors et le soulagement des proches aidants.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="flex items-center justify-center space-x-2">
              <Check className="h-5 w-5 text-tranches-sage" />
              <span className="text-tranches-charcoal">Se former au digital & à l'IA</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Check className="h-5 w-5 text-tranches-sage" />
              <span className="text-tranches-charcoal">Utiliser des outils de communication</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Check className="h-5 w-5 text-tranches-sage" />
              <span className="text-tranches-charcoal">Intéragir avec son cercle amical et social</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Check className="h-5 w-5 text-tranches-sage" />
              <span className="text-tranches-charcoal">Créer des contenus digitaux à partager</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md inline-block mb-8">
            <h3 className="text-xl font-serif text-tranches-charcoal mb-2">📞 Un premier échange offert</h3>
            <p className="text-tranches-warmgray mb-4">
              📍 Interventions à domicile en Normandie - Cabourg et environs | 👥 Seniors & Proches aidants
            </p>
            <Button 
              size="lg" 
              className="bg-tranches-sage text-white hover:bg-tranches-sage/90"
              onClick={() => scrollToSection('activites')}
            >
              Je découvre le programme
            </Button>
          </div>
        </div>
      </section>

      {/* Section Mission */}
      <section className="section bg-tranches-cream">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-8">
            🌈 Notre mission
          </h2>
          <p className="text-lg text-tranches-warmgray mb-8 max-w-3xl mx-auto">
            Chez Senior Digital Mentor, nous croyons que chaque personne âgée mérite de vieillir entourée, stimulée et valorisée.
            Nos activités sont pensées pour apaiser l'esprit, bouger en douceur, donner du sens, créer du lien et transmettre ce qui compte.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-tranches-charcoal">
            <span className="flex items-center space-x-2">
              <span>🧓</span>
              <span>+70 ans</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>🤝</span>
              <span>Aidants & familles</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>🏠</span>
              <span>À domicile</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>❤️</span>
              <span>Sur-mesure & humain</span>
            </span>
          </div>
        </div>
      </section>

      {/* Section Activités */}
      <section id="activites" className="section bg-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-6 text-center">
            🧠 Nos Activités : Se former au numérique & transmettre son histoire
          </h2>
          <p className="text-lg text-tranches-warmgray mb-12 text-center max-w-4xl mx-auto">
            Une formation au digital douce, progressive et humaine — à son rythme, pour reprendre le pouvoir sur sa mémoire, ses liens, et ses récits.
            Nous mettons gratuitement à votre disposition l'application CaprIA développée spécialement pour les seniors
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-serif text-tranches-charcoal mb-6 flex items-center">
                <Smartphone className="h-6 w-6 mr-3 text-tranches-sage" />
                Se familiariser avec les outils numériques
              </h3>
              <p className="text-tranches-warmgray mb-6">
                Nos mentors formés proposent une initiation simple et personnalisée aux outils essentiels :
              </p>
              <ul className="space-y-3 text-tranches-charcoal">
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-tranches-sage mt-0.5" />
                  <span>Utiliser une tablette ou un smartphone</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-tranches-sage mt-0.5" />
                  <span>Apprendre à naviguer sur Internet</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-tranches-sage mt-0.5" />
                  <span>Utiliser la reconnaissance vocale pour écrire sans effort</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-tranches-sage mt-0.5" />
                  <span>Découvrir l'intelligence artificielle à travers des usages concrets</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-serif text-tranches-charcoal mb-6 flex items-center">
                <Heart className="h-6 w-6 mr-3 text-tranches-sage" />
                Transmettre un héritage numérique unique et intime (vos souvenirs, vos centres d'intérêt et compétences)
              </h3>
              <p className="text-tranches-warmgray mb-6">
                L'application CaprIA devient un véritable coffre à souvenirs interactif, enrichi au fil du temps :
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <BookOpen className="h-8 w-8 text-tranches-sage mb-4" />
                <h4 className="font-serif text-lg text-tranches-charcoal mb-3">Blog (Photos & Vidéos)'</h4>
                <p className="text-sm text-tranches-warmgray mb-3">
                  Créez des publications autour de vos albums photo anciens, en les accompagnant de récits, de vidéos ou de messages vocaux.
                </p>
                <p className="text-xs text-tranches-sage italic">
                  👉 Vos proches peuvent commenter, réagir et prolonger la mémoire familiale.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <Users className="h-8 w-8 text-tranches-sage mb-4" />
                <h4 className="font-serif text-lg text-tranches-charcoal mb-3">Histoire de vie</h4>
                <p className="text-sm text-tranches-warmgray mb-3">
                  Racontez votre parcours de vie, de l'enfance à aujourd'hui, soit par écrit, soit à l'oral.
                </p>
                <p className="text-xs text-tranches-sage italic">
                  👉 Une vraie biographie personnelle, structurée et accessible à toute la famille.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <PenTool className="h-8 w-8 text-tranches-sage mb-4" />
                <h4 className="font-serif text-lg text-tranches-charcoal mb-3">Journal</h4>
                <p className="text-sm text-tranches-warmgray mb-3">
                  Notez vos ressentis du jour, vos pensées positives ou négatives, vos activités et votre humeur.
                </p>
                <p className="text-xs text-tranches-sage italic">
                  👉 Une manière bienveillante de prendre soin de soi, de tisser du lien… et de garder une trace de l'ordinaire.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <Star className="h-8 w-8 text-tranches-sage mb-4" />
                <h4 className="font-serif text-lg text-tranches-charcoal mb-3">Carnet de Souhaits</h4>
                <p className="text-sm text-tranches-warmgray mb-3">
                  Exprimez une envie, un besoin ou un rêve — et laissez votre cercle familial vous proposer de le réaliser.
                </p>
                <p className="text-xs text-tranches-sage italic">
                  👉 "J'aimerais revoir un film de mon enfance", "Reprendre contact avec un ami perdu de vue"…
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-tranches-charcoal text-white hover:bg-tranches-warmgray"
              asChild
            >
              <Link to="/auth">Je veux découvrir l'application</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section id="testimonials" className="section bg-tranches-sage/5">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-12 text-center">
            💬 Témoignages Inspirants
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <MessageCircle className="h-8 w-8 text-tranches-sage mb-4" />
                <p className="text-tranches-charcoal italic mb-4">
                  "J'ai appris à me servir d'une tablette, et aujourd'hui je publie mes souvenirs de jeunesse pour mes petits-enfants. Ils m'écrivent des commentaires pleins d'amour."
                </p>
                <p className="text-tranches-sage font-medium">Madeleine, 82 ans</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <MessageCircle className="h-8 w-8 text-tranches-sage mb-4" />
                <p className="text-tranches-charcoal italic mb-4">
                  "Mon père a répondu à toutes les questions de l'Histoire de Vie. J'ai appris des choses incroyables sur lui. Je vais garder ce témoignage toute ma vie."
                </p>
                <p className="text-tranches-sage font-medium">Julien, 39 ans, petit-fils</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <MessageCircle className="h-8 w-8 text-tranches-sage mb-4" />
                <p className="text-tranches-charcoal italic mb-4">
                  "Ce qui me plaît, c'est que je peux raconter mes journées. Ça me fait du bien, et parfois, je relis mes anciens textes et je me rends compte que je vais mieux."
                </p>
                <p className="text-tranches-sage font-medium">René, 77 ans</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section id="faq" className="section bg-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-12 text-center">
            ❓ FAQ – Questions fréquentes
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  Les activités sont-elles accessibles à tous les niveaux ?
                </AccordionTrigger>
                <AccordionContent>
                  Oui ! Chaque atelier est conçu pour s'adapter au rythme, aux capacités physiques et cognitives de chaque personne. Aucune compétence préalable n'est requise.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  Proposez-vous des activités à domicile ?
                </AccordionTrigger>
                <AccordionContent>
                  Oui, nos activités sont organisée directement à domicile, en résidence seniors.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Et si mon parent est en perte d'autonomie ?
                </AccordionTrigger>
                <AccordionContent>
                  Nous adaptons nos propositions en douceur. Un entretien préalable permet d'identifier les besoins et d'évaluer ce qui est réaliste, motivant et bénéfique pour lui/elle.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  Combien cela coûte-t-il ?
                </AccordionTrigger>
                <AccordionContent>
                  Les tarifs varient selon la fréquence et la distance (individuel, à domicile ou en extérieur). Des forfaits mensuels d'au moins 2 heures consécutives sont proposés.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  Est-ce que les familles peuvent participer ?
                </AccordionTrigger>
                <AccordionContent>
                  Absolument ! Certaines activités sont même conçues pour renforcer les liens familiaux et intergénérationnels. Et nous favorisons une communication régulière avec les proches.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Section Contact */}
      <section id="contact" className="section bg-tranches-sage/10">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-8 text-center">
            📩 Parlons-en ensemble !
          </h2>
          <p className="text-lg text-tranches-warmgray text-center mb-12">
            Un premier entretien est gratuit et sans engagement.
          </p>
          
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  placeholder="Votre nom"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Votre email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Votre message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-tranches-sage text-white hover:bg-tranches-sage/90"
                size="lg"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Envoyer
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-tranches-warmgray flex items-center justify-center">
                <Mail className="h-4 w-4 mr-2" />
                contact@senior-digital-mentor.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-tranches-charcoal text-white py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src="/SeniorDigital.png" alt="Senior Digital Mentor" width="110" className="mb-4"/>
              <p className="text-gray-300 text-sm">
                Se former au digital à mon rythme
              </p>
            </div>
            
            <div>
              <h4 className="font-serif text-lg mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Nos Activités</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Qui sommes-nous</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Devenir partenaire</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-serif text-lg mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-serif text-lg mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  01 23 45 67 89
                </p>
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  contact@senior-digital-mentor.com
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-300">
            <p>&copy; 2025 Senior Digital Mentor. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogLanding;
