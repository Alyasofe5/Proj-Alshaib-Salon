import axios from "axios";
import Cookies from "js-cookie";

// عنوان الـ API - عدّل حسب بيئتك
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost/Proj-Alshaib-Salon/backend/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false, // We use js-cookie manually, not browser credentials
    timeout: 15000, // 15 second timeout for slow mobile networks
});

// إضافة Token تلقائياً لكل request
api.interceptors.request.use((config) => {
    const token = Cookies.get("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// معالجة الأخطاء تلقائياً
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove("token");
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// ===== Auth API =====
export const authAPI = {
    login: (username: string, password: string) =>
        api.post("/auth/login.php", { username, password }),
    me: () => api.get("/auth/me.php"),
};

// ===== Dashboard API =====
export const dashboardAPI = {
    getStats: () => api.get("/dashboard/stats.php"),
};

// ===== Employees API =====
export const employeesAPI = {
    getAll: () => api.get("/employees/index.php"),
    getOne: (id: number) => api.get(`/employees/manage.php?id=${id}`),
    create: (data: Record<string, unknown>) => api.post("/employees/index.php", data),
    update: (id: number, data: Record<string, unknown>) =>
        api.put(`/employees/manage.php?id=${id}`, data),
    delete: (id: number) => api.delete(`/employees/manage.php?id=${id}`),
};

// ===== Services API =====
export const servicesAPI = {
    getAll: (activeOnly = false) =>
        api.get(`/services/index.php${activeOnly ? "?active_only=1" : ""}`),
    create: (data: Record<string, unknown>) => api.post("/services/index.php", data),
    update: (id: number, data: Record<string, unknown>) =>
        api.put(`/services/manage.php?id=${id}`, data),
    toggle: (id: number) => api.patch(`/services/manage.php?id=${id}`),
    delete: (id: number) => api.delete(`/services/manage.php?id=${id}`),
    uploadImage: (id: number, file: File) => {
        const formData = new FormData();
        formData.append("image", file);
        return api.post(`/services/image.php?id=${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};

// ===== Transactions API =====
export const transactionsAPI = {
    getAll: (params?: Record<string, string>) =>
        api.get("/transactions/index.php", { params }),
    getOne: (id: number) => api.get(`/transactions/manage.php?id=${id}`),
    create: (data: Record<string, unknown>) =>
        api.post("/transactions/index.php", data),
    delete: (id: number) => api.delete(`/transactions/manage.php?id=${id}`),
};

// ===== Expenses API =====
export const expensesAPI = {
    getAll: (params?: Record<string, string>) =>
        api.get("/expenses/index.php", { params }),
    create: (data: Record<string, unknown>) => api.post("/expenses/index.php", data),
    delete: (id: number) => api.delete(`/expenses/manage.php?id=${id}`),
};

// ===== Reports API =====
export const reportsAPI = {
    daily: (params?: Record<string, string>) =>
        api.get("/reports/daily.php", { params }),
    monthly: (params?: Record<string, string>) =>
        api.get("/reports/monthly.php", { params }),
    yearly: (params?: Record<string, string>) =>
        api.get("/reports/yearly.php", { params }),
    employee: (params?: Record<string, string>) =>
        api.get("/reports/employee.php", { params }),
};

// ===== Users API =====
export const usersAPI = {
    getAll: () => api.get("/users/index.php"),
    create: (data: Record<string, unknown>) => api.post("/users/index.php", data),
    resetPassword: (id: number, newPassword: string) =>
        api.put(`/users/manage.php?id=${id}`, {
            action: "reset_password",
            new_password: newPassword,
        }),
    toggle: (id: number) =>
        api.put(`/users/manage.php?id=${id}`, { action: "toggle" }),
    delete: (id: number) => api.delete(`/users/manage.php?id=${id}`),
};

// ===== Salon API =====
export const salonAPI = {
    getSettings: () => api.get("/salon/settings.php"),
    updateSettings: (data: Record<string, unknown>) =>
        api.put("/salon/settings.php", data),
    uploadLogo: (file: File) => {
        const formData = new FormData();
        formData.append("logo", file);
        return api.post("/salon/logo.php", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    uploadHeroImage: (file: File) => {
        const formData = new FormData();
        formData.append("hero_image", file);
        return api.post("/salon/hero.php", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};

// ===== Bookings API =====
export const bookingsAPI = {
    getAll: (params?: Record<string, string>) =>
        api.get("/bookings/index.php", { params }),
    calendar: (month: string) =>
        api.get("/bookings/index.php", { params: { view: "calendar", month } }),
    updateStatus: (id: number, data: Record<string, unknown>) =>
        api.patch(`/bookings/index.php?id=${id}`, data),
    delete: (id: number) =>
        api.delete(`/bookings/index.php?id=${id}`),
    createBooking: (data: Record<string, unknown>) =>
        api.post("/bookings/index.php", data),
    getBookedSlots: (slug: string, date: string) =>
        api.get("/booking/book.php", { params: { slug, date } }),
};
