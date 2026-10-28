# Coffee Flower - Frontend

## 1. Descripción del proyecto

Coffee Flower es una aplicación web para una cafetería y pastelería, desarrollada con React y TypeScript. Su propósito es ofrecer una interfaz para explorar productos, consultar categorías y acceder a las funcionalidades disponibles de la tienda.

El frontend está diseñado para ofrecer una experiencia de navegación sencilla y permitir la integración con servicios de autenticación y APIs externas.

## 2. Tecnologías utilizadas

- React 19
- TypeScript
- Vite 7
- React Router DOM 7
- OIDC Client TS
- React OIDC Context
- HTML5
- CSS3
- Git y GitHub
- Vercel para el despliegue

## 3. Funcionalidades y páginas

El proyecto incluye las siguientes páginas:

| Página | Descripción |
|---|---|
| Home | Página principal de Coffee Flower. |
| Productos | Sección para visualizar el catálogo de productos. |
| Categorías | Sección para explorar las categorías disponibles. |
| Carrito | Interfaz para gestionar productos seleccionados. |
| Colaborador | Página destinada al colaborador de la cafetería. |
| Dashboard | Panel para las funcionalidades de gestión implementadas. |

Las funcionalidades específicas disponibles dependen de la implementación actual de cada página.

## 4. Estructura del proyecto

```text
Coffee-Flower-Frontend/
├── src/
│   ├── pages/
│   │   ├── Cart.tsx
│   │   ├── Categorias.tsx
│   │   ├── Colaborador.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Home.tsx
│   │   └── Productos.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── vite-env.d.ts
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```

## 5. Requisitos previos

Para ejecutar el proyecto localmente se necesita:

- Node.js.
- npm.
- Git, para clonar el repositorio.

## 6. Instalación

Clonar el repositorio:

```bash
git clone https://github.com/Barbara-Carolina7/Coffee-Flower-Frontend.git
```

Ingresar a la carpeta del proyecto:

```bash
cd Coffee-Flower-Frontend
```

Instalar las dependencias:

```bash
npm install
```

## 7. Variables de entorno

El proyecto dispone de un archivo `.env.example` como referencia para configurar las variables de entorno.

Crear un archivo `.env` en la raíz del proyecto y definir las variables utilizadas por el código.

Por ejemplo, si el frontend utiliza una API externa:

```env
VITE_API_URL=https://URL_DE_LA_API
```

Si la autenticación utiliza OpenID Connect con Amazon Cognito, también se deben configurar los parámetros que requiera la implementación actual, como la autoridad de autenticación, el identificador del cliente y las URL de redirección.

Los nombres de las variables deben coincidir con los definidos en el código fuente.

No se deben publicar contraseñas, credenciales privadas ni claves secretas en GitHub.

## 8. Ejecución en desarrollo

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local para abrir la aplicación. Habitualmente es:

```text
http://localhost:5173
```

## 9. Compilación para producción

Ejecutar:

```bash
npm run build
```

Este comando comprueba el proyecto mediante TypeScript y genera la compilación de producción con Vite.

## 10. Vista previa de producción

Después de generar la compilación, ejecutar:

```bash
npm run preview
```

Este comando permite revisar localmente la versión compilada.

## 11. Autenticación

El proyecto incluye las dependencias `oidc-client-ts` y `react-oidc-context`, que permiten implementar autenticación mediante OpenID Connect en aplicaciones React.

La configuración depende del proveedor de identidad utilizado y de los parámetros definidos en el proyecto.

La presencia de estas dependencias no garantiza por sí sola que el inicio de sesión esté completamente configurado.

## 12. Despliegue

La aplicación publicada está disponible en:

https://coffee-flower-frontend.vercel.app/

Repositorio del código fuente:

https://github.com/Barbara-Carolina7/Coffee-Flower-Frontend

La publicación de nuevas versiones puede gestionarse conectando el repositorio de GitHub con Vercel y configurando las variables de entorno necesarias.

## 13. Objetivo del proyecto

Desarrollar una interfaz web para una cafetería y pastelería utilizando tecnologías modernas de desarrollo frontend, con una estructura organizada y preparada para integrarse con servicios externos.

## 14. Autores

Proyecto académico desarrollado como parte del proceso de formación en Ingeniería en Informática.

## 15. Licencia

La licencia del proyecto debe definirse de acuerdo con las condiciones de uso y distribución establecidas por sus autores.
