class AuthService {
    static async login(username, password) {
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    static async register(username, password) {
        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            return response.ok;
        } catch (error) {
            console.error('Register error:', error);
            return false;
        }
    }
}

// Event handlers
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (await AuthService.login(username, password)) {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('notes-section').classList.remove('hidden');
        loadNotes();
    }
}

async function handleRegister() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (await AuthService.register(username, password)) {
        alert('Registration successful! Please login.');
    }
}