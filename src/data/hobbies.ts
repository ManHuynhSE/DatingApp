import { Hobby } from '../api/datingClient';

export const hobbiesList = require('../../assets/hobbies_list.json') as Hobby[];

export const HOBBY_EMOJIS: Record<string, string> = {
  // Arts & Creativity
  Reading: '📚',
  Writing: '✍️',
  Poetry: '📜',
  Painting: '🎨',
  Drawing: '✏️',
  Photography: '📸',
  Dancing: '💃',
  Acting: '🎭',
  'Arts & Crafts': '🧶',
  Fashion: '👗',
  'Interior Design': '🛋️',
  Theater: '🎟️',
  'Museums & Galleries': '🏛️',
  'Content Creation': '📹',
  Blogging: '💻',
  'Makeup & Beauty': '💄',

  // Gaming
  'Video Games': '🎮',
  'Board Games': '🎲',
  Puzzles: '🧩',
  Esports: '🕹️',

  // Movies & Entertainment
  'Watching Movies': '🎬',
  'Watching TV Shows': '📺',
  Anime: '🍥',
  Manga: '📖',
  Comics: '🗯️',
  Comedy: '🤣',
  Podcasts: '🎙️',
  'Stand-up Comedy': '🎤',

  // Travel & Exploration
  Traveling: '✈️',
  'Road Trips': '🚗',
  Backpacking: '🎒',
  'Beach Trips': '🏖️',
  'Food Tourism': '🗺️',
  Picnics: '🧺',

  // Sports & Fitness
  Cycling: '🚴',
  Running: '🏃',
  'Going to the Gym': '🏋️',
  Yoga: '🧘',
  Pilates: '🤸',
  Swimming: '🏊',
  Badminton: '🏸',
  Basketball: '🏀',
  'American Football': '🏈',
  Soccer: '⚽',
  Tennis: '🎾',
  'Martial Arts': '🥋',
  'Rock Climbing': '🧗',
  Skateboarding: '🛹',
  Snowboarding: '🏂',
  Skiing: '🎿',
  Surfing: '🏄',

  // Food & Drink
  Cooking: '🍳',
  Baking: '🧁',
  Coffee: '☕',
  Tea: '🍵',
  'Trying New Foods': '🍱',
  'Wine Tasting': '🍷',
  'Making Cocktails': '🍸',
  'Craft Beer': '🍺',
  'Street Food': '🍢',
  'Restaurant Hopping': '🍽️',

  // Socializing & Nightlife
  'Pub Crawling': '🍻',
  'Bar Hopping': '🥂',
  Nightlife: '🪩',
  'Meeting New People': '🤝',
  Karaoke: '🎤',
  'Salsa Dancing': '💃',

  // Music
  'Listening to Music': '🎧',
  Singing: '🎶',
  'Playing Instruments': '🎸',
  'Live Music & Concerts': '🎫',

  // Nature & Outdoors
  Hiking: '🥾',
  Camping: '⛺',
  'Exploring Nature': '🌲',
  Stargazing: '✨',
  Gardening: '🌱',
  Houseplants: '🪴',
  Fishing: '🎣',
  Birdwatching: '🔭',
  Sailing: '⛵',
  'Environmental Causes': '🌍',
  'Spending Time with Pets': '🐾',

  // Learning & Technology
  'Learning New Things': '💡',
  'Learning Languages': '🗣️',
  Programming: '💻',
  Technology: '🤖',
  Science: '🔬',
  Astronomy: '🪐',
  Investing: '📈',
  Entrepreneurship: '💼',
  History: '🏺',

  // Wellness & Lifestyle
  Meditation: '🧘‍♀️',
  Mindfulness: '🌸',
  Journaling: '📓',
  Shopping: '🛍️',
  Thrifting: '👕',
  'DIY Projects': '🔨',
  Cars: '🏎️',
  Motorcycles: '🏍️',
  Collecting: '🪙',

  // Community & Lifestyle
  Volunteering: '❤️',
};

