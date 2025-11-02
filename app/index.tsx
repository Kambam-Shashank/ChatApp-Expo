import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "@/FirebaseConfig";
import { setDoc, doc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const signIn = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      if (user) router.replace("/(tabs)/friends");
    } catch (error: any) {
      console.error(error.message);
      Alert.alert("Error", error.message);
    }
  };

  const signUp = async () => {
    if (!username.trim()) {
      Alert.alert("Missing Info", "Please enter a username.");
      return;
    }

    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", user.user.uid), {
        uid: user.user.uid,
        email: user.user.email,
        username: username,
        createdAt: new Date(),
      });
      if (user) router.replace("/(tabs)/friends");
    } catch (error: any) {
      console.error(error.message);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login or Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        autoCapitalize="none"
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        autoCapitalize="none"
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={signIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonOutline} onPress={signUp}>
        <Text style={styles.buttonTextOutline}>Sign Up</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 40, color: "white" },
  input: {
    width: "100%",
    maxWidth: 350,
    height: 48,
    borderColor: "#bbb",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 18,
    padding: 12,
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#318bfb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  buttonOutline: {
    width: "100%",
    maxWidth: 350,
    borderColor: "#318bfb",
    borderWidth: 2,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonTextOutline: { color: "#318bfb", fontWeight: "bold", fontSize: 17 },
});
