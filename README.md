#  GeekHouse E-commerce v1.0 

Bienvenido al repositorio oficial de **GeekHouse**, una plataforma de comercio electrónico de nicho diseñada para coleccionistas. La aplicación simula una experiencia de tienda online "Premium", construida bajo un esquema moderno de rendimiento y estética Inmersiva (Glassmorphism & Neon).

**[Visitar el E-commerce en Vivo (Demo)](https://matutombino97.github.io/geek-house/index.html)**

## Arquitectura y Tecnologías
La versión 1.0 dejó de ser un proyecto Maquetado Estático para convertirse en una **Web App Dinámica**.
*   **HTML5 & CSS3:** Maquetación Inmersiva con variables globales (`var()`), efectos de vidrio esmerilado (`backdrop-filter`) y diseño completamente Responsivo (Mobile First y Media Queries a 768px y 480px).
*   **JavaScript Vanilla (ES6+):** Motor central (`main.js`). Lógica de Paginación Matemática, manipulación asíncrona avanzada del DOM y delegación de eventos. Todo fue **Modularizado** (Separado en módulos nativos) para tolerancia a fallos.
*   **Firebase 10:** 
    *   **Firestore Database:** Base de datos NoSQL en tiempo real para albergar el catálogo, inyectar reseñas de usuarios y almacenar los Historiales de Compras.
    *   **Firebase Authentication:** Sistema de Autenticación para Logs, Registros y control de privacidad (Ej: Sólo usuarios dueños pueden borrar sus reviews).
*   **LocalStorage:** Persistencia híbrida para que el sistema de "Favoritos" y "Carrito de Compras" permanezcan cargados aún si se cierra el navegador offline.

## Funcionalidades Clave

1.   **Bóveda Dinámica (Carga Aleatoria):** El catálogo de productos se recibe desde Firebase y se mezcla algorítmicamente (*Fisher-Yates Shuffle*) asegurando que la grilla frontal de los Funkos y mercancías sea visualmente fresca en cada recarga.
2.   **Motor de Búsqueda y Multi-Filtro 'Live':** Sistema Javascript combinando *Map* y *Filter* que procesa Input de Texto + Rango de Precio Mín/Max + Sistema Categórico/Franquicia de Checkbox, todo procesado en tiempo real sin tocar ningún botón.
3.   **Interacción de Reviews:** Sistema 100% dinámico protegido por Firebase Auth. Creación de componentes de UI donde cada usuario puede opinar, editar (*Custom Modal*) o borrar sus propios registros.
4.   **Generación de Órdenes:** Envoltura matemática en el Carrito de Compras (Gestión de duplicados y sumas), empaquetamiento del Objeto y guardado en Base de Datos para el Historial del Perfil, para culminar con la redirección directa al número de WhatsApp de Ventas de la empresa con los detalles del pedido pre-armados.

## Captura de Pantalla

*Screenshot 1: Catálogo Principal con diseño Glassmorphism y barra de Búsqueda inteligente.*
<img src="https://matutombino97.github.io/geek-house/img/geekhouse2.png" alt="Geek House" width="100%" />

---
**Desarrollo y Código:** Matías Facundo Sosa | **v1.0**
