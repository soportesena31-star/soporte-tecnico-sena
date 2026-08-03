import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function recuperarSesion() {
      const token = getToken();
      if (!token) {
        setCargando(false);
        return;
      }
      try {
        const perfil = await api.auth.perfil();
        setUsuario(perfil);
      } catch {
        setToken(null);
      } finally {
        setCargando(false);
      }
    }
    recuperarSesion();
  }, []);

  async function login(email, password) {
    const { token, usuario: u } = await api.auth.login(email, password);
    setToken(token);
    setUsuario(u);
    return u;
  }

  function logout() {
    setToken(null);
    setUsuario(null);
  }

  function setUsuarioDirecto(u) {
    setUsuario(u);
  }

  return (
    <AuthContext.Provider value={{
      usuario, cargando, login, logout, setUsuarioDirecto,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
