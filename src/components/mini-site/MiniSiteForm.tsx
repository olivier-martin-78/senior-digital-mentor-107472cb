import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MiniSiteData, useMiniSite } from '@/hooks/useMiniSite';
import { MediaUploader } from './MediaUploader';
import { MediaOrderManager } from './MediaOrderManager';
import { ColorPalette, colorPalettes } from './ColorPalette';
import { QRCodeGenerator } from './QRCodeGenerator';
import { Eye, Save, Trash2 } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { useNavigate } from 'react-router-dom';

interface MiniSiteFormProps {
  userId?: string;
  onPreview?: (data: MiniSiteData) => void;
}

const defaultFormData: MiniSiteData = {
  site_name: '',
  site_subtitle: '',
  title_color: '',
  subtitle_color: '',
  // Advanced color customizations
  header_gradient_from: '',
  header_gradient_to: '',
  section_text_color: '',
  section_title_divider_from: '',
  section_title_divider_to: '',
  // Titres de section personnalisables
  section_title_about_me: '',
  section_title_why_this_profession: '',
  section_title_skills_and_qualities: '',
  section_title_services: '',
  section_title_availability: '',
  section_title_contact: '',
  section_title_follow_me: '',
  section_title_professional_networks: '',
  logo_url: '',
  logo_size: 150,
  professional_networks: '',
  first_name: '',
  last_name: '',
  profession: '',
  email: '',
  phone: '',
  postal_code: '',
  about_me: '',
  why_this_profession: '',
  skills_and_qualities: '',
  activity_start_date: '',
  services_description: '',
  availability_schedule: '',
  intervention_radius: '',
  color_palette: 'blue',
  design_style: 'neutral',
  is_published: false,
  media: [],
  social_links: []
};

const socialPlatforms = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' }
];

