export type PhotoStatus = 'uploading' | 'ready'

export type PhotobookStatus = 'collecting' | 'ready' | 'paid' | 'processing' | 'shipped' | 'delivered'

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Profile {
  id: string
  name: string | null
  phone: string | null
  address: string | null
  created_at: string
}

export interface Photo {
  id: string
  user_id: string
  photobook_id: string | null
  storage_path: string
  original_name: string | null
  taken_at: string | null
  width: number | null
  height: number | null
  uploaded_at: string
  url?: string
}

export interface Photobook {
  id: string
  user_id: string
  status: PhotobookStatus
  photo_count: number
  price: number
  order_number: string | null
  created_at: string
  paid_at: string | null
}

export interface PhotobookPage {
  id: string
  photobook_id: string
  page_number: number
  photo_ids: string[]
  background_style: BackgroundStyle | null
  created_at: string
}

export interface BackgroundStyle {
  type: 'gradient' | 'solid'
  colors: string[]
  angle?: number
  mood?: string
}

export interface Order {
  id: string
  photobook_id: string
  user_id: string
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  shipping_detail: string | null
  tracking_number: string | null
  status: OrderStatus
  kakao_tid: string | null
  total_price: number
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
}
