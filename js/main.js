//----------VARIABLES GLOBALES----------
let carrito = []; // Tu canasta vacía
let usuarioLogueado = null; //

// ----------------------imports--------------------------------
import { db, auth } from './firebase-config.js'; 
import { collection, getDocs, getDoc, doc, setDoc, addDoc, serverTimestamp, query, where, orderBy  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Agregamos las funciones de autenticación de Firebase
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. Variable global del formateador
const formateadorARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS'
});

// 2. Función auxiliar para usar en todos lados
function formatearPrecio(precio) {
  return formateadorARS.format(precio);
}

// =================================
// 2. FUNCIONES DE RENDERIZADO (EL MOZO)
// =================================

// Recibe una lista de datos. Si no recibe nada, usa la lista global 'productos'.
function cargarProductos(listaProductos = productos) {
    const contenedor = document.querySelector(".productos");
    
    // Clausula de Guardia: Si no existe el contenedor (ej: estamos en el carrito), cortamos acá.
    if (!contenedor) return; 
    
    // 1. EL BORRADOR: Limpiamos el HTML previo para no duplicar cartas al filtrar.
    contenedor.innerHTML = ""; 

    // 2. ESTADO VACÍO: Si el filtro no devolvió nada, avisamos al usuario.
    if(listaProductos.length === 0){
        contenedor.innerHTML = `
            <section class='error-busqueda'> 
                <h2>No hay productos encontrados con ese nombre o categoria.</h2> 
                <h3>Intenta con otro nombre o categoria</h3>
            </section>
        `;
        return; 
    }

    // 3. DETECCIÓN DE ENTORNO:
    // Averiguamos si estamos en la raíz (index) o en una subcarpeta (pages)
    // para arreglar las rutas de las imágenes y los links.
    const esSubcarpeta = window.location.pathname.includes("pages");
    const prefijoImagen = esSubcarpeta ? "../" : "";
    const rutaProducto = esSubcarpeta ? "producto.html" : "pages/producto.html";

    let lista = "";

    // 4. BUCLE DE RENDERIZADO:
    // Creamos todo el HTML en una variable de texto (es más rápido que tocar el DOM muchas veces)
    listaProductos.forEach(({ id, nombre, precio, imagen }) => {
        
        // Lógica Híbrida: ¿Es imagen de internet (http) o local?
        let rutaImagen = imagen.startsWith("http") ? imagen : prefijoImagen + imagen;
        
        lista += `
        <article class="producto animacion-entrada"> 
            <a href="${rutaProducto}?prod=${id}">
                <img src="${rutaImagen}" alt="${nombre}">
            </a>
            <div class ="info-producto">
                <h3>${nombre}</h3>
                <p class="precio">${formatearPrecio(precio)}</p>
                <p class="envio-info"> Envio a coordinar </p>
                <button class="btn-comprar" onclick="agregarAlCarrito('${id}')">Comprar</button>
            </div>
        </article>`;
    });

    // 5. PINTURA FINAL: Inyectamos todo el HTML de una sola vez.
    contenedor.innerHTML = lista;
}