export const MiniSiteForm: React.FC<MiniSiteFormProps> = ({ userId, onPreview }) => {
  const { miniSite, loading, saveMiniSite, deleteMiniSite } = useMiniSite(userId);
  const [formData, setFormData] = useState<MiniSiteData>(defaultFormData);
  const [activeTab, setActiveTab] = useState('header');
  const navigate = useNavigate();

  useEffect(() => {
    if (miniSite) {
      setFormData(miniSite);
    }
  }, [miniSite]);

  // Initialize default header gradient from palette (darkest -> lightest)
  useEffect(() => {
    const palette = colorPalettes.find((p) => p.name === formData.color_palette);
    if (!palette) return;
    const darkest = palette.colors[0];
    const lightest = palette.colors[palette.colors.length - 1];
    setFormData((prev) => {
      if (!prev.header_gradient_from && !prev.header_gradient_to) {
        return { ...prev, header_gradient_from: darkest, header_gradient_to: lightest };
      }
      return prev;
    });
  }, [formData.color_palette]);

  const handleInputChange = (field: keyof MiniSiteData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinksChange = (platform: string, checked: boolean, url?: string) => {
    setFormData(prev => {
      const currentLinks = prev.social_links || [];
      if (checked && url) {
        // Add or update link
        const existingIndex = currentLinks.findIndex(link => link.platform === platform);
        if (existingIndex >= 0) {
          currentLinks[existingIndex].url = url;
        } else {
          currentLinks.push({ 
            platform: platform as any,
            url 
          });
        }
      } else {
        // Remove link
        return {
          ...prev,
          social_links: currentLinks.filter(link => link.platform !== platform)
        };
      }
      return { ...prev, social_links: currentLinks };
    });
  };

  const handleSave = async () => {
    await saveMiniSite(formData);
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce mini-site ?')) {
      await deleteMiniSite();
      navigate('/');
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(formData);
    } else {
      try {
        // Encode preview data as URL parameter with proper Unicode handling
        const jsonString = JSON.stringify(formData);
        const encodedData = btoa(encodeURIComponent(jsonString));
        const previewUrl = `/mini-site/preview?data=${encodeURIComponent(encodedData)}`;
        
        window.open(previewUrl, '_blank');
      } catch (error) {
        console.error('Error preparing preview:', error);
        alert('Erreur lors de la préparation de l\'aperçu. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {miniSite ? 'Modifier mon mini-site' : 'Créer mon mini-site'}
          </h1>
          <div className="flex gap-2">
            <Button onClick={handlePreview} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Prévisualiser
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
            {miniSite && (
              <Button onClick={handleDelete} variant="destructive" disabled={loading}>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="header">Entête</TabsTrigger>
            <TabsTrigger value="carousel">Carrousel</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="header" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 1 : Entête du site</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="site_name">Nom du site *</Label>
                  <Input
                    id="site_name"
                    value={formData.site_name}
                    onChange={(e) => handleInputChange('site_name', e.target.value)}
                    placeholder="Mon site professionnel"
                  />
                </div>

                <div>
                  <Label htmlFor="site_subtitle">Sous-titre du site</Label>
                  <Input
                    id="site_subtitle"
                    value={formData.site_subtitle}
                    onChange={(e) => handleInputChange('site_subtitle', e.target.value)}
                    placeholder="Professionnel au service des seniors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title_color">Couleur du titre (optionnel)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="title_color"
                        type="color"
                        value={formData.title_color || '#ffffff'}
                        onChange={(e) => handleInputChange('title_color', e.target.value)}
                        aria-label="Choisir la couleur du titre"
                        className="h-10 w-16 p-1"
                      />
                      <Button type="button" variant="outline" onClick={() => handleInputChange('title_color', '')}>
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subtitle_color">Couleur du sous-titre (optionnel)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="subtitle_color"
                        type="color"
                        value={formData.subtitle_color || '#ffffff'}
                        onChange={(e) => handleInputChange('subtitle_color', e.target.value)}
                        aria-label="Choisir la couleur du sous-titre"
                        className="h-10 w-16 p-1"
                      />
                      <Button type="button" variant="outline" onClick={() => handleInputChange('subtitle_color', '')}>
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Logo</Label>
                  <MediaUploader
                    value={formData.logo_url}
                    onChange={(url) => handleInputChange('logo_url', url)}
                    accept="image/*"
                    maxSize={2}
                  />
                </div>

                <div>
                  <Label htmlFor="logo_size">Taille du logo (pixels)</Label>
                  <Input
                    id="logo_size"
                    type="number"
                    value={formData.logo_size}
                    onChange={(e) => handleInputChange('logo_size', parseInt(e.target.value) || 150)}
                    min="50"
                    max="300"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carousel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 2 : Carrousel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="section_title_professional_networks">Titre de section (Réseaux professionnels)</Label>
                  <Input
                    id="section_title_professional_networks"
                    value={formData.section_title_professional_networks || ''}
                    onChange={(e) => handleInputChange('section_title_professional_networks', e.target.value)}
                    placeholder="Réseaux professionnels"
                  />
                </div>

                <div>
                  <Label htmlFor="professional_networks">Je suis membre des réseaux professionnels</Label>
                  <Textarea
                    id="professional_networks"
                    value={formData.professional_networks}
                    onChange={(e) => handleInputChange('professional_networks', e.target.value)}
                    placeholder="Décrivez vos affiliations professionnelles..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Photos et vidéos du carrousel</Label>
                  <MediaUploader
                    value=""
                    onChange={(url, mediaType = 'image') => {
                      const newMedia = {
                        media_url: url,
                        caption: '',
                        link_url: '',
                        display_order: (formData.media?.length || 0),
                        media_type: mediaType
                      };
                      handleInputChange('media', [...(formData.media || []), newMedia]);
                    }}
                    accept="image/*,video/*"
                    multiple
                    maxSize={10}
                  />
                  
                  {formData.media && formData.media.length > 0 && (
                    <div className="mt-4">
                      <MediaOrderManager
                        media={formData.media}
                        onMediaChange={(newMedia) => handleInputChange('media', newMedia)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 3 : Me contacter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="section_title_contact">Titre de section (Me contacter)</Label>
                  <Input
                    id="section_title_contact"
                    value={formData.section_title_contact || ''}
                    onChange={(e) => handleInputChange('section_title_contact', e.target.value)}
                    placeholder="Me contacter"
                  />
                </div>
                <div>
                  <Label htmlFor="section_title_follow_me">Titre de section (Suivez-moi)</Label>
                  <Input
                    id="section_title_follow_me"
                    value={formData.section_title_follow_me || ''}
                    onChange={(e) => handleInputChange('section_title_follow_me', e.target.value)}
                    placeholder="Suivez-moi"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="profession">Votre métier</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => handleInputChange('profession', e.target.value)}
                    placeholder="Auxiliaire de vie, aide-soignant..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Mon email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Mon numéro de téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Réseaux sociaux</Label>
                  <div className="space-y-3 mt-2">
                    {socialPlatforms.map(platform => {
                      const link = formData.social_links?.find(l => l.platform === platform.value);
                      const isChecked = !!link;

                      return (
                        <div key={platform.value} className="flex items-center space-x-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                handleSocialLinksChange(platform.value, false);
                              }
                            }}
                          />
                          <Label className="w-24">{platform.label}</Label>
                          {isChecked && (
                            <Input
                              placeholder={`URL ${platform.label}`}
                              value={link?.url || ''}
                              onChange={(e) => handleSocialLinksChange(platform.value, true, e.target.value)}
                              className="flex-1"
                            />
                          )}
                          {!isChecked && (
                            <Input
                              placeholder={`URL ${platform.label}`}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSocialLinksChange(platform.value, true, e.target.value);
                                }
                              }}
                              className="flex-1"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 4 : Qui suis-je</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="section_title_about_me">Titre de section (Qui suis-je ?)</Label>
                  <Input
                    id="section_title_about_me"
                    value={formData.section_title_about_me || ''}
                    onChange={(e) => handleInputChange('section_title_about_me', e.target.value)}
                    placeholder="Qui suis-je ?"
                  />
                </div>
                <Label htmlFor="about_me">Qui suis-je</Label>
                <RichTextEditor
                  id="about_me"
                  value={formData.about_me}
                  onChange={(val) => handleInputChange('about_me', val)}
                  placeholder="Présentez-vous..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 5 : Pourquoi j'ai choisi ce métier ?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="section_title_why_this_profession">Titre de section (Pourquoi j'ai choisi ce métier ?)</Label>
                  <Input
                    id="section_title_why_this_profession"
                    value={formData.section_title_why_this_profession || ''}
                    onChange={(e) => handleInputChange('section_title_why_this_profession', e.target.value)}
                    placeholder={"Pourquoi j'ai choisi ce métier ?"}
                  />
                </div>
                <Label htmlFor="why_this_profession">Ma raison d'être</Label>
                <RichTextEditor
                  id="why_this_profession"
                  value={formData.why_this_profession}
                  onChange={(val) => handleInputChange('why_this_profession', val)}
                  placeholder="Expliquez votre motivation..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 6 : Mes compétences et qualités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="section_title_skills_and_qualities">Titre de section (Mes compétences et qualités)</Label>
                  <Input
                    id="section_title_skills_and_qualities"
                    value={formData.section_title_skills_and_qualities || ''}
                    onChange={(e) => handleInputChange('section_title_skills_and_qualities', e.target.value)}
                    placeholder="Mes compétences et qualités"
                  />
                </div>
                <div>
                  <Label htmlFor="skills_and_qualities">Mes compétences et qualités clés</Label>
                  <RichTextEditor
                    id="skills_and_qualities"
                    value={formData.skills_and_qualities}
                    onChange={(val) => handleInputChange('skills_and_qualities', val)}
                    placeholder="Listez vos compétences..."
                  />
                </div>
                <div>
                  <Label htmlFor="activity_start_date">Date de démarrage de mon activité</Label>
                  <Input
                    id="activity_start_date"
                    value={formData.activity_start_date}
                    onChange={(e) => handleInputChange('activity_start_date', e.target.value)}
                    placeholder="Janvier 2020"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 7 : Mes offres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="section_title_services">Titre de section (Mes offres)</Label>
                  <Input
                    id="section_title_services"
                    value={formData.section_title_services || ''}
                    onChange={(e) => handleInputChange('section_title_services', e.target.value)}
                    placeholder="Mes offres"
                  />
                </div>
                <Label htmlFor="services_description">Présentation de mes services et formules</Label>
                <RichTextEditor
                  id="services_description"
                  value={formData.services_description}
                  onChange={(val) => handleInputChange('services_description', val)}
                  placeholder="Décrivez vos services..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 8 : Mes disponibilités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="section_title_availability">Titre de section (Mes disponibilités)</Label>
                  <Input
                    id="section_title_availability"
                    value={formData.section_title_availability || ''}
                    onChange={(e) => handleInputChange('section_title_availability', e.target.value)}
                    placeholder="Mes disponibilités"
                  />
                </div>
                <div>
                  <Label htmlFor="availability_schedule">Les disponibilités de mon planning</Label>
                  <RichTextEditor
                    id="availability_schedule"
                    value={formData.availability_schedule}
                    onChange={(val) => handleInputChange('availability_schedule', val)}
                    placeholder="Lundi-Vendredi : 8h-18h..."
                  />
                </div>
                <div>
                  <Label htmlFor="intervention_radius">Mon rayon d'intervention</Label>
                  <RichTextEditor
                    id="intervention_radius"
                    value={formData.intervention_radius}
                    onChange={(val) => handleInputChange('intervention_radius', val)}
                    placeholder="20km autour de Paris..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 10 : Paramètres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Palette de couleurs</Label>
                  <ColorPalette
                    value={formData.color_palette}
                    onChange={(palette) => handleInputChange('color_palette', palette)}
                  />
                </div>

                {/* Personnalisation avancée des couleurs */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="header_gradient_from">Bandeau dégradé – début</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input
                          id="header_gradient_from"
                          type="color"
                          value={formData.header_gradient_from || '#4f46e5'}
                          onChange={(e) => handleInputChange('header_gradient_from', e.target.value)}
                          className="h-10 w-16 p-1"
                          aria-label="Choisir la première couleur du bandeau"
                        />
                        <Button type="button" variant="outline" onClick={() => handleInputChange('header_gradient_from', '')}>
                          Réinitialiser
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="header_gradient_to">Bandeau dégradé – fin</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input
                          id="header_gradient_to"
                          type="color"
                          value={formData.header_gradient_to || '#1e40af'}
                          onChange={(e) => handleInputChange('header_gradient_to', e.target.value)}
                          className="h-10 w-16 p-1"
                          aria-label="Choisir la deuxième couleur du bandeau"
                        />
                        <Button type="button" variant="outline" onClick={() => handleInputChange('header_gradient_to', '')}>
                          Réinitialiser
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="section_text_color">Couleur du texte des sections</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="section_text_color"
                        type="color"
                        value={formData.section_text_color || '#374151'}
                        onChange={(e) => handleInputChange('section_text_color', e.target.value)}
                        className="h-10 w-16 p-1"
                        aria-label="Choisir la couleur du texte des sections"
                      />
                      <Button type="button" variant="outline" onClick={() => handleInputChange('section_text_color', '')}>
                        Réinitialiser
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="section_title_divider_from">Ligne sous titre – début</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input
                          id="section_title_divider_from"
                          type="color"
                          value={formData.section_title_divider_from || '#ec4899'}
                          onChange={(e) => handleInputChange('section_title_divider_from', e.target.value)}
                          className="h-10 w-16 p-1"
                          aria-label="Choisir la première couleur de la ligne"
                        />
                        <Button type="button" variant="outline" onClick={() => handleInputChange('section_title_divider_from', '')}>
                          Réinitialiser
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="section_title_divider_to">Ligne sous titre – fin</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input
                          id="section_title_divider_to"
                          type="color"
                          value={formData.section_title_divider_to || '#8b5cf6'}
                          onChange={(e) => handleInputChange('section_title_divider_to', e.target.value)}
                          className="h-10 w-16 p-1"
                          aria-label="Choisir la deuxième couleur de la ligne"
                        />
                        <Button type="button" variant="outline" onClick={() => handleInputChange('section_title_divider_to', '')}>
                          Réinitialiser
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="design_style">Style du design</Label>
                  <Select
                    value={formData.design_style}
                    onValueChange={(value) => handleInputChange('design_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feminine">Style féminin</SelectItem>
                      <SelectItem value="masculine">Style masculin</SelectItem>
                      <SelectItem value="neutral">Style neutre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => handleInputChange('is_published', checked)}
                  />
                  <Label htmlFor="is_published">Publier le mini-site</Label>
                </div>

                {formData.slug && (
                  <div>
                    <Label>URL du mini-site</Label>
                    <div className="text-sm text-muted-foreground">
                      {formData.is_published 
                        ? `https://senior-digital-mentor.com/mini-site/${(formData.slug || '').replace(/\./g,'-')}`
                        : `${window.location.origin}/mini-site/${(formData.slug || '').replace(/\./g,'-')}`
                      }
                    </div>
                  </div>
                )}

                {miniSite && formData.slug && (
                  <QRCodeGenerator 
                    url={formData.is_published 
                      ? `https://senior-digital-mentor.com/mini-site/${(formData.slug || '').replace(/\./g,'-')}`
                      : `${window.location.origin}/mini-site/${(formData.slug || '').replace(/\./g,'-')}`
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};