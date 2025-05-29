
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

export interface InvitationGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'guest';
  added_at: string;
}

export interface Invitation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  invited_by: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  blog_access: boolean | null;
  wishes_access: boolean | null;
  diary_access: boolean | null;
  life_story_access: boolean | null;
  group_id: string | null;
}

export interface BlogAlbum {
  id: string;
  name: string;
  description: string | null;
  author_id: string;
  created_at: string;
  profiles: Profile;
  thumbnail_url: string | null;
}

export interface WishAlbum {
  id: string;
  name: string;
  description: string | null;
  author_id: string;
  created_at: string;
  profiles: Profile;
  thumbnail_url: string | null;
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
  cover_image: string | null;
}

export interface WishPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  album_id: string | null;
  cover_image: string | null;
  first_name: string | null;
  email: string | null;
  age: string | null;
  location: string | null;
  request_type: string | null;
  custom_request_type: string | null;
  importance: string | null;
  date: string | null;
  needs: string | null;
  offering: string | null;
  attachment_url: string | null;
  profiles?: {
    display_name: string | null;
    email: string;
  };
  album?: {
    name: string;
  } | null;
}

export interface BlogMedia {
  id: string;
  post_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  thumbnail_url: string | null;
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