function actualizarCarritoVisual(){
    const listaHTML = document.getElementById("lista-carrito");
    const totalHTML = document.getElementById("total-carrito");
    const contadorBurbuja = document.getElementById("contador-burbuja");

    if (!totalHTML) return; 
   
    let total = 0;
    listaHTML.innerHTML = "";
    let lista = "";

    carrito.forEach(({id, nombre, precio, cantidad}) => {
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
        // Volví a poner el reduce porque ahora que agrupo los items, 
        // .length dice cuantas FILAS hay, pero reduce dice cuantos PRODUCTOS TOTALES.
        const totalProductos = carrito.reduce((acc, prod) => acc + prod.cantidad, 0);
        contadorBurbuja.innerText = totalProductos;
        
        
        if(totalProductos > 0){
             contadorBurbuja.style.display = "flex";
        } else {
             contadorBurbuja.style.display = "none";
        }
    }
}

/* =================================
   SISTEMA DE NOTIFICACIONES (TOAST)
   ================================= */
function mostrarNotificacion(mensaje, tipo = "exito") {
    
    // 1. Buscamos si ya existe el cartel
    let noti = document.getElementById("mensaje-oculto");

    // 2. Si NO existe, lo creamos (Fábrica de elementos)
    if (!noti) {
        noti = document.createElement("div");
        noti.id = "mensaje-oculto";
        noti.className = "toast";
        document.body.appendChild(noti);
    }

    // 3. Le ponemos el mensaje que vos quieras (Dinámico)
    noti.innerText = mensaje;

    // 4. Manejamos los colores
    if (tipo === "error") {
        noti.classList.add("error"); 
    } else {
        noti.classList.remove("error"); 

    // 5. Lo mostramos (Esperamos 10ms para que la animación se vea bien)
    setTimeout(() => {
        noti.classList.add("activo");
    }, 10);

    // 6. Lo ocultamos a los 3 segundos
    setTimeout(() => {
        noti.classList.remove("activo");
    }, 3000);
}
}

/* =================================
   3. LÓGICA DEL NEGOCIO (CALCULOS Y ACCIONES)
   ================================= */
function agregarAlCarrito(id) {
    // 1. BÚSQUEDA EN BASE DE DATOS (Array global 'productos')
    const productoAgregado = productos.find(producto => producto.id === id);

    const existeEnCarrito = carrito.find(producto => producto.id === id);
    
    // 3. LÓGICA DE NEGOCIO
    if (existeEnCarrito) {

        existeEnCarrito.cantidad++;
    } else {

        const nuevo = { ...productoAgregado, cantidad: 1 };
        carrito.push(nuevo);
    }
    
    // 4. PERSISTENCIA Y UI
    actualizarCarritoVisual();    
    mostrarNotificacion("¡Producto agregado con éxito!");
    
    // Guardamos en LocalStorage para que los datos sobrevivan si el usuario cierra la pestaña (F5).
    guardarCarritoEnStorage();
}

/* =================================
   FUNCIÓN FALTANTE: ELIMINAR
   ================================= */
function eliminarDelCarrito(id) {
    // Filtramos: Nos quedamos con todos los productos MENOS el que queremos borrar
    carrito = carrito.filter(producto => producto.id !== id);

    // Actualizamos la pantalla y el guardado
    actualizarCarritoVisual();
    guardarCarritoEnStorage();
    
    mostrarNotificacion("Producto eliminado 🗑️", "error");
}

/* =================================
   5. PERSISTENCIA (LOCAL STORAGE)
   ================================= */


function guardarCarritoEnStorage(){
    const carritoGuardado = JSON.stringify(carrito);
    localStorage.setItem("carritoGeek", carritoGuardado);
}


function recuperarCarrito(){
    const memoria = localStorage.getItem("carritoGeek");
    
    if(memoria){
        carrito = JSON.parse(memoria);
        actualizarCarritoVisual();
    }
}


/* =================================
   4. INICIALIZACIÓN (ARRANQUE)
   ================================= */
cargarBaseDeDatos() 
recuperarCarrito(); 
manejarFormulario();

/* =================================
   5. LOGICA DE FORMULARIO DE CONTACTO
   ================================= */

function manejarFormulario(){
    //1. Agarramos el formulario
    const formulario = document.getElementById("form-contacto");

    if (!formulario) return;

    formulario.addEventListener("submit", function(evento){

        evento.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const email  =document.getElementById("email").value;
        const mensaje = document.getElementById("mensaje").value;

        if (nombre === "" || email ==="" || mensaje ===""){
            mostrarNotificacion("Por favor, completá todos los campos")
            return;
        }

        mostrarNotificacion(`!Gracias ${nombre}! Hemos recibido tu mensaje`);

     
        formulario.reset();
    });
}

async function finalizarCompra(){
    if(carrito.length === 0){
        mostrarNotificacion(`En tu carrito no hay nada`);
        return;
    }

    const telefono = "5492612451593";
    let mensaje = "Hola GeekHouse! Quiero comprar lo siguiente: \n\n";
    let total = 0;

    // 2-Validacion : Usuario logeado
    //Si no hay usuario en auth, lo echamos.

    if(!usuarioLogueado){
        mostrarNotificacion("Para finalizar la compra necesitas iniciar sesion o registrarte")
        document.getElementById("modal-ingreso").classList.add("activo")
    }

    carrito.forEach(({nombre, precio, cantidad}) => {
        mensaje += `${cantidad} x ${nombre} - ${formatearPrecio(precio)}\n`;
        total += precio * cantidad;
    });

    //Guardado en la nube

    try{
        const pedido = {
            cliente: usuarioLogueado, //el mail del comprador
            items: carrito, //Lo que compro
            total: total, 
            fecha: serverTimestamp(), //La hora oficial de google
            estado: "pendiente", //Para que yo sepa que falta pagar
        }
     
    // Guardamos en la coleccion "pedidos"
        const pedidoGuardado = await addDoc(collection(db, "pedidos"), pedido);
        mensaje += `\n🆔 ID de Pedido: ${pedidoGuardado.id}`;
        mensaje += `\nTotal a pagar: ${formatearPrecio(total)}`;
        mensaje += `\n¿Cómo podemos coordinar el pago y envío?`;

        const mensajeCodificado = encodeURIComponent(mensaje);
        const urlWhatsapp = `https://wa.me/${telefono}?text=${mensajeCodificado}`;

        window.open(urlWhatsapp, "_blank");
            
        carrito = [];
        actualizarCarritoVisual();
        guardarCarritoEnStorage();
    } catch(error){
        console.error("Error al guardar pedido", error);
        mostrarNotificacion("Hubo un error al procesar tu pedido. Intenta de nuevo")
    }
}


// Al agregar producto
localStorage.setItem("carrito", JSON.stringify(carrito));

// Al cargar la página
const carritoGuardado = localStorage.getItem("carrito");
if (carritoGuardado) {
  carrito = JSON.parse(carritoGuardado);
  actualizarCarritoVisual();
}


/* =================================
   6. FILTROS DE BÚSQUEDA
   ================================= */
const inputBusqueda = document.getElementById("input-busqueda");

if(inputBusqueda){
    
    inputBusqueda.addEventListener("keyup", function(evento){
        const textoUsuario = evento.target.value.toLowerCase();

        const productosFiltrados = productos.filter(producto => {
            // 1. Buscamos en el nombre
            const enNombre = producto.nombre.toLowerCase().includes(textoUsuario);
            
            // 2. Buscamos en la categoría (agregamos esto)
            const enCategoria = producto.categoria.toLowerCase().includes(textoUsuario);

            // 3. Buscamos en la franquicia (agregamos esto por si buscan "Marvel")
            // Usamos || "" por si algun producto no tiene franquicia
            const enFranquicia = (producto.franquicia || "").toLowerCase().includes(textoUsuario);

            // RETORNAMOS: Si coincide con ALGUNO de los tres (OR)
            return enNombre || enCategoria || enFranquicia;
        });

        cargarProductos(productosFiltrados);
    });
}


/* =================================
   7. FILTROS POR CATEGORÍA
   ================================= */
//Seleccionamos todos los botones que tengan la clase .btn-cat
const botonesCategorias = document.querySelectorAll(".btn-cat");

// Les damos vida a cada uno
botonesCategorias.forEach(boton =>{
    boton.addEventListener("click", (e)=> {
        //1. Averiguamos que boton se tocó (cat-ropa, cat-hogar, etc)
        const idBoton = e.currentTarget.id;

        if(idBoton ==="cat-todos"){
            cargarProductos(productos) // PAsamos la lista completa
        }else{

            const categoriaSeleccionada = idBoton.slice(4);

            const productosFiltrados = productos.filter(producto => producto.categoria === categoriaSeleccionada);
            cargarProductos(productosFiltrados)
        }
    })
})

/* =================================
   13. CARGAR DETALLE DE PRODUCTO (FIREBASE)
   ================================= */
async function cargarDetalleProducto() {
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
            
            // CORRECCIÓN DE IMAGEN 
            let rutaImagen = producto.imagen;
            
            // Si NO es una url de internet (http), le agregamos "../" para salir de la carpeta pages
            if (!rutaImagen.startsWith("http")) {
                rutaImagen = "../" + rutaImagen;
            }

            // 👇 USAMOS ${rutaImagen} EN VEZ DE ${producto.imagen}
            contenedorDetalle.innerHTML = `
                <div class="detalle-flex">
                        <img src="${rutaImagen}" alt="${producto.nombre}">
                    <div class="detalle-info">
                        <h2>${producto.nombre}</h2>
                        <p class="precio-detalle">$ ${producto.precio}</p>
                        <p class="descripcion">${producto.descripcion || generarDescripcion(producto)}</p>
                        <p class="categoria">Categoría: <span>${producto.categoria}</span></p>
                        
                        <button class="btn-comprar-detalle" onclick="agregarAlCarrito('${docSnap.id}')">
                            Agregar al Carrito 🛒
                        </button>
                    </div>
                </div>
            `;
        } else {
            contenedorDetalle.innerHTML = "<h3>❌ El producto no existe.</h3>";
        }

    } catch (error) {
        console.error("Error:", error);
        contenedorDetalle.innerHTML = "<h3>🔥 Error cargando producto.</h3>";
    }
}
cargarDetalleProducto();



