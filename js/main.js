import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { recuperarCarrito, toggleCarrito, agregarAlCarrito, eliminarDelCarrito, finalizarCompra, actualizarCarritoVisual } from './carrito.js';
import { inicializarAuth } from './auth.js';
import { cargarBaseDeDatos } from './api.js';
import { formatearPrecio, generarDescripcion, moverCarrusel } from './ui.js';
import { obtenerFavoritos } from './favoritos.js';
import { cargarUIReviews } from './reviews.js';

// Convertir productos a exportable y mutable
export const productos = [];

// Variables Globales Paginación
let paginaActual = 1;
const productosPorPagina = 12; // Cantidad visible por página
let productosFiltradosActuales = [];

// =================================
// FUNCIONES DE RENDERIZADO (EL MOZO)
// =================================
export function cargarProductos(listaProductos = productos, pagina = 1) {
    const contenedor = document.querySelector(".productos");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    // Guardar referencia actual de la lista y la pagina
    productosFiltradosActuales = listaProductos;
    paginaActual = pagina;

    if (listaProductos.length === 0) {
        contenedor.innerHTML = `
            <section class='error-busqueda'> 
                <h2>No hay productos encontrados con ese nombre o categoria.</h2> 
                <h3>Intenta con otro nombre o categoria</h3>
            </section>
        `;
        const pagContenedor = document.getElementById("paginacion");
        if (pagContenedor) pagContenedor.innerHTML = "";
        return;
    }

    const esSubcarpeta = window.location.pathname.includes("pages");
    const prefijoImagen = esSubcarpeta ? "../" : "";
    const rutaProducto = esSubcarpeta ? "producto.html" : "pages/producto.html";

    let lista = "";

    // Paginación lógica: Cortar el gran array
    const inicioOffset = (paginaActual - 1) * productosPorPagina;
    const finalOffset = inicioOffset + productosPorPagina;
    const productosPagina = productosFiltradosActuales.slice(inicioOffset, finalOffset);

    // Revisar qué arrastra en favoritos
    const favsGuardados = obtenerFavoritos();

    // Iteramos solo los productos correspondientes a esta página
    productosPagina.forEach(({ id, nombre, precio, imagen }) => {
        let rutaImagen = imagen.startsWith("http") ? imagen : prefijoImagen + imagen;

        let iconoCorazon = favsGuardados.includes(id) ? "❤️" : "🤍";
        let claseCorazon = favsGuardados.includes(id) ? "activo" : "";

        // --- 2. AÑADIMOS lazy loading a las imagenes ---
        lista += `
        <article class="producto animacion-entrada"> 
            <button class="btn-favorito ${claseCorazon}" onclick="toggleFavoritoClick('${id}', this)" title="Añadir a favoritos">${iconoCorazon}</button>
            <a href="${rutaProducto}?prod=${id}">
                <img src="${rutaImagen}" alt="${nombre}" loading="lazy">
            </a>
            <div class ="info-producto">
                <h3>${nombre}</h3>
                <p class="precio">${formatearPrecio(precio)}</p>
                <p class="envio-info"> Envio a coordinar </p>
                <button class="btn-comprar" onclick="agregarAlCarrito('${id}')">Comprar</button>
            </div>
        </article>`;
    });

    contenedor.innerHTML = lista;

    // Solo renderizar botones de páginas si estamos en el catálogo
    if (esSubcarpeta) {
        renderizarPaginacion(productosFiltradosActuales.length);
    }
}

