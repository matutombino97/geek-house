import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const formulario = document.getElementById("form-login");
const mensajeError = document.getElementById("mensaje-error");

formulario.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita que se recargue la página

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // 🔥 INTENTAMOS INICIAR SESIÓN
        await signInWithEmailAndPassword(auth, email, password);
        
        // Si pasa la línea de arriba, es que los datos son correctos.
        // Redirigimos al panel de control
        window.location.href = "admin.html";

    } catch (error) {
        console.error("Error de login:", error.code);
        
        // Mostramos el mensaje de error en rojo
        mensajeError.style.display = "block";
        
        // Traducir errores comunes
        if (error.code === "auth/invalid-credential") {
            mensajeError.innerText = "❌ Datos incorrectos. Probá de nuevo.";
        } else {
            mensajeError.innerText = "❌ Error: " + error.code;
        }
    }
});