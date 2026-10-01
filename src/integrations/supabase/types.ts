export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answered_duas: {
        Row: {
          answered_date: string
          category: string
          created_at: string
          dua_text: string | null
          id: string
          reflection: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answered_date?: string
          category?: string
          created_at?: string
          dua_text?: string | null
          id?: string
          reflection?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answered_date?: string
          category?: string
          created_at?: string
          dua_text?: string | null
          id?: string
          reflection?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dhikr_logs: {
        Row: {
          category: string | null
          count: number | null
          created_at: string | null
          id: string
          log_date: string
          notes: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          count?: number | null
          created_at?: string | null
          id?: string
          log_date: string
          notes?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          count?: number | null
          created_at?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      duas: {
        Row: {
          arabic: string | null
          category: string | null
          created_at: string | null
          favorited: boolean | null
          id: string
          personal_note: string | null
          source: string | null
          title: string
          translation: string | null
          transliteration: string | null
          updated_at: string | null
          user_id: string
          when_to_recite: string | null
        }
        Insert: {
          arabic?: string | null
          category?: string | null
          created_at?: string | null
          favorited?: boolean | null
          id?: string
          personal_note?: string | null
          source?: string | null
          title: string
          translation?: string | null
          transliteration?: string | null
          updated_at?: string | null
          user_id: string
          when_to_recite?: string | null
        }
        Update: {
          arabic?: string | null
          category?: string | null
          created_at?: string | null
          favorited?: boolean | null
          id?: string
          personal_note?: string | null
          source?: string | null
          title?: string
          translation?: string | null
          transliteration?: string | null
          updated_at?: string | null
          user_id?: string
          when_to_recite?: string | null
        }
        Relationships: []
      }
      fasting_logs: {
        Row: {
          completed: boolean | null
          created_at: string | null
          fast_type: string | null
          id: string
          log_date: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          fast_type?: string | null
          id?: string
          log_date: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          fast_type?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          linked_habits: string[] | null
          quarter: string | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
          user_id: string
          why: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          linked_habits?: string[] | null
          quarter?: string | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          why?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          linked_habits?: string[] | null
          quarter?: string | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          calc_method: string | null
          created_at: string | null
          display_name: string | null
          id: string
          latitude: number | null
          location_label: string | null
          longitude: number | null
          madhab: string | null
          onboarding_complete: boolean | null
          seeded: boolean | null
          theme: string | null
          updated_at: string | null
          zakat_anniversary: string | null
        }
        Insert: {
          calc_method?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          madhab?: string | null
          onboarding_complete?: boolean | null
          seeded?: boolean | null
          theme?: string | null
          updated_at?: string | null
          zakat_anniversary?: string | null
        }
        Update: {
          calc_method?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          madhab?: string | null
          onboarding_complete?: boolean | null
          seeded?: boolean | null
          theme?: string | null
          updated_at?: string | null
          zakat_anniversary?: string | null
        }
        Relationships: []
      }
      qada_prayers: {
        Row: {
          auto_logged: boolean
          completed: boolean | null
          created_at: string | null
          id: string
          made_up_date: string | null
          missed_date: string | null
          notes: string | null
          prayer: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_logged?: boolean
          completed?: boolean | null
          created_at?: string | null
          id?: string
          made_up_date?: string | null
          missed_date?: string | null
          notes?: string | null
          prayer: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_logged?: boolean
          completed?: boolean | null
          created_at?: string | null
          id?: string
          made_up_date?: string | null
          missed_date?: string | null
          notes?: string | null
          prayer?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quran_logs: {
        Row: {
          auto_logged: boolean
          completed_at: string | null
          created_at: string | null
          id: string
          juz: number | null
          log_date: string
          minutes: number | null
          pages: number | null
          reflection: string | null
          surah: string | null
          tafsir: boolean | null
          user_id: string
          verses_completed: string | null
        }
        Insert: {
          auto_logged?: boolean
          completed_at?: string | null
          created_at?: string | null
          id?: string
          juz?: number | null
          log_date: string
          minutes?: number | null
          pages?: number | null
          reflection?: string | null
          surah?: string | null
          tafsir?: boolean | null
          user_id: string
          verses_completed?: string | null
        }
        Update: {
          auto_logged?: boolean
          completed_at?: string | null
          created_at?: string | null
          id?: string
          juz?: number | null
          log_date?: string
          minutes?: number | null
          pages?: number | null
          reflection?: string | null
          surah?: string | null
          tafsir?: boolean | null
          user_id?: string
          verses_completed?: string | null
        }
        Relationships: []
      }
      quran_study_goals: {
        Row: {
          completed: boolean
          created_at: string
          end_ayah: number
          goal_date: string
          id: string
          last_completed_ayah: number
          note: string | null
          start_ayah: number
          surah_name: string
          surah_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          end_ayah: number
          goal_date?: string
          id?: string
          last_completed_ayah?: number
          note?: string | null
          start_ayah?: number
          surah_name: string
          surah_number: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          end_ayah?: number
          goal_date?: string
          id?: string
          last_completed_ayah?: number
          note?: string | null
          start_ayah?: number
          surah_name?: string
          surah_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ramadan_checklist: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          log_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json
          log_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          log_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ramadan_plans: {
        Row: {
          created_at: string | null
          dua_goal: string | null
          fasting_goal: string | null
          id: string
          intention: string | null
          quran_goal: string | null
          salah_goal: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dua_goal?: string | null
          fasting_goal?: string | null
          id?: string
          intention?: string | null
          quran_goal?: string | null
          salah_goal?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dua_goal?: string | null
          fasting_goal?: string | null
          id?: string
          intention?: string | null
          quran_goal?: string | null
          salah_goal?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          closest_to_allah: string | null
          created_at: string | null
          distraction: string | null
          entry_date: string
          fell_short: string | null
          gratitude: string | null
          id: string
          mood: string | null
          next_intention: string | null
          one_change: string | null
          sincere_dua: string | null
          struggles: string | null
          updated_at: string | null
          user_id: string
          week_start: string | null
          wins: string | null
        }
        Insert: {
          closest_to_allah?: string | null
          created_at?: string | null
          distraction?: string | null
          entry_date: string
          fell_short?: string | null
          gratitude?: string | null
          id?: string
          mood?: string | null
          next_intention?: string | null
          one_change?: string | null
          sincere_dua?: string | null
          struggles?: string | null
          updated_at?: string | null
          user_id: string
          week_start?: string | null
          wins?: string | null
        }
        Update: {
          closest_to_allah?: string | null
          created_at?: string | null
          distraction?: string | null
          entry_date?: string
          fell_short?: string | null
          gratitude?: string | null
          id?: string
          mood?: string | null
          next_intention?: string | null
          one_change?: string | null
          sincere_dua?: string | null
          struggles?: string | null
          updated_at?: string | null
          user_id?: string
          week_start?: string | null
          wins?: string | null
        }
        Relationships: []
      }
      sadaqah_logs: {
        Row: {
          amount: number | null
          cause: string | null
          created_at: string | null
          id: string
          kind: string
          log_date: string
          notes: string | null
          ramadan: boolean | null
          user_id: string
          zakat_payment_id: string | null
        }
        Insert: {
          amount?: number | null
          cause?: string | null
          created_at?: string | null
          id?: string
          kind?: string
          log_date: string
          notes?: string | null
          ramadan?: boolean | null
          user_id: string
          zakat_payment_id?: string | null
        }
        Update: {
          amount?: number | null
          cause?: string | null
          created_at?: string | null
          id?: string
          kind?: string
          log_date?: string
          notes?: string | null
          ramadan?: boolean | null
          user_id?: string
          zakat_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sadaqah_logs_zakat_payment_id_fkey"
            columns: ["zakat_payment_id"]
            isOneToOne: false
            referencedRelation: "zakat_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_backups: {
        Row: {
          created_at: string
          id: string
          label: string
          snapshot: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          snapshot: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          snapshot?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      worship_logs: {
        Row: {
          asr_congregation: boolean | null
          asr_masjid: boolean | null
          asr_status: string | null
          congregation: boolean | null
          created_at: string | null
          dhikr_count: number | null
          dhuhr_congregation: boolean | null
          dhuhr_masjid: boolean | null
          dhuhr_status: string | null
          duha: boolean
          excuse_type: string | null
          excused: boolean | null
          fajr_congregation: boolean | null
          fajr_masjid: boolean | null
          fajr_status: string | null
          fast_type: string | null
          fasted: boolean | null
          id: string
          intention: string | null
          isha_congregation: boolean | null
          isha_masjid: boolean | null
          isha_status: string | null
          istikhara: boolean
          jummah: boolean | null
          log_date: string
          maghrib_congregation: boolean | null
          maghrib_masjid: boolean | null
          maghrib_status: string | null
          nafl: boolean | null
          notes: string | null
          quran_juz: number | null
          quran_minutes: number | null
          quran_pages: number | null
          remembered_allah: boolean | null
          sunnah: boolean | null
          tafsir: boolean | null
          tahajjud: boolean
          updated_at: string | null
          user_id: string
          witr: boolean
        }
        Insert: {
          asr_congregation?: boolean | null
          asr_masjid?: boolean | null
          asr_status?: string | null
          congregation?: boolean | null
          created_at?: string | null
          dhikr_count?: number | null
          dhuhr_congregation?: boolean | null
          dhuhr_masjid?: boolean | null
          dhuhr_status?: string | null
          duha?: boolean
          excuse_type?: string | null
          excused?: boolean | null
          fajr_congregation?: boolean | null
          fajr_masjid?: boolean | null
          fajr_status?: string | null
          fast_type?: string | null
          fasted?: boolean | null
          id?: string
          intention?: string | null
          isha_congregation?: boolean | null
          isha_masjid?: boolean | null
          isha_status?: string | null
          istikhara?: boolean
          jummah?: boolean | null
          log_date: string
          maghrib_congregation?: boolean | null
          maghrib_masjid?: boolean | null
          maghrib_status?: string | null
          nafl?: boolean | null
          notes?: string | null
          quran_juz?: number | null
          quran_minutes?: number | null
          quran_pages?: number | null
          remembered_allah?: boolean | null
          sunnah?: boolean | null
          tafsir?: boolean | null
          tahajjud?: boolean
          updated_at?: string | null
          user_id: string
          witr?: boolean
        }
        Update: {
          asr_congregation?: boolean | null
          asr_masjid?: boolean | null
          asr_status?: string | null
          congregation?: boolean | null
          created_at?: string | null
          dhikr_count?: number | null
          dhuhr_congregation?: boolean | null
          dhuhr_masjid?: boolean | null
          dhuhr_status?: string | null
          duha?: boolean
          excuse_type?: string | null
          excused?: boolean | null
          fajr_congregation?: boolean | null
          fajr_masjid?: boolean | null
          fajr_status?: string | null
          fast_type?: string | null
          fasted?: boolean | null
          id?: string
          intention?: string | null
          isha_congregation?: boolean | null
          isha_masjid?: boolean | null
          isha_status?: string | null
          istikhara?: boolean
          jummah?: boolean | null
          log_date?: string
          maghrib_congregation?: boolean | null
          maghrib_masjid?: boolean | null
          maghrib_status?: string | null
          nafl?: boolean | null
          notes?: string | null
          quran_juz?: number | null
          quran_minutes?: number | null
          quran_pages?: number | null
          remembered_allah?: boolean | null
          sunnah?: boolean | null
          tafsir?: boolean | null
          tahajjud?: boolean
          updated_at?: string | null
          user_id?: string
          witr?: boolean
        }
        Relationships: []
      }
      zakat_entries: {
        Row: {
          amount: number | null
          asset_type: string | null
          created_at: string | null
          date_paid: string | null
          id: string
          nisab: number | null
          notes: string | null
          paid: boolean | null
          user_id: string
          year: number
          zakat_due: number | null
        }
        Insert: {
          amount?: number | null
          asset_type?: string | null
          created_at?: string | null
          date_paid?: string | null
          id?: string
          nisab?: number | null
          notes?: string | null
          paid?: boolean | null
          user_id: string
          year: number
          zakat_due?: number | null
        }
        Update: {
          amount?: number | null
          asset_type?: string | null
          created_at?: string | null
          date_paid?: string | null
          id?: string
          nisab?: number | null
          notes?: string | null
          paid?: boolean | null
          user_id?: string
          year?: number
          zakat_due?: number | null
        }
        Relationships: []
      }
      zakat_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          paid_on: string
          updated_at: string
          user_id: string
          zakat_entry_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          paid_on?: string
          updated_at?: string
          user_id: string
          zakat_entry_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          paid_on?: string
          updated_at?: string
          user_id?: string
          zakat_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zakat_payments_zakat_entry_id_fkey"
            columns: ["zakat_entry_id"]
            isOneToOne: false
            referencedRelation: "zakat_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      restore_worship_backup: { Args: { backup_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
