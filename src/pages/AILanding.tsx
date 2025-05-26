
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Mic, Brain, Users, Book, Heart, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import SeniorDigitalLogo from '@/SeniorDigital.png';

const AILanding = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulaire soumis:', formData);
    // Ici on pourrait intégrer l'envoi d'email via Supabase
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
            <button onClick={() => scrollToSection('accueil')} className="text-gray-600 hover:text-tranches-sage transition-colors">
              Accueil
            </button>
            <button onClick={() => scrollToSection('pourquoi')} className="text-gray-600 hover:text-tranches-sage transition-colors">
              Pourquoi l'IA
            </button>
            <button onClick={() => scrollToSection('outils')} className="text-gray-600 hover:text-tranches-sage transition-colors">
              Nos Outils
            </button>
            <button onClick={() => scrollToSection('testimonial')} className="text-gray-600 hover:text-tranches-sage transition-colors">
              Témoignage
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
            🌟 L'intelligence artificielle peut transformer votre quotidien
          </h1>
          <p className="text-xl md:text-2xl text-tranches-warmgray mb-8 max-w-4xl mx-auto">
            Et si vous vous laissiez guider ?
          </p>
          
          <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
            <p className="text-lg text-tranches-charcoal mb-6">
              Vous avez plus de 70 ans, vous sentez parfois le monde aller trop vite… mais une petite voix vous dit qu'il n'est jamais trop tard pour apprendre.
            </p>
            <p className="text-lg text-tranches-sage font-medium mb-6">
              Bonne nouvelle : vous avez raison.
            </p>
            <p className="text-tranches-warmgray">
              Aujourd'hui, le digital et l'intelligence artificielle (IA) ne sont plus réservés aux ingénieurs ou aux jeunes générations. 
              Ils peuvent devenir vos meilleurs alliés, à condition d'avoir les bonnes clés pour les apprivoiser. 
              Chez Senior Digital Mentor, nous vous proposons une formation douce, humaine et adaptée à votre rythme, 
              pour apprendre à utiliser l'IA et les outils numériques… et en faire un pont vers vos souvenirs, votre famille, votre bien-être.
            </p>
          </div>

          <Button 
            size="lg" 
            className="bg-tranches-sage text-white hover:bg-tranches-sage/90"
            onClick={() => scrollToSection('pourquoi')}
          >
            Découvrez comment l'IA peut vous aider
          </Button>
        </div>
      </section>

      {/* Section Pourquoi l'IA */}
      <section id="pourquoi" className="section bg-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-8 text-center">
            🎯 Pourquoi apprendre à utiliser l'IA quand on est senior ?
          </h2>
          <p className="text-lg text-tranches-warmgray mb-12 text-center max-w-4xl mx-auto">
            Voici 5 problèmes quotidiens que rencontrent de nombreux seniors… et comment l'IA peut les alléger ou les transformer.
          </p>

          <div className="space-y-12">
            {/* Problème 1 */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <Mic className="h-12 w-12 text-tranches-sage flex-shrink-0 mt-2" />
                  <div>
                    <h3 className="text-2xl font-serif text-tranches-charcoal mb-4">
                      🗣️ 1. Vous avez des choses à dire… mais écrire vous fatigue ?
                    </h3>
                    <div className="bg-tranches-sage/10 p-4 rounded-lg mb-4">
                      <p className="text-tranches-sage font-medium">✅ Solution : la dictée vocale intelligente</p>
                    </div>
                    <p className="text-tranches-warmgray mb-4">
                      <strong>Exemple concret :</strong> Vous voulez raconter une anecdote de votre jeunesse ou écrire une lettre à votre petit-fils, 
                      mais vos doigts sont fatigués ? Grâce à des outils comme Google Assistant, Notion IA, ou ChatGPT avec un micro, 
                      vous pouvez parler à voix haute, et votre histoire s'écrit toute seule.
                    </p>
                    <p className="text-tranches-charcoal">
                      <strong>Avantage :</strong> Vous gagnez en autonomie, sans dépendre de vos enfants pour écrire un texte, 
                      et vous pouvez enfin transmettre ce que vous avez sur le cœur… sans douleur.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problème 2 */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <Brain className="h-12 w-12 text-tranches-sage flex-shrink-0 mt-2" />
                  <div>
                    <h3 className="text-2xl font-serif text-tranches-charcoal mb-4">
                      🧠 2. Vous avez peur d'oublier… ou vous voulez garder une trace ?
                    </h3>
                    <div className="bg-tranches-sage/10 p-4 rounded-lg mb-4">
                      <p className="text-tranches-sage font-medium">✅ Solution : un journal de bord intelligent</p>
                    </div>
                    <p className="text-tranches-warmgray mb-4">
                      <strong>Exemple concret :</strong> Chaque jour, vous pouvez noter comment vous vous sentez, ce que vous avez fait, 
                      ou ce que vous voulez retenir. L'IA vous propose même de faire le résumé de votre journée ou de retrouver une note 
                      que vous aviez écrite il y a deux mois !
                    </p>
                    <div className="space-y-2 text-tranches-charcoal">
                      <p><strong>Outils simples à utiliser :</strong></p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Day One Journal (avec reconnaissance vocale)</li>
                        <li>Senior Digital Mentor App – Journal Intime (interface simplifiée et francophone)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problème 3 */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <Users className="h-12 w-12 text-tranches-sage flex-shrink-0 mt-2" />
                  <div>
                    <h3 className="text-2xl font-serif text-tranches-charcoal mb-4">
                      👨‍👩‍👧‍👦 3. Vous vous sentez parfois isolé de votre famille ?
                    </h3>
                    <div className="bg-tranches-sage/10 p-4 rounded-lg mb-4">
                      <p className="text-tranches-sage font-medium">✅ Solution : créer du contenu émotionnel pour retisser du lien</p>
                    </div>
                    <p className="text-tranches-warmgray mb-4">
                      <strong>Exemple concret :</strong> En créant des publications avec vos anciennes photos, des souvenirs audio ou des vidéos racontées, 
                      vous devenez un passeur de mémoire. Vos enfants et petits-enfants pourront commenter, liker, et vous poser des questions. 
                      Vous êtes à nouveau au cœur de la famille.
                    </p>
                    <div className="space-y-2 text-tranches-charcoal">
                      <p><strong>Outils utilisés :</strong></p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Google PhotoScan (pour scanner de vieilles photos)</li>
                        <li>L'application Senior Digital Mentor, qui vous guide pas à pas pour créer un blog mémoire familial interactif</li>
                        <li>Canva IA (crée automatiquement des mises en page pour vos souvenirs)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problème 4 */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <Book className="h-12 w-12 text-tranches-sage flex-shrink-0 mt-2" />
                  <div>
                    <h3 className="text-2xl font-serif text-tranches-charcoal mb-4">
                      📚 4. Vous aimez apprendre, mais vous vous sentez dépassé par la technologie ?
                    </h3>
                    <div className="bg-tranches-sage/10 p-4 rounded-lg mb-4">
                      <p className="text-tranches-sage font-medium">✅ Solution : une formation pas à pas, adaptée à votre niveau</p>
                    </div>
                    <p className="text-tranches-warmgray mb-4">
                      Avec notre programme "Découvrir l'IA et le digital à mon rythme", vous bénéficiez :
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-tranches-charcoal">
                      <li>de séances collectives en petit groupe</li>
                      <li>de tutoriels simples en vidéo</li>
                      <li>d'un mentor attitré pour vous guider</li>
                      <li>et de modules ludiques pour apprendre à utiliser l'IA pour vous simplifier la vie, vous divertir, ou garder le contact</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problème 5 */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <Heart className="h-12 w-12 text-tranches-sage flex-shrink-0 mt-2" />
                  <div>
                    <h3 className="text-2xl font-serif text-tranches-charcoal mb-4">
                      💬 5. Vous avez encore tant à transmettre… mais ne savez pas comment le faire ?
                    </h3>
                    <div className="bg-tranches-sage/10 p-4 rounded-lg mb-4">
                      <p className="text-tranches-sage font-medium">✅ Solution : L'Histoire de Vie assistée par l'IA</p>
                    </div>
                    <p className="text-tranches-warmgray mb-4">
                      <strong>Exemple concret :</strong> Grâce à notre formulaire "Histoire de Vie", vous êtes guidé chapitre par chapitre 
                      pour raconter votre enfance, vos joies, vos épreuves, votre philosophie de vie. L'IA peut même vous suggérer des formulations 
                      ou structurer vos réponses.
                    </p>
                    <p className="text-tranches-charcoal">
                      <strong>Résultat :</strong> Une biographie familiale enrichie de vos mots, vos photos, votre voix. 
                      Un héritage numérique émouvant pour les générations futures.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section Outils */}
      <section id="outils" className="section bg-tranches-cream">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-8 text-center">
            🛠️ Nos outils sont faits pour VOUS
          </h2>
          <p className="text-lg text-tranches-warmgray mb-12 text-center">
            Voici quelques-uns des outils que nous vous apprendrons à maîtriser en toute simplicité :
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-tranches-sage/10">
                  <th className="p-4 text-left font-serif text-tranches-charcoal">Outil</th>
                  <th className="p-4 text-left font-serif text-tranches-charcoal">Ce qu'il permet</th>
                  <th className="p-4 text-left font-serif text-tranches-charcoal">Pourquoi c'est utile</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium text-tranches-charcoal">PhotoScan (Google)</td>
                  <td className="p-4 text-tranches-warmgray">Scanner vos vieilles photos papier</td>
                  <td className="p-4 text-tranches-warmgray">Revivre vos souvenirs et les partager</td>
                </tr>
                <tr className="border-b bg-gray-50">
                  <td className="p-4 font-medium text-tranches-charcoal">ChatGPT vocal</td>
                  <td className="p-4 text-tranches-warmgray">Poser des questions ou dicter vos textes</td>
                  <td className="p-4 text-tranches-warmgray">Ne plus avoir peur de l'écriture</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium text-tranches-charcoal">Day One Journal</td>
                  <td className="p-4 text-tranches-warmgray">Écrire ou dicter votre journal intime</td>
                  <td className="p-4 text-tranches-warmgray">Garder une trace, exprimer vos émotions</td>
                </tr>
                <tr className="border-b bg-gray-50">
                  <td className="p-4 font-medium text-tranches-charcoal">Canva</td>
                  <td className="p-4 text-tranches-warmgray">Créer des cartes, des souvenirs visuels</td>
                  <td className="p-4 text-tranches-warmgray">Créer du beau facilement</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-tranches-charcoal">Senior Digital Mentor App</td>
                  <td className="p-4 text-tranches-warmgray">Raconter votre vie, transmettre, être écouté</td>
                  <td className="p-4 text-tranches-warmgray">Une appli pensée pour les seniors, avec vous</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section Témoignage */}
      <section id="testimonial" className="section bg-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-12 text-center">
            💡 Vous aussi, vous pouvez vivre cette transformation
          </h2>
          
          <Card className="max-w-4xl mx-auto border-none shadow-lg">
            <CardContent className="p-8">
              <MessageCircle className="h-12 w-12 text-tranches-sage mb-6 mx-auto" />
              <blockquote className="text-xl text-tranches-charcoal italic text-center mb-6">
                "J'ai 79 ans. Je pensais que je ne pourrais jamais comprendre les nouvelles technologies. 
                Aujourd'hui, je parle à mon assistant vocal, je raconte ma vie, et mes petits-enfants m'envoient des messages en retour. 
                Je me sens connectée à eux."
              </blockquote>
              <p className="text-tranches-sage font-medium text-center">
                — Yvette, formée en 2024 chez Senior Digital Mentor
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section Bénéfices */}
      <section className="section bg-tranches-sage/5">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-8 text-center">
            🎁 En vous inscrivant à notre formation, vous allez :
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start space-x-3">
              <Check className="h-6 w-6 text-tranches-sage mt-1 flex-shrink-0" />
              <span className="text-tranches-charcoal">Apprendre à utiliser les outils numériques de base</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="h-6 w-6 text-tranches-sage mt-1 flex-shrink-0" />
              <span className="text-tranches-charcoal">Découvrir le pouvoir de l'IA pour s'exprimer et créer</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="h-6 w-6 text-tranches-sage mt-1 flex-shrink-0" />
              <span className="text-tranches-charcoal">Créer un patrimoine digital pour vos proches</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="h-6 w-6 text-tranches-sage mt-1 flex-shrink-0" />
              <span className="text-tranches-charcoal">Sortir de l'isolement numérique</span>
            </div>
            <div className="flex items-start space-x-3 md:col-span-2 justify-center">
              <Check className="h-6 w-6 text-tranches-sage mt-1 flex-shrink-0" />
              <span className="text-tranches-charcoal">Retrouver confiance en vos capacités d'apprentissage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Contact / CTA */}
      <section id="contact" className="section bg-tranches-charcoal text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-8">
            📩 Prêt(e) à vous lancer ? Il n'est jamais trop tard pour apprendre
          </h2>
          <p className="text-xl mb-8">
            Inscrivez-vous dès maintenant à notre programme de formation douce et humaine, 
            100% adaptée aux seniors, avec ou sans expérience digitale.
          </p>
          
          <div className="max-w-md mx-auto mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  placeholder="Votre nom"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="bg-white text-tranches-charcoal"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Votre email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="bg-white text-tranches-charcoal"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Votre message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  required
                  className="bg-white text-tranches-charcoal"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-tranches-sage text-white hover:bg-tranches-sage/90"
                size="lg"
              >
                👉 Je m'inscris à la prochaine session
              </Button>
            </form>
          </div>
          
          <div className="text-center">
            <p className="text-gray-300 flex items-center justify-center mb-4">
              <Phone className="h-4 w-4 mr-2" />
              Ou appelez-nous au 0 800 000 000 (appel gratuit) pour en parler avec un conseiller
            </p>
            <p className="text-gray-300 flex items-center justify-center">
              <Mail className="h-4 w-4 mr-2" />
              contact@senior-digital-mentor.fr
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src={SeniorDigitalLogo} alt="Senior Digital Mentor" width="110" className="mb-4 brightness-0 invert"/>
              <p className="text-gray-300 text-sm">
                Accompagner les seniors dans leur découverte du numérique et de l'IA
              </p>
            </div>
            
            <div>
              <h4 className="font-serif text-lg mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/blog-landing" className="hover:text-white transition-colors">Nos Activités</Link></li>
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
                  0 800 000 000
                </p>
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  contact@senior-digital-mentor.fr
                </p>
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Paris, France
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-300">
            <p>&copy; 2024 Senior Digital Mentor. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AILanding;
