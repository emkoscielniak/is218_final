// Appointments Page JavaScript

// Check for authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

let allAppointments = [];
let currentFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    setUserAvatar();
    loadAppointments();
    setupEventListeners();
    setupNavbar();
});

// Set user avatar initials
async function setUserAvatar() {
    try {
        const response = await fetch('/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');
            document.getElementById('userAvatar').textContent = initials || 'U';
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Load appointments (using reminders endpoint)
async function loadAppointments() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const grid = document.getElementById('appointmentsGrid');
    
    loadingState.classList.remove('hidden');
    grid.innerHTML = '';
    emptyState.classList.add('hidden');
    
    try {
        // Fetch all reminders
        const response = await fetch('/reminders?completed=false', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load appointments');
        
        const reminders = await response.json();
        
        // Filter for appointment types only
        allAppointments = reminders.filter(r => 
            ['appointment', 'vaccination', 'grooming'].includes(r.reminder_type)
        );
        
        // Fetch pets for names
        const petsResponse = await fetch('/pets', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (petsResponse.ok) {
            const pets = await petsResponse.json();
            const petMap = {};
            pets.forEach(pet => {
                petMap[pet.id] = pet.name;
            });
            
            // Add pet names to appointments
            allAppointments.forEach(apt => {
                apt.petName = apt.pet_id ? petMap[apt.pet_id] : 'General';
            });
        }
        
        loadingState.classList.add('hidden');
        displayAppointments(allAppointments);
    } catch (error) {
        console.error('Error loading appointments:', error);
        loadingState.classList.add('hidden');
        grid.innerHTML = '<p style="text-align: center; color: var(--accent-color);">Error loading appointments. Please try again.</p>';
    }
}

// Display appointments
function displayAppointments(appointments) {
    const grid = document.getElementById('appointmentsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (appointments.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Sort by date
    appointments.sort((a, b) => new Date(a.reminder_date) - new Date(b.reminder_date));
    
    grid.innerHTML = appointments.map(apt => createAppointmentCard(apt)).join('');
}

// Create appointment card HTML
function createAppointmentCard(appointment) {
    const date = new Date(appointment.reminder_date);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isOverdue = date < now && !isToday;
    const isUpcoming = date > now;
    
    let statusClass = '';
    let statusLabel = '';
    
    if (isToday) {
        statusClass = 'today';
        statusLabel = '<span class="status-label today">Today</span>';
    } else if (isOverdue) {
        statusClass = 'overdue';
        statusLabel = '<span class="status-label overdue">Overdue</span>';
    } else if (isUpcoming) {
        statusClass = 'upcoming';
        statusLabel = '<span class="status-label upcoming">Upcoming</span>';
    }
    
    const icon = getAppointmentIcon(appointment.reminder_type);
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);
    
    return `
        <div class="appointment-card ${statusClass}">
            <div class="appointment-header">
                <div class="appointment-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="appointment-info">
                    <h3>${appointment.title}${statusLabel}</h3>
                    <span class="appointment-type-badge">${formatType(appointment.reminder_type)}</span>
                </div>
            </div>
            <div class="appointment-details">
                <div class="detail-row ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-clock"></i>
                    <span>${formattedTime}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-paw"></i>
                    <span>${appointment.petName}</span>
                </div>
            </div>
            ${appointment.description ? `
                <div class="appointment-description">
                    ${appointment.description}
                </div>
            ` : ''}
            <div class="appointment-actions">
                <button class="appointment-btn btn-complete" onclick="completeAppointment(${appointment.id})">
                    <i class="fas fa-check"></i> Complete
                </button>
                <button class="appointment-btn btn-delete" onclick="deleteAppointment(${appointment.id}, '${appointment.title}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

// Get icon for appointment type
function getAppointmentIcon(type) {
    const icons = {
        'appointment': 'fas fa-stethoscope',
        'vaccination': 'fas fa-syringe',
        'grooming': 'fas fa-cut',
        'other': 'fas fa-calendar'
    };
    return icons[type] || icons.other;
}

// Format appointment type
function formatType(type) {
    const types = {
        'appointment': 'Vet Visit',
        'vaccination': 'Vaccination',
        'grooming': 'Grooming',
        'other': 'Other'
    };
    return types[type] || type;
}

// Format date
function formatDate(date) {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Complete appointment
async function completeAppointment(id) {
    if (!confirm('Mark this appointment as completed?')) return;
    
    try {
        const response = await fetch(`/reminders/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_completed: true })
        });
        
        if (!response.ok) throw new Error('Failed to complete appointment');
        
        // Reload appointments
        await loadAppointments();
    } catch (error) {
        console.error('Error completing appointment:', error);
        alert('Failed to complete appointment. Please try again.');
    }
}

