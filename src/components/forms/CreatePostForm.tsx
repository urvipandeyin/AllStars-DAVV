import { useState } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { POST_TYPES, BROAD_INTERESTS, INTEREST_CATEGORIES } from '@/lib/constants';
import { createPost } from '@/integrations/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<keyof typeof POST_TYPES>('update');
  const [interestCategory, setInterestCategory] = useState('');
  const [subInterest, setSubInterest] = useState('');
  const [loading, setLoading] = useState(false);

  // Use user's interests for the dropdown, or all if none selected
  const availableInterests = profile?.interests?.length ? profile.interests : BROAD_INTERESTS;
  
  // Get sub-interests for selected category
  const availableSubInterests = interestCategory 
    ? INTEREST_CATEGORIES[interestCategory as keyof typeof INTEREST_CATEGORIES] || []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      await createPost({
        user_id: user.uid,
        content: content.trim(),
        post_type: postType,
        interest_category: interestCategory || null,
        sub_interest: subInterest || null,
      });

      setContent('');
      setPostType('update');
      setInterestCategory('');
      setSubInterest('');
      toast({ title: 'Post created!' });
      onPostCreated?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={postType} onValueChange={(v) => setPostType(v as keyof typeof POST_TYPES)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Post type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POST_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={interestCategory || "none"} onValueChange={(v) => { setInterestCategory(v === "none" ? "" : v); setSubInterest(''); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {availableInterests.map(interest => (
                  <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {interestCategory && availableSubInterests.length > 0 && (
              <Select value={subInterest || "none"} onValueChange={(v) => setSubInterest(v === "none" ? "" : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific activity</SelectItem>
                  {availableSubInterests.map(sub => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Textarea
            placeholder={
              postType === 'looking_for_team'
                ? "What kind of team are you looking for? What's your project about?"
                : postType === 'looking_for_collaborators'
                ? "What are you working on? What skills are you looking for?"
                : "Share an update, practice session, or anything on your mind..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !content.trim()} className="gap-2">
              <Send className="h-4 w-4" />
              Post
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
