
import { Lottery, PurchaseRequest, ApiResponse, User, Purchase, SystemStats, Role, RegisterRequest } from '../types';
import { API_BASE_URL, USE_MOCK_DATA } from '../constants';

// --- MOCK DATA (Fallback) ---
let MOCK_USERS: User[] = [
  { id: '1', email: 'super@pukatu.com', name: 'Super Admin', role: 'superadmin', password: '123' },
  { id: '2', email: 'admin@pukatu.com', name: 'Admin Principal', role: 'admin', password: '123' },
  { id: '3', email: 'user@pukatu.com', name: 'Juan Pérez', role: 'public', password: '123' }
];

let MOCK_LOTTERIES: Lottery[] = [
  {
    id: '1',
    title: 'Gran Sorteo de Fin de Semana',
    description: '¡Gana un sedán de lujo nuevo o su equivalente de $50,000 en efectivo!',
    prize: '$50,000',
    totalNumbers: 100,
    pricePerNumber: 10,
    soldNumbers: [1, 5, 12, 44, 89, 92, 15, 22],
    status: 'active',
    drawDate: '2023-11-25',
    image: 'https://picsum.photos/400/250?random=1',
    createdBy: 'admin@pukatu.com',
    contactPhone: '584121234567'
  }
];

let MOCK_PURCHASES: Purchase[] = [];

export class PukatuAPI {
  private user: User | null = null;
  private token: string | null = null;

