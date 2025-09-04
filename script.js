// Weed Tracker Application
// Data management and functionality

class WeedTracker {
    constructor() {
        this.entries = this.loadEntries();
        this.goals = this.loadGoals();
        this.settings = this.loadSettings();
        this.alternatives = this.loadAlternatives();
        this.charts = {}; // Store chart instances
        this.currentChartIndex = 0; // Track current chart in compact view (0 = Daily Usage Trend)
        this.isExpanded = false; // Track expanded state
        this.timeManuallyChanged = false; // Track if user manually changed the time
        this.darkMode = this.loadDarkMode(); // Load dark mode preference
        
        // Define chart types
        this.chartTypes = [
            { type: 'daily', title: 'Daily Usage Trend', icon: 'fas fa-calendar-day' },
            { type: 'time', title: 'Usage by Time of Day', icon: 'fas fa-clock' },
            { type: 'method', title: 'Method Distribution', icon: 'fas fa-smoking' }
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDateTime();
        this.updateDashboard();
        this.renderEntries();
        this.renderAlternatives();
        this.initializeCharts(); // Initialize charts
        
        // Initialize dark mode after DOM is ready
        setTimeout(() => {
            this.initializeDarkMode();
        }, 100);
        
        // Start timer to update time since last joint every minute
        setInterval(() => {
            this.updateTimeSinceLastJoint();
        }, 60000); // Update every minute
        
        // Start timer to update time field in real-time (every second)
        setInterval(() => {
            this.updateTimeField();
        }, 1000); // Update every second
    }

    // Data Management with Error Handling
    loadEntries() {
        return this.safeLocalStorageOperation(() => {
            const saved = localStorage.getItem('weedTrackerEntries');
            if (!saved) return [];
            
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) {
                console.warn('Invalid entries data found, resetting to empty array');
                return [];
            }
            
            // Validate each entry and sort by consumption timestamp
            const validEntries = parsed.filter(entry => this.validateEntry(entry));
            return validEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }, []);
    }

    saveEntries() {
        this.safeLocalStorageOperation(() => {
            localStorage.setItem('weedTrackerEntries', JSON.stringify(this.entries));
        });
    }

    loadGoals() {
        try {
            const saved = localStorage.getItem('weedTrackerGoals');
            if (!saved) return this.getDefaultGoals();
            
            const parsed = JSON.parse(saved);
            return this.validateGoals(parsed) ? parsed : this.getDefaultGoals();
        } catch (error) {
            console.error('Failed to load goals:', error);
            this.showMessage('Failed to load goal settings. Using defaults.', 'error');
            return this.getDefaultGoals();
        }
    }

    saveGoals() {
        try {
            localStorage.setItem('weedTrackerGoals', JSON.stringify(this.goals));
        } catch (error) {
            console.error('Failed to save goals:', error);
            this.showMessage('Failed to save goal settings. Please check your browser storage.', 'error');
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('weedTrackerSettings');
            if (!saved) return this.getDefaultSettings();
            
            const parsed = JSON.parse(saved);
            return this.validateSettings(parsed) ? parsed : this.getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.showMessage('Failed to load settings. Using defaults.', 'error');
            return this.getDefaultSettings();
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('weedTrackerSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showMessage('Failed to save settings. Please check your browser storage.', 'error');
        }
    }

    loadAlternatives() {
        try {
            const saved = localStorage.getItem('weedTrackerAlternatives');
            if (!saved) return this.getDefaultAlternatives();
            
            const parsed = JSON.parse(saved);
            return this.validateAlternatives(parsed) ? parsed : this.getDefaultAlternatives();
        } catch (error) {
            console.error('Failed to load alternatives:', error);
            return this.getDefaultAlternatives();
        }
    }

    saveAlternatives() {
        try {
            localStorage.setItem('weedTrackerAlternatives', JSON.stringify(this.alternatives));
        } catch (error) {
            console.error('Failed to save alternatives:', error);
            // Don't show error for alternatives as it's not critical
        }
    }

    // Default data structures
    getDefaultGoals() {
        return {
            weeklyAmount: 0,
            goalType: 'reduce',
            startDate: null,
            stashAmount: 0,
            stashStartDate: null
        };
    }

    getDefaultSettings() {
        return {
            pricePerGram: 10,
            currency: 'USD'
        };
    }

    getDefaultAlternatives() {
        return {
            triedItems: [],
            lastRefresh: null
        };
    }

    // Dark Mode Management
    loadDarkMode() {
        try {
            const saved = localStorage.getItem('weedTrackerDarkMode');
            if (saved === null) {
                // Default to system preference
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return saved === 'true';
        } catch (error) {
            console.error('Failed to load dark mode preference:', error);
            return false; // Default to light mode
        }
    }

    saveDarkMode() {
        try {
            localStorage.setItem('weedTrackerDarkMode', this.darkMode.toString());
        } catch (error) {
            console.error('Failed to save dark mode preference:', error);
        }
    }

    initializeDarkMode() {
        console.log('Initializing dark mode, current state:', this.darkMode);
        this.applyDarkMode(this.darkMode);
        this.updateDarkModeIcon();
        console.log('Dark mode initialized');
    }

    toggleDarkMode() {
        console.log('Toggling dark mode from:', this.darkMode);
        this.darkMode = !this.darkMode;
        console.log('New dark mode state:', this.darkMode);
        this.applyDarkMode(this.darkMode);
        this.updateDarkModeIcon();
        this.saveDarkMode();
        this.updateChartsForDarkMode(); // Update chart colors
        this.showMessage(this.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'success');
    }

    applyDarkMode(isDark) {
        const body = document.body;
        console.log('Applying dark mode:', isDark);
        if (isDark) {
            body.setAttribute('data-theme', 'dark');
            console.log('Added data-theme="dark" to body');
        } else {
            body.removeAttribute('data-theme');
            console.log('Removed data-theme attribute from body');
        }
    }

    updateDarkModeIcon() {
        const icon = document.getElementById('darkModeIcon');
        console.log('Updating dark mode icon, found element:', !!icon);
        if (icon) {
            const newClass = this.darkMode ? 'fas fa-sun' : 'fas fa-moon';
            icon.className = newClass;
            console.log('Updated icon class to:', newClass);
        } else {
            console.error('Dark mode icon element not found!');
        }
    }

    updateChartsForDarkMode() {
        // Destroy and recreate charts with new colors
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                try {
                    chart.destroy();
                } catch (error) {
                    console.error('Error destroying chart:', error);
                }
            }
        });
        this.charts = {};
        
