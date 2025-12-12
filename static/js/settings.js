// Settings Page Functionality

// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

// Load user info
async function loadUserInfo() {
    try {
        const response = await fetch('/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            throw new Error('Failed to load user info');
        }

        const user = await response.json();
        document.getElementById('navUsername').textContent = user.username;
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load settings from localStorage
function loadSettings() {
    const settings = {
        emailNotifications: localStorage.getItem('emailNotifications') !== 'false',
        appointmentReminders: localStorage.getItem('appointmentReminders') !== 'false',
        medicationAlerts: localStorage.getItem('medicationAlerts') !== 'false',
        saveChatHistory: localStorage.getItem('saveChatHistory') === 'true',
        includePetContext: localStorage.getItem('includePetContext') !== 'false',
        aiDetailLevel: localStorage.getItem('aiDetailLevel') || 'balanced'
    };

    // Apply settings to UI
    document.getElementById('emailNotifications').checked = settings.emailNotifications;
    document.getElementById('appointmentReminders').checked = settings.appointmentReminders;
    document.getElementById('medicationAlerts').checked = settings.medicationAlerts;
    document.getElementById('saveChatHistory').checked = settings.saveChatHistory;
    document.getElementById('includePetContext').checked = settings.includePetContext;
    document.getElementById('aiDetailLevel').value = settings.aiDetailLevel;
}

// Save setting to localStorage
function saveSetting(key, value) {
    localStorage.setItem(key, value);
    showToast(`Setting saved: ${key}`, 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast if it doesn't exist
    let toast = document.getElementById('settingsToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'settingsToast';
        toast.className = 'settings-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `settings-toast ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Setup event listeners for toggles
function setupToggles() {
    const toggles = [
        'emailNotifications',
        'appointmentReminders',
        'medicationAlerts',
        'saveChatHistory',
        'includePetContext'
    ];

    toggles.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                saveSetting(id, e.target.checked);
            });
        }
    });

    // AI detail level
    const aiDetailLevel = document.getElementById('aiDetailLevel');
    if (aiDetailLevel) {
        aiDetailLevel.addEventListener('change', (e) => {
            saveSetting('aiDetailLevel', e.target.value);
        });
    }
}

// Export data
async function exportData() {
    try {
        showToast('Preparing your data export...', 'info');

        // Fetch all user data
        const [pets, activities, medications, reminders] = await Promise.all([
            fetch('/pets', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/activities', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/medications', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/reminders', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);

        const exportData = {
            exportDate: new Date().toISOString(),
            pets: pets,
            activities: activities,
            medications: medications,
            reminders: reminders
        };

        // Create and download JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `petwell-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export data', 'error');
    }
}

// Delete account
function showDeleteAccountModal() {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = 'Delete Account';
    document.getElementById('confirmMessage').innerHTML = `
        <strong>⚠️ This action cannot be undone!</strong><br><br>
        Deleting your account will permanently remove:
        <ul style="text-align: left; margin: 16px 0;">
            <li>Your profile and account information</li>
            <li>All pet records and health data</li>
            <li>Activity logs and medication records</li>
            <li>Appointments and reminders</li>
        </ul>
        Are you absolutely sure you want to delete your account?
    `;
    
    modal.classList.remove('hidden');
    
    // Set up confirm button for delete action
    const confirmBtn = document.getElementById('confirmActionBtn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/users/me', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            localStorage.clear();
            window.location.href = '/login?deleted=true';
        } catch (error) {
            console.error('Delete error:', error);
            document.getElementById('confirmFeedback').innerHTML = 
                '<p class="error-message">Failed to delete account. Please try again.</p>';
        }
    });
}

// Setup navbar
function setupNavbar() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    userMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!userMenuBtn?.contains(e.target)) {
            userDropdown?.classList.add('hidden');
        }
    });

    logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = '/login';
    });
}

// Setup modal
function setupModal() {
    const modal = document.getElementById('confirmModal');
    const closeBtn = document.getElementById('closeConfirmModal');
    const cancelBtn = document.getElementById('cancelConfirmBtn');

    closeBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    cancelBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

// Event listeners
document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
document.getElementById('deleteAccountBtn')?.addEventListener('click', showDeleteAccountModal);

// Initialize
setupNavbar();
setupModal();
setupToggles();
loadSettings();
loadUserInfo();
