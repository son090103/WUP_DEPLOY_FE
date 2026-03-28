// baseAPIPublic.ts
import axios from "axios";

const baseAPIPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export default baseAPIPublic;