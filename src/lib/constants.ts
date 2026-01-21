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
  'School of Aviation, Tourism & Hospitality Management (SATHM)',
  'School of Biochemistry',
  'School of Biotechnology',
  'School of Chemical Sciences',
  'School of Commerce',
  'School of Computer Science & Information Technology (SCSIT)',
  'School of Data Science & Forecasting (DSF)',
  'School of Economics',
  'School of Education',
  'School of Electronics',
  'School of Energy & Environmental Studies (SEES)',
  'School of Instrumentation',
  'School of Journalism & Mass Communication (SJMC)',
  'School of Law',
  'School of Life Sciences',
  'School of Comparative Languages & Culture (SCLC)',
  'School of Mathematics',
  'School of Pharmacy',
  'School of Physical Education',
  'School of Physics',
  'School of Statistics',
  'School of Social Sciences',
  'Institute of Engineering & Technology (IET)',
  'Institute of Management Studies (IMS)',
  'International Institute of Professional Studies (IIPS)',
  'Deen Dayal Upadhyay Kaushal Kendra (DDU-KK)',
  'Department of Life Long Learning (DOLLL)',
  'Educational Multimedia Research Centre (EMRC)',
  'School of Library & Information Science (SLIS)',
  'School of Tribal Studies (SOTS)',
  'Devi Ahilya Vishwavidyalaya Institute of Design (DAVID)',
] as const;

