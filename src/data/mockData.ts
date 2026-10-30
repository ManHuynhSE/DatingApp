// ─── Types ───────────────────────────────────────────────────────────────────

export interface Hobby {
  id: string;
  name: string;
  category: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  verified: boolean;
  pronouns: string;
  occupation: string;
  company?: string;
  education: string;
  distance: string;
  location: string;
  city?: string;
  ward?: string;
  aboutMe: string;
  photos: string[];
  details: ProfileDetails;
  interests: string[];
  hobbies?: Hobby[];
  languages: string[];
  relationshipGoal: string;
  profileCompletion: number;
  online: boolean;
  lastActive?: string;
}

export interface ProfileDetails {
  height: string;
  smoking: string;
  drinking: string;
  pets: string;
  children: string;
  zodiac: string;
  religion: string;
  education: string;
  exercise: string;
}

export interface ChatConversation {
  id: string;
  matchId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  verified: boolean;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'audio';
}

export interface MatchedProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  matchedAt: string;
  online: boolean;
  verified: boolean;
  hasChat: boolean;
}

// ─── Current User ────────────────────────────────────────────────────────────

export const currentUser: UserProfile = {
  id: 'current-user',
  name: 'Joshua Edwards',
  age: 29,
  verified: true,
  pronouns: 'He/Him',
  occupation: 'Product Designer',
  company: 'Google',
  education: 'Stanford University',
  distance: '0 mi',
  location: 'San Francisco, CA',
  aboutMe:
    'Creative soul who loves designing experiences that matter. When I\'m not pushing pixels, you\'ll find me hiking the Bay Area trails or experimenting with new recipes. Looking for someone who appreciates both deep conversations and comfortable silences.',
  photos: [
    'https://picsum.photos/seed/joshua1/400/600',
    'https://picsum.photos/seed/joshua2/400/600',
    'https://picsum.photos/seed/joshua3/400/600',
    'https://picsum.photos/seed/joshua4/400/600',
  ],
  details: {
    height: '5\'11"',
    smoking: 'Never',
    drinking: 'Socially',
    pets: 'Dog lover',
    children: 'Want someday',
    zodiac: 'Leo',
    religion: 'Spiritual',
    education: 'Master\'s Degree',
    exercise: 'Active',
  },
  interests: [
    'Photography',
    'Hiking',
    'Cooking',
    'Design',
    'Travel',
    'Music',
    'Coffee',
    'Art',
  ],
  languages: ['English', 'Spanish'],
  relationshipGoal: 'Long-term relationship',
  profileCompletion: 85,
  online: true,
};

// ─── Discovery Profiles ──────────────────────────────────────────────────────

