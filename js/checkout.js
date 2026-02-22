import { formatearPrecio, mostrarNotificacion } from './ui.js';
import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Levantamos lo que el usuario guardó en el carrito desde el LocalStorage
    let carritoTemporal = JSON.parse(localStorage.getItem("carritoGeek")) || [];

    // Si entra a la URL vacio, lo regresamos al catalogo para que compre.
    if (carritoTemporal.length === 0) {
        alert("Tu carrito está vacío. Serás redirigido al catálogo.");
        window.location.href = "productos.html";
        return;
    }

    // 2. Pintamos los productos en la columna derecha
    renderizarResumen(carritoTemporal);

    // 3. Activamos el botón generador de WhatsApp
    const btnWhatsApp = document.getElementById("btn-enviar-whatsapp");
    btnWhatsApp.addEventListener("click", () => generarOrdenWhatsApp(carritoTemporal));
});

function renderizarResumen(carrito) {
    const listaHtml = document.getElementById("lista-checkout");
    const spanSubtotal = document.getElementById("checkout-subtotal");
    const spanTotal = document.getElementById("checkout-total");

    listaHtml.innerHTML = ""; // Vaciamos el "cargando..."
    let totalAcumulado = 0;

    carrito.forEach(producto => {
        // sumamos matematica al vuelo
        totalAcumulado += producto.precio * producto.cantidad;

        // Inyectamos las tarjetitas
        listaHtml.innerHTML += `
            <div class="item-checkout">
                <div class="item-checkout-info">
                    <span class="item-checkout-nombre">${producto.nombre}</span>
                    <span class="item-checkout-cantidad">Cant: ${producto.cantidad} x ${formatearPrecio(producto.precio)}</span>
                </div>
                <span class="item-checkout-precio">${formatearPrecio(producto.precio * producto.cantidad)}</span>
            </div>
        `;
    });

    // Actualizamos Totales abajo a la derecha
    spanSubtotal.innerText = formatearPrecio(totalAcumulado);
    spanTotal.innerText = formatearPrecio(totalAcumulado);
}

async function generarOrdenWhatsApp(carrito) {
    // 1. Armar el Texto para WhatsApp (El salto de linea en URL es %0A )
    let totalPagar = 0;
    const itemsSimplificados = [];

    let mensaje = `*¡Hola GeekHouse! Quiero hacer un pedido:*%0A`;
    mensaje += `%0A*Resumen del Pedido:*%0A`;

    carrito.forEach(prod => {
        totalPagar += prod.precio * prod.cantidad;
        mensaje += `- ${prod.cantidad}x ${prod.nombre} ($${prod.precio * prod.cantidad})%0A`;

        // Preparamos un array liviano para subir a Firebase
        itemsSimplificados.push({
            id: prod.id,
            nombre: prod.nombre,
            precio: prod.precio,
            cantidad: prod.cantidad
        });
    });

    mensaje += `%0A💰 *TOTAL:* $${totalPagar}%0A`;
    mensaje += `%0A¿Me confirmás el stock y por dónde paso a retirarlo?`;

    // 2. Grabar en Firebase (Historial de Compras) si el usuario está logueado
    try {
        const usuarioLogueadoAhora = auth.currentUser;
        if (usuarioLogueadoAhora) {
            await addDoc(collection(db, "pedidos"), {
                cliente: usuarioLogueadoAhora.email,
                items: itemsSimplificados,
                total: totalPagar,
                fecha: serverTimestamp(),
                estado: "Pendiente"
            });
            console.log("Pedido registrado en BBDD para el historial.");
        } else {
            console.warn("Compra anónima, no se guardará en el historial de un perfil.");
        }
    } catch (error) {
        console.error("No se pudo guardar el pedido en el historial:", error);
    }

    // 3. Crear el Link y abrir WhatsApp
    const waNumber = "5492613433108";
    const urlWa = `https://wa.me/${waNumber}?text=${mensaje}`;

    // Vaciamos el carrito
    localStorage.removeItem("carritoGeek");

    window.open(urlWa, "_blank");
    window.location.href = "../index.html";
}
