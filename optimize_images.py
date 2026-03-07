from PIL import Image
import os

# Configuración
input_dir = "img"
output_dir = "img_webp"  # Se recomienda sacarlos a una carpeta nueva primero

# Crear carpeta de salida si no existe
os.makedirs(output_dir, exist_ok=True)

print(f"🚀 Iniciando optimización de imágenes en '{input_dir}'...")

count = 0
for file_name in os.listdir(input_dir):
    if file_name.lower().endswith((".jpg", ".jpeg", ".png")):
        try:
            input_path = os.path.join(input_dir, file_name)
            
            # Cambiar extensión a .webp para el archivo de salida
            base_name = os.path.splitext(file_name)[0]
            output_path = os.path.join(output_dir, base_name + ".webp")

            # Abrir y guardar como WEBP
            img = Image.open(input_path)
            
            # Si es RGBA (PNG con transparencia), se mantiene al convertir a WEBP
            img.save(output_path, format="WEBP", quality=75, method=6)
            
            print(f"✅ Procesado: {file_name} -> {base_name}.webp")
            count += 1
        except Exception as e:
            print(f"❌ Error procesando {file_name}: {e}")

print(f"\n✨ ¡Listo! Se optimizaron {count} imágenes.")
print(f"📂 Podés encontrar los archivos en: {os.path.abspath(output_dir)}")
print("\n💡 Tip: Una vez que verifiques que están bien, reemplazá los archivos de 'img/' con estos.")
