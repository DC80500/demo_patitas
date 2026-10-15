# Fotografías de las mascotas

Fotografías reales de Pexels utilizadas como imágenes representativas de los cuatro registros iniciales. No corresponden a animales identificados por la organización.

| Registro | Archivo original local                     | Fotógrafo      | Fuente                                                                                                                              |
| -------- | ------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Luna     | `src/infrastructure/pets/photos/luna.jpg`  | Matheus Natan  | [Short-coated Beige Dog](https://www.pexels.com/photo/short-coated-beige-dog-1820064/)                                              |
| Milo     | `src/infrastructure/pets/photos/milo.jpg`  | Jeremy Roussel | [Portrait of a Gray Cat](https://www.pexels.com/photo/portrait-of-a-gray-cat-15459463/)                                             |
| Rocky    | `src/infrastructure/pets/photos/rocky.jpg` | Helena Lopes   | [Portrait of a Brown Mixed Breed Dog Outdoors](https://www.pexels.com/photo/portrait-of-a-brown-mixed-breed-dog-outdoors-35511894/) |
| Nala     | `src/infrastructure/pets/photos/nala.jpg`  | Zain Ali       | [Close up of White Cat](https://www.pexels.com/photo/close-up-of-white-cat-15160248/)                                               |

Licencia: [Pexels License](https://www.pexels.com/license/), consultada el 14 de octubre de 2026. Permite uso gratuito, incluido comercial, y modificación, sujeto a sus restricciones. No se sugiere afiliación ni respaldo de los fotógrafos.

Las copias descargadas usan la transformación del proveedor a JPEG de 480 × 480 píxeles. Pesan entre 23 y 32 KB cada una. La aplicación no solicita fotos a servicios externos: `node scripts/generate-pet-photos.mjs` genera `demoPetPhotos.ts` con las cuatro imágenes incorporadas como data URL. Se utiliza el mismo formato que las fotografías cargadas desde el formulario, manteniendo dominio y presentación independientes del proveedor y de rutas de despliegue.

La actualización de registros guardados solo añade la fotografía a los cuatro ejemplos identificados que aún la tienen vacía y conservan su nombre, especie y color iniciales. Se aplica una vez; respeta fotos personalizadas y posteriores eliminaciones desde el formulario.
