import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { sanitizeSlug } from '@/utils/slugUtils';

export interface MiniSiteData {
  id?: string;
  site_name: string;
  site_subtitle: string;
  title_color?: string;
  subtitle_color?: string;
  // New customizable design fields
  header_gradient_from?: string; // e.g. #123456
  header_gradient_to?: string;   // e.g. #654321
  section_text_color?: string;   // color for section body text
  section_title_color?: string;  // color for section titles
  section_title_divider_from?: string; // gradient start for divider under titles
  section_title_divider_to?: string;   // gradient end for divider under titles
  background_color?: string;           // custom background color for the page
  // Customizable section titles
  section_title_about_me?: string;
  section_title_why_this_profession?: string;
  section_title_skills_and_qualities?: string;
  section_title_services?: string;
  section_title_availability?: string;
  section_title_contact?: string;
  section_title_follow_me?: string;
  section_title_professional_networks?: string;
  logo_url: string;
  logo_size: number;
  professional_networks: string;
  first_name: string;
  last_name: string;
  profession: string;
  email: string;
  phone: string;
  postal_code: string;
  city: string;
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
    media_type: 'image' | 'video';
    duration?: number; // Durée d'affichage en secondes
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
    console.log('🔥 [MINI_SITE_DEBUG] fetchMiniSite called', { isAuthLoading, targetUserId });
    // Ne pas essayer de charger si l'auth est encore en cours ou si pas d'utilisateur
    if (isAuthLoading || !targetUserId) {
      console.log('🔥 [MINI_SITE_DEBUG] Skipping fetch - auth loading or no user');
      return;
    }
    
    console.log('🔥 [MINI_SITE_DEBUG] Starting mini site fetch');
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
            display_order: media.display_order || 0,
            media_type: media.media_type as 'image' | 'video' || 'image',
            duration: media.duration || 5 // Valeur par défaut de 5 secondes
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
      console.error('🔥 [MINI_SITE_DEBUG] Error fetching mini site:', error);
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
      // Generate slug only for new mini-sites, keep existing slug for updates
      let slug;
      if (data.id) {
        // For existing mini-sites, keep the current slug
        const { data: existingSite } = await supabase
          .from('mini_sites')
          .select('slug')
          .eq('id', data.id)
          .single();
        slug = existingSite?.slug || await generateSlug(data.first_name, data.last_name, data.postal_code);
      } else {
        // For new mini-sites, generate a new slug
        slug = await generateSlug(data.first_name, data.last_name, data.postal_code);
      }
      
