
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
    }
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.user = null;
    localStorage.removeItem('pukatu_user');
  }

  async registerGAS(request: RegisterRequest): Promise<ApiResponse<User>> {
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: request.email.includes('@') ? request.email : `${request.email}@pukatu.com`,
      password: request.password,
    });

    if (authError) return { success: false, error: authError.message };
    if (!authData.user) return { success: false, error: "Error al crear usuario" };

    const { error: profileError } = await this.supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: request.email,
        name: request.name,
        role: request.role,
        status: request.status || 'active'
      });

    if (profileError) return { success: false, error: profileError.message };

    await this.fetchAndSetProfile(authData.user.id, request.email);
    return { success: true, data: this.user! };
  }

  async loginGAS(email: string, password?: string): Promise<ApiResponse<User>> {
    const loginEmail = email.includes('@') ? email : `${email}@pukatu.com`;
    
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password || '',
    });

    if (authError) return { success: false, error: authError.message };
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
    
    // Adaptar nombres de campos de snake_case a camelCase para la app
    const lotteries: Lottery[] = data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      prize: item.prize,
      totalNumbers: item.total_numbers,
      pricePerNumber: item.price_per_number,
      soldNumbers: item.sold_numbers || [],
      status: item.status,
      drawDate: item.draw_date,
      image: item.image_url,
      createdBy: item.created_by,
      contactPhone: item.contact_phone,
      winningNumber: item.winning_number
    }));

    return { success: true, data: lotteries };
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

    // Actualizar números vendidos en la lotería
    const currentSold = lotteryData?.sold_numbers || [];
    await this.supabase
      .from('lotteries')
      .update({ sold_numbers: [...currentSold, ...request.selectedNumbers] })
      .eq('id', request.lotteryId);

    return { 
      success: true, 
      data: { 
        purchaseId: data.id, 
        contactPhone: lotteryData?.contact_phone 
      } 
    };
  }

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    const { count: usersCount } = await this.supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: lotteryCount } = await this.supabase.from('lotteries').select('*', { count: 'exact', head: true });
    const { data: revenueData } = await this.supabase.from('purchases').select('total_amount').eq('status', 'confirmed');

    const totalRevenue = revenueData?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

    return { 
      success: true, 
      data: { 
        totalUsers: usersCount || 0, 
        totalAdmins: 0, 
        totalLotteries: lotteryCount || 0, 
        activeLotteries: lotteryCount || 0, 
        totalRevenue, 
        pendingPayments: 0 
      } 
    };
  }

  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `lottery-covers/${fileName}`;

    const { error: uploadError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = this.supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async createLottery(lottery: Partial<Lottery>): Promise<ApiResponse<Lottery>> {
    const { data, error } = await this.supabase
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
        contact_phone: lottery.contactPhone,
        created_by: this.user?.id
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as any };
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const { data, error } = await this.supabase.from('profiles').select('*');
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as any };
  }

  async getLotteriesByUser(email: string, role: Role): Promise<ApiResponse<Lottery[]>> {
    let query = this.supabase.from('lotteries').select('*');
    if (role === 'admin') query = query.eq('created_by', this.user?.id);
    
    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    
    const lotteries: Lottery[] = data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      prize: item.prize,
      totalNumbers: item.total_numbers,
      pricePerNumber: item.price_per_number,
      soldNumbers: item.sold_numbers || [],
      status: item.status,
      drawDate: item.draw_date,
      image: item.image_url,
      createdBy: item.created_by,
      contactPhone: item.contact_phone,
      winningNumber: item.winning_number
    }));

    return { success: true, data: lotteries };
  }

  async getPendingPayments(): Promise<ApiResponse<Purchase[]>> {
    const { data, error } = await this.supabase
      .from('purchases')
      .select(`*, lotteries(title)`)
      .eq('status', 'pending');

    if (error) return { success: false, error: error.message };

    const purchases: Purchase[] = data.map(p => ({
      id: p.id,
      lotteryId: p.lottery_id,
      buyerName: p.buyer_name,
      email: p.email,
      selectedNumbers: p.selected_numbers,
      totalAmount: p.total_amount,
      status: p.status,
      purchaseDate: p.created_at,
      lotteryTitle: p.lotteries?.title
    }));

    return { success: true, data: purchases };
  }

  async confirmPayment(purchaseId: string): Promise<ApiResponse<boolean>> {
    const { error } = await this.supabase
      .from('purchases')
      .update({ status: 'confirmed' })
      .eq('id', purchaseId);

    return { success: !error, error: error?.message };
  }

  async rejectPayment(purchaseId: string): Promise<ApiResponse<boolean>> {
    const { error } = await this.supabase
      .from('purchases')
      .update({ status: 'rejected' })
      .eq('id', purchaseId);

    return { success: !error, error: error?.message };
  }
}
