// ============ DELETE COMMENT ============
/**
 * Deletes a comment or reply and all its child replies and likes.
 */
export async function deleteComment(commentId: string): Promise<void> {
  // Delete the comment itself
  await deleteDoc(doc(db, collections.comments, commentId));
  // Delete all likes for this comment
  const likesQ = query(
    collection(db, collections.commentLikes),
    where('comment_id', '==', commentId)
  );
  const likesSnap = await getDocs(likesQ);
  await Promise.all(likesSnap.docs.map(docSnap => deleteDoc(docSnap.ref)));
  // Delete all replies to this comment (recursive, but only one level deep for now)
  const repliesQ = query(
    collection(db, collections.comments),
    where('parent_comment_id', '==', commentId)
  );
  const repliesSnap = await getDocs(repliesQ);
  await Promise.all(repliesSnap.docs.map(docSnap => deleteComment(docSnap.id)));
}
export async function likeComment(commentId: string, userId: string): Promise<void> {
  await addDoc(collection(db, collections.commentLikes), {
    comment_id: commentId,
    user_id: userId,
    created_at: serverTimestamp(),
  });
  // Increment likes_count on the comment
  await updateDoc(doc(db, collections.comments, commentId), {
    likes_count: increment(1),
  });
  // Send notification to comment owner (if not self)
  try {
    const commentSnap = await getDoc(doc(db, collections.comments, commentId));
    if (commentSnap.exists()) {
      const commentData = commentSnap.data();
      if (commentData.user_id !== userId) {
        const likerProfile = await getProfileByUserId(userId);
        await createNotification({
          user_id: commentData.user_id,
          from_user_id: userId,
          type: 'comment_like',
          content: `${likerProfile?.name || 'Someone'} liked your comment`,
          link: `/post/${commentData.post_id}`,
        });
      }
    }
  } catch (error) {
    console.error('Failed to create comment like notification:', error);
  }
}
export async function unlikeComment(commentId: string, userId: string): Promise<void> {
  const q = query(
    collection(db, collections.commentLikes),
    where('comment_id', '==', commentId),
    where('user_id', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    await deleteDoc(snapshot.docs[0].ref);
    await updateDoc(doc(db, collections.comments, commentId), {
      likes_count: increment(-1),
    });
  }
}
export async function createReply(reply: Omit<Comment, 'id' | 'created_at'>): Promise<void> {
  // reply.parent_comment_id must be set
  await addDoc(collection(db, collections.comments), {
    ...reply,
    created_at: serverTimestamp(),
  });
  // Increment replies_count on parent comment
  if (reply.parent_comment_id) {
    await updateDoc(doc(db, collections.comments, reply.parent_comment_id), {
      replies_count: increment(1),
    });
    // Send notification to parent comment owner (if not self)
    try {
      const parentSnap = await getDoc(doc(db, collections.comments, reply.parent_comment_id));
      if (parentSnap.exists()) {
        const parentData = parentSnap.data();
        if (parentData.user_id !== reply.user_id) {
          const replierProfile = await getProfileByUserId(reply.user_id);
          await createNotification({
            user_id: parentData.user_id,
            from_user_id: reply.user_id,
            type: 'reply',
            content: `${replierProfile?.name || 'Someone'} replied to your comment`,
            link: `/post/${reply.post_id}`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to create reply notification:', error);
    }
  }
}
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  increment,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import type { Profile, Post, Comment, PostLike, Group, GroupMember, GroupMessage, DirectMessage, Follow, Notification } from './types';

// Timeout wrapper for Firestore queries (10 second timeout)
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

// Collection references
export const collections = {
  profiles: 'profiles',
  posts: 'posts',
  postLikes: 'post_likes',
  comments: 'comments',
  commentLikes: 'comment_likes',
  groups: 'groups',
  groupMembers: 'group_members',
  groupMessages: 'group_messages',
  directMessages: 'direct_messages',
  follows: 'follows',
  notifications: 'notifications',
} as const;
// ============ COMMENT LIKES ============

export async function checkCommentLiked(commentId: string, userId: string): Promise<boolean> {
  const q = query(
    collection(db, collections.commentLikes),
    where('comment_id', '==', commentId),
    where('user_id', '==', userId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}



// Helper to convert Firestore timestamp to ISO string
const toISOString = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

// Helper to convert Firestore doc to typed object with id
const docToData = <T extends { id: string }>(doc: DocumentData): T => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    created_at: toISOString(data.created_at),
    updated_at: data.updated_at ? toISOString(data.updated_at) : undefined,
    joined_at: data.joined_at ? toISOString(data.joined_at) : undefined,
    last_message_at: data.last_message_at ? toISOString(data.last_message_at) : undefined,
  } as T;
};

// Simple in-memory cache for profiles (5 min TTL)
const profileCache = new Map<string, { profile: Profile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(userId: string): Profile | null {
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.profile;
  }
  return null;
}

function setCachedProfile(userId: string, profile: Profile): void {
  profileCache.set(userId, { profile, timestamp: Date.now() });
}

// Export function to clear cache for a user
export function clearProfileCache(userId: string): void {
  profileCache.delete(userId);
}

// ============ PROFILES ============

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  // Check cache first
  const cached = getCachedProfile(userId);
  if (cached) return cached;
  
  try {
    const q = query(collection(db, collections.profiles), where('user_id', '==', userId));
    const snapshot = await withTimeout(getDocs(q), 8000);
    if (snapshot.empty) return null;
    
    const profile = docToData<Profile>(snapshot.docs[0]);
    setCachedProfile(userId, profile);
    return profile;
  } catch (error) {
    console.error('getProfileByUserId error:', error);
    return null;
  }
}

export async function createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
  const docRef = await addDoc(collection(db, collections.profiles), {
    ...profile,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  const newDoc = await getDoc(docRef);
  const newProfile = docToData<Profile>(newDoc);
  
  // Cache the new profile
  setCachedProfile(profile.user_id, newProfile);
  return newProfile;
}

export async function updateProfile(profileId: string, updates: Partial<Profile>): Promise<void> {
  const docRef = doc(db, collections.profiles, profileId);
  
  // Remove undefined values to avoid overwriting with undefined
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );
  
  await updateDoc(docRef, {
    ...cleanUpdates,
    updated_at: serverTimestamp(),
  });
  
  // Invalidate cache - need to fetch the doc to get user_id for cache key
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userId = docSnap.data().user_id;
      if (userId) {
        profileCache.delete(userId);
      }
    }
  } catch (e) {
    // Cache invalidation failure is not critical
    console.warn('Failed to invalidate profile cache:', e);
  }
}

export async function getProfiles(excludeUserId?: string, filters?: { interest?: string; skillLevel?: string; interests?: string[] }, maxResults = 50): Promise<Profile[]> {
  try {
    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc'), limit(maxResults)];
    
    if (filters?.skillLevel && filters.skillLevel !== 'all') {
      constraints.unshift(where('skill_level', '==', filters.skillLevel));
    }
    
    const q = query(collection(db, collections.profiles), ...constraints);
    const snapshot = await withTimeout(getDocs(q), 8000);
    
    let profiles = snapshot.docs.map(doc => docToData<Profile>(doc));
    
    // Filter client-side for excludeUserId and interests (Firestore doesn't support array-contains with other where clauses well)
    if (excludeUserId) {
      profiles = profiles.filter(p => p.user_id !== excludeUserId);
    }
    
    // Filter by single interest
    if (filters?.interest && filters.interest !== 'all') {
      profiles = profiles.filter(p => p.interests?.includes(filters.interest!));
    }
    
    // Filter by shared interests (at least one overlap)
    if (filters?.interests && filters.interests.length > 0) {
      profiles = profiles.filter(p => 
        p.interests?.some(interest => filters.interests!.includes(interest))
      );
    }
    
    // Only return profiles that are completed
    profiles = profiles.filter(p => p.profile_completed);
    
    return profiles;
  } catch (error) {
    console.error('getProfiles error:', error);
    return [];
  }
}

// ============ POSTS ============

export async function getPosts(filters?: { interests?: string[]; subInterests?: string[] }, maxResults = 50): Promise<(Post & { profiles?: { name: string; avatar_url: string | null } })[]> {
  try {
    const q = query(collection(db, collections.posts), orderBy('created_at', 'desc'), limit(maxResults));
    const snapshot = await withTimeout(getDocs(q), 8000);
    
    // Get all posts first
    const postsData = snapshot.docs.map(docSnapshot => docToData<Post>(docSnapshot));
    
    // If no posts, return early
    if (postsData.length === 0) return [];
    
    // Get unique user IDs and batch fetch profiles (with timeout per profile)
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const profilesMap = new Map<string, { name: string; avatar_url: string | null }>();
    
    // Fetch profiles in parallel with individual error handling
    await Promise.all(
      userIds.slice(0, 10).map(async (userId) => { // Limit to 10 unique users
        try {
          const profile = await getProfileByUserId(userId);
          if (profile) {
            profilesMap.set(userId, { name: profile.name, avatar_url: profile.avatar_url });
          }
        } catch {
          // Skip failed profile fetches
        }
      })
    );
  
    // Map posts with their profiles
    let posts = postsData.map(post => ({
      ...post,
      profiles: profilesMap.get(post.user_id),
    }));
  
    // Filter by user's interests if provided
    if (filters?.interests && filters.interests.length > 0) {
      posts = posts.filter(post => 
        !post.interest_category || filters.interests!.includes(post.interest_category)
      );
    }
  
    // Additional filter by sub-interests
    if (filters?.subInterests && filters.subInterests.length > 0) {
      posts = posts.filter(post => 
        !post.sub_interest || filters.subInterests!.includes(post.sub_interest)
      );
    }
  
    return posts;
  } catch (error) {
    console.error('getPosts error:', error);
    return [];
  }
}

export async function getPostsByUserId(userId: string, maxResults = 10): Promise<(Post & { profiles?: { name: string; avatar_url: string | null } })[]> {
  const q = query(
    collection(db, collections.posts),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);
  
  // Fetch the user's profile once
  const profile = await getProfileByUserId(userId);
  const profileData = profile ? { name: profile.name, avatar_url: profile.avatar_url } : undefined;
  
  const posts = snapshot.docs.map(docSnapshot => {
    const post = docToData<Post>(docSnapshot);
    return {
      ...post,
      profiles: profileData,
    };
  });
  
  return posts;
}

export async function createPost(post: Omit<Post, 'id' | 'created_at' | 'likes_count'>): Promise<void> {
  await addDoc(collection(db, collections.posts), {
    ...post,
    interest_category: post.interest_category || null,
    sub_interest: post.sub_interest || null,
    likes_count: 0,
    created_at: serverTimestamp(),
  });
}

export async function deletePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, collections.posts, postId));
}

