// const { act } = require("react");

//----------VARIABLES GLOBALES----------
let carrito = []; // Tu canasta vacía


/* =================================
   2. FUNCIONES DE RENDERIZADO (MOSTRAR COSAS)
   ================================= */
// Aceptamos la lista que nos manden. Si no mandan nada, usamos 'productos'
function cargarProductos(listaProductos = productos) { 
    const contenedor = document.querySelector(".productos");
    
    if (!contenedor) return;

    // IMPORTANTE: Limpiamos el contenedor antes de dibujar
    // (Si no hacemos esto, los productos filtrados se suman abajo de los viejos)
    contenedor.innerHTML = ""; 

    let lista = "";

    const esSubcarpeta = window.location.pathname.includes("pages");
    const prefijoImagen = esSubcarpeta ? "../" : "";

    // AQUI ESTABA EL ERROR:
    // Antes decia: productos.forEach...
    // Ahora debe decir: listaProductos.forEach...
    listaProductos.forEach(producto => {    // 👈 CAMBIO CLAVE
        lista += `
        <article> 
            <img src="${prefijoImagen + producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p class="precio">$${producto.precio}</p>
            <button class="producto-btn" onclick="agregarAlCarrito('${producto.id}')">Comprar</button>
        </article>`;
    });

    contenedor.innerHTML = lista;
}

function actualizarCarritoVisual(){
    //1. Aca creamos una variable listaHTML y le asignamos y le pedimos al js que interactue en el elemento lista-carrito que en este caso es una ul
    const listaHTML = document.getElementById("lista-carrito");
    // 2. Aca tmb creamos una variable y  le pedimos que interactue sobre el elemento total-carrito que es un span donde esta el precio
    const totalHTML = document.getElementById("total-carrito");
    //3. Creamos una variable let que es flexible y puede cambiar en diferencia de const
    let total = 0
    // 4. Limpiamos lo que hay dentro de de lista-carrito con el elemento vacio "" y el inner
    listaHTML.innerHTML="";
    //5. Recorremos el carrito y creamos los <li>

    carrito.forEach(producto =>{
        //6. En este bucle vamos añadiendo los elementos que creamos en el array de arriba, para agregarlos a la variable listaHTML
        listaHTML.innerHTML+= `
        <li>
        ${producto.nombre} - ${producto.precio}
        </li>
        `;
        //7. La variable total va aumentando su precio a medida que una iteracion termine
        total += producto.precio;
    });
    // 8. Actualizamos la variable totalHTML dandole el valor de la variable total
    totalHTML.innerText = total;
}

function mostrarNotificacion(){
    let noti = document.getElementById("mensaje-oculto")
    noti.classList.remove("oculto")
    setTimeout(() => {
    // Lo que pasa cuando suena la alarma
    noti.classList.add("oculto");
}, 3000); 
}
function alternarCatalogo() {
    const contenedor = document.querySelector('.productos');
    if (contenedor.style.display === 'none') {
        contenedor.style.display = 'flex';
    } else {
        contenedor.style.display = 'none';
    }
}
/* =================================
   3. LÓGICA DEL NEGOCIO (CALCULOS Y ACCIONES)
   ================================= */

/* =================================
   3. LÓGICA DEL NEGOCIO
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
cargarProductos(); 
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
        //Aca podrias usar tu funcion mostrarNotificacion si la haces generica, 
        // O un simple alert por ahora.

        alert(`!Gracias ${nombre}! Hemos recibido tu mensaje.`);

        // 7. Limpiamos el formulario
        formulario.reset();
    });
}

//Agrega esta llamada al final del archivo junto a cargarProducto()
manejarFormulario()


function finalizarCompra(){
    //1. Nos fijamos si en el carrito hay elementos
    if(carrito.length ===0){
        alert(`Ên tu carrito no hay nada`);
        return;
    }

    //2. Si hay elementos finalizamos la compra
    alert(`¡Compra realizada con éxito!`)

    //3. Vaciamos el carrito
    carrito = []

    // 4.Actualizamos la pantalla
    actualizarCarritoVisual()

    //.5 Actualizamos el storage(Ahora se guarda una lista vacia)
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

// PRUEBA 1: ¿Encontró el input?
console.log("El input existe?", inputBusqueda); 

if(inputBusqueda){
    inputBusqueda.addEventListener("keyup", function(evento){
        const textoUsuario = evento.target.value.toLowerCase();
        
        // PRUEBA 2: ¿Detecta lo que escribo?
        console.log("Usuario escribió:", textoUsuario);

        const productosFiltrados = productos.filter(producto => {
            return producto.nombre.toLowerCase().includes(textoUsuario);
        });

        // PRUEBA 3: ¿Cuántos productos quedaron?
        console.log("Productos encontrados:", productosFiltrados);

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

