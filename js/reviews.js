import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { mostrarNotificacion, mostrarConfirmacion } from './ui.js';
import { usuarioLogueado } from './auth.js';

// Escuchamos el estado de autenticación EN VIVO para mostrar u ocultar la caja de reviews independientemente de la carga de la página
onAuthStateChanged(auth, (usuario) => {
    const formReview = document.getElementById("formulario-review");
    const msgLogin = document.getElementById("mensaje-login-review");

    if (formReview && msgLogin) {
        if (usuario) {
            formReview.style.display = "block";
            msgLogin.style.display = "none";
        } else {
            formReview.style.display = "none";
            msgLogin.style.display = "block";
        }
    }
});

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
        // Quitamos el orderBy("fecha", "desc") para no forzar un Firebase Index compuesto
        const q = query(reviewRef, where("producto_id", "==", idProducto));
        const snapshot = await getDocs(q);

        let reviews = [];
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, ...doc.data() });
        });

        // Ordenamos localmente usando sort() nativo (Más nuevo a más viejo)
        reviews.sort((a, b) => {
            // Manejamos posible null por latencia de Snapshot
            const timeA = a.fecha ? a.fecha.toMillis() : Date.now();
            const timeB = b.fecha ? b.fecha.toMillis() : Date.now();
            return timeB - timeA;
        });

        return reviews;
    } catch (error) {
        console.error("Error al obtener reviews:", error);
        return [];
    }
}

// ==========================================
// FUNCIONES DE CONTROL DE USUARIO (Editar/Borrar)
// ==========================================

export async function borrarReview(idReview, idProducto) {
    mostrarConfirmacion("¿Estás seguro de que deseas eliminar esta opinión?", async () => {
        try {
            await deleteDoc(doc(db, "reviews", idReview));
            mostrarNotificacion("Tu opinión fue eliminada", "exito");
            await cargarUIReviews(idProducto); // Recargamos lista
        } catch (error) {
            console.error("Error al borrar review:", error);
            mostrarNotificacion("No se pudo eliminar la opinión", "error");
        }
    });
}

export function activarEdicionReview(idReview, puntuacionActual, comentarioActual, idProducto) {
    // 1. Llenamos el formulario principal con los datos viejos
    const inputRating = document.getElementById("rating-seleccionado");
    const inputComentario = document.getElementById("comentario-review");
    const btnEnviar = document.getElementById("btn-enviar-review");
    const tituloForm = document.querySelector("#formulario-review h3");

    inputRating.value = puntuacionActual;
    inputComentario.value = comentarioActual;
    tituloForm.innerText = "Editando tu Opinión ✍️";

    // 2. Pintamos las estrellas acorde
    const estrellas = document.querySelectorAll(".estrella");
    estrellas.forEach(e => {
        if (parseInt(e.getAttribute("data-valor")) <= puntuacionActual) {
            e.classList.add("seleccionada");
        } else {
            e.classList.remove("seleccionada");
        }
    });

    // 3. Cambiamos el comportamiento del boton de Enviar
    btnEnviar.innerText = "Actualizar Reseña 💾";

    const nuevoBtnEnviar = btnEnviar.cloneNode(true);
    btnEnviar.parentNode.replaceChild(nuevoBtnEnviar, btnEnviar);

    nuevoBtnEnviar.addEventListener("click", async () => {
        const ratingNuevo = parseInt(inputRating.value);
        const comentarioNuevo = inputComentario.value.trim();

        if (ratingNuevo === 0 || comentarioNuevo.length < 5) {
            mostrarNotificacion("Datos inválidos para actualizar.", "error");
            return;
        }

        nuevoBtnEnviar.innerText = "Actualizando... ⏳";
        nuevoBtnEnviar.disabled = true;

        try {
            await updateDoc(doc(db, "reviews", idReview), {
                puntuacion: ratingNuevo,
                comentario: comentarioNuevo,
                fecha: Timestamp.now() // Refrescamos la fecha de edicion
            });
            mostrarNotificacion("¡Opinión actualizada! ✨");
            await cargarUIReviews(idProducto); // recargamos

            // Devolvemos el form a la normalidad
            tituloForm.innerText = "Dejar una opinión";
            inputRating.value = "0";
            inputComentario.value = "";
            estrellas.forEach(e => e.classList.remove("seleccionada"));
            nuevoBtnEnviar.innerText = "Enviar Opinión 💬";
            nuevoBtnEnviar.disabled = false;

            // Re-instanciamos para nuevos comentarios
            inicializarFormularioReview(idProducto);

        } catch (error) {
            console.error(error);
            mostrarNotificacion("Error al actualizar", "error");
            nuevoBtnEnviar.disabled = false;
        }
    });

    // Scrolleamos arriba suave para que el usuario sepa que tiene que editar ahi
    document.getElementById("formulario-review").scrollIntoView({ behavior: 'smooth' });
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

            // Control de Autoría (Fase 14)
            let botonesAccion = "";
            const authLogueadoLimpiado = usuarioLogueado ? usuarioLogueado.trim().toLowerCase() : "";
            const revUsuarioLimpiado = rev.usuario ? rev.usuario.trim().toLowerCase() : "";

            if (authLogueadoLimpiado === revUsuarioLimpiado && authLogueadoLimpiado !== "") {
                const safeComentario = rev.comentario.replace(/'/g, "\\'"); // escape para inyeccion on-click
                botonesAccion = `
                    <div class="review-actions">
                        <button class="btn-review-edit" onclick="activarEdicionReview('${rev.id}', ${rev.puntuacion}, '${safeComentario}', '${idProducto}')">✏️ Editar</button>
                        <button class="btn-review-delete" onclick="borrarReview('${rev.id}', '${idProducto}')">🗑️ Borrar</button>
                    </div>
                `;
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
                    ${botonesAccion}
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

        // Utilizamos auth.currentUser para asegurarnos de tener el correo real en este preciso momento preventivo
        const emailUsuarioActual = auth.currentUser ? auth.currentUser.email : null;

        const exito = await enviarReview(idProducto, emailUsuarioActual, rating, comentario);

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

// Exponemos las funciones CRUD para que el HTML inyectado responda al click
window.borrarReview = borrarReview;
window.activarEdicionReview = activarEdicionReview;