        // Recreate charts with new color scheme
        this.initializeCharts();
    }

    getChartColors() {
        if (this.darkMode) {
            return {
                primary: '#81c784',
                secondary: '#4fc3f7',
                success: '#66bb6a',
                danger: '#ef5350',
                warning: '#ffb74d',
                info: '#42a5f5',
                accent: '#9c27b0',
                background: 'rgba(129, 199, 132, 0.1)',
                border: '#81c784',
                text: '#e2e8f0',
                grid: 'rgba(255, 255, 255, 0.1)'
            };
        } else {
            return {
                primary: '#667eea',
                secondary: '#764ba2',
                success: '#48bb78',
                danger: '#e53e3e',
                warning: '#ed8936',
                info: '#3182ce',
                accent: '#9f7aea',
                background: 'rgba(102, 126, 234, 0.1)',
                border: '#667eea',
                text: '#333',
                grid: 'rgba(0, 0, 0, 0.1)'
            };
        }
    }

    // Data Validation Methods
    validateEntry(entry) {
        try {
            // Check if entry is an object
            if (!entry || typeof entry !== 'object') {
                return false;
            }

            // Validate required fields
            if (!entry.id || typeof entry.id !== 'number') {
                return false;
            }

            if (!entry.amount || typeof entry.amount !== 'number' || entry.amount <= 0) {
                return false;
            }

            if (!entry.method || typeof entry.method !== 'string') {
                return false;
            }

            // Validate optional fields
            if (entry.notes && typeof entry.notes !== 'string') {
                return false;
            }

            if (entry.mood && typeof entry.mood !== 'string') {
                return false;
            }

            if (!entry.timestamp || !this.isValidDate(entry.timestamp)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Entry validation error:', error);
            return false;
        }
    }

    validateGoals(goals) {
        try {
            if (!goals || typeof goals !== 'object') {
                return false;
            }

            // Validate required fields
            if (typeof goals.weeklyAmount !== 'number' || goals.weeklyAmount < 0) {
                return false;
            }

            if (!goals.goalType || !['reduce', 'maintain', 'quit', 'stash'].includes(goals.goalType)) {
                return false;
            }

            if (goals.stashAmount !== undefined && (typeof goals.stashAmount !== 'number' || goals.stashAmount < 0)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Goals validation error:', error);
            return false;
        }
    }

    validateSettings(settings) {
        try {
            if (!settings || typeof settings !== 'object') {
                return false;
            }

            if (typeof settings.pricePerGram !== 'number' || settings.pricePerGram < 0) {
                return false;
            }

            if (!settings.currency || typeof settings.currency !== 'string') {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Settings validation error:', error);
            return false;
        }
    }

    validateAlternatives(alternatives) {
        try {
            if (!alternatives || typeof alternatives !== 'object') {
                return false;
            }

            if (!Array.isArray(alternatives.triedItems)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Alternatives validation error:', error);
            return false;
        }
    }

    isValidDate(dateString) {
        try {
            const date = new Date(dateString);
            return date instanceof Date && !isNaN(date);
        } catch (error) {
            return false;
        }
    }

    // Utility function to check localStorage availability
    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Enhanced error handling for localStorage operations
    safeLocalStorageOperation(operation, fallback = null) {
        if (!this.isLocalStorageAvailable()) {
            console.warn('localStorage is not available');
            return fallback;
        }

        try {
            return operation();
        } catch (error) {
            console.error('localStorage operation failed:', error);
            return fallback;
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Quick add form
        document.getElementById('quickAddForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEntry();
        });

        // Goal form
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });

        // Time input change listener
        const timeInput = document.getElementById('time');
        if (timeInput) {
            timeInput.addEventListener('input', () => {
                this.timeManuallyChanged = true;
            });
        }

        // Modal close events
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        console.log('Setting up dark mode toggle, found element:', !!darkModeToggle);
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                console.log('Dark mode toggle clicked!');
                this.toggleDarkMode();
            });
            console.log('Dark mode toggle event listener added');
        } else {
            console.error('Dark mode toggle button not found!');
        }
    }

    // Entry Management with Validation and Sanitization
    addEntry() {
        try {
            const form = this.getElementSafely('quickAddForm');
            if (!form) {
                this.showMessage('Form not found. Please refresh the page.', 'error');
                return;
            }
            
            // Get form elements safely
            const amountInput = this.getElementSafely('amount');
            const methodInput = this.getElementSafely('method');
            const notesInput = this.getElementSafely('notes');
            const moodInput = this.getElementSafely('mood');
            const timeInput = this.getElementSafely('time');

            if (!amountInput || !methodInput || !timeInput) {
                this.showMessage('Required form elements not found. Please refresh the page.', 'error');
                return;
            }
            
            // Validate and sanitize form data
            const amount = parseFloat(amountInput.value);
            const method = methodInput.value;
            const notes = this.sanitizeInput(notesInput.value.trim());
            const mood = moodInput.value;
            const timestamp = timeInput.value;

            // Validate required fields
            if (!amount || amount <= 0 || amount > 1000) { // Reasonable upper limit
                this.showMessage('Please enter a valid amount between 0.1 and 1000 grams.', 'error');
                return;
            }

            if (!method || !['joint', 'bong', 'pipe', 'cigarette', 'vape', 'edible', 'other'].includes(method)) {
                this.showMessage('Please select a valid consumption method.', 'error');
                return;
            }

            if (!timestamp || !this.isValidDate(timestamp)) {
                this.showMessage('Please enter a valid date and time.', 'error');
                return;
            }

            // Validate mood if provided
            if (mood && !['great', 'good', 'neutral', 'bad', 'terrible'].includes(mood)) {
                this.showMessage('Please select a valid mood option.', 'error');
                return;
            }

            const entry = {
                id: Date.now(),
                amount: amount,
                method: method,
                notes: notes,
                mood: mood,
                timestamp: timestamp,
                createdAt: new Date().toISOString()
            };

            // Validate the complete entry
            if (!this.validateEntry(entry)) {
                this.showMessage('Invalid entry data. Please check your input.', 'error');
                return;
            }

            this.entries.push(entry);
            // Sort entries by consumption timestamp (most recent first)
            this.entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            this.saveEntries();
            
            // Reset form
            form.reset();
            this.setDefaultDateTime();
            this.timeManuallyChanged = false; // Reset the manual change flag
            
            // Update UI
            this.updateDashboard();
            this.renderEntries();
            this.updateCompactChart(); // Update compact chart specifically
            
            // Show success message
            this.showMessage('Entry added successfully!', 'success');
        } catch (error) {
            console.error('Error adding entry:', error);
            this.showMessage('Failed to add entry. Please try again.', 'error');
        }
    }

    deleteEntry(id) {
        try {
            if (!id || typeof id !== 'number') {
                this.showMessage('Invalid entry ID.', 'error');
                return;
            }

            const initialLength = this.entries.length;
            this.entries = this.entries.filter(entry => entry.id !== id);
            
            if (this.entries.length === initialLength) {
                this.showMessage('Entry not found.', 'error');
                return;
            }

            this.saveEntries();
            this.updateDashboard();
            this.renderEntries();
            this.updateCompactChart(); // Update compact chart specifically
            this.showMessage('Entry deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting entry:', error);
            this.showMessage('Failed to delete entry. Please try again.', 'error');
        }
    }

    // Dashboard Updates with Error Handling
    updateDashboard() {
        try {
            this.updateTodayStats();
            this.updateWeekStats();
            this.updateGoalProgress();
            this.updateStreak();
            this.updateTimeSinceLastJoint();
        } catch (error) {
            console.error('Error updating dashboard:', error);
            this.showMessage('Failed to update dashboard. Please refresh the page.', 'error');
        }
    }

    updateTodayStats() {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const last24HoursEntries = this.entries.filter(entry => {
            const entryTime = new Date(entry.timestamp);
            return entryTime >= twentyFourHoursAgo && entryTime <= now;
        });

        const last24HoursCount = last24HoursEntries.length;
        const last24HoursAmount = last24HoursEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const last24HoursCost = (last24HoursAmount * this.settings.pricePerGram).toFixed(2);

        document.getElementById('todayCount').textContent = last24HoursCount;
        document.getElementById('todayAmount').textContent = last24HoursAmount.toFixed(1) + 'g';
        document.getElementById('todayCost').textContent = '$' + last24HoursCost;
    }

    updateWeekStats() {
        const now = new Date();
        // Calculate last 7 days instead of current week
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weekEntries = this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= sevenDaysAgo && entryDate <= now;
        });

        const weekCount = weekEntries.length;
        const weekAmount = weekEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const weekAvg = weekCount > 0 ? weekAmount / 7 : 0;

        document.getElementById('weekCount').textContent = weekCount;
        document.getElementById('weekAmount').textContent = weekAmount.toFixed(1) + 'g';
        document.getElementById('weekAvg').textContent = weekAvg.toFixed(1) + 'g';
    }

    updateGoalProgress() {
        if (this.goals.goalType === 'stash') {
            this.updateStashProgress();
            return;
        }

        if (!this.goals.weeklyAmount || this.goals.weeklyAmount <= 0) {
            document.getElementById('goalProgress').style.width = '0%';
            document.getElementById('goalText').textContent = 'Set a weekly goal to track progress';
            return;
        }

        const now = new Date();
        // Calculate last 7 days instead of current week
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weekEntries = this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= sevenDaysAgo && entryDate <= now;
        });

        const weekAmount = weekEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const progress = Math.min((weekAmount / this.goals.weeklyAmount) * 100, 100);

        document.getElementById('goalProgress').style.width = progress + '%';
        
        const remaining = this.goals.weeklyAmount - weekAmount;
        if (remaining > 0) {
            document.getElementById('goalText').textContent = `${remaining.toFixed(1)}g remaining this week`;
        } else {
            document.getElementById('goalText').textContent = `Goal exceeded by ${Math.abs(remaining).toFixed(1)}g`;
        }
    }

    updateStashProgress() {
        if (!this.goals.stashAmount || this.goals.stashAmount <= 0) {
            document.getElementById('goalProgress').style.width = '0%';
            document.getElementById('goalText').textContent = 'Set a stash goal to track your weed supply';
            return;
        }

        // Calculate total usage since stash start date
        const stashStartDate = this.goals.stashStartDate ? new Date(this.goals.stashStartDate) : new Date();
        const entriesSinceStash = this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= stashStartDate;
        });

        const totalUsed = entriesSinceStash.reduce((sum, entry) => sum + entry.amount, 0);
        const remainingStash = this.goals.stashAmount - totalUsed;
        const progress = Math.min((totalUsed / this.goals.stashAmount) * 100, 100);

        document.getElementById('goalProgress').style.width = progress + '%';
        
        if (remainingStash > 0) {
            document.getElementById('goalText').textContent = `${remainingStash.toFixed(1)}g left in stash`;
        } else {
            document.getElementById('goalText').textContent = `Stash depleted by ${Math.abs(remainingStash).toFixed(1)}g`;
        }
    }

    updateStreak() {
        const streak = this.calculateStreak();
        document.getElementById('currentStreak').textContent = streak.count;
        document.getElementById('streakType').textContent = streak.type;
    }

    updateTimeSinceLastJoint() {
        const timeSince = this.calculateTimeSinceLastJoint();
        document.getElementById('timeSinceNumber').textContent = timeSince.value;
        document.getElementById('timeSinceLabel').textContent = timeSince.unit;
        document.getElementById('timeSinceText').textContent = timeSince.text;
    }

    calculateStreak() {
        if (this.entries.length === 0) {
            return { count: 0, type: 'No streak yet' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let currentDate = new Date(today);
        let streakCount = 0;
        let hasEntryToday = false;

        // Check if there's an entry today
        const todayEntries = this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === today.getTime();
        });

        if (todayEntries.length > 0) {
            hasEntryToday = true;
        }

        // Calculate streak
        while (true) {
            const dateEntries = this.entries.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === currentDate.getTime();
            });

            if (dateEntries.length > 0) {
                streakCount++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        if (streakCount === 0) {
            return { count: 0, type: 'No streak yet' };
        } else if (hasEntryToday) {
            return { count: streakCount, type: 'day streak (including today)' };
        } else {
            return { count: streakCount, type: 'day streak (last entry yesterday)' };
        }
    }

    calculateTimeSinceLastJoint() {
        if (this.entries.length === 0) {
            return {
                value: 0,
                unit: 'hours',
                text: 'No usage yet'
            };
        }

        // Find the most recent usage by looking at all entries and finding the latest timestamp
        let mostRecentEntry = this.entries[0];
        let mostRecentTime = new Date(mostRecentEntry.timestamp);
        
        for (const entry of this.entries) {
            const entryTime = new Date(entry.timestamp);
            if (entryTime > mostRecentTime) {
                mostRecentTime = entryTime;
                mostRecentEntry = entry;
            }
        }
        
        const now = new Date();
        const timeDiff = now.getTime() - mostRecentTime.getTime();

        // Convert to different time units
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30.44); // Average days per month
        const years = Math.floor(days / 365.25); // Account for leap years

        // Determine the best unit to display with no more than 2 digits
        const timeOfDay = mostRecentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (years > 0) {
            return {
                value: Math.min(years, 99), // Cap at 99 years
                unit: 'years',
                text: `Last usage: ${mostRecentEntry.amount}g ${this.getMethodLabel(mostRecentEntry.method)} at ${timeOfDay}`
            };
        } else if (months > 0) {
            return {
                value: Math.min(months, 99), // Cap at 99 months
                unit: 'months',
                text: `Last usage: ${mostRecentEntry.amount}g ${this.getMethodLabel(mostRecentEntry.method)} at ${timeOfDay}`
            };
        } else if (days > 0) {
            return {
                value: Math.min(days, 99), // Cap at 99 days
                unit: 'days',
                text: `Last usage: ${mostRecentEntry.amount}g ${this.getMethodLabel(mostRecentEntry.method)} at ${timeOfDay}`
            };
        } else if (hours > 0) {
            return {
                value: Math.min(hours, 99), // Cap at 99 hours
                unit: 'hours',
                text: `Last usage: ${mostRecentEntry.amount}g ${this.getMethodLabel(mostRecentEntry.method)} at ${timeOfDay}`
            };
        } else {
            return {
                value: Math.min(minutes, 99), // Cap at 99 minutes
                unit: 'minutes',
                text: `Last usage: ${mostRecentEntry.amount}g ${this.getMethodLabel(mostRecentEntry.method)} at ${timeOfDay}`
            };
        }
    }

    // Entry Rendering with Error Handling
    renderEntries() {
        try {
            const container = document.getElementById('entriesContainer');
            if (!container) {
                console.error('Entries container not found');
                return;
            }
            
            if (this.entries.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-leaf"></i>
                        <h3>No entries yet</h3>
                        <p>Add your first entry to start tracking your journey</p>
                    </div>
                `;
                return;
            }

            // Filter out invalid entries, sort by consumption timestamp, and create HTML
            const validEntries = this.entries
                .filter(entry => this.validateEntry(entry))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 20);
            container.innerHTML = validEntries.map(entry => this.createEntryHTML(entry)).join('');
        } catch (error) {
            console.error('Error rendering entries:', error);
            this.showMessage('Failed to display entries. Please refresh the page.', 'error');
        }
    }

    createEntryHTML(entry) {
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const moodEmoji = this.getMoodEmoji(entry.mood);
        const methodLabel = this.getMethodLabel(entry.method);

        return `
            <div class="entry-item">
                <div class="entry-info">
                    <div class="entry-header">
                        <span class="entry-amount">${entry.amount}g</span>
                        <span class="entry-method">${methodLabel}</span>
                        <span class="entry-time">${formattedDate} at ${formattedTime}</span>
                    </div>
                    ${entry.notes ? `<div class="entry-notes">"${entry.notes}"</div>` : ''}
                </div>
                <div class="entry-actions">
                    ${entry.mood ? `<span class="entry-mood">${moodEmoji}</span>` : ''}
                    <button class="btn-icon" onclick="tracker.deleteEntry(${entry.id})" title="Delete entry">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getMoodEmoji(mood) {
        const moodMap = {
            'great': '😊',
            'good': '🙂',
            'neutral': '😐',
            'bad': '😔',
            'terrible': '😢'
        };
        return moodMap[mood] || '';
    }

    getMethodLabel(method) {
        const methodMap = {
            'joint': 'Joint',
            'bong': 'Bong',
            'pipe': 'Pipe',
            'cigarette': 'Cigarette',
            'vape': 'Vape',
            'edible': 'Edible',
            'other': 'Other'
        };
        return methodMap[method] || method;
    }

    // Goal Management with Validation
    saveGoal() {
        try {
            const goalType = document.getElementById('goalType').value;
            
            // Validate goal type
            if (!goalType || !['reduce', 'maintain', 'quit', 'stash'].includes(goalType)) {
                this.showMessage('Please select a valid goal type.', 'error');
                return;
            }

            let goalData = {
                goalType: goalType,
                startDate: new Date().toISOString()
            };

            if (goalType === 'stash') {
                const stashAmount = parseFloat(document.getElementById('stashAmount').value);
                
                // Validate stash amount
                if (!stashAmount || stashAmount <= 0) {
                    this.showMessage('Please enter a valid stash amount greater than 0.', 'error');
                    return;
                }

                goalData = {
                    ...goalData,
                    stashAmount: stashAmount,
                    stashStartDate: new Date().toISOString(),
                    weeklyAmount: 0 // Reset weekly amount for stash goals
                };
            } else {
                const weeklyGoal = parseFloat(document.getElementById('weeklyGoal').value);
                
                // Validate weekly goal
                if (!weeklyGoal || weeklyGoal < 0) {
                    this.showMessage('Please enter a valid weekly goal amount (0 or greater).', 'error');
                    return;
                }

                goalData = {
                    ...goalData,
                    weeklyAmount: weeklyGoal,
                    stashAmount: 0 // Reset stash amount for weekly goals
                };
            }

            // Validate the complete goal data
            if (!this.validateGoals(goalData)) {
                this.showMessage('Invalid goal data. Please check your input.', 'error');
                return;
            }

            this.goals = goalData;
            this.saveGoals();
            this.updateGoalProgress();
            this.closeGoalModal();
            this.showMessage('Goal saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving goal:', error);
            this.showMessage('Failed to save goal. Please try again.', 'error');
        }
    }

    resetGoal() {
        this.showConfirmModal(
            'Are you sure you want to reset your current goal? This will clear your goal settings.',
            () => {
                this.goals = {
                    weeklyAmount: 0,
                    goalType: 'reduce',
                    startDate: null,
                    stashAmount: 0,
                    stashStartDate: null
                };
                this.saveGoals();
                this.updateGoalProgress();
                this.showMessage('Goal reset successfully!', 'success');
            }
        );
    }

    // Utility Functions with Enhanced Safety
    setDefaultDateTime() {
        try {
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            
            const timeInput = document.getElementById('time');
            if (timeInput) {
                timeInput.value = localDateTime;
            }
        } catch (error) {
            console.error('Error setting default date time:', error);
        }
    }

    // Update time field in real-time
    updateTimeField() {
        try {
            const timeInput = document.getElementById('time');
            if (timeInput) {
                // Only update if the input is not focused AND user hasn't manually changed it
                if (document.activeElement !== timeInput && !this.timeManuallyChanged) {
                    const now = new Date();
                    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                    timeInput.value = localDateTime;
                }
            }
        } catch (error) {
            console.error('Error updating time field:', error);
        }
    }

    // Input sanitization
    sanitizeInput(input, maxLength = 1000) {
        if (typeof input !== 'string') {
            return '';
        }
        
        // Remove potentially dangerous characters and limit length
        return input
            .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
            .substring(0, maxLength)
            .trim();
    }

    // Safe DOM element access
    getElementSafely(id) {
        try {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Element with id '${id}' not found`);
            }
            return element;
        } catch (error) {
            console.error(`Error accessing element '${id}':`, error);
            return null;
        }
    }

    showMessage(message, type = 'success') {
        try {
            // Remove existing messages
            const existingMessages = document.querySelectorAll('.message');
            existingMessages.forEach(msg => {
                try {
                    msg.remove();
                } catch (error) {
                    console.error('Error removing message:', error);
                }
            });

            // Sanitize message
            const sanitizedMessage = this.sanitizeInput(message, 200);

            // Create new message
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = sanitizedMessage;

            // Add icon based on type
            const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
            messageDiv.innerHTML = `<span class="message-icon">${icon}</span> ${sanitizedMessage}`;

            // Append to body for floating effect
            document.body.appendChild(messageDiv);

            // Trigger animation by adding show class after a small delay
            setTimeout(() => {
                messageDiv.classList.add('show');
            }, 10);

            // Auto remove after appropriate time
            const duration = type === 'error' ? 5000 : 3000; // Errors stay longer
            setTimeout(() => {
                messageDiv.classList.remove('show');
                setTimeout(() => {
                    try {
                        messageDiv.remove();
                    } catch (error) {
                        console.error('Error removing message:', error);
                    }
                }, 300);
            }, duration);

            // Log message for debugging
            console.log(`[${type.toUpperCase()}] ${sanitizedMessage}`);
        } catch (error) {
            console.error('Error showing message:', error);
            // Fallback to alert if message system fails
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Export/Import with Error Handling
    exportData() {
        try {
            const data = {
                entries: this.entries,
                goals: this.goals,
                settings: this.settings,
                exportDate: new Date().toISOString()
            };

            // Validate data before export
            if (!this.validateExportData(data)) {
                this.showMessage('Data validation failed. Cannot export.', 'error');
                return;
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `weed-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showMessage('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showMessage('Failed to export data. Please try again.', 'error');
        }
    }

    importData() {
        try {
            // Check if required methods are available
            if (typeof this.showMessage !== 'function') {
                console.error('showMessage method not available');
                alert('Application not fully loaded. Please refresh the page and try again.');
                return;
            }

            if (typeof this.showConfirmModal !== 'function') {
                console.error('showConfirmModal method not available');
                this.showMessage('Application not fully loaded. Please refresh the page and try again.', 'error');
                return;
            }

            // Create file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', (event) => {
                try {
                    const file = event.target.files[0];
                    if (!file) {
                        return;
                    }

                    // Validate file type
                    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                        this.showMessage('Please select a valid JSON file.', 'error');
                        return;
                    }

                    // Validate file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        this.showMessage('File is too large. Please select a file smaller than 10MB.', 'error');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedData = JSON.parse(e.target.result);
                            
                            // Validate imported data structure
                            if (!this.validateImportData(importedData)) {
                                this.showMessage('Invalid data format. Please select a valid export file.', 'error');
                                return;
                            }

                            // Show confirmation modal with import details
                            this.showImportConfirmation(importedData);
                            
                        } catch (error) {
                            console.error('Error parsing imported file:', error);
                            this.showMessage('Failed to parse the file. Please check if it\'s a valid export file.', 'error');
                        }
                    };

                    reader.onerror = () => {
                        this.showMessage('Failed to read the file. Please try again.', 'error');
                    };

                    reader.readAsText(file);
                } catch (error) {
                    console.error('Error in file change handler:', error);
                    this.showMessage('Error processing file. Please try again.', 'error');
                }
            });

            // Trigger file selection
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
            
        } catch (error) {
            console.error('Error importing data:', error);
            if (typeof this.showMessage === 'function') {
                this.showMessage('Failed to import data. Please try again.', 'error');
            } else {
                alert('Failed to import data. Please refresh the page and try again.');
            }
        }
    }

    validateImportData(data) {
        try {
            if (!data || typeof data !== 'object') {
                return false;
            }

            // Check for required fields
            if (!Array.isArray(data.entries)) {
                return false;
            }

            if (!this.validateGoals(data.goals)) {
                return false;
            }

            if (!this.validateSettings(data.settings)) {
                return false;
            }

            // Validate each entry in the imported data
            for (const entry of data.entries) {
                if (!this.validateEntry(entry)) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Import data validation error:', error);
            return false;
        }
    }

    showImportConfirmation(importedData) {
        const entryCount = importedData.entries.length;
        const exportDate = importedData.exportDate ? new Date(importedData.exportDate).toLocaleDateString() : 'Unknown';
        
        const message = `Import ${entryCount} entries from ${exportDate}?\n\nThis will replace your current data. Make sure to export your current data first if you want to keep it.`;
        
        this.showConfirmModal(message, () => {
            this.performImport(importedData);
        });
    }

    performImport(importedData) {
        try {
            // Backup current data before import
            const backupData = {
                entries: [...this.entries],
                goals: { ...this.goals },
                settings: { ...this.settings },
                backupDate: new Date().toISOString()
            };

            // Store backup in localStorage with timestamp
            const backupKey = `weedTrackerBackup_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(backupData));

            // Import the new data
            this.entries = [...importedData.entries];
            this.goals = { ...importedData.goals };
            this.settings = { ...importedData.settings };

            // Save imported data
            this.saveEntries();
            this.saveGoals();
            this.saveSettings();

            // Update UI
            this.updateDashboard();
            this.renderEntries();
            this.initializeCharts(); // Reinitialize charts with new data

            this.showMessage(`Successfully imported ${importedData.entries.length} entries!`, 'success');
            
            // Clean up old backups (keep only last 5)
            this.cleanupOldBackups();
            
        } catch (error) {
            console.error('Error performing import:', error);
            this.showMessage('Failed to import data. Please try again.', 'error');
        }
    }

    cleanupOldBackups() {
        try {
            const backupKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('weedTrackerBackup_')) {
                    backupKeys.push(key);
                }
            }

            // Sort by timestamp (newest first) and keep only last 5
            backupKeys.sort().reverse();
            for (let i = 5; i < backupKeys.length; i++) {
                localStorage.removeItem(backupKeys[i]);
            }
        } catch (error) {
            console.error('Error cleaning up backups:', error);
        }
    }

    validateExportData(data) {
        try {
            if (!data || typeof data !== 'object') {
                return false;
            }

            if (!Array.isArray(data.entries)) {
                return false;
            }

            if (!this.validateGoals(data.goals)) {
                return false;
            }

            if (!this.validateSettings(data.settings)) {
                return false;
            }

            if (!data.exportDate || !this.isValidDate(data.exportDate)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Export data validation error:', error);
            return false;
        }
    }

    clearData() {
        try {
            this.showConfirmModal(
                'Are you sure you want to clear all data? This action cannot be undone.',
                () => {
                    this.entries = [];
                    this.goals = this.getDefaultGoals();
                    this.alternatives = this.getDefaultAlternatives();
                    
                    // Clear localStorage
                    try {
                        localStorage.removeItem('weedTrackerEntries');
                        localStorage.removeItem('weedTrackerGoals');
                        localStorage.removeItem('weedTrackerAlternatives');
                    } catch (error) {
                        console.error('Error clearing localStorage:', error);
                    }
                    
                    this.saveEntries();
                    this.saveGoals();
                    this.saveAlternatives();
                    this.updateDashboard();
                    this.renderEntries();
                    this.renderAlternatives();
                    this.showMessage('All data cleared successfully!', 'success');
                }
            );
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showMessage('Failed to clear data. Please try again.', 'error');
        }
    }

    // Modal Management
    openGoalModal() {
        const modal = document.getElementById('goalModal');
        const weeklyGoalInput = document.getElementById('weeklyGoal');
        const goalTypeSelect = document.getElementById('goalType');
        const stashAmountInput = document.getElementById('stashAmount');

        // Pre-fill with current values
        weeklyGoalInput.value = this.goals.weeklyAmount || '';
        goalTypeSelect.value = this.goals.goalType || 'reduce';
        stashAmountInput.value = this.goals.stashAmount || '';

        // Show/hide appropriate fields based on current goal type
        this.toggleGoalFields();

        modal.style.display = 'block';
    }

    closeGoalModal() {
        document.getElementById('goalModal').style.display = 'none';
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmButton');

        messageEl.textContent = message;
        modal.style.display = 'block';

        // Remove existing listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        // Add new listener
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.closeConfirmModal();
        });
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }

    toggleGoalFields() {
        const goalType = document.getElementById('goalType').value;
        const weeklyGoalGroup = document.getElementById('weeklyGoalGroup');
        const stashGoalGroup = document.getElementById('stashGoalGroup');

        if (goalType === 'stash') {
            weeklyGoalGroup.style.display = 'none';
            stashGoalGroup.style.display = 'block';
        } else {
            weeklyGoalGroup.style.display = 'block';
            stashGoalGroup.style.display = 'none';
        }
    }

    // Alternatives Management
    getOralFixationAlternatives() {
        return [
            {
                title: "Sugar-free gum",
                description: "Chew sugar-free gum to satisfy oral fixation without calories",
                icon: "fas fa-chewing-gum"
            },
            {
                title: "Herbal tea",
                description: "Sip on warm herbal tea with honey for a soothing experience",
                icon: "fas fa-mug-hot"
            },
            {
                title: "Crunchy vegetables",
                description: "Snack on carrots, celery, or cucumber for satisfying crunch",
                icon: "fas fa-carrot"
            },
            {
                title: "Ice cubes",
                description: "Suck on ice cubes or flavored ice for oral stimulation",
                icon: "fas fa-snowflake"
            },
            {
                title: "Hard candies",
                description: "Sugar-free hard candies that last longer",
                icon: "fas fa-candy-cane"
            },
            {
                title: "Sunflower seeds",
                description: "Shell and eat sunflower seeds for manual and oral activity",
                icon: "fas fa-seedling"
            },
            {
                title: "Fizzy water",
                description: "Sparkling water with lemon or lime for bubbly sensation",
                icon: "fas fa-glass-water"
            },
            {
                title: "Frozen grapes",
                description: "Freeze grapes for a cold, sweet treat that takes time to eat",
                icon: "fas fa-grapes"
            }
        ];
    }

    getGeneralAlternatives() {
        return [
            {
                title: "Take a walk",
                description: "Go for a 10-15 minute walk to clear your mind and get fresh air",
                icon: "fas fa-walking"
            },
            {
                title: "Deep breathing",
                description: "Practice 4-7-8 breathing: inhale 4, hold 7, exhale 8",
                icon: "fas fa-lungs"
            },
            {
                title: "Call a friend",
                description: "Reach out to someone you trust for support and distraction",
                icon: "fas fa-phone"
            },
            {
                title: "Read a book",
                description: "Immerse yourself in a good book to escape and relax",
                icon: "fas fa-book"
            },
            {
                title: "Listen to music",
                description: "Put on your favorite playlist and let the music carry you",
                icon: "fas fa-music"
            },
            {
                title: "Do a puzzle",
                description: "Crossword, Sudoku, or jigsaw puzzle to engage your mind",
                icon: "fas fa-puzzle-piece"
            },
            {
                title: "Take a shower",
                description: "A warm shower can help relax and reset your mood",
                icon: "fas fa-shower"
            },
            {
                title: "Write in a journal",
                description: "Express your thoughts and feelings on paper",
                icon: "fas fa-pen"
            },
            {
                title: "Stretch or yoga",
                description: "Gentle stretching or yoga poses to release tension",
                icon: "fas fa-yoga"
            },
            {
                title: "Clean something",
                description: "Organize a drawer or clean a small area to feel productive",
                icon: "fas fa-broom"
            },
            {
                title: "Draw or color",
                description: "Creative activities can be very therapeutic and distracting",
                icon: "fas fa-palette"
            },
            {
                title: "Meditation",
                description: "5-10 minutes of mindfulness meditation to center yourself",
                icon: "fas fa-om"
            }
        ];
    }

    renderAlternatives() {
        try {
            const oralContainer = document.getElementById('oralAlternatives');
            const generalContainer = document.getElementById('generalAlternatives');

            if (!oralContainer || !generalContainer) {
                console.error('Alternative containers not found');
                return;
            }

            // Get random suggestions (3 from each category)
            const oralSuggestions = this.getRandomSuggestions(this.getOralFixationAlternatives(), 3);
            const generalSuggestions = this.getRandomSuggestions(this.getGeneralAlternatives(), 3);

            // Render oral fixation alternatives
            oralContainer.innerHTML = oralSuggestions.map(suggestion => 
                this.createSuggestionHTML(suggestion, 'oral')
            ).join('');

            // Render general alternatives
            generalContainer.innerHTML = generalSuggestions.map(suggestion => 
                this.createSuggestionHTML(suggestion, 'general')
            ).join('');
        } catch (error) {
            console.error('Error rendering alternatives:', error);
            // Don't show error message for alternatives as it's not critical
        }
    }

    getRandomSuggestions(suggestions, count) {
        const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    createSuggestionHTML(suggestion, category) {
        const isTried = this.alternatives.triedItems.includes(`${category}-${suggestion.title}`);
        const triedClass = isTried ? ' tried' : '';
        
        return `
            <div class="suggestion-item${triedClass}" 
                 onclick="tracker.markSuggestionAsTried('${category}-${suggestion.title}')">
                <i class="${suggestion.icon} suggestion-icon"></i>
                <h4>${suggestion.title}</h4>
                <p>${suggestion.description}</p>
            </div>
        `;
    }

    markSuggestionAsTried(suggestionId) {
        if (!this.alternatives.triedItems.includes(suggestionId)) {
            this.alternatives.triedItems.push(suggestionId);
            this.saveAlternatives();
            this.renderAlternatives();
            this.showMessage('Great job trying an alternative!', 'success');
        }
    }

    refreshAlternatives() {
        this.alternatives.lastRefresh = new Date().toISOString();
        this.saveAlternatives();
        this.renderAlternatives();
        this.showMessage('New suggestions loaded!', 'success');
    }

    markAsTried() {
        this.showMessage('Select a specific suggestion to mark it as tried!', 'success');
    }

    // Chart Management with Error Handling
    initializeCharts() {
        try {
            this.createCompactChart();
            this.createDailyChart();
            this.createTimeChart();
            this.createMethodChart();
        } catch (error) {
            console.error('Error initializing charts:', error);
            this.showMessage('Failed to initialize charts. Some visualizations may not work.', 'error');
        }
    }

    refreshGraphs() {
        try {
            // Destroy existing charts
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    try {
                        chart.destroy();
                    } catch (error) {
                        console.error('Error destroying chart:', error);
                    }
                }
            });
            this.charts = {};
            
            // Recreate charts with fresh data
            this.initializeCharts();
            this.showMessage('Graphs refreshed successfully!', 'success');
        } catch (error) {
            console.error('Error refreshing graphs:', error);
            this.showMessage('Failed to refresh graphs. Please try again.', 'error');
        }
    }

    cycleChartView() {
        this.currentChartIndex = (this.currentChartIndex + 1) % 3;
        this.updateCompactChart();
        this.showMessage('Switched to next chart view', 'success');
    }

    toggleExpandedView() {
        this.isExpanded = !this.isExpanded;
        const expandedView = document.getElementById('expandedView');
        const expandIcon = document.getElementById('expandIcon');
        
        if (this.isExpanded) {
            expandedView.style.display = 'block';
            expandIcon.className = 'fas fa-compress';
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 999;
                backdrop-filter: blur(5px);
            `;
            backdrop.onclick = () => this.toggleExpandedView();
            document.body.appendChild(backdrop);
        } else {
            expandedView.style.display = 'none';
            expandIcon.className = 'fas fa-expand';
            // Remove backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
    }

    createCompactChart() {
        const ctx = document.getElementById('compactChart');
        if (!ctx) return;

        this.updateCompactChart();
    }

    updateCompactChart() {
        const ctx = document.getElementById('compactChart');
        if (!ctx) return;

        // Destroy existing compact chart
        if (this.charts.compact) {
            this.charts.compact.destroy();
        }

        const currentChart = this.chartTypes[this.currentChartIndex];
        
        // Update title
        document.getElementById('dynamicChartTitle').innerHTML = `<i class="${currentChart.icon}"></i> ${currentChart.title}`;

        // Create chart based on current type
        let chartConfig;
        
        switch (currentChart.type) {
            case 'daily':
                chartConfig = this.getCompactDailyConfig();
                break;
            case 'time':
                chartConfig = this.getCompactTimeConfig();
                break;
            case 'method':
                chartConfig = this.getCompactMethodConfig();
                break;
        }

        this.charts.compact = new Chart(ctx, chartConfig);
        
        // Add click event listener to cycle through chart views
        ctx.addEventListener('click', () => {
            this.cycleChartView();
        });
    }

    createDailyChart() {
        const ctx = document.getElementById('dailyChart');
        if (!ctx) return;

        const data = this.getDailyData();
        const colors = this.getChartColors();
        
        this.charts.daily = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Consumption Trend',
                    data: data.points,
                    borderColor: colors.primary,
                    backgroundColor: colors.background,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: colors.primary,
                    pointBorderColor: colors.primary,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 16,
                        bottom: 16,
                        left: 16,
                        right: 16
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const point = context[0];
                                const date = new Date(point.parsed.x);
                                return date.toLocaleString();
                            },
                            label: function(context) {
                                return `Amount: ${context.parsed.y}g`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time (Last 48 Hours)'
                        },
                        grid: {
                            display: true,
                            color: colors.grid,
                            lineWidth: 1
                        },
                        ticks: {
                            callback: function(value, index, values) {
                                const date = new Date(value);
                                const hour = date.getHours();
                                
                                // Use hour numbers for time display
                                if (hour === 0) return '0';
                                if (hour === 6) return '6';
                                if (hour === 12) return '12';
                                if (hour === 18) return '18';
                                return '';
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount (g)'
                        },
                        grid: {
                            display: true,
                            color: colors.grid,
                            lineWidth: 1
                        }
                    }
                }
            }
        });
        
        // Add click event listener to cycle through chart views
        ctx.addEventListener('click', () => {
            this.cycleChartView();
        });
    }

    createTimeChart() {
        const ctx = document.getElementById('timeChart');
        if (!ctx) return;

        const data = this.getTimeOfDayData();
        const colors = this.getChartColors();
        
        this.charts.time = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Usage Frequency',
                    data: data.values,
                    backgroundColor: [
                        colors.primary + 'CC',
                        colors.danger + 'CC',
                        colors.success + 'CC',
                        colors.warning + 'CC',
                        colors.accent + 'CC',
                        colors.info + 'CC'
                    ],
                    borderColor: [
                        colors.primary,
                        colors.danger,
                        colors.success,
                        colors.warning,
                        colors.accent,
                        colors.info
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Entries'
                        }
                    }
                }
            }
        });
        
        // Add click event listener to cycle through chart views
        ctx.addEventListener('click', () => {
            this.cycleChartView();
        });
    }

    createMethodChart() {
        const ctx = document.getElementById('methodChart');
        if (!ctx) return;

        const data = this.getMethodData();
        const colors = this.getChartColors();
        
        this.charts.method = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        colors.primary,
                        colors.danger,
                        colors.success,
                        colors.warning,
                        colors.accent,
                        colors.info,
                        colors.secondary
                    ],
                    borderWidth: 2,
                    borderColor: colors.background
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Add click event listener to cycle through chart views
        ctx.addEventListener('click', () => {
            this.cycleChartView();
        });
    }



    // Data preparation methods for charts
    getDailyData() {
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        
        // Filter entries from last 48 hours and sort by consumption timestamp
        const recentEntries = this.entries
            .filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= fortyEightHoursAgo && entryDate <= now;
            })
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort chronologically for chart
        
        // Convert to scatter plot data points
        const points = recentEntries.map(entry => ({
            x: new Date(entry.timestamp),
            y: entry.amount
        }));
        
        // If no data, show empty chart
        if (points.length === 0) {
            return { points: [] };
        }
        
        return { points };
    }

    getWeeklyData() {
        const weeks = [];
        const amounts = [];
        const counts = [];
        
        // Get last 8 weeks
        for (let i = 7; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
            const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            const weekEntries = this.entries.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= weekStart && entryDate < weekEnd;
            });
            
            const weekAmount = weekEntries.reduce((sum, entry) => sum + entry.amount, 0);
            const weekCount = weekEntries.length;
            
            weeks.push(`Week ${8-i}`);
            amounts.push(weekAmount);
            counts.push(weekCount);
        }
        
        // If no data, show empty chart with placeholder
        if (amounts.every(amount => amount === 0)) {
            return { 
                labels: weeks, 
                amounts: [0, 0, 0, 0, 0, 0, 0, 0], 
                counts: [0, 0, 0, 0, 0, 0, 0, 0] 
            };
        }
        
        return { labels: weeks, amounts, counts };
    }

    getTimeOfDayData() {
        const timeSlots = [
            'Early AM (12-6)',
            'Morning (6-12)',
            'Afternoon (12-6)',
            'Evening (6-12)'
        ];
        const counts = [0, 0, 0, 0];
        
        this.entries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            if (hour >= 0 && hour < 6) counts[0]++;
            else if (hour >= 6 && hour < 12) counts[1]++;
            else if (hour >= 12 && hour < 18) counts[2]++;
            else counts[3]++;
        });
        
        // If no data, show empty chart
        if (counts.every(count => count === 0)) {
            return { labels: timeSlots, values: [0, 0, 0, 0] };
        }
        
        return { labels: timeSlots, values: counts };
    }

    getMethodData() {
        const methodCounts = {};
        
        this.entries.forEach(entry => {
            methodCounts[entry.method] = (methodCounts[entry.method] || 0) + 1;
        });
        
        const labels = Object.keys(methodCounts).map(method => this.getMethodLabel(method));
        const values = Object.values(methodCounts);
        
        // If no data, show placeholder
        if (labels.length === 0) {
            return { 
                labels: ['No data yet'], 
                values: [1] 
            };
        }
        
        return { labels, values };
    }



    // Compact chart configurations
    getCompactDailyConfig() {
        const data = this.getDailyData();
        const colors = this.getChartColors();
        return {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Consumption Trend',
                    data: data.points,
                    borderColor: colors.primary,
                    backgroundColor: colors.background,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: colors.primary,
                    pointBorderColor: colors.primary,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 2,
                        bottom: 2,
                        left: 2,
                        right: 2
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const point = context[0];
                                const date = new Date(point.parsed.x);
                                return date.toLocaleString();
                            },
                            label: function(context) {
                                return `Amount: ${context.parsed.y}g`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'HH:mm'
                            }
                        },
                        title: {
                            display: false
                        },
                        grid: {
                            display: true,
                            color: colors.grid,
                            lineWidth: 1
                        },
                        ticks: {
                            callback: function(value, index, values) {
                                const date = new Date(value);
                                const hour = date.getHours();
                                
                                // Use hour numbers for time display
                                if (hour === 0) return '0';
                                if (hour === 6) return '6';
                                if (hour === 12) return '12';
                                if (hour === 18) return '18';
                                return '';
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: false
                        },
                        grid: {
                            display: true,
                            color: colors.grid,
                            lineWidth: 1
                        }
                    }
                }
            }
        };
    }

    getCompactTimeConfig() {
        const data = this.getTimeOfDayData();
        const colors = this.getChartColors();
        return {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        colors.primary + 'CC',
                        colors.danger + 'CC',
                        colors.success + 'CC',
                        colors.warning + 'CC'
                    ],
                    borderWidth: 1,
                    borderColor: colors.background
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        };
    }

    getCompactMethodConfig() {
        const data = this.getMethodData();
        const colors = this.getChartColors();
        return {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        colors.primary,
                        colors.danger,
                        colors.success,
                        colors.warning,
                        colors.accent,
                        colors.info,
                        colors.secondary
                    ],
                    borderWidth: 1,
                    borderColor: colors.background
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        };
    }


}

