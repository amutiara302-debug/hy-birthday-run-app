export type Category = "Offline" | "Virtual";

export type PaymentStatus = "pending" | "verified" | "rejected";
export type ShippingStatus = "not_shipped" | "shipped";
export type RunStatus = "not_uploaded" | "review" | "approved" | "rejected";

export type Registration = {
  id: string;
  created_at: string;
  participant_token: string;
  category: Category;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  domicile_city: string;
  emergency_name: string | null;
  emergency_phone: string | null;
  emergency_relation: string | null;
  running_app_account: string | null;
  shirt_size: string;
  address: string;
  village: string;
  district: string;
  city_regency: string;
  province: string;
  postal_code: string;
  address_notes: string | null;
  payment_proof_url: string | null;
  payment_status: PaymentStatus;
  bib_number: string | null;
  tracking_number: string | null;
  shipping_status: ShippingStatus;
  run_status: RunStatus;
};

export type RunSubmission = {
  id: string;
  created_at: string;
  registration_id: string;
  run_date: string;
  distance: string;
  duration_pace: string;
  app_name: string;
  activity_link: string | null;
  proof_url: string | null;
  notes: string | null;
  status: RunStatus;
};

export type EventSettings = {
  id: number;
  event_name: string;
  contact_email: string;
  account_holder: string;
  bank_name: string | null;
  bank_account_number: string | null;
  offline_price: number;
  virtual_price: number;
  shipping_fee: number;
  offline_quota: number;
  virtual_quota: number;
  registration_opens_at: string;
  registration_closes_at: string;
};
