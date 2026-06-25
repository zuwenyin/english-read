import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 请求拦截器：自动附加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：code ≠ 0 抛出错误，401 清除 token 并跳转登录页
apiClient.interceptors.response.use(
  (response) => {
    const { code, message: msg, data } = response.data;
    if (code !== 0) {
      if (code === 40101) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // 避免在登录页本身产生循环跳转
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(new Error(msg || "请求失败"));
    }
    return data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || "网络错误";
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