function verificarUsuario() {
    const btnLogout = document.getElementById("btn-logout"); 
    const nombreUsuario = document.getElementById("nombre-usuario");

    // 1. CONFIGURACIÓN DEL LOGOUT
    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            try {
                await signOut(auth);
                mostrarNotificacion("Has cerrado sesión 👋");
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error("Error al salir:", error);
            }
        });
    }

    // 2. EL PATOVICA (Monitor de Estado)
    onAuthStateChanged(auth, (usuario) => {

        const contenedorPerfil = document.getElementById("lista-pedidos");
        const mensajeVisitante = document.getElementById("mensaje-visitante");
        const tituloPerfil = document.getElementById("email-perfil");

        if (usuario) {
         
            console.log("Usuario activo:", usuario.email);
            usuarioLogueado = usuario.email;
            
            document.body.classList.add("sesion-iniciada");

            if(nombreUsuario) nombreUsuario.innerText = `Hola, ${usuario.email}`;
            
            if (contenedorPerfil && mensajeVisitante) {
                contenedorPerfil.style.display = "block"; 
                mensajeVisitante.style.display = "none";  
            }

            mostrarPedidos(usuario.email); 

        } else {
            // --- CASO: INVITADO ---
            console.log("Nadie logueado");
            usuarioLogueado = null;
            document.body.classList.remove("sesion-iniciada");

            // LÓGICA DE PERFIL (Solo switch visual)
            if (contenedorPerfil && mensajeVisitante) {
                if(tituloPerfil) tituloPerfil.innerText = "Visitante";
                
                // OCULTAMOS la lista
                contenedorPerfil.style.display = "none";
                
                // MOSTRAMOS el cartel de error
                mensajeVisitante.style.display = "block";
            }
        }
    });
}



