import { supabase } from "@/integrations/supabase/client";
import { HomepageSlide } from "@/hooks/useHomepageSlides";

export interface CreateSlideData {
  title: string;
  image_url: string;
  button_text?: string;
  button_link?: string;
  display_order: number;
}

export interface UpdateSlideData extends Partial<CreateSlideData> {
  is_active?: boolean;
}

export const homepageSlideService = {
  create: async (data: CreateSlideData): Promise<HomepageSlide> => {
    const { data: slide, error } = await supabase
      .from("homepage_slides")
      .insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id || "",
      })
      .select()
      .single();

    if (error) throw error;
    return slide;
  },

  update: async (id: string, data: UpdateSlideData): Promise<HomepageSlide> => {
    const { data: slide, error } = await supabase
      .from("homepage_slides")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return slide;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("homepage_slides")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  reorder: async (slides: { id: string; display_order: number }[]): Promise<void> => {
    const updates = slides.map(slide =>
      supabase
        .from("homepage_slides")
        .update({ display_order: slide.display_order })
        .eq("id", slide.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      throw new Error("Failed to reorder slides");
    }
  },

  uploadImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `homepage-slides/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('blog-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};