import React, { useEffect, useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { auth } from "@/FirebaseConfig";
import { getFriends } from "@/lib/friends";
import { signOut } from "firebase/auth";
import { useNavigation } from "expo-router";
import { router } from "expo-router";

type FriendItem = {
  id: string;
  fromUser: string;
  toUser: string;
  status: "pending" | "accepted" | "rejected";
  otherId: string;
  otherEmail: string;
  otherName: string;
};

export default function FriendsScreen() {
  const [items, setItems] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid;
  const navigation = useNavigation();

  // Header with logout
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            try {
              await signOut(auth);
            } finally {
              router.replace("/");
            }
          }}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ color: "#318bfb", fontWeight: "600" }}>Logout</Text>
        </TouchableOpacity>
      ),
      headerTitle: "Friends",
    });
  }, [navigation]);

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await getFriends(uid);
      setItems(data as FriendItem[]);
      console.log(data);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  if (!uid) {
    return (
      <View style={styles.center}>
        <Text>Please sign in.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#318bfb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              if (!item.otherId) return;
              router.push(`/chat/${item.otherId}` as any);
            }}
          >
            <Text style={styles.name}>{item.otherName || item.otherEmail}</Text>
            <Text style={styles.sub}>Email: {item.otherEmail}</Text>
            <Text style={styles.sub}>Status: {item.status}</Text>
            <Text style={[styles.sub, { color: "#318bfb" }]}>Tap to chat</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No friends yet.</Text>}
        refreshing={loading}
        onRefresh={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: "#f9f9f9" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: "600" },
  sub: { color: "#666", marginTop: 4 },
});
