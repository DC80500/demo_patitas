# Patitas de Amor — demo

Demo de React, TypeScript, Vite y Tailwind CSS 4 con login y pantalla de bienvenida responsivos. Diseño propio basado en el azul y el logo de Patitas de Amor, con tipografía del sistema.

La capa visual se inspira en One UI contemporánea: superficies de cristal esmerilado, fondos ambientales azules, controles redondeados y sombras suaves. Los tokens de color, radios, sombras y movimiento se centralizan en `src/presentation/styles/index.css`. El desenfoque usa detección de soporte; se respetan las preferencias de movimiento reducido y transparencia reducida cuando el navegador las admite. Los formularios y las tarjetas mantienen superficies claras para preservar la legibilidad.

Tailwind se integra mediante `@tailwindcss/vite`, sin CDN. Las páginas usan utilidades para distribución, espaciado, superficies y responsividad. `@theme inline` expone los tokens de marca (`bg-glass`, `text-primary`, `rounded-panel`, `shadow-glass`, etc.). `App.css` conserva componentes compartidos definidos con `@apply` y los efectos específicos de la interfaz. Los estilos se organizan en las capas `base`, `components` y `utilities`, para que las utilidades puedan ajustar los componentes sin conflictos de especificidad. Prettier ordena las clases mediante `prettier-plugin-tailwindcss`.

## Ejecución

Requiere Node.js 22.12 o superior dentro de la rama 22, o una versión posterior compatible. Entorno inicial: Node.js 22.23.1.

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Abrir http://127.0.0.1:5173. En PowerShell puede usarse npm.cmd si la política de ejecución bloquea npm.ps1.

## Comprobaciones

```sh
npm run lint
npm run format:check
npm run build
```

`npm run format` aplica el formato. `npm run preview` permite revisar la compilación de producción.

## Arquitectura limpia

- `src/domain`: entidades y reglas independientes del framework.
- `src/application`: casos de uso y contratos; depende del dominio.
- `src/infrastructure`: implementaciones de contratos, datos simulados y futuras API.
- `src/presentation`: interfaz React, estilos y recursos visuales.
- `src/main.tsx`: entrada y futura composición de dependencias.

Dominio y aplicación no importan presentación ni infraestructura. El usuario se define en dominio, el caso de uso SignIn y el contrato AuthRepository en aplicación, y DemoAuthRepository en infraestructura. src/main.tsx compone e inyecta las dependencias. TypeScript está en modo estricto.

## Acceso de demostración

- Correo: `admin@patitas.demo`
- Contraseña: `Patitas2026!`

El formulario carga automáticamente el correo y la contraseña de demo (oculta inicialmente). Los datos se pueden editar; no se muestra el bloque de credenciales ni un botón para completarlos. Permite mostrar u ocultar la contraseña y validar el acceso. El panel habilita Bienvenida, Gestión de Tutores, Gestión de Mascotas e Historia Clínica. Los módulos sin contenido no se renderizan en el menú. Permite cerrar sesión. En móvil, el menú se abre en un diálogo con navegación por teclado y cierre con Escape.

La autenticación es simulada con credenciales públicas. La sesión se mantiene solamente en memoria; recargar vuelve al login. No hay backend, autorización real ni almacenamiento de contraseñas.

Las animaciones funcionan automáticamente; la preferencia del sistema de movimiento reducido siempre se respeta. En ventanas de poca altura, el menú se desplaza por separado y mantiene visible el cierre de sesión. La bienvenida limita su altura decorativa para evitar un crecimiento excesivo en pantallas altas.

## Gestión de Tutores

Listado responsivo con búsqueda por nombre (sin distinción de tildes), DNI y celular. Registro y edición de nombres, apellidos, DNI, celular, correo, dirección y distrito, con validación y prevención de DNI duplicados. La ficha muestra los datos personales y mascotas asociadas desde el repositorio de mascotas; los nuevos tutores comienzan sin mascotas.

Los registros se conservan en localStorage bajo `patitas-demo.tutors.v1` en el navegador y origen actuales. El primer uso carga cinco tutores ficticios. No hay sincronización con un servidor. Los errores de almacenamiento y los datos locales inválidos se reportan sin sobrescribir los registros.

`TutorService` implementa los casos de uso sobre el contrato `TutorRepository`; `LocalTutorRepository` proporciona persistencia y `main.tsx` compone las dependencias. `AppShell` comparte navegación, cabecera y pie entre módulos.

Ejecutar `npm test` para verificar registro, edición, persistencia, DNI duplicado, validación y fallos de almacenamiento.

## Gestión de Mascotas

Listado con búsqueda por nombre, número de registro y DNI del tutor, y filtro por estado. Registro y edición en tres pasos: identificación y tutor, salud y veterinario, revisión. Fotografía opcional JPG, PNG o WebP hasta 5 MB, reducida localmente a 480 píxeles y almacenada como JPEG. Incluye especie, raza, sexo, edad, color, microchip, vacunas, esterilización, observaciones y contacto del veterinario.

Los registros nuevos quedan pendientes. La ficha permite aprobarlos y consultar el DNI Smart con número propio `PA-000001` y DNI del tutor vinculado. Editar un registro aprobado conserva su número y lo devuelve a pendiente. El QR generado con `qrcode` contiene texto con identificación y contacto; no depende de una página pública. El DNI es una vista de demostración sin validez oficial. La descarga PDF queda fuera de este módulo; las atenciones se consultan en Historia Clínica.

`PetService` utiliza los contratos de mascotas y tutores. La persistencia local usa `patitas-demo.pets.v1`, con cinco mascotas ficticias iniciales. `TutorService` deriva las asociaciones desde estos registros. Las pruebas verifican registro, aprobación, edición, reasignación de tutor, validación, microchip duplicado y fallos de almacenamiento.

## Historia Clínica

Selección de mascotas con búsqueda por nombre, registro o DNI del tutor. Historial por mascota, ordenado desde la atención más reciente, con filtro de consultas y vacunas. El registro de consulta incluye fecha, veterinario, motivo, diagnóstico, tratamiento y observaciones; las vacunas incluyen nombre, fecha, veterinario y observaciones. Ambas permiten registrar un próximo control o refuerzo opcional. La cabecera muestra la fecha futura más cercana registrada en sus atenciones; no envía recordatorios ni determina que una cita ya se completó.

Las fechas se manejan como fechas de calendario locales. No se admiten atenciones futuras, fechas inexistentes ni controles anteriores a la atención. Los campos obligatorios y la mascota vinculada se validan en `ClinicalService`. `LocalClinicalRepository` conserva los datos en `patitas-demo.clinical.v1`, con cinco atenciones ficticias iniciales. Las nuevas mascotas comienzan sin atenciones y pueden registrarlas tanto pendientes como aprobadas. El historial agrega registros; edición, eliminación de atenciones y documentos adjuntos quedan fuera de esta demo.

Las pruebas incluyen persistencia, aislamiento de historiales, vacunas, fechas, validación, fallos de almacenamiento y el recorrido tutor → mascota aprobada → atención clínica.