export const discoveryProfiles: UserProfile[] = [
  {
    id: 'profile-1',
    name: 'Ava Jones',
    age: 25,
    verified: true,
    pronouns: 'She/Her',
    occupation: 'Photographer',
    company: 'Freelance',
    education: 'NYU',
    distance: '2 mi away',
    location: 'San Francisco, CA',
    aboutMe:
      'Capturing life one frame at a time 📸 Adventure seeker and coffee enthusiast. Love exploring hidden gems in the city and finding the perfect golden hour spot.',
    photos: [
      'https://picsum.photos/seed/ava1/400/600',
      'https://picsum.photos/seed/ava2/400/600',
      'https://picsum.photos/seed/ava3/400/600',
    ],
    details: {
      height: '5\'6"',
      smoking: 'Never',
      drinking: 'Socially',
      pets: 'Cat person',
      children: 'Not sure yet',
      zodiac: 'Pisces',
      religion: 'Agnostic',
      education: 'Bachelor\'s Degree',
      exercise: 'Sometimes',
    },
    interests: [
      'Photography',
      'Travel',
      'Coffee',
      'Art',
      'Yoga',
      'Hiking',
      'Reading',
    ],
    languages: ['English', 'French'],
    relationshipGoal: 'Long-term relationship',
    profileCompletion: 95,
    online: true,
  },
  {
    id: 'profile-2',
    name: 'Rachel Miller',
    age: 27,
    verified: true,
    pronouns: 'She/Her',
    occupation: 'Software Engineer',
    company: 'Meta',
    education: 'MIT',
    distance: '5 mi away',
    location: 'Palo Alto, CA',
    aboutMe:
      'Building the future by day, salsa dancing by night 💃 I believe in strong connections and good vibes. Looking for someone who can keep up with my energy!',
    photos: [
      'https://picsum.photos/seed/rachel1/400/600',
      'https://picsum.photos/seed/rachel2/400/600',
      'https://picsum.photos/seed/rachel3/400/600',
      'https://picsum.photos/seed/rachel4/400/600',
    ],
    details: {
      height: '5\'7"',
      smoking: 'Never',
      drinking: 'Occasionally',
      pets: 'Dog lover',
      children: 'Want someday',
      zodiac: 'Aries',
      religion: 'Christian',
      education: 'Master\'s Degree',
      exercise: 'Active',
    },
    interests: [
      'Dancing',
      'Coding',
      'Fitness',
      'Travel',
      'Cooking',
      'Music',
      'Board Games',
    ],
    languages: ['English', 'Portuguese'],
    relationshipGoal: 'Long-term relationship',
    profileCompletion: 90,
    online: false,
    lastActive: '2h ago',
  },
  {
    id: 'profile-3',
    name: 'Maria White',
    age: 24,
    verified: false,
    pronouns: 'She/Her',
    occupation: 'Marketing Manager',
    company: 'Airbnb',
    education: 'UCLA',
    distance: '3 mi away',
    location: 'San Francisco, CA',
    aboutMe:
      'Storyteller at heart 📝 I love crafting narratives that inspire. On weekends you\'ll find me at local farmers markets or trying out new brunch spots.',
    photos: [
      'https://picsum.photos/seed/maria1/400/600',
      'https://picsum.photos/seed/maria2/400/600',
      'https://picsum.photos/seed/maria3/400/600',
    ],
    details: {
      height: '5\'4"',
      smoking: 'Never',
      drinking: 'Socially',
      pets: 'No pets',
      children: 'Not sure yet',
      zodiac: 'Gemini',
      religion: 'Catholic',
      education: 'Bachelor\'s Degree',
      exercise: 'Sometimes',
    },
    interests: [
      'Writing',
      'Brunch',
      'Yoga',
      'Fashion',
      'Movies',
      'Wine Tasting',
    ],
    languages: ['English', 'Spanish'],
    relationshipGoal: 'Something casual',
    profileCompletion: 80,
    online: true,
  },
  {
    id: 'profile-4',
    name: 'Anna Fernandez',
    age: 26,
    verified: true,
    pronouns: 'She/Her',
    occupation: 'Graphic Designer',
    company: 'Adobe',
    education: 'RISD',
    distance: '7 mi away',
    location: 'Oakland, CA',
    aboutMe:
      'Color theory nerd 🎨 and plant mom. I design during the week and paint on weekends. Looking for someone who appreciates creativity and isn\'t afraid to get a little messy.',
    photos: [
      'https://picsum.photos/seed/anna1/400/600',
      'https://picsum.photos/seed/anna2/400/600',
      'https://picsum.photos/seed/anna3/400/600',
      'https://picsum.photos/seed/anna4/400/600',
    ],
    details: {
      height: '5\'5"',
      smoking: 'Never',
      drinking: 'Rarely',
      pets: 'Plant parent',
      children: 'Want someday',
      zodiac: 'Libra',
      religion: 'Spiritual',
      education: 'Bachelor\'s Degree',
      exercise: 'Yoga',
    },
    interests: [
      'Art',
      'Design',
      'Plants',
      'Painting',
      'Museums',
      'Coffee',
      'Vinyl Records',
    ],
    languages: ['English', 'Spanish', 'Italian'],
    relationshipGoal: 'Long-term relationship',
    profileCompletion: 92,
    online: false,
    lastActive: '30m ago',
  },
  {
    id: 'profile-5',
    name: 'Jennifer Brown',
    age: 28,
    verified: true,
    pronouns: 'She/Her',
    occupation: 'Doctor',
    company: 'UCSF Medical Center',
    education: 'Johns Hopkins',
    distance: '4 mi away',
    location: 'San Francisco, CA',
    aboutMe:
      'Saving lives and savoring moments ❤️ When the scrubs come off, I\'m all about exploring new cuisines, hitting the trail, and curling up with a good book. Bonus points if you can make me laugh.',
    photos: [
      'https://picsum.photos/seed/jennifer1/400/600',
      'https://picsum.photos/seed/jennifer2/400/600',
      'https://picsum.photos/seed/jennifer3/400/600',
    ],
    details: {
      height: '5\'8"',
      smoking: 'Never',
      drinking: 'Socially',
      pets: 'Dog lover',
      children: 'Want someday',
      zodiac: 'Scorpio',
      religion: 'Agnostic',
      education: 'Doctorate',
      exercise: 'Active',
    },
    interests: [
      'Medicine',
      'Cooking',
      'Hiking',
      'Reading',
      'Travel',
      'Running',
      'Podcasts',
    ],
    languages: ['English', 'Mandarin'],
    relationshipGoal: 'Long-term relationship',
    profileCompletion: 88,
    online: true,
  },
  {
    id: 'profile-6',
    name: 'Brian Martinez',
    age: 30,
    verified: true,
    pronouns: 'He/Him',
    occupation: 'Architect',
    company: 'Gensler',
    education: 'UC Berkeley',
    distance: '6 mi away',
    location: 'Berkeley, CA',
    aboutMe:
      'Designing spaces that inspire 🏗️ Weekend warrior who loves surfing, sketching, and spontaneous road trips. I believe great architecture and great relationships are both built on strong foundations.',
    photos: [
      'https://picsum.photos/seed/brian1/400/600',
      'https://picsum.photos/seed/brian2/400/600',
      'https://picsum.photos/seed/brian3/400/600',
    ],
    details: {
      height: '6\'1"',
      smoking: 'Never',
      drinking: 'Socially',
      pets: 'Dog lover',
      children: 'Open to it',
      zodiac: 'Capricorn',
      religion: 'Spiritual',
      education: 'Master\'s Degree',
      exercise: 'Very active',
    },
    interests: [
      'Architecture',
      'Surfing',
      'Sketching',
      'Travel',
      'Music',
      'Sustainability',
    ],
    languages: ['English', 'Spanish'],
    relationshipGoal: 'Long-term relationship',
    profileCompletion: 87,
    online: false,
    lastActive: '1h ago',
  },
  {
    id: 'profile-7',
    name: 'Emily Taylor',
    age: 23,
    verified: false,
    pronouns: 'She/Her',
    occupation: 'Content Creator',
    company: 'Self-employed',
    education: 'USC',
    distance: '1 mi away',
    location: 'San Francisco, CA',
    aboutMe:
      'Living life in color 🌈 Full-time dreamer, part-time foodie. I make videos about the things I love and I\'m looking for someone who doesn\'t take themselves too seriously.',
    photos: [
      'https://picsum.photos/seed/emily1/400/600',
      'https://picsum.photos/seed/emily2/400/600',
      'https://picsum.photos/seed/emily3/400/600',
      'https://picsum.photos/seed/emily4/400/600',
      'https://picsum.photos/seed/emily5/400/600',
    ],
    details: {
      height: '5\'3"',
      smoking: 'Never',
      drinking: 'Socially',
      pets: 'Cat person',
      children: 'Not right now',
      zodiac: 'Sagittarius',
      religion: 'None',
      education: 'Bachelor\'s Degree',
      exercise: 'Sometimes',
    },
    interests: [
      'Content Creation',
      'Food',
      'Fashion',
      'Travel',
      'Photography',
      'Dancing',
      'Skincare',
    ],
    languages: ['English', 'Korean'],
    relationshipGoal: 'Something casual',
    profileCompletion: 78,
    online: true,
  },
  {
    id: 'profile-8',
    name: 'Sophie Chen',
    age: 26,
    verified: true,
    pronouns: 'She/Her',
    occupation: 'Data Scientist',
    company: 'Netflix',
    education: 'Stanford',
    distance: '8 mi away',
    location: 'Mountain View, CA',
    aboutMe:
      'Numbers by day, novels by night 📊📚 I find patterns in data and meaning in stories. Looking for someone who can appreciate both logic and romance.',
    photos: [
      'https://picsum.photos/seed/sophie1/400/600',
      'https://picsum.photos/seed/sophie2/400/600',
      'https://picsum.photos/seed/sophie3/400/600',
    ],
    details: {
      height: '5\'5"',
      smoking: 'Never',
      drinking: 'Rarely',
      pets: 'Fish',
      children: 'Want someday',
      zodiac: 'Virgo',
      religion: 'Buddhist',
      education: 'Master\'s Degree',
      exercise: 'Regularly',
    },
    interests: [
      'Data Science',
      'Reading',
      'Piano',
      'Baking',
      'Board Games',
      'Astronomy',
    ],
    languages: ['English', 'Mandarin', 'Cantonese'],
    relationshipGoal: 'Long-term relationship',
    profileCompletion: 93,
    online: false,
    lastActive: '15m ago',
  },
];

