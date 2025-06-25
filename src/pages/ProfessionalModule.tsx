
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Calendar, FileText, Euro, Users, BookOpen, Camera, Heart, Brain, Activity, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';

const ProfessionalModule = () => {
  const navigate = useNavigate();

  const activities = [
    {
      icon: "📝",
      name: "Journal intime",
      description: "Espace privé pour écrire et se libérer",
      benefit: "Favorise la clarté émotionnelle"
    },
    {
      icon: "📖",
      name: "Récit de vie",
      description: "48 questions guidées pour raconter son histoire",
      benefit: "Un héritage à transmettre"
    },
    {
      icon: "📸",
      name: "Albums photo",
      description: "Numérisation des anciens souvenirs",
      benefit: "Des récits vivants à partager"
    },
    {
      icon: "💭",
      name: "Souhaits",
      description: "Échanger ses envies avec ses proches",
      benefit: "Renforce les liens familiaux"
    },
    {
      icon: "🧠",
      name: "Jeux cognitifs",
      description: "Mémoires, mots croisés, Sudoku",
      benefit: "Stimulation douce et adaptée"
    },
    {
      icon: "🧘",
      name: "Gym douce",
      description: "Yoga, étirements, 10 min/jour",
      benefit: "Bien-être physique et moral"
    }
  ];

  const testimonials = [
    {
      title: "Le jour où j'ai failli tout lâcher…",
      text: "Je venais d'enchaîner une semaine difficile. Une collègue m'a parlé de CaprIA. J'ai essayé… et j'ai retrouvé du plaisir. J'ai même commencé à écrire dans le journal intime. Aujourd'hui, je me sens mieux accompagnée pour accompagner les autres.",
      cta: "Essayez CaprIA gratuitement pendant 65 jours. Ça change tout.",
      color: "from-purple-100 to-purple-50"
    },
    {
      title: "Je suis plus qu'une aide à domicile",
      text: "Avant CaprIA, j'étais celle qui 'vient le matin'. Maintenant, je suis celle qui fait sourire, celle qui relie les générations, celle qu'on remercie. Grâce à CaprIA, je propose plus que des services : je crée du lien.",
      cta: "Vous méritez vous aussi d'être reconnu(e).",
      color: "from-blue-100 to-blue-50"
    },
    {
      title: "Quand Robert a recommencé à marcher",
      text: "10 minutes de gym douce, une fois, et quelque chose s'est réveillé. Trois semaines plus tard, Robert marchait chaque jour. CaprIA a été le déclencheur. Moi, je suis fière de lui – et de moi.",
      cta: "CaprIA, c'est du mouvement, pour les corps et les cœurs.",
      color: "from-green-100 to-green-50"
    },
    {
      title: "Et moi, dans tout ça ?",
      text: "CaprIA, c'est aussi un espace pour moi. Quelques minutes pour souffler, écrire, respirer. J'ai découvert que pour mieux prendre soin, il faut aussi prendre soin de soi.",
      cta: "Testez gratuitement pendant 65 jours. Parce que vous aussi, vous comptez.",
      color: "from-pink-100 to-pink-50"
    }
  ];

  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup-section');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTestCaprIA = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-tranches-dustyblue to-tranches-sage text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif mb-6 leading-tight">
            ✨ CaprIA – L'application qui change la vie… et le métier
          </h1>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl lg:text-3xl mb-8">
              💼 Vous accompagnez des personnes âgées à domicile ?
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90 px-2">
              Et si une application pouvait alléger votre quotidien, vous redonner du souffle, et renforcer les liens avec les familles ?
            </p>
            <p className="text-base md:text-lg mb-8 px-2">
              Bienvenue dans l'univers de CaprIA, un outil digital conçu par et pour les professionnels du grand âge.
            </p>
          </div>
        </div>
      </section>

      {/* Professional Tool Section */}
      <section className="py-12 md:py-20 bg-tranches-beige/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-serif text-tranches-charcoal mb-6 px-2">
              ✅ Un outil professionnel complet, pensé pour VOUS
            </h2>
            <p className="text-lg md:text-xl text-tranches-charcoal/80 mb-6 md:mb-8 px-2">
              CaprIA est bien plus qu'une appli :
            </p>
            <p className="text-base md:text-lg text-tranches-charcoal/70 px-2">
              C'est un compagnon de route qui vous aide à mieux organiser vos journées et à enrichir vos interventions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
            <Card className="text-center border-none shadow-lg">
              <CardContent className="p-4 md:p-6">
                <Calendar className="w-10 h-10 md:w-12 md:h-12 text-tranches-dustyblue mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-serif text-tranches-charcoal mb-2">
                  Planification des rendez-vous
                </h3>
                <p className="text-tranches-charcoal/70 text-sm">
                  en toute simplicité
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="p-4 md:p-6">
                <FileText className="w-10 h-10 md:w-12 md:h-12 text-tranches-dustyblue mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-serif text-tranches-charcoal mb-2">
                  Comptes-rendus clairs
                </h3>
                <p className="text-tranches-charcoal/70 text-sm">
                  à remplir après chaque visite
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="p-4 md:p-6">
                <Euro className="w-10 h-10 md:w-12 md:h-12 text-tranches-dustyblue mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-serif text-tranches-charcoal mb-2">
                  Aide à la facturation
                </h3>
                <p className="text-tranches-charcoal/70 text-sm">
                  mensuelle
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="p-4 md:p-6">
                <Users className="w-10 h-10 md:w-12 md:h-12 text-tranches-dustyblue mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-serif text-tranches-charcoal mb-2">
                  Espace de coordination
                </h3>
                <p className="text-tranches-charcoal/70 text-sm">
                  avec les proches du senior
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Offer Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-yellow-400 to-orange-300">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl md:text-3xl font-serif text-tranches-charcoal mb-4 md:mb-6 px-2 leading-tight">
              🎁 Offre de lancement : Devenez ambassadeur CaprIA et profitez de l'application gratuitement à vie. Offre réservée aux 50 premiers ambassadeurs.
            </h2>
            <p className="text-base md:text-lg text-tranches-charcoal px-2">
              💳 Abonnement : 6,90 €/mois au-delà de l'offre de lancement - Annulation possible à tout moment
            </p>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-serif text-center text-tranches-charcoal mb-6 px-2">
            🌸 Enrichissez les visites avec des activités numériques engageantes
          </h2>
          <p className="text-lg md:text-xl text-center text-tranches-charcoal/80 mb-8 md:mb-12 max-w-4xl mx-auto px-2">
            Avec CaprIA, vous pouvez désormais proposer des activités variées et adaptées aux seniors que vous accompagnez :
          </p>

          <div className="max-w-6xl mx-auto">
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-full">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-tranches-sage/20">
                      <th className="border border-tranches-sage/30 p-3 md:p-4 text-left font-serif text-tranches-charcoal text-sm md:text-base">Activité</th>
                      <th className="border border-tranches-sage/30 p-3 md:p-4 text-left font-serif text-tranches-charcoal text-sm md:text-base">Description</th>
                      <th className="border border-tranches-sage/30 p-3 md:p-4 text-left font-serif text-tranches-charcoal text-sm md:text-base">Bénéfice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity, index) => (
                      <tr key={index} className="hover:bg-tranches-beige/20">
                        <td className="border border-tranches-sage/30 p-3 md:p-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <span className="text-xl md:text-2xl flex-shrink-0">{activity.icon}</span>
                            <span className="font-medium text-tranches-charcoal text-sm md:text-base">{activity.name}</span>
                          </div>
                        </td>
                        <td className="border border-tranches-sage/30 p-3 md:p-4 text-tranches-charcoal/80 text-sm md:text-base">
                          {activity.description}
                        </td>
                        <td className="border border-tranches-sage/30 p-3 md:p-4 text-tranches-charcoal/80 text-sm md:text-base">
                          {activity.benefit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-20 bg-tranches-beige/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-serif text-center text-tranches-charcoal mb-12 md:mb-16 px-2">
            💬 Elles l'ont testé. Elles racontent…
          </h2>

          <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className={`border-none shadow-lg bg-gradient-to-r ${testimonial.color}`}>
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-4 h-4 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-2xl font-serif text-tranches-charcoal mb-4 break-words">
                        "{testimonial.title}"
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-base md:text-lg text-tranches-charcoal/80 mb-6 italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-2xl flex-shrink-0">💡</span>
                    <p className="font-medium text-tranches-charcoal text-sm md:text-base">
                      {testimonial.cta}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="signup-section" className="py-12 md:py-20 bg-gradient-to-r from-tranches-dustyblue to-tranches-sage text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-serif mb-6 md:mb-8 px-2">
              📲 Rejoignez la communauté CaprIA
            </h2>
            
            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-base md:text-lg px-2">
              <p>👉 Vous êtes professionnel(le) de l'accompagnement à domicile ?</p>
              <p>👉 Vous souhaitez tester un outil utile, bienveillant et innovant ?</p>
              <p>👉 Vous voulez offrir plus de sens, plus de lien, plus de mieux-être à vos bénéficiaires et à vous-même ?</p>
            </div>

            <p className="text-lg md:text-xl mb-6 md:mb-8 px-2">Ne ratez pas cette opportunité !</p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-6 md:mb-8 max-w-md mx-auto">
              <p className="text-base md:text-lg mb-2">💖 CaprIA est gratuit pendant 65 jours</p>
              <p className="text-sm opacity-90">⚠️ Seulement 50 accès ambassadeurs gratuits à vie</p>
            </div>

            <Button 
              size="lg" 
              className="bg-white text-tranches-charcoal hover:bg-gray-100 text-lg md:text-xl px-8 md:px-12 py-4 md:py-6 mb-8 md:mb-12 w-full sm:w-auto"
              onClick={handleTestCaprIA}
            >
              🚀 Je teste CaprIA gratuitement
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 md:ml-3" />
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-xs md:text-sm opacity-90">
              <div className="flex items-center justify-center gap-2 p-2">
                <span>📱</span>
                <span className="text-center">Fonctionne sur smartphone, tablette ou ordinateur</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2">
                <span>💡</span>
                <span className="text-center">Formation gratuite incluse</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2">
                <span>🤝</span>
                <span className="text-center">Accompagnement humain</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2">
                <span>⚡</span>
                <span className="text-center">Simple à utiliser</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProfessionalModule;
