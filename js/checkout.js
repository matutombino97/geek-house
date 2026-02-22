import { formatearPrecio } from './ui.js';

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

function generarOrdenWhatsApp(carrito) {
    // Ya no pedimos datos de envío porque GeekHouse todavía no hace envíos a domicilio.

    // 2. Armar el Texto para WhatsApp (El salto de linea en URL es %0A )
    let totalPagar = 0;

    let mensaje = `*¡Hola GeekHouse! Quiero hacer un pedido:*%0A`;
    mensaje += `%0A*Resumen del Pedido:*%0A`;

    carrito.forEach(prod => {
        totalPagar += prod.precio * prod.cantidad;
        mensaje += `- ${prod.cantidad}x ${prod.nombre} ($${prod.precio * prod.cantidad})%0A`;
    });

    mensaje += `%0A💰 *TOTAL:* $${totalPagar}%0A`;
    mensaje += `%0A¿Me confirmás el stock y por dónde paso a retirarlo?`;

    // 3. Crear el Link y abrir la Pestaña
    // NOTA PARA EL CREADOR: Cambiá este número por TU WhatsApp REAL (ej: 5492613123456)
    const waNumber = "5492613433108";

    // Abrimos WhatsApp con el número del Local y el msj armado.
    const urlWa = `https://wa.me/${waNumber}?text=${mensaje}`;

    // Opcional: Vaciarle el carrito luego de mandarlo a Whatsapp porque asumimos "Venta Concretada"
    localStorage.removeItem("carritoGeek");

    window.open(urlWa, "_blank");

    // Redirigimos al Home para limpiar la URL del checkout
    window.location.href = "../index.html";
}
