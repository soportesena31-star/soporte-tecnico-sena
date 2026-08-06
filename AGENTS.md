# Reglas de trabajo del proyecto

## Flujo obligatorio: probar en local antes de desplegar

Cada modificacion o actualizacion se PRUEBA EN LOCAL primero y solo despues se despliega a produccion (Railway).

### Pasos obligatorios antes de commit/despliegue

1. **Backend** (`soporte-sena-backend`):
   - `node --check` sobre los archivos modificados (ej. `node --check src/services/pushService.js`)
   - Levantar el servidor en local (`npm run dev`) y probar el endpoint/funcion afectada contra la BD local
2. **Frontend** (`soporte-sena-frontend`):
   - `npx tsc --noEmit` (debe pasar con 0 errores)
   - `npm run build` (debe completar el build)
   - Probar la funcionalidad en el navegador contra el backend local (`VITE_API_URL` apuntando a localhost)
3. Solo si la prueba local fue exitosa: commit, push y verificar deploy con
   `railway deployment list --service soporte-tecnico-frontend|--service soporte-tecnico-backend --limit 1 --json` (status SUCCESS).

### Notas

- El usuario decide cuando desplegar: si la prueba local requiere datos o pasos que solo el puede hacer (ej. un telefono Android con la PWA instalada), se le pide confirmacion o se le entrega el cambio probado en local para que el lo valide.
- Errores TS pre-existentes: el proyecto ya pasa `tsc --noEmit` con 0 errores; no se deben introducir nuevos.
