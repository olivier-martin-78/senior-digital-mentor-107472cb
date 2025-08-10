import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomepageSlide {
  id: string;
  title: string;
  image_url: string;
  button_text?: string;
  button_link?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const useHomepageSlides = () => {
  return useQuery({
    queryKey: ["homepage-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HomepageSlide[];
    },
  });
};

export const useHomepageSlidesAdmin = () => {
  return useQuery({
    queryKey: ["homepage-slides-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HomepageSlide[];
    },
  });
};