// =================================
// FUNCIÓN: RENDERIZAR PAGINACIÓN
// =================================
function renderizarPaginacion(totalProductos) {
    const contenedorPaginacion = document.getElementById("paginacion");
    if (!contenedorPaginacion) return;

    contenedorPaginacion.innerHTML = "";

    // Calcular numero total de paginas
    const totalPaginas = Math.ceil(totalProductos / productosPorPagina);
    if (totalPaginas <= 1) return; // Si todo entra en 1 página, esconder numeración

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.classList.add("btn-paginacion");
        if (i === paginaActual) btn.classList.add("activo");

        btn.addEventListener("click", () => {
            // Recargar productos pasandoles la nueva pagina
            cargarProductos(productosFiltradosActuales, i);
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        contenedorPaginacion.appendChild(btn);
    }
}

export function renderizarFranquicias() {
    const contenedor = document.getElementById("contenedor-franquicias");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const btnBorrar = document.createElement("button");
    btnBorrar.innerText = "Borrar Filtros";
    btnBorrar.classList.add("btn-franquicia");

    btnBorrar.style.borderColor = "#ff5252";
    btnBorrar.style.background = "black";
    btnBorrar.style.color = "#ff5252";

    btnBorrar.addEventListener("click", () => {
        document.querySelectorAll(".btn-franquicia.activo").forEach(btn => btn.classList.remove("activo"));

        const esPaginaProductos = window.location.pathname.includes("pages");

        if (esPaginaProductos) {
            cargarProductos(productos);
        } else {
            const soloDestacados = productos.filter(p => p.destacado === true);
            cargarProductos(soloDestacados);
        }
    });

    contenedor.appendChild(btnBorrar);

    const franquiciasSucias = productos.map(producto => producto.franquicia);
    const franquiciasUnicas = [...new Set(franquiciasSucias)];

    franquiciasUnicas.forEach(franquicia => {
        if (franquicia) {
            const btn = document.createElement("button");
            btn.innerText = franquicia;
            btn.classList.add("btn-franquicia");

            btn.addEventListener("click", () => {
                document.querySelectorAll(".btn-franquicia").forEach(b => b.classList.remove("activo"));
                btn.classList.add("activo");

                // Limpiamos la URL para no arrastrar el parametro viejo
                window.history.pushState({}, document.title, window.location.pathname);

                const productosFiltrados = productos.filter(p => p.franquicia === franquicia);
                cargarProductos(productosFiltrados);
            });

            // Si venimos de la Home con el parámetro en la URL, pintar este botón
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('franquicia') === franquicia) {
                btn.classList.add("activo");
            }

            contenedor.appendChild(btn);
        }
    });
}

export async function cargarDetalleProducto() {
    const contenedorDetalle = document.getElementById("detalle-producto");
    if (!contenedorDetalle) return;

    const params = new URLSearchParams(window.location.search);
    const idProducto = params.get("prod");

    if (!idProducto) return;

    contenedorDetalle.innerHTML = "<h3 class='cargando-texto'>Buscando en la bóveda... ⏳</h3>";

    try {
        const docRef = doc(db, "productos", idProducto);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const producto = docSnap.data();

            let rutaImagen = producto.imagen;

            if (!rutaImagen.startsWith("http")) {
                rutaImagen = "../" + rutaImagen;
            }

            const favsGuardados = obtenerFavoritos();
            const iconoCorazon = favsGuardados.includes(docSnap.id) ? "❤️" : "🤍";

            contenedorDetalle.innerHTML = `
                <div class="detalle-flex">
                        <img src="${rutaImagen}" alt="${producto.nombre}">
                    <div class="detalle-info">
                        <h2>
                            ${producto.nombre} 
                            <button class="btn-favorito-detalle" onclick="toggleFavoritoClick('${docSnap.id}', this)" title="Añadir a favoritos">${iconoCorazon}</button>
                        </h2>
                        <p class="precio-detalle">$ ${producto.precio}</p>
                        <p class="descripcion">${producto.descripcion || generarDescripcion(producto)}</p>
                        <p class="categoria">Categoría: <span>${producto.categoria}</span></p>
                        
                        <button class="btn-comprar-detalle" onclick="agregarAlCarrito('${docSnap.id}')">
                            Agregar al Carrito 🛒
                        </button>
                    </div>
                </div>
            `;

            // 4. Llamamos a la función de Similares
            cargarProductosSimilares(producto);

            // 5. Instanciar sistema de Opiniones
            cargarUIReviews(docSnap.id);

        } else {
            contenedorDetalle.innerHTML = "<h3>❌ El producto no existe.</h3>";
        }

    } catch (error) {
        console.error("Error:", error);
        contenedorDetalle.innerHTML = "<h3>🔥 Error cargando producto.</h3>";
    }
}

