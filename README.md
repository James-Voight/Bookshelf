# BookShelf - React Native Expo App

A cross-platform book tracking app built with React Native and Expo. To setup locally, add your env file information. free accounts can be used for everything except openAI which needs at least $5 deposited.

## Features

- **Multi-Source Tracking**: Track books from Kindle, physical collection, library, and Audible
- **Book Search**: Search by title, author using Google Books API
- **Barcode Scanner**: Scan ISBN barcodes (mobile) or enter manually (web)
- **Reading Progress**: Track your progress with page numbers or percentages
- **Reading Insights**: Visualize your reading habits with charts and statistics
- **Import/Export**: Import from Kindle, Libby, Goodreads CSV, or custom formats
- **Dark Mode**: Automatic dark mode support

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Navigate to the project folder:
```bash
cd BookShelfApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the app:
```bash
# For web (test in browser immediately)
npm run web

# For iOS (requires Mac with Xcode)
npm run ios

# For Android (requires Android Studio/emulator)
npm run android

# Start Expo dev server (scan QR with Expo Go app)
npm start
```

## Testing Options

### Option 1: Web Browser (Easiest)
```bash
npm run web
```
Opens at http://localhost:8081

### Option 2: Expo Go App (No emulator needed)
1. Install "Expo Go" on your phone (iOS/Android)
2. Run `npm start`
3. Scan the QR code with your phone

### Option 3: Android Emulator
1. Install Android Studio
2. Create a virtual device (AVD)
3. Run `npm run android`

## Project Structure

```
BookShelfApp/
├── App.tsx                    # Main app with navigation
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── BookCard.tsx
│   │   ├── BookCover.tsx
│   │   └── FilterChip.tsx
│   ├── hooks/                 # Custom React hooks
│   │   └── useBooks.ts
│   ├── screens/               # App screens
│   │   ├── LibraryScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── InsightsScreen.tsx
│   │   ├── ImportScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── BookDetailScreen.tsx
│   │   └── BarcodeScannerScreen.tsx
│   ├── services/              # API services
│   │   └── googleBooks.ts
│   ├── storage/               # Local storage
│   │   └── bookStorage.ts
│   └── types/                 # TypeScript types
│       └── book.ts
├── package.json
├── app.json                   # Expo config
└── tsconfig.json
```

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tools
- **TypeScript** - Type safety
- **React Navigation** - Navigation library
- **AsyncStorage** - Local data persistence
- **Expo Camera** - Barcode scanning
- **Google Books API** - Book search and metadata

## API

The app uses the free Google Books API:
- No API key required for basic searches
- 1,000 requests/day limit
- Covers, metadata, and descriptions included

## Building for Production

### Web
```bash
npx expo export:web
```

### iOS/Android
```bash
npx eas build --platform ios
npx eas build --platform android
```

## License

MIT - Free for personal and commercial use.
