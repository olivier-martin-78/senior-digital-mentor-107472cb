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
import { ColorPalette } from './ColorPalette';
import { QRCodeGenerator } from './QRCodeGenerator';
import { Eye, Save, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MiniSiteFormProps {
  userId?: string;
  onPreview?: (data: MiniSiteData) => void;
}

const defaultFormData: MiniSiteData = {
  site_name: '',
  site_subtitle: '',
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
      // Store in sessionStorage for preview
      console.log('Preview data being stored:', formData);
      sessionStorage.setItem('miniSitePreview', JSON.stringify(formData));
      window.open('/mini-site/preview', '_blank');
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
                  <Label>Photos du carrousel</Label>
                  <MediaUploader
                    value=""
                    onChange={(url) => {
                      const newMedia = {
                        media_url: url,
                        caption: '',
                        link_url: '',
                        display_order: (formData.media?.length || 0)
                      };
                      handleInputChange('media', [...(formData.media || []), newMedia]);
                    }}
                    accept="image/*"
                    multiple
                    maxSize={5}
                  />
                  
                  {formData.media && formData.media.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.media.map((media, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <img src={media.media_url} alt="" className="w-16 h-16 object-cover rounded" />
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Texte de la photo"
                              value={media.caption}
                              onChange={(e) => {
                                const newMedia = [...(formData.media || [])];
                                newMedia[index].caption = e.target.value;
                                handleInputChange('media', newMedia);
                              }}
                            />
                            <Input
                              placeholder="Lien de la photo (optionnel)"
                              value={media.link_url}
                              onChange={(e) => {
                                const newMedia = [...(formData.media || [])];
                                newMedia[index].link_url = e.target.value;
                                handleInputChange('media', newMedia);
                              }}
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newMedia = formData.media?.filter((_, i) => i !== index);
                              handleInputChange('media', newMedia);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
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
                <Label htmlFor="about_me">Qui suis-je</Label>
                <Textarea
                  id="about_me"
                  value={formData.about_me}
                  onChange={(e) => handleInputChange('about_me', e.target.value)}
                  placeholder="Présentez-vous..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 5 : Pourquoi j'ai choisi ce métier ?</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="why_this_profession">Ma raison d'être</Label>
                <Textarea
                  id="why_this_profession"
                  value={formData.why_this_profession}
                  onChange={(e) => handleInputChange('why_this_profession', e.target.value)}
                  placeholder="Expliquez votre motivation..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 6 : Mes compétences et qualités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="skills_and_qualities">Mes compétences et qualités clés</Label>
                  <Textarea
                    id="skills_and_qualities"
                    value={formData.skills_and_qualities}
                    onChange={(e) => handleInputChange('skills_and_qualities', e.target.value)}
                    placeholder="Listez vos compétences..."
                    rows={4}
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
                <Label htmlFor="services_description">Présentation de mes services et formules</Label>
                <Textarea
                  id="services_description"
                  value={formData.services_description}
                  onChange={(e) => handleInputChange('services_description', e.target.value)}
                  placeholder="Décrivez vos services..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 8 : Mes disponibilités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="availability_schedule">Les disponibilités de mon planning</Label>
                  <Textarea
                    id="availability_schedule"
                    value={formData.availability_schedule}
                    onChange={(e) => handleInputChange('availability_schedule', e.target.value)}
                    placeholder="Lundi-Vendredi : 8h-18h..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="intervention_radius">Mon rayon d'intervention</Label>
                  <Textarea
                    id="intervention_radius"
                    value={formData.intervention_radius}
                    onChange={(e) => handleInputChange('intervention_radius', e.target.value)}
                    placeholder="20km autour de Paris..."
                    rows={2}
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