
export type AppRole = 'admin' | 'editor' | 'reader';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  receive_contacts?: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface BlogAlbum {
  id: string;
  name: string;
  description: string | null;
  author_id: string;
  created_at: string;
  profiles: Profile;  // Cette propriété est nécessaire pour le typage
  thumbnail_url: string | null; // Nouvelle propriété pour la vignette
}

export interface BlogCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  album_id: string | null;
  publication_date?: string;
  cover_image?: string | null;
}

export interface BlogMedia {
  id: string;
  post_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface PostWithAuthor extends BlogPost {
  profiles: Profile;
}

export interface CommentWithAuthor extends BlogComment {
  profiles: Profile;
}

export interface PostWithCategories extends PostWithAuthor {
  categories: BlogCategory[];
}

export interface AlbumWithAuthor extends BlogAlbum {
  profiles: Profile;
}
