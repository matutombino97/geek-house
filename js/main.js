// const { act } = require("react");

//----------VARIABLES GLOBALES----------
let carrito = []; // Tu canasta vacía

// Hacer funcion para reutilizar el formatear precio con new.

/* =================================
   2. FUNCIONES DE RENDERIZADO (MOSTRAR COSAS)
   ================================= */
// Acepta la lista que recibo como parametro. Si hay, usamos 'productos'
function cargarProductos(listaProductos = productos) {
    const contenedor = document.querySelector(".productos");
    if (!contenedor) return;
    
    contenedor.innerHTML = ""; 

    let lista = "";

    if(listaProductos.length === 0){
        contenedor.innerHTML = `
            <section class = 'error-busqueda'> <h2> No hay productos encontrados con ese nombre o categoria D: </h2> 
            <h3> Intenta con otro nombre o categoria </h3>
            </section>
        `
        return 
    }
    // DETECTAMOS DÓNDE ESTAMOS
    const esSubcarpeta = window.location.pathname.includes("pages");
    // 1. Ajuste para IMÁGENES
    const prefijoImagen = esSubcarpeta ? "../" : "";
    // 2. Ajuste para ENLACES 
    // Si ya estamos en 'pages', el link es directo. Si no, agregamos 'pages/'
    const rutaProducto = esSubcarpeta ? "producto.html" : "pages/producto.html";

    listaProductos.forEach(producto => {
        lista += `
        <article class="producto animacion-entrada"> 
            <a href="${rutaProducto}?prod=${producto.id}">
                <img src="${prefijoImagen + producto.imagen}" alt="${producto.nombre}">
            </a>
            <div class ="info-producto">
                <h3>${producto.nombre}</h3>
                <p class="precio">${new Intl.NumberFormat('es-AR',{
                    style: 'currency', currency: 'ARS'}).format(producto.precio)}</p>
                <p class="envio-info"> Envio a coordinar </p>
                <button class="btn-comprar" onclick="agregarAlCarrito('${producto.id}')">Comprar</button>
            </div>
        </article>`;
    });


    contenedor.innerHTML = lista;
}

function actualizarCarritoVisual(){

    //1. Aca creamos una variable listaHTML y le asignamos y le pedimos al js que interactue en el elemento lista-carrito que en este caso es una ul
    const listaHTML = document.getElementById("lista-carrito");
    // 2. Aca tmb creamos una variable y  le pedimos que interactue sobre el elemento total-carrito que es un span donde esta el precio
    const totalHTML = document.getElementById("total-carrito");

    const contadorBurbuja = document.getElementById("contador-burbuja");
      //  EL FRENO DE SEGURIDAD 
    // Si no existe el elemento en esta página, cortamos la función acá.
    if (!totalHTML) return; 
   
    //3. Creamos una variable let que es flexible y puede cambiar en diferencia de const
    let total = 0
    
    // 4. Limpiamos lo que hay dentro de de lista-carrito con el elemento vacio "" y el inner
    listaHTML.innerHTML="";

    let lista = ""
    //5. Recorremos el carrito y creamos los <li>

    carrito.forEach(producto =>{
        //6. En este bucle vamos añadiendo los elementos que creamos en el array de arriba, para agregarlos a la variable listaHTML
        lista+= `
            <li>
                <div class='informacion-carrito'>
                ${producto.nombre} - ${new Intl.NumberFormat('es-AR', {style: 'currency', currency: 'ARS'}).format(producto.precio)}
                </div>
                <button class='btn-eliminar' onclick="eliminarDelCarrito('${producto.id}')">X</button>
            </li>
        `;
        //7. La variable total va aumentando su precio a medida que una iteracion termine
        total += producto.precio;
    });
    // 8. Actualizamos la variable totalHTML dandole el valor de la variable total
    totalHTML.innerText = new Intl.NumberFormat('es-AR', {style: 'currency', currency: 'ARS'}).format(total);
    listaHTML.innerHTML=lista;
    if (contadorBurbuja) {
        // Cuenta cuántos productos tenés en total (sumando cantidades)
        const totalProductos = carrito.reduce((acc, prod) => acc + prod.cantidad, 0);
        contadorBurbuja.innerText = totalProductos;
        
        // Opcional: Si es 0, ocultamos la burbuja roja
        if(totalProductos > 0){
             contadorBurbuja.style.display = "flex";
        } else {
             contadorBurbuja.style.display = "none";
        }
    }
}

