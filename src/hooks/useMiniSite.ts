import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { sanitizeSlug } from '@/utils/slugUtils';

export interface MiniSiteData {
  id?: string;
  site_name: string;
  site_subtitle: string;
  logo_url: string;
  logo_size: number;
  professional_networks: string;
  first_name: string;
  last_name: string;
  profession: string;
  email: string;
  phone: string;
  postal_code: string;
  about_me: string;
  why_this_profession: string;
  skills_and_qualities: string;
  activity_start_date: string;
  services_description: string;
  availability_schedule: string;
  intervention_radius: string;
  color_palette: string;
  design_style: 'feminine' | 'masculine' | 'neutral';
  is_published: boolean;
  slug?: string;
  media?: Array<{
    id?: string;
    media_url: string;
    caption: string;
    link_url: string;
    display_order: number;
  }>;
  social_links?: Array<{
    id?: string;
    platform: 'facebook' | 'tiktok' | 'linkedin' | 'instagram' | 'x' | 'youtube';
    url: string;
  }>;
}

export const useMiniSite = (userId?: string) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [miniSite, setMiniSite] = useState<MiniSiteData | null>(null);
  const [loading, setLoading] = useState(false);

  const targetUserId = userId || user?.id;

  const fetchMiniSite = async () => {
    // Ne pas essayer de charger si l'auth est encore en cours ou si pas d'utilisateur
    if (isAuthLoading || !targetUserId) return;
    
    setLoading(true);
    try {
      const { data: siteData, error: siteError } = await supabase
        .from('mini_sites')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (siteError) {
        throw siteError;
      }

      if (siteData) {
        // Fetch media
        const { data: mediaData } = await supabase
          .from('mini_site_media')
          .select('*')
          .eq('mini_site_id', siteData.id)
          .order('display_order');

        // Fetch social links
        const { data: socialData } = await supabase
          .from('mini_site_social_links')
          .select('*')
          .eq('mini_site_id', siteData.id);

        setMiniSite({
          ...siteData,
          design_style: siteData.design_style as 'feminine' | 'masculine' | 'neutral',
          media: (mediaData || []).map(media => ({
            id: media.id,
            media_url: media.media_url,
            caption: media.caption || '',
            link_url: media.link_url || '',
            display_order: media.display_order || 0
          })),
          social_links: (socialData || []).map(link => ({
            id: link.id,
            platform: link.platform as 'facebook' | 'tiktok' | 'linkedin' | 'instagram' | 'x' | 'youtube',
            url: link.url
          }))
        });
      } else {
        setMiniSite(null);
      }
    } catch (error) {
      console.error('Error fetching mini site:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le mini-site",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMiniSite = async (data: MiniSiteData) => {
    if (isAuthLoading || !targetUserId) return;

    setLoading(true);
    try {
      // Generate slug
      const slug = await generateSlug(data.first_name, data.last_name, data.postal_code);
      
      const siteData = {
        user_id: targetUserId,
        site_name: data.site_name,
        site_subtitle: data.site_subtitle,
        logo_url: data.logo_url,
        logo_size: data.logo_size,
        professional_networks: data.professional_networks,
        first_name: data.first_name,
        last_name: data.last_name,
        profession: data.profession,
        email: data.email,
        phone: data.phone,
        postal_code: data.postal_code,
        about_me: data.about_me,
        why_this_profession: data.why_this_profession,
        skills_and_qualities: data.skills_and_qualities,
        activity_start_date: data.activity_start_date,
        services_description: data.services_description,
        availability_schedule: data.availability_schedule,
        intervention_radius: data.intervention_radius,
        color_palette: data.color_palette,
        design_style: data.design_style,
        is_published: data.is_published,
        slug
      };

      let miniSiteId = data.id;

      if (miniSiteId) {
        // Update existing
        const { error } = await supabase
          .from('mini_sites')
          .update(siteData)
          .eq('id', miniSiteId);
        
        if (error) throw error;
      } else {
        // Create new
        const { data: newSite, error } = await supabase
          .from('mini_sites')
          .insert(siteData)
          .select()
          .single();
        
        if (error) throw error;
        miniSiteId = newSite.id;
      }

      // Save media
      if (data.media) {
        // Delete existing media
        await supabase
          .from('mini_site_media')
          .delete()
          .eq('mini_site_id', miniSiteId);

        // Insert new media
        if (data.media.length > 0) {
          const mediaData = data.media.map((media, index) => ({
            mini_site_id: miniSiteId,
            media_url: media.media_url,
            caption: media.caption,
            link_url: media.link_url,
            display_order: index
          }));

          const { error: mediaError } = await supabase
            .from('mini_site_media')
            .insert(mediaData);

          if (mediaError) throw mediaError;
        }
      }

      // Save social links
      if (data.social_links) {
        // Delete existing social links
        await supabase
          .from('mini_site_social_links')
          .delete()
          .eq('mini_site_id', miniSiteId);

        // Insert new social links
        if (data.social_links.length > 0) {
          const socialData = data.social_links.map(link => ({
            mini_site_id: miniSiteId,
            platform: link.platform,
            url: link.url
          }));

          const { error: socialError } = await supabase
            .from('mini_site_social_links')
            .insert(socialData);

          if (socialError) throw socialError;
        }
      }

      toast({
        title: "Succès",
        description: "Mini-site sauvegardé avec succès"
      });

      fetchMiniSite();
    } catch (error) {
      console.error('Error saving mini site:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le mini-site",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMiniSite = async () => {
    if (!miniSite?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('mini_sites')
        .delete()
        .eq('id', miniSite.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Mini-site supprimé avec succès"
      });

      setMiniSite(null);
    } catch (error) {
      console.error('Error deleting mini site:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le mini-site",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = async (firstName: string, lastName: string, postalCode: string) => {
    const { data, error } = await supabase
      .rpc('generate_mini_site_slug', {
        p_first_name: firstName,
        p_last_name: lastName,
        p_postal_code: postalCode
      });

    if (error) {
      console.error('Error generating slug:', error);
      return sanitizeSlug(`${firstName.toLowerCase()}.${lastName.toLowerCase()}.${postalCode}`);
    }

    return sanitizeSlug(String(data));
  };

  useEffect(() => {
    // Ne charger qu'une fois l'auth initialisée
    if (!isAuthLoading) {
      fetchMiniSite();
    }
  }, [targetUserId, isAuthLoading]);

  return {
    miniSite,
    loading,
    saveMiniSite,
    deleteMiniSite,
    fetchMiniSite
  };
};