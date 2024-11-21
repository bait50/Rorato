// Gestión de sesión y usuario
class UserSession {
    static isLoggedIn() {
        return localStorage.getItem('user') !== null;
    }

    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    }

    static setCurrentUser(userData) {
        // Asegurar que el usuario tenga todas las propiedades necesarias
        const user = {
            id: Date.now(),
            username: userData.username,
            email: userData.email,
            profileImage: userData.profileImage || 'img/user-default.png',
            stats: {
                reviewsCount: 0,
                favoritesCount: 0,
                commentsCount: 0
            },
            ...userData
        };

        localStorage.setItem('user', JSON.stringify(user));
        this.updateUIWithUserData(user);
        this.updateUserStats(user.email);
    }

    static updateUIWithUserData(userData) {
        const usernameDisplay = document.getElementById('usernameDisplay');
        const profileImage = document.querySelector('.rounded-circle');
        
        if (usernameDisplay) {
            usernameDisplay.textContent = userData.username;
        }
        
        if (profileImage) {
            profileImage.src = userData.profileImage || 'img/user-default.png';
        }

        // Actualizar estadísticas si estamos en la página de perfil
        this.updateUserStats(userData.email);
    }

    static updateUserStats(userEmail) {
        // Obtener todas las reseñas
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        // Obtener favoritos del usuario
        const favorites = JSON.parse(localStorage.getItem(`favorites_${userEmail}`) || '[]');
        
        // Calcular estadísticas
        const stats = {
            reviewsCount: reviews.filter(r => r.author === userEmail).length,
            favoritesCount: favorites.length,
            commentsCount: reviews.reduce((total, review) => 
                total + (review.comments?.filter(c => c.author === userEmail).length || 0), 0)
        };

        // Guardar estadísticas en el usuario
        const user = this.getCurrentUser();
        if (user) {
            user.stats = stats;
            localStorage.setItem('user', JSON.stringify(user));
        }

        // Actualizar UI si estamos en la página de perfil
        const elements = {
            reviewsCount: document.getElementById('reviewsCount'),
            favoritesCount: document.getElementById('favoritesCount'),
            commentsCount: document.getElementById('commentsCount')
        };

        Object.entries(stats).forEach(([key, value]) => {
            if (elements[key]) {
                elements[key].textContent = value;
            }
        });

        return stats;
    }

    static logout() {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    static addFavorite(reviewId) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const favorites = JSON.parse(localStorage.getItem(`favorites_${user.email}`) || '[]');
        if (!favorites.includes(reviewId)) {
            favorites.push(reviewId);
            localStorage.setItem(`favorites_${user.email}`, JSON.stringify(favorites));
            this.updateUserStats(user.email);
            return true;
        }
        return false;
    }

    static removeFavorite(reviewId) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const favorites = JSON.parse(localStorage.getItem(`favorites_${user.email}`) || '[]');
        const index = favorites.indexOf(reviewId);
        if (index > -1) {
            favorites.splice(index, 1);
            localStorage.setItem(`favorites_${user.email}`, JSON.stringify(favorites));
            this.updateUserStats(user.email);
            return true;
        }
        return false;
    }

    static isFavorite(reviewId) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const favorites = JSON.parse(localStorage.getItem(`favorites_${user.email}`) || '[]');
        return favorites.includes(reviewId);
    }

    static getUserStats(username) {
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        const user = this.getCurrentUser();
        if (!user) return null;

        const userReviews = reviews.filter(r => r.author === username);
        
        return {
            reviewsCount: userReviews.length,
            favoritesCount: userReviews.reduce((total, review) => total + (review.likes?.length || 0), 0),
            commentsCount: reviews.reduce((total, review) => 
                total + (review.comments?.filter(c => c.author === username).length || 0), 0),
            reviews: userReviews
        };
    }

    static updateUserProfile(userData) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const updatedUser = {...user, ...userData};
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
    }
}

