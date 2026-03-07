import { db, storage, auth } from './firebase-config.js'; // <--- Importamos 'storage'
import { collection, doc, setDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 👇 Importamos las herramientas para manejar archivos
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
/* ==============================================
   🛡️ LÓGICA DE SEGURIDAD (EL PATOVICA)
   ============================================== */
// Esta función se ejecuta sola apenas carga la página
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Si 'user' existe, es que está logueado.
        console.log("✅ Acceso permitido. Usuario:", user.email);
        // Acá podríamos poner el email en el header si quisiéramos
    } else {
        // Si 'user' es null, es que NO está logueado.
        console.warn("⛔ Acceso denegado. Redirigiendo al login...");
        window.location.href = "login.html"; // ¡AFUERA!
    }
});

/* ==============================================
   BOTÓN DE CERRAR SESIÓN (Logout)
   ============================================== */
// Agregaremos este botón en el HTML en un segundo
const btnLogout = document.getElementById("btn-logout");

if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        try {
            await signOut(auth);
            console.log("Sesión cerrada.");
            // El onAuthStateChanged de arriba va a detectar que saliste y te va a mandar al login solo.
        } catch (error) {
            console.error("Error al salir:", error);
        }
    });
}
/* ==============================================
   1. LÓGICA DE CARGA DE LISTA (Igual que antes)
   ============================================== */
async function cargarListaProductos() {
    const contenedor = document.getElementById("lista-productos-admin");
    contenedor.innerHTML = "Cargando lista...";

    try {
        const lista = await getDocs(collection(db, "productos"));
        contenedor.innerHTML = "";
        lista.forEach(doc => {
            const producto = doc.data();
            const id = doc.id;
            let rutaImagen = producto.imagen;

            // Si la imagen es local (no tiene http), le agregamos "../" para salir de la carpeta pages
            if (!rutaImagen.startsWith("http")) {
                rutaImagen = "../" + rutaImagen;
                // Corrección extra por si las dudas
                rutaImagen = rutaImagen.replace(".././", "../");
                // 🔥 AUTO-FIX: Forzamos .webp en la vista de admin
                rutaImagen = rutaImagen.replace(/\.(png|jpg|jpeg)$/i, ".webp");
            }

            // Usamos 'rutaImagen' (la corregida) en el HTML
            // Le ponemos medidas fijas (50x50) y 'object-fit' para que no se deforme
            const miniatura = producto.imagen ? `<img src="${rutaImagen}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%; border: 2px solid #00ffcc;">` : ''; const item = document.createElement("div");
            item.classList.add("producto-admin-item");
            item.style.borderBottom = "1px solid #333";
            item.style.padding = "10px";
            item.style.display = "flex";
            item.style.justifyContent = "space-between";


            item.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    ${miniatura}
                    <span>
                        <strong>${producto.nombre}</strong> 
                        <small>(${id})</small>
                    </span>
                </div>
                <button class="btn-borrar" data-id="${id}" style="background:red; color:white; border:none; padding:5px; cursor: pointer;">
                    Eliminar 🗑️
                </button>
            `;
            contenedor.appendChild(item);
        });

        document.querySelectorAll(".btn-borrar").forEach(boton => {
            boton.addEventListener("click", eliminarProducto);
        });

    } catch (error) {
        console.error("Error leyendo lista:", error);
    }
}

async function eliminarProducto(evento) {
    const idParaBorrar = evento.target.dataset.id;
    const confirmar = confirm(`¿Seguro que querés borrar el producto: ${idParaBorrar}?`);

    if (!confirmar) return;

    try {
        await deleteDoc(doc(db, "productos", idParaBorrar));
        alert("¡Producto eliminado!");
        cargarListaProductos();
    } catch (error) {
        console.error("Error borrando:", error);
        alert("No se pudo borrar.");
    }
}

// Lógica del SLUG (Igual que antes)
const inputNombre = document.getElementById("nombre");
const inputCodigo = document.getElementById("codigo");

inputNombre.addEventListener("input", () => {
    const nombre = inputNombre.value;
    const slug = nombre.toLowerCase().trim().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    inputCodigo.value = slug;
});

/* ==============================================
   2. GUARDADO CON FOTO (LA NOVEDAD 📸)
   ============================================== */
const formulario = document.getElementById("form-producto");

formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Validar que haya foto seleccionada
    const archivo = document.getElementById("archivo-imagen").files[0];
    if (!archivo) {
        alert("⚠️ ¡Te olvidaste de elegir la foto!");
        return;
    }

    // Feedback visual (mostramos el mensajito de carga)
    document.getElementById("mensaje-carga").style.display = "block";

    try {
        // 2. SUBIR FOTO A STORAGE ☁️
        // Creamos una referencia (la dirección donde se va a guardar)
        // Guardamos en la carpeta 'imagenes_productos/' con el nombre del archivo
        const storageRef = ref(storage, 'img/' + archivo.name);

        // ¡Subiendo...!
        await uploadBytes(storageRef, archivo);

        // 3. OBTENER LA URL PÚBLICA 🔗
        // Una vez subida, le pedimos a Google el link para verla
        const urlImagen = await getDownloadURL(storageRef);

        console.log("Foto subida! URL:", urlImagen);

        // 4. GUARDAR EN FIRESTORE (BASE DE DATOS) 💾
        const nuevoProducto = {
            id: inputCodigo.value,
            nombre: inputNombre.value,
            precio: parseFloat(document.getElementById("precio").value),
            categoria: document.getElementById("categoria").value,
            franquicia: document.getElementById("franquicia").value,

            imagen: urlImagen, // <--- ACÁ USAMOS LA URL QUE NOS DIO GOOGLE

            destacado: document.getElementById("destacado").checked
        };

        // Guardamos el objeto producto
        await setDoc(doc(db, "productos", nuevoProducto.id), nuevoProducto);

        alert(`✅ ¡Producto guardado con foto real!`);

        formulario.reset();
        document.getElementById("mensaje-carga").style.display = "none"; // Ocultamos mensaje
        cargarListaProductos();

    } catch (error) {
        console.error("Error guardando:", error);
        alert("❌ Error al subir. Chequeá la consola.");
        document.getElementById("mensaje-carga").style.display = "none";
    }
});

// Arrancamos
cargarListaProductos();