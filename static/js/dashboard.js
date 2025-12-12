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

// Set user avatar initials and welcome message
async function setUserAvatar() {
    try {
        const response = await fetch('/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            document.getElementById('navUsername').textContent = user.username;
            
            // Update welcome message with first name
            const welcomeText = document.querySelector('.welcome-text');
            if (welcomeText && user.firstName) {
                welcomeText.innerHTML = `Welcome back, ${user.firstName}! <i class="fas fa-hand-wave"></i>`;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
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

// Format AI care tips
function formatCareTips(tips) {
    // Split by numbered list pattern (1., 2., 3., etc.) or by asterisks
    const tipPattern = /(\d+\.\s\*\*[^*]+\*\*:?\s*[^\n]+(?:\n(?!\d+\.).*)*)/g;
    const matches = tips.match(tipPattern);
    
    if (matches) {
        return matches.map(tip => {
            // Extract heading (bold text) and content
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
    
    // Fallback: display as regular text if pattern doesn't match
    return `<p>${tips}</p>`;
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
// Birthday change handler - auto-calculate age
document.getElementById('petBirthday')?.addEventListener('change', (e) => {
    const birthday = e.target.value;
    if (birthday) {
        const birthDate = new Date(birthday);
        const today = new Date();
        
        // Calculate age in years
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred this year yet
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Set age to 0 if negative (future date)
        if (age < 0) {
            age = 0;
        }
        
        // Update age field
        document.getElementById('petAge').value = age;
    }
});

// Breed type toggle handler
document.getElementById('petBreedType')?.addEventListener('change', (e) => {
    const breedType = e.target.value;
    const primaryGroup = document.getElementById('breedPrimaryGroup');
    const secondaryGroup = document.getElementById('breedSecondaryGroup');
    const tertiaryGroup = document.getElementById('breedTertiaryGroup');
    
    if (breedType === 'purebred') {
        primaryGroup.style.display = 'block';
        secondaryGroup.style.display = 'none';
        tertiaryGroup.style.display = 'none';
        document.getElementById('petBreed').required = true;
        document.getElementById('petBreedSecondary').required = false;
    } else if (breedType === 'mix') {
        primaryGroup.style.display = 'block';
        secondaryGroup.style.display = 'block';
        tertiaryGroup.style.display = 'block';
        document.getElementById('petBreed').required = true;
        document.getElementById('petBreedSecondary').required = true;
    } else {
        primaryGroup.style.display = 'none';
        secondaryGroup.style.display = 'none';
        tertiaryGroup.style.display = 'none';
        document.getElementById('petBreed').required = false;
        document.getElementById('petBreedSecondary').required = false;
    }
});

document.getElementById('addPetForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageDiv = document.getElementById('addPetMessage');
    messageDiv.textContent = '';

    const petData = {
        name: document.getElementById('petName').value,
        species: document.getElementById('petSpecies').value,
        sex: document.getElementById('petSex').value || null,
        birthday: document.getElementById('petBirthday').value || null,
        breed_type: document.getElementById('petBreedType').value || null,
        breed: document.getElementById('petBreed').value || null,
        breed_secondary: document.getElementById('petBreedSecondary').value || null,
        breed_tertiary: document.getElementById('petBreedTertiary').value || null,
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
async function viewPetDetails(petId) {
    try {
        const response = await fetch(`/pets/${petId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load pet details');
        }

        const pet = await response.json();
        showPetDetailsModal(pet);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Show pet details modal
function showPetDetailsModal(pet) {
    const modal = document.getElementById('petDetailsModal');
    const modalContent = document.getElementById('petDetailsContent');
    
    modalContent.innerHTML = `
        <div class="pet-details-header">
            <div class="pet-image-large">
                ${getSpeciesIcon(pet.species)}
            </div>
            <div>
                <h2>${pet.name}</h2>
                <p class="pet-meta">${pet.species}${pet.breed ? ' • ' + pet.breed : ''}</p>
            </div>
        </div>
        
        <div class="pet-details-grid">
            <div class="detail-item">
                <i class="fas fa-birthday-cake"></i>
                <div>
                    <strong>Age</strong>
                    <p>${pet.age ? pet.age + ' years' : 'Not specified'}</p>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-weight"></i>
                <div>
                    <strong>Weight</strong>
                    <p>${pet.weight ? pet.weight + ' lbs' : 'Not specified'}</p>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-calendar"></i>
                <div>
                    <strong>Added</strong>
                    <p>${new Date(pet.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
        
        ${pet.medical_notes ? `
            <div class="detail-section">
                <h4><i class="fas fa-notes-medical"></i> Medical Notes</h4>
                <p>${pet.medical_notes}</p>
            </div>
        ` : ''}
        
        ${pet.ai_care_tips ? `
            <div class="detail-section">
                <h4><i class="fas fa-lightbulb"></i> AI Care Tips</h4>
                <div class="care-tips-content">${formatCareTips(pet.ai_care_tips)}</div>
            </div>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
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
// Load upcoming events from reminders, medications, and activities
async function loadUpcomingEvents() {
    const eventsDiv = document.getElementById('upcomingEvents');
    
    try {
        // Fetch all data sources in parallel
        const [remindersRes, medicationsRes, petsRes] = await Promise.all([
            fetch('/reminders?completed=false', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/medications?active_only=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/pets', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const reminders = remindersRes.ok ? await remindersRes.json() : [];
        const medications = medicationsRes.ok ? await medicationsRes.json() : [];
        const pets = petsRes.ok ? await petsRes.json() : [];
        
        // Create pet lookup map
        const petMap = {};
        pets.forEach(pet => petMap[pet.id] = pet.name);
        
        // Aggregate all events
        const events = [];
        const now = new Date();
        
        // Add reminders as events
        reminders.forEach(reminder => {
            const date = new Date(reminder.reminder_date);
            if (date > now) {
                events.push({
                    date: date,
                    type: reminder.reminder_type,
                    title: reminder.title,
                    petName: reminder.pet_id ? petMap[reminder.pet_id] : null,
                    description: reminder.description,
                    icon: getReminderTypeIcon(reminder.reminder_type)
                });
            }
        });
        
        // Add medication reminders (upcoming doses)
        medications.forEach(med => {
            const startDate = new Date(med.start_date);
            const endDate = med.end_date ? new Date(med.end_date) : null;
            
            // If medication is ongoing and has frequency info
            if (startDate < now && (!endDate || endDate > now)) {
                // Create a "next dose" event for today or tomorrow
                const nextDose = new Date();
                nextDose.setHours(9, 0, 0, 0); // Default to 9 AM
                
                if (nextDose < now) {
                    nextDose.setDate(nextDose.getDate() + 1);
                }
                
                events.push({
                    date: nextDose,
                    type: 'medication',
                    title: `${med.name} - ${med.dosage}`,
                    petName: petMap[med.pet_id],
                    description: `${med.frequency} • ${med.route}`,
                    icon: '<i class="fas fa-pills"></i>'
                });
            }
        });
        
        // Sort by date and take next 5
        events.sort((a, b) => a.date - b.date);
        const upcomingEvents = events.slice(0, 5);
        
        if (upcomingEvents.length === 0) {
            eventsDiv.innerHTML = '<p class="no-data">No upcoming events</p>';
            return;
        }
        
        // Display events
        eventsDiv.innerHTML = upcomingEvents.map(event => {
            const day = event.date.getDate();
            const month = event.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const time = event.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const petInfo = event.petName ? ` - ${event.petName}` : '';
            
            return `
                <div class="event-item">
                    <div class="event-date">
                        <span class="day">${day}</span>
                        <span class="month">${month}</span>
                    </div>
                    <div class="event-details">
                        <h5>${event.icon} ${event.title}${petInfo}</h5>
                        <p>${time}${event.description ? '<br>' + event.description : ''}</p>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading upcoming events:', error);
        eventsDiv.innerHTML = '<p class="no-data">Error loading events</p>';
    }
}

// Get icon for reminder type
function getReminderTypeIcon(type) {
    const iconMap = {
        'medication': '<i class="fas fa-pills"></i>',
        'appointment': '<i class="fas fa-calendar-check"></i>',
        'vaccination': '<i class="fas fa-syringe"></i>',
        'grooming': '<i class="fas fa-cut"></i>',
        'other': '<i class="fas fa-bell"></i>'
    };
    return iconMap[type] || '<i class="fas fa-bell"></i>';
}

// Get icon for activity type
function getActivityTypeIcon(type) {
    const iconMap = {
        'walk': '<i class="fas fa-walking"></i>',
        'feeding': '<i class="fas fa-utensils"></i>',
        'medication': '<i class="fas fa-pills"></i>',
        'vet_visit': '<i class="fas fa-user-md"></i>',
        'grooming': '<i class="fas fa-cut"></i>',
        'play': '<i class="fas fa-futbol"></i>',
        'training': '<i class="fas fa-graduation-cap"></i>',
        'other': '<i class="fas fa-paw"></i>'
    };
    return iconMap[type] || '<i class="fas fa-paw"></i>';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    setUserAvatar();
    loadPets();
    loadUpcomingEvents();
    loadReminders();
    
    // Navbar functionality
    setupNavbar();
    
    // Log Activity button click handler
    const logActivityBtn = document.getElementById('logActivityBtn');
    if (logActivityBtn) {
        logActivityBtn.addEventListener('click', openLogActivityModal);
    }
    
    // Close activity modal
    const closeActivityModal = document.getElementById('closeActivityModal');
    if (closeActivityModal) {
        closeActivityModal.addEventListener('click', () => {
            document.getElementById('logActivityModal').classList.add('hidden');
        });
    }
    
    // Log activity form submit
    const logActivityForm = document.getElementById('logActivityForm');
    if (logActivityForm) {
        logActivityForm.addEventListener('submit', handleLogActivity);
    }
    
    // Add Medication button click handler
    const addMedicationBtn = document.getElementById('addMedicationBtn');
    if (addMedicationBtn) {
        addMedicationBtn.addEventListener('click', openAddMedicationModal);
    }
    
    // Close medication modal
    const closeMedicationModal = document.getElementById('closeMedicationModal');
    if (closeMedicationModal) {
        closeMedicationModal.addEventListener('click', () => {
            document.getElementById('addMedicationModal').classList.add('hidden');
        });
    }
    
    // Add medication form submit
    const addMedicationForm = document.getElementById('addMedicationForm');
    if (addMedicationForm) {
        addMedicationForm.addEventListener('submit', handleAddMedication);
    }
    
    // Find Vet button click handler
    const findVetBtn = document.getElementById('findVetBtn');
    if (findVetBtn) {
        findVetBtn.addEventListener('click', openFindVetModal);
    }
    
    // Close vet modal
    const closeVetModal = document.getElementById('closeVetModal');
    if (closeVetModal) {
        closeVetModal.addEventListener('click', () => {
            document.getElementById('findVetModal').classList.add('hidden');
        });
    }
    
    // Search vets button
    const searchVetsBtn = document.getElementById('searchVetsBtn');
    if (searchVetsBtn) {
        searchVetsBtn.addEventListener('click', searchVets);
    }
    
    // Enter key to search
    const vetLocationInput = document.getElementById('vetLocation');
    if (vetLocationInput) {
        vetLocationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchVets();
            }
        });
    }
    
    // Add Reminder button click handler
    const addReminderBtn = document.querySelector('.add-reminder-btn');
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', openAddReminderModal);
    }
    
    // Close reminder modal
    const closeReminderModal = document.getElementById('closeReminderModal');
    if (closeReminderModal) {
        closeReminderModal.addEventListener('click', () => {
            document.getElementById('addReminderModal').classList.add('hidden');
        });
    }
    
    // Add reminder form submit
    const addReminderForm = document.getElementById('addReminderForm');
    if (addReminderForm) {
        addReminderForm.addEventListener('submit', handleAddReminder);
    }
});

// Open log activity modal
async function openLogActivityModal() {
    const modal = document.getElementById('logActivityModal');
    const activityPetSelect = document.getElementById('activityPet');
    
    // Set default date to now
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('activityDate').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Load pets into dropdown
    try {
        const response = await fetch('/pets', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const pets = await response.json();
            activityPetSelect.innerHTML = '<option value="">Choose a pet...</option>' + 
                pets.map(pet => `<option value="${pet.id}">${pet.name} (${pet.species})</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
    
    modal.classList.remove('hidden');
}

// Handle log activity form submission
async function handleLogActivity(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('activityMessage');
    const petId = document.getElementById('activityPet').value;
    const activityDate = document.getElementById('activityDate').value;
    const description = document.getElementById('activityDescription').value;
    
    if (!description.trim()) {
        messageDiv.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Please describe the activity</div>';
        messageDiv.style.display = 'block';
        return;
    }
    
    try {
        const activityData = {
            pet_id: parseInt(petId),
            activity_date: new Date(activityDate).toISOString(),
            description: description.trim()
        };
        
        const response = await fetch('/activities', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(activityData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to log activity');
        }
        
        const activity = await response.json();
        
        // Show success message with AI-extracted details
        let successMsg = '<div class="success-message"><i class="fas fa-check-circle"></i> Activity logged successfully!';
        if (activity.activity_type) {
            successMsg += `<br><small>AI categorized as: <strong>${activity.activity_type}</strong></small>`;
        }
        if (activity.title) {
            successMsg += `<br><small>Title: ${activity.title}</small>`;
        }
        successMsg += '</div>';
        messageDiv.innerHTML = successMsg;
        messageDiv.style.display = 'block';
        
        // Reset form
        document.getElementById('logActivityForm').reset();
        
        // Close modal after 2 seconds
        setTimeout(() => {
            document.getElementById('logActivityModal').classList.add('hidden');
            messageDiv.innerHTML = '';
            messageDiv.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        console.error('Error logging activity:', error);
        messageDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${error.message}</div>`;
        messageDiv.style.display = 'block';
    }
}

// Open add medication modal
async function openAddMedicationModal() {
    const modal = document.getElementById('addMedicationModal');
    const medicationPetSelect = document.getElementById('medicationPet');
    
    // Set default start date to today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('medicationStartDate').value = `${year}-${month}-${day}`;
    
    // Load pets into dropdown
    try {
        const response = await fetch('/pets', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const pets = await response.json();
            medicationPetSelect.innerHTML = '<option value="">Choose a pet...</option>' + 
                pets.map(pet => `<option value="${pet.id}">${pet.name} (${pet.species})</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
    
    modal.classList.remove('hidden');
}

// Handle add medication form submission
async function handleAddMedication(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('medicationMessage');
    const petId = document.getElementById('medicationPet').value;
    const name = document.getElementById('medicationName').value;
    const dosage = document.getElementById('medicationDosage').value;
    const frequency = document.getElementById('medicationFrequency').value;
    const route = document.getElementById('medicationRoute').value;
    const reason = document.getElementById('medicationReason').value;
    const prescribingVet = document.getElementById('medicationVet').value;
    const startDate = document.getElementById('medicationStartDate').value;
    const endDate = document.getElementById('medicationEndDate').value;
    const notes = document.getElementById('medicationNotes').value;
    const isActive = document.getElementById('medicationActive').checked;
    
    try {
        const medicationData = {
            pet_id: parseInt(petId),
            name: name,
            dosage: dosage,
            frequency: frequency,
            is_active: isActive,
            start_date: new Date(startDate).toISOString()
        };
        
        // Add optional fields
        if (route) medicationData.route = route;
        if (reason) medicationData.reason = reason;
        if (prescribingVet) medicationData.prescribing_vet = prescribingVet;
        if (endDate) medicationData.end_date = new Date(endDate).toISOString();
        if (notes) medicationData.notes = notes;
        
        const response = await fetch('/medications', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(medicationData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to add medication');
        }
        
        const medication = await response.json();
        
        // Show success message
        messageDiv.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i> Medication added successfully!</div>';
        messageDiv.style.display = 'block';
        
        // Reset form
        document.getElementById('addMedicationForm').reset();
        
        // Close modal after 2 seconds
        setTimeout(() => {
            document.getElementById('addMedicationModal').classList.add('hidden');
            messageDiv.innerHTML = '';
            messageDiv.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        console.error('Error adding medication:', error);
        messageDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${error.message}</div>`;
        messageDiv.style.display = 'block';
    }
}

// Open find vet modal
function openFindVetModal() {
    const modal = document.getElementById('findVetModal');
    const resultsDiv = document.getElementById('vetResults');
    const messageDiv = document.getElementById('vetSearchMessage');
    
    // Clear previous results and messages
    resultsDiv.innerHTML = `
        <div class="empty-vet-state">
            <i class="fas fa-map-marked-alt"></i>
            <h4>Find Veterinary Clinics Near You</h4>
            <p>Enter a location to search for veterinary clinics, emergency care, and pet hospitals</p>
        </div>
    `;
    messageDiv.innerHTML = '';
    messageDiv.style.display = 'none';
    document.getElementById('vetLocation').value = '';
    document.getElementById('emergencyOnly').checked = false;
    document.getElementById('openNow').checked = false;
    
    modal.classList.remove('hidden');
}

// Search for vets
async function searchVets() {
    const location = document.getElementById('vetLocation').value.trim();
    const emergencyOnly = document.getElementById('emergencyOnly').checked;
    const openNow = document.getElementById('openNow').checked;
    const resultsDiv = document.getElementById('vetResults');
    const messageDiv = document.getElementById('vetSearchMessage');
    
    if (!location) {
        messageDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please enter a location';
        messageDiv.className = 'search-message error';
        messageDiv.style.display = 'block';
        return;
    }
    
    // Show loading state
    messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching for veterinary clinics...';
    messageDiv.className = 'search-message loading';
    messageDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    
    try {
        // Simulate API call with mock data
        // In production, this would call Google Places API or similar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockVets = generateMockVets(location, emergencyOnly, openNow);
        
        messageDiv.style.display = 'none';
        displayVetResults(mockVets);
        
    } catch (error) {
        console.error('Error searching vets:', error);
        messageDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error searching for clinics. Please try again.';
        messageDiv.className = 'search-message error';
        messageDiv.style.display = 'block';
    }
}

// Generate mock vet data (replace with real API in production)
function generateMockVets(location, emergencyOnly, openNow) {
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 8 && currentHour < 18;
    
    // Parse location to extract city name
    const locationParts = location.split(',');
    const cityName = locationParts[0].trim();
    
    // Generate area code based on location (simple hash for consistency)
    const areaCode = 200 + (cityName.charCodeAt(0) % 800);
    
    // Vet name prefixes and types for variety
    const namePatterns = [
        `${cityName} Veterinary Hospital`,
        `${cityName} Animal Clinic`,
        `${cityName} Pet Care Center`,
        `${cityName} Emergency Animal Hospital`,
        `${cityName} Veterinary Services`,
        `All Pets Veterinary - ${cityName}`,
        `Advanced Animal Hospital of ${cityName}`,
        `${cityName} Mobile Vet Service`
    ];
    
    const streetNames = ['Main Street', 'Oak Avenue', 'Elm Boulevard', 'Washington Street', 
                        'Park Avenue', 'Maple Drive', 'Central Avenue', 'River Road',
                        'Highland Avenue', 'Broadway', 'Market Street', 'Grove Street'];
    
    const scheduleTypes = [
        { hours: '24/7 Emergency Services Available', isEmergency: true, extendedHours: true },
        { hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-3PM', isEmergency: false, extendedHours: false },
        { hours: 'Open 24 Hours', isEmergency: true, extendedHours: true },
        { hours: 'Mon-Sat: 9AM-7PM, Sun: Closed', isEmergency: false, extendedHours: false },
        { hours: 'Extended Hours: 7AM-10PM Daily', isEmergency: true, extendedHours: true },
        { hours: 'Mon-Fri: 7AM-9PM, Sat-Sun: 8AM-6PM', isEmergency: false, extendedHours: true },
        { hours: 'Mon-Thu: 8AM-6PM, Fri: 8AM-8PM, Sat: 9AM-5PM', isEmergency: false, extendedHours: false },
        { hours: 'Daily: 8AM-8PM', isEmergency: false, extendedHours: true }
    ];
    
    // Generate 6-8 vets for the location
    const vetCount = 6 + Math.floor(Math.random() * 3);
    const vets = [];
    
    for (let i = 0; i < vetCount; i++) {
        const schedule = scheduleTypes[i % scheduleTypes.length];
        const streetNumber = 100 + Math.floor(Math.random() * 900);
        const streetName = streetNames[i % streetNames.length];
        
        // Determine if currently open based on schedule
        let isOpen = isBusinessHours;
        if (schedule.extendedHours) {
            isOpen = currentHour >= 7 && currentHour < 22;
        }
        if (schedule.isEmergency && schedule.hours.includes('24')) {
            isOpen = true; // 24/7 is always open
        }
        
        vets.push({
            name: namePatterns[i % namePatterns.length],
            address: `${streetNumber} ${streetName}, ${location}`,
            phone: `(${areaCode}) ${500 + i}55-0${100 + i * 111}`,
            rating: 4.3 + Math.random() * 0.7, // 4.3 to 5.0
            reviewCount: 50 + Math.floor(Math.random() * 400),
            isOpen: isOpen,
            isEmergency: schedule.isEmergency,
            hours: schedule.hours,
            distance: (0.3 + i * 0.5 + Math.random() * 0.3).toFixed(1) + ' miles'
        });
    }
    
    // Sort by distance
    vets.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    
    // Apply filters
    let filteredVets = vets;
    
    if (emergencyOnly) {
        filteredVets = filteredVets.filter(v => v.isEmergency);
    }
    
    if (openNow) {
        filteredVets = filteredVets.filter(v => v.isOpen);
    }
    
    return filteredVets;
}

// Display vet results
function displayVetResults(vets) {
    const resultsDiv = document.getElementById('vetResults');
    
    if (vets.length === 0) {
        resultsDiv.innerHTML = `
            <div class="empty-vet-state">
                <i class="fas fa-search"></i>
                <h4>No Clinics Found</h4>
                <p>Try adjusting your filters or searching a different location</p>
            </div>
        `;
        return;
    }
    
    resultsDiv.innerHTML = vets.map(vet => `
        <div class="vet-card">
            <div class="vet-header">
                <div class="vet-title">
                    <h4>${vet.name}</h4>
                    <div class="vet-rating">
                        <i class="fas fa-star"></i>
                        <span>${vet.rating} (${vet.reviewCount} reviews)</span>
                    </div>
                </div>
                <div class="vet-status">
                    ${vet.isEmergency ? '<span class="status-pill emergency">24/7</span>' : ''}
                    <span class="status-pill ${vet.isOpen ? 'open' : 'closed'}">
                        ${vet.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                </div>
            </div>
            <div class="vet-details">
                <p><i class="fas fa-map-marker-alt"></i> ${vet.address} <span style="opacity: 0.6;">(${vet.distance})</span></p>
                <p><i class="fas fa-phone"></i> ${vet.phone}</p>
                <p><i class="fas fa-clock"></i> ${vet.hours}</p>
            </div>
            <div class="vet-actions">
                <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vet.address)}', '_blank')">
                    <i class="fas fa-directions"></i> Get Directions
                </button>
                <button onclick="window.location.href='tel:${vet.phone.replace(/[^0-9]/g, '')}'">
                    <i class="fas fa-phone"></i> Call Now
                </button>
                <button onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(vet.name + ' ' + vet.address)}', '_blank')">
                    <i class="fas fa-info-circle"></i> More Info
                </button>
            </div>
        </div>
    `).join('');
}

// Load reminders
async function loadReminders() {
    try {
        const response = await fetch('/reminders?completed=false', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const reminders = await response.json();
            displayReminders(reminders);
        }
    } catch (error) {
        console.error('Error loading reminders:', error);
    }
}

// Display reminders
function displayReminders(reminders) {
    const remindersList = document.getElementById('reminders');
    
    if (!reminders || reminders.length === 0) {
        remindersList.innerHTML = '<p class="no-data">No upcoming reminders</p>';
        return;
    }
    
    // Sort by date and get next 5
    const sortedReminders = reminders
        .sort((a, b) => new Date(a.reminder_date) - new Date(b.reminder_date))
        .slice(0, 5);
    
    remindersList.innerHTML = sortedReminders.map(reminder => {
        const date = new Date(reminder.reminder_date);
        const now = new Date();
        const isOverdue = date < now;
        const isToday = date.toDateString() === now.toDateString();
        
        return `
            <div class="reminder-item ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''}">
                <div class="reminder-icon">
                    ${getReminderIcon(reminder.reminder_type)}
                </div>
                <div class="reminder-content">
                    <div class="reminder-title">${reminder.title}</div>
                    <div class="reminder-date">${formatReminderDate(date)}</div>
                </div>
                <div class="reminder-actions">
                    <button class="complete-btn" onclick="completeReminder(${reminder.id})" title="Mark as complete">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteReminder(${reminder.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Get reminder icon based on type
function getReminderIcon(type) {
    const iconMap = {
        'medication': '<i class="fas fa-pills"></i>',
        'appointment': '<i class="fas fa-calendar-check"></i>',
        'vaccination': '<i class="fas fa-syringe"></i>',
        'grooming': '<i class="fas fa-cut"></i>',
        'other': '<i class="fas fa-bell"></i>'
    };
    return iconMap[type] || '<i class="fas fa-bell"></i>';
}

// Format reminder date
function formatReminderDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reminderDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (reminderDay.getTime() === today.getTime()) {
        return `Today at ${timeStr}`;
    } else if (reminderDay.getTime() === tomorrow.getTime()) {
        return `Tomorrow at ${timeStr}`;
    } else if (date < now) {
        return `Overdue - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeStr}`;
    } else {
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeStr}`;
    }
}

// Open add reminder modal
async function openAddReminderModal() {
    const modal = document.getElementById('addReminderModal');
    const petSelect = document.getElementById('reminderPet');
    const messageDiv = document.getElementById('reminderMessage');
    
    // Clear form
    document.getElementById('addReminderForm').reset();
    messageDiv.innerHTML = '';
    messageDiv.style.display = 'none';
    
    // Load pets for dropdown
    try {
        const response = await fetch('/pets', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const pets = await response.json();
            petSelect.innerHTML = '<option value="">Select a pet (or leave blank for general reminder)</option>' +
                pets.map(pet => `<option value="${pet.id}">${pet.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reminderDate').setAttribute('min', today);
    
    modal.classList.remove('hidden');
}

// Handle add reminder form submission
async function handleAddReminder(e) {
    e.preventDefault();
    
    const petId = document.getElementById('reminderPet').value;
    const title = document.getElementById('reminderTitle').value;
    const type = document.getElementById('reminderType').value;
    const date = document.getElementById('reminderDate').value;
    const time = document.getElementById('reminderTime').value;
    const description = document.getElementById('reminderDescription').value;
    const messageDiv = document.getElementById('reminderMessage');
    
    if (!title || !type || !date || !time) {
        messageDiv.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Please fill in all required fields</div>';
        messageDiv.style.display = 'block';
        return;
    }
    
    try {
        const reminderData = {
            title: title,
            reminder_type: type,
            reminder_date: `${date}T${time}:00`,
            is_completed: false
        };
        
        if (petId) reminderData.pet_id = parseInt(petId);
        if (description) reminderData.description = description;
        
        const response = await fetch('/reminders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reminderData)
        });
        
        if (response.ok) {
            messageDiv.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i> Reminder added successfully!</div>';
            messageDiv.style.display = 'block';
            
            // Reload reminders
            await loadReminders();
            
            // Close modal after 2 seconds
            setTimeout(() => {
                document.getElementById('addReminderModal').classList.add('hidden');
                messageDiv.innerHTML = '';
                messageDiv.style.display = 'none';
            }, 2000);
        } else {
            const error = await response.json();
            messageDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${error.detail}</div>`;
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error adding reminder:', error);
        messageDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${error.message}</div>`;
        messageDiv.style.display = 'block';
    }
}

// Complete a reminder
async function completeReminder(id) {
    try {
        const response = await fetch(`/reminders/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_completed: true })
        });
        
        if (response.ok) {
            await loadReminders();
        }
    } catch (error) {
        console.error('Error completing reminder:', error);
    }
}

// Delete a reminder
async function deleteReminder(id) {
    if (!confirm('Are you sure you want to delete this reminder?')) {
        return;
    }
    
    try {
        const response = await fetch(`/reminders/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            await loadReminders();
        }
    } catch (error) {
        console.error('Error deleting reminder:', error);
    }
}

// Setup navbar functionality
function setupNavbar() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

// Show appointments view
async function showAppointmentsView() {
    try {
        // Fetch reminders filtered by appointment types
        const response = await fetch('/reminders?completed=false', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const allReminders = await response.json();
            const appointments = allReminders.filter(r => 
                r.reminder_type === 'appointment' || 
                r.reminder_type === 'vaccination' || 
                r.reminder_type === 'grooming'
            );
            
            // Get pets for name lookup
            const petsRes = await fetch('/pets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pets = petsRes.ok ? await petsRes.json() : [];
            const petMap = {};
            pets.forEach(pet => petMap[pet.id] = pet.name);
            
            // Create appointments display
            const appointmentsHtml = appointments.length > 0 ? appointments.map(apt => {
                const date = new Date(apt.reminder_date);
                const petInfo = apt.pet_id ? ` - ${petMap[apt.pet_id]}` : '';
                return `
                    <div class="appointment-card">
                        <div class="appointment-icon">${getReminderIcon(apt.reminder_type)}</div>
                        <div class="appointment-details">
                            <h4>${apt.title}${petInfo}</h4>
                            <p><i class="fas fa-calendar"></i> ${date.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</p>
                            <p><i class="fas fa-clock"></i> ${date.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit', 
                                hour12: true 
                            })}</p>
                            ${apt.description ? `<p class="apt-description">${apt.description}</p>` : ''}
                        </div>
                        <div class="appointment-actions">
                            <button onclick="completeReminder(${apt.id})" class="btn-complete">
                                <i class="fas fa-check"></i> Complete
                            </button>
                        </div>
                    </div>
                `;
            }).join('') : '<p class="no-data">No upcoming appointments</p>';
            
            // Show in a custom alert/modal
            const modalHtml = `
                <div class="appointments-overlay" onclick="this.remove()">
                    <div class="appointments-modal" onclick="event.stopPropagation()">
                        <div class="appointments-header">
                            <h3><i class="fas fa-calendar-check"></i> Upcoming Appointments</h3>
                            <button class="close-btn" onclick="this.closest('.appointments-overlay').remove()">&times;</button>
                        </div>
                        <div class="appointments-body">
                            ${appointmentsHtml}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        alert('Error loading appointments');
    }
}

// Show notifications
function showNotifications() {
    // For now, show reminders that are due today or overdue
    loadReminders().then(() => {
        alert('Check the Reminders section for your notifications!');
    });
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
}