// Carga dinámica de páginas
async function loadPage(pageName) {
    const mainContent = document.querySelector('main');
    
    try {
        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) throw new Error('Page not found');
        
        const content = await response.text();
        mainContent.innerHTML = content;
        mainContent.classList.add('fade-in');
        
        // Actualizar URL sin recargar la página
        history.pushState({page: pageName}, '', `#${pageName}`);
        
        // Inicializar componentes específicos de la página
        initializePageComponents(pageName);
    } catch (error) {
        console.error('Error loading page:', error);
        mainContent.innerHTML = '<div class="alert alert-danger">Error al cargar la página</div>';
    }
}

// Inicialización de componentes específicos por página
function initializePageComponents(pageName) {
    switch(pageName) {
        case 'nueva-resena':
            initReviewForm();
            break;
        case 'perfil':
            loadUserProfile();
            break;
        case 'inicio':
            loadReviews();
            break;
        
    }
}

// Gestión del formulario de reseñas
function initReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    if (!reviewForm) return;

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(reviewForm);
        const reviewData = {
            gameTitle: formData.get('gameTitle'),
            releaseYear: formData.get('releaseYear'),
            gameImage: formData.get('gameImage'),
            description: formData.get('description'),
            genre: formData.get('genre'),
            review: formData.get('review'),
            rating: formData.get('rating'),
            author: UserSession.getCurrentUser().username,
            date: new Date().toISOString()
        };

        // Aquí iría la lógica para guardar la reseña
        await saveReview(reviewData);
        loadPage('comunidad');
    });
}

// Después (manejo correcto de imágenes)
async function saveReview(reviewData) {
    try {
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        
        // Manejar la imagen si existe
        if (reviewData.gameImage instanceof File) {
            const base64Image = await convertToBase64(reviewData.gameImage);
            reviewData.gameImage = base64Image;
        }
        
        reviews.unshift({
            id: Date.now(),
            ...reviewData,
            likes: 0,
            comments: []
        });
        
        localStorage.setItem('reviews', JSON.stringify(reviews));
        showAlert('¡Reseña publicada exitosamente!', 'success');
        loadPage('inicio'); // Redirigir al inicio después de guardar
        return true;
    } catch (error) {
        console.error('Error al guardar la reseña:', error);
        showAlert('Error al publicar la reseña', 'danger');
        return false;
    }
}

// Cargar datos del perfil del usuario
function loadUserProfile() {
    const user = UserSession.getCurrentUser();
    if (!user) return;

    // Actualizar datos básicos
    document.getElementById('profileImage').src = user.profileImage || 'img/user-default.png';
    document.getElementById('displayUsername').textContent = user.username;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileUsername').value = user.username;

    // Obtener y mostrar estadísticas
    const stats = UserSession.getUserStats(user.username);
    if (stats) {
        document.getElementById('reviewsCount').textContent = stats.reviewsCount;
        document.getElementById('likesCount').textContent = stats.favoritesCount;
        document.getElementById('commentsCount').textContent = stats.commentsCount;

        // Mostrar reseñas del usuario
        displayReviews(stats.reviews, 'userReviews');
    }

    // Configurar formulario
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.onsubmit = updateProfile;
    }
}

function updateProfile(e) {
    e.preventDefault();
    const user = UserSession.getCurrentUser();
    if (!user) return;

    const newUsername = document.getElementById('profileUsername').value.trim();
    if (newUsername === user.username) return;

    // Actualizar nombre de usuario
    UserSession.updateUserProfile({ username: newUsername });
    
    // Actualizar reseñas con nuevo nombre
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    reviews.forEach(review => {
        if (review.author === user.username) {
            review.author = newUsername;
        }
        if (review.comments) {
            review.comments.forEach(comment => {
                if (comment.author === user.username) {
                    comment.author = newUsername;
                }
            });
        }
    });
    localStorage.setItem('reviews', JSON.stringify(reviews));

    showAlert('Perfil actualizado exitosamente', 'success');
    loadUserProfile();
}

// Función para cambiar la foto de perfil
function editProfilePicture() {
    // Crear un input file oculto
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Convertir la imagen a Base64
            const base64Image = await convertToBase64(file);
            
            // Actualizar la imagen en el localStorage
            const user = auth.getUser();
            user.profileImage = base64Image;
            auth.setUser(user);

            // Actualizar la imagen en la UI
            document.querySelector('.rounded-circle').src = base64Image;
            
            showAlert('Foto de perfil actualizada exitosamente', 'success');
        } catch (error) {
            showAlert('Error al actualizar la foto de perfil', 'danger');
        }
    });

    fileInput.click();
}

