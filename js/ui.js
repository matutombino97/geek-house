export const formateadorARS = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
});

export function formatearPrecio(precio) {
    return formateadorARS.format(precio);
}

export function mostrarNotificacion(mensaje, tipo = "exito") {
    let noti = document.getElementById("mensaje-oculto");

    if (!noti) {
        noti = document.createElement("div");
        noti.id = "mensaje-oculto";
        noti.className = "toast";
        document.body.appendChild(noti);
    }

    noti.innerText = mensaje;

    if (tipo === "error") {
        noti.classList.add("error");
    } else {
        noti.classList.remove("error");
    }

    setTimeout(() => {
        noti.classList.add("activo");
    }, 10);

    setTimeout(() => {
        noti.classList.remove("activo");
    }, 3000);
}

export function generarDescripcion(producto) {
    const nombre = (producto.nombre || "").toLowerCase();

    if (nombre.includes("medias")) {
        return `
        <ul class="descripcion-producto">
            <li>Medias inspiradas en el universo geek y la cultura pop</li>
            <li>Diseño pensado para fans que quieren llevar su pasión puesta</li>
            <li>Ideales para uso diario o para completar un outfit geek</li>
            <li>Comodidad y estilo en una sola prenda</li>
            <li>Un detalle infaltable para verdaderos fans</li>
        </ul>`;
    }
    else if (nombre.includes("funko") || nombre.includes("pop")) {
        return `
        <ul class="descripcion-producto">
            <li>Figura Funko Pop original de colección</li>
            <li>Diseño característico con gran nivel de detalle</li>
            <li>Ideal para exhibir en caja o fuera de ella</li>
            <li>Perfecta para coleccionistas y fans</li>
            <li>Un clásico infaltable en cualquier colección geek</li>
        </ul>`;
    }
    else if (nombre.includes("llavero")) {
        return `
           <ul class="descripcion-producto">
            <li>Llavero inspirado en la cultura geek y personajes icónicos</li>
            <li>Un detalle ideal para llevar tu fandom a todos lados</li>
            <li>Perfecto para mochilas, llaves o accesorios</li>
            <li>Diseño pensado para fans del universo geek</li>
            <li>Pequeño, práctico y lleno de personalidad</li>
        </ul>`;
    }
    else if (nombre.includes("figura")) {
        return `
            <ul class="descripcion-producto">
                <li>Figura coleccionable basada en el universo de Naruto </li>
                <li>Diseñada para destacar en cualquier lado</li>
                <li>Ideal para fans del Animé</li>
                <li>Perfecta para exhibir en escritorios o estanterías</li>
            </ul>`;
    }
    else if (nombre.includes("taza")) {
        return `
        <ul class="descripcion-producto">
            <li>Taza de ceramica con diseño inspirado en el mundo geek</li>
            <li>Ideal para acompañar maratones de series, anime o gaming</li>
            <li>Perfecta para fans de la cultura GEEK</li>
            <li>Un clásico del desayuno o la oficina geek</li>
            <li>Un regalo ideal para cualquier fan</li>
        </ul>`;
    }

    return `
    <ul class="descripcion-producto">
        <li>Producto oficial de GeekHouse</li>
        <li>Excelente calidad garantizada</li>
        <li>Envios a todo el país</li>
        <li>Compra protegida y segura</li>
    </ul>`;
}

export function moverCarrusel(idContenedor, direccion) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    const anchoTarjeta = 270;

    if (direccion === 'izquierda') {
        contenedor.scrollBy({ left: -anchoTarjeta, behavior: 'smooth' });
    } else {
        contenedor.scrollBy({ left: anchoTarjeta, behavior: 'smooth' });
    }
}
window.moverCarrusel = moverCarrusel;
