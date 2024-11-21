document.addEventListener('DOMContentLoaded', function() {
    // Configuración de Parsley en español
    Parsley.setLocale('es');

    function showAlert(message, type = 'success') {
        const alertsContainer = document.getElementById('alertsContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertsContainer.appendChild(alert);

        setTimeout(() => alert.remove(), 5000);
    }

    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            if ($(this).parsley().isValid()) {
                const username = document.getElementById('username').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const profilePicture = document.getElementById('profilePicture').files[0];

                // Guardar credenciales
                const userData = {
                    username: username,
                    email: email,
                    password: password, // En producción, esto debería estar hasheado
                    profileImage: profilePicture ? URL.createObjectURL(profilePicture) : 'img/user-default.png'
                };

                // Guardar en localStorage para usuarios registrados
                const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                registeredUsers.push(userData);
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

                showAlert('¡Registro exitoso! Redirigiendo al inicio de sesión...');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            showAlert('Error al registrar usuario. Por favor intenta nuevamente.', 'danger');
        } finally {
            submitButton.disabled = false;
        }
    });
});