export const HOBBY_VI_NAMES: Record<string, string> = {
  Reading: 'Đọc sách',
  Writing: 'Viết lách',
  Poetry: 'Làm thơ',
  Painting: 'Vẽ tranh',
  Drawing: 'Phác họa',
  Photography: 'Nhiếp ảnh',
  Dancing: 'Nhảy múa / Khiêu vũ',
  Acting: 'Diễn xuất',
  'Arts & Crafts': 'Thủ công mỹ nghệ',
  Fashion: 'Thời trang',
  'Interior Design': 'Thiết kế nội thất',
  Theater: 'Kịch nghệ',
  'Museums & Galleries': 'Bảo tàng & Triển lãm',
  'Content Creation': 'Sáng tạo nội dung',
  Blogging: 'Viết blog',
  'Makeup & Beauty': 'Trang điểm & Làm đẹp',
  'Video Games': 'Trò chơi điện tử',
  'Board Games': 'Trò chơi trên bàn',
  Puzzles: 'Giải đố / Xếp hình',
  Esports: 'Thể thao điện tử',
  'Watching Movies': 'Xem phim',
  'Watching TV Shows': 'Cày phim bộ',
  Anime: 'Hoạt hình Nhật Bản',
  Manga: 'Truyện tranh Nhật Bản',
  Comics: 'Truyện tranh',
  Comedy: 'Hài kịch',
  Podcasts: 'Nghe chương trình âm thanh trực tuyến',
  'Stand-up Comedy': 'Hài độc thoại',
  Traveling: 'Du lịch',
  'Road Trips': 'Du lịch đường dài',
  Backpacking: 'Du lịch bụi',
  'Beach Trips': 'Đi biển',
  'Food Tourism': 'Khám phá ẩm thực',
  Picnics: 'Dã ngoại',
  Cycling: 'Đạp xe',
  Running: 'Chạy bộ',
  'Going to the Gym': 'Tập gym',
  Yoga: 'Yoga',
  Pilates: 'Pilates',
  Swimming: 'Bơi lội',
  Badminton: 'Cầu lông',
  Basketball: 'Bóng rổ',
  'American Football': 'Bóng bầu dục',
  Soccer: 'Bóng đá',
  Tennis: 'Quần vợt',
  'Martial Arts': 'Võ thuật',
  'Rock Climbing': 'Leo núi',
  Skateboarding: 'Trượt ván',
  Snowboarding: 'Trượt ván tuyết',
  Skiing: 'Trượt tuyết',
  Surfing: 'Lướt sóng',
  Cooking: 'Nấu ăn',
  Baking: 'Làm bánh',
  Coffee: 'Cà phê',
  Tea: 'Trà',
  'Trying New Foods': 'Thử món ăn mới',
  'Wine Tasting': 'Thưởng thức rượu',
  'Making Cocktails': 'Pha cocktail',
  'Craft Beer': 'Bia thủ công',
  'Street Food': 'Ăn vặt đường phố',
  'Restaurant Hopping': 'Khám phá nhiều quán ăn',
  'Pub Crawling': 'Đi nhiều quán rượu',
  'Bar Hopping': 'Đi nhiều quán bar',
  Nightlife: 'Đời sống về đêm',
  'Meeting New People': 'Giao lưu kết bạn',
  Karaoke: 'Hát karaoke',
  'Salsa Dancing': 'Nhảy điệu salsa',
  'Listening to Music': 'Nghe nhạc',
  Singing: 'Ca hát',
  'Playing Instruments': 'Chơi nhạc cụ',
  'Live Music & Concerts': 'Đi nghe hòa nhạc',
  Hiking: 'Đi bộ đường dài / Leo núi',
  Camping: 'Cắm trại',
  'Exploring Nature': 'Khám phá tự nhiên',
  Stargazing: 'Ngắm sao',
  Gardening: 'Làm vườn',
  Houseplants: 'Trồng cây trong nhà',
  Fishing: 'Câu cá',
  Birdwatching: 'Ngắm chim',
  Sailing: 'Chèo thuyền',
  'Environmental Causes': 'Bảo vệ môi trường',
  'Spending Time with Pets': 'Chơi với thú cưng',
  'Learning New Things': 'Học điều mới',
  'Learning Languages': 'Học ngoại ngữ',
  Programming: 'Lập trình',
  Technology: 'Công nghệ',
  Science: 'Khoa học',
  Astronomy: 'Thiên văn học',
  Investing: 'Đầu tư tài chính',
  Entrepreneurship: 'Khởi nghiệp',
  History: 'Lịch sử',
  Meditation: 'Thiền định',
  Mindfulness: 'Chánh niệm',
  Journaling: 'Viết nhật ký',
  Shopping: 'Mua sắm',
  Thrifting: 'Săn đồ cũ',
  'DIY Projects': 'Tự làm đồ thủ công',
  Cars: 'Xe hơi',
  Motorcycles: 'Xe máy',
  Collecting: 'Sưu tầm',
  Volunteering: 'Tình nguyện',
};

