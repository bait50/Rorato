// Configuración de Parsley en español
Parsley.setLocale('es');

// Función para mostrar alertas
function showAlert(message, type = 'success') {
    const alertsContainer = document.getElementById('alertsContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertsContainer.appendChild(alert);

    // Auto-cerrar la alerta después de 5 segundos
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Manejo del formulario de login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Deshabilitar el botón durante el envío
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    
    // Validar el formulario con Parsley
    if ($(this).parsley().isValid()) {
        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Verificar credenciales
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const user = registeredUsers.find(u => u.email === email && u.password === password);

            if (user) {
                // Guardar sesión actual
                auth.setUser({
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage
                });

                showAlert('¡Inicio de sesión exitoso! Redirigiendo...');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showAlert('Credenciales inválidas. Por favor verifica tus datos.', 'danger');
            }
        } catch (error) {
            showAlert('Error al iniciar sesión. Por favor intenta nuevamente.', 'danger');
        } finally {
            submitButton.disabled = false;
        }
    }
});

