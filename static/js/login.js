function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// Login form handler
document.getElementById('loginFormElement').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('loginMessage');
    messageDiv.textContent = '';
    messageDiv.className = 'message';
    
    const formData = new URLSearchParams();
    formData.append('username', document.getElementById('loginUsername').value);
    formData.append('password', document.getElementById('loginPassword').value);
    
    try {
        const response = await fetch('/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            messageDiv.textContent = 'Login successful! Redirecting...';
            messageDiv.className = 'message success';
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            const data = await response.json();
            messageDiv.textContent = data.detail || 'Login failed';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.textContent = 'Network error. Please try again.';
        messageDiv.className = 'message error';
    }
});

// Register form handler
document.getElementById('registerFormElement').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('registerMessage');
    messageDiv.textContent = '';
    messageDiv.className = 'message';
    
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        messageDiv.textContent = 'Passwords do not match';
        messageDiv.className = 'message error';
        return;
    }
    
    const formData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        username: document.getElementById('registerUsername').value,
        password: password
    };
    
    try {
        const response = await fetch('/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            messageDiv.textContent = 'Registration successful! Switching to login...';
            messageDiv.className = 'message success';
            
            // Clear form
            document.getElementById('registerFormElement').reset();
            
            // Switch to login after 2 seconds
            setTimeout(() => {
                showLogin();
                // Pre-fill username in login form
                document.getElementById('loginUsername').value = formData.username;
            }, 2000);
        } else {
            const data = await response.json();
            messageDiv.textContent = data.error || 'Registration failed';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.textContent = 'Network error. Please try again.';
        messageDiv.className = 'message error';
    }
});