function configurarModal(){
    const btnLogin = document.getElementById("btn-login");
    const btnCerrar = document.getElementById("btn-cerrar"); 
    const fondoOscuro = document.getElementById("modal-ingreso");

    if (btnLogin) {
        btnLogin.addEventListener("click", () => {
            if(fondoOscuro) fondoOscuro.classList.add("activo");
        });
    }

    if (btnCerrar) {
        btnCerrar.addEventListener("click", () => {
            if(fondoOscuro) fondoOscuro.classList.remove("activo");
        });
    }
}
configurarModal();

function logicaLogin(){
    const form = document.getElementById("form-login-cliente");
    
    if (form) {
        form.addEventListener("submit", async function(evento){
            evento.preventDefault();
            const mail = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            
            try {
                const credenciales = await signInWithEmailAndPassword(auth, mail, password);
                
                const modal = document.getElementById("modal-ingreso");
                if(modal) modal.classList.remove("activo");
                
                mostrarNotificacion("¡Hola " + credenciales.user.email + ", ingresaste con éxito!");            
                form.reset();
                
            } catch (error) {
                mostrarNotificacion("Error: " + error.message);
            }
        });
    }
}
logicaLogin();

logicaLogin()

function alternarFormularios(){
    const formLogin = document.getElementById("form-login-cliente");
    const formRegister = document.getElementById("form-register-cliente");
    const linkRegistro = document.getElementById("link-ir-registro");
    const linkLogin = document.getElementById("link-volver-login");

    if (linkRegistro) {
        linkRegistro.addEventListener("click", () => {
            if(formLogin) formLogin.style.display = "none";
            if(formRegister) formRegister.style.display ="flex";
        });
    }

    if (linkLogin) {
        linkLogin.addEventListener("click", () => {
            if(formLogin) formLogin.style.display = "flex";
            if(formRegister) formRegister.style.display ="none";
        });
    }
}
alternarFormularios()

