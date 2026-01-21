// Broad interest categories with their sub-interests (expanded + realistic)
export const INTEREST_CATEGORIES = {
  Sports: [
    'Basketball', 'Football', 'Cricket', 'Badminton', 'Volleyball', 
    'Table Tennis', 'Tennis', 'Chess', 'Kabaddi', 'Athletics', 
    'Swimming', 'Boxing', 'MMA'
  ],
  Dance: [
    'Hip-Hop', 'Contemporary', 'Classical', 'Freestyle', 'Breaking', 
    'Bollywood', 'Kathak', 'Bharatnatyam', 'Jazz', 'Salsa'
  ],
  Music: [
    'Indie', 'Pop', 'Classical', 'Hip-Hop', 'Rock', 'Jazz', 'EDM', 
    'Ghazal', 'Folk', 'Instrumental', 'Rap'
  ],
  Creative: [
    'Photography', 'Filmmaking', 'Writing', 'Poetry', 'Content Creation', 
    'Graphic Design', 'UI/UX', 'Illustration'
  ],
  Theatre: [
    'Acting', 'Scriptwriting', 'Direction', 'Street Play', 'Improvisation'
  ],
  Fitness: [
    'Gym', 'Yoga', 'Calisthenics', 'CrossFit', 'Zumba'
  ],
  Gaming: [
    'BGMI', 'Valorant', 'CS:GO', 'FIFA', 'Chess Online', 'Mobile Games'
  ],
} as const;

export const BROAD_INTERESTS = Object.keys(INTEREST_CATEGORIES) as (keyof typeof INTEREST_CATEGORIES)[];

export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const LOOKING_FOR_OPTIONS = ['Team', 'Collaborators', 'Exploring'] as const;

export const STUDENT_TYPES = ['Hosteler', 'Localite'] as const;

// DAVV Academic Details
export const DEPARTMENTS = [
  'School of Computer Science & IT',
  'School of Engineering',
  'School of Commerce',
  'School of Law',
  'School of Pharmacy',
  'School of Life Sciences',
  'School of Economics',
  'School of Management',
  'School of Journalism',
  'School of Education',
  'School of Physical Education',
  'School of Social Sciences',
  'School of Chemical Sciences',
  'School of Physics',
  'School of Mathematics',
  'Institute of Engineering & Technology',
  'International Institute of Professional Studies',
  'Other',
] as const;

export const BRANCHES: Record<string, readonly string[]> = {
  'School of Computer Science & IT': ['MCA', 'M.Sc. CS', 'M.Sc. IT', 'BCA', 'B.Sc. CS', 'B.Sc. IT', 'Ph.D.'],
  'School of Engineering': ['CSE', 'IT', 'ECE', 'EE', 'ME', 'Civil', 'Chemical'],
  'School of Commerce': ['M.Com', 'B.Com', 'B.Com (Hons)'],
  'School of Law': ['LLB', 'LLM', 'BA LLB', 'BBA LLB'],
  'School of Pharmacy': ['B.Pharm', 'M.Pharm', 'D.Pharm'],
  'School of Life Sciences': ['M.Sc. Biotechnology', 'M.Sc. Microbiology', 'M.Sc. Biochemistry'],
  'School of Economics': ['MA Economics', 'BA Economics', 'Ph.D.'],
  'School of Management': ['MBA', 'BBA', 'Ph.D.'],
  'School of Journalism': ['MJMC', 'BJMC'],
  'School of Education': ['B.Ed', 'M.Ed', 'Ph.D.'],
  'School of Physical Education': ['B.P.Ed', 'M.P.Ed'],
  'School of Social Sciences': ['MA', 'BA', 'MSW', 'BSW'],
  'School of Chemical Sciences': ['M.Sc. Chemistry', 'B.Sc. Chemistry'],
  'School of Physics': ['M.Sc. Physics', 'B.Sc. Physics'],
  'School of Mathematics': ['M.Sc. Mathematics', 'B.Sc. Mathematics'],
  'Institute of Engineering & Technology': ['B.E. CSE', 'B.E. IT', 'B.E. ECE', 'B.E. EE', 'B.E. ME', 'B.E. Civil'],
  'International Institute of Professional Studies': ['MBA', 'MCA', 'M.Sc.'],
  'Other': ['Other'],
} as const;

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'] as const;

// Get all sub-interests for given categories
export function getSubInterestsForCategories(categories: string[]): string[] {
  const subInterests: string[] = [];
  for (const category of categories) {
    const subs = INTEREST_CATEGORIES[category as keyof typeof INTEREST_CATEGORIES];
    if (subs) {
      subInterests.push(...subs);
    }
  }
  return subInterests;
}

// Check if a category contains a specific sub-interest
export function getCategoryForSubInterest(subInterest: string): string | null {
  for (const [category, subs] of Object.entries(INTEREST_CATEGORIES)) {
    if ((subs as readonly string[]).includes(subInterest)) {
      return category;
    }
  }
  return null;
}

export const POST_TYPES = {
  looking_for_team: {
    label: 'Looking for Team',
    icon: 'Target',
    color: 'primary',
  },
  looking_for_collaborators: {
    label: 'Looking for Collaborators',
    icon: 'Users',
    color: 'secondary',
  },
  update: {
    label: 'Update',
    icon: 'Sparkles',
    color: 'accent',
  },
} as const;

export const INTEREST_COLORS: Record<string, string> = {
  'Sports': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Dance': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  'Music': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Creative': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Theatre': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'Fitness': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Gaming': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  // Sub-interest defaults
  'default': 'bg-muted text-muted-foreground border-border',
};

// Get color for any interest (broad or sub)
export function getInterestColor(interest: string): string {
  // Check if it's a broad interest
  if (INTEREST_COLORS[interest]) {
    return INTEREST_COLORS[interest];
  }
  // Find parent category for sub-interest
  for (const [category, subInterests] of Object.entries(INTEREST_CATEGORIES)) {
    if ((subInterests as readonly string[]).includes(interest)) {
      return INTEREST_COLORS[category] || INTEREST_COLORS.default;
    }
  }
  return INTEREST_COLORS.default;
}
