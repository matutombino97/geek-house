// ==========================================
// 🔐 MÓDULO DE AUTENTICACIÓN (FIREBASE AUTH)
// ==========================================
// Este archivo maneja todo sobre el usuario: si está logueado, si se quiere registrar, o si quiere salir.

import { auth, db } from './firebase-config.js';
// Firebase trae estas funciones mágicas. 
// onAuthStateChanged: Es como un "guardia de seguridad" que avisa si alguien entra o sale.
// signOut: Cierra la sesión.
// signIn / createUser: Funciones para entrar o registrarse con Email y Contraseña.
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { mostrarNotificacion, formatearPrecio } from './ui.js';

// Guardamos globalmente quién es el usuario actual. Si es null, es un invitado.
export let usuarioLogueado = null;

// Esta función es el "motor de arranque" que se llama desde main.js apenas carga la web.
export function inicializarAuth() {
    verificarUsuario();
    configurarModal();
    logicaLogin();
    alternarFormularios();
    logicaRegistro();
    configurarTabsPerfil(); // Nueva funcion para navegar el Dashboard
}

// 1️⃣ VERIFICAR USUARIO CONTINUAMENTE
function verificarUsuario() {
    const btnLogout = document.getElementById("btn-logout");
    const nombreUsuario = document.getElementById("nombre-usuario");

    // Lógica para el botón "Salir" (en navbar o en el sidebar)
    if (btnLogout) {
        btnLogout.addEventListener("click", procesoCerrarSesion);
    }
    const btnLogoutDash = document.getElementById("btn-logout-dash");
    if (btnLogoutDash) {
        btnLogoutDash.addEventListener("click", procesoCerrarSesion);
    }

    async function procesoCerrarSesion() {
        try {
            await signOut(auth); // Le dice a Firebase: "Cerrá la sesión"
            mostrarNotificacion("Has cerrado sesión 👋");
            setTimeout(() => window.location.href = "../index.html", 1500); // Lo mandamos al home al salir
        } catch (error) {
            console.error("Error al salir:", error);
        }
    }

    // 🔥 EL VIGILANTE DE FIREBASE (onAuthStateChanged)
    // Se ejecuta automáticamente cada vez que alguien inicia sesión, se registra o cierra sesión.
    onAuthStateChanged(auth, (usuario) => {
        const contenedorPerfil = document.getElementById("lista-pedidos");
        const mensajeVisitante = document.getElementById("mensaje-visitante");
        const tituloPerfil = document.getElementById("email-perfil");

        if (usuario) {
            // SI HAY USUARIO: El cliente ingresó correctamente.
            console.log("Usuario activo:", usuario.email);
            usuarioLogueado = usuario.email;

            document.body.classList.add("sesion-iniciada");

            // Le cambiamos el texto al nav bar ("Hola visitante" -> "Hola juan@gmail.com")
            if (nombreUsuario) nombreUsuario.innerText = `Hola, ${usuario.email}`;

            // Si estamos en la vista de Perfil, mostramos sus compras reales.
            if (contenedorPerfil && mensajeVisitante) {
                contenedorPerfil.style.display = "block";
                mensajeVisitante.style.display = "none";
            }

            mostrarPedidos(usuario.email);
        } else {
            // SI NO HAY USUARIO: Es un visitante que no ha logueado.
            console.log("Nadie logueado");
            usuarioLogueado = null;
            document.body.classList.remove("sesion-iniciada");

            if (contenedorPerfil && mensajeVisitante) {
                if (tituloPerfil) tituloPerfil.innerText = "Visitante";

                contenedorPerfil.style.display = "none";
                mensajeVisitante.style.display = "block";
            }
        }
    });
}

// 2️⃣ ABRIR Y CERRAR EL MODAL NEGRO
function configurarModal() {
    const btnLogin = document.getElementById("btn-login");
    const btnCerrar = document.getElementById("btn-cerrar");
    const fondoOscuro = document.getElementById("modal-ingreso");

    if (btnLogin) {
        btnLogin.addEventListener("click", () => {
            if (fondoOscuro) fondoOscuro.classList.add("activo");
        });
    }

    if (btnCerrar) {
        btnCerrar.addEventListener("click", () => {
            if (fondoOscuro) fondoOscuro.classList.remove("activo");
        });
    }
}

// 3️⃣ INICIO DE SESIÓN
function logicaLogin() {
    const form = document.getElementById("form-login-cliente");

    if (form) {
        form.addEventListener("submit", async function (evento) {
            evento.preventDefault();
            const mail = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                // Función oficial de Firebase que conecta con tu DB y chequea si la contraseña es correcta.
                const credenciales = await signInWithEmailAndPassword(auth, mail, password);

                const modal = document.getElementById("modal-ingreso");
                if (modal) modal.classList.remove("activo"); // Cierra la ventanita

                mostrarNotificacion("¡Hola " + credenciales.user.email + ", ingresaste con éxito!");
                form.reset();

            } catch (error) {
                mostrarNotificacion("Error: " + error.message, "error");
            }
        });
    }
}

