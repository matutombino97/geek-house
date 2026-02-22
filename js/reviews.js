// reviews.js
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { mostrarNotificacion } from './ui.js';
import { usuarioLogueado } from './auth.js';

export async function enviarReview(idProducto, emailUsuario, puntuacion, comentario) {
    if (!idProducto || !emailUsuario || !puntuacion || !comentario) {
        mostrarNotificacion("Faltan datos para la review.", "error");
        return;
    }

    try {
        const reviewRef = collection(db, "reviews");
        await addDoc(reviewRef, {
            producto_id: idProducto,
            usuario: emailUsuario,
            puntuacion: Number(puntuacion),
            comentario: comentario,
            fecha: Timestamp.now()
        });
        mostrarNotificacion("¡Gracias por tu reseña! ⭐");
        return true;
    } catch (error) {
        console.error("Error al enviar review:", error);
        mostrarNotificacion("Error al guardar reseña.", "error");
        return false;
    }
}

export async function obtenerReviews(idProducto) {
    try {
        const reviewRef = collection(db, "reviews");
        const q = query(reviewRef, where("producto_id", "==", idProducto), orderBy("fecha", "desc"));
        const snapshot = await getDocs(q);

        const reviews = [];
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, ...doc.data() });
        });
        return reviews;
    } catch (error) {
        console.error("Error al obtener reviews:", error);
        return [];
    }
}

// ==========================================
// LÓGICA DE INTERFAZ (UI) PARA LAS REVIEWS
// ==========================================

export async function cargarUIReviews(idProducto) {
    const contenedorLista = document.getElementById("lista-reviews");
    const formReview = document.getElementById("formulario-review");
    const msgLogin = document.getElementById("mensaje-login-review");

    if (!contenedorLista) return;

    // 1. Mostrar/Ocultar formulario según sesión
    if (usuarioLogueado) {
        if (formReview) formReview.style.display = "block";
        if (msgLogin) msgLogin.style.display = "none";
    } else {
        if (formReview) formReview.style.display = "none";
        if (msgLogin) msgLogin.style.display = "block";
    }

    // 2. Traer opiniones de Firebase
    contenedorLista.innerHTML = "<p class='cargando'>Buscando opiniones... ⏳</p>";
    const reviews = await obtenerReviews(idProducto);

    if (reviews.length === 0) {
        contenedorLista.innerHTML = "<p class='sin-reviews'>Sé el primero en opinar sobre este producto. ☝️</p>";
    } else {
        let htmlReviews = "";
        reviews.forEach(rev => {
            const fechaTxt = rev.fecha ? rev.fecha.toDate().toLocaleDateString() : "Reciente";
            // Dibujar estrellitas amarillas fijas según el rating
            let estrellasHtml = "";
            for (let i = 1; i <= 5; i++) {
                estrellasHtml += i <= rev.puntuacion ? "<span class='estrella-llena'>★</span>" : "<span class='estrella-vacia'>☆</span>";
            }

            htmlReviews += `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-user-avatar">👤</div>
                        <div>
                            <strong>${rev.usuario.split('@')[0]}</strong>
                            <div class="review-estrellas">${estrellasHtml}</div>
                        </div>
                        <span class="review-fecha">${fechaTxt}</span>
                    </div>
                    <p class="review-texto">"${rev.comentario}"</p>
                </div>
            `;
        });
        contenedorLista.innerHTML = htmlReviews;
    }

    // 3. Inicializar lógica de estrellas interactivas para el form
    inicializarFormularioReview(idProducto);
}

function inicializarFormularioReview(idProducto) {
    const estrellas = document.querySelectorAll(".estrella");
    const inputRating = document.getElementById("rating-seleccionado");
    const btnEnviar = document.getElementById("btn-enviar-review");
    const inputComentario = document.getElementById("comentario-review");

    if (!estrellas.length || !btnEnviar) return;

    // Hover interactivo en estrellas
    estrellas.forEach(estrella => {
        estrella.addEventListener("mouseover", function () {
            const valor = parseInt(this.getAttribute("data-valor"));
            estrellas.forEach(e => {
                if (parseInt(e.getAttribute("data-valor")) <= valor) {
                    e.classList.add("hover");
                } else {
                    e.classList.remove("hover");
                }
            });
        });

        // Limpiar hover si no ha seleccionado
        estrella.addEventListener("mouseout", function () {
            estrellas.forEach(e => e.classList.remove("hover"));
        });

        // Click para fijar la calificación
        estrella.addEventListener("click", function () {
            const valor = parseInt(this.getAttribute("data-valor"));
            inputRating.value = valor;

            // Pintar de dorado las seleccionadas
            estrellas.forEach(e => {
                if (parseInt(e.getAttribute("data-valor")) <= valor) {
                    e.classList.add("seleccionada");
                } else {
                    e.classList.remove("seleccionada");
                }
            });
        });
    });

    // Enviar formulario (limpiar event listener clonando el boton para no duplicar envios)
    const nuevoBtnEnviar = btnEnviar.cloneNode(true);
    btnEnviar.parentNode.replaceChild(nuevoBtnEnviar, btnEnviar);

    nuevoBtnEnviar.addEventListener("click", async () => {
        const rating = parseInt(inputRating.value);
        const comentario = inputComentario.value.trim();

        if (rating === 0) {
            mostrarNotificacion("Por favor, selecciona una calificación ⭐️", "error");
            return;
        }

        if (comentario.length < 5) {
            mostrarNotificacion("Escribe un comentario más detallado ✍️", "error");
            return;
        }

        nuevoBtnEnviar.innerText = "Enviando... ⏳";
        nuevoBtnEnviar.disabled = true;

        const exito = await enviarReview(idProducto, usuarioLogueado, rating, comentario);

        if (exito) {
            // Limpiar form y recargar opiniones
            inputRating.value = "0";
            inputComentario.value = "";
            estrellas.forEach(e => e.classList.remove("seleccionada", "hover"));
            await cargarUIReviews(idProducto);
        }

        nuevoBtnEnviar.innerText = "Enviar Opinión 💬";
        nuevoBtnEnviar.disabled = false;
    });
}
