import { Lottery, PurchaseRequest, ApiResponse, User, Purchase, SystemStats, Role } from '../types';
import { API_BASE_URL, USE_MOCK_DATA } from '../constants';

// --- MOCK DATA ---
const MOCK_USERS: User[] = [
  { id: '1', email: 'super@pukatu.com', name: 'Super Admin', role: 'superadmin' },
  { id: '2', email: 'admin@pukatu.com', name: 'Admin Principal', role: 'admin' },
  { id: '3', email: 'user@pukatu.com', name: 'Juan Pérez', role: 'public' }
];

const MOCK_LOTTERIES: Lottery[] = [
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
    createdBy: 'admin@pukatu.com'
  },
  {
    id: '2',
    title: 'Bonanza Tecnológica',
    description: 'El último paquete de laptop, smartphone y tablet.',
    prize: 'Pack Tech',
    totalNumbers: 50,
    pricePerNumber: 25,
    soldNumbers: [2, 3, 4, 10, 20, 30, 40, 49],
    status: 'active',
    drawDate: '2023-11-30',
    image: 'https://picsum.photos/400/250?random=2',
    createdBy: 'super@pukatu.com'
  }
];

const MOCK_PURCHASES: Purchase[] = [
  {
    id: 'p1',
    lotteryId: '1',
    lotteryTitle: 'Gran Sorteo de Fin de Semana',
    buyerName: 'Juan Pérez',
    email: 'user@pukatu.com',
    selectedNumbers: [5, 12],
    totalAmount: 20,
    status: 'confirmed',
    purchaseDate: '2023-11-20'
  },
  {
    id: 'p2',
    lotteryId: '2',
    lotteryTitle: 'Bonanza Tecnológica',
    buyerName: 'Pedro Pendiente',
    email: 'pedro@mail.com',
    selectedNumbers: [10],
    totalAmount: 25,
    status: 'pending',
    purchaseDate: '2023-11-21'
  }
];

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

  // 🔐 AUTH
  async login(email: string): Promise<ApiResponse<User>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 600)); // Simulate latency
      const user = MOCK_USERS.find(u => u.email === email);
      
      if (user) {
        this.user = user;
        this.token = 'mock_token_' + Date.now();
        localStorage.setItem('pukatu_user', JSON.stringify(user));
        localStorage.setItem('pukatu_token', this.token || '');
        return { success: true, data: user };
      }
      return { success: false, error: 'Usuario no encontrado (Prueba super@pukatu.com, admin@pukatu.com, o user@pukatu.com)' };
    }
    
    // Real fetch logic would go here
    return { success: false, error: 'Backend no conectado' };
  }

  // 👤 USER LOTTERIES (Filtered by Role)
  async getLotteriesByUser(userEmail: string, userRole: Role): Promise<ApiResponse<Lottery[]>> {
    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 400));
        let result: Lottery[] = [];

        if (userRole === 'superadmin') {
            result = MOCK_LOTTERIES;
        } else if (userRole === 'admin') {
            result = MOCK_LOTTERIES.filter(l => l.createdBy === userEmail);
        } else {
            // Public user sees lotteries they participated in
            const myPurchases = MOCK_PURCHASES.filter(p => p.email === userEmail);
            const myLotteryIds = myPurchases.map(p => p.lotteryId);
            result = MOCK_LOTTERIES.filter(l => myLotteryIds.includes(l.id));
        }
        return { success: true, data: result };
    }
    
    const params = new URLSearchParams({
        action: 'getLotteriesByUser',
        userEmail,
        userRole,
        targetUserEmail: userEmail
    });
    return this.fetchAPI(params);
  }

  // --- PUBLIC METHODS ---

  async getActiveLotteries(): Promise<ApiResponse<Lottery[]>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 500));
      return { success: true, data: MOCK_LOTTERIES.filter(l => l.status === 'active') };
    }
    return this.fetchAPI(new URLSearchParams({ action: 'getActiveLotteries' }));
  }

  async submitPurchase(request: PurchaseRequest): Promise<ApiResponse<string>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 1500));
      
      const newPurchase: Purchase = {
        ...request,
        id: 'p' + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        purchaseDate: new Date().toISOString().split('T')[0],
        lotteryTitle: MOCK_LOTTERIES.find(l => l.id === request.lotteryId)?.title || 'Sorteo'
      };
      MOCK_PURCHASES.push(newPurchase);
      
      // Update lottery sold numbers in mock db
      const lottery = MOCK_LOTTERIES.find(l => l.id === request.lotteryId);
      if (lottery) {
          lottery.soldNumbers = [...lottery.soldNumbers, ...request.selectedNumbers];
      }

      return { success: true, data: newPurchase.id };
    }
    return { success: false, error: 'Backend no conectado' };
  }

  // --- SUPER ADMIN METHODS ---

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 600));
      return {
        success: true,
        data: {
          totalUsers: 150,
          totalAdmins: 5,
          totalLotteries: MOCK_LOTTERIES.length,
          activeLotteries: MOCK_LOTTERIES.filter(l => l.status === 'active').length,
          totalRevenue: 15420,
          pendingPayments: MOCK_PURCHASES.filter(p => p.status === 'pending').length
        }
      };
    }
    return { success: false, error: 'Error de API' };
  }

  // --- ADMIN METHODS ---

  async createLottery(lottery: Partial<Lottery>): Promise<ApiResponse<Lottery>> {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 1000));
      const newLottery: Lottery = {
        ...lottery as Lottery,
        id: Math.random().toString(36).substr(2, 9),
        soldNumbers: [],
        status: 'active',
        image: 'https://picsum.photos/400/250?random=' + Math.random(),
        createdBy: this.user?.email
      };
      MOCK_LOTTERIES.push(newLottery);
      return { success: true, data: newLottery };
    }
    return { success: false };
  }

  async getPendingPayments(): Promise<ApiResponse<Purchase[]>> {
    if (USE_MOCK_DATA) {
        // If admin, show payments for their lotteries. If Super, show all.
        let filtered = MOCK_PURCHASES.filter(p => p.status === 'pending');
        if (this.user?.role === 'admin') {
            const myLotteryIds = MOCK_LOTTERIES.filter(l => l.createdBy === this.user?.email).map(l => l.id);
            filtered = filtered.filter(p => myLotteryIds.includes(p.lotteryId));
        }
        return { success: true, data: filtered };
    }
    return { success: false };
  }

  async confirmPayment(purchaseId: string): Promise<ApiResponse<boolean>> {
     if (USE_MOCK_DATA) {
         await new Promise(r => setTimeout(r, 500));
         const purchase = MOCK_PURCHASES.find(p => p.id === purchaseId);
         if(purchase) purchase.status = 'confirmed';
         return { success: true, data: true };
     }
     return { success: false };
  }

  // --- USER METHODS ---
  async getMyPurchases(): Promise<ApiResponse<Purchase[]>> {
    if (USE_MOCK_DATA) {
        if (!this.user) return { success: false, error: 'No autorizado' };
        return { success: true, data: MOCK_PURCHASES.filter(p => p.email === this.user?.email) };
    }
    return { success: false };
  }

  // --- HELPER FOR REAL FETCH ---
  private async fetchAPI(params: URLSearchParams) {
    try {
        // Append auth info if available
        if (this.user) {
            params.append('userEmail', this.user.email);
            params.append('userRole', this.user.role);
            if (this.token) params.append('token', this.token);
        }

        const response = await fetch(`${API_BASE_URL}?${params}`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.error("API Call Error", error);
        return { success: false, error: 'Error de conexión' };
    }
  }
}