import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Matches Spring Boot backend
  withCredentials: true, // IMPORTANT: Allows sending cookies (JSESSIONID)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;