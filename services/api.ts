
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lottery, PurchaseRequest, ApiResponse, User, Purchase, SystemStats, Role, RegisterRequest } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

export class PukatuAPI {
  private supabase: SupabaseClient | null = null;
  private user: User | null = null;
  private isDemoMode: boolean = false;

  constructor() {
    try {
      // Intentar inicializar Supabase, si falla o las llaves son placeholders, entrar en modo Demo
      if (SUPABASE_URL.includes("placeholder") || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 20) {
        throw new Error("Supabase no configurado");
      }
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      this.initSession();
    } catch (e) {
      console.warn("⚠️ PUKATU: Iniciando en modo DEMO LOCAL (Sin conexión a base de datos)");
      this.isDemoMode = true;
    }
  }

  get isOffline(): boolean {
    return this.isDemoMode;
  }

  private async initSession() {
    if (!this.supabase) return;
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      await this.fetchAndSetProfile(session.user.id, session.user.email || '');
    }
  }

  private async fetchAndSetProfile(id: string, email: string) {
    if (this.isDemoMode) return;
    try {
      const { data, error } = await this.supabase!
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        this.user = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as Role,
          status: data.status
        };
        localStorage.setItem('pukatu_user', JSON.stringify(this.user));
      }
    } catch (e) {
      console.error("Error al obtener perfil:", e);
    }
  }

  getCurrentUser(): User | null {
    if (!this.user) {
        const cached = localStorage.getItem('pukatu_user');
        if (cached) {
          try {
            this.user = JSON.parse(cached);
          } catch(e) {
            localStorage.removeItem('pukatu_user');
          }
        }
    }
    return this.user;
  }

  async logout() {
    if (this.supabase) await this.supabase.auth.signOut();
    this.user = null;
    localStorage.removeItem('pukatu_user');
  }

  // Bypass para acceso inmediato cuando "no hay acceso"
  async devAccess(role: Role = 'superadmin'): Promise<ApiResponse<User>> {
    this.user = {
      id: 'dev-user-id',
      name: `Developer (${role})`,
      email: 'dev@pukatu.local',
      role: role,
      status: 'active'
    };
    localStorage.setItem('pukatu_user', JSON.stringify(this.user));
    return { success: true, data: this.user };
  }

  async loginGAS(email: string, password?: string): Promise<ApiResponse<User>> {
    if (this.isDemoMode) {
      // Mock Login para pruebas locales
      return this.devAccess(email.includes('root') ? 'superadmin' : 'admin');
    }

    const loginEmail = email.includes('@') ? email : `${email}@pukatu.com`;
    
    try {
      const { data: authData, error: authError } = await this.supabase!.auth.signInWithPassword({
        email: loginEmail,
        password: password || '',
      });

      if (authError) return { success: false, error: "Credenciales inválidas o error de conexión." };
      await this.fetchAndSetProfile(authData.user!.id, email);
      return { success: true, data: this.user! };
    } catch (e) {
      return { success: false, error: "Error de red con el servidor." };
    }
  }

  async getActiveLotteries(): Promise<ApiResponse<Lottery[]>> {
    if (this.isDemoMode) {
      const local = localStorage.getItem('pukatu_lotteries');
      const lotteries = local ? JSON.parse(local) : [];
      return { success: true, data: lotteries };
    }

    try {
      const { data, error } = await this.supabase!
        .from('lotteries')
        .select('*')
        .order('draw_date', { ascending: true });

      if (error) throw error;
      return { success: true, data: this.mapLotteries(data) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Fetch lotteries based on user email or role
  async getLotteriesByUser(email: string, role: Role): Promise<ApiResponse<Lottery[]>> {
    if (this.isDemoMode) {
      const local = localStorage.getItem('pukatu_lotteries');
      const lotteries = local ? JSON.parse(local) : [];
      return { success: true, data: lotteries };
    }

    try {
      const { data, error } = await this.supabase!
        .from('lotteries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: this.mapLotteries(data) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Delete a lottery by ID
  async deleteLottery(id: string): Promise<ApiResponse<void>> {
    if (this.isDemoMode) {
      const local = localStorage.getItem('pukatu_lotteries');
      let lotteries = local ? JSON.parse(local) : [];
      lotteries = lotteries.filter((l: any) => l.id !== id);
      localStorage.setItem('pukatu_lotteries', JSON.stringify(lotteries));
      return { success: true };
    }

    const { error } = await this.supabase!.from('lotteries').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // Update lottery status
  async updateLotteryStatus(id: string, status: string): Promise<ApiResponse<void>> {
    if (this.isDemoMode) {
      const local = localStorage.getItem('pukatu_lotteries');
      let lotteries = local ? JSON.parse(local) : [];
      lotteries = lotteries.map((l: any) => l.id === id ? { ...l, status } : l);
      localStorage.setItem('pukatu_lotteries', JSON.stringify(lotteries));
      return { success: true };
    }

    const { error } = await this.supabase!.from('lotteries').update({ status }).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  private mapLotteries(data: any[]): Lottery[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      prize: item.prize,
      totalNumbers: item.total_numbers,
      pricePerNumber: item.price_per_number,
      soldNumbers: item.sold_numbers || [],
      status: item.status,
      drawDate: item.draw_date,
      image: item.image_url || 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=1000&auto=format&fit=crop',
      winningNumber: item.winning_number,
      drawNarrative: item.draw_narrative
    }));
  }

  async createLottery(lottery: Partial<Lottery>): Promise<ApiResponse<Lottery>> {
    const newLottery = {
      ...lottery,
      id: Math.random().toString(36).substr(2, 9),
      sold_numbers: [],
      status: 'active',
      total_numbers: lottery.totalNumbers || 100,
      price_per_number: lottery.pricePerNumber || 10,
    };

    if (this.isDemoMode) {
      const local = localStorage.getItem('pukatu_lotteries');
      const lotteries = local ? JSON.parse(local) : [];
      lotteries.push(newLottery);
      localStorage.setItem('pukatu_lotteries', JSON.stringify(lotteries));
      return { success: true, data: newLottery as any };
    }

    const { data, error } = await this.supabase!
      .from('lotteries')
      .insert({
        title: lottery.title,
        description: lottery.description,
        prize: lottery.prize,
        total_numbers: lottery.totalNumbers,
        price_per_number: lottery.pricePerNumber,
        status: 'active',
        draw_date: lottery.drawDate,
        image_url: lottery.image,
        contact_phone: lottery.contact_phone,
        created_by: this.user?.id,
        sold_numbers: []
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as any };
  }

  async submitPurchase(request: PurchaseRequest): Promise<ApiResponse<{purchaseId: string, contactPhone?: string}>> {
    const pId = Math.random().toString(36).substr(2, 12).toUpperCase();
    
    if (this.isDemoMode) {
      // Actualizar números vendidos localmente
      const local = localStorage.getItem('pukatu_lotteries');
      let lotteries = local ? JSON.parse(local) : [];
      lotteries = lotteries.map((l: any) => {
        if (l.id === request.lotteryId) {
          return { ...l, soldNumbers: [...(l.soldNumbers || []), ...request.selectedNumbers] };
        }
        return l;
      });
      localStorage.setItem('pukatu_lotteries', JSON.stringify(lotteries));

      // Guardar compra
      const localP = localStorage.getItem('pukatu_purchases');
      const purchases = localP ? JSON.parse(localP) : [];
      purchases.push({ ...request, id: pId, status: 'pending', purchaseDate: new Date().toISOString(), lotteryTitle: 'Sorteo Local' });
      localStorage.setItem('pukatu_purchases', JSON.stringify(purchases));

      return { success: true, data: { purchaseId: pId, contactPhone: '584120000000' } };
    }

    // Lógica Supabase...
    const { data, error } = await this.supabase!
      .from('purchases')
      .insert({
        lottery_id: request.lotteryId,
        buyer_name: request.buyerName,
        email: request.email,
        selected_numbers: request.selectedNumbers,
        total_amount: request.totalAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: { purchaseId: data.id } };
  }

  // Fetch all purchases for verification
  async getPurchases(): Promise<ApiResponse<Purchase[]>> {
    if (this.isDemoMode) {
      const local = localStorage.getItem('pukatu_purchases');
      const purchases = local ? JSON.parse(local) : [];
      return { success: true, data: purchases };
    }

    try {
      const { data, error } = await this.supabase!
        .from('purchases')
        .select(`
          *,
          lotteries (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped: Purchase[] = data.map(item => ({
        id: item.id,
        lotteryId: item.lottery_id,
        buyerName: item.buyer_name,
        email: item.email,
        selectedNumbers: item.selected_numbers,
        totalAmount: item.total_amount,
        status: item.status,
        purchaseDate: item.created_at,
        lotteryTitle: item.lotteries?.title
      }));

      return { success: true, data: mapped };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Confirm a purchase payment
  async confirmPurchase(id: string): Promise<ApiResponse<void>> {
    if (this.isDemoMode) {
      const local = localStorage.getItem('pukatu_purchases');
      let purchases = local ? JSON.parse(local) : [];
      purchases = purchases.map((p: any) => p.id === id ? { ...p, status: 'confirmed' } : p);
      localStorage.setItem('pukatu_purchases', JSON.stringify(purchases));
      return { success: true };
    }

    const { error } = await this.supabase!.from('purchases').update({ status: 'confirmed' }).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // Finalize a lottery draw
  async finalizeDraw(id: string, winningNumber: number, narrative: string): Promise<ApiResponse<void>> {
    if (this.isDemoMode) {
      const local = localStorage.getItem('pukatu_lotteries');
      let lotteries = local ? JSON.parse(local) : [];
      lotteries = lotteries.map((l: any) => l.id === id ? { 
        ...l, 
        status: 'completed', 
        winningNumber, 
        drawNarrative: narrative 
      } : l);
      localStorage.setItem('pukatu_lotteries', JSON.stringify(lotteries));
      return { success: true };
    }

    const { error } = await this.supabase!.from('lotteries').update({ 
      status: 'completed', 
      winning_number: winningNumber, 
      draw_narrative: narrative 
    }).eq('id', id);
    
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    if (this.isDemoMode) {
      return { 
        success: true, 
        data: { totalUsers: 5, totalAdmins: 2, totalLotteries: 3, activeLotteries: 2, totalRevenue: 1500, pendingPayments: 4 } 
      };
    }
    // Lógica Supabase real...
    return { success: false, error: "Servicio no disponible" };
  }
}
