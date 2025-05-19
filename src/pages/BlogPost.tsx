
import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useBlogPost } from '@/hooks/useBlogPost';
import PostHeader from '@/components/blog/PostHeader';
import PostMedia from '@/components/blog/PostMedia';
import CommentForm from '@/components/blog/CommentForm';
import CommentList from '@/components/blog/CommentList';
import AlbumThumbnail from '@/components/blog/AlbumThumbnail';

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const {
    post,
    album,
    categories,
    media,
    comments,
    loading,
    addComment,
    deleteComment
  } = useBlogPost(id as string);

  const handleCommentSubmit = async (content: string) => {
    if (!user) return;
    await addComment(content, user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-4">Article non trouvé</h1>
          <p className="mb-8 text-gray-600">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
          <Button asChild>
            <Link to="/blog">Retour au blog</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Si l'article n'est pas publié et que l'utilisateur n'est pas l'auteur ou admin
  if (!post.published && (!user || (user.id !== post.author_id && !hasRole('admin')))) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-4">Article non publié</h1>
          <p className="mb-8 text-gray-600">Cet article n'est pas encore publié.</p>
          <Button asChild>
            <Link to="/blog">Retour au blog</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 flex justify-between items-center">
          <Link to="/blog" className="text-tranches-sage hover:underline">
            &larr; Retour au blog
          </Link>
          {(user?.id === post.author_id || hasRole('admin')) && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to={`/blog/edit/${post.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </Button>
            </div>
          )}
        </div>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Album thumbnail */}
          <AlbumThumbnail album={album} title={post.title} />

          <div className="p-6">
            {/* Post header with title, author, date, categories */}
            <PostHeader 
              title={post.title}
              isPublished={post.published}
              authorProfile={post.profiles}
              createdAt={post.created_at}
              album={album}
              categories={categories}
            />

            {/* Media gallery */}
            <PostMedia media={media} />

            {/* Post Content */}
            <div className="prose max-w-none">
              {post.content.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-serif text-tranches-charcoal mb-6">Commentaires ({comments.length})</h2>
          
          {/* Comment Form */}
          <CommentForm 
            user={user}
            profile={profile}
            onSubmit={handleCommentSubmit}
          />

          {/* Comment List */}
          <CommentList 
            comments={comments}
            currentUserId={user?.id}
            isAdmin={hasRole('admin')}
            onDelete={deleteComment}
          />
        </section>
      </div>
    </div>
  );
};

export default BlogPost;
