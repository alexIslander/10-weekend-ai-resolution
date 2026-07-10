import { ReactiveController, ReactiveControllerHost } from 'lit';
import { currentUserSignal } from '../state/global-store';

// Mock Supabase client for demonstration purposes
// In real implementation, this would be the actual Supabase client
class MockSupabaseClient {
  auth = {
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Mock auth state change listener
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  };

  from = (table: string) => ({
    select: () => ({
      eq: () => ({
        data: [],
        error: null
      })
    }),
    insert: (data: any) => ({
      data: [],
      error: null
    }),
    delete: (conditions: any) => ({
      data: [],
      error: null
    })
  });
}

// Mock Supabase instance
const mockSupabase = new MockSupabaseClient();

export class SupabaseSyncController implements ReactiveController {
  host: ReactiveControllerHost;
  private profile: any = null;
  private completions: Record<string, boolean> = {};
  private supabase = mockSupabase;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    // Attach Supabase auth state change listener
    const { data } = this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          currentUserSignal.value = { id: session.user.id };
          this.syncUserData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        currentUserSignal.value = null;
      }
    });
  }

  hostDisconnected(): void {
    // Teardown logic would go here
    // For example: unsubscribe from auth listener
  }

  private async syncUserData(userId: string): Promise<void> {
    try {
      // Mock fetching user profile
      const profileResult = await this.supabase.from('user_profiles').select().eq('id', userId);
      if (!profileResult.error && profileResult.data.length > 0) {
        this.profile = profileResult.data[0];
      }

      // Mock fetching daily completions
      const completionsResult = await this.supabase.from('daily_completions').select().eq('user_id', userId);
      if (!completionsResult.error && completionsResult.data.length > 0) {
        this.completions = completionsResult.data.reduce((acc, item) => {
          acc[item.key] = item.completed;
          return acc;
        }, {} as Record<string, boolean>);
      }

      // Trigger a re-render
      this.host.requestUpdate();
    } catch (error) {
      console.error('Failed to sync user data:', error);
    }
  }

  public async toggleCompletion(key: string, itemId?: string): Promise<void> {
    // Optimistic update to UI
    const oldValue = this.completions[key];
    this.completions[key] = !oldValue;
    this.host.requestUpdate();

    try {
      if (oldValue) {
        // Delete completion
        await this.supabase.from('daily_completions').delete({ key });
      } else {
        // Insert completion
        await this.supabase.from('daily_completions').insert({
          key,
          user_id: currentUserSignal.value?.id,
          item_id: itemId,
          completed: true
        });
      }
    } catch (error) {
      // Rollback on error
      this.completions[key] = oldValue;
      this.host.requestUpdate();
      console.error('Failed to toggle completion:', error);
    }
  }
}