import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending/receiving HTTP-Only cookies
});

// Request interceptor to add Access Token
const authInterceptor = (config: any) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
};

export const tradeAxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TRADE_API_URL || 'http://localhost:4002/api',
  withCredentials: true,
});

axiosInstance.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));
tradeAxiosInstance.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));


const responseInterceptor = [
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh-token') {
      originalRequest._retry = true;
      
      try {
        const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        
        const { accessToken, user } = res.data;
        useAuthStore.getState().setAuth(user, accessToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
] as const;

axiosInstance.interceptors.response.use(...responseInterceptor);
tradeAxiosInstance.interceptors.response.use(...responseInterceptor);
