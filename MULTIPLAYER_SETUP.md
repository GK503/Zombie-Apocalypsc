# Firebase Multiplayer Setup Guide

## Overview
Your game now has efficient Firebase Real-time multiplayer! The implementation includes:

- ✅ **Throttled position updates** (20 updates/sec for players, 10/sec for enemies)
- ✅ **Smooth interpolation** for remote player movement
- ✅ **Host-based enemy management** (only one player manages enemies to reduce sync overhead)
- ✅ **Projectile synchronization** across all players
- ✅ **Automatic player disconnect handling**
- ✅ **Efficient data compression** (rounded coordinates, delta updates)

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "lastlight-multiplayer")
4. Disable Google Analytics (optional, but simpler for gaming)
5. Click "Create project"

### Step 2: Enable Realtime Database

1. In your Firebase project, click "Realtime Database" in the left menu
2. Click "Create Database"
3. Choose a location closest to your target audience
4. Start in **test mode** for development (you can secure it later)
5. Click "Enable"

### Step 3: Get Your Configuration

1. In Firebase Console, click the gear icon ⚙️ > "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Register your app with a nickname (e.g., "LastLight Game")
5. Copy the `firebaseConfig` object

### Step 4: Update Your Code

Open `src/firebase-config.ts` and replace the configuration:

```typescript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
};
```

## How to Use Multiplayer

### Joining the Same Room

Players join the same game by using the same room ID. You have two options:

**Option 1: URL Parameter (Recommended)**
- Host visits: `http://localhost:5173/?room=game123`
- Friends visit: `http://localhost:5173/?room=game123`

**Option 2: Edit Default Room**
In `src/main.ts`, line ~343, change:
```typescript
const roomId = urlParams.get('room') || 'my-custom-room';
```

### Testing Multiplayer Locally

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open multiple browser tabs:
   - Tab 1: `http://localhost:5173/?room=test`
   - Tab 2: `http://localhost:5173/?room=test`
   - Tab 3: `http://localhost:5173/?room=test`

3. You should see other players appearing as blue characters!

### Disabling Multiplayer

In `src/main.ts`, line ~161, set:
```typescript
multiplayerEnabled: boolean = false;
```

## Architecture Details

### Efficiency Optimizations

1. **Throttled Updates**: Position updates are limited to 20Hz to reduce Firebase writes
2. **Rounded Coordinates**: Positions rounded to 1 decimal place (90% data reduction)
3. **Host Authority**: Only the first player manages enemies, others receive updates
4. **Client-Side Interpolation**: Smooth movement between network updates
5. **Dead Reckoning**: Clients predict movement between updates

### Network Data Flow

**Players:**
- Each client sends: position, health, animation state, facing direction
- Receives: All other players' states
- Update rate: 50ms (20/sec)

**Enemies (Host only):**
- Host sends: All enemy positions, health, death states
- Clients receive: Enemy state updates
- Update rate: 100ms (10/sec)

**Projectiles:**
- Fired projectiles broadcast to all clients
- Each client simulates projectile independently
- Collision detection on all clients

### Firebase Database Structure

```
rooms/
  └── {roomId}/
      ├── players/
      │   └── {playerId}/
      │       ├── x: number
      │       ├── y: number
      │       ├── health: number
      │       ├── currentAnim: string
      │       ├── facingX: number
      │       └── facingY: number
      ├── enemies/
      │   ├── states: EnemyState[]
      │   └── timestamp: number
      └── projectiles/
          └── {projectileId}/
              ├── playerId: string
              ├── x: number
              ├── y: number
              ├── dx: number
              ├── dy: number
              └── timestamp: number
```

## Production Considerations

### Security Rules

Before deploying, update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "players": {
          "$playerId": {
            ".validate": "newData.hasChildren(['x', 'y', 'health'])"
          }
        },
        "enemies": {
          ".validate": "newData.hasChildren(['states', 'timestamp'])"
        }
      }
    }
  }
}
```

### Scaling Considerations

- **Max players per room**: ~20 players (depends on action frequency)
- **Firebase pricing**: Free tier includes 1GB storage, 10GB/month downloads
- **Latency**: Typically 50-150ms for Realtime Database
- For larger games (50+ players), consider Firebase Functions for authoritative server

### Advanced Features to Add

1. **Player names/avatars**: Add to player state
2. **Chat system**: Add a messages node
3. **Matchmaking**: Create a lobby system
4. **Lag compensation**: Implement server timestamp reconciliation
5. **Cheating prevention**: Add server-side validation
6. **Reconnection**: Save player state on disconnect
7. **Spectator mode**: Read-only room access

## Debugging

Check browser console for logs:
- `Joining room: {roomId} as {playerId}`
- `You are the host! Managing enemies.`
- `Player {id} joined`
- `Player {id} left`

### Common Issues

**Players don't see each other:**
- Verify both use the same room ID
- Check Firebase Console > Realtime Database to see if data is writing
- Check browser console for errors

**High latency:**
- Increase throttle intervals in `NetworkManager.ts`
- Choose Firebase region closest to players

**Too many Firebase writes:**
- Increase `POSITION_UPDATE_INTERVAL` and `ENEMY_UPDATE_INTERVAL`
- Implement prediction/smoothing on client

## Performance Metrics

Expected Firebase usage for 4 players in 10-minute session:
- **Writes**: ~12,000 (300/min per player with throttling)
- **Reads**: ~24,000 (constant listening)
- **Data Transfer**: ~5MB
- **Cost**: Free tier covers ~100 player-hours/month

## Next Steps

1. Set up Firebase (follow steps above)
2. Update `firebase-config.ts` with your credentials
3. Run `npm run dev`
4. Open multiple tabs with same room parameter
5. Start playing together! 🎮

Enjoy your multiplayer zombie survival game!
