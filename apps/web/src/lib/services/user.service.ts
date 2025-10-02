import { createClientComponentClient } from '@/lib/supabase'
import type { User, UserInsert as DBUserInsert, UserUpdate as DBUserUpdate } from '@employee-management/database'

export type UserProfile = User
export type UserInsert = DBUserInsert
export type UserUpdate = DBUserUpdate

export class UserService {
  private supabase = createClientComponentClient()

  // Get user profile by ID
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          address
        )
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  // Update user profile
  async updateProfile(userId: string, updates: UserUpdate): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          address
        )
      `)
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      throw error
    }

    return data
  }

  // Create user profile (used by trigger but can be called manually)
  async createProfile(profile: UserInsert): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .insert(profile)
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          address
        )
      `)
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      throw error
    }

    return data
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          address
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all users:', error)
      throw error
    }

    return data || []
  }

  // Get users by branch (admin/manager)
  async getUsersByBranch(branchId: string): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          address
        )
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users by branch:', error)
      throw error
    }

    return data || []
  }

  // Search users by name or email (admin only)
  async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          address
        )
      `)
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching users:', error)
      throw error
    }

    return data || []
  }

  // Toggle user active status (admin only)
  async toggleUserStatus(userId: string, isActive: boolean): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          address
        )
      `)
      .single()

    if (error) {
      console.error('Error updating user status:', error)
      throw error
    }

    return data
  }

  // Delete user profile (admin only - soft delete by setting is_active to false)
  async deleteUser(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      throw error
    }

    return true
  }
}

// Export singleton instance
export const userService = new UserService()