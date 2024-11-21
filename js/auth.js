const auth = {
    isAuthenticated() {
        return localStorage.getItem('user') !== null;
    },

    getUser() {
        return JSON.parse(localStorage.getItem('user'));
    },

    setUser(userData) {
        localStorage.setItem('user', JSON.stringify({
            ...userData,
            loginTime: new Date().getTime()
        }));
    },

    logout() {
        // Limpiar toda la información de sesión
        localStorage.removeItem('user');
        
        // Limpiar cualquier otro dato de sesión si existe
        sessionStorage.clear();
        
        // Redirigir al login
        window.location.href = 'login.html';
    },

    checkAuth() {
        // Si estamos en index.html y no hay sesión, redirigir a login
        if (window.location.pathname.endsWith('index.html') && !this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    init() {
        const path = window.location.pathname;
        
        // Si está autenticado y trata de acceder a login o register, redirigir a index
        if ((path.endsWith('login.html') || path.endsWith('register.html')) && this.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }
        
        // Si trata de acceder a index sin autenticación, redirigir a login
        if (path.endsWith('index.html') && !this.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
    }
};

// Hacer disponible la función logout globalmente
window.logout = function() {
    auth.logout();
};

// Inicializar auth al cargar
document.addEventListener('DOMContentLoaded', () => {
    auth.init();
});