// Función auxiliar para convertir imagen a Base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Función para mostrar alertas
function showAlert(message, type) {
    const alertsContainer = document.createElement('div');
    alertsContainer.className = `alert alert-${type} alert-dismissible fade show`;
    alertsContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.container').insertAdjacentElement('afterbegin', alertsContainer);
    
    setTimeout(() => alertsContainer.remove(), 3000);
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación antes de cualquier otra operación
    if (!auth.checkAuth()) return;

    // Solo continuar si el usuario está autenticado
    const user = auth.getUser();
    if (user) {
        document.getElementById('usernameDisplay').textContent = user.username;
        const userImage = document.querySelector('#userMenu img');
        if (userImage) {
            userImage.src = user.profileImage || 'img/user-default.png';
        }

        // Agregar event listener para el botón de logout
        const logoutButton = document.querySelector('[onclick="logout()"]');
        if (logoutButton) {
            logoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                auth.logout();
            });
        }
    }

   
});

// Manejar navegación del navegador
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        loadPage(event.state.page);
    }
});

// Cargar reseñas al iniciar
function loadReviews() {
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const container = document.getElementById('reviewsContainer');
    const template = document.getElementById('reviewTemplate');
    
    container.innerHTML = '';
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p>No hay reseñas disponibles.</p>
            </div>`;
        return;
    }

    reviews.forEach(review => {
        const clone = template.content.cloneNode(true);
        
        // Llenar los datos
        clone.querySelector('.game-title').textContent = review.gameTitle;
        clone.querySelector('.game-image').src = review.gameImage || 'img/game-default.jpg';
        clone.querySelector('.game-description').textContent = review.description;
        clone.querySelector('.author').textContent = review.author;
        clone.querySelector('.date').textContent = new Date(review.date).toLocaleDateString();
        
        // Agregar estrellas según rating
        const rating = clone.querySelector('.rating');
        rating.innerHTML = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        container.appendChild(clone);
    });
}

// Función de búsqueda
function searchReviews() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const genreFilter = document.getElementById('genreFilter').value;
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    
    const filteredReviews = reviews.filter(review => {
        const matchesSearch = review.gameTitle.toLowerCase().includes(searchTerm) ||
                            review.description.toLowerCase().includes(searchTerm) ||
                            review.author.toLowerCase().includes(searchTerm);
        
        const matchesGenre = !genreFilter || review.genre === genreFilter;
        
        return matchesSearch && matchesGenre;
    });
    
    displayReviews(filteredReviews);
}

// Función para mostrar las reseñas
function displayReviews(reviews, container = 'reviewsContainer') {
    const reviewsContainer = document.getElementById(container);
    const template = document.getElementById('reviewTemplate');
    const currentUser = UserSession.getCurrentUser();
    
    if (!reviewsContainer || !template) return;
    
    reviewsContainer.innerHTML = '';
    
    if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML = `
            <div class="col-12 text-center">
                <p>No hay reseñas disponibles.</p>
            </div>`;
        return;
    }

    reviews.forEach(review => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.card');
        
        // Configurar datos básicos
        card.dataset.reviewId = review.id;
        card.querySelector('.game-title').textContent = review.gameTitle;
        card.querySelector('.game-image').src = review.gameImage || 'img/game-default.jpg';
        card.querySelector('.game-description').textContent = review.description;
        card.querySelector('.author').textContent = review.author;
        card.querySelector('.date').textContent = new Date(review.date).toLocaleDateString();
        card.querySelector('.rating').innerHTML = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        // Actualizar contadores
        card.querySelector('.likes-count').textContent = review.likes?.length || 0;
        card.querySelector('.comments-count').textContent = review.comments?.length || 0;

        // Estado del botón de favorito
        const favoriteBtn = card.querySelector('.favorite-btn');
        if (currentUser && review.likes?.includes(currentUser.username)) {
            favoriteBtn.classList.add('active');
        }

        // Configurar comentarios
        const commentsList = card.querySelector('.comments-list');
        if (review.comments?.length > 0) {
            commentsList.innerHTML = review.comments.map(comment => `
                <div class="comment mb-2">
                    <div class="d-flex justify-content-between">
                        <small class="fw-bold">${comment.author}</small>
                        <small class="text-muted">${new Date(comment.date).toLocaleDateString()}</small>
                    </div>
                    <p class="mb-0">${comment.text}</p>
                </div>
            `).join('');
        }

        reviewsContainer.appendChild(card);
    });
}

// Función para ver detalles de una reseña
function verDetalles(btn) {
    const reviewId = btn.closest('.card').dataset.reviewId;
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const review = reviews.find(r => r.id.toString() === reviewId);
    
    if (!review) return;

    // Mostrar modal con detalles
    const modalHtml = `
        <div class="modal fade" id="reviewModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${review.gameTitle}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <img src="${review.gameImage}" class="img-fluid rounded mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
                            <small class="text-muted">Por ${review.author} | ${new Date(review.date).toLocaleDateString()}</small>
                        </div>
                        <p>${review.description}</p>
                        <hr>
                        <h6>Reseña completa:</h6>
                        <p>${review.review}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    modal.show();

    // Limpiar modal después de cerrar
    document.getElementById('reviewModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Función para agregar/quitar favorito
function toggleFavorite(btn) {
    if (!UserSession.isLoggedIn()) {
        showAlert('Debes iniciar sesión para marcar favoritos', 'warning');
        return;
    }

    const reviewId = btn.closest('.card').dataset.reviewId;
    const isFavorite = UserSession.isFavorite(reviewId);
    
    if (isFavorite) {
        UserSession.removeFavorite(reviewId);
        btn.classList.remove('active');
        showAlert('Reseña eliminada de favoritos', 'info');
    } else {
        UserSession.addFavorite(reviewId);
        btn.classList.add('active');
        showAlert('Reseña agregada a favoritos', 'success');
    }
}

// Función para agregar comentario
function addComment(reviewId, commentText) {
    const user = auth.getUser();
    if (!user) {
        showAlert('Debes iniciar sesión para comentar', 'warning');
        return;
    }

    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const reviewIndex = reviews.findIndex(r => r.id.toString() === reviewId);
    
    if (reviewIndex === -1) return;

    if (!reviews[reviewIndex].comments) {
        reviews[reviewIndex].comments = [];
    }

    const newComment = {
        id: Date.now(),
        author: user.username,
        text: commentText,
        date: new Date().toISOString()
    };

    reviews[reviewIndex].comments.push(newComment);
    localStorage.setItem('reviews', JSON.stringify(reviews));
    updateUserStats(user.email);
    loadReviews(); // Recargar para mostrar el nuevo comentario
    showAlert('Comentario agregado', 'success');
}

// Función para actualizar estadísticas del usuario
function updateUserStats(userEmail) {
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const favorites = JSON.parse(localStorage.getItem(`favorites_${userEmail}`) || '[]');
    
    const userReviews = reviews.filter(r => r.author === userEmail);
    const totalComments = reviews.reduce((acc, review) => 
        acc + (review.comments?.filter(c => c.author === userEmail).length || 0), 0);

    const stats = {
        reviewsCount: userReviews.length,
        favoritesCount: favorites.length,
        commentsCount: totalComments
    };

    // Actualizar estadísticas en el perfil
    Object.entries(stats).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) element.textContent = value;
    });

    return stats;
}