  constructor() {
    const storedUser = localStorage.getItem('pukatu_user');
    const storedToken = localStorage.getItem('pukatu_token');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch (e) {
        console.error("Failed to parse stored user", e);
        this.user = null;
      }
      this.token = storedToken;
    }
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('pukatu_user');
    localStorage.removeItem('pukatu_token');
  }

  // 🔐 AUTH REGISTER (Self-Registration)
  async register(request: RegisterRequest): Promise<ApiResponse<User>> {
    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 800));
        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: request.email,
            name: request.name,
            role: request.role,
            password: request.password
        };
        MOCK_USERS.push(newUser);
        this.user = newUser;
        this.token = 'mock_token_' + Date.now();
        localStorage.setItem('pukatu_user', JSON.stringify(newUser));
        localStorage.setItem('pukatu_token', this.token);
        return { success: true, data: newUser };
    }

    const params = new URLSearchParams({
        action: 'register',
        email: request.email,
        name: request.name,
        password: request.password, 
        role: request.role
    });
    // POST for sensitive data
    const response = await this.fetchAPI(params, 'POST');
    if (response.success && response.data) {
         this.user = response.data;
         this.token = response.token || 'session_token';
         localStorage.setItem('pukatu_user', JSON.stringify(this.user));
         localStorage.setItem('pukatu_token', this.token);
    }
    return response;
  }

  // 🔐 AUTH LOGIN
  async login(email: string, password?: string): Promise<ApiResponse<User>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 600));
      if (email === 'super@pukatu.com' && password !== 'Apamate.25') {
            return { success: false, error: 'Contraseña incorrecta para Super Admin' };
      }
      const user = MOCK_USERS.find(u => u.email === email);
      if (user) {
        if (email !== 'super@pukatu.com' && user.password && user.password !== password) {
             return { success: false, error: 'Contraseña incorrecta' };
        }
        this.user = user;
        this.token = 'mock_token_' + Date.now();
        localStorage.setItem('pukatu_user', JSON.stringify(user));
        localStorage.setItem('pukatu_token', this.token || '');
        return { success: true, data: user };
      }
      return { success: false, error: 'Usuario no encontrado' };
    }
    
    const params = new URLSearchParams({
        action: 'login',
        email: email,
        password: password || ''
    });
    
    // POST for security
    const response = await this.fetchAPI(params, 'POST');
    
    if (response.success && response.data) {
        this.user = response.data;
        this.token = response.token;
        localStorage.setItem('pukatu_user', JSON.stringify(this.user));
        localStorage.setItem('pukatu_token', this.token || '');
    }
    
    return response;
  }

  // 👤 USER LOTTERIES
  async getLotteriesByUser(userEmail: string, userRole: Role): Promise<ApiResponse<Lottery[]>> {
    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 400));
        let result: Lottery[] = [];
        if (userRole === 'superadmin') {
            result = MOCK_LOTTERIES;
        } else if (userRole === 'admin') {
            result = MOCK_LOTTERIES.filter(l => l.createdBy === userEmail);
        } else {
            const myPurchases = MOCK_PURCHASES.filter(p => p.email === userEmail);
            const myLotteryIds = myPurchases.map(p => p.lotteryId);
            result = MOCK_LOTTERIES.filter(l => myLotteryIds.includes(l.id));
        }
        return { success: true, data: result };
    }
    
    const params = new URLSearchParams({
        action: 'getLotteriesByUser',
        targetUserEmail: userEmail // We send this specific param for the query
    });
    // GET for reading data
    return this.fetchAPI(params, 'GET');
  }

  // --- PUBLIC METHODS ---

  async getActiveLotteries(): Promise<ApiResponse<Lottery[]>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 500));
      return { success: true, data: MOCK_LOTTERIES.filter(l => l.status === 'active') };
    }
    // GET for reading data
    return this.fetchAPI(new URLSearchParams({ action: 'getActiveLotteries' }), 'GET');
  }

  async submitPurchase(request: PurchaseRequest): Promise<ApiResponse<{purchaseId: string, contactPhone?: string}>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 1000));
      const newPurchase: Purchase = {
        ...request,
        id: 'p' + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        purchaseDate: new Date().toISOString().split('T')[0],
        lotteryTitle: 'Sorteo Mock'
      };
      MOCK_PURCHASES.push(newPurchase);
      return { success: true, data: { purchaseId: newPurchase.id, contactPhone: '584121234567' } };
    }

    const params = new URLSearchParams({
        action: 'purchaseNumber',
        lotteryId: request.lotteryId,
        buyerName: request.buyerName,
        email: request.email,
        selectedNumbers: JSON.stringify(request.selectedNumbers),
        totalAmount: request.totalAmount.toString()
    });
    // POST for writing
    return this.fetchAPI(params, 'POST');
  }

  // --- SUPER ADMIN METHODS ---

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 600));
      return { success: true, data: { totalUsers: 10, totalAdmins: 2, totalLotteries: 5, activeLotteries: 3, totalRevenue: 1000, pendingPayments: 1 } };
    }
    // GET for reading
    return this.fetchAPI(new URLSearchParams({ action: 'getSystemStats' }), 'GET');
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    if (USE_MOCK_DATA) return { success: true, data: MOCK_USERS };
    // GET for reading
    return this.fetchAPI(new URLSearchParams({ action: 'getAllUsers' }), 'GET');
  }

  async deleteLottery(id: string): Promise<ApiResponse<boolean>> {
      if (USE_MOCK_DATA) return { success: true, data: true };
      return this.fetchAPI(new URLSearchParams({ action: 'deleteLottery', lotteryId: id }), 'POST');
  }

  async updateLottery(id: string, updates: Partial<Lottery>): Promise<ApiResponse<boolean>> {
    if (USE_MOCK_DATA) return { success: true, data: true };
    const params = new URLSearchParams({
        action: 'updateLottery',
        lotteryId: id,
        updates: JSON.stringify(updates)
    });
    return this.fetchAPI(params, 'POST');
  }

  async toggleLotteryStatus(id: string): Promise<ApiResponse<boolean>> {
      if (USE_MOCK_DATA) return { success: true, data: true };
      return this.fetchAPI(new URLSearchParams({ action: 'toggleLotteryStatus', lotteryId: id }), 'POST');
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<boolean>> {
      if (USE_MOCK_DATA) return { success: true, data: true };
      const params = new URLSearchParams({
          action: 'updateUser',
          targetUserId: userId,
          updates: JSON.stringify(updates)
      });
      return this.fetchAPI(params, 'POST');
  }

  async deleteUser(userId: string): Promise<ApiResponse<boolean>> {
      if (USE_MOCK_DATA) return { success: true, data: true };
      return this.fetchAPI(new URLSearchParams({ action: 'deleteUser', targetUserId: userId }), 'POST');
  }

  // New method for Super Admin to create other users without logging in
  async adminCreateUser(request: RegisterRequest): Promise<ApiResponse<User>> {
    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 800));
        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: request.email,
            name: request.name,
            role: request.role,
            password: request.password
        };
        MOCK_USERS.push(newUser);
        return { success: true, data: newUser };
    }

    const params = new URLSearchParams({
        action: 'register',
        email: request.email,
        name: request.name,
        password: request.password, 
        role: request.role
    });
    
    // Call API but DO NOT update local session state
    return this.fetchAPI(params, 'POST');
  }

  // --- ADMIN METHODS ---

  async createLottery(lottery: Partial<Lottery>): Promise<ApiResponse<Lottery>> {
    if (USE_MOCK_DATA) {
        return { success: true, data: { ...lottery, id: '123', soldNumbers: [], status: 'active', image: '' } as Lottery };
    }
    
    // Ensure all required fields are present or stringify complex ones
    const params = new URLSearchParams();
    params.append('action', 'createLottery');
    Object.keys(lottery).forEach(key => {
        const val = lottery[key as keyof Lottery];
        if (val !== undefined) {
             params.append(key, String(val));
        }
    });
    
    return this.fetchAPI(params, 'POST');
  }

  async getPendingPayments(): Promise<ApiResponse<Purchase[]>> {
    if (USE_MOCK_DATA) return { success: true, data: [] };
    // GET for reading
    return this.fetchAPI(new URLSearchParams({ action: 'getPendingPayments' }), 'GET');
  }

  async confirmPayment(purchaseId: string): Promise<ApiResponse<boolean>> {
     if (USE_MOCK_DATA) return { success: true, data: true };
     return this.fetchAPI(new URLSearchParams({ action: 'confirmPayment', purchaseId }), 'POST');
  }

  async rejectPayment(purchaseId: string): Promise<ApiResponse<boolean>> {
     if (USE_MOCK_DATA) return { success: true, data: true };
     return this.fetchAPI(new URLSearchParams({ action: 'rejectPayment', purchaseId }), 'POST');
  }

  // --- USER METHODS ---
  async getMyPurchases(): Promise<ApiResponse<Purchase[]>> {
    if (USE_MOCK_DATA) return { success: true, data: [] };
    // GET for reading
    return this.fetchAPI(new URLSearchParams({ action: 'getMyPurchases' }), 'GET');
  }

  // --- HELPER ---
  private async fetchAPI(params: URLSearchParams, method: 'GET' | 'POST' = 'POST') {
    try {
        const trimmedUrl = API_BASE_URL.trim();
        
        // CRITICAL CHECK: User provided a Library URL instead of a Web App URL
        if (trimmedUrl.includes('/macros/library/')) {
            return { success: false, error: 'CONFIGURATION_ERROR_LIBRARY_URL' } as any;
        }

        if (this.user) {
            params.append('userEmail', this.user.email);
            params.append('userRole', this.user.role);
            if (this.token) params.append('token', this.token);
        }

        // Add cache buster to prevent cached CORS failures
        const cacheBuster = `_cb=${new Date().getTime()}`;

        let response;
        if (method === 'GET') {
            // Build query string for GET
            const url = new URL(trimmedUrl);
            params.forEach((value, key) => url.searchParams.append(key, value));
            url.searchParams.append('_cb', new Date().getTime().toString());
            
            response = await fetch(url.toString(), {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
            });
        } else {
            // POST with URLSearchParams body
            // We append cache buster to URL even for POST to ensure the endpoint hit is fresh
            const separator = trimmedUrl.includes('?') ? '&' : '?';
            const postUrl = `${trimmedUrl}${separator}${cacheBuster}`;

            response = await fetch(postUrl, {
                method: 'POST',
                mode: 'cors', 
                credentials: 'omit',
                body: params
            });
        }
        
        const text = await response.text();
        
        if (!response.ok) {
             console.error("Server Error:", text);
             throw new Error('Server error: ' + response.status);
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error. Raw response:", text);
            
            if (text.includes("script completed but did not return anything")) {
                return { success: false, error: "El script de Google no devolvió datos." };
            }
            if (text.includes("myFunction") || text.includes("function was deleted")) {
                 return { success: false, error: "Error de configuración GAS: Despliegue obsoleto. Crea una 'Nueva versión'." };
            }
            if (text.includes("Google Drive") || text.includes("Google Docs")) {
                return { success: false, error: "ACCESS_DENIED_HTML" };
            }
            return { success: false, error: 'Respuesta inválida (HTML recibido). Posible error de servidor.' };
        }

    } catch (error: any) {
        console.error("API Call Error Details:", error);
        
        let msg = error.message || 'Error de conexión.';
        if (msg.includes('Failed to fetch')) {
            // Return specific code that App.tsx recognizes
            return { success: false, error: 'CONNECTION_ERROR_CORS' } as any;
        }
        return { success: false, error: msg };
    }
  }
}
