export interface Contact {
  id: string
  name: string
  email: string
  original_email: string
  created_at: string
  status: string
  followup_count: number
}

export interface ContactFormData {
  name: string
  email: string
  original_email: string
}