function mostrarNotificacion(){
    let noti = document.getElementById("mensaje-oculto")
    noti.classList.remove("oculto")
    setTimeout(() => {
    // Lo que pasa cuando suena la alarma
    noti.classList.add("oculto");
}, 3000); 
}

/* =================================
   3. LÓGICA DEL NEGOCIO (CALCULOS Y ACCIONES)
   ================================= */

function agregarAlCarrito(id) {
    // 1. Buscamos el producto
    const productoAgregado = productos.find(producto => producto.id === id);
    
    // 2. Metemos el producto ADENTRO del carrito
    carrito.push(productoAgregado);
    
    // 3. Mostramos feedback y guardamos
    actualizarCarritoVisual();    
    mostrarNotificacion();
    guardarCarritoEnStorage();
} // 

function eliminarDelCarrito(id){
    //1. Buscamos en que posicion se encuentra el producto con el id recibido
    //findex devuelve el numero de asiento (0,1,2...) o -1 si no esta.
    const indice = carrito.findIndex(producto => producto.id === id);

    //2. Si lo encontro(Osea si el indice no es -1)

    if(indice !==-1){
        //3 Usamos la tijera (splice) je
        //(posicion, cantidad_a_borrar) -> borramos un solo elemento
        carrito.splice(indice,1);
    }

    //4. Actualizamos todo(Vista y memoria)
    actualizarCarritoVisual();
    guardarCarritoEnStorage();
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
// cargarProductos(); Ya no se usa, asique la comento de recuerdo
cargarBaseDeDatos() //Ahora arranco pidiendo los datos
recuperarCarrito(); 
manejarFormulario();

/* =================================
   5. LOGICA DE FORMULARIO DE CONTACTO
   ================================= */

function manejarFormulario(){
    //1. Agarramos el formulario
    const formulario = document.getElementById("form-contacto");

    // Si no existe el formulario(Estamos en el home), frenamos.
    if (!formulario) return;

    //2. Escuchamos al evento "submit"(Cuando tocan enviar o Enter)
    formulario.addEventListener("submit", function(evento){

        //3. ¡STOP! Evitamos que la pagina se recargue
        evento.preventDefault();

        //4. Agarramos los datos de los inputs

        const nombre = document.getElementById("nombre").value;
        const email  =document.getElementById("email").value;
        const mensaje = document.getElementById("mensaje").value;

        //5. Validacion simple (aunque el HTML 'required' ya ayuda)

        if (nombre === "" || email ==="" || mensaje ===""){
            alert("Por favor, completá todos los campos");
            return;
        }
        //6.Simulacion de exito
        //Aca podriamos usar la funcion mostrarNotificacion.
        // O un simple alert por ahora.

        alert(`!Gracias ${nombre}! Hemos recibido tu mensaje.`);

        // 7. Limpiamos el formulario
        formulario.reset();
    });
}

function finalizarCompra(){
    //1. Nos fijamos si en el carrito hay elementos
    if(carrito.length ===0){
        alert(`Ên tu carrito no hay nada`);
        return;
    }

    //2 Defino mi numero de telefono
    const telefono = "5492612451593";

    //3. Empiezo a armar el mensaje
    let mensaje = "Hola GeekHouse! Quiero comprar lo siguiente: \n\n";
    let total = 0;

    //4. Recorremos el carrito para agregar producto por producto al texto
    carrito.forEach(producto =>{
        mensaje += `1x ${producto.nombre} - ${new Intl.NumberFormat('es-AR', {
            style: 'currency', currency: 'ARS'}).format(producto.precio)}\n`;
        total += parseInt(producto.precio);
    })

    //5. Agregamos el monto final al mensaje
    mensaje += `\n Total a pagar: $${total}`;
    mensaje += `\n\n¿Cómo podemos coordinar el pago y envío?`;

    //6. Convertimos el texto a formato URL
    // encodeURIComponent cambio los espacios por %20, los enters por %0A, etc.
    const mensajeCodificado = encodeURIComponent(mensaje);

    //7.Creamos el link final de Whatsapp API
    const urlWhatsapp = `https://wa.me/${telefono}?text=${mensajeCodificado}`;

    //8. Abrimos WhattsApp en una pestaña nueva
    window.open(urlWhatsapp, "_blank");

    //9. Vaciamos el carrito
    carrito = []

    //10.Actualizamos la pantalla
    actualizarCarritoVisual()

    //11. Actualizamos el storage(Ahora se guarda una lista vacia)
    guardarCarritoEnStorage();
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

        //2. Si tocó "Todos" mostramos todo
        if(idBoton ==="cat-todos"){
            cargarProductos(productos) // PAsamos la lista completa
        }else{
            //3 Si toco otro, filtramos
            // El ID del boton es "cat-ropa" pero la categoria es "ropa"
            //Usamos .slice(4) para borrar los primeros 4 caracteres
            const categoriaSeleccionada = idBoton.slice(4);

            const productosFiltrados = productos.filter(producto => producto.categoria === categoriaSeleccionada);
            cargarProductos(productosFiltrados)
        }
    })
})


