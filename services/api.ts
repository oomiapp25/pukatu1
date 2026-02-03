
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lottery, PurchaseRequest, ApiResponse, User, Purchase, SystemStats, Role, RegisterRequest } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_BUCKET } from '../constants';

export class PukatuAPI {
  private supabase: SupabaseClient;
  private user: User | null = null;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.initSession();
  }

  private async initSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      await this.fetchAndSetProfile(session.user.id, session.user.email || '');
    }
  }

  private async fetchAndSetProfile(id: string, email: string) {
    const { data, error } = await this.supabase
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
  }

  getCurrentUser(): User | null {
    if (!this.user) {
        const cached = localStorage.getItem('pukatu_user');
        if (cached) this.user = JSON.parse(cached);
    }
    return this.user;
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.user = null;
    localStorage.removeItem('pukatu_user');
  }

  private formatEmail(input: string): string {
    const clean = input.toLowerCase().trim();
    return clean.includes('@') ? clean : `${clean}@pukatu.com`;
  }

  async registerGAS(request: RegisterRequest): Promise<ApiResponse<User>> {
    const loginEmail = this.formatEmail(request.email);
    
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: loginEmail,
      password: request.password,
      options: {
        data: {
          full_name: request.name,
        }
      }
    });

    if (authError) return { success: false, error: authError.message };
    if (!authData.user) return { success: false, error: "Error al crear credenciales" };

    // 2. Crear perfil en tabla pública (el trigger SQL debería hacerlo, pero lo aseguramos)
    const { error: profileError } = await this.supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: request.email,
        name: request.name,
        role: request.role,
        status: 'active'
      });

    if (profileError) return { success: false, error: profileError.message };

    await this.fetchAndSetProfile(authData.user.id, request.email);
    return { success: true, data: this.user! };
  }

  async loginGAS(email: string, password?: string): Promise<ApiResponse<User>> {
    const loginEmail = this.formatEmail(email);
    
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password || '',
    });

    if (authError) {
        let msg = authError.message;
        if (msg === 'Invalid login credentials') {
            msg = 'Credenciales inválidas. Si no tienes cuenta, por favor regístrate primero.';
        }
        return { success: false, error: msg };
    }
    
    if (!authData.user) return { success: false, error: "Usuario no encontrado" };

    await this.fetchAndSetProfile(authData.user.id, email);
    return { success: true, data: this.user! };
  }

  async getActiveLotteries(): Promise<ApiResponse<Lottery[]>> {
    const { data, error } = await this.supabase
      .from('lotteries')
      .select('*')
      .eq('status', 'active')
      .order('draw_date', { ascending: true });

    if (error) return { success: false, error: error.message };
    
    return { success: true, data: this.mapLotteries(data) };
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
      createdBy: item.created_by,
      contactPhone: item.contact_phone,
      winningNumber: item.winning_number
    }));
  }

  async submitPurchase(request: PurchaseRequest): Promise<ApiResponse<{purchaseId: string, contactPhone?: string}>> {
    const { data: lotteryData } = await this.supabase
      .from('lotteries')
      .select('contact_phone, sold_numbers')
      .eq('id', request.lotteryId)
      .single();

    const { data, error } = await this.supabase
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

    const currentSold = lotteryData?.sold_numbers || [];
    await this.supabase
      .from('lotteries')
      .update({ sold_numbers: [...currentSold, ...request.selectedNumbers] })
      .eq('id', request.lotteryId);

    return { 
      success: true, 
      data: { purchaseId: data.id, contactPhone: lotteryData?.contact_phone } 
    };
  }

  async createLottery(lottery: Partial<Lottery>): Promise<ApiResponse<Lottery>> {
    const { data, error } = await this.supabase
      .from('lotteries')
      .insert({
        title: lottery.title,
        description: lottery.description,
        prize: lottery.prize,
        total_numbers: lottery.totalNumbers || 100,
        price_per_number: lottery.pricePerNumber || 10,
        status: 'active',
        draw_date: lottery.drawDate || new Date(Date.now() + 86400000).toISOString(),
        image_url: lottery.image,
        contact_phone: lottery.contactPhone || '584121234567',
        created_by: this.user?.id,
        sold_numbers: []
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as any };
  }

  async getLotteriesByUser(email: string, role: Role): Promise<ApiResponse<Lottery[]>> {
    let query = this.supabase.from('lotteries').select('*');
    if (role !== 'superadmin') {
        query = query.eq('created_by', this.user?.id);
    }
    
    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: this.mapLotteries(data) };
  }

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    const { count: uCount } = await this.supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: lCount } = await this.supabase.from('lotteries').select('*', { count: 'exact', head: true });
    const { data: rev } = await this.supabase.from('purchases').select('total_amount').eq('status', 'confirmed');
    const { count: pCount } = await this.supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    return { 
      success: true, 
      data: { 
        totalUsers: uCount || 0, 
        totalAdmins: 0, 
        totalLotteries: lCount || 0, 
        activeLotteries: lCount || 0, 
        totalRevenue: rev?.reduce((s, p) => s + Number(p.total_amount), 0) || 0, 
        pendingPayments: pCount || 0 
      } 
    };
  }
}
