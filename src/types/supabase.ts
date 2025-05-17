
export type AppRole = 'admin' | 'editor' | 'reader';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  published: boolean;
  created_at: string;
  updated_at: string;
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
