# WaveX Page Structure

WaveX has been restructured into separate HTML pages for better organization and maintainability. Each page serves a specific purpose and can be navigated independently.

## Page Overview

### 1. **index.html** (Entry Point)
- **Purpose**: Entry point that automatically redirects to main menu
- **Function**: Simple redirect page with fallback link
- **Navigation**: Auto-redirects to `main-menu.html`

### 2. **main-menu.html** (Main Menu)
- **Purpose**: Central hub for all game features
- **Features**: 
  - Play button → `song-select.html`
  - Editor button → `editor.html`
  - Community Charts → `community.html`
  - Profile → `profile.html`
  - Options → `options.html`
  - Admin Panel (modal)
- **Navigation**: Links to all major sections

### 3. **song-select.html** (Song Selection)
- **Purpose**: Browse and select available songs/levels
- **Features**:
  - Search and filter songs
  - Difficulty filtering
  - Song list display
- **Navigation**: Back to main menu, forward to individual levels

### 4. **game.html** (Gameplay)
- **Purpose**: Main gameplay interface
- **Features**:
  - Game canvas and HUD
  - Pause menu
  - Results screen
- **Navigation**: Returns to song select after completion

### 5. **editor.html** (Chart Editor)
- **Purpose**: Create and edit rhythm game charts
- **Features**:
  - Timeline editor
  - Note placement tools
  - Audio import/export
- **Navigation**: Back to main menu

### 6. **community.html** (Community Charts)
- **Purpose**: Browse user-created content
- **Features**:
  - Community chart list
  - Refresh functionality
- **Navigation**: Back to main menu

### 7. **profile.html** (User Profile)
- **Purpose**: Manage user settings and view stats
- **Features**:
  - Username and avatar settings
  - Statistics display
  - Unlocks and achievements
- **Navigation**: Back to main menu

### 8. **options.html** (Game Options)
- **Purpose**: Configure game settings
- **Features**:
  - Audio settings
  - Gameplay options
  - Theme selection
  - Control information
- **Navigation**: Back to main menu

### 9. **teto-medicine.html** (Teto Medicine Level)
- **Purpose**: Dedicated page for the Teto Medicine level
- **Features**:
  - Song information and artwork
  - Difficulty and metadata
  - YouTube preview
  - Personal statistics
  - Play button
- **Navigation**: Back to song select or main menu

## Navigation Flow

```
index.html → main-menu.html
    ↓
├── song-select.html → game.html (after song selection)
├── editor.html
├── community.html
├── profile.html
├── options.html
└── teto-medicine.html → game.html (after clicking play)
```

## Key Benefits

1. **Separation of Concerns**: Each page has a single responsibility
2. **Better Performance**: Only load necessary content for each page
3. **Easier Maintenance**: Modify individual pages without affecting others
4. **Cleaner URLs**: Each feature has its own URL
5. **Better User Experience**: Clear navigation between features
6. **Scalability**: Easy to add new levels or features as separate pages

## Adding New Levels

To add a new level, create a new HTML file following the pattern of `teto-medicine.html`:

1. Create `[level-name].html`
2. Include level-specific information and artwork
3. Add navigation back to song select
4. Include play functionality that redirects to `game.html`
5. Add the level to the song list in `song-select.html`

## Technical Notes

- All pages share the same `style.css` and `script.js` files
- Navigation uses standard HTML links (`window.location.href`)
- Each page initializes its specific functionality on `DOMContentLoaded`
- The admin panel remains as a modal across all pages
- Background canvas and styling are consistent across all pages