// ===================================
// FUNCION: CARGAR PRODUCTOS SIMILARES
// ===================================
export function cargarProductosSimilares(productoActivo) {
    const contenedorSimilares = document.getElementById("contenedor-similares");
    const seccionSimilares = document.getElementById("seccion-similares");

    if (!contenedorSimilares || !seccionSimilares) return;

    seccionSimilares.style.display = "block"; // Lo hacemos visible ahora que hay data

    // Filtramos productos de la misma categoria o franquicia, omitiendo el producto actual
    let similares = productos.filter(p =>
        (p.categoria === productoActivo.categoria || p.franquicia === productoActivo.franquicia)
        && p.nombre !== productoActivo.nombre // evitamos q sea el mismo prod
    );

    // Si no hay similares de esa categoría, tiramos unos random para que no quede vacío
    if (similares.length === 0) {
        similares = productos.filter(p => p.nombre !== productoActivo.nombre).slice(0, 4);
    } else {
        similares = similares.slice(0, 4); // Limitamos a un Max de 4 para no inflar la web
    }

    const prefijoImagen = window.location.pathname.includes("pages") ? "../" : "";
    const rutaProducto = window.location.pathname.includes("pages") ? "producto.html" : "pages/producto.html";

    let listaHTML = "";

    similares.forEach(({ id, nombre, precio, imagen }) => {
        let rutaImagen = imagen.startsWith("http") ? imagen : prefijoImagen + imagen;
        import('./ui.js').then(m => {
            const favsGuardados = obtenerFavoritos();
            const iconoCorazon = favsGuardados.includes(id) ? "❤️" : "🤍";
            const claseCorazon = favsGuardados.includes(id) ? "activo" : "";

            listaHTML += `
            <article class="producto animacion-entrada" style="animation-duration: 1.2s;"> 
                <button class="btn-favorito ${claseCorazon}" onclick="toggleFavoritoClick('${id}', this)" title="Añadir a favoritos">${iconoCorazon}</button>
                <a href="${rutaProducto}?prod=${id}">
                    <img src="${rutaImagen}" alt="${nombre}" loading="lazy">
                </a>
                <div class ="info-producto">
                    <h3>${nombre}</h3>
                    <p class="precio">${m.formatearPrecio(precio)}</p>
                    <p class="envio-info"> Envio a coordinar </p>
                    <button class="btn-comprar" onclick="agregarAlCarrito('${id}')">Comprar</button>
                </div>
            </article>`;
            contenedorSimilares.innerHTML = listaHTML;
        });
    });
}

// ===================================
// FUNCION: RENDERIZAR GRILLA FAVORITOS (PERFIL)
// ===================================
export function renderizarFavoritosPerfil() {
    const contenedorFavs = document.getElementById("grilla-favoritos");
    if (!contenedorFavs) return;

    const favsGuardados = obtenerFavoritos();

    if (favsGuardados.length === 0) {
        contenedorFavs.innerHTML = "<p class='cargando'>No tienes favoritos aún. ¡Ve al catálogo y enamórate de algo!</p>";
        return;
    }

    const productosFavs = productos.filter(p => favsGuardados.includes(p.id));

    let htmlFavs = "";
    const prefijoImagen = window.location.pathname.includes("pages") ? "../" : "";
    const rutaProducto = window.location.pathname.includes("pages") ? "producto.html" : "pages/producto.html";

    productosFavs.forEach(({ id, nombre, precio, imagen }) => {
        let rutaImagen = imagen.startsWith("http") ? imagen : prefijoImagen + imagen;
        import('./ui.js').then(m => {
            htmlFavs += `
            <article class="producto animacion-entrada" style="animation-duration: 0.8s;"> 
                <button class="btn-favorito activo" onclick="toggleFavoritoClick('${id}', this)" title="Añadir a favoritos">❤️</button>
                <a href="${rutaProducto}?prod=${id}">
                    <img src="${rutaImagen}" alt="${nombre}" loading="lazy">
                </a>
                <div class ="info-producto">
                    <h3>${nombre}</h3>
                    <p class="precio">${m.formatearPrecio(precio)}</p>
                    <button class="btn-comprar" onclick="agregarAlCarrito('${id}')">Comprar</button>
                </div>
            </article>`;
            contenedorFavs.innerHTML = htmlFavs;
        });
    });
}

// Escuchar cuando se borran o agregan favoritos globalmente para actualizar el perfil en tiempo real
window.addEventListener("favoritosActualizados", () => {
    // Re-renderizamos los botones del index y las tarjetas del perfil si ambos están vivos
    const path = window.location.pathname;
    if (path.includes("perfil.html")) {
        renderizarFavoritosPerfil();
    } else {
        // En productos o index, recargamos la grilla actual
        const esSubcarpeta = window.location.pathname.includes("pages");
        if (esSubcarpeta && document.getElementById("input-busqueda")) {
            // No podemos recargar toda la grilla si no sabemos en qué pagina está, 
            // pero el toggle ya cambia el icono visualmente (btn.innerText). Así que lo dejamos así para no romper paginación.
        } else {
            // Si estabas en Home y diste click, renderizarDestacados se llama solo? No, main renderiza destacado al ppio.
        }
    }
});

