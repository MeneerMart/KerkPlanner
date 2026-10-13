import axios from 'axios';

// In productie komt het adres uit VITE_API_URL (bijv. https://<app>.azurewebsites.net/api).
// Lokaal valt het terug op de backend op poort 5114 van dezelfde machine.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5114/api`,
});

// Voeg de JWT token automatisch toe aan elke request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});