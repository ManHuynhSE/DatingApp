import type { Hobby, SwipedMeItem } from '../api/datingClient';
import type { UserProfile } from '../data/mockData';

export const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

export interface LikedUserItem {
  id: string;
  userId: string;
  name: string;
  age: number | null;
  photo: string;
  photos: string[];
  bio?: string | null;
  job_title?: string | null;
  city?: string | null;
  ward?: string | null;
  distance_km?: number | null;
  distanceText?: string;
  is_verified: boolean;
  pronouns?: string;
  gender?: string;
  hobbies?: Hobby[];
  likedAt?: string;
  hasPhotoLiked?: boolean;
}

export function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function mapSwipedMeToLikedUser(item: SwipedMeItem): LikedUserItem {
  const user = item.users_swipes_swiper_idTousers;
  const profile = user?.profiles;
  const photos = [...(user?.photos ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
  );
  const photoUrls = photos.map((p) => p.url).filter(Boolean);
  const primaryPhoto = photoUrls[0] || FALLBACK_PHOTO;

  const rawHobbies = profile?.hobbies ?? [];
  const normalizedHobbies: Hobby[] = Array.isArray(rawHobbies)
    ? rawHobbies.map((h: any, idx) => {
        if (typeof h === 'string') {
          return { id: `hobby-${idx}`, name: h, category: 'General' };
        }
        return {
          id: h?.id || `hobby-${idx}`,
          name: h?.name || '',
          category: h?.category || 'General',
        };
      })
    : [];

  const locationText = [profile?.ward, profile?.city].filter(Boolean).join(', ') || profile?.city || 'Nearby';

  return {
    id: item.id || user?.id || item.swiper_id,
    userId: user?.id || item.swiper_id,
    name: profile?.display_name || 'Someone',
    age: calculateAge(profile?.birth_date),
    photo: primaryPhoto,
    photos: photoUrls.length > 0 ? photoUrls : [primaryPhoto],
    bio: profile?.bio,
    job_title: profile?.job_title,
    city: profile?.city,
    ward: profile?.ward,
    distanceText: locationText,
    is_verified: Boolean(profile?.is_verified),
    gender: profile?.gender,
    pronouns: profile?.gender === 'female' ? 'She/Her' : profile?.gender === 'male' ? 'He/Him' : undefined,
    hobbies: normalizedHobbies,
    likedAt: item.created_at,
    hasPhotoLiked: true,
  };
}

export function mapMockProfileToLikedUser(profile: UserProfile): LikedUserItem {
  return {
    id: profile.id,
    userId: profile.id,
    name: profile.name,
    age: profile.age,
    photo: profile.photos[0] || FALLBACK_PHOTO,
    photos: profile.photos.length > 0 ? profile.photos : [FALLBACK_PHOTO],
    bio: profile.aboutMe,
    job_title: profile.occupation,
    city: profile.city || profile.location,
    ward: profile.ward,
    distanceText: profile.distance || profile.location,
    is_verified: profile.verified,
    gender: profile.pronouns,
    pronouns: profile.pronouns,
    hobbies: profile.hobbies || profile.interests?.map((name, i) => ({ id: `mock-${i}`, name, category: 'General' })) || [],
    likedAt: new Date().toISOString(),
    hasPhotoLiked: true,
  };
}
