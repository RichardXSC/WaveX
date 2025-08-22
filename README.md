# 🎮 WaveX - HTML5 Rhythm Game

A modern, browser-based rhythm game inspired by OSU!Mania with a dark futuristic aesthetic and 4-key vertical scrolling gameplay.

![WaveX Gameplay](https://img.shields.io/badge/Game-Rhythm%20Game-blue) ![Platform](https://img.shields.io/badge/Platform-Web%20Browser-green) ![Tech](https://img.shields.io/badge/Tech-HTML5%20%7C%20CSS3%20%7C%20JavaScript-orange)

## ✨ Features

### 🎯 **Core Gameplay**
- **4-Key Vertical Scrolling** - D, F, J, K controls
- **Multiple Difficulty Levels** - Easy, Normal, Hard
- **Scoring System** - Perfect, Great, Good, Miss judgments
- **Combo System** - Build combos for score multipliers
- **Health System** - Optional health bar with miss penalties

### 🎨 **Visual & Audio**
- **Dark Futuristic UI** - Neon highlights with blue, purple, pink tones
- **Dynamic Background** - Animated grid and particle effects
- **Hit Animations** - Lane press highlights and note hit effects
- **Sound Effects** - Hit sounds and miss feedback

### 🛠️ **Chart Editor**
- **MP3 Upload** - Load your own music files
- **Timeline Editor** - Visual timeline with zoom and navigation
- **Note Recording** - Press DFJK during playback to record notes
- **Real-time Preview** - See notes as you place them
- **Export/Import** - Save and share your charts

### 🌐 **Community Features**
- **Chart Publishing** - Share your custom charts
- **Community Browser** - Discover charts from other creators
- **Rating System** - Rate and review community charts
- **Leaderboards** - Compete for high scores

### 👤 **Player Progression**
- **XP System** - Earn experience points for playing
- **Leveling** - Unlock new themes and features
- **Achievements** - Complete challenges and milestones
- **Profile Stats** - Track your best scores and accuracy

## 🚀 Quick Start

### **Play Online**
1. Visit the game at [your-github-pages-url]
2. Click "Play" to start
3. Use **D, F, J, K** keys to hit notes
4. Build combos and aim for perfect accuracy!

### **Local Development**
1. **Clone the repository**
   ```bash
   git clone https://github.com/RichardXSC/WaveX.git
   cd WaveX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the local server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🎮 How to Play

### **Controls**
- **D** - Left lane
- **F** - Second lane  
- **J** - Third lane
- **K** - Right lane

### **Scoring**
- **Perfect** (30ms) - 1000 points + combo
- **Great** (60ms) - 600 points + combo
- **Good** (100ms) - 200 points + combo
- **Miss** (150ms) - 0 points, breaks combo

### **Gameplay Tips**
- Hit notes when they reach the target bar at the bottom
- Build combos for score multipliers
- Watch your health bar if enabled
- Practice with the tutorial level first

## 🎵 Creating Charts

### **Editor Workflow**
1. **Upload MP3** - Load your music file
2. **Load Audio** - Wait for metadata to load
3. **Play & Record** - Press Play and use DFJK to place notes
4. **Fine-tune** - Use arrow keys to adjust timing
5. **Save/Publish** - Save locally or publish to community

### **Editor Controls**
- **Play/Pause** - Control playback
- **Arrow Keys** - Navigate timeline
- **Shift + Arrows** - Fine-tune timing
- **Backspace** - Remove last note
- **Zoom Slider** - Adjust timeline view

## 🏗️ Architecture

### **Frontend**
- **HTML5 Canvas** - Game rendering and editor timeline
- **CSS3** - Dark futuristic UI with animations
- **Vanilla JavaScript** - Game logic and audio management

### **Backend**
- **Node.js + Express** - File upload server
- **Multer** - MP3 and artwork file handling
- **Local Storage** - Chart persistence and user data

### **Audio System**
- **Web Audio API** - Audio context and hit sounds
- **HTML5 Audio** - MP3 playback and seeking
- **Audio Context Management** - Browser autoplay handling

## 📁 Project Structure

```
WaveX/
├── index.html          # Main game interface
├── style.css           # Game styles and animations
├── script.js           # Game logic and editor
├── server.js           # Express server for uploads
├── package.json        # Dependencies
└── README.md           # This file
```

## 🌟 Features in Detail

### **Game Modes**
- **Play Mode** - Standard rhythm gameplay
- **Editor Mode** - Create and edit charts
- **Community Mode** - Browse and download charts
- **Profile Mode** - View stats and achievements
- **Options Mode** - Customize gameplay settings

### **Modifiers**
- **Speed Multiplier** - Adjust note scroll speed
- **Mirror Mode** - Reverse lane order
- **Fade In** - Notes fade in as they approach
- **Health Toggle** - Enable/disable health system

### **Themes**
- **Neon** - Default dark theme (unlocked)
- **Ice** - Cool blue theme (Level 3+)
- **Sunset** - Warm orange theme (Level 5+)
- **Mono** - Minimalist theme (Level 7+)

## 🔧 Configuration

### **Game Options**
- **Volume** - Master audio volume
- **Hit Volume** - Sound effect volume
- **Speed** - Note scroll speed (1-10)
- **Mirror** - Reverse lane order
- **Fade In** - Note fade-in effect
- **Health** - Enable health system
- **Theme** - Visual theme selection

### **Server Configuration**
- **Port** - Server port (default: 3000)
- **File Storage** - MP3 and artwork uploads
- **CORS** - Cross-origin resource sharing

## 🚀 Deployment

### **GitHub Pages (Frontend)**
1. Push code to GitHub
2. Enable GitHub Pages in repository settings
3. Set source to main branch
4. Access at `https://username.github.io/WaveX/`

### **Render (Backend)**
1. Connect GitHub repository to Render
2. Configure as Web Service
3. Set build command: `npm install`
4. Set start command: `node server.js`

## 🔐 Security Notes

- **Never commit** `.env` files to git
- **Change the default admin password** in production
- The admin password is hashed using bcrypt
- Admin sessions expire after 24 hours

### **Local Development**
1. Install Node.js and npm
2. Clone repository
3. Run `npm install`
4. Run `npm start`
5. Access at `http://localhost:3000`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source. Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- Inspired by OSU!Mania and other rhythm games
- Built with modern web technologies
- Community-driven chart creation and sharing

## 📞 Support

- **Issues** - Report bugs on GitHub
- **Discussions** - Ask questions and share ideas
- **Community** - Join the WaveX community

---

**🎮 Ready to play? Start your rhythm journey with WaveX!**

*Built with ❤️ using HTML5, CSS3, and JavaScript*
