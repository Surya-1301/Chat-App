import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from '../web-shims/react-native-web';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../api/client';
import { User, NavigationProps, ApiResponse } from '../types';

export default function Users({ navigation, route }: NavigationProps) {
  const { token, user } = route.params;
  const { logout } = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [lastMap, setLastMap] = useState<Record<string, { content: string; createdAt: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const searchTimer = useRef<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers(q = '') {
    try {
      setLoading(true);
      setError(null);
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const { data }: { data: ApiResponse<User> } = await api.get('/users' + params, { 
        headers: { Authorization: 'Bearer ' + token } 
      });
      setUsers(data.users || []);
      // fetch last messages
      try {
        const last = await api.get('/conversations/last/messages', {
          headers: { Authorization: 'Bearer ' + token },
        });
        const map: Record<string, { content: string; createdAt: string }> = {};
        (last.data.items || []).forEach((it: any) => {
          if (it.lastMessage) map[it.otherUserId] = { content: it.lastMessage.content, createdAt: it.lastMessage.createdAt };
        });
        setLastMap(map);
      } catch {}
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to load users';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-outer users-outer">
        <div className="container users-container">
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e46033" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-outer users-outer">
        <div className="container users-container">
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadUsers()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-outer users-outer">
      <div className="container users-container">
        <Text 
          style={styles.headerTitleAbsolute}
          onClick={() => loadUsers()}
        >
          Chats
        </Text>
        <TouchableOpacity 
          style={styles.logoutBtnAbsolute}
          onClick={async () => {
            await logout();
            navigation.replace('Auth', {});
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Logout</Text>
        </TouchableOpacity>
        <div style={styles.searchInputAbsolute as any}>
          <input
            placeholder="Search by name, email or username"
            value={query}
            onChange={(e: any) => {
              const v = e.target.value;
              setQuery(v);
              if (searchTimer.current) clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => loadUsers(v.trim()), 300);
            }}
            style={{
              padding: '18px 20px',
              borderRadius: '20px',
              border: 'none',
              width: '500px',
              fontSize: '22px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              outline: 'none',
              background: '#fff',
              color: '#444',
              margin: 0,
            }}
          />
        </div>
        <FlatList 
          data={users} 
          keyExtractor={(u: User) => u._id} 
          renderItem={({ item }: { item: User }) => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Chat', { token, me: user, other: item })} 
              style={styles.userItem}
            >
              <Text style={styles.userName}>{item.name}{item.username ? ` (@${item.username})` : ''}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              {lastMap[item._id] && (
                <Text style={styles.lastMsg} numberOfLines={1}>
                  {lastMap[item._id].content}
                </Text>
              )}
            </TouchableOpacity>
          )}
          refreshing={loading}
          onRefresh={() => loadUsers()}
        />
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  usersContainer: {
    backgroundColor: '#23232a',
    borderRadius: 10,
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    padding: 20,
    maxWidth: 500,
    margin: '40px auto',
    minHeight: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  usersOuter: {
    backgroundColor: '#25252b',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  userItem: {
    margin: '32px auto',
    padding: '32px 40px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    minWidth: '400px',
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
    border: 'none',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
  headerBar: {
    display: 'none',
  },
  headerTitleAbsolute: {
    position: 'absolute',
    top: 24,
    left: 32,
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    zIndex: 10,
    background: 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  logoutBtn: {
    display: 'none',
  },
  logoutBtnAbsolute: {
    position: 'absolute',
    top: 24,
    right: 32,
    padding: 0,
    border: '3px solid #e46033',
    borderRadius: 40,
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    background: 'linear-gradient(180deg, #e46033 0%, #23232a 100%)',
    width: 140,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
  userName: {
    fontWeight: '700',
    fontSize: '2rem',
    marginBottom: 0,
    color: '#111',
    marginRight: '12px',
  },
  userEmail: {
    color: '#888',
    fontSize: '1.3rem',
    fontWeight: '400',
    marginLeft: '8px',
  },
  lastMsg: {
    color: '#444',
    fontSize: 13,
    marginTop: 4
  },
  searchRow: {
    display: 'none',
  },
  searchInputAbsolute: {
    position: 'absolute',
    top: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    width: '500px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'transparent',
  },
});