// ─── Matched Profiles ────────────────────────────────────────────────────────

export const matchedProfiles: MatchedProfile[] = [
  {
    id: 'profile-1',
    name: 'Ava Jones',
    age: 25,
    avatar: 'https://picsum.photos/seed/ava1/200/200',
    matchedAt: '2024-01-15T10:30:00Z',
    online: true,
    verified: true,
    hasChat: true,
  },
  {
    id: 'profile-2',
    name: 'Rachel Miller',
    age: 27,
    avatar: 'https://picsum.photos/seed/rachel1/200/200',
    matchedAt: '2024-01-14T08:20:00Z',
    online: false,
    verified: true,
    hasChat: true,
  },
  {
    id: 'profile-4',
    name: 'Anna Fernandez',
    age: 26,
    avatar: 'https://picsum.photos/seed/anna1/200/200',
    matchedAt: '2024-01-13T15:45:00Z',
    online: false,
    verified: true,
    hasChat: false,
  },
  {
    id: 'profile-5',
    name: 'Jennifer Brown',
    age: 28,
    avatar: 'https://picsum.photos/seed/jennifer1/200/200',
    matchedAt: '2024-01-12T12:00:00Z',
    online: true,
    verified: true,
    hasChat: true,
  },
  {
    id: 'profile-7',
    name: 'Emily Taylor',
    age: 23,
    avatar: 'https://picsum.photos/seed/emily1/200/200',
    matchedAt: '2024-01-11T09:15:00Z',
    online: true,
    verified: false,
    hasChat: false,
  },
];

