import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const { data } = await axios.post(`${base}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('token', data.token);
        err.config.headers.Authorization = `Bearer ${data.token}`;
        return api(err.config);
      } catch {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
