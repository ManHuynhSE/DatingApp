import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { firebaseDb } from '@/auth/firebase';

export interface LiveChatMessage {
  id: string;
  senderUid: string;
  text: string;
  type: string;
  createdAt: Date;
}

export function createClientMessageId(conversationId: string) {
  if (!firebaseDb) throw new Error('Firebase Firestore is not configured');
  return doc(collection(firebaseDb, 'conversations', conversationId, 'messages')).id;
}

export function listenToLatestMessages(
  conversationId: string,
  onMessages: (messages: LiveChatMessage[]) => void,
  onError: (error: Error) => void,
) {
  if (!firebaseDb) throw new Error('Firebase Firestore is not configured');

  const messagesQuery = query(
    collection(firebaseDb, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(30),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((messageDoc) => {
        const data = messageDoc.data();
        return {
          id: messageDoc.id,
          senderUid: String(data.senderUid ?? ''),
          text: String(data.text ?? ''),
          type: String(data.type ?? 'text'),
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      }).reverse();
      onMessages(messages);
    },
    onError,
  );
}
