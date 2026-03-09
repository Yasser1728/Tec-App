import axios from 'axios';

const client = axios.create({
    baseURL: 'https://api.example.com', // Replace with your API URL
    timeout: 1000,
});

// Request interceptor for adding token
client.interceptors.request.use(config => {
    const token = localStorage.getItem('token'); // Assume token is stored in localStorage
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Response interceptor for handling errors
client.interceptors.response.use(response => {
    return response;
}, error => {
    // Handle token expiration or any other errors
    if (error.response.status === 401) {
        // Token is invalid or expired
        console.log('Unauthorized access - maybe redirect to login?');
    }
    return Promise.reject(error);
});

export default client;