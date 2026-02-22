import { formatearPrecio, mostrarNotificacion } from './ui.js';
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { usuarioLogueado } from './auth.js';
import { productos } from './main.js'; // necesitamos acceder a la lista global

export let carrito = [];

export function agregarAlCarrito(id) {
    const productoAgregado = productos.find(producto => producto.id === id);
    const existeEnCarrito = carrito.find(producto => producto.id === id);

    if (existeEnCarrito) {
        existeEnCarrito.cantidad++;
    } else {
        const nuevo = { ...productoAgregado, cantidad: 1 };
        carrito.push(nuevo);
    }

    actualizarCarritoVisual();
    mostrarNotificacion("¡Producto agregado con éxito!");
    guardarCarritoEnStorage();
}

export function eliminarDelCarrito(id) {
    carrito = carrito.filter(producto => producto.id !== id);
    actualizarCarritoVisual();
    guardarCarritoEnStorage();
    mostrarNotificacion("Producto eliminado", "error");
}

export function actualizarCarritoVisual() {
    const listaHTML = document.getElementById("lista-carrito");
    const totalHTML = document.getElementById("total-carrito");
    const contadorBurbuja = document.getElementById("contador-burbuja");

    if (!totalHTML) return;

    let total = 0;
    listaHTML.innerHTML = "";
    let lista = "";

    carrito.forEach(({ id, nombre, precio, cantidad }) => {
        lista += `
            <li>
                <div class='informacion-carrito'>
                   Cantidad: ${cantidad} | ${nombre} - ${formatearPrecio(precio)}
                </div>
                <button class='btn-eliminar' onclick="eliminarDelCarrito('${id}')">X</button>
            </li>
        `;
        total += precio * cantidad;
    });

    totalHTML.innerText = formatearPrecio(total);
    listaHTML.innerHTML = lista;

    if (contadorBurbuja) {
        const totalProductos = carrito.reduce((acc, prod) => acc + prod.cantidad, 0);
        contadorBurbuja.innerText = totalProductos;

        if (totalProductos > 0) {
            contadorBurbuja.style.display = "flex";
        } else {
            contadorBurbuja.style.display = "none";
        }
    }
}

export function guardarCarritoEnStorage() {
    const carritoGuardado = JSON.stringify(carrito);
    localStorage.setItem("carritoGeek", carritoGuardado);
}

export function recuperarCarrito() {
    const memoria = localStorage.getItem("carritoGeek");

    if (memoria) {
        carrito = JSON.parse(memoria);
        actualizarCarritoVisual();
    }
}

export function toggleCarrito() {
    const carritoContainer = document.getElementById("carrito-container");
    if (carritoContainer) carritoContainer.classList.toggle("oculto");
}

export async function finalizarCompra() {
    if (carrito.length === 0) {
        mostrarNotificacion(`En tu carrito no hay nada`);
        return;
    }

    if (!usuarioLogueado) {
        mostrarNotificacion("Para finalizar la compra necesitas iniciar sesion o registrarte");
        const modal = document.getElementById("modal-ingreso");
        if (modal) modal.classList.add("activo");
        return;
    }

    // Guardamos las cosas y Redirigimos al oficial Checkout a doble columna
    guardarCarritoEnStorage();
    const rutaCheckout = window.location.pathname.includes("pages") ? "checkout.html" : "pages/checkout.html";
    window.location.href = rutaCheckout;
}

// Exponer funciones necesarias globalmente para el HTML
window.agregarAlCarrito = agregarAlCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.finalizarCompra = finalizarCompra;
window.toggleCarrito = toggleCarrito;
