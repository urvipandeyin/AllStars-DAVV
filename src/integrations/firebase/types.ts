// Type definitions for Firebase collections

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  interests: string[]; // Broad interest categories
  sub_interests: string[]; // Specific sub-interests within categories
  skill_level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  city: string | null;
  looking_for: 'Team' | 'Collaborators' | 'Exploring' | null;
  student_type: 'Hosteler' | 'Localite' | null;
  department: string | null;
  branch: string | null;
  year: string | null;
  avatar_url: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: 'looking_for_team' | 'looking_for_collaborators' | 'update';
  interest_category: string | null; // Which broad interest this post relates to
  sub_interest: string | null; // Specific sub-interest tag
  likes_count: number;
  created_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}


export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_comment_id?: string | null; // For replies, null for top-level comments
  likes_count?: number; // For comment likes
  replies_count?: number; // For reply count
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  interest: string; // Broad interest category
  sub_interest: string | null; // Specific sub-interest tag
  is_open: boolean;
  member_count: number;
  creator_id: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  status: 'approved' | 'pending';
  joined_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string; // Who receives the notification
  from_user_id: string; // Who triggered the notification
  type:
    | 'message'
    | 'follow'
    | 'like' // post like
    | 'comment' // post comment
    | 'comment_like' // like on comment
    | 'reply' // reply to comment
    | 'reply_like'; // like on reply
  content: string;
  read: boolean;
  link?: string; // Optional link to navigate to
  created_at: string;
}
