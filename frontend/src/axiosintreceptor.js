import axios from "axios"

const axiosInstance = axios.create({
    // baseURL: "http://localhost:5200/api",
    // baseURL: "/api",
    baseURL: "https://localfinds-backend-e2q7.onrender.com/api",
    withCredentials: true,
});


// Request interceptor to add JWT token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, redirect to login
            localStorage.removeItem("token");
            window.location.href = "/signin";
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