/* =================================
   8. LÓGICA DE PÁGINA DE DETALLE
   ================================= */

// 1. Preguntamos: ¿Estamos en la página de detalle?
// Buscamos si existe el div con id "detalle-producto"
function cargarDetalle(){
    const contenedorDetalle = document.getElementById("detalle-producto");

    if (contenedorDetalle) {
        // 2. Leemos "el papelito" de la URL
        const params = new URLSearchParams(window.location.search);
        const idProducto = params.get("prod"); // "prod" es el nombre que pusimos en el enlace
        // 3. Buscamos el producto en nuestro array (igual que en el carrito)
        const productoEncontrado = productos.find(p => p.id === idProducto);

        // 4. Si existe, lo dibujamos en GRANDE
        if (productoEncontrado) {
            contenedorDetalle.innerHTML = `
             <h1>${productoEncontrado.nombre}</h1>
                <div class="detalle-flex">
                    <img src="../${productoEncontrado.imagen}" alt="${productoEncontrado.nombre}">
                    <div class="detalle-info">
                        <p class="categoria">Categoría: ${productoEncontrado.categoria}</p>
                        <p class="precio-grande">${new Intl.NumberFormat('es-AR',{style: 'currency', currency: 'ARS'}).format(productoEncontrado.precio)}</p>
                        <div class="descripcion-container"> 
                         ${generarDescripcion(productoEncontrado)}
                        <div>
                    </div>
                </div>
                <button class="btn-comprar" onclick="agregarAlCarrito('${productoEncontrado.id}')">Comprar Ahora</button>
            `;
        } else {
            contenedorDetalle.innerHTML = "<h2>Producto no encontrado 😢</h2>";
        }
    }
}


/* =================================
   9. CARGA DE DATOS (FETCH)
   ================================= */

async function cargarBaseDeDatos(){
    try{
        //1. Defino la ruta(GPS): Donde esta el archivo json?
        //Si estamos en 'pages' salimos una carpeta. Si no, entramos directo.
        const esSubcarpeta = window.location.pathname.includes("pages");
        const ruta = esSubcarpeta ? "../datos/productos.json" : "./datos/productos.json";

        //2 FETCH: "Hola servidor (o archivo), traeme los datos"
        //El 'await' le dice al codigo: "Frena aca hasta que responda el archivo"
        const respuesta = await fetch(ruta);

        //3 convertimos la respuesta (texto plano) en JSON (objetos reales)
        const datos = await respuesta.json();
        //4. Guardamos los datos que llegaron en nuestra variable global "productos"(la que dejamos vacia en productos.js)
        productos = datos;
        // 1. Averiguamos dónde estamos parado
        const esHome = window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("geek-house/"); // Ajuste para GitHub Pages
        const esPaginaProductos = window.location.pathname.includes("productos.html");

        if (esHome) {
            // A. ESTOY EN HOME: Solo quiero los VIP
            // Filtramos solo los que en el JSON dicen "destacado": true
            const soloDestacados = productos.filter(producto => producto.destacado === true);
            
            // Le mandamos al albañil SOLO la lista filtrada
            cargarProductos(soloDestacados);
            
            // Truco: Ocultamos los filtros de categoría en el home porque confunden
            const filtros = document.querySelector(".filtros"); 
            if(filtros) filtros.style.display = "none";

        } else {
            // B. ESTOY EN PRODUCTOS (u otro lado): Quiero TODO
            cargarProductos(productos);
        }
        //5 Ahora si, que ya llegaron los datos dibujamos la web
        cargarDetalle();
        renderizarFranquicias();

        // Mas pro ah, si hay algo en el carrito actualizamos nombres/precios por si cambiaron
        //recuperarCarrito() // Lo vemos mas adelante
    } catch(error){
        //Esto se eejcuta si el archivo no existe o hay un error de internet
        console.error("¡Upsss! Error cargando base de datos:", error);

        //Feedback para el usuario si falla todo
        const contenedor = document.querySelector(".productos");
        if(contenedor){
            contenedor.innerHTML = "<h2> Hubo un error cargando los productos. Intenta mas tarde. </h2>"
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
    const nombre = producto.nombre.toLowerCase(); 

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