export const BRANCHES: Record<string, readonly string[]> = {
  'School of Aviation, Tourism & Hospitality Management (SATHM)': [
    'MBA(Tourism)', 'MBA(Tourism) Integrated', 'BBA (Aviation)', 'B.Com (Logistics)', 'B.Com(Retail Operations)'
  ],
  'School of Biochemistry': [
    'M.Sc. Biochemistry', 'Ph.D. Biochemistry'
  ],
  'School of Biotechnology': [
    'M.Sc. Biotechnology', 'M.Sc. Bioinformatics', 'M.Sc. Genetic Engineering', 'Ph.D. Biotechnology'
  ],
  'School of Chemical Sciences': [
    'M.Sc. Chemistry', 'Ph.D. in Chemistry'
  ],
  'School of Commerce': [
    'B.Com.', 'MBA (Foreign Trade) – Integrated', 'MBA (Foreign Trade)', 'M.Com. (Accounting & Financial Control)', 'M.Com. (Bank Management)'
  ],
  'School of Computer Science & Information Technology (SCSIT)': [
    'BCA', 'M.Tech. CS (Cyber Security) Integrated', 'MCA', 'M.Sc. (Computer Science)', 'M.Sc. (Information Technology)', 'MBA (Computer Management)', 'PGDCA', 'M.Tech (Computer Science) Executive', 'M.Tech (Computer Science)', 'M.Tech (Information Architecture & Software Engineering)', 'M.Tech (Network Management & Information Security)', 'Ph.D (Computer Science)'
  ],
  'School of Data Science & Forecasting (DSF)': [
    'M.Tech. (AI & Data Science) – Integrated', 'M.Sc. (Data Science & Analytics)', 'M.Tech. (Data Science)', 'M.Tech. (Big Data Analytics)', 'M.Tech. (Executive)-Data Science', 'M.B.A. (Business Analytics)'
  ],
  'School of Economics': [
    'B.A. Economics (Honors)', 'BBA (Business Decisions)', 'M.A. Economics', 'MBA (Business Economics)', 'MBA (International Business)', 'MBA (Financial Services)', 'Ph.D. in Economics'
  ],
  'School of Education': [
    'B.Ed.', 'M.Ed', 'Ph.D.(Education)'
  ],
  'School of Electronics': [
    'B.Sc. (Electronics)', 'B.Sc. (Computer Science)', 'B.Sc. (Mathematics)', 'B.Sc. (Physics)', 'M.Sc. (Electronics)', 'M.Sc. (Electronics & Communication)', 'M.Tech in Electronics (Embedded Systems) Integrated', 'M.Tech (Embedded Systems)', 'M. Tech (Executive) in Embedded Systems'
  ],
  'School of Energy & Environmental Studies (SEES)': [
    'M.Tech. Energy Management', 'M.Tech. Energy and Environment Management', 'PhD in Energy and Environment', 'M.Tech. (EEE) Integrated 5 years', 'PG Diploma (Climate Action and Sustainability)'
  ],
  'School of Instrumentation': [
    'M.Tech.(Instrumentation)', 'M.Tech.(IoT)', 'M.Tech.(Executive) Instrumentation', 'M.Tech. (Integrated 5 year)Specialization in IOT and Industrial Automation', 'M.Sc. (Instrumentation)', 'Ph.D.(Instrumentation)'
  ],
  'School of Journalism & Mass Communication (SJMC)': [
    'B.J.', 'Bachelor of Journalism and Mass communication', 'M.A. Journalism & Mass Communication', 'M.Sc. Electronic Media (Integrated)', 'M.A. Film Studies'
  ],
  'School of Law': [
    'B.A., LL.B. (Hons)', 'LL.M.', 'M. Phil (Law)', 'Ph. D. (Law)'
  ],
  'School of Life Sciences': [
    'M.Sc. Life Sciences', 'M.Sc. Industrial Microbiology', 'B.Sc. Agriculture (Hons.)', 'Ph.D. Life Sciences'
  ],
  'School of Comparative Languages & Culture (SCLC)': [
    'M.A. Hindi Sahitya', 'M.A. English', 'M.A. Sanskrit/Jyotish'
  ],
  'School of Mathematics': [
    'B.Sc. (Hons.) Mathematics', 'M.Sc. Mathematics', 'M.Sc. Applied Mathematics'
  ],
  'School of Pharmacy': [
    'B.Pharm.', 'D. Pharm.', 'M.Pharm.'
  ],
  'School of Physical Education': [
    'B.P.E.S.', 'M.P.E.S.', 'M.P.Ed.'
  ],
  'School of Physics': [
    'B.Sc. (Hons.) Physics', 'M.Sc. Physics', 'M.Sc. Physics (Material Science)', 'M.Tech. (Laser Science and Applications)'
  ],
  'School of Statistics': [
    'B.Sc. (Hons.) Applied Statistics & Analytics', 'M.Sc. Statistics'
  ],
  'School of Social Sciences': [
    'B.A. (Psychology)', 'B.A. (Geography)', 'B.A. (Sociology)', 'M.A. (History)', 'M.A. (Sociology)', 'M.A. (Geography)', 'M.A. (Political Science)', 'M.A. (Clinical Psychology)', 'Master of Social Work (M.S.W.)', 'Bachelor of Social Work (B.S.W.)'
  ],
  'Institute of Engineering & Technology (IET)': [
    'B.Tech. CSE', 'B.Tech. IT', 'B.Tech. E&TC', 'B.Tech. E&I', 'B.Tech. Mech', 'B.Tech. CSBS', 'B.Tech. CE', 'M.Tech. CSE', 'M.Tech. IT', 'M.Tech. EE', 'M.Tech. IEM', 'M.Tech. Mech', 'M.Sc. Applied Mathematics'
  ],
  'Institute of Management Studies (IMS)': [
    'MBA- Public Health', 'MBA- (Executive)', 'MBA- (e-Commerce)', 'MBA- Hospital Administration', 'MBA- Human Resource', 'MBA- Marketing Management', 'MBA- Financial Administration', 'MBA'
  ],
  'International Institute of Professional Studies (IIPS)': [
    'B.Com. (Hons.)', 'MCA (5 Years Integrated)', 'M.Tech. (IT) 5 years Integrated', 'MBA (MS) 5 years Integrated', 'M.Tech. (CS) 5 years Integrated', 'MBA(APR)', 'MBA(MS)'
  ],
  'Deen Dayal Upadhyay Kaushal Kendra (DDU-KK)': [
    'B.Voc. Handicraft', 'B.Voc. Landscape Design', 'B.Voc. Nutrition & Dietetics', 'B.Voc. Software Development', 'Diploma In Import and Export Management', 'Diploma In Digital Marketing', 'Masters of Vocation (M.Voc)'
  ],
  'Department of Life Long Learning (DOLLL)': [
    'B.Voc. Interior Design', 'B.Voc. Fashion Technology', 'M.Voc. in Fashion Technology', 'Diploma in Interior Designing'
  ],
  'Educational Multimedia Research Centre (EMRC)': [
    'M.Sc. Electronic Media (5 years Integrated)', 'M.B.A. Media Management'
  ],
  'School of Library & Information Science (SLIS)': [
    'B.Sc. Library and Information Science', 'M.Sc. Library and Information Science'
  ],
  'School of Tribal Studies (SOTS)': [
    'M.A. (Tribal Studies)'
  ],
  'Devi Ahilya Vishwavidyalaya Institute of Design (DAVID)': [
    'Bachelor of Design (B. Des. - Product Design)'
  ],
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
