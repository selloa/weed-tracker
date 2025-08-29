# Weed Tracker - Your Journey to Reduction

A modern, user-friendly web application designed to help you track your cannabis usage, set reduction goals, and eventually quit. Built with privacy in mind - all data is stored locally in your browser.

## 🌟 Features

### 📊 **Comprehensive Tracking**
- **Daily & Weekly Statistics** - Track usage patterns and trends
- **Amount Tracking** - Log precise amounts in grams
- **Method Tracking** - Record how you consume (joint, bong, vape, edible, etc.)
- **Mood Tracking** - Optional mood logging to understand patterns
- **Detailed Notes** - Add personal observations and feelings

### 🎯 **Goal Setting & Progress**
- **Weekly Goals** - Set realistic reduction targets
- **Progress Visualization** - Visual progress bars and statistics
- **Streak Counter** - Track consecutive days of usage
- **Cost Estimation** - See estimated spending based on usage

### 📱 **Modern & Responsive**
- **Beautiful UI** - Clean, modern design with smooth animations
- **Mobile Friendly** - Works perfectly on phones, tablets, and desktops
- **Dark/Light Theme** - Easy on the eyes
- **Intuitive Navigation** - Simple and easy to use

### 🔒 **Privacy & Data**
- **Local Storage** - All data stays on your device
- **No Registration** - Start using immediately
- **Export Functionality** - Backup your data anytime
- **Data Control** - Clear all data when needed

## 🚀 Getting Started

1. **Open the Application**
   - Simply open `index.html` in any modern web browser
   - No installation or setup required

2. **Add Your First Entry**
   - Fill in the amount (in grams)
   - Select your consumption method
   - Add optional notes about how you're feeling
   - Choose your mood (optional)
   - Set the time (defaults to current time)
   - Click "Add Entry"

3. **Set Your Goals**
   - Click "Set Goal" in the Goal Progress card
   - Choose your weekly target amount
   - Select your goal type (reduce, maintain, or quit)
   - Save your goal

4. **Track Your Progress**
   - Monitor your daily and weekly statistics
   - Watch your streak counter
   - See your progress toward your goals
   - Review your recent entries

## 📈 Understanding Your Data

### Dashboard Cards

**Today's Summary**
- Number of entries today
- Total amount consumed
- Estimated cost

**This Week**
- Weekly entry count
- Total weekly amount
- Daily average

**Goal Progress**
- Visual progress bar
- Remaining amount for the week
- Goal achievement status

**Current Streak**
- Consecutive days of usage
- Streak type (including today or not)

### Entry Details

Each entry includes:
- **Amount** - Precise measurement in grams
- **Method** - How you consumed (joint, bong, vape, etc.)
- **Time** - When you consumed
- **Notes** - Personal observations and feelings
- **Mood** - How you felt (optional)

## 🎯 Tips for Success

### Setting Realistic Goals
- Start with your current usage level
- Aim for 10-20% reduction initially
- Adjust goals based on your progress
- Celebrate small victories

### Using Notes Effectively
- Record triggers and situations
- Note how you feel before and after
- Track what works for reduction
- Document positive changes

### Understanding Patterns
- Review your weekly statistics
- Identify high-usage days
- Notice mood correlations
- Track method preferences

## 🔧 Data Management

### Exporting Data
- Click "Export" in the Recent Entries section
- Downloads a JSON file with all your data
- Includes entries, goals, and settings
- Useful for backup or analysis

### Clearing Data
- Click "Clear All" to remove all data
- Confirmation required to prevent accidents
- Cannot be undone - use with caution

### Privacy
- All data is stored locally in your browser
- No data is sent to external servers
- Your information stays private
- Works offline after initial load

## 🛠️ Technical Details

### Browser Compatibility
- Chrome, Firefox, Safari, Edge (latest versions)
- Requires JavaScript enabled
- Local storage support required

### Data Storage
- Uses browser's localStorage
- Data persists between sessions
- No external dependencies
- Works offline

### File Structure
```
weed-tracker/
├── index.html      # Main application
├── styles.css      # Styling and layout
├── script.js       # Application logic
└── README.md       # This file
```

## 🎨 Customization

### Changing Price Per Gram
- Edit the `pricePerGram` value in the settings
- Default is $10 per gram
- Affects cost calculations

### Adding New Methods
- Edit the method options in the HTML
- Update the method mapping in JavaScript
- Customize method labels as needed

### Styling Changes
- Modify `styles.css` for visual changes
- Colors, fonts, and layout can be customized
- Responsive design maintained

## 🤝 Support & Feedback

This application is designed to be self-contained and easy to use. If you have suggestions for improvements or encounter any issues:

1. Check that your browser supports modern JavaScript
2. Ensure local storage is enabled
3. Try clearing browser cache if needed
4. Export your data before making changes

## 📝 License

This project is open source and available under the MIT License. Feel free to modify and distribute as needed.

---

**Remember**: This tool is designed to support your journey toward reduction and eventual cessation. Always consult with healthcare professionals for medical advice regarding substance use and addiction.

**Stay strong on your journey! 🌱**
