// Weed Tracker Application
// Data management and functionality

class WeedTracker {
    constructor() {
        this.entries = this.loadEntries();
        this.goals = this.loadGoals();
        this.settings = this.loadSettings();
        this.alternatives = this.loadAlternatives();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDateTime();
        this.updateDashboard();
        this.renderEntries();
        this.renderAlternatives();
    }

    // Data Management
    loadEntries() {
        const saved = localStorage.getItem('weedTrackerEntries');
        return saved ? JSON.parse(saved) : [];
    }

    saveEntries() {
        localStorage.setItem('weedTrackerEntries', JSON.stringify(this.entries));
    }

    loadGoals() {
        const saved = localStorage.getItem('weedTrackerGoals');
        return saved ? JSON.parse(saved) : {
            weeklyAmount: 0,
            goalType: 'reduce',
            startDate: null
        };
    }

    saveGoals() {
        localStorage.setItem('weedTrackerGoals', JSON.stringify(this.goals));
    }

    loadSettings() {
        const saved = localStorage.getItem('weedTrackerSettings');
        return saved ? JSON.parse(saved) : {
            pricePerGram: 10,
            currency: 'USD'
        };
    }

    saveSettings() {
        localStorage.setItem('weedTrackerSettings', JSON.stringify(this.settings));
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

        // Modal close events
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // Entry Management
    addEntry() {
        const form = document.getElementById('quickAddForm');
        const formData = new FormData(form);
        
        const entry = {
            id: Date.now(),
            amount: parseFloat(document.getElementById('amount').value),
            method: document.getElementById('method').value,
            notes: document.getElementById('notes').value.trim(),
            mood: document.getElementById('mood').value,
            timestamp: document.getElementById('time').value,
            createdAt: new Date().toISOString()
        };

        this.entries.unshift(entry);
        this.saveEntries();
        
        // Reset form
        form.reset();
        this.setDefaultDateTime();
        
        // Update UI
        this.updateDashboard();
        this.renderEntries();
        
        // Show success message
        this.showMessage('Entry added successfully!', 'success');
    }

    deleteEntry(id) {
        this.entries = this.entries.filter(entry => entry.id !== id);
        this.saveEntries();
        this.updateDashboard();
        this.renderEntries();
        this.showMessage('Entry deleted successfully!', 'success');
    }

    // Dashboard Updates
    updateDashboard() {
        this.updateTodayStats();
        this.updateWeekStats();
        this.updateGoalProgress();
        this.updateStreak();
    }

    updateTodayStats() {
        const today = new Date().toDateString();
        const todayEntries = this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp).toDateString();
            return entryDate === today;
        });

        const todayCount = todayEntries.length;
        const todayAmount = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const todayCost = (todayAmount * this.settings.pricePerGram).toFixed(2);

        document.getElementById('todayCount').textContent = todayCount;
        document.getElementById('todayAmount').textContent = todayAmount.toFixed(1) + 'g';
        document.getElementById('todayCost').textContent = '$' + todayCost;
    }

    updateWeekStats() {
        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        const weekEntries = this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= weekStart && entryDate < weekEnd;
        });

        const weekCount = weekEntries.length;
        const weekAmount = weekEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const weekAvg = weekCount > 0 ? weekAmount / 7 : 0;

        document.getElementById('weekCount').textContent = weekCount;
        document.getElementById('weekAmount').textContent = weekAmount.toFixed(1) + 'g';
        document.getElementById('weekAvg').textContent = weekAvg.toFixed(1) + 'g';
    }

    updateGoalProgress() {
        if (!this.goals.weeklyAmount || this.goals.weeklyAmount <= 0) {
            document.getElementById('goalProgress').style.width = '0%';
            document.getElementById('goalText').textContent = 'Set a weekly goal to track progress';
            return;
        }

        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        const weekEntries = this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= weekStart && entryDate < weekEnd;
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

    updateStreak() {
        const streak = this.calculateStreak();
        document.getElementById('currentStreak').textContent = streak.count;
        document.getElementById('streakType').textContent = streak.type;
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

    // Entry Rendering
    renderEntries() {
        const container = document.getElementById('entriesContainer');
        
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

        container.innerHTML = this.entries.slice(0, 20).map(entry => this.createEntryHTML(entry)).join('');
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

    // Goal Management
    saveGoal() {
        const weeklyGoal = parseFloat(document.getElementById('weeklyGoal').value);
        const goalType = document.getElementById('goalType').value;

        this.goals = {
            weeklyAmount: weeklyGoal,
            goalType: goalType,
            startDate: new Date().toISOString()
        };

        this.saveGoals();
        this.updateGoalProgress();
        this.closeGoalModal();
        this.showMessage('Goal saved successfully!', 'success');
    }

    // Utility Functions
    setDefaultDateTime() {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        document.getElementById('time').value = localDateTime;
    }

    showMessage(message, type = 'success') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert at top of main content
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(messageDiv, mainContent.firstChild);

        // Auto remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Export/Import
    exportData() {
        const data = {
            entries: this.entries,
            goals: this.goals,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

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
    }

    clearData() {
        this.showConfirmModal(
            'Are you sure you want to clear all data? This action cannot be undone.',
            () => {
                this.entries = [];
                this.goals = { weeklyAmount: 0, goalType: 'reduce', startDate: null };
                this.saveEntries();
                this.saveGoals();
                this.updateDashboard();
                this.renderEntries();
                this.showMessage('All data cleared successfully!', 'success');
            }
        );
    }

    // Modal Management
    openGoalModal() {
        const modal = document.getElementById('goalModal');
        const weeklyGoalInput = document.getElementById('weeklyGoal');
        const goalTypeSelect = document.getElementById('goalType');

        // Pre-fill with current values
        weeklyGoalInput.value = this.goals.weeklyAmount || '';
        goalTypeSelect.value = this.goals.goalType || 'reduce';

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

    // Alternatives Management
    loadAlternatives() {
        const saved = localStorage.getItem('weedTrackerAlternatives');
        return saved ? JSON.parse(saved) : {
            triedItems: [],
            lastRefresh: null
        };
    }

    saveAlternatives() {
        localStorage.setItem('weedTrackerAlternatives', JSON.stringify(this.alternatives));
    }

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
        const oralContainer = document.getElementById('oralAlternatives');
        const generalContainer = document.getElementById('generalAlternatives');

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
}

// Global functions for HTML onclick handlers
function openGoalModal() {
    tracker.openGoalModal();
}

function closeGoalModal() {
    tracker.closeGoalModal();
}

function closeConfirmModal() {
    tracker.closeConfirmModal();
}

function exportData() {
    tracker.exportData();
}

function clearData() {
    tracker.clearData();
}

function refreshAlternatives() {
    tracker.refreshAlternatives();
}

function markAsTried() {
    tracker.markAsTried();
}

// Initialize the application
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new WeedTracker();
});
