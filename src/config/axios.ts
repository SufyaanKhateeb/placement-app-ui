import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "http://localhost:8090/api/v1",
    withCredentials: true,
});
