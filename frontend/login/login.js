// Detectar qué formulario mostrar según la URL
const urlParams = new URLSearchParams(window.location.search);
const formType = urlParams.get('form'); // "login" o "register"

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if(formType === 'login'){
    loginForm.style.display = 'flex';
} else if(formType === 'register'){
    registerForm.style.display = 'flex';
} else {
    // Por defecto mostramos login
    loginForm.style.display = 'flex';
}