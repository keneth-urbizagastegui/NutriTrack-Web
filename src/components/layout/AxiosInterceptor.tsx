import React, { useEffect } from 'react';
import axios from 'axios';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export const AxiosInterceptor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, refreshToken, updateAccessToken, logout } = useAuthStore();

  useEffect(() => {
    // 1. Interceptor de Request: Adjuntar JWT
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. Interceptor de Response: Manejo automático de Refresh Token
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Si la respuesta es 401 Unauthorized y no es una re-petición
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Si falla el login o el propio refresh, no reintentamos
          if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(error);
          }

          try {
            // Llamar al endpoint del backend para refrescar
            const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
              refreshToken: refreshToken,
            });

            const { accessToken: newAccess } = res.data;
            updateAccessToken(newAccess); // Actualizar Context y SessionStorage

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            }
            return api(originalRequest); // Reintentar petición
          } catch (refreshError) {
            logout(); // Si el refresh token expira o no es válido, desloguear usuario
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Limpieza de interceptores al desmontar o actualizar tokens
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken, updateAccessToken, logout]);

  return <>{children}</>;
};