// Delete appointment
async function deleteAppointment(id, title) {
    if (!confirm(`Delete appointment "${title}"?`)) return;
    
    try {
        const response = await fetch(`/reminders/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete appointment');
        
        // Reload appointments
        await loadAppointments();
    } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete appointment. Please try again.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab filters
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active tab
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter appointments
            const filter = btn.dataset.filter;
            currentFilter = filter;
            filterAppointments(filter);
        });
    });
    
    // Add appointment button
    const addBtn = document.getElementById('addAppointmentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddAppointmentModal);
    }
    
    // Close modal button
    const closeBtn = document.getElementById('closeAppointmentModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('addAppointmentModal').classList.add('hidden');
        });
    }
    
    // Form submission
    const form = document.getElementById('addAppointmentForm');
    if (form) {
        form.addEventListener('submit', handleAddAppointment);
    }
}

// Filter appointments
function filterAppointments(filter) {
    let filtered = [...allAppointments];
    const now = new Date();
    
    if (filter === 'all') {
        // Show all
    } else if (filter === 'upcoming') {
        filtered = filtered.filter(apt => new Date(apt.reminder_date) > now);
    } else if (filter === 'overdue') {
        filtered = filtered.filter(apt => {
            const date = new Date(apt.reminder_date);
            const isToday = date.toDateString() === now.toDateString();
            return date < now && !isToday;
        });
    } else {
        // Filter by type
        filtered = filtered.filter(apt => apt.reminder_type === filter);
    }
    
    displayAppointments(filtered);
}

// Open add appointment modal
async function openAddAppointmentModal() {
    const modal = document.getElementById('addAppointmentModal');
    const petSelect = document.getElementById('appointmentPet');
    const dateInput = document.getElementById('appointmentDate');
    
    // Load pets
    try {
        const response = await fetch('/pets', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const pets = await response.json();
            petSelect.innerHTML = '<option value="">Select a pet</option>' + 
                pets.map(pet => `<option value="${pet.id}">${pet.name} (${pet.species})</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    
    // Clear form
    document.getElementById('addAppointmentForm').reset();
    document.getElementById('appointmentMessage').innerHTML = '';
    
    modal.classList.remove('hidden');
}

// Handle add appointment
async function handleAddAppointment(e) {
    e.preventDefault();
    
    const petId = document.getElementById('appointmentPet').value;
    const title = document.getElementById('appointmentTitle').value;
    const type = document.getElementById('appointmentType').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const description = document.getElementById('appointmentDescription').value;
    
    if (!petId) {
        alert('Please select a pet');
        return;
    }
    
    // Combine date and time
    const reminderDate = `${date}T${time}:00`;
    
    const data = {
        pet_id: parseInt(petId),
        title,
        reminder_type: type,
        reminder_date: reminderDate,
        description: description || null,
        is_completed: false
    };
    
    try {
        const response = await fetch('/reminders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to create appointment');
        
        // Show success message
        const messageDiv = document.getElementById('appointmentMessage');
        messageDiv.innerHTML = '<p style="color: var(--primary-color); text-align: center; margin-top: 16px;">✓ Appointment scheduled successfully!</p>';
        
        // Reload appointments
        await loadAppointments();
        
        // Close modal after delay
        setTimeout(() => {
            document.getElementById('addAppointmentModal').classList.add('hidden');
        }, 1500);
    } catch (error) {
        console.error('Error creating appointment:', error);
        const messageDiv = document.getElementById('appointmentMessage');
        messageDiv.innerHTML = '<p style="color: var(--accent-color); text-align: center; margin-top: 16px;">Failed to schedule appointment. Please try again.</p>';
    }
}

// Setup navbar
function setupNavbar() {
    // User dropdown toggle
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userAvatar && userDropdown) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        });
    }
}
