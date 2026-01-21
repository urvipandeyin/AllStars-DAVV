import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, MoreHorizontal, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { POST_TYPES, getInterestColor } from '@/lib/constants';
import {
  checkPostLiked, likePost, unlikePost, getComments, createComment, deletePost,
  checkCommentLiked, likeComment, unlikeComment, createReply, deleteComment
} from '@/integrations/firebase/db';
import { getProfileByUserId } from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/integrations/firebase/config';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc } from 'firebase/firestore';

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    post_type: 'looking_for_team' | 'looking_for_collaborators' | 'update';
    interest_category?: string | null;
    sub_interest?: string | null;
    likes_count: number;
    created_at: string;
    profiles?: {
      name: string;
      avatar_url: string | null;
    };
  };
  onDelete?: () => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentLikes, setCommentLikes] = useState<{ [key: string]: { liked: boolean; count: number } }>({});
  const [newComment, setNewComment] = useState('');

  const postType = POST_TYPES[post.post_type];
  const isOwner = user?.uid === post.user_id;

  // Real-time listener for post likes
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'posts', post.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLikesCount(data.likes_count || 0);
      }
    });
    return () => unsub();
  }, [post.id]);

  // Real-time check if user liked
  useEffect(() => {
    if (!user) return;
    let unsub: (() => void) | undefined;
    const q = query(
      collection(db, 'post_likes'),
      where('post_id', '==', post.id),
      where('user_id', '==', user.uid)
    );
    unsub = onSnapshot(q, (snap) => {
      setLiked(!snap.empty);
    });
    return () => unsub && unsub();
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) return;
    setLikeAnimating(true);
    if (liked) {
      await unlikePost(post.id, user.uid);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      await likePost(post.id, user.uid);
      setLikesCount(prev => prev + 1);
    }
    setTimeout(() => setLikeAnimating(false), 500);
  };

  useEffect(() => {
    if (!showComments) return;
    // Real-time listener for comments and likes
    const commentsQuery = query(
      collection(db, 'comments'),
      where('post_id', '==', post.id),
      orderBy('created_at', 'asc')
    );
    const unsubscribeComments = onSnapshot(commentsQuery, async (snapshot) => {
      const data = await Promise.all(snapshot.docs.map(async (doc) => {
        const comment = { id: doc.id, ...(doc.data() as import('@/integrations/firebase/types').Comment) };
        let profile = null;
        if (comment.user_id) {
          try {
            profile = await getProfileByUserId(comment.user_id);
          } catch {}
        }
        return { ...comment, profiles: profile ? { name: profile.name, avatar_url: profile.avatar_url } : undefined };
      }));
      setComments(data || []);
      // Real-time likes for each comment
      const likesObj: { [key: string]: { liked: boolean; count: number } } = {};
      await Promise.all(data.map(async (comment) => {
        const likesQuery = query(
          collection(db, 'comment_likes'),
          where('comment_id', '==', comment.id)
        );
        const likesSnap = await getDocs(likesQuery);
        likesObj[comment.id] = {
          liked: user ? likesSnap.docs.some(doc => doc.data().user_id === user.uid) : false,
          count: likesSnap.size,
        };
      }));
      setCommentLikes(likesObj);
    });
    return () => unsubscribeComments();
    // eslint-disable-next-line
  }, [showComments, user, post.id]);

  // Fallback: manual reload for actions
  const loadComments = async () => {
    const data = await getComments(post.id);
    setComments(data || []);
    const likesObj: { [key: string]: { liked: boolean; count: number } } = {};
    for (const comment of data) {
      likesObj[comment.id] = {
        liked: user ? await checkCommentLiked(comment.id, user.uid) : false,
        count: comment.likes_count || 0,
      };
    }
    setCommentLikes(likesObj);
  };
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (replyTo && replyText.trim()) {
      // Reply to a comment
      try {
        await createReply({
          post_id: post.id,
          user_id: user.uid,
          content: replyText.trim(),
          parent_comment_id: replyTo,
        });
        setReplyText('');
        setReplyTo(null);
        loadComments();
      } catch (error) {
        console.error('Error creating reply:', error);
      }
      return;
    }
    if (!newComment.trim()) return;
    try {
      await createComment({
        post_id: post.id,
        user_id: user.uid,
        content: newComment.trim(),
      });
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;
    const liked = commentLikes[commentId]?.liked;
    if (liked) {
      await unlikeComment(commentId, user.uid);
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          liked: false,
          count: Math.max(0, (prev[commentId]?.count || 1) - 1),
        },
      }));
    } else {
      await likeComment(commentId, user.uid);
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          liked: true,
          count: (prev[commentId]?.count || 0) + 1,
        },
      }));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId && c.parent_comment_id !== commentId));
      setCommentLikes(prev => {
        const newLikes = { ...prev };
        delete newLikes[commentId];
        return newLikes;
      });
    } catch (e) {
      toast({ title: 'Failed to delete comment', variant: 'destructive' });
    }
  };


  const handleDelete = async () => {
    if (!isOwner) return;

    try {
      await deletePost(post.id);
      toast({ title: 'Post deleted' });
      onDelete?.();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  return (
    <Card className="card-hover animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/user/${post.user_id}`}>
              <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                <AvatarImage src={post.profiles?.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-medium">
                  {post.profiles?.name?.slice(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/user/${post.user_id}`}>
                <h4 className="font-semibold hover:text-primary transition-colors">
                  {post.profiles?.name || 'Unknown User'}
                </h4>
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              post.post_type === 'looking_for_team' && 'bg-primary/10 text-primary',
              post.post_type === 'looking_for_collaborators' && 'bg-secondary/10 text-secondary',
              post.post_type === 'update' && 'bg-accent/10 text-accent'
            )}>
              {postType.label}
            </span>

            {post.interest_category && (
              <span className={cn(
                'text-xs px-2 py-1 rounded-full font-medium border',
                getInterestColor(post.interest_category)
              )}>
                {post.interest_category}
                {post.sub_interest && ` · ${post.sub_interest}`}
              </span>
            )}

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
      </CardContent>

      <CardFooter className="flex-col items-stretch pt-0">
        <div className="flex items-center gap-4 border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn('gap-2', liked && 'text-red-500', likeAnimating && 'animate-ping-fast')}
            style={{ position: 'relative' }}
          >
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <Heart className={cn('h-4 w-4', liked && 'fill-current', likeAnimating && 'scale-125 transition-transform duration-300')} />
              {/* Heart burst animation */}
              {likeAnimating && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                  className="animate-heart-burst"
                >
                  <Heart className="h-4 w-4 text-red-400 opacity-50" />
                </span>
              )}
            </span>
            {likesCount}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleComments}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Comments
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {/* Build a map of commentId -> replies */}
            {(() => {
              // Build a map of commentId -> replies
              const commentMap: { [key: string]: any[] } = {};
              comments.forEach(c => {
                if (c.parent_comment_id) {
                  if (!commentMap[c.parent_comment_id]) commentMap[c.parent_comment_id] = [];
                  commentMap[c.parent_comment_id].push(c);
                }
              });

              function renderComment(comment: any) {
                const isCommentOwner = user && comment.user_id === user.uid;
                return (
                  <div key={comment.id} className="flex gap-2 items-start">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {comment.profiles?.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{comment.profiles?.name}</p>
                        <button
                          className={cn('text-xs flex items-center gap-1', commentLikes[comment.id]?.liked && 'text-red-500')}
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          <Heart className={cn('h-3 w-3', commentLikes[comment.id]?.liked && 'fill-current')} />
                          {commentLikes[comment.id]?.count || 0}
                        </button>
                        <button
                          className="text-xs text-primary ml-2"
                          onClick={() => {
                            setReplyTo(comment.id);
                            setReplyText('');
                          }}
                        >Reply</button>
                        {isCommentOwner && (
                          <button
                            className="ml-2 text-xs text-destructive flex items-center gap-1"
                            title="Delete comment"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <X className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                      {/* Replies */}
                      {commentMap[comment.id]?.length > 0 && (
                        <div className="ml-6 mt-2 space-y-2">
                          {commentMap[comment.id].map(renderComment)}
                        </div>
                      )}
                      {/* Reply input */}
                      {replyTo === comment.id && (
                        <form
                          onSubmit={handleComment}
                          className="flex gap-2 mt-2"
                        >
                          <input
                            type="text"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 px-2 py-1 bg-background rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <Button type="submit" size="sm" disabled={!replyText.trim()}>
                            Reply
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                            Cancel
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              }
              return comments.filter(c => !c.parent_comment_id).map(renderComment);
            })()}
            {/* New comment input */}
            <form onSubmit={handleComment} className="flex gap-2 mt-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={!!replyTo}
              />
              <Button type="submit" size="sm" disabled={!newComment.trim() || !!replyTo}>
                Send
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );

}
