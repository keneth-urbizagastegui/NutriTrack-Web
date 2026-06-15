# NutriTrack Web - Portal de Trazabilidad Alimentaria y Gestión Fitness

## Información del Curso y Equipo
* **Curso:** CS 2031 Desarrollo Basado en Plataforma (DBP) - UTEC
* **Integrantes del Equipo:**
  * Víctor Valentino Palomino Arcos
  * Nestor Alonso De la Cruz Gomez
  * Keneth Joseph Urbizagastegui Fernández

---

## Índice
1. [Introducción](#introducción)
2. [Identificación del Problema o Necesidad](#identificación-del-problema-o-necesidad)
3. [Descripción de la Solución (Módulos Web)](#descripción-de-la-solución-módulos-web)
4. [Tecnologías Utilizadas](#tecnologías-utilizadas)
5. [Arquitectura del Frontend y Estructura de Carpetas](#arquitectura-del-frontend-y-estructura-de-carpetas)
6. [Flujo de Enrutamiento y Seguridad (Zustand + Axios)](#flujo-de-enrutamiento-y-seguridad-zustand--axios)
7. [Instrucciones de Instalación y Ejecución Local](#instrucciones-de-instalación-y-ejecución-local)
8. [Variables de Entorno Requeridas](#variables-de-entorno-requeridas)
9. [Guía de Pruebas y Casos de Uso](#guía-de-pruebas-y-casos-de-uso)
10. [Decisiones de Diseño](#decisiones-de-diseño)
11. [Conclusiones](#conclusiones)

---

## Introducción
**NutriTrack Web** es el portal de interacción e interfaces del sistema de trazabilidad de alimentos y suplementos deportivos. Esta aplicación web SPA (Single Page Application) permite a los deportistas monitorear su ingesta nutricional diaria de forma segura, reportar incidentes sanitarios y consultar la línea de tiempo de frescura de sus ingredientes. Asimismo, provee un panel administrativo y operativo integral para gestores y administradores de control de calidad.

---

## Identificación del Problema o Necesidad
En el sector de la nutrición deportiva, existe una desconexión crítica entre el laboratorio de control de calidad y el usuario final. Los deportistas consumen suplementos confiando ciegamente en la etiqueta, sin tener acceso real al origen de las materias primas o a reportes sanitarios de colisiones alergénicas. Cuando se retira un lote por contaminación, el deportista rara vez se entera a tiempo. **NutriTrack Web** cierra esta brecha con una interfaz premium, transparente y responsiva que muestra la trazabilidad en tiempo real a partir del escaneo de códigos QR y automatiza la seguridad del consumidor.

---

## Descripción de la Solución (Módulos Web)

La interfaz web está segmentada por roles mediante rutas protegidas:

* **Módulo del Deportista (`ROLE_USER`)**:
  * **Dashboard Nutricional**: Balance y progreso diario de macronutrientes (Proteínas, Carbohidratos, Grasas y Calorías) renderizado mediante un gráfico circular SVG interactivo.
  * **Buscador con Debounce**: Consulta rápida del valor nutricional de suplementos deportivos mediante peticiones optimizadas al backend con retardo de 300ms.
  * **Registro de Consumo con UX Amigable**: Modal que carga de forma dinámica los lotes activos (`GET /api/v1/batches`), permitiendo seleccionar el producto y lote exactos mediante un selector descriptivo en lugar de IDs técnicos.
  * **Gestión de Alérgenos**: Perfil interactivo donde el usuario activa ingredientes intolerantes (e.g. Maní, Lactosa) para que el sistema bloquee automáticamente consumos de riesgo.
  * **Reporte de Calidad**: Formulario para registrar anomalías alimenticias en lotes específicos.
* **Módulo de Gestión (`ROLE_MANAGER` & `ROLE_ADMIN`)**:
  * **Catálogo de Proveedores e Ingredientes**: Control para añadir, listar y visualizar el catálogo.
  * **Creación de Productos y Lotes**: Módulo para registrar productos (fijando macros) y abrir lotes especificando su código, fechas de producción y fecha de expiración. La creación del lote gatilla la generación automática y subida del código QR interactivo a S3.
  * **Alertas Sanitarias y Auditoría**: Listado general de reportes sanitarios enviados por deportistas.
  * **Acciones Exclusivas del Administrador (`ROLE_ADMIN`)**:
    * Retiro sanitario inmediato de lotes defectuosos (`RECALLED`), desactivándolos en tiempo real para prevenir consumos futuros.
    * Activación/desactivación manual de proveedores para bloquear la compra de ingredientes de fuentes cuestionables.

---

## Tecnologías Utilizadas
* **Core Framework**: React 19 (TypeScript)
* **Build Tool**: Vite 8.0
* **Estilos y UI**: Tailwind CSS v4, Lucide React (Íconos)
* **Componentes UI**: Shadcn/ui (Button, Card, Input, Badge, Dialog, Sonner)
* **Estado Global**: Zustand (con hidratación sessionStorage)
* **Cliente de API**: Axios (con interceptores automáticos de refresh token)
* **Enrutamiento**: React Router v7 (carga diferida con `Suspense` y `React.lazy`)

---

## Arquitectura del Frontend y Estructura de Carpetas

La aplicación está organizada bajo buenas prácticas de modularidad:

```
src/
├── components/          # Componentes reutilizables de la aplicación
│   ├── common/          # Componentes del sistema (e.g. ErrorBoundary.tsx)
│   ├── layout/          # Componentes estructurales (Navbar.tsx, Breadcrumbs.tsx, AxiosInterceptor.tsx)
│   ├── trace/           # Componentes específicos de trazabilidad (Timeline.tsx)
│   └── ui/              # Componentes visuales base de Shadcn/ui
├── hooks/               # Custom Hooks reutilizables (useDebounce.ts)
├── lib/                 # Utilidades requeridas por Shadcn (utils.ts)
├── pages/               # Vistas principales/páginas de la SPA
├── routes/              # Enrutador dinámico y rutas privadas (PrivateRoute.tsx)
├── services/            # Cliente HTTP y APIs (api.ts)
├── store/               # Tienda Zustand de estado global (useAuthStore.ts)
├── styles/              # Archivos de estilos y temas CSS (index.css)
├── App.tsx              # Componente principal
└── main.tsx             # Punto de entrada de la aplicación React
```

---

## Flujo de Enrutamiento y Seguridad (Zustand + Axios)

El flujo de autenticación opera de forma autónoma mediante **Zustand** y se integra directamente en la capa HTTP:

1. **Persistencia Segura**: Al iniciar sesión con `/auth/login`, la tienda global `useAuthStore.ts` guarda el `accessToken` y `refreshToken` en la memoria del navegador (`sessionStorage`) previniendo accesos indebidos de tipo XSS en comparación con almacenamiento desprotegido.
2. **Inyección de JWT**: El componente [AxiosInterceptor.tsx](file:///c:/Users/Keneth/Desktop/Proyecto%20DBP/NutriTrack%20Web/src/components/layout/AxiosInterceptor.tsx) suscribe un interceptor de peticiones de Axios para adjuntar dinámicamente la cabecera `Authorization: Bearer <token>` a cada solicitud hacia el backend.
3. **Renovación Silenciosa (Silent Refresh)**: Si el token expira (el servidor retorna `401 Unauthorized`), el interceptor de respuestas captura el error, detiene temporalmente la cola de solicitudes, realiza un POST hacia `/auth/refresh` con el `refreshToken`, actualiza la tienda global Zustand con el nuevo `accessToken` y reintenta la petición original del usuario sin que éste note interrupción alguna.
4. **Protección de Rutas**: `PrivateRoute.tsx` evalúa el rol del usuario directamente de la tienda y redirige de forma segura a `/login` o al panel correspondiente.

---

## Instrucciones de Instalación y Ejecución Local

### Prerrequisitos
* Node.js v18 o superior instalado
* Gestor de paquetes `npm` (incluido en Node.js)

### Pasos
1. **Instalar Dependencias**:
   ```bash
   cd "NutriTrack Web"
   npm install
   ```
2. **Configurar el Entorno**:
   Crea o renombra el archivo `.env` en la raíz de `NutriTrack Web` y apunta hacia la dirección URL del backend:
   ```env
   VITE_API_URL=http://localhost:8080/api/v1
   ```
3. **Compilar y Ejecutar en Desarrollo**:
   ```bash
   npm run dev
   ```
   Abre tu navegador e ingresa a `http://localhost:5173`.

4. **Compilar para Producción**:
   ```bash
   npm run build
   ```
   Esto compilará los assets estáticos ultra-optimizados en la carpeta `dist/`.

---

## Variables de Entorno Requeridas

El frontend cuenta con configuraciones dinámicas basadas en variables de entorno de Vite:

| Variable | Descripción | Valor Local Predeterminado |
|---|---|---|
| `VITE_API_URL` | URL base de los endpoints del backend API REST | `http://localhost:8080/api/v1` |

---

## Guía de Pruebas y Casos de Uso

### Caso 1: Flujo de Alerta de Alérgenos
1. Inicia sesión como deportista con el usuario `victor.fitness` y la contraseña `StrongPassword123!`.
2. Presiona en el botón **Registrar Consumo**.
3. Abre el selector de productos. Verás la lista de lotes activos. Selecciona `Barra de Proteína con Maní (Lote: PEANUT-BAR-404)`.
4. Digita una cantidad de gramos (ej. `50g`) y presiona registrar.
5. **Resultado**: El sistema detiene la transacción y despliega un Toast en rojo que dice: `El lote del producto contiene el ingrediente 'Maní', el cual está registrado como alérgeno en tu perfil.` (validación directa del backend).

### Caso 2: Consumo de Lote Retirado (Recall)
1. Inicia sesión como administrador con el usuario `admin` y la contraseña `StrongPassword123!`.
2. Ve al Panel de Control y ubica las alertas. Haz clic en **Retirar Lote (Recall)** sobre el lote `W-ISO-099`.
3. Cierra sesión e ingresa como `victor.fitness`.
4. Ve a la url de trazabilidad pública `http://localhost:5173/traceability/1`.
5. **Resultado**: La línea de tiempo y la cabecera del lote cambian visualmente, mostrando una etiqueta de advertencia roja con estado `RECALLED` y advirtiendo que el lote ha sido bloqueado por el equipo de calidad.

---

## Decisiones de Diseño

* **Zustand en lugar de Context API**: Se migró de Context API a Zustand para lograr un estado global no intrusivo. Zustand evita re-renderizados innecesarios en componentes profundos y, lo más importante, permite la lectura y mutación del estado fuera de los componentes React (como en las interceptaciones de Axios), algo sumamente engorroso con Context API.
* **Tailwind CSS v4 Directo**: El uso de Tailwind v4 permite aprovechar la compilación ultrarrápida nativa de Rust a través de Vite. Prescindimos del archivo JavaScript de configuración tradicional en favor de directivas CSS nativas en `index.css`.
* **Glassmorphism Fitness Theme**: Diseñamos una interfaz con temática oscura y tarjetas translúcidas de bordes redondeados con efectos de gradientes verdes y cian, lo que brinda una estética premium y deportiva alineada a las expectativas de plataformas modernas de fitness.

---

## Conclusiones
La combinación de **React + TypeScript + Zustand** con la infraestructura del backend en **Spring Boot** ha permitido construir una plataforma de alta fidelidad. La capa web es rápida, consume pocos recursos y garantiza la robustez y seguridad del usuario al interactuar con el flujo de trazabilidad.
