import axios from 'axios';

// Let op: Check in je Backend terminal (als je 'dotnet run' typt) of deze poort klopt!
// Meestal is dit https://localhost:7193 of http://localhost:5000 of iets vergelijkbaars.
export const api = axios.create({
  baseURL: `http://${window.location.hostname}:5114/api`,
});

// Voeg de JWT token automatisch toe aan elke request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});