// INICIALIZACIÓN (ARRANQUE)
inicializarAuth();
cargarBaseDeDatos().then(renderizarFavoritosPerfil);
recuperarCarrito();

// EXPOSICIÓN GLOBAL (Para HTML)
window.cargarProductos = cargarProductos;
window.renderizarFranquicias = renderizarFranquicias;


// FILTROS DE BÚSQUEDA Y AUTOCOMPLETAR
const inputBusqueda = document.getElementById("input-busqueda");
const contenedorResultados = document.getElementById("resultados-busqueda");

if (inputBusqueda) {
    inputBusqueda.addEventListener("keyup", function (evento) {
        const textoUsuario = evento.target.value.toLowerCase();

        // Si borró todo, ocultamos popup y mostramos los por defecto (o paginación)
        if (textoUsuario === "") {
            if (contenedorResultados) contenedorResultados.classList.remove("activo");
            cargarProductos(productos);
            return;
        }

        // Filtramos para la vista oficial global
        const productosFiltrados = productos.filter(producto => {
            const enNombre = producto.nombre.toLowerCase().includes(textoUsuario);
            const enCategoria = producto.categoria.toLowerCase().includes(textoUsuario);
            const enFranquicia = (producto.franquicia || "").toLowerCase().includes(textoUsuario);
            return enNombre || enCategoria || enFranquicia;
        });

        // 1. Mostrar la grilla grandota abajo
        cargarProductos(productosFiltrados);

        // 2. Mostrar la ventanita Autocompletar Predictiva debajo del Input
        if (contenedorResultados) {
            contenedorResultados.innerHTML = ""; // Vaciamos basura vieja

            if (productosFiltrados.length === 0) {
                contenedorResultados.classList.remove("activo");
                return;
            }

            // Prendemos la ventanita mostrando max 5 y armamos las minis
            contenedorResultados.classList.add("activo");
            const primerosResultados = productosFiltrados.slice(0, 5);

            let htmlPredictivo = "";
            const prefijoImagen = window.location.pathname.includes("pages") ? "../" : "";

            primerosResultados.forEach(prod => {
                let rutaImg = prod.imagen.startsWith("http") ? prod.imagen : prefijoImagen + prod.imagen;
                htmlPredictivo += `
                    <a href="producto.html?prod=${prod.id}" class="item-busqueda">
                        <img src="${rutaImg}" alt="${prod.nombre}">
                        <div class="info-item-busqueda">
                            <span>${prod.nombre}</span>
                            <small>$${prod.precio}</small>
                        </div>
                    </a>
                `;
            });

            contenedorResultados.innerHTML = htmlPredictivo;
        }
    });

    // Pequeño truco para que si el usuario hace click afuera de la caja, se cierre el predictivo
    document.addEventListener("click", (e) => {
        if (contenedorResultados && !inputBusqueda.contains(e.target) && !contenedorResultados.contains(e.target)) {
            contenedorResultados.classList.remove("activo");
        }
    });
}

// FILTROS POR CATEGORÍA
const botonesCategorias = document.querySelectorAll(".btn-cat");

botonesCategorias.forEach(boton => {
    boton.addEventListener("click", (e) => {
        const idBoton = e.currentTarget.id;

        if (idBoton === "cat-todos") {
            cargarProductos(productos);
        } else {
            const categoriaSeleccionada = idBoton.slice(4);
            const productosFiltrados = productos.filter(producto => producto.categoria === categoriaSeleccionada);
            cargarProductos(productosFiltrados);
        }
    })
})

const imagenesHero = [
    "./img/banner-star-wars.jpg",
    "./img/banner-naruto.jpg",
    "./img/banner-marvel.jpeg"
];

let indiceActual = 0;
const imagenElemento = document.getElementById("imagen-hero");

function cambiarImagen() {
    if (!imagenElemento) return;

    indiceActual = (indiceActual + 1) % imagenesHero.length;
    imagenElemento.style.opacity = 0;
    setTimeout(() => {
        imagenElemento.src = imagenesHero[indiceActual];
        imagenElemento.style.opacity = 1;
    }, 500);
}
setInterval(cambiarImagen, 4000);