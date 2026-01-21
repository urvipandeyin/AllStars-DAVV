import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Save, Camera, Edit2, X, MapPin, Target, Zap, Home, GraduationCap, BookOpen, Calendar } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { InterestTag } from '@/components/ui/InterestTag';
import { BROAD_INTERESTS, INTEREST_CATEGORIES, SKILL_LEVELS, LOOKING_FOR_OPTIONS, STUDENT_TYPES, DEPARTMENTS, BRANCHES, YEARS, getInterestColor } from '@/lib/constants';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/integrations/firebase/config';
import { getFollowCounts } from '@/integrations/firebase/db';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchFollowCounts();
    }
  }, [user]);

  const fetchFollowCounts = async () => {
    if (!user) return;
    try {
      const counts = await getFollowCounts(user.uid);
      setFollowCounts(counts);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    city: '',
    skill_level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    looking_for: 'Exploring' as 'Team' | 'Collaborators' | 'Exploring',
    student_type: null as 'Hosteler' | 'Localite' | null,
    department: null as string | null,
    branch: null as string | null,
    year: null as string | null,
    avatar_url: null as string | null,
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSubInterests, setSelectedSubInterests] = useState<string[]>([]);

  // Sync form data when profile loads or when entering edit mode
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        city: profile.city || '',
        skill_level: profile.skill_level || 'Beginner',
        looking_for: profile.looking_for || 'Exploring',
        student_type: profile.student_type || null,
        department: profile.department || null,
        branch: profile.branch || null,
        year: profile.year || null,
        avatar_url: profile.avatar_url || null,
      });
      setSelectedInterests(profile.interests || []);
      setSelectedSubInterests(profile.sub_interests || []);
    }
  }, [profile]);

  const handleStartEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        city: profile.city || '',
        skill_level: profile.skill_level || 'Beginner',
        looking_for: profile.looking_for || 'Exploring',
        student_type: profile.student_type || null,
        department: profile.department || null,
        branch: profile.branch || null,
        year: profile.year || null,
        avatar_url: profile.avatar_url || null,
      });
      setSelectedInterests(profile.interests || []);
      setSelectedSubInterests(profile.sub_interests || []);
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to profile data
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        city: profile.city || '',
        skill_level: profile.skill_level || 'Beginner',
        looking_for: profile.looking_for || 'Exploring',
        student_type: profile.student_type || null,
        department: profile.department || null,
        branch: profile.branch || null,
        year: profile.year || null,
        avatar_url: profile.avatar_url || null,
      });
      setSelectedInterests(profile.interests || []);
      setSelectedSubInterests(profile.sub_interests || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await updateProfile({
      ...formData,
      interests: selectedInterests,
      sub_interests: selectedSubInterests,
    });

    setSaving(false);
    setIsEditing(false);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      const isSelected = prev.includes(interest);
      if (isSelected) {
        // Remove interest and its sub-interests
        const subInterests = INTEREST_CATEGORIES[interest as keyof typeof INTEREST_CATEGORIES] || [];
        setSelectedSubInterests(si => si.filter(s => !(subInterests as readonly string[]).includes(s)));
        return prev.filter(i => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };

  const toggleSubInterest = (subInterest: string) => {
    setSelectedSubInterests(prev =>
      prev.includes(subInterest)
        ? prev.filter(si => si !== subInterest)
        : [...prev, subInterest]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, avatar_url: downloadURL }));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // VIEW MODE - Show profile details
  if (!isEditing) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-4 pb-20">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <div className="h-16 sm:h-24 bg-gradient-primary" />
            <CardContent className="relative pt-0 pb-4">
              <div className="flex flex-col items-center -mt-10 sm:-mt-12">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl sm:text-2xl font-bold">
                    {profile?.name?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <h1 className="font-display text-2xl font-bold mt-3">{profile?.name || 'User'}</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                
                {/* Follower/Following Stats */}
                <div className="flex items-center gap-8 mt-4">
                  <Link to={`/user/${user?.uid}/followers`} className="text-center hover:opacity-80 transition-opacity">
                    <p className="font-bold text-xl">{followCounts.followers}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </Link>
                  <Link to={`/user/${user?.uid}/following`} className="text-center hover:opacity-80 transition-opacity">
                    <p className="font-bold text-xl">{followCounts.following}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </Link>
                </div>
                
                <Button onClick={handleStartEdit} variant="outline" size="sm" className="mt-4">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {profile?.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Academic Details */}
          {(profile?.department || profile?.branch || profile?.year) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Academic Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile?.department && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm"><strong>Department:</strong> {profile.department}</span>
                    </div>
                  )}
                  {profile?.branch && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm"><strong>Branch:</strong> {profile.branch}</span>
                    </div>
                  )}
                  {profile?.year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm"><strong>Year:</strong> {profile.year}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {profile?.student_type && (
              <Card className="p-4 text-center">
                <Home className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{profile.student_type}</p>
                <p className="text-xs text-muted-foreground">Student Type</p>
              </Card>
            )}
            {profile?.city && (
              <Card className="p-4 text-center">
                <MapPin className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{profile.city}</p>
                <p className="text-xs text-muted-foreground">City</p>
              </Card>
            )}
            {profile?.skill_level && (
              <Card className="p-4 text-center">
                <Zap className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{profile.skill_level}</p>
                <p className="text-xs text-muted-foreground">Skill Level</p>
              </Card>
            )}
            {profile?.looking_for && (
              <Card className="p-4 text-center">
                <Target className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{profile.looking_for}</p>
                <p className="text-xs text-muted-foreground">Looking For</p>
              </Card>
            )}
          </div>

          {/* Interests */}
          {profile?.interests && profile.interests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map(interest => (
                    <InterestTag key={interest} interest={interest} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-Interests / Skills */}
          {profile?.sub_interests && profile.sub_interests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills & Specializations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.sub_interests.map(skill => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sign Out */}
          <Card>
            <CardContent className="p-4">
              <Button variant="outline" onClick={signOut} className="w-full">
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // EDIT MODE - Show edit form
  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">Update your profile information</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                    <AvatarImage src={formData.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-semibold">
                      {formData.name.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">{formData.name || 'Your Name'}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell others about yourself..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Your city"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Student Type</Label>
                  <Select
                    value={formData.student_type || ''}
                    onValueChange={(v) => setFormData({ ...formData, student_type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.department || ''}
                  onValueChange={(v) => setFormData({ ...formData, department: v, branch: null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.department && (
                <div className="space-y-2">
                  <Label>Branch / Course</Label>
                  <Select
                    value={formData.branch || ''}
                    onValueChange={(v) => setFormData({ ...formData, branch: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {(BRANCHES[formData.department] || []).map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Year</Label>
                <Select
                  value={formData.year || ''}
                  onValueChange={(v) => setFormData({ ...formData, year: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Skill & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Level & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Skill Level</Label>
                  <Select
                    value={formData.skill_level}
                    onValueChange={(v) => setFormData({ ...formData, skill_level: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Looking For</Label>
                  <Select
                    value={formData.looking_for}
                    onValueChange={(v) => setFormData({ ...formData, looking_for: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOOKING_FOR_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select the activities you're interested in
              </p>
              <div className="flex flex-wrap gap-2">
                {BROAD_INTERESTS.map(interest => {
                  const isSelected = selectedInterests.includes(interest);
                  const color = getInterestColor(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? `shadow-md`
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      style={isSelected ? { backgroundColor: color } : {}}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              {/* Sub-interests for selected interests */}
              {selectedInterests.length > 0 && (
                <div className="mt-6 space-y-4">
                  <p className="text-sm font-medium">Specific skills (optional):</p>
                  {selectedInterests.map(interest => {
                    const subInterests = INTEREST_CATEGORIES[interest as keyof typeof INTEREST_CATEGORIES];
                    if (!subInterests) return null;
                    return (
                      <div key={interest} className="space-y-2">
                        <p className="text-xs text-muted-foreground">{interest}:</p>
                        <div className="flex flex-wrap gap-2">
                          {subInterests.map(sub => {
                            const isSelected = selectedSubInterests.includes(sub);
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => toggleSubInterest(sub)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
