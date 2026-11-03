import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { firebaseDb } from '@/auth/firebase';
import type { DailyReading } from '@/api/astroTarotClient';

export interface StoredDailyReading extends DailyReading {
  createdAt?: Timestamp;
  reflectionAnswer?: string;
  reflectionUpdatedAt?: Timestamp;
}

function readingRef(uid: string, date: string) {
  if (!firebaseDb) throw new Error('Firebase Firestore chưa được cấu hình');
  return doc(firebaseDb, 'users', uid, 'dailyReadings', date);
}

export async function getDailyReadingHistory(uid: string, date: string) {
  const snapshot = await getDoc(readingRef(uid, date));
  return snapshot.exists() ? (snapshot.data() as StoredDailyReading) : null;
}

export async function saveDailyReading(
  uid: string,
  reading: DailyReading,
) {
  await setDoc(readingRef(uid, reading.date), {
    ...reading,
    createdAt: serverTimestamp(),
  });
}

export async function listDailyReadings(uid: string, maxItems = 30) {
  if (!firebaseDb) throw new Error('Firebase Firestore chưa được cấu hình');
  const snapshot = await getDocs(
    collection(firebaseDb, 'users', uid, 'dailyReadings'),
  );
  return snapshot.docs
    .map((item) => item.data() as StoredDailyReading)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, maxItems);
}

export async function saveReflectionAnswer(
  uid: string,
  date: string,
  reflectionAnswer: string,
) {
  await setDoc(
    readingRef(uid, date),
    {
      reflectionAnswer,
      reflectionUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
