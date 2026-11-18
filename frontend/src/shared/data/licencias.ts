// =====================================================================
//  Licencias del software de terceros que usa Eslabón
//  Fuente: frontend/package.json + package-lock.json y backend/requirements.txt
//  Actualizar esta lista cuando se agregue o quite una dependencia.
// =====================================================================

export type CodigoLicencia =
  | 'MIT' | 'ISC' | 'Apache-2.0' | 'BSD-2-Clause' | 'BSD-3-Clause' | 'LGPL-3.0'
  | 'MPL-2.0' | 'PSF-2.0' | 'PostgreSQL' | 'OFL-1.1' | 'CC-BY-4.0' | 'BlueOak-1.0.0'
  | 'Unlicense' | 'CC0-1.0' | 'Servicio';

export type Categoria = 'frontend' | 'desarrollo' | 'backend' | 'plataforma';

export interface Componente {
  nombre: string;
  version?: string;
  licencia: CodigoLicencia;
  uso: string;
  categoria: Categoria;
  url: string;
  /** Logo de la marca (clave de LOGOS en logos.ts). */
  logo?: string;
  /** Ícono genérico cuando el proyecto no tiene logo público. */
  icono?: IconoGenerico;
}

export type IconoGenerico =
  | 'estilos' | 'notificacion' | 'navegador' | 'rayo' | 'servidor' | 'candado'
  | 'archivo' | 'correo' | 'red' | 'base';

export interface InfoLicencia {
  nombre: string;
  url: string;
  resumen: string;
  tipo: 'Permisiva' | 'Copyleft débil' | 'Fuente / datos' | 'Servicio';
}

export const LICENCIAS: Record<CodigoLicencia, InfoLicencia> = {
  'MIT': {
    nombre: 'MIT License', url: 'https://spdx.org/licenses/MIT.html', tipo: 'Permisiva',
    resumen: 'Permite usar, copiar, modificar y distribuir el software libremente, conservando el aviso de copyright y la licencia.',
  },
  'ISC': {
    nombre: 'ISC License', url: 'https://spdx.org/licenses/ISC.html', tipo: 'Permisiva',
    resumen: 'Equivalente a MIT en términos simples: uso libre conservando el aviso de copyright.',
  },
  'Apache-2.0': {
    nombre: 'Apache License 2.0', url: 'https://spdx.org/licenses/Apache-2.0.html', tipo: 'Permisiva',
    resumen: 'Uso libre, incluye licencia de patentes. Exige conservar el aviso de licencia y el archivo NOTICE si existe.',
  },
  'BSD-2-Clause': {
    nombre: 'BSD 2-Clause License', url: 'https://spdx.org/licenses/BSD-2-Clause.html', tipo: 'Permisiva',
    resumen: 'Uso libre conservando el aviso de copyright en el código y en la documentación.',
  },
  'BSD-3-Clause': {
    nombre: 'BSD 3-Clause License', url: 'https://spdx.org/licenses/BSD-3-Clause.html', tipo: 'Permisiva',
    resumen: 'Como BSD-2, y además no permite usar el nombre de los autores para promocionar el producto.',
  },
  'LGPL-3.0': {
    nombre: 'GNU Lesser GPL v3.0', url: 'https://spdx.org/licenses/LGPL-3.0-only.html', tipo: 'Copyleft débil',
    resumen: 'Se puede usar como librería sin liberar el código propio. Si se modifica la librería, esos cambios deben compartirse.',
  },
  'MPL-2.0': {
    nombre: 'Mozilla Public License 2.0', url: 'https://spdx.org/licenses/MPL-2.0.html', tipo: 'Copyleft débil',
    resumen: 'Copyleft por archivo: solo se comparten los cambios hechos a los archivos de esa librería.',
  },
  'PSF-2.0': {
    nombre: 'Python Software Foundation License', url: 'https://spdx.org/licenses/PSF-2.0.html', tipo: 'Permisiva',
    resumen: 'Licencia permisiva del lenguaje Python: uso libre conservando el aviso de copyright.',
  },
  'PostgreSQL': {
    nombre: 'PostgreSQL License', url: 'https://spdx.org/licenses/PostgreSQL.html', tipo: 'Permisiva',
    resumen: 'Licencia permisiva similar a MIT/BSD para el motor de base de datos PostgreSQL.',
  },
  'OFL-1.1': {
    nombre: 'SIL Open Font License 1.1', url: 'https://spdx.org/licenses/OFL-1.1.html', tipo: 'Fuente / datos',
    resumen: 'Permite usar la fuente en cualquier proyecto, incluso comercial. No se puede vender la fuente sola.',
  },
  'CC-BY-4.0': {
    nombre: 'Creative Commons Atribución 4.0', url: 'https://spdx.org/licenses/CC-BY-4.0.html', tipo: 'Fuente / datos',
    resumen: 'Permite usar los datos dando crédito a sus autores.',
  },
  'BlueOak-1.0.0': {
    nombre: 'Blue Oak Model License 1.0', url: 'https://spdx.org/licenses/BlueOak-1.0.0.html', tipo: 'Permisiva',
    resumen: 'Licencia permisiva moderna con licencia de patentes incluida.',
  },
  'CC0-1.0': {
    nombre: 'Creative Commons Zero 1.0', url: 'https://spdx.org/licenses/CC0-1.0.html', tipo: 'Fuente / datos',
    resumen: 'Dominio público: se puede usar, copiar y modificar sin pedir permiso ni dar atribución.',
  },
  'Unlicense': {
    nombre: 'The Unlicense', url: 'https://spdx.org/licenses/Unlicense.html', tipo: 'Permisiva',
    resumen: 'Dominio público: uso libre sin condiciones.',
  },
  'Servicio': {
    nombre: 'Términos del servicio', url: '', tipo: 'Servicio',
    resumen: 'Servicios externos que se usan bajo los términos y condiciones de su proveedor, no bajo una licencia de código.',
  },
};

