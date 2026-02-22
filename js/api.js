import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { cargarProductos, renderizarFranquicias, cargarDetalleProducto } from './main.js'; // Importamos de main ya que alli estan exportadas para global y dependen de base
import { productos } from './main.js';

export async function cargarBaseDeDatos() {
    try {
        const contenedor = document.querySelector(".productos");
        const productosRef = collection(db, "productos");

        // --- 1. AÑADIMOS EL ESTADO DE CARGA VISUAL AQUÍ ---
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="skeleton-loader">
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                </div>
            `;
        }

        const querySnapshot = await getDocs(productosRef);

        const datos = querySnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            };
        });

        // 2. Mezcla Aleatoria (Fisher-Yates Shuffle) para no mostrar siempre el mismo orden
        for (let i = datos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [datos[i], datos[j]] = [datos[j], datos[i]];
        }

        // 3. Mutar la variable importada productos vaciando e insertando
        productos.length = 0;
        datos.forEach(d => productos.push(d));
        console.log("✅ Productos recibidos:", productos);

        const esPaginaProductos = window.location.pathname.includes("pages");

        if (contenedor) {
            if (esPaginaProductos) {
                // Leer si la URL trae '?franquicia=Naruto'
                const urlParams = new URLSearchParams(window.location.search);
                const franquiciaFiltro = urlParams.get('franquicia');

                if (franquiciaFiltro) {
                    const productosFiltrados = productos.filter(p => p.franquicia === franquiciaFiltro);
                    cargarProductos(productosFiltrados);
                } else {
                    cargarProductos(productos);
                }
            } else {
                const soloDestacados = productos.filter(p => p.destacado === true);
                cargarProductos(soloDestacados);

                const filtros = document.querySelector(".filtros");
                if (filtros) filtros.style.display = "none";
            }
        }
        cargarDetalleProducto();
        renderizarFranquicias();

    } catch (error) {
        console.error("🔥 Error conectando a Firebase:", error);

        const contenedor = document.querySelector(".productos");
        if (contenedor) {
            contenedor.innerHTML = "<h2> Hubo un error cargando los productos desde la nube. </h2>";
        }
    }
}
