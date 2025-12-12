// Profile Page Functionality

// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

let currentUser = null;

// Load user profile data
async function loadProfile() {
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
            throw new Error('Failed to load profile');
        }

        currentUser = await response.json();
        displayProfile(currentUser);
        loadStats();
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('editMessage', 'Error loading profile', 'error');
    }
}

// Display profile information
function displayProfile(user) {
    // Header
    document.getElementById('profileFullName').textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById('profileUsername').textContent = `@${user.username}`;
    document.getElementById('navUsername').textContent = user.username;
    
    // Account information
    document.getElementById('displayFirstName').textContent = user.first_name;
    document.getElementById('displayLastName').textContent = user.last_name;
    document.getElementById('displayUsername').textContent = user.username;
    document.getElementById('displayEmail').textContent = user.email;
}

// Load statistics
async function loadStats() {
    try {
        // Load pets
        const petsResponse = await fetch('/pets', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pets = petsResponse.ok ? await petsResponse.json() : [];
        document.getElementById('statPets').textContent = pets.length;
        
        // Load activities
        const activitiesResponse = await fetch('/activities', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const activities = activitiesResponse.ok ? await activitiesResponse.json() : [];
        document.getElementById('statActivities').textContent = activities.length;
        
        // Load medications
        const medicationsResponse = await fetch('/medications?active_only=true', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const medications = medicationsResponse.ok ? await medicationsResponse.json() : [];
        document.getElementById('statMedications').textContent = medications.length;
        
        // Load reminders
        const remindersResponse = await fetch('/reminders?completed=false', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reminders = remindersResponse.ok ? await remindersResponse.json() : [];
        document.getElementById('statReminders').textContent = reminders.length;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Open edit profile modal
function openEditModal() {
    if (!currentUser) return;
    
    document.getElementById('editFirstName').value = currentUser.first_name;
    document.getElementById('editLastName').value = currentUser.last_name;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editUsername').value = currentUser.username;
    
    document.getElementById('editProfileModal').classList.remove('hidden');
}

// Handle edit profile form submission
async function handleEditProfile(e) {
    e.preventDefault();
    
    const formData = {
        first_name: document.getElementById('editFirstName').value.trim(),
        last_name: document.getElementById('editLastName').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        username: document.getElementById('editUsername').value.trim(),
        password: document.getElementById('editPassword').value || 'placeholder123'  // Backend requires password field
    };
    
    try {
        const response = await fetch('/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update profile');
        }
        
        const updatedUser = await response.json();
        currentUser = updatedUser;
        displayProfile(updatedUser);
        
        showMessage('editMessage', 'Profile updated successfully!', 'success');
        setTimeout(() => {
            document.getElementById('editProfileModal').classList.add('hidden');
        }, 1500);
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('editMessage', error.message, 'error');
    }
}

// Handle change password form submission
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showMessage('passwordMessage', 'New passwords do not match', 'error');
        return;
    }
    
    // Validate password strength
    if (newPassword.length < 6) {
        showMessage('passwordMessage', 'Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const response = await fetch('/users/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to change password');
        }
        
        showMessage('passwordMessage', 'Password changed successfully!', 'success');
        document.getElementById('changePasswordForm').reset();
        
        setTimeout(() => {
            document.getElementById('changePasswordModal').classList.add('hidden');
        }, 1500);
        
    } catch (error) {
        console.error('Error changing password:', error);
        showMessage('passwordMessage', error.message, 'error');
    }
}

// Show message
function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.textContent = message;
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Setup navbar
function setupNavbar() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    const settingsLink = document.getElementById('settingsLink');

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

    settingsLink?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Settings page coming soon!');
    });
}

// Event listeners
document.getElementById('editProfileBtn')?.addEventListener('click', openEditModal);
document.getElementById('closeEditModal')?.addEventListener('click', () => {
    document.getElementById('editProfileModal').classList.add('hidden');
});

document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
    document.getElementById('changePasswordModal').classList.remove('hidden');
});
document.getElementById('closePasswordModal')?.addEventListener('click', () => {
    document.getElementById('changePasswordModal').classList.add('hidden');
});

document.getElementById('editProfileForm')?.addEventListener('submit', handleEditProfile);
document.getElementById('changePasswordForm')?.addEventListener('submit', handleChangePassword);

// Close modals on outside click
document.getElementById('editProfileModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'editProfileModal') {
        document.getElementById('editProfileModal').classList.add('hidden');
    }
});
document.getElementById('changePasswordModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'changePasswordModal') {
        document.getElementById('changePasswordModal').classList.add('hidden');
    }
});

// Initialize
setupNavbar();
loadProfile();
