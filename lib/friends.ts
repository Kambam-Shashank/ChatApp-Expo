import { db } from "@/FirebaseConfig";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  getDoc,
} from "firebase/firestore";

export type FriendRequest = {
  fromUser: string;
  toUser: string;
  status: "pending" | "accepted" | "rejected";
  createdAt?: any;
  updatedAt?: any;
};

// Paths: we use per-user subcollections: /friendRequests/{userId}/requests/{otherUserId}
const userRequestsCol = (userId: string) => collection(db, "friendRequests", userId, "requests");
const requestDoc = (userId: string, otherUserId: string) => doc(db, "friendRequests", userId, "requests", otherUserId);

export async function sendFriendRequest(fromUser: string, toUser: string) {
  const now = serverTimestamp();
  const incomingRef = requestDoc(toUser, fromUser);
  const sentRef = requestDoc(fromUser, toUser);

  const payload: FriendRequest = {
    fromUser,
    toUser,
    status: "pending",
    createdAt: now,
  };

  await Promise.all([
    setDoc(incomingRef, { ...payload }, { merge: true }),
    setDoc(sentRef, { ...payload }, { merge: true }),
  ]);
}

export async function acceptFriendRequest(currentUserId: string, otherUserId: string) {
  const now = serverTimestamp();
  await Promise.all([
    updateDoc(requestDoc(currentUserId, otherUserId), { status: "accepted", updatedAt: now }),
    updateDoc(requestDoc(otherUserId, currentUserId), { status: "accepted", updatedAt: now }),
  ]);
}

export async function rejectFriendRequest(currentUserId: string, otherUserId: string) {
  const now = serverTimestamp();
  await Promise.all([
    updateDoc(requestDoc(currentUserId, otherUserId), { status: "rejected", updatedAt: now }),
    updateDoc(requestDoc(otherUserId, currentUserId), { status: "rejected", updatedAt: now }),
  ]);
}

export async function getIncomingRequests(currentUserId: string) {
  const q = query(userRequestsCol(currentUserId), where("toUser", "==", currentUserId), where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as FriendRequest) }));
}

export async function getSentRequests(currentUserId: string) {
  const q = query(userRequestsCol(currentUserId), where("fromUser", "==", currentUserId), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as FriendRequest) }));
}

export async function getFriends(currentUserId: string) {
  const q = query(
    userRequestsCol(currentUserId),
    where("status", "==", "accepted"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  const base = snap.docs.map((d) => ({ id: d.id, ...(d.data() as FriendRequest) }));
  const withProfiles = await Promise.all(
    base.map(async (item) => {
      const otherId = item.fromUser === currentUserId ? item.toUser : item.fromUser;
      const userDocRef = doc(db, "users", otherId);
      const userDoc = await getDoc(userDocRef);
      const profile = userDoc.exists() ? (userDoc.data() as UserProfile) : undefined;
      return {
        ...item,
        otherId,
        otherEmail: profile?.email ?? undefined,
        otherName: profile?.name ?? undefined,
      } as any;
    })
  );
  return withProfiles;
}

export type UserProfile = {
  uid: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

export async function searchUsers(term: string) {
  const termLower = term.trim().toLowerCase();
  if (!termLower) return [] as (UserProfile & { id: string })[];
  // Simple approach: get a batch and filter client-side by name/email contains
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as UserProfile) }));
  return items.filter((u) =>
    (u.username ?? "").toLowerCase().includes(termLower) ||
    (u.name ?? "").toLowerCase().includes(termLower) ||
    (u.email ?? "").toLowerCase().includes(termLower)
  );
}
