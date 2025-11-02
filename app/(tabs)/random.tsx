import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import React, { useEffect } from 'react';

export default function HomeScreen() {
  useEffect(() => {
    router.replace('/(tabs)/friends');
  }, []);

  return null;
}

const styles = StyleSheet.create({
  
});
