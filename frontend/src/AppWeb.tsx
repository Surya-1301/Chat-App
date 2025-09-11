import React, { useContext, useState } from 'react';
import Auth from './screens/Auth';
import Users from './screens/Users';
import Chat from './screens/Chat';
import { AuthContext } from './contexts/AuthContext';

type ScreenName = 'Auth' | 'Users' | 'Chat';

export default function App() {
  const { token, user, loading } = useContext(AuthContext);
  const [screen, setScreen] = useState<{ name: ScreenName; params?: any }>(
    { name: token ? 'Users' : 'Auth', params: {} }
  );

  const navigate = (name: ScreenName, params?: any) => setScreen({ name, params });
  const replace = (name: ScreenName, params?: any) => setScreen({ name, params });

  const nav = { navigate, replace } as any;

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {screen.name === 'Auth' && (
        <Auth navigation={nav} route={{ params: {} }} />
      )}

      {screen.name === 'Users' && (
        <Users navigation={nav} route={{ params: { token, user } }} />
      )}

      {screen.name === 'Chat' && (
        <Chat navigation={nav} route={{ params: screen.params }} />
      )}
    </div>
  );
}
