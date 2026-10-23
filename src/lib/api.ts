import axios from 'axios';

// Base URL for the backend API
export const API_BASE_URL = 'https://gdpebackend.vercel.app/api/';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach bearer token if it exists in localStorage
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (e.g. unauthorized redirects)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Avoid redirect loop if already on auth page
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Endpoints definitions matching Postman Collection
export const authApi = {
  register: (data: any) => apiClient.post('auth/register', data),
  sendOtp: (email: string) => apiClient.post('auth/send-otp', { email }),
  verifyOtp: (email: string, otp: string) => apiClient.post('auth/verify-otp', { email, otp }),
  getMe: () => apiClient.get('auth/me'),
  updateProfile: (data: any) => apiClient.put('auth/update-profile', data),
  verifyEmail: (token: string) => apiClient.get(`auth/verify-email/${token}`),
};

export const adminApi = {
  getDashboard: () => apiClient.get('admin/dashboard'),
  getUsers: (page: number = 1, limit: number = 10, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search && search.trim()) {
      params.append('search', search.trim());
      params.append('q', search.trim());
      params.append('query', search.trim());
    }
    return apiClient.get(`admin/users?${params.toString()}`);
  },
  getAllUsers: (search?: string) => {
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '10000');
    if (search && search.trim()) {
      params.append('search', search.trim());
      params.append('q', search.trim());
      params.append('query', search.trim());
    }
    return apiClient.get(`admin/users?${params.toString()}`);
  },
  getUserDetails: (id: string) => apiClient.get(`admin/users/${id}`),
  blockUser: (id: string) => apiClient.patch(`admin/users/${id}/block`),
  unblockUser: (id: string) => apiClient.patch(`admin/users/${id}/unblock`),
  activateUser: (id: string) => apiClient.patch(`admin/users/${id}/activate`),
  deactivateUser: (id: string) => apiClient.patch(`admin/users/${id}/deactivate`),
  
  // Wallet Direct Adjustment
  adjustWallet: (data: { userId: string; amount: number; type: 'credit' | 'debit'; description: string }) => 
    apiClient.post('wallet/admin/adjust', data),

  // Settings Controls
  getSettings: () => apiClient.get('admin/settings'),
  updateMaintenance: (data: { maintenanceMode: boolean; maintenanceMessage: string }) => 
    apiClient.put('admin/settings/maintenance', data),
  updateAppControl: (data: { forceUpdate: boolean; updateMessage: string; currentVersion: string }) => 
    apiClient.put('admin/settings/update-control', data),
  updatePaymentMethods: (data: { 
    qrCode: { enabled: boolean; imageUrl: string }; 
    bankAccount: { enabled: boolean; accountHolder: string; bankName: string; accountNumber: string; ifscCode: string; upiId: string } 
  }) => apiClient.put('admin/settings/payment', data),
  
  // Settings Contacts
  addContact: (data: { type: string; label: string; value: string }) => apiClient.post('admin/contacts', data),
  updateContact: (id: string, data: { type: string; label: string; value: string }) => apiClient.put(`admin/contacts/${id}`, data),
  deleteContact: (id: string) => apiClient.delete(`admin/contacts/${id}`),
};

export const planApi = {
  getPlansAdmin: () => apiClient.get('plans/admin'),
  createPlan: (data: { name: string; amount: number; description: string; incomeOnApproval?: number }) => apiClient.post('plans/admin', data),
  updatePlan: (id: string, data: { name: string; amount: number; description: string; incomeOnApproval?: number }) => apiClient.put(`plans/admin/${id}`, data),
  deletePlan: (id: string) => apiClient.delete(`plans/admin/${id}`),
  togglePlan: (id: string) => apiClient.patch(`plans/admin/${id}/toggle`),
  getPlansUser: () => apiClient.get('plans'),
};

export const giftCodeApi = {
  getGiftCodesAdmin: () => apiClient.get('gift-codes/admin'),
  createGiftCode: (data: { code: string; rewardAmount: number; maxUsers: number; expiryDate: string }) => 
    apiClient.post('gift-codes/admin', data),
  updateGiftCode: (id: string, data: { code: string; rewardAmount: number; maxUsers: number; expiryDate: string }) => 
    apiClient.put(`gift-codes/admin/${id}`, data),
  deleteGiftCode: (id: string) => apiClient.delete(`gift-codes/admin/${id}`),
  toggleGiftCode: (id: string) => apiClient.patch(`gift-codes/admin/${id}/toggle`),
};