      const siteData = {
        user_id: targetUserId,
        site_name: data.site_name,
        site_subtitle: data.site_subtitle,
        title_color: data.title_color || null,
        subtitle_color: data.subtitle_color || null,
        header_gradient_from: data.header_gradient_from || null,
        header_gradient_to: data.header_gradient_to || null,
        section_text_color: data.section_text_color || null,
        section_title_color: data.section_title_color || null,
        section_title_divider_from: data.section_title_divider_from || null,
        section_title_divider_to: data.section_title_divider_to || null,
        background_color: data.background_color || null,
        // Customizable section titles
        section_title_about_me: data.section_title_about_me || null,
        section_title_why_this_profession: data.section_title_why_this_profession || null,
        section_title_skills_and_qualities: data.section_title_skills_and_qualities || null,
        section_title_services: data.section_title_services || null,
        section_title_availability: data.section_title_availability || null,
        section_title_contact: data.section_title_contact || null,
        section_title_follow_me: data.section_title_follow_me || null,
        section_title_professional_networks: data.section_title_professional_networks || null,
        logo_url: data.logo_url,
        logo_size: data.logo_size,
        professional_networks: data.professional_networks,
        first_name: data.first_name,
        last_name: data.last_name,
        profession: data.profession,
        email: data.email,
        phone: data.phone,
        postal_code: data.postal_code,
        city: data.city,
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
            display_order: index,
            media_type: media.media_type || 'image',
            duration: media.duration || 5 // Valeur par défaut de 5 secondes
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
    console.log('🔥 [MINI_SITE_DEBUG] useEffect triggered', { targetUserId, isAuthLoading });
    // Ne charger qu'une fois l'auth initialisée
    if (!isAuthLoading) {
      console.log('🔥 [MINI_SITE_DEBUG] Auth loaded, calling fetchMiniSite');
      fetchMiniSite();
    }
  }, [targetUserId, isAuthLoading]);

  const importMiniSite = async (sourceMiniSiteId: string, targetUserId: string) => {
    if (!targetUserId) {
      toast({
        title: "Erreur",
        description: "Utilisateur cible non spécifié pour l'import",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch source mini-site data
      const { data: sourceData, error: sourceError } = await supabase
        .from('mini_sites')
        .select('*')
        .eq('id', sourceMiniSiteId)
        .single();

      if (sourceError) throw sourceError;

      // Fetch source media
      const { data: sourceMedia } = await supabase
        .from('mini_site_media')
        .select('*')
        .eq('mini_site_id', sourceMiniSiteId)
        .order('display_order');

      // Fetch source social links
      const { data: sourceSocial } = await supabase
        .from('mini_site_social_links')
        .select('*')
        .eq('mini_site_id', sourceMiniSiteId);

      // Get target user profile for slug generation
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (!targetProfile) throw new Error('Target user not found');

      // Generate new slug for target user using target user's profile data
      const slug = await generateSlug(
        targetProfile.display_name?.split(' ')[0] || 'user',
        targetProfile.display_name?.split(' ').slice(1).join(' ') || 'name',
        '75000' // Default postal code since profile doesn't have it
      );

      // Prepare site data for target user
      const importedSiteData = {
        ...sourceData,
        user_id: targetUserId,
        slug,
        created_at: undefined, // Let database set new timestamp
        updated_at: undefined, // Let database set new timestamp
        id: undefined // Remove ID to create new record or update existing
      };

      // Check if target user already has a mini-site
      const { data: existingMiniSite } = await supabase
        .from('mini_sites')
        .select('id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      let miniSiteId: string;

      if (existingMiniSite) {
        // Update existing mini-site
        const { error: updateError } = await supabase
          .from('mini_sites')
          .update(importedSiteData)
          .eq('id', existingMiniSite.id);
        
        if (updateError) throw updateError;
        miniSiteId = existingMiniSite.id;
      } else {
        // Create new mini-site
        const { data: newSite, error: insertError } = await supabase
          .from('mini_sites')
          .insert(importedSiteData)
          .select()
          .single();
        
        if (insertError) throw insertError;
        miniSiteId = newSite.id;
      }

      // Delete existing media and social links for target
      await Promise.all([
        supabase
          .from('mini_site_media')
          .delete()
          .eq('mini_site_id', miniSiteId),
        supabase
          .from('mini_site_social_links')
          .delete()
          .eq('mini_site_id', miniSiteId)
      ]);

      // Import media if any
      if (sourceMedia && sourceMedia.length > 0) {
        const mediaData = sourceMedia.map(media => ({
          mini_site_id: miniSiteId,
          media_url: media.media_url,
          caption: media.caption,
          link_url: media.link_url,
          display_order: media.display_order,
          media_type: media.media_type,
          duration: media.duration
        }));

        const { error: mediaError } = await supabase
          .from('mini_site_media')
          .insert(mediaData);

        if (mediaError) throw mediaError;
      }

      // Import social links if any
      if (sourceSocial && sourceSocial.length > 0) {
        const socialData = sourceSocial.map(link => ({
          mini_site_id: miniSiteId,
          platform: link.platform,
          url: link.url
        }));

        const { error: socialError } = await supabase
          .from('mini_site_social_links')
          .insert(socialData);

        if (socialError) throw socialError;
      }

      toast({
        title: "Succès",
        description: "Mini-site importé avec succès"
      });

      // Refresh the mini-site data
      fetchMiniSite();
    } catch (error) {
      console.error('Error importing mini site:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'importer le mini-site",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    miniSite,
    loading,
    saveMiniSite,
    deleteMiniSite,
    fetchMiniSite,
    importMiniSite
  };
};