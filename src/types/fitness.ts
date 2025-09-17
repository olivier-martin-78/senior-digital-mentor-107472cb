export interface FitnessCategory {
  id: string;
  name: string;
  is_predefined: boolean;
  created_at: string;
  created_by: string | null;
}

export interface FitnessArticle {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  category_id: string;
  image_url: string | null;
  author_id: string;
  published: boolean;
  view_count: number;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface FitnessArticleWithCategory extends FitnessArticle {
  fitness_categories: {
    id: string;
    name: string;
    is_predefined: boolean;
  };
}

export interface FitnessArticleView {
  id: string;
  article_id: string;
  user_id: string | null;
  ip_address: string | null;
  viewed_at: string;
}