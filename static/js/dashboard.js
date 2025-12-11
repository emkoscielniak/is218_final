// Dashboard JavaScript

// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

// Get user info from token
function getUserFromToken() {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        console.error('Invalid token');
        return null;
    }
}

// Set user avatar initials
function setUserAvatar() {
    const userData = getUserFromToken();
    if (userData) {
        // You can customize this based on your user data structure
        const initials = 'JD'; // Default, update when you have user name
        document.getElementById('userAvatar').textContent = initials;
    }
}

// Load pets
async function loadPets() {
    try {
        const response = await fetch('/pets', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load pets');
        }

        const pets = await response.json();
        displayPets(pets);
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

// Display pets
function displayPets(pets) {
    const petList = document.getElementById('petList');
    
    if (pets.length === 0) {
        petList.innerHTML = '<p style="text-align: center; color: var(--text-purple); opacity: 0.7;">No pets yet. Add your first pet to get started!</p>';
        return;
    }

    petList.innerHTML = pets.map(pet => `
        <div class="pet-card" data-pet-id="${pet.id}">
            <div class="pet-info">
                <div class="pet-image">
                    ${getSpeciesIcon(pet.species)}
                </div>
                <div class="pet-details">
                    <h4>${pet.name}</h4>
                    <p class="pet-meta">${pet.species}${pet.breed ? ' • ' + pet.breed : ''} • ${pet.age || 'N/A'} years</p>
                </div>
            </div>
            <div class="pet-status">
                <span class="status-badge healthy">HEALTHY</span>
                <div class="pet-actions">
                    <button class="btn-icon" onclick="viewPetDetails(${pet.id})" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" onclick="deletePet(${pet.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

// Get species icon
function getSpeciesIcon(species) {
    const iconMap = {
        'dog': '<i class="fas fa-dog"></i>',
        'cat': '<i class="fas fa-cat"></i>',
        'bird': '<i class="fas fa-dove"></i>',
        'fish': '<i class="fas fa-fish"></i>',
        'rabbit': '<i class="fas fa-rabbit"></i>',
        'hamster': '<i class="fas fa-otter"></i>',
        'guinea pig': '<i class="fas fa-otter"></i>',
        'reptile': '<i class="fas fa-dragon"></i>',
        'other': '<i class="fas fa-paw"></i>'
    };
    return iconMap[species.toLowerCase()] || '<i class="fas fa-paw"></i>';
}

// Modal functionality
const modal = document.getElementById('addPetModal');
const addPetBtn = document.getElementById('addPetBtn');
const closeModal = document.getElementById('closeModal');

addPetBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// Add pet form submission
document.getElementById('addPetForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageDiv = document.getElementById('addPetMessage');
    messageDiv.textContent = '';

    const petData = {
        name: document.getElementById('petName').value,
        species: document.getElementById('petSpecies').value,
        breed: document.getElementById('petBreed').value || null,
        age: parseInt(document.getElementById('petAge').value) || null,
        weight: parseFloat(document.getElementById('petWeight').value) || null,
        medical_notes: document.getElementById('petMedicalNotes').value || null
    };

    try {
        const response = await fetch('/pets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(petData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to add pet');
        }

        const newPet = await response.json();
        
        messageDiv.textContent = `✅ ${newPet.name} added successfully!`;
        messageDiv.style.color = 'var(--primary-color)';
        messageDiv.style.padding = '12px';
        messageDiv.style.background = 'rgba(127, 169, 155, 0.1)';
        messageDiv.style.borderRadius = 'var(--radius-sm)';
        messageDiv.style.marginTop = '16px';

        // Reset form
        document.getElementById('addPetForm').reset();

        // Reload pets
        setTimeout(() => {
            modal.classList.add('hidden');
            loadPets();
        }, 1500);

    } catch (error) {
        messageDiv.textContent = `❌ ${error.message}`;
        messageDiv.style.color = 'var(--accent-color)';
        messageDiv.style.padding = '12px';
        messageDiv.style.background = 'rgba(174, 99, 120, 0.1)';
        messageDiv.style.borderRadius = 'var(--radius-sm)';
        messageDiv.style.marginTop = '16px';
    }
});

// View pet details
function viewPetDetails(petId) {
    // Navigate to pet details page or show modal
    alert(`View details for pet ${petId}`);
}

// Delete pet
async function deletePet(petId) {
    if (!confirm('Are you sure you want to delete this pet?')) {
        return;
    }

    try {
        const response = await fetch(`/pets/${petId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete pet');
        }

        // Reload pets
        loadPets();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Load upcoming events (placeholder)
function loadUpcomingEvents() {
    const eventsDiv = document.getElementById('upcomingEvents');
    // Placeholder events
    eventsDiv.innerHTML = `
        <div class="event-item">
            <div class="event-date">
                <span class="day">12</span>
                <span class="month">DEC</span>
            </div>
            <div class="event-details">
                <h5>Vet Checkup - Luna</h5>
                <p>10:00 AM<br>City Vet Clinic</p>
            </div>
        </div>
        <div class="event-item">
            <div class="event-date">
                <span class="day">20</span>
                <span class="month">DEC</span>
            </div>
            <div class="event-details">
                <h5>Vaccination - Max</h5>
                <p>2:30 PM<br>Pet Care Center</p>
            </div>
        </div>
    `;
}

// Load reminders (placeholder)
function loadReminders() {
    const remindersDiv = document.getElementById('reminders');
    // Placeholder reminders
    remindersDiv.innerHTML = `
        <div class="reminder-item">
            <div class="reminder-checkbox"></div>
            <div class="reminder-content">
                <h5>Give Luna her medication</h5>
                <p>Today, 6:00 PM</p>
            </div>
        </div>
        <div class="reminder-item">
            <div class="reminder-checkbox"></div>
            <div class="reminder-content">
                <h5>Max's flea treatment</h5>
                <p>Tomorrow</p>
            </div>
        </div>
        <div class="reminder-item">
            <div class="reminder-checkbox"></div>
            <div class="reminder-content">
                <h5>Order Charlie's food</h5>
                <p>Dec 15</p>
            </div>
        </div>
    `;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    setUserAvatar();
    loadPets();
    loadUpcomingEvents();
    loadReminders();
});
