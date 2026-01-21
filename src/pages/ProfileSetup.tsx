import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, Check, Camera, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/Logo';
import { BROAD_INTERESTS, INTEREST_CATEGORIES, SKILL_LEVELS, LOOKING_FOR_OPTIONS, STUDENT_TYPES, DEPARTMENTS, BRANCHES, YEARS, getInterestColor } from '@/lib/constants';
import { useProfile } from '@/hooks/useProfile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/integrations/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'basics' | 'student-type' | 'academics' | 'interests' | 'sub-interests' | 'preferences';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, completeProfile } = useProfile();
  const [step, setStep] = useState<Step>('basics');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    bio: '',
    avatar_url: profile?.avatar_url || null as string | null,
    interests: [] as string[],
    sub_interests: [] as string[],
    skill_level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    looking_for: 'Exploring' as 'Team' | 'Collaborators' | 'Exploring',
    student_type: null as 'Hosteler' | 'Localite' | null,
    department: null as string | null,
    branch: null as string | null,
    year: null as string | null,
  });

  const steps: Step[] = ['basics', 'student-type', 'academics', 'interests', 'sub-interests', 'preferences'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (step) {
      case 'basics':
        return formData.name.trim().length >= 2 && formData.bio.trim().length >= 10;
      case 'student-type':
        return formData.student_type !== null;
      case 'academics':
        return formData.department !== null && formData.branch !== null && formData.year !== null;
      case 'interests':
        return formData.interests.length > 0;
      case 'sub-interests':
        return formData.sub_interests.length > 0;
      case 'preferences':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    const { error } = await completeProfile(formData);
    setSaving(false);
    if (!error) {
      // Navigate to feed - the profile state is updated in completeProfile
      navigate('/', { replace: true });
    }
  };

  const toggleBroadInterest = (interest: string) => {
    setFormData(prev => {
      const isSelected = prev.interests.includes(interest);
      if (isSelected) {
        const subInterests = INTEREST_CATEGORIES[interest as keyof typeof INTEREST_CATEGORIES] || [];
        return {
          ...prev,
          interests: prev.interests.filter(i => i !== interest),
          sub_interests: prev.sub_interests.filter(si => !(subInterests as readonly string[]).includes(si)),
        };
      } else {
        return {
          ...prev,
          interests: [...prev.interests, interest],
        };
      }
    });
  };

  const toggleSubInterest = (subInterest: string) => {
    setFormData(prev => ({
      ...prev,
      sub_interests: prev.sub_interests.includes(subInterest)
        ? prev.sub_interests.filter(si => si !== subInterest)
        : [...prev.sub_interests, subInterest],
    }));
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

  const removeImage = () => {
    setFormData(prev => ({ ...prev, avatar_url: null }));
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg space-y-4 animate-fade-in relative z-10 max-h-[95dvh] overflow-y-auto">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold mb-1">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">Help others discover you and find your tribe</p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-display">
              {step === 'basics' && 'About You'}
              {step === 'student-type' && 'Your Lifestyle'}
              {step === 'academics' && 'Academic Details'}
              {step === 'interests' && 'What Excites You?'}
              {step === 'sub-interests' && 'Get Specific'}
              {step === 'preferences' && 'Almost Done!'}
            </CardTitle>
            <CardDescription>
              {step === 'basics' && 'Share a bit about yourself'}
              {step === 'student-type' && 'This helps us connect you with nearby people'}
              {step === 'academics' && 'Tell us about your department and course'}
              {step === 'interests' && 'Select the categories that match your vibe'}
              {step === 'sub-interests' && 'Pick the specific activities you love'}
              {step === 'preferences' && 'Tell us what you are looking for'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'basics' && (
              <>
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                      <AvatarImage src={formData.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-semibold">
                        {formData.name.slice(0, 2).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {formData.avatar_url && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-1 -right-1 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:opacity-90 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    
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
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground">Profile picture is optional</p>

                <div className="space-y-2">
                  <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="What should we call you?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself in a few words..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length < 10 
                      ? `At least ${10 - formData.bio.length} more characters needed`
                      : '✓ Looking good!'
                    }
                  </p>
                </div>
              </>
            )}

            {step === 'student-type' && (
              <div className="space-y-4">
                <Label>Are you a Hosteler or Localite? <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-1 gap-4">
                  {STUDENT_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, student_type: type })}
                      className={cn(
                        'p-6 rounded-xl border-2 text-left transition-all',
                        formData.student_type === type
                          ? 'border-primary bg-primary/10 shadow-glow'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className={cn(
                        'text-lg font-semibold block mb-1',
                        formData.student_type === type && 'text-primary'
                      )}>
                        {type === 'Hosteler' ? '🏠 Hosteler' : '🏡 Localite'}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {type === 'Hosteler' 
                          ? 'I stay in a hostel or PG on/near campus'
                          : 'I commute from home daily'
                        }
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'academics' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Department <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.department || ''}
                    onValueChange={(v) => setFormData({ ...formData, department: v, branch: null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your department" />
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
                    <Label>Branch / Course <span className="text-destructive">*</span></Label>
                    <Select
                      value={formData.branch || ''}
                      onValueChange={(v) => setFormData({ ...formData, branch: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your branch" />
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
                  <Label>Year <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.year || ''}
                    onValueChange={(v) => setFormData({ ...formData, year: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 'interests' && (
              <div className="space-y-4">
                <Label>Pick your interests <span className="text-destructive">*</span></Label>
                <p className="text-sm text-muted-foreground">Select all categories that resonate with you</p>
                <div className="grid grid-cols-2 gap-3">
                  {BROAD_INTERESTS.map(interest => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleBroadInterest(interest)}
                        className={cn(
                          'p-4 rounded-xl border-2 text-center font-medium transition-all relative overflow-hidden',
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-glow'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <span className={cn(isSelected && 'text-primary')}>{interest}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {INTEREST_CATEGORIES[interest as keyof typeof INTEREST_CATEGORIES]?.length || 0} activities
                        </p>
                      </button>
                    );
                  })}
                </div>
                {formData.interests.length > 0 && (
                  <p className="text-sm text-center text-primary">
                    {formData.interests.length} {formData.interests.length === 1 ? 'category' : 'categories'} selected
                  </p>
                )}
              </div>
            )}

            {step === 'sub-interests' && (
              <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                <div>
                  <Label>Pick specific activities <span className="text-destructive">*</span></Label>
                  <p className="text-sm text-muted-foreground mt-1">Choose what you actually do or want to explore</p>
                </div>
                
                {formData.interests.map(interest => {
                  const subInterests = INTEREST_CATEGORIES[interest as keyof typeof INTEREST_CATEGORIES] || [];
                  const colorClass = getInterestColor(interest);
                  return (
                    <div key={interest} className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs', colorClass)}>{interest}</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {subInterests.map(sub => {
                          const isSelected = formData.sub_interests.includes(sub);
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => toggleSubInterest(sub)}
                              className={cn(
                                'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                                isSelected
                                  ? colorClass + ' border-transparent'
                                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                              )}
                            >
                              {sub}
                              {isSelected && <Check className="inline-block ml-1 h-3 w-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {formData.sub_interests.length > 0 && (
                  <p className="text-sm text-center text-primary sticky bottom-0 bg-card py-2">
                    {formData.sub_interests.length} {formData.sub_interests.length === 1 ? 'activity' : 'activities'} selected
                  </p>
                )}
              </div>
            )}

            {step === 'preferences' && (
              <>
                <div className="space-y-3">
                  <Label>How would you describe your skill level?</Label>
                  <p className="text-xs text-muted-foreground">No pressure - everyone starts somewhere!</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SKILL_LEVELS.map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, skill_level: level })}
                        className={cn(
                          'p-3 rounded-xl border-2 text-center text-sm font-medium transition-all',
                          formData.skill_level === level
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {level === 'Beginner' && '🌱'}
                        {level === 'Intermediate' && '🌿'}
                        {level === 'Advanced' && '🌳'}
                        <span className="block mt-1">{level}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>What are you looking for?</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {LOOKING_FOR_OPTIONS.map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFormData({ ...formData, looking_for: option })}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all',
                          formData.looking_for === option
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <span className={cn(
                          'font-medium flex items-center gap-2',
                          formData.looking_for === option && 'text-primary'
                        )}>
                          {option === 'Team' && '🎯 Looking for a Team'}
                          {option === 'Collaborators' && '🤝 Looking for Collaborators'}
                          {option === 'Exploring' && '✨ Just Exploring'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option === 'Team' && 'I want to join or form a team for events/projects'}
                          {option === 'Collaborators' && 'I want to find people to work with on ideas'}
                          {option === 'Exploring' && 'I am just checking things out for now'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              {step !== 'basics' && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              {step !== 'preferences' ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 bg-gradient-primary hover:opacity-90 shadow-glow"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Complete Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          All fields are required to help you connect with the right people
        </p>
      </div>
    </div>
  );
}
