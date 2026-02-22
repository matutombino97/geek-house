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
                <div style="width: 100%; text-align: center; padding: 80px 20px; grid-column: 1 / -1;">
                    <h2 style="color: var(--color-neon); font-size: 2.2rem; margin-bottom: 10px;">
                        ⏳ Abriendo la bóveda Geek...
                    </h2>
                    <p style="color: var(--color-texto-mutado); font-size: 1.1rem;">Buscando coleccionables por todo el multiverso...</p>
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

        // 2. Ordenamiento Consistente Pseudo-Aleatorio (Por Sesión/Cliente): 
        // Generamos una mezcla aleatoria la primera vez que un cliente entra usando Fisher-Yates.
        // Guardamos ese nuevo orden de IDs en su navegador (localStorage).
        // Si el cliente recarga, lee los IDs guardados y fuerza a la BBDD a respetar ese orden.

        const ordenGuardadoJSON = localStorage.getItem("orden_catalogo_geekhouse");

        if (ordenGuardadoJSON) {
            // Ya tiene un layout mezclado asociado a su equipo, lo forzamos a recrearlo
            const ordenGuardado = JSON.parse(ordenGuardadoJSON);
            datos.sort((a, b) => {
                const indiceA = ordenGuardado.indexOf(a.id);
                const indiceB = ordenGuardado.indexOf(b.id);
                // Si encontramos productos nuevos no guardados en memoria, los mandamos al final
                return (indiceA === -1 ? 999 : indiceA) - (indiceB === -1 ? 999 : indiceB);
            });
        } else {
            // Primera vez del cliente: Mezclamos al azar y guardamos su "Semilla"
            for (let i = datos.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [datos[i], datos[j]] = [datos[j], datos[i]];
            }
            const nuevoOrdenIDs = datos.map(prod => prod.id);
            localStorage.setItem("orden_catalogo_geekhouse", JSON.stringify(nuevoOrdenIDs));
        }

        // 3. Mutar la variable importada productos vaciando e insertando
        productos.length = 0;
        datos.forEach(d => productos.push(d));
        console.log("✅ Productos recibidos:", productos.length);

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
