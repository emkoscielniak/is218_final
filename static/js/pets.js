// Pets Page JavaScript

// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

let allPets = [];

// Set user avatar
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
            document.getElementById('userAvatar').textContent = initials.toUpperCase() || 'U';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load all pets
async function loadPets() {
    const petsGrid = document.getElementById('petsGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Show loading
    petsGrid.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading your pets...</p></div>';
    emptyState.classList.add('hidden');
    
    try {
        const response = await fetch('/pets', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            allPets = await response.json();
            
            if (allPets.length === 0) {
                petsGrid.innerHTML = '';
                emptyState.classList.remove('hidden');
            } else {
                displayPets(allPets);
            }
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        petsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error Loading Pets</h3><p>Please try refreshing the page</p></div>';
    }
}

// Display pets in grid
function displayPets(pets) {
    const petsGrid = document.getElementById('petsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (pets.length === 0) {
        petsGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    petsGrid.innerHTML = pets.map(pet => `
        <div class="pet-card-full" onclick="showPetDetails(${pet.id})">
            <div class="pet-card-header">
                <div class="pet-icon-large">
                    ${getSpeciesIcon(pet.species)}
                </div>
                <div class="pet-info">
                    <h3>${pet.name}</h3>
                    <span class="pet-species-badge">${pet.species}</span>
                </div>
            </div>
            
            <div class="pet-details-grid">
                ${pet.breed ? `
                    <div class="pet-detail-item">
                        <i class="fas fa-dna"></i>
                        <span><strong>Breed:</strong> ${pet.breed}</span>
                    </div>
                ` : ''}
                ${pet.age !== null && pet.age !== undefined ? `
                    <div class="pet-detail-item">
                        <i class="fas fa-birthday-cake"></i>
                        <span><strong>Age:</strong> ${pet.age} ${pet.age === 1 ? 'year' : 'years'}</span>
                    </div>
                ` : ''}
                ${pet.weight ? `
                    <div class="pet-detail-item">
                        <i class="fas fa-weight"></i>
                        <span><strong>Weight:</strong> ${pet.weight} lbs</span>
                    </div>
                ` : ''}
                <div class="pet-detail-item">
                    <i class="fas fa-calendar"></i>
                    <span><strong>Added:</strong> ${new Date(pet.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            
            <div class="pet-stats">
                <div class="pet-stat">
                    <span class="pet-stat-value" id="activities-${pet.id}">-</span>
                    <span class="pet-stat-label">Activities</span>
                </div>
                <div class="pet-stat">
                    <span class="pet-stat-value" id="medications-${pet.id}">-</span>
                    <span class="pet-stat-label">Medications</span>
                </div>
                <div class="pet-stat">
                    <span class="pet-stat-value" id="reminders-${pet.id}">-</span>
                    <span class="pet-stat-label">Reminders</span>
                </div>
            </div>
            
            <div class="pet-card-actions" onclick="event.stopPropagation()">
                <button class="pet-action-btn" onclick="editPet(${pet.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="pet-action-btn danger" onclick="deletePet(${pet.id}, '${pet.name}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    // Load stats for each pet
    pets.forEach(pet => loadPetStats(pet.id));
}

// Load pet statistics
async function loadPetStats(petId) {
    try {
        const [activitiesRes, medicationsRes, remindersRes] = await Promise.all([
            fetch(`/activities?pet_id=${petId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/medications?pet_id=${petId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/reminders?completed=false`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const activities = activitiesRes.ok ? await activitiesRes.json() : [];
        const medications = medicationsRes.ok ? await medicationsRes.json() : [];
        const allReminders = remindersRes.ok ? await remindersRes.json() : [];
        const reminders = allReminders.filter(r => r.pet_id === petId);
        
        document.getElementById(`activities-${petId}`).textContent = activities.length;
        document.getElementById(`medications-${petId}`).textContent = medications.length;
        document.getElementById(`reminders-${petId}`).textContent = reminders.length;
    } catch (error) {
        console.error(`Error loading stats for pet ${petId}:`, error);
    }
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
    return iconMap[species?.toLowerCase()] || '<i class="fas fa-paw"></i>';
}

// Show pet details modal
async function showPetDetails(petId) {
    const modal = document.getElementById('petDetailsModal');
    const content = document.getElementById('petDetailsContent');
    
    const pet = allPets.find(p => p.id === petId);
    if (!pet) return;
    
    content.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div></div>';
    modal.classList.remove('hidden');
    
    try {
        // Fetch detailed data
        const [activitiesRes, medicationsRes, remindersRes] = await Promise.all([
            fetch(`/activities?pet_id=${petId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/medications?pet_id=${petId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/reminders?completed=false`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const activities = activitiesRes.ok ? await activitiesRes.json() : [];
        const medications = medicationsRes.ok ? await medicationsRes.json() : [];
        const allReminders = remindersRes.ok ? await remindersRes.json() : [];
        const reminders = allReminders.filter(r => r.pet_id === petId);
        
        content.innerHTML = `
            <div class="pet-details-hero">
                <div class="pet-icon-large">${getSpeciesIcon(pet.species)}</div>
                <div>
                    <h2>${pet.name}</h2>
                    <span class="pet-species-badge">${pet.species}${pet.breed ? ` • ${pet.breed}` : ''}</span>
                </div>
            </div>
            
            <div class="pet-info-section">
                <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                <div class="info-grid">
                    ${pet.age !== null ? `<p><strong>Age:</strong> ${pet.age} years</p>` : ''}
                    ${pet.weight ? `<p><strong>Weight:</strong> ${pet.weight} lbs</p>` : ''}
                    <p><strong>Added:</strong> ${new Date(pet.created_at).toLocaleDateString()}</p>
                </div>
                ${pet.medical_notes ? `
                    <div class="medical-notes">
                        <strong>Medical Notes:</strong>
                        <p>${pet.medical_notes}</p>
                    </div>
                ` : ''}
            </div>
            
            ${pet.ai_care_tips ? `
                <div class="pet-info-section">
                    <h4><i class="fas fa-lightbulb"></i> AI Care Tips</h4>
                    <div class="care-tips-content">${formatCareTips(pet.ai_care_tips)}</div>
                </div>
            ` : ''}
            
            <div class="pet-info-section">
                <h4><i class="fas fa-chart-line"></i> Quick Stats</h4>
                <div class="stats-grid">
                    <div class="stat-card">
                        <i class="fas fa-running"></i>
                        <span class="stat-number">${activities.length}</span>
                        <span class="stat-label">Activities Logged</span>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-pills"></i>
                        <span class="stat-number">${medications.length}</span>
                        <span class="stat-label">Active Medications</span>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-bell"></i>
                        <span class="stat-number">${reminders.length}</span>
                        <span class="stat-label">Upcoming Reminders</span>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-primary" onclick="editPet(${pet.id})">
                    <i class="fas fa-edit"></i> Edit Pet
                </button>
                <button class="btn-secondary" onclick="document.getElementById('petDetailsModal').classList.add('hidden')">
                    Close
                </button>
            </div>
        `;
    } catch (error) {
        console.error('Error loading pet details:', error);
        content.innerHTML = '<p class="error-message">Error loading pet details</p>';
    }
}

// Format AI care tips
function formatCareTips(tips) {
    const tipPattern = /(\d+\.\s\*\*[^*]+\*\*:?\s*[^\n]+(?:\n(?!\d+\.).*)*)/g;
    const matches = tips.match(tipPattern);
    
    if (matches) {
        return matches.map(tip => {
            const headingMatch = tip.match(/\*\*([^*]+)\*\*/);
            const heading = headingMatch ? headingMatch[1].replace(/:/g, '').trim() : '';
            const content = tip.replace(/\d+\.\s\*\*[^*]+\*\*:?\s*/, '').trim();
            
            return `
                <div class="care-tip-item">
                    <h5>${heading}</h5>
                    <p>${content}</p>
                </div>
            `;
        }).join('');
    }
    
    return `<p>${tips}</p>`;
}

// Filter and sort pets
function filterAndSortPets() {
    const searchTerm = document.getElementById('petSearchInput').value.toLowerCase();
    const speciesFilter = document.getElementById('speciesFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let filtered = allPets.filter(pet => {
        const matchesSearch = pet.name.toLowerCase().includes(searchTerm) || 
                            (pet.breed && pet.breed.toLowerCase().includes(searchTerm));
        const matchesSpecies = speciesFilter === 'all' || pet.species.toLowerCase() === speciesFilter;
        return matchesSearch && matchesSpecies;
    });
    
    // Sort
    filtered.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'age':
                return (b.age || 0) - (a.age || 0);
            case 'newest':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            default:
                return 0;
        }
    });
    
    displayPets(filtered);
}

// Edit pet (placeholder)
function editPet(petId) {
    alert('Edit pet feature coming soon!');
}

// Delete pet
async function deletePet(petId, petName) {
    if (!confirm(`Are you sure you want to delete ${petName}? This will also delete all associated activities, medications, and reminders.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/pets/${petId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            await loadPets();
        } else {
            alert('Error deleting pet');
        }
    } catch (error) {
        console.error('Error deleting pet:', error);
        alert('Error deleting pet');
    }
}

// Handle add pet form
async function handleAddPet(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('addPetMessage');
    const name = document.getElementById('petName').value;
    const species = document.getElementById('petSpecies').value;
    const breed = document.getElementById('petBreed').value;
    const age = document.getElementById('petAge').value;
    const weight = document.getElementById('petWeight').value;
    const medicalNotes = document.getElementById('petMedicalNotes').value;
    
    try {
        const petData = { name, species };
        if (breed) petData.breed = breed;
        if (age) petData.age = parseInt(age);
        if (weight) petData.weight = parseFloat(weight);
        if (medicalNotes) petData.medical_notes = medicalNotes;
        
        const response = await fetch('/pets/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(petData)
        });
        
        if (response.ok) {
            messageDiv.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i> Pet added successfully!</div>';
            messageDiv.style.display = 'block';
            
            setTimeout(() => {
                document.getElementById('addPetModal').classList.add('hidden');
                document.getElementById('addPetForm').reset();
                messageDiv.innerHTML = '';
                messageDiv.style.display = 'none';
                loadPets();
            }, 2000);
        } else {
            const error = await response.json();
            messageDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${error.detail}</div>`;
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error adding pet:', error);
        messageDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> Error adding pet</div>`;
        messageDiv.style.display = 'block';
    }
}

// Setup navbar
function setupNavbar() {
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userAvatar && userDropdown) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                userDropdown.classList.remove('show');
            }
        });
    }
    
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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    setUserAvatar();
    loadPets();
    setupNavbar();
    
    // Add pet button
    document.getElementById('addPetBtn').addEventListener('click', () => {
        document.getElementById('addPetModal').classList.remove('hidden');
    });
    
    // Add pet form submit
    document.getElementById('addPetForm').addEventListener('submit', handleAddPet);
    
    // Search and filter
    document.getElementById('petSearchInput').addEventListener('input', filterAndSortPets);
    document.getElementById('speciesFilter').addEventListener('change', filterAndSortPets);
    document.getElementById('sortBy').addEventListener('change', filterAndSortPets);
});
