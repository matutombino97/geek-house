// favoritos.js
import { mostrarNotificacion } from './ui.js';

export function obtenerFavoritos() {
    return JSON.parse(localStorage.getItem("favoritosGeek")) || [];
}

export function guardarFavoritos(favoritos) {
    localStorage.setItem("favoritosGeek", JSON.stringify(favoritos));
}

export function toggleFavorito(idProducto) {
    let favoritos = obtenerFavoritos();
    let esFavorito = false;

    if (favoritos.includes(idProducto)) {
        // Quitar si ya existe
        favoritos = favoritos.filter(id => id !== idProducto);
        mostrarNotificacion("Producto eliminado de tus favoritos 💔", "error");
    } else {
        // Agregar si no existe
        favoritos.push(idProducto);
        esFavorito = true;
        mostrarNotificacion("¡Producto añadido a favoritos! ❤️");
    }

    guardarFavoritos(favoritos);

    // Disparar evento para que todos los corazones se actualicen visualmente
    window.dispatchEvent(new Event("favoritosActualizados"));
    return esFavorito;
}

// Para usar la función directamente desde el HTML (onclick="toggleFavorito(...)")
window.toggleFavoritoClick = function (id, elementoBoton) {
    // Para evitar que clickear el corazon meta al usuario en el producto
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const esFav = toggleFavorito(id);
    if (elementoBoton) {
        elementoBoton.innerText = esFav ? "❤️" : "🤍";
        elementoBoton.classList.toggle("activo", esFav);
    }
};