// ─── Chat Conversations ──────────────────────────────────────────────────────

export const chatConversations: ChatConversation[] = [
  {
    id: 'chat-1',
    matchId: 'profile-1',
    name: 'Ava Jones',
    avatar: 'https://picsum.photos/seed/ava1/200/200',
    lastMessage: 'That sounds like a great plan! 😊',
    lastMessageTime: '2m ago',
    unreadCount: 2,
    online: true,
    verified: true,
    messages: [
      {
        id: 'msg-1-1',
        senderId: 'profile-1',
        text: 'Hey Joshua! Love your photography too 📸',
        timestamp: '10:15 AM',
        read: true,
        type: 'text',
      },
      {
        id: 'msg-1-2',
        senderId: 'current-user',
        text: 'Thanks! I saw your portfolio, it\'s amazing! We should do a photo walk sometime.',
        timestamp: '10:18 AM',
        read: true,
        type: 'text',
      },
      {
        id: 'msg-1-3',
        senderId: 'profile-1',
        text: 'I\'d love that! Golden Gate Park has some great spots this time of year.',
        timestamp: '10:20 AM',
        read: true,
        type: 'text',
      },
      {
        id: 'msg-1-4',
        senderId: 'current-user',
        text: 'How about this Saturday morning? The light is perfect around 8am.',
        timestamp: '10:25 AM',
        read: true,
        type: 'text',
      },
      {
        id: 'msg-1-5',
        senderId: 'profile-1',
        text: 'That sounds like a great plan! 😊',
        timestamp: '10:28 AM',
        read: false,
        type: 'text',
      },
    ],
  },
  {
    id: 'chat-2',
    matchId: 'profile-2',
    name: 'Rachel Miller',
    avatar: 'https://picsum.photos/seed/rachel1/200/200',
    lastMessage: 'Have you tried the new salsa place downtown?',
    lastMessageTime: '1h ago',
    unreadCount: 0,
    online: false,
    verified: true,
    messages: [
      {
        id: 'msg-2-1',
        senderId: 'current-user',
        text: 'Hi Rachel! I noticed you like salsa dancing. I\'ve been wanting to learn!',
        timestamp: 'Yesterday',
        read: true,
        type: 'text',
      },
      {
        id: 'msg-2-2',
        senderId: 'profile-2',
        text: 'Oh that\'s awesome! It\'s so much fun once you get the basics down.',
        timestamp: 'Yesterday',
        read: true,
        type: 'text',
      },
      {
        id: 'msg-2-3',
        senderId: 'profile-2',
        text: 'Have you tried the new salsa place downtown?',
        timestamp: '1h ago',
        read: true,
        type: 'text',
      },
    ],
  },
  {
    id: 'chat-3',
    matchId: 'profile-5',
    name: 'Jennifer Brown',
    avatar: 'https://picsum.photos/seed/jennifer1/200/200',
    lastMessage: 'The trail was beautiful! Thanks for the recommendation 🏔️',
    lastMessageTime: '3h ago',
    unreadCount: 1,
    online: true,
    verified: true,
    messages: [
      {
        id: 'msg-3-1',
        senderId: 'current-user',
        text: 'Hey Jennifer! Fellow hiker here. What\'s your favorite trail in the area?',
        timestamp: 'Yesterday',
        read: true,
        type: 'text',
      },
      {
        id: 'msg-3-2',
        senderId: 'profile-5',
        text: 'Lands End is my go-to! Have you tried the Dipsea Trail in Marin?',
        timestamp: 'Yesterday',
        read: true,
        type: 'text',
      },
      {
        id: 'msg-3-3',
        senderId: 'current-user',
        text: 'Not yet! I\'ve heard great things though. You should check out the Tennessee Valley trail.',
        timestamp: '5h ago',
        read: true,
        type: 'text',
      },
      {
        id: 'msg-3-4',
        senderId: 'profile-5',
        text: 'The trail was beautiful! Thanks for the recommendation 🏔️',
        timestamp: '3h ago',
        read: false,
        type: 'text',
      },
    ],
  },
];

// ─── Conversation Starters ───────────────────────────────────────────────────

export const conversationStarters: string[] = [
  'What\'s the best trip you\'ve ever taken? ✈️',
  'If you could have dinner with anyone, who would it be?',
  'What\'s your go-to comfort food? 🍕',
  'What\'s the last book that really stuck with you? 📚',
  'If you could learn any skill instantly, what would it be?',
  'What\'s your favorite way to spend a Sunday?',
  'Coffee or tea? And what\'s your order? ☕',
  'What song is stuck in your head right now? 🎵',
  'What\'s the most spontaneous thing you\'ve ever done?',
  'Do you have any hidden talents?',
];
