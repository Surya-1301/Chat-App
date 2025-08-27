export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Message {
  _id: string;
  content: string;
  from: string;
  to: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage?: {
    messageId: string;
    content: string;
    from: string;
    to: string;
    createdAt: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  users?: T[];
  messages?: T[];
  message?: string;
  ok?: boolean;
  error?: string;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}