function logicaRegistro(){
    const formRegistrar = document.getElementById("form-register-cliente");
    
    if (formRegistrar) {
        formRegistrar.addEventListener("submit", async function(e){
            e.preventDefault();
            const mail = document.getElementById("email-reg").value;
            const password = document.getElementById("password-reg").value;
            
            try {
                const autenticacion = await createUserWithEmailAndPassword(auth, mail, password);
                mostrarNotificacion("¡Cuenta creada! Bienvenido/a" + autenticacion.user.email)
                
                const modal = document.getElementById("modal-ingreso");
                if(modal) modal.classList.remove("activo");
                
                formRegistrar.reset();
            } catch (error) {
                mostrarNotificacion("Hubo un error:" +error.message)
            }
        });
    }
}
logicaRegistro();

/* =================================
   9. CARGA DE DATOS (FETCH)
   ================================= */

async function cargarBaseDeDatos() {
    try {
        const contenedor = document.querySelector(".productos");

        const productosRef = collection(db, "productos");


        const querySnapshot = await getDocs(productosRef);

 
        const datos = querySnapshot.docs.map(doc => {
            return {
                id: doc.id,       
                ...doc.data()     
            };
        });

        console.log("✅ Productos recibidos:", datos);

        productos = datos;


        const esPaginaProductos = window.location.pathname.includes("pages");

        if (contenedor) {
                const esPaginaProductos = window.location.pathname.includes("pages");

                if (esPaginaProductos) {
                    cargarProductos(productos);
                } else {
                    const soloDestacados = productos.filter(p => p.destacado === true);
                    cargarProductos(soloDestacados);
                
                    const filtros = document.querySelector(".filtros"); 
                    if(filtros) filtros.style.display = "none";
                }
        }
        cargarDetalleProducto();
        renderizarFranquicias();

    } catch (error) {
        console.error("🔥 Error conectando a Firebase:", error);
        
        const contenedor = document.querySelector(".productos");
        if(contenedor){
            contenedor.innerHTML = "<h2> Hubo un error cargando los productos desde la nube. </h2>";
        }
    }
}

/* =================================
   10. FILTROS DINÁMICOS (FRANQUICIAS)
   ================================= */
function renderizarFranquicias() {
    const contenedor = document.getElementById("contenedor-franquicias");
    
    // Si no existe el contenedor (por ejemplo en otra página), cortamos acá
    if (!contenedor) return;

    // 1. Limpiamos lo que haya antes de dibujar
    contenedor.innerHTML = "";

    // === BOTÓN "BORRAR FILTROS" (INTELIGENTE) ===
    const btnBorrar = document.createElement("button");
    btnBorrar.innerText = "Borrar Filtros";
    btnBorrar.classList.add("btn-franquicia"); 
    
    // Estilos visuales para diferenciarlo (Rojo/Negro)
    btnBorrar.style.borderColor = "#ff5252"; 
    btnBorrar.style.background = "black";
    btnBorrar.style.color = "#ff5252";

    btnBorrar.addEventListener("click", () => {
        
        // A. Limpieza Visual: Sacamos la clase 'activo' de cualquier otro botón
        document.querySelectorAll(".btn-franquicia.activo").forEach(btn => btn.classList.remove("activo"));

        // B. Lógica de Redibujado según la página
        const esPaginaProductos = window.location.pathname.includes("pages");

        if (esPaginaProductos) {
            // CASO 1: Estoy en el Catálogo -> Muestro TODO
            cargarProductos(productos);
        } else {
            // CASO 2: Estoy en el Home -> Muestro SOLO DESTACADOS
            const soloDestacados = productos.filter(p => p.destacado === true);
            cargarProductos(soloDestacados);
        }
    });

    // Lo agregamos PRIMERO a la lista
    contenedor.appendChild(btnBorrar);


    // === BOTONES DE LAS FRANQUICIAS (AUTOMÁTICOS) ===
    const franquiciasSucias = productos.map(producto => producto.franquicia);
    // Usamos Set para eliminar duplicados
    const franquiciasUnicas = [...new Set(franquiciasSucias)];

    franquiciasUnicas.forEach(franquicia => {
        if(franquicia){
            const btn = document.createElement("button");
            btn.innerText = franquicia;
            btn.classList.add("btn-franquicia");
            
            btn.addEventListener("click", () => {
                // Visual: Marcamos este botón como activo y desmarcamos el resto
                document.querySelectorAll(".btn-franquicia").forEach(b => b.classList.remove("activo"));
                btn.classList.add("activo");

                // Lógica: Filtramos los productos
                const productosFiltrados = productos.filter(p => p.franquicia === franquicia);
                cargarProductos(productosFiltrados);
            });
            
            contenedor.appendChild(btn);
        }
    });
}

