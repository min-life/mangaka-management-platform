import axios from "axios";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("access_token")
                : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let refreshPromise: Promise<any> | null = null;

api.interceptors.response.use(
    (response) => response?.data,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                if (!refreshPromise) {
                    refreshPromise = axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"}/auth/refresh`,
                        {},
                        { withCredentials: true }
                    )
                        .then((res) => res.data.access_token)
                        .finally(() => {
                            refreshPromise = null
                        });
                }
                const access_token = await refreshPromise;
                localStorage.setItem("access_token", access_token);
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return axios(originalRequest);

            } catch (rfError) {
                localStorage.removeItem("access_token");
                window.location.href = "/login";
                return Promise.reject(rfError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;