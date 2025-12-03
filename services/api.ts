
import { Lottery, PurchaseRequest, ApiResponse, User, Purchase, SystemStats, Role, RegisterRequest } from '../types';
import { API_BASE_URL, USE_MOCK_DATA, ZAPIER_WEBHOOK_URL } from '../constants';

// --- MOCK DATA (Fallback) ---
let MOCK_USERS: User[] = [
  { id: '1', email: 'super@pukatu.com', name: 'Super Admin', role: 'superadmin', password: '123', status: 'active' },
  { id: '2', email: 'admin@pukatu.com', name: 'Admin Principal', role: 'admin', password: '123', status: 'active' },
  { id: '3', email: 'user@pukatu.com', name: 'Juan Pérez', role: 'public', password: '123', status: 'active' }
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
    console.log("PUKATU API V6 INITIALIZED - GOOGLE SHEETS ONLY");
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

  // 🔐 AUTH REGISTER
  async registerGAS(request: RegisterRequest): Promise<ApiResponse<User>> {
    console.log("ATTEMPTING REGISTER via GAS:", request.email);
    const safeEmail = request.email ? String(request.email).trim() : '';

    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 800));
        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: safeEmail,
            name: request.name,
            role: request.role,
            password: request.password,
            status: request.status || 'active'
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
        email: safeEmail,
        name: request.name,
        password: request.password, 
        role: request.role
    });
    if (request.status) {
        params.append('status', request.status);
    }

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
  async loginGAS(email: string, password?: string): Promise<ApiResponse<User>> {
    console.log("ATTEMPTING LOGIN via GAS:", email);
    const safeEmail = email ? String(email).trim() : '';

    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 600));
      if (safeEmail === 'super@pukatu.com' && password !== 'Apamate.25') {
            return { success: false, error: 'Contraseña incorrecta para Super Admin' };
      }
      const user = MOCK_USERS.find(u => u.email === safeEmail);
      if (user) {
        if (safeEmail !== 'super@pukatu.com' && user.password && user.password !== password) {
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
        email: safeEmail,
        password: password || ''
    });
    
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
        targetUserEmail: userEmail
    });
    return this.fetchAPI(params, 'GET');
  }

  // --- PUBLIC METHODS ---

  async getActiveLotteries(): Promise<ApiResponse<Lottery[]>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 500));
      return { success: true, data: MOCK_LOTTERIES.filter(l => l.status === 'active') };
    }
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

    // 1. Send to Google Sheets (Database)
    const response = await this.fetchAPI(params, 'POST');

    // 2. Send to Zapier Webhook (Automation) - Fire and Forget
    if (response.success && ZAPIER_WEBHOOK_URL) {
        this.sendToZapier({
            event: 'new_purchase',
            timestamp: new Date().toISOString(),
            data: {
                ...request,
                purchaseId: response.data?.purchaseId,
                status: 'pending'
            }
        });
    }

    return response;
  }
  
  // ZAPIER INTEGRATION
  private async sendToZapier(payload: any) {
      try {
          if (!ZAPIER_WEBHOOK_URL) return;
          console.log("Sending to Zapier:", payload);
          await fetch(ZAPIER_WEBHOOK_URL, {
              method: 'POST',
              mode: 'no-cors', // Opaque request to avoid CORS issues with Zapier hooks
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
          });
      } catch (e) {
          console.warn("Zapier Webhook failed", e);
      }
  }

  // --- SUPER ADMIN METHODS ---

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 600));
      return { success: true, data: { totalUsers: 10, totalAdmins: 2, totalLotteries: 5, activeLotteries: 3, totalRevenue: 1000, pendingPayments: 1 } };
    }
    return this.fetchAPI(new URLSearchParams({ action: 'getSystemStats' }), 'GET');
  }

  async getMillionaireBag(): Promise<ApiResponse<any>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 600));
      return { success: true, data: { currentAmount: 100000, drawDate: 'Próximo Viernes', description: 'Bolsa acumulada' } };
    }
    return this.fetchAPI(new URLSearchParams({ action: 'getMillionaireBag' }), 'GET');
  }

  async updateMillionaireBag(data: any): Promise<ApiResponse<boolean>> {
    if (USE_MOCK_DATA) return { success: true, data: true };
    const params = new URLSearchParams({
        action: 'updateMillionaireBag',
        updates: JSON.stringify(data)
    });
    return this.fetchAPI(params, 'POST');
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    if (USE_MOCK_DATA) return { success: true, data: MOCK_USERS };
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

  async approveUser(userId: string): Promise<ApiResponse<boolean>> {
    if (USE_MOCK_DATA) {
      const user = MOCK_USERS.find(u => u.id === userId);
      if (user) user.status = 'active';
      return { success: true, data: true };
    }
    return this.fetchAPI(new URLSearchParams({ action: 'approveUser', targetUserId: userId }), 'POST');
  }

  async adminCreateUser(request: RegisterRequest): Promise<ApiResponse<User>> {
    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 800));
        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: request.email,
            name: request.name,
            role: request.role,
            password: request.password,
            status: request.status || 'active'
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

    if (request.status) {
        params.append('status', request.status);
    }
    
    return this.fetchAPI(params, 'POST');
  }

  // --- ADMIN METHODS ---

  async createLottery(lottery: Partial<Lottery>): Promise<ApiResponse<Lottery>> {
    if (USE_MOCK_DATA) {
        return { success: true, data: { ...lottery, id: '123', soldNumbers: [], status: 'active', image: '' } as Lottery };
    }
    
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

  async runLotteryDraw(lotteryId: string): Promise<ApiResponse<{winningNumber: number, status: string}>> {
    if (USE_MOCK_DATA) {
        const lottery = MOCK_LOTTERIES.find(l => l.id === lotteryId);
        if (!lottery || lottery.soldNumbers.length === 0) return { success: false, error: "No tickets sold" };
        const randomIdx = Math.floor(Math.random() * lottery.soldNumbers.length);
        const winner = lottery.soldNumbers[randomIdx];
        lottery.winningNumber = winner;
        return { success: true, data: { winningNumber: winner, status: 'completed' } };
    }

    const params = new URLSearchParams({
        action: 'runLotteryDraw',
        lotteryId: lotteryId
    });
    return this.fetchAPI(params, 'POST');
  }

  async getPendingPayments(): Promise<ApiResponse<Purchase[]>> {
    if (USE_MOCK_DATA) return { success: true, data: [] };
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
    return this.fetchAPI(new URLSearchParams({ action: 'getMyPurchases' }), 'GET');
  }

  // --- HELPER ---
  private async fetchAPI(params: URLSearchParams, method: 'GET' | 'POST' = 'POST') {
    try {
        const trimmedUrl = API_BASE_URL.trim();
        console.log("Calling GAS URL:", trimmedUrl, params.toString());
        
        if (trimmedUrl.includes('/macros/library/')) {
            return { success: false, error: 'CONFIGURATION_ERROR_LIBRARY_URL' } as any;
        }

        if (this.user) {
            params.append('userEmail', this.user.email);
            params.append('userRole', this.user.role);
            if (this.token) params.append('token', this.token);
        }

        const cacheBuster = `_cb=${new Date().getTime()}`;

        let response;
        if (method === 'GET') {
            const url = new URL(trimmedUrl);
            params.forEach((value, key) => url.searchParams.append(key, value));
            url.searchParams.append('_cb', new Date().getTime().toString());
            
            response = await fetch(url.toString(), {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
            });
        } else {
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
            return { success: false, error: 'CONNECTION_ERROR_CORS' } as any;
        }
        return { success: false, error: msg };
    }
  }
}