// Global functions for HTML onclick handlers
function openGoalModal() {
    if (tracker && typeof tracker.openGoalModal === 'function') {
        tracker.openGoalModal();
    } else {
        console.error('Tracker not initialized or openGoalModal not available');
    }
}

function closeGoalModal() {
    if (tracker && typeof tracker.closeGoalModal === 'function') {
        tracker.closeGoalModal();
    } else {
        console.error('Tracker not initialized or closeGoalModal not available');
    }
}

function resetGoal() {
    if (tracker && typeof tracker.resetGoal === 'function') {
        tracker.resetGoal();
    } else {
        console.error('Tracker not initialized or resetGoal not available');
    }
}

function toggleGoalFields() {
    if (tracker && typeof tracker.toggleGoalFields === 'function') {
        tracker.toggleGoalFields();
    } else {
        console.error('Tracker not initialized or toggleGoalFields not available');
    }
}

function closeConfirmModal() {
    if (tracker && typeof tracker.closeConfirmModal === 'function') {
        tracker.closeConfirmModal();
    } else {
        console.error('Tracker not initialized or closeConfirmModal not available');
    }
}

function exportData() {
    if (tracker && typeof tracker.exportData === 'function') {
        tracker.exportData();
    } else {
        console.error('Tracker not initialized or exportData not available');
    }
}

