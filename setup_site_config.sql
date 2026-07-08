CREATE TABLE IF NOT EXISTS public.site_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS site_config_single_row ON site_config ((true));

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.site_config;
CREATE POLICY "Public Read Access"
ON public.site_config FOR SELECT
TO anon USING (true);

DROP POLICY IF EXISTS "Service Role Full Access" ON public.site_config;
CREATE POLICY "Service Role Full Access"
ON public.site_config FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access" ON public.site_config;
CREATE POLICY "Anon Full Access"
ON public.site_config FOR ALL
TO anon
USING (true)
WITH CHECK (true);

INSERT INTO public.site_config (id, config) VALUES (1, '{
  "promoText": "🔥 MAJARRAH DROP 01 OUT NOW · FAST HOME DELIVERY ALL OVER EGYPT 🔥",
  "promoVisible": true,
  "promoSpeed": 30,
  "promoRepeats": 12,
  "showPrelaunch": false,
  "prelaunchDate": "2026-07-01T20:00:00",
  "bypassPassword": "majarrah2026",
  "prelaunchEmailText": "ENTER YOUR EMAIL TO SECURE EARLY ACCESS AND LAUNCH NOTIFICATIONS.",
  "drop2TeaserVisible": false,
  "drop2TeaserDate": "2026-07-15T20:00:00",
  "drop2TeaserTitle": "ECLIPSE COLLECTION",
  "drop2TeaserDesc": "The next evolution of identity architecture. Pre-register to secure access.",
  "drop2TeaserBadge": "TEASER / DROP 02",
  "drop2Product1Name": "ECLIPSE SHIRT",
  "drop2Product1Image": "",
  "drop2Product1Badge": "CLASSIFIED",
  "drop2Product2Name": "ECLIPSE SHORTS",
  "drop2Product2Image": "",
  "drop2Product2Badge": "CLASSIFIED",
  "paymentCOD": true,
  "paymentApplePay": false,
  "paymentCard": false,
  "instagramVisible": true,
  "tiktokVisible": true,
  "whatsappVisible": true,
  "chatWidgetVisible": true,
  "showSignIn": true,
  "showStars": true,
  "showSizeCalc": true,
  "coupons": {},
  "shippingRates": {
    "Cairo": 92.91,
    "Giza": 92.91,
    "Alexandria": 100.45,
    "Delta & Canal": 103.00,
    "Upper Egypt": 168.34,
    "Red Sea": 168.34,
    "North Sinai": 185.00,
    "South Sinai": 185.00,
    "Matruh": 185.00,
    "New Valley": 185.00,
    "default": 93
  },
  "freeShippingThreshold": 0,
  "translations": {
    "en": {
      "collection": "Collection",
      "signin": "Sign In",
      "hero_sub": "Drop 01 · 2026",
      "explore": "Explore Drop 01",
      "universe_within": "The Universe Within",
      "universe_tagline": "Drop 01 — 100% heavyweight cotton. Screen-printed in Cairo. Ships across all of Egypt.",
      "tap_explore": "Tap any piece to explore · Hover to see the back",
      "company": "Company",
      "about_us": "About Us",
      "contact_us": "Contact Us",
      "get_help": "Get Help",
      "track_order": "Track Order",
      "refund_ex": "Refund & Exchange",
      "how_to_order": "How to order",
      "privacy": "Privacy Policy",
      "sizing": "Sizing",
      "sizing_chart": "Sizing Chart",
      "size_calculator": "Size Calculator",
      "care_guide": "Care Guide",
      "washing": "Washing Instructions",
      "garment_care": "Garment Care",
      "delivery_banner": "HOME DELIVERY · ALL EGYPT GOVERNORATES 🚚",
      "buy_now": "Buy It Now",
      "select_size": "Select Size",
      "size_guide_btn": "Size Guide",
      "size_calculator_btn": "Size Calculator →",
      "contact": "Contact",
      "delivery_address": "Delivery Address",
      "payment_method": "Payment Method",
      "cod": "Cash on Delivery (COD)",
      "card": "Credit / Debit Card",
      "confirm_order": "Complete Order",
      "cancel": "Cancel",
      "subtotal": "Subtotal",
      "shipping": "Shipping",
      "total": "Total",
      "back": "← Back",
      "back_to_search": "← Back to Search",
      "find_order": "Find Order",
      "track_refund_title": "Track & Refund",
      "track_refund_sub": "Look up your order to track its status or request a refund",
      "order_id_lbl": "Order ID / Number",
      "phone_lbl": "Phone Number",
      "how_title": "How to Order",
      "how_sub": "3 steps · less than a minute",
      "brand_title": "The Brand",
      "brand_sub": "Majarrah Universe",
      "size_recommend_title": "Size Recommender",
      "size_recommend_sub": "Calculate your perfect fit in seconds",
      "height": "Height",
      "weight": "Weight",
      "fit_pref": "Fit Preference",
      "fit_oversized": "Streetwear Oversized (Recommended)",
      "fit_regular": "Regular Fit",
      "fit_snug": "Slightly Snug",
      "suggested_size_title": "Your Suggested Size",
      "apply_size_btn": "Apply & Select Size",
      "washing_title": "Washing Instructions",
      "washing_sub": "Care guide to preserve your garment''s life",
      "garment_title": "Garment Care",
      "garment_sub": "How to dry, iron, and store your pieces",
      "badge_local": "Local",
      "badge_wallet": "Wallet",
      "coupon_code_lbl": "Discount Code",
      "apply_btn": "Apply",
      "days_label": "DAYS",
      "hours_label": "HOURS",
      "mins_label": "MINS",
      "secs_label": "SECS",
      "tracker_modal_sub": "Enter your phone number to view your order status and timeline.",
      "measurements_cm": "Measurements in centimeters"
    },
    "ar": {}
  }
}'::JSONB)
ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config;

-- Explicitly grant permissions to roles to resolve 42501 permission denied errors
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_config TO service_role;
