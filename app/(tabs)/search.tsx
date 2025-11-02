import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { auth } from '@/FirebaseConfig';
import { getFriends, getIncomingRequests, getSentRequests, searchUsers, sendFriendRequest } from '@/lib/friends';

export default function SearchScreen() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [relLoading, setRelLoading] = useState(true);
  const [friendsIds, setFriendsIds] = useState<Set<string>>(new Set());
  const [pendingOutgoing, setPendingOutgoing] = useState<Set<string>>(new Set());
  const [pendingIncoming, setPendingIncoming] = useState<Set<string>>(new Set());

  const uid = auth.currentUser?.uid;

  const loadRelations = useCallback(async () => {
    if (!uid) return;
    setRelLoading(true);
    try {
      const [friends, outgoing, incoming] = await Promise.all([
        getFriends(uid),
        getSentRequests(uid),
        getIncomingRequests(uid),
      ]);
      setFriendsIds(new Set(friends.map((r: any) => (r.fromUser === uid ? r.toUser : r.fromUser))));
      setPendingOutgoing(new Set(outgoing.filter((r: any) => r.status === 'pending').map((r: any) => r.toUser)));
      setPendingIncoming(new Set(incoming.filter((r: any) => r.status === 'pending').map((r: any) => r.fromUser)));
    } finally {
      setRelLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadRelations();
  }, [loadRelations]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = term.trim();
      if (!q) { setResults([]); return; }
      setLoading(true);
      let active = true;
      try {
        const items = await searchUsers(q);
        if (active) setResults(items);
      } finally {
        if (active) setLoading(false);
      }
      return () => { active = false; };
    }, 300);
    return () => clearTimeout(t);
  }, [term]);

  const onSearch = useCallback(async () => {
    if (!term.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const items = await searchUsers(term);
      setResults(items);
    } finally {
      setLoading(false);
    }
  }, [term]);

  const canAdd = useCallback((userId: string) => {
    if (!uid || userId === uid) return false;
    if (friendsIds.has(userId)) return false;
    if (pendingOutgoing.has(userId)) return false;
    if (pendingIncoming.has(userId)) return false;
    return true;
  }, [uid, friendsIds, pendingOutgoing, pendingIncoming]);

  const onAddFriend = useCallback(async (toUserId: string) => {
    if (!uid) return;
    await sendFriendRequest(uid, toUserId);
    await loadRelations();
  }, [uid, loadRelations]);

  if (!uid) {
    return <View style={styles.center}><Text>Please sign in.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Users</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={term}
          placeholder="Search by name or email"
          autoCapitalize="none"
          onChangeText={setTerm}
          onSubmitEditing={onSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.username || item.name || item.email || item.id}</Text>
                {item.email ? <Text style={styles.sub}>{item.email}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.btn, canAdd(item.id) ? styles.add : styles.disabled]}
                onPress={() => canAdd(item.id) && onAddFriend(item.id)}
                disabled={!canAdd(item.id) || relLoading}
              >
                <Text style={styles.btnText}>{friendsIds.has(item.id) ? 'Friends' : pendingOutgoing.has(item.id) ? 'Pending' : pendingIncoming.has(item.id) ? 'Requested You' : 'Add Friend'}</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={!term ? <Text>Type to search users.</Text> : <Text>No results.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  searchBtn: { height: 44, paddingHorizontal: 12, backgroundColor: '#318bfb', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', marginTop: 8 },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { color: '#666', marginTop: 2 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  add: { backgroundColor: '#318bfb' },
  disabled: { backgroundColor: '#9ca3af' },
  btnText: { color: '#fff', fontWeight: '600' },
});
