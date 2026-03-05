import { db } from './firebase-config.js';
import { doc, getDoc } from "https:
import { recuperarCarrito, toggleCarrito, agregarAlCarrito, eliminarDelCarrito, finalizarCompra, actualizarCarritoVisual } from './carrito.js';
import { inicializarAuth } from './auth.js';
import { cargarBaseDeDatos } from './api.js';
import { formatearPrecio, generarDescripcion, moverCarrusel } from './ui.js';
import { obtenerFavoritos } from './favoritos.js';
import { cargarUIReviews } from './reviews.js';
export const productos = [];
let paginaActual = 1;
const productosPorPagina = 12;
let productosFiltradosActuales = [];
export function cargarProductos(listaProductos = productos, pagina = 1) {
const contenedor = document.querySelector(".productos");
if (!contenedor) return;
contenedor.innerHTML = "";
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
const inicioOffset = (paginaActual - 1) * productosPorPagina;
const finalOffset = inicioOffset + productosPorPagina;
const productosPagina = productosFiltradosActuales.slice(inicioOffset, finalOffset);
const favsGuardados = obtenerFavoritos();
productosPagina.forEach(({ id, nombre, precio, imagen }) => {
let rutaImagen = imagen.startsWith("http") ? imagen : prefijoImagen + imagen;
let iconoCorazon = favsGuardados.includes(id) ? "❤️" : "🤍";
let claseCorazon = favsGuardados.includes(id) ? "activo" : "";
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
if (esSubcarpeta) {
renderizarPaginacion(productosFiltradosActuales.length);
}
}
function renderizarPaginacion(totalProductos) {
const contenedorPaginacion = document.getElementById("paginacion");
if (!contenedorPaginacion) return;
contenedorPaginacion.innerHTML = "";
const totalPaginas = Math.ceil(totalProductos / productosPorPagina);
if (totalPaginas <= 1) return;
for (let i = 1; i <= totalPaginas; i++) {
const btn = document.createElement("button");
btn.innerText = i;
btn.classList.add("btn-paginacion");
if (i === paginaActual) btn.classList.add("activo");
btn.addEventListener("click", () => {
cargarProductos(productosFiltradosActuales, i);
window.scrollTo({ top: 0, behavior: "smooth" });
});
contenedorPaginacion.appendChild(btn);
}
}
export function renderizarFranquicias() {
const contenedor = document.getElementById("contenedor-franquicias-checks");
if (!contenedor) return;
contenedor.innerHTML = "";
const franquiciasSucias = productos.map(producto => producto.franquicia);
const franquiciasUnicas = [...new Set(franquiciasSucias)].filter(f => f);
franquiciasUnicas.forEach(franquicia => {
const divFiltro = document.createElement("label");
divFiltro.innerHTML = `
<input type="checkbox" class="filtro-checkbox" value="${franquicia}" data-tipo="franquicia">
${franquicia}
`;
contenedor.appendChild(divFiltro);
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
<div class="control-cantidad">
<label for="cantidad-producto">Cantidad:</label>
<div class="selector-numerico">
<button type="button" class="btn-restar-cant" onclick="
const input = document.getElementById('cantidad-producto');
if(input.value > 1) input.value = parseInt(input.value) - 1;
">-</button>
<input type="number" id="cantidad-producto" value="1" min="1" max="99" readonly>
<button type="button" class="btn-sumar-cant" onclick="
const input = document.getElementById('cantidad-producto');
if(input.value < 99) input.value = parseInt(input.value) + 1;
">+</button>
</div>
</div>
<button class="btn-comprar-detalle" onclick="
const cantidad = parseInt(document.getElementById('cantidad-producto').value);
agregarAlCarrito('${docSnap.id}', cantidad);
">
Agregar al Carrito 🛒
</button>
</div>
</div>
`;
cargarProductosSimilares(producto);
cargarUIReviews(docSnap.id);
} else {
contenedorDetalle.innerHTML = "<h3>❌ El producto no existe.</h3>";
}
} catch (error) {
console.error("Error:", error);
contenedorDetalle.innerHTML = "<h3>🔥 Error cargando producto.</h3>";
}
}
export function cargarProductosSimilares(productoActivo) {
const contenedorSimilares = document.getElementById("contenedor-similares");
const seccionSimilares = document.getElementById("seccion-similares");
if (!contenedorSimilares || !seccionSimilares) return;
seccionSimilares.style.display = "block";
let similares = productos.filter(p =>
(p.categoria === productoActivo.categoria || p.franquicia === productoActivo.franquicia)
&& p.nombre !== productoActivo.nombre
);
if (similares.length === 0) {
similares = productos.filter(p => p.nombre !== productoActivo.nombre).slice(0, 4);
} else {
similares = similares.slice(0, 4);
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
window.addEventListener("favoritosActualizados", () => {
const path = window.location.pathname;
if (path.includes("perfil.html")) {
renderizarFavoritosPerfil();
} else {
const esSubcarpeta = window.location.pathname.includes("pages");
if (esSubcarpeta && document.getElementById("input-busqueda")) {
} else {
}
}
});
inicializarAuth();
cargarBaseDeDatos().then(renderizarFavoritosPerfil);
recuperarCarrito();
window.cargarProductos = cargarProductos;
window.renderizarFranquicias = renderizarFranquicias;
const inputBusqueda = document.getElementById("input-busqueda");
const contenedorResultados = document.getElementById("resultados-busqueda");
if (inputBusqueda) {
inputBusqueda.addEventListener("keyup", function (evento) {
const textoUsuario = evento.target.value.toLowerCase();
if (textoUsuario === "") {
if (contenedorResultados) contenedorResultados.classList.remove("activo");
cargarProductos(productos);
return;
}
const productosFiltrados = productos.filter(producto => {
const enNombre = producto.nombre.toLowerCase().includes(textoUsuario);
const enCategoria = producto.categoria.toLowerCase().includes(textoUsuario);
const enFranquicia = (producto.franquicia || "").toLowerCase().includes(textoUsuario);
return enNombre || enCategoria || enFranquicia;
});
cargarProductos(productosFiltrados);
if (contenedorResultados) {
contenedorResultados.innerHTML = "";
if (productosFiltrados.length === 0) {
contenedorResultados.classList.remove("activo");
return;
}
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
document.addEventListener("click", (e) => {
if (contenedorResultados && !inputBusqueda.contains(e.target) && !contenedorResultados.contains(e.target)) {
contenedorResultados.classList.remove("activo");
}
});
}
function aplicarFiltrosAvanzados() {
let productosFiltrados = [...productos];
const inputBusqueda = document.getElementById("input-busqueda");
const textoBuscar = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : "";
if (textoBuscar) {
productosFiltrados = productosFiltrados.filter(prod =>
prod.nombre.toLowerCase().includes(textoBuscar) ||
prod.categoria.toLowerCase().includes(textoBuscar) ||
(prod.franquicia || "").toLowerCase().includes(textoBuscar)
);
}
const precioMin = document.getElementById("precio-min") ? parseFloat(document.getElementById("precio-min").value) : NaN;
const precioMax = document.getElementById("precio-max") ? parseFloat(document.getElementById("precio-max").value) : NaN;
if (!isNaN(precioMin) && precioMin > 0) {
productosFiltrados = productosFiltrados.filter(prod => prod.precio >= precioMin);
}
if (!isNaN(precioMax) && precioMax > 0) {
productosFiltrados = productosFiltrados.filter(prod => prod.precio <= precioMax);
}
const checksCategorias = document.querySelectorAll(".filtro-checkbox[data-tipo='categoria']:checked");
const categoriasSeleccionadas = Array.from(checksCategorias).map(cb => cb.value);
if (categoriasSeleccionadas.length > 0) {
productosFiltrados = productosFiltrados.filter(prod => categoriasSeleccionadas.includes(prod.categoria));
}
const checksFranquicias = document.querySelectorAll(".filtro-checkbox[data-tipo='franquicia']:checked");
const franquiciasSeleccionadas = Array.from(checksFranquicias).map(cb => cb.value);
if (franquiciasSeleccionadas.length > 0) {
productosFiltrados = productosFiltrados.filter(prod => franquiciasSeleccionadas.includes(prod.franquicia));
}
cargarProductos(productosFiltrados, 1);
}
document.addEventListener("change", (e) => {
if (e.target.classList.contains("filtro-checkbox")) {
aplicarFiltrosAvanzados();
}
});
const precioMinInput = document.getElementById("precio-min");
if (precioMinInput) {
precioMinInput.addEventListener("input", aplicarFiltrosAvanzados);
}
const precioMaxInput = document.getElementById("precio-max");
if (precioMaxInput) {
precioMaxInput.addEventListener("input", aplicarFiltrosAvanzados);
}
const btnLimpiarFiltros = document.getElementById("btn-limpiar-filtros");
if (btnLimpiarFiltros) {
btnLimpiarFiltros.addEventListener("click", () => {
if (document.getElementById("input-busqueda")) document.getElementById("input-busqueda").value = "";
if (document.getElementById("precio-min")) document.getElementById("precio-min").value = "";
if (document.getElementById("precio-max")) document.getElementById("precio-max").value = "";
document.querySelectorAll(".filtro-checkbox:checked").forEach(cb => cb.checked = false);
window.history.pushState({}, document.title, window.location.pathname);
cargarProductos(productos);
});
}
const btnToggleFiltros = document.getElementById("btn-toggle-filtros");
const sidebarFiltros = document.querySelector(".shop-sidebar");
if (btnToggleFiltros && sidebarFiltros) {
btnToggleFiltros.addEventListener("click", () => {
sidebarFiltros.classList.toggle("activo");
if (sidebarFiltros.classList.contains("activo")) {
btnToggleFiltros.innerText = "Ocultar Filtros ▴";
} else {
btnToggleFiltros.innerText = "Filtros ▾";
}
});
}
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