function importData() {
    if (tracker && typeof tracker.importData === 'function') {
        tracker.importData();
    } else {
        console.error('Tracker not initialized or importData not available');
    }
}

function clearData() {
    if (tracker && typeof tracker.clearData === 'function') {
        tracker.clearData();
    } else {
        console.error('Tracker not initialized or clearData not available');
    }
}

function refreshAlternatives() {
    if (tracker && typeof tracker.refreshAlternatives === 'function') {
        tracker.refreshAlternatives();
    } else {
        console.error('Tracker not initialized or refreshAlternatives not available');
    }
}

function markAsTried() {
    if (tracker && typeof tracker.markAsTried === 'function') {
        tracker.markAsTried();
    } else {
        console.error('Tracker not initialized or markAsTried not available');
    }
}

function cycleChartView() {
    if (tracker && typeof tracker.cycleChartView === 'function') {
        tracker.cycleChartView();
    } else {
        console.error('Tracker not initialized or cycleChartView not available');
    }
}

function toggleExpandedView() {
    if (tracker && typeof tracker.toggleExpandedView === 'function') {
        tracker.toggleExpandedView();
    } else {
        console.error('Tracker not initialized or toggleExpandedView not available');
    }
}

// Initialize the application with error handling
let tracker;

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    if (tracker && typeof tracker.showMessage === 'function') {
        tracker.showMessage('An unexpected error occurred. Please refresh the page.', 'error');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (tracker && typeof tracker.showMessage === 'function') {
        tracker.showMessage('An unexpected error occurred. Please refresh the page.', 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check for required dependencies
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            alert('Required library Chart.js is missing. Please check your internet connection and refresh the page.');
            return;
        }

        // Initialize the tracker
        tracker = new WeedTracker();
        
        // Verify initialization
        if (!tracker) {
            throw new Error('Failed to initialize WeedTracker');
        }

        console.log('Weed Tracker initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Weed Tracker:', error);
        alert('Failed to initialize the application. Please refresh the page or check your browser settings.');
    }
});