// 4️⃣ CAMBIAR DE "LOGUEARSE" A "REGISTRARSE"
function alternarFormularios() {
    const formLogin = document.getElementById("form-login-cliente");
    const formRegister = document.getElementById("form-register-cliente");
    const linkRegistro = document.getElementById("link-ir-registro");
    const linkLogin = document.getElementById("link-volver-login");

    if (linkRegistro) {
        linkRegistro.addEventListener("click", () => {
            if (formLogin) formLogin.style.display = "none";
            if (formRegister) formRegister.style.display = "flex";
        });
    }

    if (linkLogin) {
        linkLogin.addEventListener("click", () => {
            if (formLogin) formLogin.style.display = "flex";
            if (formRegister) formRegister.style.display = "none";
        });
    }
}

// 5️⃣ REGISTRO DE CUENTA NUEVA
function logicaRegistro() {
    const formRegistrar = document.getElementById("form-register-cliente");

    if (formRegistrar) {
        formRegistrar.addEventListener("submit", async function (e) {
            e.preventDefault();
            const mail = document.getElementById("email-reg").value;
            const password = document.getElementById("password-reg").value;

            try {
                // Función oficial de Firebase que graba al usuario internamente en "Authentication Users" de tu proyecto.
                const autenticacion = await createUserWithEmailAndPassword(auth, mail, password);
                mostrarNotificacion("¡Cuenta creada! Bienvenido/a " + autenticacion.user.email)

                const modal = document.getElementById("modal-ingreso");
                if (modal) modal.classList.remove("activo");

                formRegistrar.reset();
            } catch (error) {
                mostrarNotificacion("Hubo un error u la contraseña es débil: " + error.message, "error")
            }
        });
    }
}

export async function mostrarPedidos(emailUsuario) {
    const contenedor = document.getElementById("lista-pedidos");
    const emailPerfil = document.getElementById("email-perfil");

    if (!contenedor) return;

    if (emailPerfil) emailPerfil.innerText = emailUsuario;

    try {
        contenedor.innerHTML = "<p>Cargando pedidos...</p>";

        const pedidosRef = collection(db, "pedidos");

        const q = query(
            pedidosRef,
            where("cliente", "==", emailUsuario),
            orderBy("fecha", "desc")
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            contenedor.innerHTML = "<h3>Todavía no hiciste compras. ¡Andá al catálogo! 🛍️</h3>";
            return;
        }

        let html = "";

        querySnapshot.forEach((doc) => {
            const pedido = doc.data();
            const fecha = pedido.fecha ? pedido.fecha.toDate().toLocaleDateString() : "Fecha desconocida";

            let itemsHtml = "";
            pedido.items.forEach(item => {
                itemsHtml += `<li>${item.cantidad} x ${item.nombre} (${formatearPrecio(item.precio)})</li>`;
            });

            html += `
            <div class="pedido-card">
                <div class="pedido-header">
                    <span>Pedido #${doc.id.slice(0, 6)}...</span> <span class="fecha-pedido">${fecha}</span>
                </div>
                <div class="items-pedido">
                    <ul>${itemsHtml}</ul>
                </div>
                <div class="total-pedido">
                    Total: ${formatearPrecio(pedido.total)}
                    <span class="estado-pendiente">${pedido.estado.toUpperCase()}</span>
                </div>
            </div>
            `;
        });

        contenedor.innerHTML = html;

    } catch (error) {
        console.error("Error trayendo pedidos:", error);
        contenedor.innerHTML = "<p>Hubo un error cargando el historial.</p>";
    }
}

// 6️⃣ LOGICA DE PESTAÑAS DEL DASHBOARD (perfil.html)
function configurarTabsPerfil() {
    const botonesTabs = document.querySelectorAll(".tab-btn");
    const contenidosTabs = document.querySelectorAll(".tab-content");

    if (botonesTabs.length === 0) return; // Si no hay tabs (no está en perfil), cancela.

    botonesTabs.forEach(boton => {
        boton.addEventListener("click", () => {
            // Ignorar el boton de cerrar sesión
            if (boton.id === "btn-logout-dash") return;

            // 1. Apagamos todos los botones y contenidos
            botonesTabs.forEach(b => b.classList.remove("activo"));
            contenidosTabs.forEach(c => c.classList.remove("activo"));

            // 2. Encendemos el clickeado
            boton.classList.add("activo");

            // 3. Encendemos la caja correspondiente (data-target="tab-favoritos")
            const idObjetivo = boton.getAttribute("data-target");
            const cajaObjetivo = document.getElementById(idObjetivo);
            if (cajaObjetivo) cajaObjetivo.classList.add("activo");
        });
    });
}