export const HOBBY_EN_NAMES_BY_VI: Record<string, string> = Object.fromEntries(
  Object.entries(HOBBY_VI_NAMES).map(([englishName, vietnameseName]) => [
    vietnameseName,
    englishName,
  ]),
);

export function getVietnameseHobbyName(name: string): string {
  const englishName = HOBBY_EN_NAMES_BY_VI[name] ?? name;
  return HOBBY_VI_NAMES[englishName] ?? name;
}

export function getHobbyEmoji(name: string): string | undefined {
  const englishName = HOBBY_EN_NAMES_BY_VI[name] ?? name;
  return HOBBY_EMOJIS[englishName];
}

export interface HobbyCategory {
  id: string;
  name: string;
  labelVi: string;
  emoji: string;
}

export const HOBBY_CATEGORIES: HobbyCategory[] = [
  { id: 'all', name: 'All', labelVi: 'Tất cả', emoji: '✨' },
  { id: 'Arts & Creativity', name: 'Nghệ thuật & Sáng tạo', labelVi: 'Nghệ thuật & Sáng tạo', emoji: '🎨' },
  { id: 'Gaming', name: 'Trò chơi', labelVi: 'Trò chơi', emoji: '🎮' },
  { id: 'Movies & Entertainment', name: 'Phim ảnh & Giải trí', labelVi: 'Phim ảnh & Giải trí', emoji: '🎬' },
  { id: 'Travel & Exploration', name: 'Du lịch & Khám phá', labelVi: 'Du lịch & Khám phá', emoji: '✈️' },
  { id: 'Sports & Fitness', name: 'Thể thao & Rèn luyện', labelVi: 'Thể thao & Rèn luyện', emoji: '⚽' },
  { id: 'Food & Drink', name: 'Ẩm thực & Đồ uống', labelVi: 'Ẩm thực & Đồ uống', emoji: '🍜' },
  { id: 'Socializing & Nightlife', name: 'Giao lưu & Giải trí về đêm', labelVi: 'Giao lưu & Giải trí về đêm', emoji: '🍻' },
  { id: 'Music', name: 'Âm nhạc', labelVi: 'Âm nhạc', emoji: '🎵' },
  { id: 'Nature & Outdoors', name: 'Thiên nhiên & Ngoài trời', labelVi: 'Thiên nhiên & Ngoài trời', emoji: '🌿' },
  { id: 'Learning & Technology', name: 'Học tập & Công nghệ', labelVi: 'Học tập & Công nghệ', emoji: '💻' },
  { id: 'Wellness & Lifestyle', name: 'Sức khỏe & Lối sống', labelVi: 'Sức khỏe & Lối sống', emoji: '🧘' },
  { id: 'Community & Lifestyle', name: 'Cộng đồng & Lối sống', labelVi: 'Cộng đồng & Lối sống', emoji: '🤝' },
];

export function getVietnameseHobbyCategory(category: string): string {
  return HOBBY_CATEGORIES.find((item) => item.id === category || item.name === category)
    ?.name ?? category;
}

export function normalizeHobbiesToVietnamese(hobbies: Hobby[] = []): Hobby[] {
  return hobbies.map((hobby) => ({
    ...hobby,
    name: getVietnameseHobbyName(hobby.name),
    category: getVietnameseHobbyCategory(hobby.category),
  }));
}

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}
