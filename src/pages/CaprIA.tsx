import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Brain, 
  Activity, 
  Users, 
  BookOpen, 
  Camera, 
  MessageCircle, 
  Calendar,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Mail
} from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';

const CaprIA = () => {
  const features = [
    {
      icon: <Heart className="w-8 h-8 text-red-400" />,
      title: "Bien-être émotionnel",
      description: "Relaxation guidée, journal intime, récits de vie pour apaiser l'esprit",
      benefits: ["Réduit stress et anxiété", "Favorise l'introspection", "Préserve vos souvenirs"]
    },
    {
      icon: <Brain className="w-8 h-8 text-purple-400" />,
      title: "Stimulation mentale",
      description: "Jeux de mémoire, casse-têtes, activités cognitives adaptées",
      benefits: ["Améliore la mémoire", "Renforce la concentration", "Maintient l'autonomie"]
    },
    {
      icon: <Activity className="w-8 h-8 text-green-400" />,
      title: "Activités physiques",
      description: "Gym douce, yoga, exercices adaptés depuis chez vous",
      benefits: ["Améliore la circulation", "Réduit les chutes", "Libère les endorphines"]
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "Lien social",
      description: "Blog, albums photo, souhaits partagés avec vos proches",
      benefits: ["Rompt l'isolement", "Renforce les liens familiaux", "Crée du partage"]
    }
  ];

  const testimonials = [
    {
      name: "Marie, 74 ans",
      text: "Grâce à CaprIA, je partage mes souvenirs avec mes petits-enfants. Ils adorent découvrir mes histoires !",
      rating: 5
    },
    {
      name: "Robert, 82 ans", 
      text: "Les exercices de gym douce m'ont redonné confiance. Je me sens plus énergique qu'avant.",
      rating: 5
    },
    {
      name: "Suzanne, 78 ans",
      text: "Mon journal intime numérique est devenu mon confident. C'est libérateur de pouvoir exprimer mes émotions.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section ajoutée */}
      <HeroSection />
      
      {/* Problème/Solution */}
      <section className="py-16 bg-tranches-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-8">
              Vous ressentez parfois...
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 bg-gray-100 rounded-lg">
                <p className="text-tranches-charcoal font-medium">😔 De la solitude</p>
              </div>
              <div className="p-6 bg-gray-100 rounded-lg">
                <p className="text-tranches-charcoal font-medium">🧠 Une baisse de motivation</p>
              </div>
              <div className="p-6 bg-gray-100 rounded-lg">
                <p className="text-tranches-charcoal font-medium">💭 L'envie de partager vos souvenirs</p>
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-serif text-tranches-dustyblue mb-6">
              CaprIA transforme votre quotidien !
            </h3>
            <p className="text-lg text-tranches-charcoal/80">
              Une application simple et bienveillante qui vous redonne goût à la vie, 
              stimule votre esprit et vous reconnecte avec vos proches.
            </p>
          </div>
        </div>
      </section>

      {/* Fonctionnalités principales */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-tranches-charcoal mb-6">
              4 piliers pour votre bien-être
            </h2>
            <p className="text-xl text-tranches-charcoal/70 max-w-2xl mx-auto">
              Des activités pensées par des professionnels pour votre épanouissement personnel
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-none">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {feature.icon}
                    <h3 className="text-2xl font-serif text-tranches-charcoal ml-3">{feature.title}</h3>
                  </div>
                  <p className="text-tranches-charcoal/80 mb-6 text-lg">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center text-tranches-charcoal/70">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Activités détaillées */}
      <section className="py-20 bg-tranches-beige">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif text-center text-tranches-charcoal mb-16">
            Découvrez toutes les activités CaprIA
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <BookOpen className="w-8 h-8 text-tranches-dustyblue mb-4" />
              <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Journal intime</h3>
              <p className="text-tranches-charcoal/70 mb-4">Exprimez vos pensées en toute confidentialité. Gardez une trace de vos émotions et souvenirs précieux.</p>
              <p className="text-sm text-tranches-dustyblue font-medium">🎯 Favorise la clarté émotionnelle</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <MessageCircle className="w-8 h-8 text-tranches-dustyblue mb-4" />
              <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Récit de vie</h3>
              <p className="text-tranches-charcoal/70 mb-4">Racontez votre histoire en 48 questions guidées. Créez un héritage pour vos proches.</p>
              <p className="text-sm text-tranches-dustyblue font-medium">📖 Imprimable ou publiable</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Camera className="w-8 h-8 text-tranches-dustyblue mb-4" />
              <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Albums photo</h3>
              <p className="text-tranches-charcoal/70 mb-4">Transformez vos anciens albums en récits numériques vivants à partager avec vos proches.</p>
              <p className="text-sm text-tranches-dustyblue font-medium">📱 Numérisation simplifiée</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Star className="w-8 h-8 text-tranches-dustyblue mb-4" />
              <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Souhaits</h3>
              <p className="text-tranches-charcoal/70 mb-4">Partagez vos envies et projets avec vos proches. Laissez-les vous aider à les réaliser.</p>
              <p className="text-sm text-tranches-dustyblue font-medium">💝 Renforce les liens familiaux</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Brain className="w-8 h-8 text-tranches-dustyblue mb-4" />
              <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Jeux cognitifs</h3>
              <p className="text-tranches-charcoal/70 mb-4">Mots croisés, Sudoku, jeux de mémoire adaptés à votre rythme pour stimuler votre esprit.</p>
              <p className="text-sm text-tranches-dustyblue font-medium">🧩 Progression personnalisée</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Activity className="w-8 h-8 text-tranches-dustyblue mb-4" />
              <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Gym douce</h3>
              <p className="text-tranches-charcoal/70 mb-4">Exercices physiques adaptés, yoga doux, 10 minutes par jour depuis chez vous.</p>
              <p className="text-sm text-tranches-dustyblue font-medium">🏠 Depuis votre salon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif text-center text-tranches-charcoal mb-16">
            Ils ont retrouvé le sourire avec CaprIA
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-tranches-charcoal/80 italic mb-4">"{testimonial.text}"</p>
                  <p className="text-tranches-dustyblue font-medium">- {testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Module professionnel */}
      <section className="py-16 bg-tranches-sage/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Calendar className="w-16 h-16 text-tranches-dustyblue mx-auto mb-6" />
            <h2 className="text-3xl font-serif text-tranches-charcoal mb-6">
              Pour les professionnels : Module auxiliaires de vie
            </h2>
            <p className="text-lg text-tranches-charcoal/80 mb-8">
              Un outil de coordination professionnel intégré : planification, comptes-rendus, 
              facturation. Simplifiez la communication avec les familles.
            </p>
            <Button variant="outline" className="border-tranches-dustyblue text-tranches-charcoal">
              En savoir plus sur le module pro
            </Button>
          </div>
        </div>
      </section>

      {/* Call to action final */}
      <section className="py-20 bg-gradient-to-r from-tranches-dustyblue to-tranches-sage text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">
              Commencez votre nouvelle vie dès aujourd'hui
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez les milliers de seniors qui ont déjà transformé leur quotidien avec CaprIA.
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-serif mb-4">🎁 Offre de lancement</h3>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
                <span className="text-3xl font-bold">9,90€/mois</span>
                <span className="text-lg opacity-75 line-through">3,30€/mois</span>
                <span className="bg-yellow-400 text-tranches-charcoal px-3 py-1 rounded-full text-sm font-medium">
                  -33% pendant 6 mois
                </span>
              </div>
              <p className="text-sm opacity-75">Puis 9,90€/mois • Résiliable à tout moment</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-tranches-dustyblue hover:bg-gray-100 text-lg px-8 py-4" asChild>
                <Link to="/auth">
                  Essayer 7 jours gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                Programmer une démonstration
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-8 text-sm opacity-75">
              <span>✓ Sans engagement</span>
              <span>✓ Support 7j/7</span>
              <span>✓ Données sécurisées</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer ajouté depuis blog-landing */}
      <Footer />    
    </div>
  );
};

export default CaprIA;
