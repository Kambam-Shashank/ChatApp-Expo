import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { auth, db } from "@/FirebaseConfig";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

function chatIdFor(u1: string, u2: string) {
  return [u1, u2].sort().join("_");
}

type Message = {
  id: string;
  text: string;
  from: string;
  to: string;
  createdAt?: any;
};

export default function ChatWithUser() {
  const { otherId, name, email } = useLocalSearchParams<{ otherId: string; name?: string; email?: string }>();
  const navigation = useNavigation();
  const currentUserId = auth.currentUser?.uid;
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<FlatList>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: name || email || "Chat",
    });
  }, [navigation, name, email]);

  useEffect(() => {
    if (!currentUserId || !otherId) return;
    const cid = chatIdFor(currentUserId, otherId);
    const q = query(collection(db, "chats", cid, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }));
      setMessages(data as Message[]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
    return () => unsub();
  }, [currentUserId, otherId]);

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUserId || !otherId) return;
    const cid = chatIdFor(currentUserId, otherId);
    await addDoc(collection(db, "chats", cid, "messages"), {
      text: trimmed,
      from: currentUserId,
      to: otherId,
      createdAt: serverTimestamp(),
    });
    setText("");
  }, [text, currentUserId, otherId]);

  if (!currentUserId || !otherId) {
    return (
      <View style={styles.center}>
        <Text>Missing users to chat.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })} keyboardVerticalOffset={90}>
      <View style={styles.container}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const mine = item.from === currentUserId;
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={{ color: mine ? "#fff" : "#111" }}>{item.text}</Text>
              </View>
            );
          }}
          contentContainerStyle={{ padding: 12 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 6,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  bubbleMine: {
    backgroundColor: "#318bfb",
    alignSelf: "flex-end",
  },
  bubbleTheirs: {
    backgroundColor: "#e6e6e6",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
  },
  sendBtn: {
    backgroundColor: "#318bfb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
});