// Event Listeners
document.getElementById('searchBar')?.addEventListener('input', searchReviews);
document.getElementById('genreFilter')?.addEventListener('change', searchReviews);

// Cargar reseñas cuando se carga la página de inicio
if (document.getElementById('reviewsContainer')) {
    loadReviews();
}

// Función para mostrar el formulario de nuevo blog
function showNewBlogForm() {
    const user = UserSession.getCurrentUser();
    if (!user) {
        showAlert('Debes iniciar sesión para crear un blog', 'warning');
        return;
    }
    
    // Asegurarnos de que el modal existe
    const modalElement = document.getElementById('newBlogModal');
    if (!modalElement) {
        console.error('Modal no encontrado');
        return;
    }

    // Inicializar el modal de manera segura
    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
        modal = new bootstrap.Modal(modalElement);
    }
    
    // Limpiar el formulario antes de mostrar
    const blogForm = document.getElementById('blogForm');
    if (blogForm) {
        blogForm.reset();
    }
    
    // Mostrar el modal
    modal.show();
}

// Función para guardar un nuevo blog
async function saveBlog(blogData) {
    try {
        const user = UserSession.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        
        const newBlog = {
            id: Date.now(),
            ...blogData,
            author: user.username,
            date: new Date().toISOString(),
            likes: [],
            comments: []
        };

        blogs.unshift(newBlog);
        localStorage.setItem('blogs', JSON.stringify(blogs));
        
        showAlert('Blog publicado exitosamente', 'success');
        loadBlogs();
        return true;
    } catch (error) {
        console.error('Error al guardar el blog:', error);
        showAlert('Error al publicar el blog', 'danger');
        return false;
    }
}

