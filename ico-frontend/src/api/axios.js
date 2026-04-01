import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    } else if (!error.response) {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const saveWalletAddress = async (address) => {
  const response = await api.post('/users/wallet', { address });
  return response.data;
};

export const savePurchase = async (round, ethAmount, tokenAmount, txHash) => {
  const response = await api.post('/purchases', {
    round,
    ethAmount,
    tokenAmount,
    txHash,
  });
  return response.data;
};

export const saveClaim = async (amount, txHash) => {
  const response = await api.post('/claims', {
    amount,
    txHash,
  });
  return response.data;
};

export const getPurchases = async (walletAddress) => {
  const response = await api.get(`/purchases/${walletAddress}`);
  return response.data;
};

export const getClaims = async (walletAddress) => {
  const response = await api.get(`/claims/${walletAddress}`);
  return response.data;
};

export const getAdminStats = async (walletAddress) => {
  const response = await api.get('/admin/stats', {
    headers: {
      'x-wallet-address': walletAddress,
    },
  });
  return response.data;
};

export const getAllPurchases = async (walletAddress) => {
  const response = await api.get('/admin/purchases', {
    headers: {
      'x-wallet-address': walletAddress,
    },
  });
  return response.data;
};

export default api;
