import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const api = {
  // Pickup related endpoints
  getPickups: async () => {
    return axios.get(`${API_BASE_URL}/api/pickups/all`, {
      headers: getAuthHeader()
    });
  },

  optimizePickups: async (date) => {
    return axios.post(`${API_BASE_URL}/api/pickups/optimize`, 
      { date },
      { headers: getAuthHeader() }
    );
  },

  // Driver related endpoints
  getDrivers: async () => {
    return axios.get(`${API_BASE_URL}/api/drivers`, {
      headers: getAuthHeader()
    });
  },

  // Fuel price related endpoints
  getCurrentFuelPrice: async () => {
    return axios.get(`${API_BASE_URL}/api/fuel-price/current`, {
      headers: getAuthHeader()
    });
  },

  updateFuelPrice: async (price) => {
    return axios.post(`${API_BASE_URL}/api/fuel-price/update`,
      { price },
      { headers: getAuthHeader() }
    );
  },

  // Leave request related endpoints
  getLeaveRequests: async () => {
    return axios.get(`${API_BASE_URL}/api/leave-requests/all`, {
      headers: getAuthHeader()
    });
  },

  updateLeaveRequest: async (requestId, status, response = '') => {
    return axios.put(`${API_BASE_URL}/api/leave-requests/${requestId}`,
      { status, adminResponse: response },
      { headers: getAuthHeader() }
    );
  },

  // Admin verification
  verifyAdmin: async () => {
    return axios.get(`${API_BASE_URL}/api/admins/verify`, {
      headers: getAuthHeader()
    });
  }
}; 