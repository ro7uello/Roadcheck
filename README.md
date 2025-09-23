# RoadCheck - Driving Education Mobile App

A React Native mobile application for interactive driving education with scenario-based learning and animated gameplay.

## Project Structure

```
roadcheck/
├── backend/                    # Node.js + Express API server
│   ├── server.js              # Main server file
│   └── database/              # Database configuration and migrations
├── frontend/                   # React Native + Expo application
│   ├── src/
│   │   ├── app/               # Expo Router pages (file-based routing)
│   │   │   ├── scenarios/     # Driving scenario screens
│   │   │   │   └── road-markings/
│   │   │   │       └── phase1/
│   │   │   │           ├── S1P1.jsx
│   │   │   │           ├── S2P1.jsx
│   │   │   │           ├── S3P1.jsx
│   │   │   │           ├── S4P1.jsx
│   │   │   │           └── S5P1.jsx
│   │   │   ├── index.tsx      # App entry point
│   │   │   ├── login.tsx      # Login screen
│   │   │   └── ...
│   │   ├── screens/           # Screen components (legacy structure)
│   │   ├── components/        # Reusable UI components
│   │   └── assets/            # Images, sprites, road tiles
│   ├── package.json
│   └── app.json
└── README.md
```

## Features

- **Scenario-Based Learning**: Interactive driving scenarios with real-time animations
- **Database Integration**: User progress tracking and scenario management
- **Animated Gameplay**: Smooth car animations with choice-based outcomes
- **User Authentication**: Login system with progress persistence
- **Responsive Design**: Optimized for various mobile screen sizes

## Technology Stack

### Frontend
- **React Native** with **Expo** framework
- **Expo Router** for file-based navigation
- **Animated API** for smooth car and background animations
- **AsyncStorage** for local data persistence

### Backend
- **Node.js** with **Express.js**
- **Supabase** database for user data and scenarios
- RESTful API endpoints for authentication and progress tracking

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio or Xcode for device testing

### Environment Setup

1. Create a `.env` file in the frontend directory:
```env
EXPO_PUBLIC_API_URL=http://your-backend-url:3001
```

2. Create a `.env` file in the backend directory with your database credentials:
```env
DATABASE_URL=your_database_connection_string
```

### Installation & Running

**Backend:**
```bash
cd backend
npm install
npm start
```
Server will run on `http://localhost:3001`

**Frontend:**
```bash
cd frontend
npm install
npx expo start
```

## Development Guide

### Adding New Scenarios

The project uses a proven pattern for integrating scenarios with database connectivity while preserving animations:

1. **Create the frontend scenario** with all animations working
2. **Add database integration** using the established pattern:
   - Import `API_URL` and `AsyncStorage`
   - Add loading state and database fetch
   - Transform database response to match frontend format
   - Include fallback questions for offline functionality
   - Add progress tracking with correct scenario_id

3. **Preserve all animations** - never modify existing animation logic

### Database Integration Pattern

Each scenario follows this structure:
```javascript
// Database states
const [loading, setLoading] = useState(true);
const [questions, setQuestions] = useState([]);
const [scenarioData, setScenarioData] = useState(null);

// Fetch from database
const fetchScenarioData = async () => {
  // Fetch from /scenarios/{id}
  // Transform to frontend format
  // Set fallback questions if needed
};

// Update progress
const updateProgress = async (selectedOption, isCorrect) => {
  // Update user progress
  // Record attempt for analytics
};
```

### Animation Preservation

All scenarios maintain these animation elements:
- **Entrance animations**: Background scrolling and vehicle positioning
- **Choice-based animations**: Different animations for correct/incorrect answers
- **Sprite cycling**: Smooth vehicle movement animations
- **Timing sequences**: Proper animation coordination

### File Organization

- **Routes**: Use `src/app/` for Expo Router file-based routing
- **Components**: Place reusable components in `src/components/`
- **Assets**: Store images and sprites in `src/assets/`
- **Screens**: Legacy structure, gradually migrating to `app/` folder

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Scenarios
- `GET /scenarios/{id}` - Get scenario data and choices
- `POST /progress` - Update user progress
- `POST /attempts` - Record user attempts

## Database Schema

### Scenarios Table
- `id` - Scenario identifier
- `phase_id` - Phase grouping
- `title` - Scenario title
- `description` - Question text

### Scenario Choices Table
- `scenario_id` - Foreign key to scenarios
- `text` - Choice text
- `is_correct` - Boolean for correct answer
- `explanation` - Feedback explanation

## Contributing

1. Create a feature branch from `main`
2. Follow the established patterns for database integration
3. Ensure all animations are preserved when adding backend connectivity
4. Test both database and fallback functionality
5. Update documentation for any new patterns or endpoints

## Branch Information

This branch (`feat/scenario-backend-connection`) contains:
- Database integration for scenarios S1P1 through S5P1
- Preserved frontend animations for all scenarios
- User progress tracking implementation
- Fallback system for offline functionality

## Troubleshooting

### Common Issues

**White Screen on Navigation:**
- Check if the scenario is registered in the navigation stack
- Verify asset paths use correct relative paths (`../../../../../assets/`)
- Ensure all required layout files exist for nested routes

**Animation Not Working:**
- Verify useEffect dependencies include loading state
- Check that animation logic isn't being overridden by database integration
- Ensure useNativeDriver settings match the animation type

**Database Connection Issues:**
- Verify `API_URL` environment variable is set correctly
- Check backend server is running and accessible
- Confirm scenario ID exists in database

### Environment Variables

Make sure these are properly configured:
- `EXPO_PUBLIC_API_URL` - Backend API endpoint
- Database connection string in backend `.env`

## Assets

Vehicle sprites and road tiles are organized by:
- **Vehicles**: Different directions (NORTH, NORTHEAST, etc.) with animation frames
- **Roads**: Various road marking types for different scenarios
- **UI**: Dialog boxes and interface elements

Road tile naming convention:
- `road1.png`, `road2.png`, etc. for different road markings
- Used in mapLayout arrays for scenario backgrounds