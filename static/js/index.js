        let token = localStorage.getItem('token');
        let currentUser = null;

        // Check if user is logged in on page load
        window.onload = function() {
            if (token) {
                fetchCurrentUser();
            } else {
                showAuthSection();
            }
        };

        // Show/Hide Sections
        function showAuthSection() {
            window.location.href = '/login';
        }

        function showPetSection() {
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('petSection').classList.remove('hidden');
        }

        // Register Form
        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const firstName = document.getElementById('regFirstName').value;
            const lastName = document.getElementById('regLastName').value;
            const email = document.getElementById('regEmail').value;
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            if (password !== confirmPassword) {
                showMessage('registerMessage', 'Passwords do not match', 'error');
                return;
            }

            try {
                const response = await fetch('/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ first_name: firstName, last_name: lastName, email, username, password })
                });

                if (response.ok) {
                    showMessage('registerMessage', 'Registration successful! Please login.', 'success');
                    document.getElementById('registerForm').reset();
                } else {
                    const data = await response.json();
                    showMessage('registerMessage', data.error || 'Registration failed', 'error');
                }
            } catch (error) {
                showMessage('registerMessage', 'Network error', 'error');
            }
        });

        // Login Form
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    token = data.access_token;
                    localStorage.setItem('token', token);
                    showMessage('loginMessage', 'Login successful!', 'success');
                    setTimeout(() => {
                        fetchCurrentUser();
                    }, 500);
                } else {
                    showMessage('loginMessage', 'Invalid credentials', 'error');
                }
            } catch (error) {
                showMessage('loginMessage', 'Network error', 'error');
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('token');
            token = null;
            currentUser = null;
            showAuthSection();
            showMessage('loginMessage', 'Logged out successfully', 'success');
        });

        // Fetch Current User
        async function fetchCurrentUser() {
            try {
                const response = await fetch('/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    currentUser = await response.json();
                    document.getElementById('userName').textContent = currentUser.first_name || currentUser.username;
                    showPetSection();
                    fetchPets();
                } else {
                    localStorage.removeItem('token');
                    showAuthSection();
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                showAuthSection();
            }
        }

        // Add Pet
        document.getElementById('addPetForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const petData = {
                name: document.getElementById('petName').value,
                species: document.getElementById('petSpecies').value,
                breed: document.getElementById('petBreed').value || null,
                age: document.getElementById('petAge').value ? parseInt(document.getElementById('petAge').value) : null,
                weight: document.getElementById('petWeight').value ? parseFloat(document.getElementById('petWeight').value) : null,
                medical_notes: document.getElementById('petMedicalNotes').value || null
            };

            try {
                const response = await fetch('/pets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(petData)
                });

                if (response.ok) {
                    showMessage('addPetMessage', '✅ Pet added successfully with AI care tips!', 'success');
                    document.getElementById('addPetForm').reset();
                    fetchPets();
                } else {
                    const data = await response.json();
                    showMessage('addPetMessage', data.error || 'Failed to add pet', 'error');
                }
            } catch (error) {
                showMessage('addPetMessage', 'Network error', 'error');
            }
        });

        // Fetch Pets
        async function fetchPets() {
            try {
                const response = await fetch('/pets', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const pets = await response.json();
                    displayPets(pets);
                } else {
                    console.error('Failed to fetch pets');
                }
            } catch (error) {
                console.error('Error fetching pets:', error);
            }
        }

        // Format AI tips as individual cards
        function formatTipsAsCards(tipsText) {
            if (!tipsText || tipsText === 'AI care tips unavailable') {
                return '<div class="tip-card"><div class="tip-number">!</div><div class="tip-text">AI care tips unavailable</div></div>';
            }
            
            // Split by common patterns: numbered lists, bullet points, or newlines
            const tips = tipsText
                .split(/\n+/)
                .map(tip => tip.trim())
                .filter(tip => tip.length > 0)
                .map(tip => tip.replace(/^[\d\.\-\*\•]+\s*/, '')) // Remove leading numbers, bullets, etc.
                .filter(tip => tip.length > 0);
            
            if (tips.length === 0) {
                return '<div class="tip-card"><div class="tip-number">!</div><div class="tip-text">No tips available</div></div>';
            }
            
            return tips.map((tip, index) => `
                <div class="tip-card">
                    <div class="tip-number">${index + 1}</div>
                    <div class="tip-text">${tip}</div>
                </div>
            `).join('');
        }

        // Display Pets
        function displayPets(pets) {
            const petList = document.getElementById('petList');
            
            if (pets.length === 0) {
                petList.innerHTML = '<p style="text-align: center; color: var(--light-text); font-size: 1.2rem; padding: 40px;">No pets added yet. Add your first furry friend! 🐾</p>';
                return;
            }

            petList.innerHTML = pets.map(pet => `
                <div class="pet-card">
                    <div class="pet-header">
                        <div>
                            <div class="pet-name">${pet.name}</div>
                            <span class="pet-species">${getSpeciesEmoji(pet.species)} ${pet.species}</span>
                        </div>
                    </div>
                    <div class="pet-details">
                        ${pet.breed ? `<p><strong>Breed:</strong> ${pet.breed}</p>` : ''}
                        ${pet.age ? `<p><strong>Age:</strong> ${pet.age} years old</p>` : ''}
                        ${pet.weight ? `<p><strong>Weight:</strong> ${pet.weight} lbs</p>` : ''}
                        ${pet.medical_notes ? `<p><strong>Medical Notes:</strong> ${pet.medical_notes}</p>` : ''}
                    </div>
                    ${pet.ai_care_tips ? `
                        <div class="ai-tips">
                            <h4>🤖 AI Care Tips</h4>
                            <div class="tips-grid">
                                ${formatTipsAsCards(pet.ai_care_tips)}
                            </div>
                        </div>
                    ` : ''}
                    <div class="pet-actions">
                        <button class="btn-success" onclick="regenerateTips(${pet.id})">🔄 Refresh AI Tips</button>
                        <button class="btn-danger" onclick="deletePet(${pet.id})">🗑️ Delete</button>
                    </div>
                </div>
            `).join('');
        }

        // Get Species Emoji
        function getSpeciesEmoji(species) {
            const emojis = {
                'dog': '🐕', 'cat': '🐈', 'bird': '🐦', 'fish': '🐠',
                'rabbit': '🐰', 'hamster': '🐹', 'guinea pig': '🐹',
                'reptile': '🦎', 'other': '🐾'
            };
            return emojis[species.toLowerCase()] || '🐾';
        }

        // Regenerate AI Tips
        async function regenerateTips(petId) {
            try {
                const response = await fetch(`/pets/${petId}/regenerate-tips`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    fetchPets();
                } else {
                    alert('Failed to regenerate tips');
                }
            } catch (error) {
                alert('Network error');
            }
        }

        // Delete Pet
        async function deletePet(petId) {
            if (!confirm('Are you sure you want to delete this pet?')) return;

            try {
                const response = await fetch(`/pets/${petId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    fetchPets();
                } else {
                    alert('Failed to delete pet');
                }
            } catch (error) {
                alert('Network error');
            }
        }

        // Show Message
        function showMessage(elementId, message, type) {
            const messageDiv = document.getElementById(elementId);
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = message;
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = '';
            }, 5000);
        }
