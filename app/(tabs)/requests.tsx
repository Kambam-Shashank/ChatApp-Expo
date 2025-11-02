import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { auth } from '@/FirebaseConfig';
import { acceptFriendRequest, getIncomingRequests, getSentRequests, rejectFriendRequest } from '@/lib/friends';

type ReqItem = {
  id: string;
  fromUser: string;
  toUser: string;
  status: 'pending' | 'accepted' | 'rejected';
};

type TabKey = 'incoming' | 'sent';

export default function RequestsScreen() {
  const [tab, setTab] = useState<TabKey>('incoming');
  const [items, setItems] = useState<ReqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid;

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = tab === 'incoming' ? await getIncomingRequests(uid) : await getSentRequests(uid);
      setItems(data as ReqItem[]);
    } finally {
      setLoading(false);
    }
  }, [uid, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const onAccept = async (otherId: string) => {
    if (!uid) return;
    await acceptFriendRequest(uid, otherId);
    await load();
  };

  const onReject = async (otherId: string) => {
    if (!uid) return;
    await rejectFriendRequest(uid, otherId);
    await load();
  };

  if (!uid) {
    return <View style={styles.center}><Text>Please sign in.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setTab('incoming')} style={[styles.tab, tab==='incoming' && styles.tabActive]}>
          <Text style={[styles.tabText, tab==='incoming' && styles.tabTextActive]}>Incoming</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('sent')} style={[styles.tab, tab==='sent' && styles.tabActive]}>
          <Text style={[styles.tabText, tab==='sent' && styles.tabTextActive]}>Sent</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const other = tab === 'incoming' ? item.fromUser : item.toUser;
            return (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{other}</Text>
                  <Text style={styles.sub}>status: {item.status}</Text>
                </View>
                {tab === 'incoming' && item.status === 'pending' ? (
                  <View style={styles.row}>
                    <TouchableOpacity style={[styles.btn, styles.accept]} onPress={() => onAccept(item.fromUser)}>
                      <Text style={styles.btnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.reject]} onPress={() => onReject(item.fromUser)}>
                      <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={<Text>No requests.</Text>}
          refreshing={loading}
          onRefresh={load}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 20 },
  tabActive: { backgroundColor: '#318bfb', borderColor: '#318bfb' },
  tabText: { color: '#333' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', marginTop: 8 },
  row: { flexDirection: 'row', gap: 8 },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { color: '#666', marginTop: 4 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  accept: { backgroundColor: '#22c55e' },
  reject: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: '600' },
});
