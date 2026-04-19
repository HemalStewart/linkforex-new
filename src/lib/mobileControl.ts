export type OverviewData = {
    mobile_users_total: number;
    kyc_pending: number;
    kyc_verified: number;
    inactive_users: number;
    campaigns_sent: number;
    active_ads: number;
    wallet_awaiting_funds: number;
    wallet_funds_received: number;
    wallet_processing: number;
};

export type SettingsData = {
    require_email_otp: 'yes' | 'no';
    require_mobile_otp: 'yes' | 'no';
    enable_liveness_check: 'yes' | 'no';
    enable_sanction_screening: 'yes' | 'no';
    lock_profile_after_verification: 'yes' | 'no';
    allow_profile_edit_after_lock: 'yes' | 'no';
    enable_google_sign_in: 'yes' | 'no';
    enable_apple_sign_in: 'yes' | 'no';
    enable_in_app_ads: 'yes' | 'no';
    enable_push_notifications: 'yes' | 'no';
    enable_email_notifications: 'yes' | 'no';
    enable_secure_message: 'yes' | 'no';
    send_exchange_rate_push: 'yes' | 'no';
    restrict_blacklisted_countries: 'yes' | 'no';
    require_new_device_verification: 'yes' | 'no';
    blacklisted_countries: string;
    password_rotation_days: number;
    support_email: string;
    trust_wallet_label: string;
    trust_wallet_network: string;
    trust_wallet_address: string;
    trust_wallet_instructions: string;
    liveness_provider: 'none' | 'veriff';
    veriff_base_url: string;
    veriff_api_key: string;
    veriff_hmac_secret: string;
    veriff_callback_url: string;
    veriff_configured?: boolean;
};

export type QueueUser = {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    kyc_status: string;
    country?: string;
    veriff_status?: string;
    veriff_decision?: string;
    veriff_checked_at?: string;
    mobile_verified_at?: string;
    sanction_status?: string;
    sanction_reason?: string;
    sanction_checked_at?: string;
    created_at?: string;
    updated_at?: string;
};

export type WalletTransfer = {
    id: number;
    code: string;
    status: string;
    source_amount: number;
    dest_amount: number;
    rate: number;
    purpose: string;
    payment_mode: string;
    collection_method: string;
    created_at?: string | null;
    updated_at?: string | null;
    remitter_id: number;
    beneficiary_id: number;
    remitter_name: string;
    remitter_email: string;
    remitter_phone: string;
    beneficiary_name: string;
    beneficiary_bank_name: string;
    beneficiary_account_number: string;
    source_currency: string;
    payout_currency: string;
    wallet_tx_hash: string;
    payment_reference: string;
    wallet_status_note: string;
    status_history?: Array<{ status: string; note?: string; updated_at?: string; updated_by?: string }>;
};

export type Campaign = {
    id: number;
    title: string;
    message: string;
    channel: 'push' | 'email' | 'both';
    target_audience: 'all' | 'kyc_pending' | 'kyc_verified' | 'inactive';
    include_exchange_rate: 'yes' | 'no';
    status: 'draft' | 'sent';
    sent_at?: string | null;
};

export type MobileAd = {
    id: number;
    title: string;
    description?: string;
    image_url?: string;
    click_url?: string;
    placement: 'onboarding' | 'home_carousel';
    priority: number;
    status: 'active' | 'inactive';
};

export type MobileExchangeRate = {
    id: number;
    currency_code: string;
    code: string;
    name: string;
    currency_name: string;
    symbol: string;
    currency_symbol: string;
    rate: string;
    status: 'active' | 'inactive';
    visible_in_app: 'yes' | 'no';
    show_on_home: 'yes' | 'no';
    default_for_transfer: 'yes' | 'no';
    payout_enabled?: 'yes' | 'no';
    display_order: number;
    source_branch_code: string;
    source_branch_name: string;
    customer_rate?: string | null;
    branch_rate?: string | null;
    has_live_rate?: boolean;
    updated_at?: string | null;
};
