# Soporte SENA — Frontend (PWA)

React 19 + TypeScript + Tailwind v4 + lucide-react + recharts, construido sobre
el mockup original. Mismo diseño, ahora conectado al backend real y empaquetado
como PWA instalable.

## Instalación

```bash
npm install
```

Crea un archivo `.env` en la raíz:

```
VITE_API_URL=http://localhost:4000/api
```

(usa la URL real del backend cuando lo despliegues).

```bash
npm run dev       # http://localhost:5173
npm run build      # genera dist/, listo para servir como PWA
npm run preview    # sirve dist/ localmente para probar el build de producción
```

El QR único del campus debe apuntar a la URL raíz del despliegue (ej.
`https://soporte.sena.edu.co/`) — la app decide sola si mostrar el formulario
de reporte o la sesión del técnico, según si hay una sesión activa.

## Rutas

| Ruta | Quién la usa | Requiere sesión |
|---|---|---|
| `/` | Punto de entrada del QR | No |
| `/reportar` | Formulario de novedad | No |
| `/confirmacion` | Número de caso tras enviar | No (solo tras enviar) |
| `/consultar`, `/consultar/:numeroCaso` | Seguimiento público | No |
| `/login` | Técnicos y administrador | No |
| `/casos`, `/casos/:numeroCaso` | Cola y detalle de casos | Sí, rol Técnico |
| `/admin` | Panel administrativo | Sí, rol Administrador |

## Qué está realmente conectado

**Reportar, Confirmación, Consultar, Login, Cola de técnico, Detalle de caso**
(tomar / iniciar / notas / resolver): 100% conectado a la API real, sin datos
de mockup en ningún punto.

**Panel de administrador** — conectado por secciones:
- Dashboard, Casos, Historial: datos reales.
- Espacios: datos reales, crear y activar/desactivar ya pegan a la API.
- Técnicos, Categorías: el *listado* es real; crear/editar todavía no tiene
  endpoint en el backend, así que esos modales quedan de vitrina (se avisa
  dentro de la UI, no fallan en silencio).
- Reportes: los KPIs con variación porcentual y los gráficos de series de
  tiempo son una muestra ilustrativa — calcularlos de verdad necesita
  agregaciones por día que el backend actual no expone. Queda marcado
  explícitamente en pantalla.
- Configuración: sin backend, es solo vitrina.

## Notificaciones

No hay push real todavía (ver el backend README, sección "Pendiente").
La pestaña de notificaciones del técnico muestra una vista derivada de los
casos reales (alta prioridad sin asignar, casos propios recién asignados) en
vez de datos falsos, pero no es push — el técnico tiene que abrir la app.

## PWA

Instalable vía `vite-plugin-pwa`. En iPhone, el push web solo funciona si el
técnico usa "Agregar a inicio" antes de aceptar notificaciones — ver la
conversación de diseño para el detalle. Los íconos están en `public/icons/`;
`src/icon-source.svg` es la fuente si hace falta regenerarlos.
