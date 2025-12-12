// Reports JavaScript

// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

let allPets = [];
let allActivities = [];
let allMedications = [];
let activityTypeChart = null;
let activityTrendChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await setUserAvatar();
    await loadPets();
    await loadData();
    setupEventListeners();
});

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
            document.getElementById('navUsername').textContent = user.username;
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
        
        if (response.ok) {
            allPets = await response.json();
            populatePetFilter();
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

// Populate pet filter dropdown
function populatePetFilter() {
    const petFilter = document.getElementById('petFilter');
    const options = '<option value="all">All Pets</option>' + 
        allPets.map(pet => `<option value="${pet.id}">${pet.name}</option>`).join('');
    petFilter.innerHTML = options;
}

// Load all data
async function loadData() {
    try {
        // Load activities
        const activitiesResponse = await fetch('/activities?limit=1000', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (activitiesResponse.ok) {
            allActivities = await activitiesResponse.json();
        }
        
        // Load medications
        const medicationsResponse = await fetch('/medications?active_only=true&limit=1000', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (medicationsResponse.ok) {
            allMedications = await medicationsResponse.json();
        }
        
        // Update all displays
        updateSummaryCards();
        updateCharts();
        generateHealthInsights();
        populateTables();
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Update summary cards
function updateSummaryCards() {
    const selectedPet = document.getElementById('petFilter').value;
    
    let activities = allActivities;
    let medications = allMedications;
    
    if (selectedPet !== 'all') {
        const petId = parseInt(selectedPet);
        activities = allActivities.filter(a => a.pet_id === petId);
        medications = allMedications.filter(m => m.pet_id === petId);
    }
    
    // Total activities
    document.getElementById('totalActivities').textContent = activities.length;
    
    // Active medications
    document.getElementById('activeMedications').textContent = medications.length;
    
    // Calculate health score (simple algorithm based on activity frequency)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentActivities = activities.filter(a => new Date(a.activity_date) >= lastWeek);
    const healthScore = Math.min(100, Math.round((recentActivities.length / 7) * 20 + 50));
    document.getElementById('healthScore').textContent = healthScore;
    
    // This week activities
    document.getElementById('thisWeekActivities').textContent = recentActivities.length;
}

// Update charts
function updateCharts() {
    const selectedPet = document.getElementById('petFilter').value;
    
    let activities = allActivities;
    if (selectedPet !== 'all') {
        const petId = parseInt(selectedPet);
        activities = allActivities.filter(a => a.pet_id === petId);
    }
    
    updateActivityTypeChart(activities);
    updateActivityTrendChart(activities);
}

// Update activity type chart (pie/doughnut)
function updateActivityTypeChart(activities) {
    const ctx = document.getElementById('activityTypeChart');
    
    // Count activities by type
    const typeCounts = {};
    activities.forEach(activity => {
        typeCounts[activity.activity_type] = (typeCounts[activity.activity_type] || 0) + 1;
    });
    
    const labels = Object.keys(typeCounts).map(type => 
        type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
    );
    const data = Object.values(typeCounts);
    
    const colors = [
        'rgba(126, 150, 128, 0.8)',
        'rgba(216, 127, 129, 0.8)',
        'rgba(174, 99, 120, 0.8)',
        'rgba(243, 156, 18, 0.8)',
        'rgba(52, 152, 219, 0.8)',
        'rgba(155, 89, 182, 0.8)',
        'rgba(26, 188, 156, 0.8)',
        'rgba(121, 97, 111, 0.8)'
    ];
    
    if (activityTypeChart) {
        activityTypeChart.destroy();
    }
    
    activityTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#F4D4B8'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Fredoka',
                            size: 12,
                            weight: '600'
                        },
                        color: '#79616F',
                        padding: 15
                    }
                }
            }
        }
    });
}

// Update activity trend chart (line)
function updateActivityTrendChart(activities) {
    const ctx = document.getElementById('activityTrendChart');
    
    // Get last 30 days
    const last30Days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last30Days.push(date.toISOString().split('T')[0]);
    }
    
    // Count activities per day
    const dailyCounts = {};
    last30Days.forEach(date => dailyCounts[date] = 0);
    
    activities.forEach(activity => {
        const activityDate = new Date(activity.activity_date).toISOString().split('T')[0];
        if (dailyCounts.hasOwnProperty(activityDate)) {
            dailyCounts[activityDate]++;
        }
    });
    
    const labels = last30Days.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const data = last30Days.map(date => dailyCounts[date]);
    
    if (activityTrendChart) {
        activityTrendChart.destroy();
    }
    
    activityTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Activities',
                data: data,
                borderColor: 'rgba(126, 150, 128, 1)',
                backgroundColor: 'rgba(126, 150, 128, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(126, 150, 128, 1)',
                pointBorderColor: '#F4D4B8',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
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
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: 'Fredoka',
                            weight: '600'
                        },
                        color: '#79616F'
                    },
                    grid: {
                        color: 'rgba(121, 97, 111, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Fredoka',
                            weight: '600'
                        },
                        color: '#79616F',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Generate health insights
