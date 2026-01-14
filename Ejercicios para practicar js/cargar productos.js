function analizarUrl(urlFicticia = "noticia.html?id=55&categoria=deportes&autor=messi"){
    const url = URLSearchParams(urlFicticia);
    const datos_url = url.get("id");
    return datos_url;
}

console.log(datos_url)