// ============ POST LIKES ============

export async function checkPostLiked(postId: string, userId: string): Promise<boolean> {
  const q = query(
    collection(db, collections.postLikes),
    where('post_id', '==', postId),
    where('user_id', '==', userId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function likePost(postId: string, userId: string): Promise<void> {
  await addDoc(collection(db, collections.postLikes), {
    post_id: postId,
    user_id: userId,
    created_at: serverTimestamp(),
  });
  // Increment likes count on the post
  await updateDoc(doc(db, collections.posts, postId), {
    likes_count: increment(1),
  });

  // Send notification to post owner
  try {
    const postSnap = await getDoc(doc(db, collections.posts, postId));
    if (postSnap.exists()) {
      const postData = postSnap.data();
      if (postData.user_id !== userId) { // Don't notify if user likes their own post
        const likerProfile = await getProfileByUserId(userId);
        await createNotification({
          user_id: postData.user_id,
          from_user_id: userId,
          type: 'like',
          content: `${likerProfile?.name || 'Someone'} liked your post`,
          link: `/post/${postId}`,
        });
      }
    }
  } catch (error) {
    console.error('Failed to create like notification:', error);
  }
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const q = query(
    collection(db, collections.postLikes),
    where('post_id', '==', postId),
    where('user_id', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    await deleteDoc(snapshot.docs[0].ref);
    await updateDoc(doc(db, collections.posts, postId), {
      likes_count: increment(-1),
    });
  }
}

// ============ COMMENTS ============

export async function getComments(postId: string): Promise<(Comment & { profiles?: { name: string; avatar_url: string | null } })[]> {
  const q = query(
    collection(db, collections.comments),
    where('post_id', '==', postId),
    orderBy('created_at', 'asc')
  );
  const snapshot = await getDocs(q);
  
  const comments = await Promise.all(
    snapshot.docs.map(async (docSnapshot) => {
      const comment = docToData<Comment>(docSnapshot);
      const profile = await getProfileByUserId(comment.user_id);
      return {
        ...comment,
        profiles: profile ? { name: profile.name, avatar_url: profile.avatar_url } : undefined,
      };
    })
  );
  
  return comments;
}

export async function createComment(comment: Omit<Comment, 'id' | 'created_at'>): Promise<void> {
  await addDoc(collection(db, collections.comments), {
    ...comment,
    created_at: serverTimestamp(),
  });
  // Increment comments_count on the post
  await updateDoc(doc(db, collections.posts, comment.post_id), {
    comments_count: increment(1),
  });
  // Send notification to post owner
  try {
    const postSnap = await getDoc(doc(db, collections.posts, comment.post_id));
    if (postSnap.exists()) {
      const postData = postSnap.data();
      if (postData.user_id !== comment.user_id) { // Don't notify if user comments on their own post
        const commenterProfile = await getProfileByUserId(comment.user_id);
        await createNotification({
          user_id: postData.user_id,
          from_user_id: comment.user_id,
          type: 'comment',
          content: `${commenterProfile?.name || 'Someone'} commented on your post`,
          link: `/post/${comment.post_id}`,
        });
      }
    }
  } catch (error) {
    console.error('Failed to create comment notification:', error);
  }
}

// ============ GROUPS ============

export async function getGroups(filters?: { interests?: string[]; subInterests?: string[] }, maxResults = 50): Promise<Group[]> {
  try {
    const q = query(collection(db, collections.groups), orderBy('member_count', 'desc'), limit(maxResults));
    const snapshot = await withTimeout(getDocs(q), 8000);
    let groups = snapshot.docs.map(doc => docToData<Group>(doc));
    
    // Filter by user's interests if provided
    if (filters?.interests && filters.interests.length > 0) {
      groups = groups.filter(group => 
        filters.interests!.includes(group.interest)
      );
    }
    
    // Additional filter by sub-interests
    if (filters?.subInterests && filters.subInterests.length > 0) {
      groups = groups.filter(group => 
        !group.sub_interest || filters.subInterests!.includes(group.sub_interest)
      );
    }
    
    return groups;
  } catch (error) {
    console.error('getGroups error:', error);
    return [];
  }
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const docRef = doc(db, collections.groups, groupId);
  const docSnapshot = await getDoc(docRef);
  if (!docSnapshot.exists()) return null;
  return docToData<Group>(docSnapshot);
}

export async function createGroup(group: Omit<Group, 'id' | 'created_at' | 'member_count'>): Promise<Group> {
  const docRef = await addDoc(collection(db, collections.groups), {
    ...group,
    member_count: 1,
    created_at: serverTimestamp(),
  });
  const newDoc = await getDoc(docRef);
  return docToData<Group>(newDoc);
}

export async function incrementGroupMemberCount(groupId: string, value: number): Promise<void> {
  await updateDoc(doc(db, collections.groups, groupId), {
    member_count: increment(value),
  });
}

// ============ GROUP MEMBERS ============

export async function getGroupMembers(groupId: string, status = 'approved'): Promise<(GroupMember & { profiles?: { name: string; avatar_url: string | null } })[]> {
  const q = query(
    collection(db, collections.groupMembers),
    where('group_id', '==', groupId),
    where('status', '==', status)
  );
  const snapshot = await getDocs(q);
  
  const members = await Promise.all(
    snapshot.docs.map(async (docSnapshot) => {
      const member = docToData<GroupMember>(docSnapshot);
      const profile = await getProfileByUserId(member.user_id);
      return {
        ...member,
        profiles: profile ? { name: profile.name, avatar_url: profile.avatar_url } : undefined,
      };
    })
  );
  
  return members;
}

export async function getUserGroupMemberships(userId: string): Promise<string[]> {
  const q = query(
    collection(db, collections.groupMembers),
    where('user_id', '==', userId),
    where('status', '==', 'approved')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().group_id);
}

export async function checkGroupMembership(groupId: string, userId: string): Promise<boolean> {
  const q = query(
    collection(db, collections.groupMembers),
    where('group_id', '==', groupId),
    where('user_id', '==', userId),
    where('status', '==', 'approved')
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function joinGroup(groupId: string, userId: string, isOpen: boolean, role = 'member'): Promise<void> {
  await addDoc(collection(db, collections.groupMembers), {
    group_id: groupId,
    user_id: userId,
    role,
    status: isOpen ? 'approved' : 'pending',
    joined_at: serverTimestamp(),
  });
  if (isOpen) {
    await incrementGroupMemberCount(groupId, 1);
  }
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const q = query(
    collection(db, collections.groupMembers),
    where('group_id', '==', groupId),
    where('user_id', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const wasApproved = snapshot.docs[0].data().status === 'approved';
    await deleteDoc(snapshot.docs[0].ref);
    if (wasApproved) {
      await incrementGroupMemberCount(groupId, -1);
    }
  }
}

// ============ GROUP MESSAGES ============

export async function getGroupMessages(groupId: string): Promise<(GroupMessage & { profiles?: { name: string; avatar_url: string | null } })[]> {
  const q = query(
    collection(db, collections.groupMessages),
    where('group_id', '==', groupId),
    orderBy('created_at', 'asc')
  );
  const snapshot = await getDocs(q);
  
  const messages = await Promise.all(
    snapshot.docs.map(async (docSnapshot) => {
      const message = docToData<GroupMessage>(docSnapshot);
      const profile = await getProfileByUserId(message.user_id);
      return {
        ...message,
        profiles: profile ? { name: profile.name, avatar_url: profile.avatar_url } : undefined,
      };
    })
  );
  
  return messages;
}

export async function sendGroupMessage(message: Omit<GroupMessage, 'id' | 'created_at'>): Promise<void> {
  await addDoc(collection(db, collections.groupMessages), {
    ...message,
    created_at: serverTimestamp(),
  });
}

export function subscribeToGroupMessages(groupId: string, callback: (messages: GroupMessage[]) => void) {
  const q = query(
    collection(db, collections.groupMessages),
    where('group_id', '==', groupId),
    orderBy('created_at', 'asc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const messages = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const message = docToData<GroupMessage>(docSnapshot);
        const profile = await getProfileByUserId(message.user_id);
        return {
          ...message,
          profiles: profile ? { name: profile.name, avatar_url: profile.avatar_url } : undefined,
        };
      })
    );
    callback(messages);
  });
}

// ============ DIRECT MESSAGES ============

export async function getDirectMessages(userId: string, otherUserId: string): Promise<DirectMessage[]> {
  const q = query(
    collection(db, collections.directMessages),
    orderBy('created_at', 'asc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => docToData<DirectMessage>(doc))
    .filter(msg => 
      (msg.sender_id === userId && msg.receiver_id === otherUserId) ||
      (msg.sender_id === otherUserId && msg.receiver_id === userId)
    );
}

export async function sendDirectMessage(message: Omit<DirectMessage, 'id' | 'created_at' | 'read'>): Promise<void> {
  await addDoc(collection(db, collections.directMessages), {
    ...message,
    read: false,
    created_at: serverTimestamp(),
  });

  // Send notification to receiver
  try {
    const senderProfile = await getProfileByUserId(message.sender_id);
    await createNotification({
      user_id: message.receiver_id,
      from_user_id: message.sender_id,
      type: 'message',
      content: `${senderProfile?.name || 'Someone'} sent you a message`,
      link: `/messages/${message.sender_id}`,
    });
  } catch (error) {
    console.error('Failed to create message notification:', error);
  }
}

export async function markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
  const q = query(
    collection(db, collections.directMessages),
    where('sender_id', '==', senderId),
    where('receiver_id', '==', receiverId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  
  await Promise.all(
    snapshot.docs.map(docSnapshot => 
      updateDoc(docSnapshot.ref, { read: true })
    )
  );
}

export async function getConversations(userId: string): Promise<{
  user_id: string;
  name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread: boolean;
}[]> {
  try {
    // Get messages where user is sender
    const sentQuery = query(
      collection(db, collections.directMessages),
      where('sender_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    // Get messages where user is receiver
    const receivedQuery = query(
      collection(db, collections.directMessages),
      where('receiver_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery)
    ]);
    
    const convMap = new Map<string, {
      user_id: string;
      last_message: string;
      last_message_at: string;
      unread: boolean;
    }>();
    
    // Process sent messages
    sentSnapshot.docs.forEach(docSnapshot => {
      const msg = docToData<DirectMessage>(docSnapshot);
      const partnerId = msg.receiver_id;
      
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          user_id: partnerId,
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread: false,
        });
      }
    });
    
    // Process received messages
    receivedSnapshot.docs.forEach(docSnapshot => {
      const msg = docToData<DirectMessage>(docSnapshot);
      const partnerId = msg.sender_id;
      
      const existing = convMap.get(partnerId);
      if (!existing) {
        convMap.set(partnerId, {
          user_id: partnerId,
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread: !msg.read,
        });
      } else {
        // Update if this message is newer
        if (new Date(msg.created_at) > new Date(existing.last_message_at)) {
          convMap.set(partnerId, {
            user_id: partnerId,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread: !msg.read,
          });
        }
      }
    });
    
    const conversations = await Promise.all(
      Array.from(convMap.values()).map(async (conv) => {
        const profile = await getProfileByUserId(conv.user_id);
        return {
          ...conv,
          name: profile?.name || 'Unknown',
          avatar_url: profile?.avatar_url || null,
        };
      })
    );
    
    // Sort by last message time
    return conversations.sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  } catch (error) {
    console.error('getConversations error:', error);
    return [];
  }
}

export function subscribeToDirectMessages(userId: string, callback: (messages: DirectMessage[]) => void) {
  // Subscribe to messages where user is sender
  const sentQuery = query(
    collection(db, collections.directMessages),
    where('sender_id', '==', userId),
    orderBy('created_at', 'asc')
  );
  
  // Subscribe to messages where user is receiver
  const receivedQuery = query(
    collection(db, collections.directMessages),
    where('receiver_id', '==', userId),
    orderBy('created_at', 'asc')
  );
  
  let sentMessages: DirectMessage[] = [];
  let receivedMessages: DirectMessage[] = [];
  
  const updateCallback = () => {
    const allMessages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    callback(allMessages);
  };
  
  const unsubSent = onSnapshot(sentQuery, (snapshot) => {
    sentMessages = snapshot.docs.map(doc => docToData<DirectMessage>(doc));
    updateCallback();
  });
  
  const unsubReceived = onSnapshot(receivedQuery, (snapshot) => {
    receivedMessages = snapshot.docs.map(doc => docToData<DirectMessage>(doc));
    updateCallback();
  });
  
  return () => {
    unsubSent();
    unsubReceived();
  };
}

// ============ FOLLOWS ============

export async function checkFollowStatus(followerId: string, followingId: string): Promise<boolean> {
  const q = query(
    collection(db, collections.follows),
    where('follower_id', '==', followerId),
    where('following_id', '==', followingId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const followersQuery = query(
    collection(db, collections.follows),
    where('following_id', '==', userId)
  );
  const followingQuery = query(
    collection(db, collections.follows),
    where('follower_id', '==', userId)
  );
  
  const [followersSnapshot, followingSnapshot] = await Promise.all([
    getDocs(followersQuery),
    getDocs(followingQuery),
  ]);
  
  return {
    followers: followersSnapshot.size,
    following: followingSnapshot.size,
  };
}

// Get list of followers with their profiles
export async function getFollowers(userId: string): Promise<Profile[]> {
  try {
    const q = query(
      collection(db, collections.follows),
      where('following_id', '==', userId)
    );
    const snapshot = await withTimeout(getDocs(q), 8000);
    
    const followerIds = snapshot.docs.map(doc => doc.data().follower_id);
    if (followerIds.length === 0) return [];
    
    const profiles = await Promise.all(
      followerIds.map(id => getProfileByUserId(id))
    );
    
    return profiles.filter((p): p is Profile => p !== null);
  } catch (error) {
    console.error('getFollowers error:', error);
    return [];
  }
}

// Get list of following with their profiles
export async function getFollowing(userId: string): Promise<Profile[]> {
  try {
    const q = query(
      collection(db, collections.follows),
      where('follower_id', '==', userId)
    );
    const snapshot = await withTimeout(getDocs(q), 8000);
    
    const followingIds = snapshot.docs.map(doc => doc.data().following_id);
    if (followingIds.length === 0) return [];
    
    const profiles = await Promise.all(
      followingIds.map(id => getProfileByUserId(id))
    );
    
    return profiles.filter((p): p is Profile => p !== null);
  } catch (error) {
    console.error('getFollowing error:', error);
    return [];
  }
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  await addDoc(collection(db, collections.follows), {
    follower_id: followerId,
    following_id: followingId,
    created_at: serverTimestamp(),
  });

  // Send notification to the followed user
  try {
    const followerProfile = await getProfileByUserId(followerId);
    await createNotification({
      user_id: followingId,
      from_user_id: followerId,
      type: 'follow',
      content: `${followerProfile?.name || 'Someone'} started following you`,
      link: `/user/${followerId}`,
    });
  } catch (error) {
    console.error('Failed to create follow notification:', error);
  }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const q = query(
    collection(db, collections.follows),
    where('follower_id', '==', followerId),
    where('following_id', '==', followingId)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    await deleteDoc(snapshot.docs[0].ref);
  }
}

// Get list of user IDs that the current user is following
export async function getFollowingIds(userId: string): Promise<string[]> {
  try {
    const q = query(
      collection(db, collections.follows),
      where('follower_id', '==', userId)
    );
    const snapshot = await withTimeout(getDocs(q), 5000);
    return snapshot.docs.map(doc => doc.data().following_id);
  } catch (error) {
    console.error('getFollowingIds error:', error);
    return [];
  }
}

// Get suggested users based on shared interests (people you may like)
export async function getSuggestedUsers(
  userId: string, 
  userInterests: string[], 
  maxResults = 10
): Promise<Profile[]> {
  try {
    // Get users the current user is already following (with short timeout)
    const followingIds = await getFollowingIds(userId).catch(() => []);
    
    // Get profiles (already has timeout)
    const profiles = await getProfiles(userId, { interests: userInterests }, maxResults * 2);
    
    // Filter out users already being followed and sort by shared interest count
    return profiles
      .filter(p => !followingIds.includes(p.user_id))
      .map(p => ({
        ...p,
        sharedCount: p.interests?.filter(i => userInterests.includes(i)).length || 0,
      }))
      .sort((a, b) => b.sharedCount - a.sharedCount)
      .slice(0, maxResults);
  } catch (error) {
    console.error('getSuggestedUsers error:', error);
    return [];
  }
}

// ============ NOTIFICATIONS ============

// Create a notification
export async function createNotification(data: {
  user_id: string;
  from_user_id: string;
  type: 'message' | 'follow' | 'like' | 'comment' | 'comment_like' | 'reply' | 'reply_like';
  content: string;
  link?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, collections.notifications), {
    ...data,
    read: false,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

// Get notifications for a user
export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, collections.notifications),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(50)
    );
    const snapshot = await withTimeout(getDocs(q), 8000);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: toISOString(doc.data().created_at),
    })) as Notification[];
  } catch (error) {
    console.error('getNotifications error:', error);
    return [];
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, collections.notifications),
      where('user_id', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await withTimeout(getDocs(q), 5000);
    return snapshot.size;
  } catch (error) {
    console.error('getUnreadNotificationCount error:', error);
    return 0;
  }
}

// Mark a notification as read
export async function markNotificationRead(notificationId: string): Promise<void> {
  const docRef = doc(db, collections.notifications, notificationId);
  await updateDoc(docRef, { read: true });
}

// Mark all notifications as read for a user
export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, collections.notifications),
      where('user_id', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(docSnap => 
      updateDoc(doc(db, collections.notifications, docSnap.id), { read: true })
    );
    await Promise.all(updates);
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
  }
}

// Subscribe to notifications in real-time
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const q = query(
    collection(db, collections.notifications),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: toISOString(doc.data().created_at),
    })) as Notification[];
    callback(notifications);
  }, (error) => {
    console.error('subscribeToNotifications error:', error);
  });
}