function generateHealthInsights() {
    const selectedPet = document.getElementById('petFilter').value;
    const insightsContainer = document.getElementById('healthInsights');
    
    let activities = allActivities;
    let medications = allMedications;
    let pets = allPets;
    
    if (selectedPet !== 'all') {
        const petId = parseInt(selectedPet);
        activities = allActivities.filter(a => a.pet_id === petId);
        medications = allMedications.filter(m => m.pet_id === petId);
        pets = allPets.filter(p => p.id === petId);
    }
    
    const insights = [];
    
    // Activity insights
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentActivities = activities.filter(a => new Date(a.activity_date) >= lastWeek);
    
    if (recentActivities.length >= 5) {
        insights.push({
            type: 'success',
            icon: 'fa-check-circle',
            title: 'Great Activity Level!',
            message: `${recentActivities.length} activities logged this week. Your pet${pets.length > 1 ? 's are' : ' is'} staying active and healthy!`
        });
    } else if (recentActivities.length === 0) {
        insights.push({
            type: 'warning',
            icon: 'fa-exclamation-triangle',
            title: 'Low Activity Alert',
            message: 'No activities logged this week. Regular exercise and engagement are important for your pet\'s health.'
        });
    }
    
    // Medication insights
    if (medications.length > 0) {
        const endingSoon = medications.filter(m => {
            if (!m.end_date) return false;
            const endDate = new Date(m.end_date);
            const daysUntilEnd = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
            return daysUntilEnd <= 7 && daysUntilEnd > 0;
        });
        
        if (endingSoon.length > 0) {
            insights.push({
                type: 'warning',
                icon: 'fa-pills',
                title: 'Medication Ending Soon',
                message: `${endingSoon.length} medication${endingSoon.length > 1 ? 's' : ''} will end within the next week. Consider scheduling a vet follow-up.`
            });
        }
    }
    
    // Age-based insights
    pets.forEach(pet => {
        if (pet.age && pet.age >= 7 && pet.species === 'dog') {
            insights.push({
                type: 'info',
                icon: 'fa-heartbeat',
                title: `Senior Pet Care - ${pet.name}`,
                message: `${pet.name} is ${pet.age} years old. Senior dogs benefit from regular vet checkups every 6 months and joint-supporting activities.`
            });
        }
    });
    
    // Weight monitoring insight
    const walkActivities = activities.filter(a => a.activity_type === 'walk');
    if (walkActivities.length > 0) {
        const avgDistance = walkActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / walkActivities.length;
        if (avgDistance > 0) {
            insights.push({
                type: 'success',
                icon: 'fa-walking',
                title: 'Regular Exercise',
                message: `Average walk distance: ${avgDistance.toFixed(1)} miles. Consistent exercise helps maintain a healthy weight!`
            });
        }
    }
    
    // Default insight if none generated
    if (insights.length === 0) {
        insights.push({
            type: 'info',
            icon: 'fa-info-circle',
            title: 'Start Tracking',
            message: 'Log activities and medications to receive personalized health insights and recommendations.'
        });
    }
    
    insightsContainer.innerHTML = insights.map(insight => `
        <div class="insight-card ${insight.type}">
            <div class="insight-icon">
                <i class="fas ${insight.icon}"></i>
            </div>
            <div class="insight-content">
                <h4>${insight.title}</h4>
                <p>${insight.message}</p>
            </div>
        </div>
    `).join('');
}

// Populate tables
function populateTables() {
    const selectedPet = document.getElementById('petFilter').value;
    
    let activities = allActivities;
    let medications = allMedications;
    
    if (selectedPet !== 'all') {
        const petId = parseInt(selectedPet);
        activities = allActivities.filter(a => a.pet_id === petId);
        medications = allMedications.filter(m => m.pet_id === petId);
    }
    
    populateActivitiesTable(activities.slice(0, 10)); // Show last 10
    populateMedicationsTable(medications);
}

// Populate activities table
function populateActivitiesTable(activities) {
    const tbody = document.querySelector('#activitiesTable tbody');
    
    if (activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><br>No activities found</td></tr>';
        return;
    }
    
    tbody.innerHTML = activities.map(activity => {
        const pet = allPets.find(p => p.id === activity.pet_id);
        const date = new Date(activity.activity_date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        const duration = activity.duration ? `${activity.duration} min` : '-';
        
        return `
            <tr>
                <td><strong>${pet?.name || 'Unknown'}</strong></td>
                <td><span class="activity-badge ${activity.activity_type}">${activity.activity_type.replace('_', ' ')}</span></td>
                <td>${activity.title}</td>
                <td>${duration}</td>
                <td>${formattedDate}</td>
            </tr>
        `;
    }).join('');
}

// Populate medications table
function populateMedicationsTable(medications) {
    const tbody = document.querySelector('#medicationsTable tbody');
    
    if (medications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><br>No active medications</td></tr>';
        return;
    }
    
    tbody.innerHTML = medications.map(medication => {
        const pet = allPets.find(p => p.id === medication.pet_id);
        const startDate = new Date(medication.start_date);
        const formattedDate = `${startDate.getMonth() + 1}/${startDate.getDate()}/${startDate.getFullYear()}`;
        
        return `
            <tr>
                <td><strong>${pet?.name || 'Unknown'}</strong></td>
                <td>${medication.name}</td>
                <td>${medication.dosage}</td>
                <td>${medication.frequency}</td>
                <td>${formattedDate}</td>
            </tr>
        `;
    }).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Pet filter change
    document.getElementById('petFilter').addEventListener('change', () => {
        updateSummaryCards();
        updateCharts();
        generateHealthInsights();
        populateTables();
    });
    
    // Export report button
    document.getElementById('exportReportBtn').addEventListener('click', exportReport);
    
    // Setup navbar
    setupNavbar();
}

// Setup navbar
function setupNavbar() {
    // User menu button
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
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '/login';
        });
    }
}

// Export report to PDF (using browser print)
function exportReport() {
    const selectedPet = document.getElementById('petFilter').value;
    const petName = selectedPet === 'all' ? 'All Pets' : allPets.find(p => p.id === parseInt(selectedPet))?.name || 'Unknown';
    
    // Store original title
    const originalTitle = document.title;
    document.title = `PetWell Health Report - ${petName}`;
    
    // Print
    window.print();
    
    // Restore title
    setTimeout(() => {
        document.title = originalTitle;
    }, 100);
}