// Función para cargar los blogs
function loadBlogs() {
    const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
    const container = document.getElementById('blogsContainer');
    const template = document.getElementById('blogTemplate');
    
    if (!container || !template) return;
    
    container.innerHTML = '';
    
    if (blogs.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p>No hay blogs publicados aún.</p>
            </div>`;
        return;
    }

    blogs.forEach(blog => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.card');
        
        card.dataset.blogId = blog.id;
        card.querySelector('.blog-title').textContent = blog.title;
        card.querySelector('.category-badge').textContent = blog.category;
        card.querySelector('.blog-excerpt').textContent = truncateText(blog.content, 150);
        card.querySelector('.author').textContent = blog.author;
        card.querySelector('.date').textContent = new Date(blog.date).toLocaleDateString();
        
        container.appendChild(clone);
    });
}

// Función para ver blog completo
function verBlogCompleto(btn) {
    const blogId = btn.closest('.blog-card').dataset.blogId;
    const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
    const blog = blogs.find(b => b.id.toString() === blogId);
    
    if (!blog) return;

    const modalHtml = `
        <div class="modal fade" id="blogModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${blog.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex justify-content-between mb-3">
                            <span class="badge bg-primary">${blog.category}</span>
                            <small class="text-muted">Por ${blog.author} | ${new Date(blog.date).toLocaleDateString()}</small>
                        </div>
                        <div class="blog-content">
                            ${formatBlogContent(blog.content)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('blogModal'));
    modal.show();

    document.getElementById('blogModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Función para buscar blogs
function searchBlogs() {
    const searchTerm = document.getElementById('blogSearchBar').value.toLowerCase();
    const categoryFilter = document.getElementById('blogCategoryFilter').value;
    const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
    
    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchTerm) ||
                            blog.author.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || blog.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    loadFilteredBlogs(filteredBlogs);
}

// Funciones auxiliares
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function formatBlogContent(content) {
    return content.split('\n').map(paragraph => 
        paragraph.trim() ? `<p>${paragraph}</p>` : ''
    ).join('');
}

// Inicializar blogs cuando se carga la página
function initializeBlogs() {
    // Configurar formulario de nuevo blog
    const blogForm = document.getElementById('blogForm');
    if (blogForm) {
        blogForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(blogForm);
            const blogData = {
                title: formData.get('title'),
                category: formData.get('category'),
                content: formData.get('content')
            };
            
            if (await saveBlog(blogData)) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('newBlogModal'));
                modal.hide();
                blogForm.reset();
            }
        };
    }

    // Configurar eventos de búsqueda
    const searchBar = document.getElementById('blogSearchBar');
    const categoryFilter = document.getElementById('blogCategoryFilter');
    
    if (searchBar) searchBar.addEventListener('input', searchBlogs);
    if (categoryFilter) categoryFilter.addEventListener('change', searchBlogs);

    // Cargar blogs iniciales
    loadBlogs();
}