//10. AÑADIR DESCRIPCION AUTOMATICA

// Recibe UN producto por parámetro (no recorre todo el array)
function generarDescripcion(producto) {
    
    // Paso el nombre a minúsculas una sola vez para no repetir código
    // Uso || "" por si algún producto no tiene nombre y evitar error
    const nombre = (producto.nombre || "").toLowerCase();

    // 1. MEDIAS
    // Uso .includes() este metodo es igual a un IN en python
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

    // 2. FUNKO 
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

    // 3. FIGURAS 
    else if (nombre.includes("llavero")){
        return `
           <ul class="descripcion-producto">
            <li>Llavero inspirado en la cultura geek y personajes icónicos</li>
            <li>Un detalle ideal para llevar tu fandom a todos lados</li>
            <li>Perfecto para mochilas, llaves o accesorios</li>
            <li>Diseño pensado para fans del universo geek</li>
            <li>Pequeño, práctico y lleno de personalidad</li>
        </ul>`;
    }

    // 4. LLAVEROS
    else if (nombre.includes("figura")) {
        return `
            <ul class="descripcion-producto">
                <li>Figura coleccionable basada en el universo de Naruto </li>
                <li>Diseñada para destacar en cualquier lado</li>
                <li>Ideal para fans del Animé</li>
                <li>Perfecta para exhibir en escritorios o estanterías</li>
            </ul>`;
    }
    
    // 5. TAZAS
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

    // 6. DEFAULT (Si no encontró ninguna palabra clave)
    return `
    <ul class="descripcion-producto">
        <li>Producto oficial de GeekHouse</li>
        <li>Excelente calidad garantizada</li>
        <li>Envios a todo el país</li>
        <li>Compra protegida y segura</li>
    </ul>`;
}


const imagenesHero = [
    "./img/banner-star-wars.jpg",
    "./img/banner-naruto.jpg",
    "./img/banner-marvel.jpeg"
];

let indiceActual = 0;
const imagenElemento = document.getElementById("imagen-hero");

function cambiarImagen() {
    if (!imagenElemento) return; // Protección por si no estoy en el home

    // 1. Calculo cuál sigue (si se llega al final, se vuelve a 0)
    indiceActual = (indiceActual + 1) % imagenesHero.length;

    // 2. Cambio la foto
    // Truco visual: Bajo opacidad, cambio foto, subo opacidad
    imagenElemento.style.opacity = 0;
    
    setTimeout(() => {
        imagenElemento.src = imagenesHero[indiceActual];
        imagenElemento.style.opacity = 1;
    }, 500); // Se espera medio segundo para cambiarla
}

// 3. Actio el reloj automático (cada 4 segundos)
setInterval(cambiarImagen, 4000);

/* === LOGICA TOGGLE CARRITO === */
function toggleCarrito() {
    const carritoContainer = document.getElementById("carrito-container");
    // Esto pone y saca la clase .oculto automáticamente
    carritoContainer.classList.toggle("oculto");
}

/* ================= FUNCION PARA MOVER CARRUSEL ================= */
function moverCarrusel(idContenedor, direccion) {
    // 1. Buscamos el elemento por su ID
    const contenedor = document.getElementById(idContenedor);
    
    // Si no existe (por ejemplo en otra página), no hacemos nada
    if (!contenedor) return;

    // 2. Definimos cuánto vamos a mover (aprox el ancho de una tarjeta + espacio)
    const anchoTarjeta = 270; 
    
    // 3. Calculamos la nueva posición
    if (direccion === 'izquierda') {
        contenedor.scrollBy({ left: -anchoTarjeta, behavior: 'smooth' });
    } else {
        contenedor.scrollBy({ left: anchoTarjeta, behavior: 'smooth' });
    }
}


/* =========================================
   EXPOSICIÓN GLOBAL (Para que el HTML las vea)
   ========================================= */
// 1. Funciones de Compra y Carrito
window.agregarAlCarrito = agregarAlCarrito; 
window.eliminarDelCarrito = eliminarDelCarrito; 
window.finalizarCompra = finalizarCompra;       
window.toggleCarrito = toggleCarrito;           

// 2. Funciones de Renderizado y Navegación
window.moverCarrusel = moverCarrusel;
window.cargarProductos = cargarProductos;       
window.renderizarFranquicias = renderizarFranquicias;




