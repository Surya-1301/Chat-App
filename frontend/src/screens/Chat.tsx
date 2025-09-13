import React from 'react';
import ChatScreen from './ChatScreen';
import { NavigationProps } from '../types';

export default function Chat({ route }: NavigationProps) {
  const { other } = route.params;
  const newRoute = {
    params: {
      recipientId: other._id,
      recipientName: other.name,
    }
  }
  return <ChatScreen route={newRoute} />;
}