export const CATEGORIAS: Record<Categoria, { titulo: string; descripcion: string }> = {
  frontend: { titulo: 'Interfaz web', descripcion: 'Librerías que se envían al navegador (React + Vite).' },
  desarrollo: { titulo: 'Herramientas de desarrollo', descripcion: 'Se usan solo para programar y compilar; no forman parte del aplicativo publicado.' },
  backend: { titulo: 'Servidor (API)', descripcion: 'Librerías de Python que usa la API de FastAPI.' },
  plataforma: { titulo: 'Plataforma, recursos y servicios', descripcion: 'Lenguajes, base de datos, tipografía y servicios externos.' },
};

const npm = (n: string) => `https://www.npmjs.com/package/${n}`;
const pypi = (n: string) => `https://pypi.org/project/${n}/`;

export const COMPONENTES: Componente[] = [
  // ---------- Interfaz web (dependencias de producción) ----------
  { categoria: 'frontend', nombre: 'React', version: '19.3.0', licencia: 'MIT', uso: 'Construcción de la interfaz', url: npm('react'), logo: 'react' },
  { categoria: 'frontend', nombre: 'React DOM', version: '19.3.0', licencia: 'MIT', uso: 'Renderizado en el navegador', url: npm('react-dom'), logo: 'react' },
  { categoria: 'frontend', nombre: 'React Router DOM', version: '7.18.4', licencia: 'MIT', uso: 'Navegación entre páginas', url: npm('react-router-dom'), logo: 'reactrouter' },
  { categoria: 'frontend', nombre: 'MUI Material', version: '9.5.0', licencia: 'MIT', uso: 'Componentes visuales (tablas, botones, diálogos)', url: npm('@mui/material'), logo: 'mui' },
  { categoria: 'frontend', nombre: 'MUI Icons Material', version: '9.5.0', licencia: 'MIT', uso: 'Íconos Material Design', url: npm('@mui/icons-material'), logo: 'mui' },
  { categoria: 'frontend', nombre: 'Emotion React', version: '11.14.0', licencia: 'MIT', uso: 'Estilos de los componentes MUI', url: npm('@emotion/react'), icono: 'estilos' },
  { categoria: 'frontend', nombre: 'Emotion Styled', version: '11.14.1', licencia: 'MIT', uso: 'Estilos de los componentes MUI', url: npm('@emotion/styled'), icono: 'estilos' },
  { categoria: 'frontend', nombre: 'Lucide React', version: '1.47.0', licencia: 'ISC', uso: 'Íconos del aplicativo', url: npm('lucide-react'), logo: 'lucide' },
  { categoria: 'frontend', nombre: 'Axios', version: '1.21.0', licencia: 'MIT', uso: 'Comunicación con la API', url: npm('axios'), logo: 'axios' },
  { categoria: 'frontend', nombre: 'Sonner', version: '2.0.8', licencia: 'MIT', uso: 'Notificaciones emergentes', url: npm('sonner'), icono: 'notificacion' },
  { categoria: 'frontend', nombre: 'Tailwind CSS', version: '4.3.3', licencia: 'MIT', uso: 'Utilidades de estilos', url: npm('tailwindcss'), logo: 'tailwindcss' },
  { categoria: 'frontend', nombre: 'PostCSS', version: '8.5.28', licencia: 'MIT', uso: 'Procesamiento de CSS', url: npm('postcss'), logo: 'postcss' },
  { categoria: 'frontend', nombre: 'Autoprefixer', version: '10.6.1', licencia: 'MIT', uso: 'Compatibilidad de CSS entre navegadores', url: npm('autoprefixer'), logo: 'autoprefixer' },
  { categoria: 'frontend', nombre: 'React Transition Group', version: '4.4.5', licencia: 'BSD-3-Clause', uso: 'Animaciones (dependencia de MUI)', url: npm('react-transition-group'), logo: 'react' },
  { categoria: 'frontend', nombre: 'caniuse-lite', version: '1.0.30001810', licencia: 'CC-BY-4.0', uso: 'Datos de compatibilidad de navegadores (Autoprefixer)', url: npm('caniuse-lite'), icono: 'navegador' },

  // ---------- Herramientas de desarrollo ----------
  { categoria: 'desarrollo', nombre: 'Vite', version: '8.3.0', licencia: 'MIT', uso: 'Servidor de desarrollo y compilación', url: npm('vite'), logo: 'vite' },
  { categoria: 'desarrollo', nombre: '@vitejs/plugin-react', version: '6.1.1', licencia: 'MIT', uso: 'Soporte de React en Vite', url: npm('@vitejs/plugin-react'), logo: 'vite' },
  { categoria: 'desarrollo', nombre: 'ESLint', version: '10.10.0', licencia: 'MIT', uso: 'Revisión de calidad del código', url: npm('eslint'), logo: 'eslint' },
  { categoria: 'desarrollo', nombre: '@eslint/js', version: '10.0.1', licencia: 'MIT', uso: 'Reglas base de ESLint', url: npm('@eslint/js'), logo: 'eslint' },
  { categoria: 'desarrollo', nombre: 'eslint-plugin-react-hooks', version: '7.1.1', licencia: 'MIT', uso: 'Reglas para hooks de React', url: npm('eslint-plugin-react-hooks'), logo: 'eslint' },
  { categoria: 'desarrollo', nombre: 'eslint-plugin-react-refresh', version: '0.5.7', licencia: 'MIT', uso: 'Reglas para recarga en caliente', url: npm('eslint-plugin-react-refresh'), logo: 'eslint' },
  { categoria: 'desarrollo', nombre: 'globals', version: '17.12.0', licencia: 'MIT', uso: 'Variables globales para ESLint', url: npm('globals'), logo: 'eslint' },
  { categoria: 'desarrollo', nombre: '@types/react y @types/react-dom', version: '19.3.0', licencia: 'MIT', uso: 'Tipos de TypeScript para React', url: npm('@types/react'), logo: 'typescript' },
  { categoria: 'desarrollo', nombre: 'Lightning CSS', version: '1.33.0', licencia: 'MPL-2.0', uso: 'Compilador de CSS usado por Tailwind', url: npm('lightningcss'), icono: 'rayo' },

  // ---------- Servidor (Python) ----------
  { categoria: 'backend', nombre: 'FastAPI', licencia: 'MIT', uso: 'Framework de la API', url: pypi('fastapi'), logo: 'fastapi' },
  { categoria: 'backend', nombre: 'Starlette', licencia: 'BSD-3-Clause', uso: 'Base web de FastAPI', url: pypi('starlette'), icono: 'servidor' },
  { categoria: 'backend', nombre: 'Uvicorn', licencia: 'BSD-3-Clause', uso: 'Servidor que ejecuta la API', url: pypi('uvicorn'), icono: 'servidor' },
  { categoria: 'backend', nombre: 'Pydantic', licencia: 'MIT', uso: 'Validación de datos', url: pypi('pydantic'), logo: 'pydantic' },
  { categoria: 'backend', nombre: 'Pydantic Settings', licencia: 'MIT', uso: 'Lectura de la configuración (.env)', url: pypi('pydantic-settings'), logo: 'pydantic' },
  { categoria: 'backend', nombre: 'SQLAlchemy', licencia: 'MIT', uso: 'Acceso a la base de datos', url: pypi('sqlalchemy'), logo: 'sqlalchemy' },
  { categoria: 'backend', nombre: 'Psycopg 3', licencia: 'LGPL-3.0', uso: 'Conector de PostgreSQL (se usa sin modificar)', url: pypi('psycopg'), logo: 'postgresql' },
  { categoria: 'backend', nombre: 'bcrypt', licencia: 'Apache-2.0', uso: 'Cifrado de contraseñas', url: pypi('bcrypt'), icono: 'candado' },
  { categoria: 'backend', nombre: 'PyJWT', licencia: 'MIT', uso: 'Tokens de sesión (JWT)', url: pypi('PyJWT'), logo: 'jsonwebtokens' },
  { categoria: 'backend', nombre: 'python-multipart', licencia: 'Apache-2.0', uso: 'Carga de archivos (fichas, soportes)', url: pypi('python-multipart'), icono: 'archivo' },
  { categoria: 'backend', nombre: 'email-validator', licencia: 'Unlicense', uso: 'Validación de correos', url: pypi('email-validator'), icono: 'correo' },
  { categoria: 'backend', nombre: 'dnspython', licencia: 'ISC', uso: 'Verificación del dominio del correo', url: pypi('dnspython'), icono: 'red' },
  { categoria: 'backend', nombre: 'python-dotenv', licencia: 'BSD-3-Clause', uso: 'Lectura del archivo .env', url: pypi('python-dotenv'), logo: 'dotenv' },

  // ---------- Plataforma, recursos y servicios ----------
  { categoria: 'plataforma', nombre: 'Python', licencia: 'PSF-2.0', uso: 'Lenguaje del servidor', url: 'https://www.python.org/', logo: 'python' },
  { categoria: 'plataforma', nombre: 'Node.js', licencia: 'MIT', uso: 'Entorno para ejecutar Vite y npm', url: 'https://nodejs.org/', logo: 'nodedotjs' },
  { categoria: 'plataforma', nombre: 'PostgreSQL', licencia: 'PostgreSQL', uso: 'Motor de base de datos', url: 'https://www.postgresql.org/about/licence/', logo: 'postgresql' },
  { categoria: 'plataforma', nombre: 'Montserrat (Google Fonts)', licencia: 'OFL-1.1', uso: 'Tipografía del aplicativo', url: 'https://fonts.google.com/specimen/Montserrat', logo: 'googlefonts' },
  { categoria: 'plataforma', nombre: 'Simple Icons', licencia: 'CC0-1.0', uso: 'Logos de las librerías en esta página', url: 'https://simpleicons.org/', icono: 'estilos' },
  { categoria: 'plataforma', nombre: 'Neon', licencia: 'Servicio', uso: 'Hospedaje de la base de datos PostgreSQL', url: 'https://neon.com/terms-of-service', icono: 'base' },
  { categoria: 'plataforma', nombre: 'Gmail (SMTP)', licencia: 'Servicio', uso: 'Envío de códigos de recuperación', url: 'https://policies.google.com/terms', logo: 'gmail' },
];

/** Todas las dependencias de npm (incluidas las internas) según package-lock.json. */
export const RESUMEN_NPM = {
  total: 260,
  porLicencia: [
    { licencia: 'MIT' as CodigoLicencia, cantidad: 210 },
    { licencia: 'Apache-2.0' as CodigoLicencia, cantidad: 14 },
    { licencia: 'MPL-2.0' as CodigoLicencia, cantidad: 12 },
    { licencia: 'ISC' as CodigoLicencia, cantidad: 11 },
    { licencia: 'BSD-2-Clause' as CodigoLicencia, cantidad: 6 },
    { licencia: 'BSD-3-Clause' as CodigoLicencia, cantidad: 5 },
    { licencia: 'CC-BY-4.0' as CodigoLicencia, cantidad: 1 },
    { licencia: 'BlueOak-1.0.0' as CodigoLicencia, cantidad: 1 },
  ],
};
