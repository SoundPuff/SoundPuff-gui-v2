import axios from 'axios';

// Backend'in canlı adresi (Senin verdiğin linkten aldım)
const API_BASE_URL = '/api/v1';

// Axios servisini oluşturuyoruz
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her istekten önce çalışacak "Interceptor"
// Bu kısım, giriş yapmış kullanıcının "Token"ını otomatik ekler.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); // Token'ı tarayıcı hafızasından al
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Backend'e gönder
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;