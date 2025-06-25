
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Calendar, FileText, Euro, Users, BookOpen, Camera, Heart, Brain, Activity, Star } from 'lucide-react';

const ProfessionalModule = () => {
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
      audience: "auxiliaire de vie en perte de motivation",
      text: "Je venais d'enchaîner une semaine difficile. Une collègue m'a parlé de CaprIA. J'ai essayé… et j'ai retrouvé du plaisir. J'ai même commencé à écrire dans le journal intime. Aujourd'hui, je me sens mieux accompagnée pour accompagner les autres.",
      cta: "Essayez CaprIA gratuitement pendant 65 jours. Ça change tout.",
      color: "from-purple-100 to-purple-50"
    },
    {
      title: "Je suis plus qu'une aide à domicile",
      audience: "professionnel en quête de reconnaissance",
      text: "Avant CaprIA, j'étais celle qui 'vient le matin'. Maintenant, je suis celle qui fait sourire, celle qui relie les générations, celle qu'on remercie. Grâce à CaprIA, je propose plus que des services : je crée du lien.",
      cta: "Vous méritez vous aussi d'être reconnu(e).",
      color: "from-blue-100 to-blue-50"
    },
    {
      title: "Quand Robert a recommencé à marcher",
      audience: "professionnel orienté bien-être physique",
      text: "10 minutes de gym douce, une fois, et quelque chose s'est réveillé. Trois semaines plus tard, Robert marchait chaque jour. CaprIA a été le déclencheur. Moi, je suis fière de lui – et de moi.",
      cta: "CaprIA, c'est du mouvement, pour les corps et les cœurs.",
      color: "from-green-100 to-green-50"
    },
    {
      title: "Et moi, dans tout ça ?",
      audience: "aide à domicile en quête de sens personnel",
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-tranches-dustyblue to-tranches-sage text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-serif mb-6">
            ✨ CaprIA – L'application qui change la vie… et le métier
          </h1>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl mb-8">
              💼 Vous accompagnez des personnes âgées à domicile ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Et si une application pouvait alléger votre quotidien, vous redonner du souffle, et renforcer les liens avec les familles ?
            </p>
            <p className="text-lg mb-8">
              Bienvenue dans l'univers de CaprIA, un outil digital conçu par et pour les professionnels du grand âge.
            </p>
          </div>
        </div>
      </section>

      {/* Professional Tool Section */}
      <section className="py-20 bg-tranches-beige/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-serif text-tranches-charcoal mb-6">
              ✅ Un outil professionnel complet, pensé pour VOUS
            </h2>
            <p className="text-xl text-tranches-charcoal/80 mb-8">
              CaprIA est bien plus qu'une appli :
            </p>
            <p className="text-lg text-tranches-charcoal/70">
              C'est un compagnon de route qui vous aide à mieux organiser vos journées et à enrichir vos interventions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="text-center border-none shadow-lg">
              <CardContent className="p-6">
                <Calendar className="w-12 h-12 text-tranches-dustyblue mx-auto mb-4" />
                <h3 className="text-lg font-serif text-tranches-charcoal mb-2">
                  Planification des rendez-vous
                </h3>
                <p className="text-tranches-charcoal/70 text-sm">
                  en toute simplicité
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="p-6">
                <FileText className="w-12 h-12 text-tranches-dustyblue mx-auto mb-4" />
                <h3 className="text-lg font-serif text-tranches-charcoal mb-2">
                  Comptes-rendus clairs
                </h3>
                <p className="text-tranches-charcoal/70 text-sm">
                  à remplir après chaque visite
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="p-6">
                <Euro className="w-12 h-12 text-tranches-dustyblue mx-auto mb-4" />
                <h3 className="text-lg font-serif text-tranches-charcoal mb-2">
                  Aide à la facturation
                </h3>
                <p className="text-tranches-charcoal/70 text-sm">
                  mensuelle
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-tranches-dustyblue mx-auto mb-4" />
                <h3 className="text-lg font-serif text-tranches-charcoal mb-2">
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
      <section className="py-16 bg-gradient-to-r from-yellow-400 to-orange-300">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-serif text-tranches-charcoal mb-6">
              🎁 Offre exclusive : Testez CaprIA gratuitement pendant 65 jours
            </h2>
            <p className="text-lg text-tranches-charcoal">
              💳 Abonnement ensuite : 6,90 €/mois - Annulation possible à tout moment
            </p><br/>
            <p className="text-xl text-tranches-charcoal mb-4">
              🕐 Offre de lancement : Devenez ambassadeur CaprIA et profitez de l'application gratuitement à vie. Offre réservée aux 50 premiers ambassadeurs.
            </p>            
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif text-center text-tranches-charcoal mb-6">
            🌸 Enrichissez les visites avec des activités numériques engageantes
          </h2>
          <p className="text-xl text-center text-tranches-charcoal/80 mb-12 max-w-4xl mx-auto">
            Avec CaprIA, vous pouvez désormais proposer des activités variées et adaptées aux seniors que vous accompagnez :
          </p>

          <div className="max-w-6xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-tranches-sage/20">
                    <th className="border border-tranches-sage/30 p-4 text-left font-serif text-tranches-charcoal">Activité</th>
                    <th className="border border-tranches-sage/30 p-4 text-left font-serif text-tranches-charcoal">Description</th>
                    <th className="border border-tranches-sage/30 p-4 text-left font-serif text-tranches-charcoal">Bénéfice</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => (
                    <tr key={index} className="hover:bg-tranches-beige/20">
                      <td className="border border-tranches-sage/30 p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{activity.icon}</span>
                          <span className="font-medium text-tranches-charcoal">{activity.name}</span>
                        </div>
                      </td>
                      <td className="border border-tranches-sage/30 p-4 text-tranches-charcoal/80">
                        {activity.description}
                      </td>
                      <td className="border border-tranches-sage/30 p-4 text-tranches-charcoal/80">
                        {activity.benefit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-tranches-beige/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif text-center text-tranches-charcoal mb-16">
            💬 Elles l'ont testé. Elles racontent…
          </h2>

          <div className="max-w-6xl mx-auto space-y-12">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className={`border-none shadow-lg bg-gradient-to-r ${testimonial.color}`}>
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-4 h-4 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="text-2xl font-serif text-tranches-charcoal mb-2">
                        "{testimonial.title}"
                      </h3>
                      <p className="text-sm text-tranches-charcoal/70 mb-4">
                        Public : {testimonial.audience}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-lg text-tranches-charcoal/80 mb-6 italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    <p className="font-medium text-tranches-charcoal">
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
      <section id="signup-section" className="py-20 bg-gradient-to-r from-tranches-dustyblue to-tranches-sage text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-serif mb-8">
              📲 Rejoignez la communauté CaprIA
            </h2>
            
            <div className="space-y-4 mb-8 text-lg">
              <p>👉 Vous êtes professionnel(le) de l'accompagnement à domicile ?</p>
              <p>👉 Vous souhaitez tester un outil utile, bienveillant et innovant ?</p>
              <p>👉 Vous voulez offrir plus de sens, plus de lien, plus de mieux-être à vos bénéficiaires et à vous-même ?</p>
            </div>

            <p className="text-xl mb-8">Ne ratez pas cette opportunité !</p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-md mx-auto">
              <p className="text-lg mb-2">💖 CaprIA est gratuit pendant 65 jours</p>
              <p className="text-sm opacity-90">⚠️ Seulement 50 accès ambassadeurs gratuits à vie</p>
            </div>

            <Button 
              size="lg" 
              className="bg-white text-tranches-charcoal hover:bg-gray-100 text-xl px-12 py-6 mb-12"
            >
              🚀 Je teste CaprIA gratuitement
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm opacity-90">
              <div className="flex items-center justify-center gap-2">
                <span>📱</span>
                <span>Fonctionne sur smartphone, tablette ou ordinateur</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>💡</span>
                <span>Formation gratuite incluse</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>🤝</span>
                <span>Accompagnement humain</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>⚡</span>
                <span>Simple à utiliser</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Section */}
      <section className="py-16 bg-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif text-tranches-charcoal mb-4">
            🌼 CaprIA vous accompagne pour accompagner mieux
          </h2>
          <p className="text-lg text-tranches-charcoal/80 mb-2">
            Parce que votre métier mérite plus que des outils.
          </p>
          <p className="text-lg text-tranches-charcoal/80">
            Parce que VOUS méritez une application qui vous comprend.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ProfessionalModule;
