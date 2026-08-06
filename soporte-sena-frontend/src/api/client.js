const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export { API_URL };

const TOKEN_KEY = 'sena_soporte_token';

// localStorage conserva la sesion al cerrar la app: solo se pierde al cerrar
// sesion manualmente o tras 30 minutos de inactividad (useGuardiaSesion).
// Antes se usaba sessionStorage y la sesion moria al cerrar la app.
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Llama a la API. Si `body` es un FormData, se envia como multipart
 * (para fotos); si no, se envia como JSON. Siempre agrega el token si existe.
 */
async function request(path, { method = 'GET', body, auth = true, query } = {}) {
  const headers = {};
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let finalBody = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  let url = `${API_URL}${path}`;
  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    );
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, { method, headers, body: finalBody });

  let json = null;
  try {
    json = await res.json();
  } catch {
    // respuesta sin cuerpo (poco comun, pero no deberia tumbar la app)
  }

  if (!res.ok || !json?.success) {
    const err = json?.error || {};
    throw new ApiError(res.status, err.code || 'ERR_DESCONOCIDO', err.message || 'Ocurrió un error inesperado', err.details);
  }

  return json.data;
}

export const api = {
  // Publicos — sin login, usados desde el formulario que abre el QR
  espacios: {
    listar: (query) => request('/espacios', { auth: false, query }),
    crear: (datos) => request('/espacios', { method: 'POST', body: datos }),
    actualizar: (id, datos) => request(`/espacios/${id}`, { method: 'PUT', body: datos }),
  },
  categorias: {
    listar: () => request('/categorias', { auth: false }),
    crear: (datos) => request('/categorias', { method: 'POST', body: datos }),
    actualizar: (id, datos) => request(`/categorias/${id}`, { method: 'PUT', body: datos }),
    eliminar: (id) => request(`/categorias/${id}`, { method: 'DELETE' }),
  },
  casos: {
    crear: (formData) => request('/casos', { method: 'POST', body: formData, auth: false }),
    consultar: (numeroCaso) => request(`/casos/consultar/${encodeURIComponent(numeroCaso)}`, { auth: false }),

    // Requieren sesion de tecnico o administrador
    listar: (query) => request('/casos', { query }),
    tomar: (id) => request(`/casos/${id}/tomar`, { method: 'POST' }),
    asignar: (id, tecnico_id) => request(`/casos/${id}/asignar`, { method: 'POST', body: { tecnico_id } }),
    reasignar: (id, tecnico_id, motivo) => request(`/casos/${id}/reasignar`, { method: 'POST', body: { tecnico_id, motivo } }),
    iniciar: (id) => request(`/casos/${id}/iniciar`, { method: 'POST' }),
    agregarNota: (id, nota) => request(`/casos/${id}/notas`, { method: 'POST', body: { nota } }),
    resolver: (id, formData) => request(`/casos/${id}/resolver`, { method: 'POST', body: formData }),
    reabrir: (id, motivo) => request(`/casos/${id}/reabrir`, { method: 'POST', body: { motivo } }),
  },
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
    perfil: () => request('/auth/perfil'),
    olvidePassword: (email) => request('/auth/olvide-password', { method: 'POST', body: { email }, auth: false }),
    restablecerPassword: (token, password) => request('/auth/restablecer-password', { method: 'POST', body: { token, password }, auth: false }),
    cambiarPassword: (password_actual, password_nueva) => request('/auth/cambiar-password', { method: 'PUT', body: { password_actual, password_nueva } }),
  },
  configuracion: {
    obtener: () => request('/configuracion'),
    actualizar: (datos) => request('/configuracion', { method: 'PUT', body: datos }),
  },
  invitaciones: {
    crear: (email, nombre, rol_id) => request('/invitaciones', { method: 'POST', body: { email, nombre, rol_id } }),
    ver: (token) => request(`/invitaciones/${token}`, { auth: false }),
    aceptar: (token, password) => request(`/invitaciones/${token}/aceptar`, { method: 'POST', body: { password }, auth: false }),
  },
  roles: {
    listar: () => request('/roles'),
  },
  push: {
    suscribir: (datos) => request('/push/suscribir', { method: 'POST', body: datos }),
    desuscribir: (endpoint) => request('/push/desuscribir', { method: 'POST', body: { endpoint } }),
  },
  qr: {
    obtener: () => request('/qr'),
    descargarPng: async () => {
      const token = getToken();
      const res = await fetch(`${API_URL}/qr?formato=png`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new ApiError(res.status, 'ERR_DESCONOCIDO', 'No se pudo descargar el QR');
      return res.blob();
    },
  },
  usuarios: {
    listar: (query) => request('/usuarios', { query }),
    tecnicos: () => request('/usuarios/tecnicos'),
    actualizar: (id, datos) => request(`/usuarios/${id}`, { method: 'PUT', body: datos }),
  },
  historial: {
    listar: (query) => request('/historial', { query }),
    descargar: async (limite = 200) => {
      const token = getToken();
      const res = await fetch(`${API_URL}/historial/exportar?limite=${limite}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let msg = 'No se pudo descargar el historial';
        try {
          const json = await res.json();
          msg = json?.error?.message || msg;
        } catch { /* ignora */ }
        throw new ApiError(res.status, 'ERR_DESCARGA', msg);
      }
      return res.blob();
    },
  },
  reportes: {
    generar: (desde, hasta) => request('/reportes', { query: { desde, hasta } }),
    descargar: async (desde, hasta, formato) => {
      const token = getToken();
      const params = new URLSearchParams({ desde, hasta, formato });
      const res = await fetch(`${API_URL}/reportes/exportar?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let msg = 'No se pudo descargar el reporte';
        try {
          const json = await res.json();
          msg = json?.error?.message || msg;
        } catch { /* ignora */ }
        throw new ApiError(res.status, 'ERR_DESCARGA', msg);
      }
      return res.blob();
    },
  },
};

/** Arma la URL publica de una foto subida (foto_novedad / foto_evidencia) */
export function urlFoto(nombreArchivo) {
  if (!nombreArchivo) return null;
  const base = API_URL.replace(/\/api\/?$/, '');
  return `${base}/uploads/${nombreArchivo}`;
}
