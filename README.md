# Chat App

A real-time chat application built with React Native (Expo) for the mobile client and Node.js/Express for the backend server.

## Features

- 🔐 User authentication (login/register)
- 👥 User management
- 💬 Real-time messaging with Socket.IO
- ✨ Typing indicators
- 📱 Message delivery and read receipts
- 🎨 Modern, responsive UI
- 🔒 Secure token-based authentication
- 📱 Cross-platform mobile app

## Project Structure

```
Chat App/
├── mobile/                 # React Native (Expo) mobile app
│   ├── src/
│   │   ├── api/           # API client configuration
│   │   ├── config/        # Environment configuration
│   │   ├── screens/       # App screens
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── App.tsx            # Main app component
└── server/                 # Node.js backend server
    ├── src/
    │   ├── config/        # Database configuration
    │   ├── controllers/   # Route controllers
    │   ├── middleware/    # Express middleware
    │   ├── models/        # Mongoose models
    │   ├── routes/        # API routes
    │   ├── socket/        # Socket.IO handlers
    │   └── utils/         # Utility functions
    └── index.js           # Server entry point
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Environment Variables

### Server (.env)
```env
MONGO_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
PORT=4000
NODE_ENV=development
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Sample Users

These demo accounts are pre-seeded by `npm run seed` (server):

- Alice — email: `alice@example.com`, password: `password123`
- Bob — email: `bob@example.com`, password: `password123`
- Charlie — email: `charlie@example.com`, password: `password123`

Tips:
- Expo Web: open `http://localhost:19006` and ensure API is `http://localhost:4000`.
- Android Emulator: set API to `http://10.0.2.2:4000`.
- Real device on LAN: set API to your Mac’s IP, e.g. `http://192.168.1.x:4000`.

## Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd Chat-App
```

### 2. Install server dependencies
```bash
cd server
npm install
```

### 3. Install mobile dependencies
```bash
cd ../mobile
npm install
```

### 4. Set up environment variables
Create `.env` files in both `server/` and `mobile/` directories with the values shown above.

### 5. Start the server
```bash
cd ../server
npm run dev
```

The server will start on `http://localhost:4000`

### 6. Start the mobile app
```bash
cd ../mobile
npm start
```

This will open the Expo development server. You can then:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan the QR code with Expo Go app on your phone

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Users
- `GET /users` - Get all users (requires authentication)

### Conversations
- `GET /conversations/:userId/messages` - Get conversation messages (requires authentication)

## Socket.IO Events

### Client to Server
- `message:send` - Send a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:read` - Mark messages as read

### Server to Client
- `message:new` - New message received
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `message:read` - Message read confirmation
- `user:status` - User online/offline status

## Development

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

### Testing
```bash
# Server tests
cd server
npm test

# Mobile tests
cd mobile
npm test
```

## Deployment

### Server
The server includes a `Dockerfile` and `render.yaml` for easy deployment to Render.com or other platforms.

### Mobile
The mobile app can be built and deployed using Expo's build services:
```bash
cd mobile
eas build --platform ios
eas build --platform android
```

## Troubleshooting

### Common Issues

1. **Socket connection errors**: Ensure the server is running and the API URL is correct
2. **Authentication errors**: Check JWT_SECRET is set correctly
3. **Database connection errors**: Verify MongoDB is running and MONGO_URI is correct
4. **Mobile build errors**: Ensure all dependencies are installed and Expo CLI is up to date

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your server environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
