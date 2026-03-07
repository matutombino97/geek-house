/* 
   MIGRACIÓN DE IMÁGENES A WEBP EN FIRESTORE
   Instrucciones:
   1. Abrí tu página de Admin (donde ya estás logueado).
   2. Abrí la Consola (F12 -> Console).
   3. Pegá este código y apretá Enter.
*/

(async () => {
    const { db } = await import('./firebase-config.js');
    const { collection, getDocs, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    console.log("🚀 Iniciando migración de rutas en Firestore...");

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        let recordCount = 0;

        for (const document of querySnapshot.docs) {
            const data = document.data();
            let currentPath = data.imagen;

            if (currentPath && typeof currentPath === 'string' && !currentPath.startsWith("http")) {
                // Solo migramos rutas locales (porque las de Storage tienen tokens complejos)
                const newPath = currentPath.replace(/\.(png|jpg|jpeg)$/i, ".webp");

                if (newPath !== currentPath) {
                    await updateDoc(doc(db, "productos", document.id), {
                        imagen: newPath
                    });
                    console.log(`✅ Actualizado: ${data.nombre} (${newPath})`);
                    recordCount++;
                }
            }
        }

        console.log(`✨ Migración completada. Se actualizaron ${recordCount} productos.`);
        alert(`¡Listo! Se actualizaron ${recordCount} rutas a .webp.`);
    } catch (e) {
        console.error("❌ Error en la migración:", e);
    }
})();