export const depositApi = {
  getAllDepositsAdmin: (page: number = 1, limit: number = 10) => apiClient.get(`deposits/admin?page=${page}&limit=${limit}`),
  approveDeposit: (id: string, reason?: string) => apiClient.put(`deposits/admin/${id}/approve`, { reason }),
  rejectDeposit: (id: string) => apiClient.put(`deposits/admin/${id}/reject`),
  
  // User endpoints for sandbox testing
  userCreateDeposit: (formData: FormData) => apiClient.post('deposits', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getUserDeposits: () => apiClient.get('deposits'),
};

export const withdrawalApi = {
  getAllWithdrawalsAdmin: (page: number = 1, limit: number = 10) => apiClient.get(`withdrawals/admin?page=${page}&limit=${limit}`),
  approveWithdrawal: (id: string) => apiClient.put(`withdrawals/admin/${id}/approve`),
  rejectWithdrawal: (id: string) => apiClient.put(`withdrawals/admin/${id}/reject`),
  
  // User endpoints for sandbox testing
  userCreateWithdrawal: (data: { amount: number; bankDetails: { accountHolderName: string; bankName: string; accountNumber: string; ifscCode: string; upiId: string } }) => 
    apiClient.post('withdrawals', data),
  getUserWithdrawals: () => apiClient.get('withdrawals'),
};

export const taskApi = {
  getAllTasksAdmin: () => apiClient.get('tasks/admin'),
  createTask: (data: { title: string; description: string; rewardAmount: number }) => apiClient.post('tasks/admin', data),
  updateTask: (id: string, data: { title: string; description: string; rewardAmount: number }) => apiClient.put(`tasks/admin/${id}`, data),
  deleteTask: (id: string) => apiClient.delete(`tasks/admin/${id}`),
  toggleTask: (id: string) => apiClient.patch(`tasks/admin/${id}/toggle`),
  
  // Task submissions management
  getAllSubmissionsAdmin: () => apiClient.get('tasks/admin/submissions'),
  approveSubmission: (id: string) => apiClient.put(`tasks/admin/submissions/${id}/approve`),
  rejectSubmission: (id: string) => apiClient.put(`tasks/admin/submissions/${id}/reject`),
  
  // User endpoints for sandbox testing
  userGetTasks: () => apiClient.get('tasks'),
  userSubmitTask: (id: string, formData: FormData) => apiClient.post(`tasks/${id}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  userGetSubmissions: () => apiClient.get('tasks/submissions'),
};

export const notificationApi = {
  getNotifications: () => apiClient.get('notifications'),
  getUnreadCount: () => apiClient.get('notifications/unread-count'),
  markAllRead: () => apiClient.patch('notifications/read-all'),
  markRead: (id: string) => apiClient.patch(`notifications/${id}/read`),
};

export const walletApi = {
  getWallet: () => apiClient.get('wallet'),
  getTransactions: () => apiClient.get('wallet/transactions'),
};

export const publicApi = {
  getSettings: () => apiClient.get('app/settings'),
  getPaymentMethods: () => apiClient.get('payment-methods'),
  getContacts: () => apiClient.get('contacts'),
};

export const referralApi = {
  getMyTeam: () => apiClient.get('referral/my-team'),
  getCommissions: () => apiClient.get('referral/commissions'),
  getStats: () => apiClient.get('referral/stats'),
  getCommissionsAdmin: () => apiClient.get('referral/admin/commissions'),
  runIncomeAdmin: () => apiClient.post('referral/admin/run-income'),
};

export const upiApi = {
  getMyUpi: () => apiClient.get('upi/my'),
  createUpi: (data: { upiId: string; accountHolderName: string; isPrimary: boolean }) => apiClient.post('upi', data),
  updateUpi: (id: string, data: { upiId?: string; accountHolderName?: string; isPrimary?: boolean }) => apiClient.put(`upi/${id}`, data),
  deleteUpi: (id: string) => apiClient.delete(`upi/${id}`),
  getAllUpisAdmin: (page: number = 1, limit: number = 10) => apiClient.get(`upi/admin/all?page=${page}&limit=${limit}`),
};

export const paymentMethodApi = {
  getPaymentMethods: () => apiClient.get('payment/payment-methods'),
  getPaymentMethodsAdmin: () => apiClient.get('payment/admin/payment-methods'),
  enablePaymentMethod: (data: { type: 'upi' | 'bank'; enabled: boolean | string }) => 
    apiClient.put('payment/admin/payment-methods/enable', data),
  addPaymentMethod: (data: any) => apiClient.post('payment/admin/payment-methods', data),
  updatePaymentMethod: (id: string, data: any) => apiClient.put(`payment/admin/payment-methods/${id}`, data),
  deletePaymentMethod: (id: string) => apiClient.delete(`payment/admin/payment-methods/${id}`),
};