/* =================================================
   10.5 FUNCIÓN DESCARTABLE: CARGA MASIVA DE DATOS
   ================================================= */
async function subirDatosAFirebase() {
    // 1. Pedimos confirmación para no hacer macanas
    const confirmar = confirm("⚠️ ¿Estás seguro de que querés subir TODOS los productos del JSON a Firebase? Esto va a sobrescribir lo que haya.");
    if (!confirmar) return;

    console.log("🚀 Iniciando carga masiva...");

    try {
        // 2. Leemos el archivo local (como hacíamos antes)
        const respuesta = await fetch('./datos/productos.json');
        const datosLocales = await respuesta.json();

        // 3. Recorremos uno por uno y lo mandamos a la nube
        for (const producto of datosLocales) {
                    
                    // 👇 PASO MAGICO: Limpiamos el ID por si tiene barras prohibidas "/"
                    // Esto cambia "medias-3/4" por "medias-3-4"
                    const idLimpio = producto.id.replace(/\//g, "-");

                    // Usamos el ID limpio para la referencia
                    const referencia = doc(db, "productos", idLimpio);
                    
                    // Subimos la info (y nos aseguramos de guardar el ID limpio adentro también)
                    await setDoc(referencia, { ...producto, id: idLimpio });
                    
                    console.log(`✅ Producto subido: ${producto.nombre}`);
                }

        console.log("✨ ¡TERMINADO! Todos los productos están en la nube.");
        alert("Carga completa. Ahora recargá la página.");

    } catch (error) {
        console.error("Error en la migración:", error);
    }
}

// Hacemos la función pública para poder llamarla desde la consola
window.subirDatosAFirebase = subirDatosAFirebase;

/* =================================
   11. PERFIL DE USUARIO
   ================================= */

async function cargarHistorial() {
    const contenedor = document.getElementById("lista-pedidos");
    if (!contenedor) return; // Si no estoy en perfil.html, me voy.

}

// ESTA ES LA FUNCIÓN QUE HACE EL TRABAJO
async function mostrarPedidos(emailUsuario) {
    const contenedor = document.getElementById("lista-pedidos");
    const emailPerfil = document.getElementById("email-perfil");
    
    if (!contenedor) return;

    // Actualizamos el título con el email
    if(emailPerfil) emailPerfil.innerText = emailUsuario;
    

    try {
        contenedor.innerHTML = "<p>Cargando pedidos...</p>";

        const pedidosRef = collection(db, "pedidos");
        
        const q = query(
            pedidosRef, 
            where("cliente", "==", emailUsuario),
            orderBy("fecha", "desc") // Ordenar por fecha (más nuevo arriba)
        );

        // 2. Ejecutamos la consulta
        const querySnapshot = await getDocs(q);

        // 3. Si no hay nada
        if (querySnapshot.empty) {
            contenedor.innerHTML = "<h3>Todavía no hiciste compras. ¡Andá al catálogo! 🛍️</h3>";
            return;
        }

        // 4. Dibujamos los pedidos
        let html = "";
        
        querySnapshot.forEach((doc) => {
            const pedido = doc.data();
            const fecha = pedido.fecha ? pedido.fecha.toDate().toLocaleDateString() : "Fecha desconocida";
            
            // Armamos la lista de items de este pedido
            let itemsHtml = "";
            pedido.items.forEach(item => {
                itemsHtml += `<li>${item.cantidad} x ${item.nombre} (${formatearPrecio(item.precio)})</li>`;
            });

            html += `
            <div class="pedido-card">
                <div class="pedido-header">
                    <span>Pedido #${doc.id.slice(0, 6)}...</span> <span class="fecha-pedido">${fecha}</span>
                </div>
                <div class="items-pedido">
                    <ul>${itemsHtml}</ul>
                </div>
                <div class="total-pedido">
                    Total: ${formatearPrecio(pedido.total)}
                    <span class="estado-pendiente">${pedido.estado.toUpperCase()}</span>
                </div>
            </div>
            `;
        });

        contenedor.innerHTML = html;

    } catch (error) {
        console.error("Error trayendo pedidos:", error);
        // A veces falla el orderBy si no cree el índice en Firebase 
        contenedor.innerHTML = "<p>Hubo un error cargando el historial.</p>";
    }
}

verificarUsuario()

// Actualizacion forzada del carrito