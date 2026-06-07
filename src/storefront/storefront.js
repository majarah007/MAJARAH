// --- GLOBAL DATABASE FETCH INTERCEPTOR ---
window.SB_URL = "https://nojnqefgbpyibuhduxdx.supabase.co";
// Normalize SB_URL: remove trailing slashes and /rest/v1 if present to avoid "Double REST" URL errors
if (window.SB_URL) {
    window.SB_URL = window.SB_URL.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
}

// --- IMAGE SRC RESOLVER HELPER ---
// Ensures product images always resolve to a valid src, never empty string
function resolveImgSrc(url, fallback) {
    if (url && typeof url === 'string' && url.trim() !== '') return url.trim();
    // If it's a relative path in assets, prefix with assets/ if necessary or just return it
    // The user mentioned removing images from files, so we should prioritize full URLs or specific assets
    return fallback || 'blackinfront.jpg';
}

// ── GLOBAL CONFIGURATION — loaded from Supabase site_config ──
window.SITE_CONFIG = {};

// CONFIG KEYS for sync
const CONFIG_KEYS = [
    'promoText', 'promoVisible', 'promoSpeed', 'promoRepeats',
    'showPrelaunch', 'prelaunchDate', 'bypassPassword',
    'drop2TeaserVisible', 'drop2TeaserDate', 'drop2TeaserTitle',
    'drop2TeaserDesc', 'drop2TeaserBadge', 'drop2Product1Name',
    'drop2Product1Image', 'drop2Product2Name', 'drop2Product2Image',
    'showSignIn', 'instagramVisible', 'tiktokVisible', 'showSizeCalc',
    'showStars', 'showCoupons', 'coupons', 'paymentCOD', 'paymentApplePay', 'paymentCard',
    'shippingRates', 'translations'
];

// Initial load from local cache for instant UI response
function loadLocalConfig() {
    CONFIG_KEYS.forEach(k => {
        const val = localStorage.getItem(`mjr_${k}`);
        if (val !== null) {
            try {
                window.SITE_CONFIG[k] = JSON.parse(val);
            } catch(e) {
                window.SITE_CONFIG[k] = val;
            }
        }
    });
}
loadLocalConfig();

async function loadSiteConfig() {
    try {
        const res = await fetch(`/api/proxy?table=site_config&id=eq.1&select=config&t=${Date.now()}`);
        if (!res.ok) throw new Error('Config load failed');
        const data = await res.json();
        if (Array.isArray(data) && data[0] && data[0].config) {
            window.SITE_CONFIG = data[0].config;
            // Sync back to local storage for persistence across reloads
            Object.keys(window.SITE_CONFIG).forEach(k => {
                if (CONFIG_KEYS.includes(k)) {
                    localStorage.setItem(`mjr_${k}`, JSON.stringify(window.SITE_CONFIG[k]));
                }
            });
        }
    } catch (e) {
        console.warn("Using local cache for config:", e);
    } finally {
        applyConfigToDOM();
    }
}

function cfg(key, fallback = '') {
    const val = window.SITE_CONFIG[key];
    if (val === undefined || val === null || val === '') return fallback;
    return val;
}

function applyConfigToDOM() {
    // 1. Marquee visibility
    const marquee = document.getElementById('storefrontPromoMarquee');
    if (marquee) marquee.style.display = cfg('promoVisible', true) ? 'block' : 'none';
    
    // 2. Prelaunch
    const isPrelaunch = cfg('showPrelaunch', false);
    const prelaunchScreen = document.getElementById('prelaunchScreen');
    if (isPrelaunch && prelaunchScreen) {
        const bypass = localStorage.getItem('mjr_bypass_prelaunch') === 'true';
        const targetDate = window.parseLaunchDate(cfg('prelaunchDate'));
        if (!bypass && targetDate > Date.now()) {
            prelaunchScreen.style.display = 'flex';
            document.documentElement.style.overflow = 'hidden';
        }
    }

    // 3. Teaser
    const teaser = document.getElementById('drop2TeaserSection');
    if (teaser) teaser.style.display = cfg('drop2TeaserVisible', false) ? 'block' : 'none';
    if (cfg('drop2TeaserVisible', false)) {
        if (document.getElementById('teaserBadge')) document.getElementById('teaserBadge').textContent = cfg('drop2TeaserBadge', 'TEASER');
        if (document.getElementById('teaserTitle')) document.getElementById('teaserTitle').textContent = cfg('drop2TeaserTitle', 'ECLIPSE');
        if (document.getElementById('teaserDesc')) document.getElementById('teaserDesc').textContent = cfg('drop2TeaserDesc', '');
        if (document.getElementById('teaserName1')) document.getElementById('teaserName1').textContent = cfg('drop2Product1Name', '');
        if (document.getElementById('teaserName2')) document.getElementById('teaserName2').textContent = cfg('drop2Product2Name', '');
        if (document.getElementById('teaserImg1')) document.getElementById('teaserImg1').src = resolveImgSrc(cfg('drop2Product1Image', ''), 'blackinfront.jpg');
        if (document.getElementById('teaserImg2')) document.getElementById('teaserImg2').src = resolveImgSrc(cfg('drop2Product2Image', ''), 'whiteinfront.jpg');
        
        // Start teaser countdown
        initTeaserCountdown();
    } else {
        if (teaserCountdownInterval) {
            clearInterval(teaserCountdownInterval);
            teaserCountdownInterval = null;
        }
    }

    // 4. Visibility Toggles
    const authLi = document.getElementById('navAuthLi');
    if (authLi) authLi.style.display = cfg('showSignIn', true) ? 'block' : 'none';
    const footerIG = document.getElementById('footerInstagramLink');
    if (footerIG) footerIG.style.display = cfg('instagramVisible', true) ? 'flex' : 'none';
    const footerTT = document.getElementById('footerTiktokLink');
    if (footerTT) footerTT.style.display = cfg('tiktokVisible', true) ? 'flex' : 'none';
    const footerSizeCalc = document.getElementById('footerSizeCalcLink');
    if (footerSizeCalc) footerSizeCalc.style.display = cfg('showSizeCalc', true) ? 'block' : 'none';
    const productSizeCalc = document.getElementById('productPageSizeCalcBtn');
    if (productSizeCalc) productSizeCalc.style.display = cfg('showSizeCalc', true) ? 'block' : 'none';
    
    // 5. Checkout
    const couponWrap = document.getElementById('chkCouponWrapper');
    if (couponWrap) {
        couponWrap.style.display = cfg('showCoupons', true) ? 'flex' : 'none';
    }
    const payCOD = document.getElementById('checkoutPayRowCOD');
    if (payCOD) payCOD.style.display = cfg('paymentCOD', true) ? 'flex' : 'none';
    const payApple = document.getElementById('checkoutPayRowApple');
    if (payApple) payApple.style.display = cfg('paymentApplePay', true) ? 'flex' : 'none';
    const payCard = document.getElementById('checkoutPayRowCard');
    if (payCard) payCard.style.display = cfg('paymentCard', true) ? 'flex' : 'none';
}

// Official 27 Bosta Governorate Default Matrix Setup (Subsidized Shipping Strategy)
const bostaDefaultTiers = [
    { name: 'Cairo', price: 43 }, { name: 'Giza', price: 43 },
    { name: 'Alexandria', price: 50 }, { name: 'Qalyubia', price: 53 },
    { name: 'Sharqia', price: 53 }, { name: 'Dakahlia', price: 53 },
    { name: 'Gharbia', price: 53 }, { name: 'Monufia', price: 53 },
    { name: 'Beheira', price: 53 }, { name: 'Damietta', price: 53 },
    { name: 'Port Said', price: 53 }, { name: 'Ismailia', price: 53 },
    { name: 'Suez', price: 53 }, { name: 'Kafr El Sheikh', price: 53 },
    { name: 'Fayoum', price: 118 }, { name: 'Beni Suef', price: 118 },
    { name: 'Minya', price: 118 }, { name: 'Asyut', price: 118 },
    { name: 'Sohag', price: 118 }, { name: 'Qena', price: 118 },
    { name: 'Luxor', price: 118 }, { name: 'Aswan', price: 118 },
    { name: 'Red Sea', price: 131 }, { name: 'Matrouh', price: 131 },
    { name: 'New Valley', price: 131 }, { name: 'North Sinai', price: 131 },
    { name: 'South Sinai', price: 131 }
];

let activeProductId = null;
let activeSelectedSize = null;
let activeSelectedPayment = "COD";
let currentLoadedShippingRates = [];
let fetchedProducts = [];
let fetchedInventory = [];

// ── PRODUCT TRANSLATIONS ──
const PRODUCT_TRANSLATIONS = {
    ar: {
        'Onyx Graphic Tee': 'تيشرت أونيكس جرافيك',
        'Alabaster Graphic Tee': 'تيشرت ألباستر جرافيك',
        'Onyx Black': 'أسود أونيكس',
        'Alabaster White': 'أبيض ألباستر',
        'Heavyweight Cotton': 'قطن ثقيل ممتاز',
        'Premium Oversized': 'أوفرسايز بريميوم'
    }
};

// Load products from Supabase via Proxy
async function loadProducts() {
    if (!DOM.grid) initDOMCache();
    const grid = DOM.grid;
    if (!grid) return;

    let products = [];
    let allInventory = [];

    try {
        console.log("[Storefront] Fetching products via proxy...");
        const res = await fetch(`/api/proxy?table=products&select=*`);
        if (res.ok) {
            const dbProducts = await res.json();
            console.log(`[Storefront] Successfully fetched ${dbProducts ? dbProducts.length : 0} products.`);
            if (dbProducts && dbProducts.length > 0) {
                products = dbProducts.map(p => {
                    if (!p.images) {
                        p.images = [p.front_image_url, p.back_image_url].filter(Boolean);
                    } else if (typeof p.images === 'string') {
                        try {
                            p.images = JSON.parse(p.images);
                        } catch(e) {
                            p.images = [p.front_image_url, p.back_image_url].filter(Boolean);
                        }
                    }
                    return p;
                });
            }
        } else {
            console.error("[Storefront] Proxy products fetch failed:", res.status, await res.text());
        }

        console.log("[Storefront] Fetching inventory via proxy...");
        const invRes = await fetch(`/api/proxy?table=inventory&select=*`);
        if (invRes.ok) {
            allInventory = await invRes.json();
            console.log(`[Storefront] Successfully fetched ${allInventory ? allInventory.length : 0} inventory items.`);
        }
    } catch (e) {
        console.error("[Storefront] Exception in loadProducts:", e);
    }

    fetchedProducts = products;
    fetchedInventory = allInventory;

    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; padding: 100px 20px; text-align: center; color: #444; text-transform: uppercase; letter-spacing: 2px; font-size: 11px;">
            ${currentLang === 'ar' ? 'لا يوجد منتجات حالياً. ترقبوا الإطلاق!' : 'No products found. Stay tuned for the launch!'}
        </div>`;
        return;
    }

    renderProductsGrid(products, allInventory);
}

function renderProductsGrid(products, inventory) {
    if (!DOM.grid) initDOMCache();
    if (!DOM.grid) return;
    const isAr = (currentLang === 'ar');

    // Optimization: Group inventory by product ID once
    const inventoryMap = {};
    inventory.forEach(item => {
        const pid = Number(item.product_id);
        if (!inventoryMap[pid]) inventoryMap[pid] = 0;
        inventoryMap[pid] += (Number(item.stock) || 0);
    });

    DOM.grid.innerHTML = products.filter(p => p.status === 'active').map((p, idx) => {
        const totalStock = inventoryMap[p.id] || 0;
        const frontImg = resolveImgSrc(p.front_image_url, 'blackinfront.jpg');
        const backImg = resolveImgSrc(p.back_image_url, 'Blackback.jpg');
        
        const isSoldOut = totalStock <= 0;
        let badgeHTML = p.badge ? `<div class="badge">${p.badge}</div>` : '';
        let overlayHTML = '';
        
        if (isSoldOut) {
            badgeHTML = `<div class="badge" style="background: #ff4444; color: #fff;">${isAr ? 'نفذت الكمية' : 'SOLD OUT'}</div>`;
            overlayHTML = `<div class="sold-out-overlay">${isAr ? 'نفذت الكمية' : 'SOLD OUT'}</div>`;
        }

        let nameTranslated = p.name || '';
        let colorTranslated = p.color || '';
        let fabricTranslated = p.fabric || 'Heavyweight Cotton';

        if (isAr) {
            if (PRODUCT_TRANSLATIONS.ar[p.name]) nameTranslated = PRODUCT_TRANSLATIONS.ar[p.name];
            if (PRODUCT_TRANSLATIONS.ar[p.color]) colorTranslated = PRODUCT_TRANSLATIONS.ar[p.color];
            if (PRODUCT_TRANSLATIONS.ar[p.fabric || 'Heavyweight Cotton']) fabricTranslated = PRODUCT_TRANSLATIONS.ar[p.fabric || 'Heavyweight Cotton'];
        }

        const tapHintText = isSoldOut 
            ? (isAr ? 'غير متوفر' : 'Out of Stock') 
            : (isAr ? '← اضغط للاستكشاف والطلب' : '→ Tap to explore & order');

        return `
            <article class="product-card scroll-reveal" onclick="openProduct('${p.id}')" style="transition-delay: ${idx * 0.15}s;">
                <div class="image-container">
                    ${badgeHTML}
                    ${overlayHTML}
                    <img src="${frontImg}" alt="${nameTranslated} Front" class="product-img front-print" loading="lazy">
                    <img src="${backImg}"    alt="${nameTranslated} Back"   class="product-img back-print" loading="lazy">
                </div>
                <div class="product-meta">
                    <div class="details">
                        <h3>${nameTranslated}</h3>
                        <p>${colorTranslated} · ${fabricTranslated}</p>
                    </div>
                    <div class="price">EGP ${p.price}</div>
                </div>
                <div class="tap-hint">${tapHintText}</div>
            </article>
        `;
    }).join('');

    initScrollReveal();
}

// --- TRANSLATION SYSTEM ---
let currentLang = localStorage.getItem('mjr_lang') || 'en';

const TRANSLATIONS = {
  en: {
    collection: "Collection",
    signin: "Sign In",
    hero_sub: "Drop 01",
    explore: "Explore Drop 01",
    universe_within: "The Universe Within",
    universe_tagline: "Drop 01 &mdash; 100% heavyweight cotton. Screen-printed in Cairo. Ships across all of Egypt.",
    tap_explore: "Tap any piece to explore · Hover to see the back",
    company: "Company",
    get_help: "Get Help",
    sizing: "Sizing",
    care_guide: "Care Guide",
    about_us: "About Us",
    contact_us: "Contact Us",
    refund_ex: "Refund & Exchange",
    how_to_order: "How to order",
    privacy: "Privacy Policy",
    sizing_chart: "Sizing Chart",
    size_calculator: "Size Calculator",
    washing: "Washing Instructions",
    garment_care: "Garment Care",
    back: "← Back",
    select_size: "Select Size",
    size_guide_btn: "Size Guide",
    size_calculator_btn: "Size Calculator →",
    buy_now: "Buy It Now",
    cancel: "Cancel",
    contact: "Contact",
    delivery_address: "Delivery Address",
    payment_method: "Payment Method",
    cod: "Cash on Delivery (COD)",
    card: "Credit / Debit Card",
    confirm_order: "Complete Order",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    how_title: "How to Order",
    how_sub: "3 steps · less than a minute",
    how_step1_title: "Pick Your Piece",
    how_step1_desc: "Tap any tee to see the full print, size guide, and details. Select your size when you're ready.",
    how_step2_title: "Fill in Your Address",
    how_step2_desc: "Enter your name, phone number, and delivery address. We ship to all 27 Egyptian governorates.",
    how_step3_title: "We Ship to You",
    how_step3_desc: "We call to confirm, then ship within 1–4 business days. Pay cash at your door — no upfront payment needed.",
    measurements_cm: "Measurements in centimeters",
    tbl_size: "Size",
    tbl_chest: "Chest (Width)",
    tbl_length: "Length",
    tbl_weight: "Weight",
    tbl_height: "Height",
    size_note_body: "<strong>Fit is oversized.</strong> Garment patterns are cut loose. Size down if you prefer a standard, closer-to-body look.",
    brand_title: "The Brand",
    brand_sub: "Majarah Universe",
    brand_slogan: "Between <em>stars,</em><br>nothing is wasted.",
    brand_body: "MAJARAH is a celestial map of the self, founded in the heart of Cairo. We view every individual as a vast system of architecture and void, waiting to be expressed through fabric. We produce heavyweight, high-density garments for those who navigate the urban landscape while carrying a private universe within. From the streets of Egypt to the edge of the unknown, we provide the uniform for exploration.",
    track_refund_title: "Track & Refund",
    track_refund_sub: "Look up your order to track its status or request a refund",
    order_id_lbl: "Order ID / Number",
    phone_lbl: "Phone Number",
    find_order: "Find Order",
    back_to_search: "← Back to Search",
    delivery_banner: "HOME DELIVERY · ALL EGYPT GOVERNORATES",
    height: "Height",
    weight: "Weight",
    fit_pref: "Fit Preference",
    fit_oversized: "Streetwear Oversized (Recommended)",
    fit_regular: "Regular Fit",
    fit_snug: "Slightly Snug",
    suggested_size_title: "Your Suggested Size",
    apply_size_btn: "Apply & Select Size",
    badge_local: "Local",
    badge_wallet: "Wallet",
    phone_placeholder: "Mobile Phone (01xxxxxxxxx)",
    email_placeholder: "Email Address (For receipt)",
    first_name: "First name",
    last_name: "Last name",
    address_placeholder: "Detailed Address (Street name / number)",
    building_placeholder: "Building Name/No",
    floor_placeholder: "Floor No (Optional)",
    apartment_placeholder: "Apartment No (Optional)",
    landmark_placeholder: "Landmark (Optional)",
    postal_code: "Postal code (Optional)",
    coupon_code_lbl: "Discount Code",
    coupon_placeholder: "Enter coupon code",
    apply_btn: "Apply",
    policy_title: "Exchange & Return Policy",
    policy_item1: "<strong>Confirmation Call:</strong> After your order is placed, our team reaches out within 48 hours across different time windows. If we can't get through, the order is automatically voided.",
    policy_item2: "<strong>Fulfillment Window:</strong> Your drop ships 1–4 business days after your order is confirmed over the phone.",
    policy_item3: "<strong>Package Integrity:</strong> Per our courier partner's protocol, packages may not be opened at the door — this keeps your piece protected in transit.",
    policy_item4: "<strong>Rejected Deliveries:</strong> If delivery is refused at the doorstep, return shipping costs are charged to the customer.",
    policy_item5: "<strong>Exchange & Return:</strong> We offer exchanges and returns within 14 calendar days from your confirmed delivery date.",
    track_order: "Track Order",
    tracker_modal_sub: "Enter your phone number to view your order status and timeline.",
    washing_title: "Washing Instructions",
    washing_sub: "Care guide to preserve your garment's life",
    wash_cold_lbl: "Hand Wash Cold",
    wash_cold_desc: "Wash in cold water to keep fabric structured and soft.",
    inside_out_lbl: "Wash Inside Out",
    inside_out_desc: "Turn your piece inside out before washing to protect prints.",
    no_tumble_lbl: "Do Not Tumble Dry",
    no_tumble_desc: "Air dry naturally. Tumble drying will shrink or warp cotton.",
    similar_colors_lbl: "Wash with Similar Colors",
    similar_colors_desc: "Wash dark and light garments separately to avoid dye bleeding.",
    garment_title: "Garment Care",
    garment_sub: "How to dry, iron, and store your pieces",
    iron_low_lbl: "Iron Low Heat",
    iron_low_desc: "Iron on a low setting. Never run the iron directly over printed graphics.",
    no_bleach_lbl: "Do Not Bleach",
    no_bleach_desc: "Bleaching agents destroy organic cotton fibers and ruin prints.",
    dry_shade_lbl: "Dry in Shade",
    dry_shade_desc: "Direct sunlight fades intense dyes. Dry indoors or in shaded areas.",
    store_folded_lbl: "Store Folded",
    store_folded_desc: "Hangers can stretch heavy cotton shoulder seams. Fold to store.",
    days_label: "DAYS",
    hours_label: "HOURS",
    mins_label: "MINS",
    secs_label: "SECS",
    manifesto_title: "THE UNIVERSE WITHIN",
    manifesto_en: "MAJARAH is a celestial map of the self, founded in the heart of Cairo. We view every individual as a vast system of architecture and void, waiting to be expressed through fabric. We produce heavyweight, high-density garments for those who navigate the urban landscape while carrying a private universe within. From the streets of Egypt to the edge of the unknown, we provide the uniform for exploration.",
    manifesto_ar: "مجرة هي خريطة سماوية للذات، تأسست في قلب القاهرة. نحن نرى كل فرد ككيان واسع من التصميم والفراغ، ينتظر التعبير عنه من خلال القماش. نصنع ملابس ثقيلة الوزن وعالية الكثافة لأولئك الذين يخوضون صخب المدينة وهم يحملون كوناً خاصاً بداخلهم. من شوارع مصر إلى حافة المجهول، نحن نصنع الزي الرسمي للاستكشاف."
  },
  ar: {
    collection: "القطع",
    signin: "دخول",
    hero_sub: "دروب 01",
    explore: "اكتشف دروب 01",
    universe_within: "الكون جوّانا",
    universe_tagline: "دروب 01 &mdash; قطن ثقيل 100٪. طباعة يدوية في القاهرة. شحن لكل مصر.",
    tap_explore: "دوس على أي قطعة عشان تكتشفها · عدي بالماوس عشان تشوف الظهر",
    company: "الشركة",
    get_help: "مساعدة",
    sizing: "المقاسات",
    care_guide: "دليل العناية",
    about_us: "عن البراند",
    contact_us: "تواصل معانا",
    refund_ex: "الاسترجاع والاستبدال",
    how_to_order: "ازاي تطلب",
    privacy: "سياسة الخصولية",
    sizing_chart: "جدول المقاسات",
    size_calculator: "حاسبة المقاس",
    washing: "تعليمات الغسيل",
    garment_care: "العناية بالهدوم",
    back: "← رجوع",
    select_size: "اختار مقاسك",
    size_guide_btn: "جدول المقاسات",
    size_calculator_btn: "حاسبة المقاس ←",
    buy_now: "اشتريه دلوقتي",
    cancel: "إلغاء",
    contact: "بيانات التواصل",
    delivery_address: "عنوان التوصيل",
    payment_method: "طريقة الدفع",
    cod: "الدفع عند الاستلام (COD)",
    card: "كارت فيزا / ماستركارد",
    confirm_order: "أكد الطلب دلوقتي",
    subtotal: "المجموع",
    shipping: "الشحن",
    total: "الإجمالي الكلي",
    how_title: "طريقة الطلب",
    how_sub: "٣ خطوات · في أقل من دقيقة",
    how_title: "طريقة الطلب",
    how_sub: "٣ خطوات · في أقل من دقيقة",
    how_step1_title: "اختار قطعتك",
    how_step1_desc: "دوس على أي قطعة عشان تشوف تفاصيلها ورسوماتها ومقاساتها بالظبط.",
    how_step2_title: "ادخل بياناتك",
    how_step2_desc: "املا بيانات الشحن والتوصيل بسهولة وأمان في صفحة الدفع والطلب.",
    how_step3_title: "شحن الطلب",
    how_step3_desc: "بعد ما تأكد طلبك تليفونياً، بنشحنه في 1–4 أيام شغل. الدفع عند الاستلام نقداً على الباب.",
    measurements_cm: "المقاسات بالسنتيمتر",
    tbl_size: "المقاس",
    tbl_chest: "الصدر (عرض)",
    tbl_length: "الطول (القطعة)",
    tbl_weight: "الوزن (الشخص)",
    tbl_height: "الطول (الشخص)",
    size_note_body: "<strong>الاستايل أوفرسايز واسع.</strong> التقصيصة واسعة ومريحة. لو حابب اللبس يكون مظبوط أو أقرب للمقاس العادي، صغر مقاس.",
    brand_title: "عن البراند",
    brand_sub: "كون MAJARAH",
    brand_slogan: "بين النجوم،<br>مفيش حاجة بتضيع.",
    brand_body: "مجرة هي خريطة سماوية للذات، تأسست في قلب القاهرة. نحن نرى كل فرد ككيان واسع من التصميم والفراغ، ينتظر التعبير عنه من خلال القماش. نصنع ملابس ثقيلة الوزن وعالية الكثافة لأولئك الذين يخوضون صخب المدينة وهم يحملون كوناً خاصاً بداخلهم. من شوارع مصر إلى حافة المجهول، نحن نصنع الزي الرسمي للاستكشاف.",
    track_refund_title: "تتبع وارجاع الطلبات",
    track_refund_sub: "اكتب بيانات طلبك عشان تتابعه أو تطلب استرجاع",
    order_id_lbl: "رقم الطلب",
    phone_lbl: "رقم الموبايل",
    find_order: "دوّر على الطلب",
    back_to_search: "← رجوع للبحث",
    delivery_banner: "توصيل للمنزل · لكل محافظات مصر",
    height: "الطول",
    weight: "الوزن",
    fit_pref: "ستايل اللبس",
    fit_oversized: "أوفرسايز ستريت وير (موصى به)",
    fit_regular: "عادي (مظبوط)",
    fit_snug: "دايق شوية",
    suggested_size_title: "المقاس المقترح ليك",
    apply_size_btn: "تطبيق واختيار المقاس",
    badge_local: "محلي",
    badge_wallet: "محفظة",
    phone_placeholder: "رقم الموبايل (01xxxxxxxxx)",
    email_placeholder: "البريد الإلكتروني (لتأكيد الطلب)",
    first_name: "الاسم الأول",
    last_name: "الاسم الأخير",
    address_placeholder: "العنوان بالتفصيل (اسم ورقم الشارع)",
    building_placeholder: "اسم أو رقم العمارة",
    floor_placeholder: "رقم الدور (اختياري)",
    apartment_placeholder: "رقم الشقة (اختياري)",
    landmark_placeholder: "علامة مميزة / بجوار (اختياري)",
    postal_code: "الرمز البريدي (اختياري)",
    coupon_code_lbl: "كود الخصم",
    coupon_placeholder: "أدخل كود الخصم",
    apply_btn: "تطبيق",
    policy_title: "سياسة الاستبدال والاسترجاع",
    policy_item1: "<strong>مكالمة التأكيد:</strong> بعد ما تتم عملية الطلب، فريقنا بيتصل بيك خلال 48 ساعة في أوقات مختلفة. لو معدتيش رد في الأوقات دي، الأوردر بيتلغى تلقائياً.",
    policy_item2: "<strong>مدة التوصيل:</strong> شحنتك بتوصل خلال 1 لـ 4 أيام عمل بعد تأكيد الأوردر تليفونياً.",
    policy_item3: "<strong>سلامة المنتج:</strong> حسب سياسة شركة الشحن، مش مسموح بفتح الطرد عند الاستلام، وده لضمان وصول قطعتك سليمة.",
    policy_item4: "<strong>رفض الاستلام:</strong> لو رفضت استلام الشحنة من المندوب، مصاريف الشحن الرجعة بترجع عليك.",
    policy_item5: "<strong>الاستبدال والاسترجاع:</strong> بنقبل الاستبدال أو الاسترجاع خلال 14 يوم من تاريخ استلام الشحنة.",
    track_order: "تتبع الطلب",
    tracker_modal_sub: "أدخل رقم هاتفك لمتابعة حالة الطلب وجدول الشحن.",
    washing_title: "تعليمات الغسيل",
    washing_sub: "دليل العناية للحفاظ على عمر خامة ملابسك",
    wash_cold_lbl: "غسيل يدوي بارد",
    wash_cold_desc: "اغسل بماء بارد للحفاظ على تماسك القماش ونعومته.",
    inside_out_lbl: "غسيل مقلوب",
    inside_out_desc: "اقلب القطعة من الداخل للخارج قبل الغسيل لحماية الطباعة.",
    no_tumble_lbl: "لا تستخدم المجفف",
    no_tumble_desc: "اتركها تجف في الهواء طبيعياً. استخدام المجفف قد يتسبب في انكماش القطن.",
    similar_colors_lbl: "الغسيل مع ألوان مماثلة",
    similar_colors_desc: "اغسل الملابس الداكنة والفاتحة بشكل منفصل لتجنب بهتان الألوان.",
    garment_title: "العناية بالملابس",
    garment_sub: "كيفية تجفيف وكي وتخزين قطعك المفضلة",
    iron_low_lbl: "كي بدرجة حرارة منخفضة",
    iron_low_desc: "المكواة على درجة منخفضة. لا تكوي فوق الرسومات المطبوعة مباشرة أبداً.",
    no_bleach_lbl: "لا تستخدم المبيضات",
    no_bleach_desc: "المبيضات تتلف ألياف القطن العضوي وتخرب الألوان والطباعة.",
    dry_shade_lbl: "تجفيف في الظل",
    dry_shade_desc: "أشعة الشمس المباشرة تبهت ألوان الصبغة. جفف القطعة في الظل أو في الداخل.",
    store_folded_lbl: "تخزين مطوياً",
    store_folded_desc: "التعليق قد يمدد خياطة الأكتاف بسبب ثقل وزن القطن. يفضل حفظها مطوية.",
    days_label: "أيام",
    hours_label: "ساعات",
    mins_label: "دقائق",
    secs_label: "ثواني",
    manifesto_title: "THE UNIVERSE WITHIN",
    manifesto_en: "MAJARAH is a celestial map of the self, founded in the heart of Cairo. We view every individual as a vast system of architecture and void, waiting to be expressed through fabric. We produce heavyweight, high-density garments for those who navigate the urban landscape while carrying a private universe within. From the streets of Egypt to the edge of the unknown, we provide the uniform for exploration.",
    manifesto_ar: "مجرة هي خريطة سماوية للذات، تأسست في قلب القاهرة. نحن نرى كل فرد ككيان واسع من التصميم والفراغ، ينتظر التعبير عنه من خلال القماش. نصنع ملابس ثقيلة الوزن وعالية الكثافة لأولئك الذين يخوضون صخب المدينة وهم يحملون كوناً خاصاً بداخلهم. من شوارع مصر إلى حافة المجهول، نحن نصنع الزي الرسمي للاستكشاف."
  }
};

const GOVERNORATE_MAP = {
    'Cairo': 'القاهرة',
    'Giza': 'الجيزة',
    'Alexandria': 'الإسكندرية',
    'Qalyubia': 'القليوبية',
    'Sharqia': 'الشرقية',
    'Dakahlia': 'الدقهلية',
    'Gharbia': 'الغربية',
    'Monufia': 'المنوفية',
    'Beheira': 'البحيرة',
    'Damietta': 'دمياط',
    'Port Said': 'بورسعيد',
    'Ismailia': 'الإسماعيلية',
    'Suez': 'السويس',
    'Kafr El Sheikh': 'كفر الشيخ',
    'Fayoum': 'الفيوم',
    'Beni Suef': 'بني سويف',
    'Minya': 'المنيا',
    'Asyut': 'أسيوط',
    'Sohag': 'سوهاج',
    'Qena': 'قنا',
    'Luxor': 'الأقصر',
    'Aswan': 'أسوان',
    'Red Sea': 'البحر الأحمر',
    'Matrouh': 'مطروح',
    'New Valley': 'الوادي الجديد',
    'North Sinai': 'شمال سيناء',
    'South Sinai': 'جنوب سيناء'
};

function toggleLanguage() {
    currentLang = (currentLang === 'en') ? 'ar' : 'en';
    localStorage.setItem('mjr_lang', currentLang);
    applyLanguage(currentLang);
    populateCityOptions();
}

function applyLanguage(lang) {
    const isAr = (lang === 'ar');
    document.documentElement.lang = lang;
    
    if (isAr) {
        document.body.classList.add('lang-ar');
        document.body.dir = 'rtl';
    } else {
        document.body.classList.remove('lang-ar');
        document.body.dir = 'ltr';
    }
    
    const langLink = document.getElementById('langToggleLink');
    if (langLink) {
        langLink.innerText = isAr ? 'English (En)' : 'العربية (Arabic)';
    }
    
    const elements = document.querySelectorAll('[data-t]');
    elements.forEach(el => {
        const key = el.getAttribute('data-t');
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            el.innerHTML = TRANSLATIONS[lang][key];
        }
    });
    
    const placeholders = document.querySelectorAll('[data-t-placeholder]');
    placeholders.forEach(el => {
        const key = el.getAttribute('data-t-placeholder');
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            el.placeholder = TRANSLATIONS[lang][key];
        }
    });

    if (document.getElementById('checkoutPage').classList.contains('open')) {
        const shippingFeeEl = document.getElementById('chkShipping');
        if (shippingFeeEl && (shippingFeeEl.innerText === 'Select city' || shippingFeeEl.innerText === 'اختار المحافظة')) {
            shippingFeeEl.innerText = isAr ? "اختار المحافظة" : "Select city";
        }
        const variantEl = document.getElementById('chkItemVariant');
        if (variantEl && activeSelectedSize) {
            variantEl.innerText = (isAr ? "المقاس: " : "Size: ") + activeSelectedSize;
        }
    }
    
    if (typeof updateMarqueeDisplay === 'function') {
        updateMarqueeDisplay();
    }
    if (typeof refreshDynamicContent === 'function') {
        refreshDynamicContent(lang);
    }
    if (fetchedProducts && fetchedProducts.length > 0) {
        renderProductsGrid(fetchedProducts, fetchedInventory);
    }
}

function populateCityOptions() {
    const citySelect = document.getElementById('chkCity');
    if (!citySelect) return;
    const isAr = (currentLang === 'ar');
    const selectedVal = citySelect.value;
    
    citySelect.innerHTML = `<option value="" disabled selected>${isAr ? 'اختار المحافظة' : 'Select Governorate / City'}</option>` + 
        currentLoadedShippingRates.map(z => {
            const displayName = isAr ? (GOVERNORATE_MAP[z.name] || z.name) : z.name;
            return `<option value="${z.name}">${displayName}</option>`;
        }).join('');
        
    if (selectedVal) {
        citySelect.value = selectedVal;
    }
}

// Initialize data and load city options immediately on launch
async function initApp() {
    await loadSiteConfig();
    
    populateCityOptions();
    applyLanguage(currentLang);

    // Try initializing EmailJS
    try {
        const adminConfig = JSON.parse(localStorage.getItem('mjr_admin_config')) || {};
        if (typeof emailjs !== 'undefined' && adminConfig.emailjsPublicKey) {
            emailjs.init({ publicKey: adminConfig.emailjsPublicKey });
        }
    } catch(e) {
        console.error("EmailJS init failed:", e);
    }

    // Load announcement, speed, and repeats
    window.updateMarqueeDisplay = () => {
        let text = cfg('promoText', '🔥 MAJARAH 01DROP 🔥');
        const speed = parseFloat(cfg('promoSpeed', '80'));
        const dbRepeats = parseInt(cfg('promoRepeats', '1'));

        const charWidthEst = 8;

        const textWidthEst = text.length * charWidthEst;
        const minRepeats = Math.max(12, Math.ceil((window.innerWidth * 2.5) / textWidthEst));
        const repeats = Math.max(dbRepeats, minRepeats);
        
        let repeatedText = '';
        for (let i = 0; i < repeats; i++) {
            repeatedText += text + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ';
        }
        
        const track = document.querySelector('.promo-scroller-track');
        if (track) {
            track.innerHTML = `
                <div class="promo-scroller-text">${repeatedText}</div>
                <div class="promo-scroller-text" aria-hidden="true">${repeatedText}</div>
            `;
            track.style.animationDuration = speed + 's';
        }
    };

    window.addEventListener('resize', () => {
        if (typeof updateMarqueeDisplay === 'function') {
            updateMarqueeDisplay();
        }
    });

    updateMarqueeDisplay();

    // Check theme preference
    const savedTheme = localStorage.getItem('mjr_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const path = document.getElementById('themeTogglePath');
        const icon = document.getElementById('themeToggleIcon');
        if (icon) icon.style.transform = 'rotate(360deg)';
        if (path) path.setAttribute('d', 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42');
    }

    initUserSession();
    initCosmicCanvas();
    initScrollReveal();

    // Real-time coupon validator
    const couponInput = document.getElementById('chkCouponInput');
    if (couponInput) {
        couponInput.addEventListener('input', function(e) {
            const input = e.target.value.trim().toUpperCase();
            const msgEl = document.getElementById('chkCouponMessage');
            const inputEl = e.target;
            
            if (!input) {
                msgEl.style.display = 'none';
                inputEl.style.borderColor = '#222';
                activeDiscountValue = 0;
                activeDiscountCode = '';
                calculateTotals();
                return;
            }
            
            const valStr = validateCoupon(input);
            if (valStr) {
                activeDiscountCode = input;
                if (valStr.endsWith('%')) {
                    activeDiscountType = 'percent';
                    activeDiscountValue = parseFloat(valStr.slice(0, -1));
                } else {
                    activeDiscountType = 'fixed';
                    activeDiscountValue = parseFloat(valStr);
                }
                msgEl.style.display = 'block';
                msgEl.style.color = '#25d366';
                msgEl.innerText = currentLang === 'ar' ? `تم تطبيق الكود! خصم ${valStr}` : `Applied! ${valStr} discount.`;
                inputEl.style.borderColor = '#25d366';
            } else {
                activeDiscountValue = 0;
                activeDiscountCode = '';
                if (input.length >= 3) {
                    msgEl.style.display = 'block';
                    msgEl.style.color = '#ff4444';
                    msgEl.innerText = currentLang === 'ar' ? 'كود غير صحيح' : 'Invalid code.';
                    inputEl.style.borderColor = '#ff4444';
                }
            }
            calculateTotals();
        });
    }

    await loadProducts();
    checkPrelaunch();
}

// --- DYNAMIC CONTENT ON-DEMAND LAZY LOADING ---
const contentCache = {};

async function fetchDynamicContent(key) {
    if (contentCache[key]) {
        return contentCache[key];
    }
    try {
        const res = await fetch(`/api/content?key=${key}`);
        if (res.ok) {
            const data = await res.json();
            contentCache[key] = data;
            return data;
        }
    } catch (e) {
        console.error(`Failed to fetch content for key ${key}:`, e);
    }
    return null;
}

function renderBrandModal(data, lang) {
    const container = document.getElementById('brandModalContent');
    if (!container) return;
    const slogan = lang === 'ar' ? 'بين النجوم، لا شيء يضيع.' : 'Between <em>stars,</em><br>nothing is wasted.';
    container.innerHTML = `
        <h2 class="modal-title-alt" style="font-family: 'Cinzel', serif !important;">${slogan}</h2>
        <p class="modal-body-text">${data[lang]}</p>
    `;
}

function renderHowModal(data, lang) {
    const container = document.getElementById('howModalRight');
    if (!container) return;
    let html = `<div class="steps">`;
    data[lang].forEach(step => {
        html += `
            <div class="step">
                <div class="step-n">${step.n}</div>
                <div class="step-body">
                    <h3>${step.title}</h3>
                    <p>${step.desc}</p>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function renderSizeModal(data, lang) {
    const container = document.getElementById('sizeModalContent');
    if (!container) return;
    const headers = data.headers[lang];
    let html = `
        <table class="size-table">
            <thead>
                <tr>
                    <th>${headers[0]}</th>
                    <th>${headers[1]}</th>
                    <th>${headers[2]}</th>
                    <th>${headers[3]}</th>
                    <th>${headers[4]}</th>
                </tr>
            </thead>
            <tbody>
    `;
    data.rows.forEach(row => {
        html += `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td></tr>`;
    });
    html += `
            </tbody>
        </table>
        <p class="size-note">
            <span>${data.note[lang]}</span>
        </p>
    `;
    container.innerHTML = html;
}

function renderWashingModal(data, lang) {
    const container = document.getElementById('washingModalContent');
    if (!container) return;
    let html = `<ul style="list-style: none; padding: 0; margin: 30px 0 0 0; display: flex; flex-direction: column; gap: 24px;">`;
    data[lang].forEach(item => {
        html += `
            <li style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #888; line-height: 1.6;">
                <strong style="color: #fff; text-transform: uppercase; letter-spacing: 1.5px; font-size: 10px;">${item.title}</strong>
                <span>${item.desc}</span>
            </li>
        `;
    });
    html += `</ul>`;
    container.innerHTML = html;
}

function renderGarmentModal(data, lang) {
    const container = document.getElementById('garmentModalContent');
    if (!container) return;
    let html = `<ul style="list-style: none; padding: 0; margin: 30px 0 0 0; display: flex; flex-direction: column; gap: 24px;">`;
    data[lang].forEach(item => {
        html += `
            <li style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #888; line-height: 1.6;">
                <strong style="color: #fff; text-transform: uppercase; letter-spacing: 1.5px; font-size: 10px;">${item.title}</strong>
                <span>${item.desc}</span>
            </li>
        `;
    });
    html += `</ul>`;
    container.innerHTML = html;
}

// Static fallback for policies (used if API fetch fails)
const STATIC_POLICIES = {
    en: [
        "<strong>Confirmation Call:</strong> After your order is placed, our team will call you within 48 hours to confirm. If we can't reach you, the order is automatically cancelled.",
        "<strong>Shipping Time:</strong> Your tee ships 1–4 business days after your order is confirmed over the phone.",
        "<strong>Package Integrity:</strong> Packages cannot be opened at the door — this protects your piece during transit.",
        "<strong>Rejected Deliveries:</strong> If you refuse delivery at the door, return shipping costs will be charged to you.",
        "<strong>Exchange & Return:</strong> We accept exchanges and returns within 14 calendar days from your confirmed delivery date."
    ],
    ar: [
        "<strong>مكالمة التأكيد:</strong> بعد ما تتم عملية الطلب، فريقنا بيتصل بيك خلال 48 ساعة في أوقات مختلفة. لو معدتيش رد، الأوردر بيتلغى تلقائياً.",
        "<strong>مدة التوصيل:</strong> شحنتك بتوصل خلال 1 لـ 4 أيام عمل بعد تأكيد الأوردر تليفونياً.",
        "<strong>سلامة المنتج:</strong> حسب سياسة شركة الشحن، مش مسموح بفتح الطرد عند الاستلام، وده لضمان وصول قطعتك سليمة.",
        "<strong>رفض الاستلام:</strong> لو رفضت استلام الشحنة من المندوب، مصاريف الشحن الرجعة بترجع عليك.",
        "<strong>الاستبدال والاسترجاع:</strong> بنقبل الاستبدال أو الاسترجاع خلال 14 يوم من تاريخ استلام الشحنة."
    ]
};

function renderRefundPolicyModal(data, lang) {
    const container = document.getElementById('refundPolicyContent');
    if (!container) return;
    // Use API data if available, otherwise fall back to static content
    const rules = (data && data[lang] && data[lang].length > 0) ? data[lang] : STATIC_POLICIES[lang] || STATIC_POLICIES.en;
    const title = lang === 'ar' ? 'سياسة الاستبدال والاسترجاع' : 'Exchange & Return Policy';
    let html = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <div style="flex: 1; height: 1px; background: #161616;"></div>
            <h4 style="font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #555; white-space: nowrap; margin: 0;">${title}</h4>
            <div style="flex: 1; height: 1px; background: #161616;"></div>
        </div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 16px; padding: 0;">
    `;
    rules.forEach((rule, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        html += `
            <li style="display: flex; gap: 12px; font-size: 11px; line-height: 1.8; color: #555;">
                <span style="color: #333; font-family: 'Cinzel', serif; font-size: 9px; padding-top: 2px; letter-spacing: 1px; flex-shrink:0;">${num}</span>
                <span>${rule}</span>
            </li>
        `;
    });
    html += `</ul>`;
    container.innerHTML = html;
}

function refreshDynamicContent(lang) {
    if (contentCache['brand']) renderBrandModal(contentCache['brand'], lang);
    if (contentCache['how']) renderHowModal(contentCache['how'], lang);
    if (contentCache['size']) renderSizeModal(contentCache['size'], lang);
    if (contentCache['washing']) renderWashingModal(contentCache['washing'], lang);
    if (contentCache['garment']) renderGarmentModal(contentCache['garment'], lang);
    if (contentCache['policies']) renderRefundPolicyModal(contentCache['policies'], lang);
}

// Helper to lock/unlock body scroll (fixes iOS Safari background scrolling behind modals)
function lockBodyScroll() {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;
    document.body.dataset.scrollY = scrollY;
}
function unlockBodyScroll() {
    const scrollY = document.body.dataset.scrollY || 0;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY));
}

// --- STANDARD MODAL INTERACTIONS ---
async function openHow() {
    document.getElementById('howModal').classList.add('open');
    lockBodyScroll();
    const data = await fetchDynamicContent('how');
    if (data) renderHowModal(data, currentLang);
    // Fallback if API fails
    else {
        const container = document.getElementById('howModalRight');
        if (container) renderHowModal({ en: [
            { n: '01', title: 'Pick Your Piece', desc: 'Tap any tee to see the full print, size guide, and details. Select your size when you\'re ready.' },
            { n: '02', title: 'Fill in Your Address', desc: 'Enter your name, phone number, and delivery address. We ship to all 27 Egyptian governorates.' },
            { n: '03', title: 'We Ship to You', desc: 'Your order is confirmed and sent out within 1–4 business days. Pay cash when it arrives at your door.' }
        ], ar: [
            { n: '01', title: 'اختار قطعتك', desc: 'دوس على أي قطعة عشان تشوف تفاصيلها ورسوماتها ومقاساتها بالظبط.' },
            { n: '02', title: 'ادخل بياناتك', desc: 'املا بيانات الشحن والتوصيل بسهولة وأمان في صفحة الدفع.' },
            { n: '03', title: 'بنشحن ليك', desc: 'السيستم هيسجل طلبك تلقائياً وهنشحنلك القطعة في أسرع وقت. الدفع عند الاستلام.' }
        ] }, currentLang);
    }
}
function closeHow(e) {
    if(!e || e.target.classList.contains('overlay') || e.target.classList.contains('modal-x')) {
        document.getElementById('howModal').classList.remove('open');
        unlockBodyScroll();
    }
}

async function openSize() {
    document.getElementById('sizeModal').classList.add('open');
    lockBodyScroll();
    const data = await fetchDynamicContent('size');
    if (data) renderSizeModal(data, currentLang);
}
function closeSize(e) {
    if(!e || e.target.classList.contains('overlay') || e.target.classList.contains('modal-x')) {
        document.getElementById('sizeModal').classList.remove('open');
        unlockBodyScroll();
    }
}

async function openBrand() {
    document.getElementById('brandModal').classList.add('open');
    lockBodyScroll();
    const data = await fetchDynamicContent('brand');
    if (data) renderBrandModal(data, currentLang);
}
function closeBrand(e) {
    if(!e || e.target.classList.contains('overlay') || e.target.classList.contains('modal-x')) {
        document.getElementById('brandModal').classList.remove('open');
        unlockBodyScroll();
    }
}

// --- PRODUCT DETAIL CONTEXT VIEWS ---
let activeProductInventory = [];

async function loadActiveProductInventory(productId) {
    activeProductInventory = [];
    try {
        const res = await fetch(`/api/proxy?table=inventory&product_id=eq.${productId}`);
        if (res.ok) {
            activeProductInventory = await res.json();
        }
    } catch (e) {
        console.error("Failed to load inventory for product:", e);
    }
}

async function openProduct(id) {
    activeProductId = id;
    
    // Fetch latest inventory from database
    await loadActiveProductInventory(id);
    
    // Find product in fetchedProducts or fallback
    let p = fetchedProducts.find(prod => String(prod.id) === String(id));
    if (!p) return;
    
    const isAr = (currentLang === 'ar');
    let colorTranslated = isAr ? (PRODUCT_TRANSLATIONS.ar[p.color] || p.color) : p.color;
    let nameTranslated = isAr ? (PRODUCT_TRANSLATIONS.ar[p.name] || p.name) : p.name;
    let descTranslated = isAr ? (PRODUCT_TRANSLATIONS.ar[p.description] || p.description) : p.description;
    
    document.getElementById('ppSub').innerText = colorTranslated;
    document.getElementById('ppTitle').innerText = nameTranslated;
    document.getElementById('ppPrice').innerText = "EGP " + p.price;
    document.getElementById('ppDesc').innerHTML = descTranslated;
    
    // 1. Dynamic Thumbs — Fix logic to handle JSON strings or Arrays
    const thumbsContainer = document.getElementById('pp-thumbs');
    if (thumbsContainer) {
        thumbsContainer.innerHTML = '';
        let imgs = [];
        try {
            imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        } catch(e) { 
            imgs = [p.front_image_url, p.back_image_url].filter(Boolean); 
        }
        if (!Array.isArray(imgs)) imgs = [p.front_image_url, p.back_image_url].filter(Boolean);
        
        imgs.forEach((src, i) => {
            const div = document.createElement('div');
            div.className = 'pp-thumb' + (i === 0 ? ' active' : '');
            div.onclick = () => switchImg(i);
            div.innerHTML = `<img src="${src}" alt="View ${i}">`;
            thumbsContainer.appendChild(div);
        });
        
        // Set initial main img
        if (imgs.length > 0) {
            document.getElementById('ppMainImg').src = imgs[0];
        } else {
            document.getElementById('ppMainImg').src = p.front_image_url || 'blackinfront.jpg';
        }
    }

    // 2. Size buttons based on inventory
    const sizeContainer = document.querySelector('.pp-sizes');
    let totalStock = 0;
    if (sizeContainer) {
        const sizes = ['S', 'M', 'L', 'XL'];
        sizeContainer.innerHTML = sizes.map(size => {
            let stock = 0;
            const invItem = activeProductInventory.find(item => item.size === size);
            stock = invItem ? Number(invItem.stock) : 0;
            totalStock += stock;
            
            if (stock <= 0) {
                return `<button class="pp-size-btn sold-out" disabled style="opacity: 0.25; cursor: not-allowed; text-decoration: line-through;">${size}</button>`;
            } else {
                return `<button class="pp-size-btn" onclick="pickSize(this)">${size}</button>`;
            }
        }).join('');
    }
    
    // Update Buy It Now button state
    const buyBtn = document.querySelector('#productPage .checkout-trigger-btn');
    if (buyBtn) {
        if (totalStock <= 0) {
            buyBtn.disabled = true;
            buyBtn.innerText = isAr ? "نفذت الكمية" : "SOLD OUT";
            buyBtn.style.opacity = "0.5";
        } else {
            buyBtn.disabled = false;
            buyBtn.innerText = isAr ? 'اشتريه دلوقتي' : 'Buy It Now';
            buyBtn.style.opacity = '1';
        }
    }

    // 3. Stock indicator
    const stockIndicator = document.getElementById('ppStockIndicator');
    const stockText = document.getElementById('ppStockText');

    const stockTag = document.getElementById('ppStockTag');
    const stockPulse = document.getElementById('ppStockPulse');
    const stockSegments = document.getElementById('ppStockSegments');
    
    if (stockIndicator && stockText && stockTag && stockPulse && stockSegments) {
        const MAX_DISPLAY = 10;
        const TOTAL_SEGS = 10;
        
        if (totalStock <= 0) {
            stockIndicator.style.display = 'none';
        } else {
            stockIndicator.style.display = 'block';
            let tier = 'good';
            if (totalStock <= 3) tier = 'urgent';
            else if (totalStock <= 7) tier = 'low';
            
            if (tier === 'urgent') {
                stockText.innerHTML = isAr ? `باقي <strong style="color:#ff4444">${totalStock}</strong> قطعة بس` : `Only <strong style="color:#ff4444">${totalStock}</strong> left`;
            } else if (tier === 'low') {
                stockText.innerHTML = isAr ? `باقي <strong style="color:#ff9500">${totalStock}</strong> قطعة` : `<strong style="color:#ff9500">${totalStock}</strong> remaining`;
            } else {
                stockText.innerHTML = isAr ? `متاح · ${totalStock} قطعة` : `In Stock · ${totalStock} units`;
            }
            
            stockTag.className = 'mjr-stock-tag ' + tier;
            stockTag.textContent = tier === 'urgent' ? (isAr ? 'ينتهي قريباً' : 'Almost Gone') : tier === 'low' ? (isAr ? 'كميات محدودة' : 'Limited') : (isAr ? 'متوفر' : 'In Stock');
            
            if (tier === 'urgent') stockPulse.classList.add('active');
            else stockPulse.classList.remove('active');
            
            const filledSegs = Math.min(TOTAL_SEGS, Math.ceil((Math.min(totalStock, MAX_DISPLAY) / MAX_DISPLAY) * TOTAL_SEGS));
            stockSegments.innerHTML = Array.from({length: TOTAL_SEGS}, (_, i) => `<div class="mjr-stock-seg ${i < filledSegs ? 'filled '+tier : ''}" style="flex:1;height:100%;"></div>`).join('');
        }
    }
    
    activeSelectedSize = null;
    document.getElementById('productPage').classList.add('open');
}

function closeProduct() {
    document.getElementById('productPage').classList.remove('open');
}

function switchImg(idx) {
    const p = fetchedProducts.find(prod => String(prod.id) === String(activeProductId));
    if (!p) return;
    let imgs = [];
    try {
        imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
    } catch(e) { 
        imgs = [p.front_image_url, p.back_image_url].filter(Boolean); 
    }
    if (!Array.isArray(imgs)) imgs = [p.front_image_url, p.back_image_url].filter(Boolean);
    
    document.getElementById('ppMainImg').src = imgs[idx] || p.front_image_url;
    
    const thumbs = document.querySelectorAll('.pp-thumb');
    thumbs.forEach((t, i) => {
        if (i === idx) t.classList.add('active');
        else t.classList.remove('active');
    });
}

function pickSize(element) {
    document.querySelectorAll('.pp-size-btn').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    activeSelectedSize = element.innerText;
}

// --- SHOPIFY CHECKOUT OPERATIONS ---
function openCheckout() {
    activeDiscountValue = 0;
    activeDiscountType = 'fixed';
    activeDiscountCode = '';
    const couponInput = document.getElementById('chkCouponInput');
    if (couponInput) couponInput.value = '';
    const couponMsg = document.getElementById('chkCouponMessage');
    if (couponMsg) {
        couponMsg.style.display = 'none';
        couponMsg.innerText = '';
    }

    if(!activeSelectedSize) {
        showToast(currentLang === 'ar' ? 'يرجى اختيار المقاس أولاً.' : 'Please select a size to checkout.', 'info');
        return;
    }
    
    let p = fetchedProducts.find(prod => String(prod.id) === String(activeProductId));
    if (!p) {
        showToast('Product data not synchronized. Please refresh the page.', 'error');
        return;
    }
    
    let defaultFront = 'blackinfront.jpg';
    const searchStr = (p.name + ' ' + (p.color || '')).toLowerCase();
    if (searchStr.includes('white') || searchStr.includes('alabaster')) {
        defaultFront = 'whiteinfront.jpg';
    }
    
    let nameTranslated = p.name;
    if (currentLang === 'ar' && PRODUCT_TRANSLATIONS.ar[p.name]) {
        nameTranslated = PRODUCT_TRANSLATIONS.ar[p.name];
    }

    // Sync review sidebar layouts
    document.getElementById('chkItemThumb').src = resolveImgSrc(p.front_image_url, defaultFront);
    document.getElementById('chkItemTitle').innerText = nameTranslated;
    document.getElementById('chkItemVariant').innerText = (currentLang === 'ar' ? "المقاس: " : "Size: ") + activeSelectedSize;
    document.getElementById('chkItemPrice').innerText = "EGP " + Number(p.price).toFixed(2);
    
    // Reset shipping fields
    document.getElementById('chkCity').value = '';
    
    // Pre-populate fields from activeCustomerSession and saved address
    if (typeof activeCustomerSession !== 'undefined' && activeCustomerSession) {
        const emailEl = document.getElementById('chkEmail');
        if (emailEl) emailEl.value = activeCustomerSession.email || '';
        
        const nameParts = (activeCustomerSession.username || '').split(' ');
        const firstEl = document.getElementById('chkFirst');
        const lastEl = document.getElementById('chkLast');
        if (firstEl && !firstEl.value) firstEl.value = nameParts[0] || '';
        if (lastEl && !lastEl.value) lastEl.value = nameParts.slice(1).join(' ') || '';

        if (activeCustomerSession.email) {
            try {
                const savedAddr = JSON.parse(localStorage.getItem('mjr_address_' + activeCustomerSession.email.toLowerCase()));
                if (savedAddr) {
                    if (firstEl && savedAddr.first) firstEl.value = savedAddr.first;
                    if (lastEl && savedAddr.last) lastEl.value = savedAddr.last;
                    const phoneEl = document.getElementById('chkContact');
                    if (phoneEl && savedAddr.phone) phoneEl.value = savedAddr.phone;
                    const addrEl = document.getElementById('chkAddress');
                    if (addrEl && savedAddr.address) addrEl.value = savedAddr.address;
                    const bldEl = document.getElementById('chkBuilding');
                    if (bldEl && savedAddr.building) bldEl.value = savedAddr.building;
                    const flrEl = document.getElementById('chkFloor');
                    if (flrEl && savedAddr.floor) flrEl.value = savedAddr.floor;
                    const aptEl = document.getElementById('chkApartment');
                    if (aptEl && savedAddr.apartment) aptEl.value = savedAddr.apartment;
                    const landEl = document.getElementById('chkLandmark');
                    if (landEl && savedAddr.landmark) landEl.value = savedAddr.landmark;
                    const cityEl = document.getElementById('chkCity');
                    if (cityEl && savedAddr.city) {
                        cityEl.value = savedAddr.city;
                    }
                }
            } catch (err) {
                console.error("Failed to load saved address:", err);
            }
        }
    }

    // Set save address checkbox unchecked by default
    const saveCheckbox = document.getElementById('chkSaveAddress');
    if (saveCheckbox) saveCheckbox.checked = false;

    calculateTotals();
    
    document.getElementById('checkoutPage').classList.add('open');
    lockBodyScroll();
}

function closeCheckout() {
function closeCheckout() {
    document.getElementById('checkoutPage').classList.remove('open');
    unlockBodyScroll();
}
    unlockBodyScroll();
}

function selectCheckoutPayment(element, method) {
    document.querySelectorAll('.chk-payment-row').forEach(r => r.classList.remove('active'));
    element.classList.add('active');
    activeSelectedPayment = method;
}

// Dynamic Coupons Check
let activeDiscountValue = 0;
let activeDiscountType = 'fixed'; // 'fixed' or 'percent'
let activeDiscountCode = '';

function applyCheckoutCoupon() {
    const inputEl = document.getElementById('chkCouponInput');
    const input = inputEl.value.trim().toUpperCase();
    const msgEl = document.getElementById('chkCouponMessage');
    
    if (!input) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#ff4444';
        msgEl.innerText = currentLang === 'ar' ? 'يرجى إدخال كود الخصم.' : 'Please enter a coupon code.';
        inputEl.style.borderColor = '#ff4444';
        return;
    }
    
    const codesStr = cfg('couponCodes', 'SAVE10:10%,OFF50:50');
    const couponPairs = codesStr.split(',').map(pair => pair.trim().split(':'));
    const matched = couponPairs.find(pair => pair[0].toUpperCase() === input);
    
    if (!matched) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#ff4444';
        msgEl.innerText = currentLang === 'ar' ? 'كود الخصم غير صحيح.' : 'Invalid coupon code.';
        inputEl.style.borderColor = '#ff4444';
        activeDiscountValue = 0;
        activeDiscountCode = '';
        calculateTotals();
        showToast(currentLang === 'ar' ? 'كود الخصم غير صحيح.' : 'Invalid coupon code.', 'error');
        return;
    }
    
    const valueStr = matched[1];
    activeDiscountCode = input;
    
    if (valueStr.endsWith('%')) {
        activeDiscountType = 'percent';
        activeDiscountValue = parseFloat(valueStr.slice(0, -1));
    } else {
        activeDiscountType = 'fixed';
        activeDiscountValue = parseFloat(valueStr);
    }
    
    msgEl.style.display = 'block';
    msgEl.style.color = '#25d366';
    msgEl.innerText = currentLang === 'ar' 
        ? `تم تطبيق الكود بنجاح! خصم ${valueStr}` 
        : `Coupon applied successfully! ${valueStr} discount.`;
    inputEl.style.borderColor = '#25d366';
        
    calculateTotals();
    showToast(currentLang === 'ar' ? 'تم تطبيق كود الخصم بنجاح!' : 'Coupon applied successfully!', 'success');
}

// Custom functions for Washing Instructions and Garment Care modals
async function openWashingModal() {
    document.getElementById('washingModal').classList.add('open');
    lockBodyScroll();
    const data = await fetchDynamicContent('washing');
    if (data) renderWashingModal(data, currentLang);
}
function closeWashingModal(e) {
    if(!e || e.target.classList.contains('overlay') || e.target.classList.contains('modal-x')) {
        document.getElementById('washingModal').classList.remove('open');
        unlockBodyScroll();
    }
}

async function openGarmentModal() {
    document.getElementById('garmentModal').classList.add('open');
    lockBodyScroll();
    const data = await fetchDynamicContent('garment');
    if (data) renderGarmentModal(data, currentLang);
}
function closeGarmentModal(e) {
    if(!e || e.target.classList.contains('overlay') || e.target.classList.contains('modal-x')) {
        document.getElementById('garmentModal').classList.remove('open');
        unlockBodyScroll();
    }
}

// Order Tracker Modal Control & Lookup Functions
function openOrderTrackerModal() {
    document.getElementById('trackerPhoneInput').value = '';
    document.getElementById('trackerError').style.display = 'none';
    document.getElementById('trackerResults').style.display = 'none';
    document.getElementById('trackerSearchForm').style.display = 'block';
    document.getElementById('orderTrackerModal').classList.add('open');
    lockBodyScroll();
}
function closeOrderTrackerModal(e) {
    if(!e || e.target.classList.contains('overlay') || e.target.classList.contains('modal-x')) {
        document.getElementById('orderTrackerModal').classList.remove('open');
        unlockBodyScroll();
    }
}
function backToTrackerSearch() {
    document.getElementById('trackerResults').style.display = 'none';
    document.getElementById('trackerSearchForm').style.display = 'block';
}

async function trackOrdersByPhone() {
    const phoneInput = document.getElementById('trackerPhoneInput').value.trim();
    const errEl = document.getElementById('trackerError');
    errEl.style.display = 'none';
    
    if (!phoneInput) {
        errEl.innerText = currentLang === 'ar' ? 'يرجى إدخال رقم هاتفك.' : 'Please enter your phone number.';
        errEl.style.display = 'block';
        return;
    }
    
    const searchBtn = document.getElementById('trackerSearchBtn');
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = `<span class="chk-spinner"></span>${currentLang === 'ar' ? 'جاري البحث...' : 'Searching...'}`;
    }
    
    let ordersList = [];
    
    // 1. Fetch from Proxy
    try {
        const res = await fetch(`/api/proxy?table=orders&phone=eq.${encodeURIComponent(phoneInput)}&order=id.desc`);
        if (res.ok) {
            ordersList = await res.json();
        }
    } catch(e) {
        console.error("Database tracker lookup failed:", e);
    }
    
    // 2. Fetch from Local Storage Fallback
    let localOrders = [];
    try {
        localOrders = JSON.parse(localStorage.getItem('storeOrders')) || [];
    } catch(e) {
        console.error("Failed to parse storeOrders in trackOrdersByPhone:", e);
    }
    const matchedLocal = localOrders.filter(o => o.phone && String(o.phone).trim() === phoneInput);
    
    // Combine arrays ensuring no duplicates (by ID)
    matchedLocal.forEach(lo => {
        if (!ordersList.some(o => String(o.id) === String(lo.id))) {
            ordersList.push(lo);
        }
    });
    
    if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.innerText = currentLang === 'ar' ? 'تتبع الطلب' : 'Track Order';
    }
    
    if (ordersList.length === 0) {
        errEl.innerText = currentLang === 'ar' ? 'لم يتم العثور على أي طلبات لهذا الرقم.' : 'No orders found for this phone number.';
        errEl.style.display = 'block';
        return;
    }
    
    // Render orders
    let html = '';
    const isAr = (currentLang === 'ar');
    
    ordersList.forEach(order => {
        let badgeClass = 'status-pending';
        if (order.status === 'confirmed' || order.status === 'delivered' || order.status === 'shipped') badgeClass = 'status-confirmed';
        if (order.status === 'cancelled') badgeClass = 'status-cancelled';
        if (order.status === 'refund_requested') badgeClass = 'status-refund_requested';
        if (order.status === 'refunded') badgeClass = 'status-refunded';
        if (order.status === 'refund_denied') badgeClass = 'status-refund_denied';
        
        let dateStr = '—';
        if (order.created_at) {
            dateStr = new Date(order.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US');
        } else if (order.date) {
            dateStr = order.date.split(' ')[0] || order.date;
        }
        
        const totalPaid = (Number(order.subtotal)||0) + (Number(order.shipping_cost)||0);
        const stepperHTML = getStepperHTML(order.status);
        
        html += `
        <div class="order-tracker-card" style="border: 1px solid #1a1a1a; background: #070707; border-radius: 6px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.4); text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; margin: 0 0 4px 0; color: #fff;">${isAr ? 'طلب' : 'Order'} #${order.id}</h3>
                    <p style="font-size: 10px; color: #555; text-transforte'}: ${dateStr}tter-spacing: 1p      </div>
                <span class="status-badge ${badgeClass}" style="font-size: 10px; p            <spa border-radius: badge ${badgeClass}" style="font-size: 10px; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; font-weight: 600;">${order.status}</span>
            </div>
            
            ${stepperHTML ? stepperHTML : `
                <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 4px; text-align: center; margin: 15px 0; font-size: 11px; color: #888;">
                    ${isAr ? 'حالة الطلب' : 'Status'}: <strong style="color: #fff; text-transform: uppercase;">${order.status}</strong>
                </div>
            `}
            
            <div style="font-size: 12px; color: #888; line-height: 1.6; display: flex; flex-direction: column; gap: 4px; margin-top: 15px; border-top: 1px solid #111; padding-top: 12px;">
                <div><strong>${isAr ? 'المنتج' : 'Product'}:</strong> <span style="color: #eee;">${order.product_name} (${order.size || '—'})</span></div>
                <div><strong>${isAr ? 'إجمالي المدفوع' : 'Total Paid'}:</strong> <span style="color: #eee;">EGP ${totalPaid}.00</span></div>
                <div><strong>${isAr ? 'عنوان الشحن' : 'Address'}:</strong> <span style="color: #eee;">${order.address ? order.address.split(' | ')[0] : '—'}</span></div>
            </div>
        </div>
        `;
    });
    
    html += `<button class="desc-trigger-btn" onclick="backToTrackerSearch()" style="margin-top: 15px; width: 100%; border-color: #111;">${isAr ? '← رجوع للبحث' : '← Back to Search'}</button>`;
    
    document.getElementById('trackerResults').innerHTML = html;
    document.getElementById('trackerSearchForm').style.display = 'none';
    document.getElementById('trackerResults').style.display = 'block';
}

function validateCoupon(code) {
    const coupons = cfg('coupons', {});
    const match = coupons[code.toUpperCase()];
    return match || null;
}

function getShippingRate(cityName) {
    const rates = cfg('shippingRates', {});
    if (rates && rates[cityName] !== undefined) {
        return Number(rates[cityName]);
    }
    // Fallback to bostaDefaultTiers if available
    if (window.bostaDefaultTiers) {
        const match = window.bostaDefaultTiers.find(r => r.name === cityName);
        return match ? Number(match.price) : 0;
    }
    return 0;
}
// Dynamic Price Calculation
function calculateTotals() {
    let p = fetchedProducts.find(prod => String(prod.id) === String(activeProductId));
    if (!p) return;
    
    const selectedCity = document.getElementById('chkCity').value;
    const shippingFeeValue = getShippingRate(selectedCity);
    
    let basePrice = Number(p.price) || 0;
    let discountAmount = 0;
    if (activeDiscountCode && activeDiscountValue > 0) {
        if (activeDiscountType === 'percent') {
            discountAmount = basePrice * (activeDiscountValue / 100);
        } else {
            discountAmount = activeDiscountValue;
        }
    }
    
    let finalSubtotal = basePrice - discountAmount;
    if (finalSubtotal < 0) finalSubtotal = 0;
    
    const computedTotalSum = finalSubtotal + shippingFeeValue;
    
    if (discountAmount > 0) {
        document.getElementById('chkSubtotal').innerHTML = `<s>EGP ${basePrice.toFixed(2)}</s> <span style="color:#25d366; margin-left:8px;">EGP ${finalSubtotal.toFixed(2)}</span>`;
    } else {
        document.getElementById('chkSubtotal').innerText = "EGP " + basePrice.toFixed(2);
    }
    
    if (selectedCity) {
        document.getElementById('chkShipping').innerText = "EGP " + Number(shippingFeeValue).toFixed(2);
        document.getElementById('chkTotal').innerHTML = `<span class="chk-currency-code">EGP </span>${computedTotalSum.toFixed(2)}`;
    } else {
        const placeholder = currentLang === 'ar' ? "اختار المحافظة" : "Select city";
        document.getElementById('chkShipping').innerText = placeholder;
        document.getElementById('chkTotal').innerHTML = `<span class="chk-currency-code">EGP </span>${finalSubtotal.toFixed(2)}`;
    }
}


// Post Manifest Order to Storage Pipeline
async function submitShopifyCheckout() {
    const contactInput = document.getElementById('chkContact').value.trim();
    const firstInput = document.getElementById('chkFirst').value.trim();
    const lastInput = document.getElementById('chkLast').value.trim();
    const addressInputMain = document.getElementById('chkAddress').value.trim();
    const buildingInput = document.getElementById('chkBuilding').value.trim();
    const floorInput = document.getElementById('chkFloor').value.trim();
    const apartmentInput = document.getElementById('chkApartment').value.trim();
    const landmarkInput = document.getElementById('chkLandmark').value.trim();
    const cityInput = document.getElementById('chkCity').value;
    const emailInput = document.getElementById('chkEmail').value.trim();

    if(!contactInput || !firstInput || !lastInput || !addressInputMain || !buildingInput || !cityInput || !emailInput) {
        showToast("Please completely fill out all required shipping, contact, and email parameters.", "error");
        return;
    }

    const combinedAddress = `${addressInputMain} | ${buildingInput} | ${floorInput || '-'} | ${apartmentInput || '-'} | ${landmarkInput || '-'}`;

    currentLoadedShippingRates = JSON.parse(localStorage.getItem('storeZones')) || bostaDefaultTiers;
    
    let p = fetchedProducts.find(prod => String(prod.id) === String(activeProductId));
    if (!p) {
        showToast('Product synchronization error. Please refresh the page and try again.', 'error');
        return;
    }
    const targetZoneObj = currentLoadedShippingRates.find(z => z.name === cityInput);
    const shippingFeeValue = targetZoneObj ? targetZoneObj.price : 0;
    let discountAmount = 0;
    if (activeDiscountCode && activeDiscountValue > 0) {
        if (activeDiscountType === 'percent') {
            discountAmount = basePrice * (activeDiscountValue / 100);
        } else {
            discountAmount = activeDiscountValue;
        }
    }
    let finalSubtotal = basePrice - discountAmount;
    if (finalSubtotal < 0) finalSubtotal = 0;

    // Build Payload matching Supabase orders schema
    const newOrder = {
        first_name: firstInput,
        last_name: lastInput,
        phone: contactInput,
        email: emailInput,
        city: cityInput,
        address: combinedAddress,
        product_name: activeDiscountCode ? `${p.name} (Coupon: ${activeDiscountCode})` : p.name,
        size: activeSelectedSize,
        payment_method: activeSelectedPayment,
        subtotal: finalSubtotal,
        shipping_cost: Number(shippingFeeValue) || 0,
        status: 'pending'
    };

    // Disable button and show loading spinner to prevent double submission
    const submitBtn = document.querySelector('.chk-submit-button');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="chk-spinner"></span>${currentLang === 'ar' ? 'جارٍ المعالجة...' : 'Processing...'}`;
    }

    // 1. Verify stock availability via Proxy
    try {
        const checkRes = await fetch(`/api/proxy?table=inventory&product_id=eq.${activeProductId}&size=eq.${activeSelectedSize}`);
        if (checkRes.ok) {
            const invData = await checkRes.json();
            if (invData && invData.length > 0) {
                const currentStock = Number(invData[0].stock);
                if (currentStock <= 0) {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerText = "Complete Order";
                    }
                    return;
                }
            }
        }
    } catch (e) {
        console.error("Failed to check inventory availability, proceeding:", e);
    }

    let success = false;
    let orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    // Try posting to Proxy, fallback to localStorage
    try {
        const res = await fetch(`/api/proxy?table=orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newOrder)
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data && data[0]) {
                orderId = '#' + data[0].id;
            }
            success = true;

            // Decrement stock via Proxy since order succeeded
            try {
                const checkRes = await fetch(`/api/proxy?table=inventory&product_id=eq.${activeProductId}&size=eq.${activeSelectedSize}`);
                if (checkRes.ok) {
                    const invData = await checkRes.json();
                    if (invData && invData.length > 0) {
                        const currentStock = Number(invData[0].stock);
                        if (currentStock > 0) {
                            const newStock = currentStock - 1;
                            await fetch(`/api/proxy?table=inventory&id=eq.${invData[0].id}&stock=eq.${currentStock}`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ stock: newStock })
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to decrement inventory stock:", err);
            }
        } else {
            console.error("Supabase submission failed, falling back to local storage:", await res.text());
        }
    } catch (e) {
        console.error("Database connection down, falling back to local storage:", e);
    }

    const computedTotalSum = finalSubtotal + shippingFeeValue;

    // Save customer address in localStorage under their account email if Save Address checkbox is checked
    const saveCheckbox = document.getElementById('chkSaveAddress');
    if (saveCheckbox && saveCheckbox.checked && emailInput) {
        const addressToSave = {
            first: firstInput,
            last: lastInput,
            phone: contactInput,
            address: addressInputMain,
            building: buildingInput,
            floor: floorInput,
            apartment: apartmentInput,
            landmark: landmarkInput,
            city: cityInput
        };
        localStorage.setItem(`mjr_address_${emailInput.toLowerCase()}`, JSON.stringify(addressToSave));
    }

    // Always save order to local history cache
    const localOrder = {
        id: orderId,
        customerName: firstInput + " " + lastInput,
        phone: contactInput,
        email: emailInput,
        city: cityInput,
        address: combinedAddress,
        itemPrice: p.price,
        shippingFee: shippingFeeValue,
        total: computedTotalSum,
        status: success ? 'pending' : 'Pending',
        date: new Date().toLocaleDateString() + " (" + activeSelectedSize + " - " + activeSelectedPayment + ")"
    };
    let globalOrdersArray = [];
    try {
        globalOrdersArray = JSON.parse(localStorage.getItem('storeOrders')) || [];
    } catch(e) {
        console.error("Failed to parse storeOrders in submitShopifyCheckout:", e);
    }
    globalOrdersArray.push(localOrder);
    localStorage.setItem('storeOrders', JSON.stringify(globalOrdersArray));

    // Show order confirmation modal instead of just a toast
    showOrderConfirmationModal(orderId, firstInput, p.name, activeSelectedSize, finalSubtotal, shippingFeeValue, computedTotalSum, contactInput, cityInput);

    // Dispatch Email receipt via EmailJS
    sendEmailReceipt(orderId, emailInput, firstInput, lastInput, p.name, activeSelectedSize, activeSelectedPayment, finalSubtotal, shippingFeeValue, computedTotalSum, contactInput, combinedAddress, cityInput);

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = currentLang === 'ar' ? 'أكد الطلب دلوقتي' : 'Complete Order';
    }
    
    // Clear checkout views and forms
    closeCheckout();
    closeProduct();
    ['chkContact','chkFirst','chkLast','chkAddress','chkBuilding','chkFloor','chkApartment','chkLandmark','chkPostal','chkEmail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// --- ORDER CONFIRMATION MODAL ---
function showOrderConfirmationModal(orderId, firstName, productName, size, subtotal, shipping, total, phone, city) {
    // Remove any existing confirmation modal
    const existing = document.getElementById('orderConfirmModal');
    if (existing) existing.remove();

    const isAr = currentLang === 'ar';
    const waMsg = encodeURIComponent(
        isAr
            ? `تأكيد طلب مجرة\nرقم الطلب: ${orderId}\nالاسم: ${firstName}\nالقطعة: ${productName} (مقاس ${size})\nالإجمالي: ${total.toFixed(2)} جنيه مصري\nطريقة الدفع: نقداً عند الاستلام\n\nطلبك قيد التنفيذ وسيتم التوصيل خلال ٢ إلى ٤ أيام عمل. سيقوم المندوب بالاتصال بك فور وصوله إلى منطقتك.`
            : `MAJARAH | Order Confirmation\nOrder Number: ${orderId}\nCustomer Name: ${firstName}\nItem: ${productName} (Size ${size})\nTotal Amount: ${total.toFixed(2)} EGP\nPayment Method: Cash on Delivery\n\nYour order is being processed and will be delivered within 2 to 4 business days. You will receive a call from our courier once they arrive in your area.`
    );
    const waLink = `https://wa.me/201229067066?text=${waMsg}`;

    const modal = document.createElement('div');
    modal.id = 'orderConfirmModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);';
    modal.innerHTML = `
        <div style="background:#080808;border:1px solid #1a1a1a;border-radius:8px;max-width:460px;width:100%;padding:40px 35px;text-align:center;position:relative;animation:confirmSlideUp 0.4s cubic-bezier(0.16,1,0.3,1);">
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <div style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#555;margin-bottom:8px;">${isAr ? 'تم تأكيد الطلب' : 'Order Confirmed'}</div>
            <h2 style="font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:#fff;margin:0 0 6px 0;">${isAr ? 'شكراً، ' + firstName + '!' : 'Thank you, ' + firstName + '!'}</h2>
            <p style="font-size:12px;color:#666;line-height:1.7;margin:0 0 24px 0;">
                ${isAr
                    ? `طلبك <strong style="color:#fff">${orderId}</strong> وصلنا وهيتم التواصل معاك خلال 48 ساعة لتأكيده. بعد التأكيد، بيوصلك خلال 1–4 أيام عمل.`
                    : `Order <strong style="color:#fff">${orderId}</strong> received. We'll call you within 48 hours to confirm. After confirmation, delivery takes 1–4 business days.`
                }
            </p>
            <div style="background:#0d0d0d;border:1px solid #151515;border-radius:6px;padding:16px;margin-bottom:24px;text-align:left;">
                <div style="display:flex;justify-content:space-between;font-size:11px;style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:8px;"><span>${isAr ? 'المنتج' : 'Product'}</span    <div style="lor:#ccc;">${productName} (${size})</span></div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:8px;"><span>${isAr ? 'المحافظة' : 'City'}</span><span style="color:#ccc;">${city}</span></div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:8px;"><span>${isAr ? 'المنتج' : 'Subtotal'}</span><span style="color:#ccc;">EGP ${subtotal.toFixed(2)}</span></div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:10px;"><span>${isAr ? 'الشحن' : 'Shipping'}</span><span style="color:#ccc;">EGP ${shipping.toFixed(2)}</span></div>
                <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#fff;border-top:1px solid #1a1a1a;padding-top:10px;"><span>${isAr ? 'الإجمالي' : 'Total'}</span><span>EGP ${total.toFixed(2)}</span></div>
            </div>
            <a href="${waLink}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;background:#25d366;color:#fff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                ${isAr ? 'تأكيد الطلب عبر واتساب' : 'Confirm via WhatsApp'}
            </a>
            <button onclick="closeOrderConfirmModal()" style="width:100%;padding:12px;background:transparent;border:1px solid #222;color:#666;border-radius:6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#444';this.style.color='#fff'" onmouseout="this.style.borderColor='#222';this.style.color='#666'">
                ${isAr ? 'إغلاق' : 'Close'}
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
}

function closeOrderConfirmModal() {
    const modal = document.getElementById('orderConfirmModal');
    if (modal) modal.remove();
    unlockBodyScroll();
}

// Send Email Receipt via Backend (Brevo) or fallback to client-side EmailJS
function sendEmailReceipt(orderId, email, first, last, product, size, payment, subtotal, shipping, total, phone, address, city) {
    if (!email) return;

    // 1. Try sending via backend Brevo API first
    const emailData = {
        email,
        name: first + ' ' + last,
        orderId,
        productName: product,
        size,
        subtotal,
        shipping,
        total,
        phone,
        address,
        city,
        payment
    };

    fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
    })
    .then(async (res) => {
        if (res.ok) {
            console.log("Email receipt sent successfully via backend Brevo SMTP!");
        } else {
            const errText = await res.text();
            console.warn("Backend email dispatch bypassed or failed, attempting EmailJS fallback...", errText);
            fallbackToEmailJS();
        }
    })
    .catch((err) => {
        console.error("Backend email fetch error, attempting EmailJS fallback...", err);
        fallbackToEmailJS();
    });

    function fallbackToEmailJS() {
        const adminConfig = JSON.parse(localStorage.getItem('mjr_admin_config')) || {};
        if (adminConfig.emailjsPublicKey && adminConfig.emailjsServiceId && adminConfig.emailjsTemplateId) {
            try {
                if (typeof emailjs !== 'undefined') {
                    emailjs.init({ publicKey: adminConfig.emailjsPublicKey });
                    
                    const templateParams = {
                        order_id: orderId,
                        customer_name: first + ' ' + last,
                        customer_email: email,
                        customer_phone: phone,
                        customer_city: city,
                        customer_address: address,
                        product_name: product,
                        product_size: size,
                        payment_method: payment,
                        subtotal: subtotal + ' EGP',
                        shipping_cost: shipping + ' EGP',
                        total: total + ' EGP'
                    };
                    emailjs.send(adminConfig.emailjsServiceId, adminConfig.emailjsTemplateId, templateParams)
                        .then(() => {
                            console.log('Email receipt sent successfully via EmailJS!');
                        })
                        .catch(err => {
                            console.error("EmailJS dispatch failed:", err);
                        });
                }
            } catch(e) {
                console.error("EmailJS execution exception:", e);
            }
        }
    }
}

// --- SIZE RECOMMENDER FUNCTIONS ---
function openSizeRecommender() {
    document.getElementById('sizeRecommenderModal').classList.add('open');
    lockBodyScroll();
    updateRecommenderLabels();
}

function closeSizeRecommender(e) {
    if (!e || e.target.classList.contains('overlay') || e.target.classList.contains('modal-x')) {
        document.getElementById('sizeRecommenderModal').classList.remove('open');
        unlockBodyScroll();
    }
}

function updateRecommenderLabels() {
    const h = document.getElementById('recommenderHeight').value;
    const w = document.getElementById('recommenderWeight').value;
    document.getElementById('recommenderHeightVal').innerText = h + " cm";
    document.getElementById('recommenderWeightVal').innerText = w + " kg";
    calculateRecommendedSize();
}

function calculateRecommendedSize() {
    const h = parseInt(document.getElementById('recommenderHeight').value);
    const w = parseInt(document.getElementById('recommenderWeight').value);
    const fit = document.getElementById('recommenderFit').value;
    
    let baseSize = 'M';
    
    // Height base recommendation based on oversized size chart ranges
    if (h <= 168) {
        baseSize = 'S';
    } else if (h > 168 && h <= 176) {
        baseSize = 'M';
    } else if (h > 176 && h <= 184) {
        baseSize = 'L';
    } else {
        baseSize = 'XL';
    }
    
    // Weight modifiers
    if (w < 60) {
        if (baseSize === 'M') baseSize = 'S';
        else if (baseSize === 'L') baseSize = 'M';
        else if (baseSize === 'XL') baseSize = 'L';
    } else if (w >= 75 && w < 85) {
        if (baseSize === 'S') baseSize = 'M';
        else if (baseSize === 'M') baseSize = 'L';
        else if (baseSize === 'L') baseSize = 'XL';
    } else if (w >= 85) {
        baseSize = 'XL';
    }
    
    let finalSize = baseSize;
    if (fit === 'snug') {
        if (baseSize === 'M') finalSize = 'S';
        else if (baseSize === 'L') finalSize = 'M';
        else if (baseSize === 'XL') finalSize = 'L';
    } else if (fit === 'oversized') {
        if (baseSize === 'S' && w >= 62) finalSize = 'M';
        else if (baseSize === 'M' && w >= 72) finalSize = 'L';
        else if (baseSize === 'L' && w >= 82) finalSize = 'XL';
    }
    
    document.getElementById('recommenderSizeResult').innerText = finalSize;
    
    let desc = '';
    const isAr = (currentLang === 'ar');
    if (fit === 'oversized') {
        desc = isAr 
            ? `المقاس المقترح <strong>${finalSize}</strong> هيديك الاستايل الأوفرسايز الواسع المريح والكتف الساقط المظبوط.`
            : `Suggested size <strong>${finalSize}</strong> gives you the perfect boxy, dropped-shoulder streetwear fit.`;
    } else if (fit === 'regular') {
        desc = isAr
            ? `المقاس المقترح <strong>${finalSize}</strong> هيكون مريح بس أقرب للمقاسات العادية ومش واسع أوي.`
            : `Suggested size <strong>${finalSize}</strong> fits loose but sits closer to standard sizing dimensions.`;
    } else {
        desc = isAr
            ? `المقاس المقترح <strong>${finalSize}</strong> هيكون مظبوط ودايق شوية على الجسم (صغرنا مقاس عن الواسع المعتاد).`
            : `Suggested size <strong>${finalSize}</strong> fits snuggier to the body (sizing down from default).`;
    }
    document.getElementById('recommenderFitDesc').innerHTML = desc;
}

function applyRecommendedSize() {
    const finalSize = document.getElementById('recommenderSizeResult').innerText;
    const sizeButtons = document.querySelectorAll('.pp-size-btn');
    let applied = false;
    sizeButtons.forEach(btn => {
        if (btn.innerText.trim() === finalSize.trim()) {
            if (btn.disabled) {
                showToast(`Sorry, recommended size ${finalSize} is currently sold out!`, "error");
                applied = true;
            } else {
                pickSize(btn);
                applied = true;
                showToast(`Size ${finalSize} selected successfully!`, "success");
            }
        }
    });
    if (!applied) {
        showToast(`Could not apply size ${finalSize}.`, "error");
    }
    closeSizeRecommender();
}

// --- REFUND CONTROLLER FUNCTIONS ---
async function openRefundModal() {
    document.getElementById('refundLookupModal').classList.add('open');
    lockBodyScroll();
    backToRefundLookup();
    const data = await fetchDynamicContent('policies');
    // Always render policy — uses static fallback if API fails
    renderRefundPolicyModal(data, currentLang);
}

function closeRefundModal(e) {
    if (!e || e.target.classList.contains('overlay') || e.target.classList.contains('modal-x')) {
        document.getElementById('refundLookupModal').classList.remove('open');
        unlockBodyScroll();
    }
}

function backToRefundLookup() {
    document.getElementById('refundLookupForm').style.display = 'block';
    document.getElementById('refundOrderDetails').style.display = 'none';
    document.getElementById('refundLookupError').style.display = 'none';
    document.getElementById('refundOrderId').value = '';
    document.getElementById('refundPhone').value = '';
}

let activeRefundOrder = null;

async function lookupOrderForRefund() {
    const orderIdInput = document.getElementById('refundOrderId').value.trim();
    const phoneInput = document.getElementById('refundPhone').value.trim();
    const errEl = document.getElementById('refundLookupError');
    errEl.style.display = 'none';

    if (!orderIdInput || !phoneInput) {
        errEl.innerText = "Please enter both Order ID and Phone Number.";
        errEl.style.display = 'block';
        return;
    }

    let order = null;
    let isLocal = false;

    try {
        const idInt = parseInt(orderIdInput.replace(/[^0-9]/g, ''));
        if (!isNaN(idInt)) {
            const res = await fetch(`/api/proxy?table=orders&id=eq.${idInt}&phone=eq.${encodeURIComponent(phoneInput)}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    order = data[0];
                }
            }
        }
    } catch(e) {
        console.error("Database lookup failed:", e);
    }

    if (!order) {
        let localOrders = [];
        try {
            localOrders = JSON.parse(localStorage.getItem('storeOrders')) || [];
        } catch(e) {
            console.error("Failed to parse storeOrders in refund lookup:", e);
        }
        order = localOrders.find(o => {
            const cleanInputId = orderIdInput.replace('#', '').trim().toLowerCase();
            const cleanOrderId = String(o.id).replace('#', '').trim().toLowerCase();
            return cleanOrderId === cleanInputId && String(o.phone).trim() === phoneInput;
        });
        if (order) isLocal = true;
    }

    if (!order) {
        errEl.innerText = "Order not found. Please verify the ID and Phone number.";
        errEl.style.display = 'block';
        return;
    }

    activeRefundOrder = { ...order, isLocal };
    displayRefundOrderDetails(order);
}

function getStepperHTML(status) {
    const isAr = (currentLang === 'ar');
    const steps = [
        { key: 'pending', en: 'Pending', ar: 'قيد الانتظار' },
        { key: 'confirmed', en: 'Confirmed', ar: 'مؤكد' },
        { key: 'shipped', en: 'Shipped', ar: 'تم الشحن' },
        { key: 'delivered', en: 'Delivered', ar: 'تم التوصيل' }
    ];
    
    let activeIdx = 0;
    if (status === 'confirmed') activeIdx = 1;
    else if (status === 'shipped') activeIdx = 2;
    else if (status === 'delivered') activeIdx = 3;
    else if (status === 'cancelled' || status === 'refunded' || status === 'refund_requested' || status === 'refund_denied') {
        return '';
    }

    let html = `<div class="tracking-stepper">`;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const isActive = (i <= activeIdx);
        html += `
            <div class="step ${isActive ? 'active' : ''}">
                <div class="circle">${i + 1}</div>
                <div class="label">${isAr ? step.ar : step.en}</div>
            </div>
        `;
        if (i < steps.length - 1) {
            const isLineActive = (i < activeIdx);
            html += `<div class="line ${isLineActive ? 'active' : ''}"></div>`;
        }
    }
    html += `</div>`;
    return html;
}

function displayRefundOrderDetails(order) {
    document.getElementById('refundLookupForm').style.display = 'none';
    document.getElementById('refundOrderDetails').style.display = 'block';

    const summaryEl = document.getElementById('refundOrderSummary');
    
    let badgeClass = 'status-pending';
    if (order.status === 'confirmed' || order.status === 'delivered' || order.status === 'shipped') badgeClass = 'status-confirmed';
    if (order.status === 'cancelled') badgeClass = 'status-cancelled';
    if (order.status === 'refund_requested') badgeClass = 'status-refund_requested';
    if (order.status === 'refunded') badgeClass = 'status-refunded';
    if (order.status === 'refund_denied') badgeClass = 'status-refund_denied';

    let dateStr = '—';
    if (order.created_at) {
        dateStr = new Date(order.created_at).toLocaleDateString();
    } else if (order.date) {
        dateStr = order.date.split(' ')[0] || order.date;
    }

    const totalPaid = (Number(order.subtotal) || 0) + (Number(order.shipping_cost) || 0);
    const stepperHTML = getStepperHTML(order.status);
    const isAr = (currentLang === 'ar');

    summaryEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
            <div>
                <h3 style="font-size: 16px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Order #${order.id}</h3>
                <p style="font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 1px;">${isAr ? 'العميل' : 'Customer'}: ${order.first_name || ''} ${order.last_name || ''}</p>
            </div>
            <span class="status-b|| ''}</p>
            </div>
            <span class="status-badge ${badgeClass}">${order.status}</span>
        </div>
        ${stepperHTML}
        <div style="font-size: 13px; color: #888; line-height: 1.6; display: flex; flex-direction: column; gap: 6px; margin-top: 15px;">
            <div><strong>${isAr ? 'المنتج' : 'Product'}:</strong> ${order.product_name} (${order.size || '—'})</div>
            <div><strong>${isAr ? 'تاريخ الطلب' : 'Date Ordered'}:</strong> ${dateStr}</div>
            <div><strong>${isAr ? 'إجمالي المدفوع' : 'Total Paid'}:</strong> EGP ${totalPaid}.00</div>
        </div>
    `;

    const actionArea = document.getElementById('refundActionArea');

    if (order.status === 'refund_requested') {
        actionArea.innerHTML = `
            <div style="background: rgba(255,149,0,0.05); border: 1px solid rgba(255,149,0,0.2); padding: 15px; border-radius: 4px;">
                <h4 style="font-size: 12px; color: #ff9500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Refund Request Pending</h4>
                <p style="font-size: 12px; color: #888; line-height: 1.6;">You requested a refund for this order. We are reviewing your request.
                <br><strong style="color:#aaa;">Reason:</strong> ${order.refund_reason || 'Not specified'}
                ${order.refund_notes ? `<br><strong style="color:#aaa;">Notes:</strong> ${order.refund_notes}` : ''}</p>
            </div>
        `;
    } else if (order.status === 'refunded') {
        actionArea.innerHTML = `
            <div style="background: rgba(186,104,200,0.05); border: 1px solid rgba(186,104,200,0.2); padding: 15px; border-radius: 4px;">
                <h4 style="font-size: 12px; color: #ba68c8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Order Refunded</h4>
                <p style="font-size: 12px; color: #888; line-height: 1.6;">This order has been fully refunded.
                <br><strong style="color:#aaa;">Reason:</strong> ${order.refund_reason || 'Not specified'}
                ${order.refund_notes ? `<br><strong style="color:#aaa;">Notes:</strong> ${order.refund_notes}` : ''}</p>
            </div>
        `;
    } else if (order.status === 'refund_denied') {
        actionArea.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 15px; border-radius: 4px;">
                <h4 style="font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Refund Request Denied</h4>
                <p style="font-size: 12px; color: #777; line-height: 1.6;">This refund request was reviewed and denied. If you believe this is in error, please contact support via Instagram.</p>
            </div>
        `;
    } else if (order.status === 'cancelled') {
        actionArea.innerHTML = `
            <div style="background: rgba(255,68,68,0.05); border: 1px solid rgba(255,68,68,0.2); padding: 15px; border-radius: 4px;">
                <h4 style="font-size: 12px; color: #ff4444; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Order Cancelled</h4>
                <p style="font-size: 12px; color: #888; line-height: 1.6;">This order is cancelled and is not eligible for a refund.</p>
            </div>
        `;
    } else {
        const createdDate = order.created_at ? new Date(order.created_at) : (order.date ? parseLocalDate(order.date) : new Date());
        const diffMs = Date.now() - createdDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays > 10) {
            actionArea.innerHTML = `
                <div style="background: rgba(255,68,68,0.05); border: 1px solid rgba(255,68,68,0.2); padding: 15px; border-radius: 4px;">
                    <h4 style="font-size: 12px; color: #ff4444; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Refund Window Expired</h4>
                    <p style="font-size: 12px; color: #888; line-height: 1.6;">Refunds can only be requested within 10 days of placing an order. This order was placed on ${dateStr} (${Math.floor(diffDays)} days ago) and is no longer eligible.</p>
                </div>
            `;
        } else {
            actionArea.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <h4 style="font-size: 12px; color: #fff; text-transform: uppercase; letter-spacing: 1.5px;">Request a Refund</h4>
                    <div>
                        <label style="display: block; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color:</label>
                        <div class="chk-select-wrap">
                            <select id="refundReasonSelect" class="chk-input-field select-box" style="background: #111; border-color: #222;" required>
                                <option value="" disabled selected>Select Reason</option>
                                <option value="Incorrect Size">Incorrect Size</option>
                                <option value="Item Defective / Damaged">Item Defective / Damaged</option>
                                <option value="Product Not as Described">Product Not as Described</option>
                                <option value="Late Delivery">Late Delivery</option>
                                <option value="Changed My Mind / Other">Changed My Mind / Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #555; margin-bottom: 6px; font-weight: 700;">Additional Details (Optional)</label>
                        <textarea id="refundNotesArea" class="chk-input-field" placeholder="Describe the reason for your refund request in detail..." style="background: #111; border-color: #222; resize: vertical; min-height: 80px; font-family: inherit; color: #fff;"></textarea>
                    </div>
                    <button class="checkout-trigger-btn" onclick="submitRefundRequest()" style="background: #ff4444; color: #fff; margin-top: 5px;">Submit Refund Request</button>
                </div>
            `;
        }
    }
}

async function submitRefundRequest() {
    const reasonSelect = document.getElementById('refundReasonSelect');
    if (!reasonSelect || !reasonSelect.value) {
        showToast("Please select a reason for the refund.", "error");
        return;
    }
    const reason = reasonSelect.value;
    const notes = document.getElementById('refundNotesArea').value.trim();

    if (!confirm("Are you sure you want to request a refund for this order?")) {
        return;
    }

    const updatedData = {
        status: 'refund_requested',
        refund_reason: reason,
        refund_notes: notes,
        refund_requested_at: new Date().toISOString()
    };

    let success = false;

    if (activeRefundOrder.isLocal) {
        let localOrders = [];
        try {
            localOrders = JSON.parse(localStorage.getItem('storeOrders')) || [];
        } catch(e) {
            console.error("Failed to parse storeOrders in submitRefundRequest:", e);
        }
        const index = localOrders.findIndex(o => String(o.id) === String(activeRefundOrder.id));
        if (index !== -1) {
            localOrders[index] = {
                ...localOrders[index],
                status: 'refund_requested',
                refund_reason: reason,
                refund_notes: notes,
                refund_requested_at: updatedData.refund_requested_at
            };
            localStorage.setItem('storeOrders', JSON.stringify(localOrders));
            success = true;
        }
    } else {
        try {
            const res = await fetch(`/api/proxy?table=orders&id=eq.${activeRefundOrder.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    activeRefundOrder = { ...data[0], isLocal: false };
                    success = true;
                }
            }
        } catch(e) {
            console.error("Failed to update refund in database:", e);
        }
    }

    if (success) {
        showToast("Refund request submitted successfully!", "success");
        displayRefundOrderDetails({ ...activeRefundOrder, status: 'refund_requested', refund_reason: reason, refund_notes: notes });
    } else {
        showToast("Failed to submit refund request. Please check your connection and try again.", "error");
    }
}

function parseLocalDate(dateStr) {
    try {
        const cleaned = dateStr.split(' ')[0];
        const parts = cleaned.split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[0] - 1, parts[1]);
        }
    } catch(e) {}
    return new Date();
}

// Watch changes coming from admin panels in separate browser window tabs dynamically
window.addEventListener('storage', () => {
    initApp();
    if(document.getElementById('checkoutPage').classList.contains('open') && document.getElementById('chkCity').value) {
        calculateTotals();
    }
});

// --- PREMIUM COSMIC GRAPHICS & VISUAL EFFECTS ENGINE ---

// 1. Custom Toast Notification System
function showToast(message, type = "info") {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });
    
    // Auto dismiss after 3.8 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(-12px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3800);
}

// 2. Intersection Observer Scroll Reveal Animation setup
let revealObserver = null;
function initScrollReveal() {
    if (revealObserver) {
        revealObserver.disconnect();
    }
    
    const elements = document.querySelectorAll('.scroll-reveal');
    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -45px 0px'
    });
    
    elements.forEach(el => revealObserver.observe(el));
}

// 3. Cosmic Background Starfield Particle Animation Canvas
function initCosmicCanvas() {
    const canvas = document.getElementById('cosmic-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId = null;
    let stars = [];
    const maxStars = window.innerWidth < 768 ? 40 : 100; // Scaled down for mobile devices
    
    // Track mouse variables
    let mouse = { x: null, y: null, active: false };
    
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        initStars();
    }
    
    function initStars() {
        stars = [];
        for (let i = 0; i < maxStars; i++) {
            stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 1.5 + 0.3,
                baseAlpha: Math.random() * 0.5 + 0.1,
                alpha: 0,
                shimmerSpeed: Math.random() * 0.02 + 0.005,
                angle: Math.random() * Math.PI * 2,
                orbitRadius: Math.random() * 10 + 2,
                orbitSpeed: (Math.random() * 0.005 + 0.001) * (Math.random() > 0.5 ? 1 : -1)
            });
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        
        // Draw connecting constellation lines in Light Mode
        if (document.body.classList.contains('light-mode')) {
            ctx.strokeStyle = 'rgba(15, 15, 15, 0.04)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    let dx = (stars[i].x + Math.cos(stars[i].angle) * stars[i].orbitRadius) - (stars[j].x + Math.cos(stars[j].angle) * stars[j].orbitRadius);
                    let dy = (stars[i].y + Math.sin(stars[i].angle) * stars[i].orbitRadius) - (stars[j].y + Math.sin(stars[j].angle) * stars[j].orbitRadius);
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 80) {
                        ctx.beginPath();
                        ctx.moveTo(stars[i].x + Math.cos(stars[i].angle) * stars[i].orbitRadius, stars[i].y + Math.sin(stars[i].angle) * stars[i].orbitRadius);
                        ctx.lineTo(stars[j].x + Math.cos(stars[j].angle) * stars[j].orbitRadius, stars[j].y + Math.sin(stars[j].angle) * stars[j].orbitRadius);
                        ctx.stroke();
                    }
                }
            }
        }
        
        stars.forEach(star => {
            // Twinkle shimmer calculation
            star.angle += star.orbitSpeed;
            let currentX = star.x + Math.cos(star.angle) * star.orbitRadius;
            let currentY = star.y + Math.sin(star.angle) * star.orbitRadius;
            
            // Faint shimmering glow
            star.alpha = star.baseAlpha + Math.sin(Date.now() * star.shimmerSpeed) * 0.15;
            star.alpha = Math.max(0.05, Math.min(0.7, star.alpha));
            
            // Render star circle
            ctx.beginPath();
            ctx.arc(currentX, currentY, star.size, 0, Math.PI * 2);
            ctx.fillStyle = document.body.classList.contains('light-mode') 
                ? `rgba(15, 15, 15, ${star.alpha * 0.7})` 
                : `rgba(255, 255, 255, ${star.alpha})`;
            ctx.shadowBlur = star.size > 1.2 && !document.body.classList.contains('light-mode') ? 3 : 0;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
        });
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // Performance friendly window state change hooks
    window.addEventListener('resize', resizeCanvas);
    
    window.addEventListener('mousemove', throttle((e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    }, 50));
    
    window.addEventListener('mouseleave', () => {
        mouse.active = false;
    });
    
    // Toggle animation based on visibility to save CPU/Battery
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else {
            animate();
        }
    });
    
    resizeCanvas();
    animate();
}

// --- PRE-LAUNCH HYPE MODE FUNCTIONS ---
function checkPrelaunch() {
    const plErr = document.getElementById('prelaunchBypassError');
    if (plErr) plErr.style.display = 'none';
    const plInput = document.getElementById('prelaunchBypassPass');
    if (plInput) plInput.value = '';

    const bypass = localStorage.getItem('mjr_bypass_prelaunch') === 'true';
    // Use cfg helper instead of undefined siteConfig
    const showPrelaunch = cfg('showPrelaunch', false);
    const dateStr = cfg('prelaunchDate', '2026-07-01T20:00:00');
    const targetDate = window.parseLaunchDate ? window.parseLaunchDate(dateStr) : new Date(dateStr).getTime();
    const now = new Date().getTime();
    
    const plScreen = document.getElementById('prelaunchScreen');
    const blockingStyle = document.getElementById('prelaunch-blocking-style');
    
    // Manage dynamic floating bypass badge
    let existingBadge = document.getElementById('prelaunchBypassBadge');
    if (showPrelaunch && bypass && targetDate > now) {
        if (!existingBadge) {
            const badge = document.createElement('button');
            badge.id = 'prelaunchBypassBadge';
            badge.onclick = lockPrelaunchStore;
            badge.title = 'Lock Store';
            badge.style.cssText = 'position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;background:rgba(8,8,8,0.92);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:18px;cursor:pointer;z-index:99999;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.5);backdrop-filter:blur(8px);transition:transform 0.2s,background 0.2s;';
            badge.onmouseover = () => { badge.style.background='rgba(255,68,68,0.15)'; badge.style.transform='scale(1.1)'; };
            badge.onmouseout  = () => { badge.style.background='rgba(8,8,8,0.92)';    badge.style.transform='scale(1)'; };
            badge.innerHTML = '🔒';
            document.body.appendChild(badge);
        }
    } else {
        if (existingBadge) existingBadge.remove();
    }
    
    if (showPrelaunch && !bypass && targetDate > now) {
        if (plScreen) plScreen.style.display = 'flex';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        
        // Start countdown if not already running
        if (!prelaunchCountdownInterval) {
            initPrelaunchCountdown();
        }
    } else {
        if (plScreen) plScreen.style.display = 'none';
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        if (blockingStyle) blockingStyle.remove();
        if (prelaunchCountdownInterval) {
            clearInterval(prelaunchCountdownInterval);
            prelaunchCountdownInterval = null;
        }
    }
}

function lockPrelaunchStore() {
    localStorage.removeItem('mjr_bypass_prelaunch');
    location.reload();
}

let teaserCountdownInterval = null;
function initTeaserCountdown() {
    const dateStr = cfg('drop2TeaserDate', '2026-07-15T20:00:00');
    const targetDate = window.parseLaunchDate ? window.parseLaunchDate(dateStr) : new Date(dateStr).getTime();

    function updateTeaserCountdown() {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff <= 0) {
            if (teaserCountdownInterval) {
                clearInterval(teaserCountdownInterval);
                teaserCountdownInterval = null;
            }
            const daysEl = document.getElementById('teaser-days');
            const hoursEl = document.getElementById('teaser-hours');
            const minsEl = document.getElementById('teaser-minutes');
            const secsEl = document.getElementById('teaser-seconds');
            if (daysEl) daysEl.innerText = '00';
            hoursEl.innerText = '00';
            if (minsEl) minsEl.innerText = '00';
            if (secsEl) secsEl.innerText = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const daysEl = document.getElementById('teaser-days');
        const hoursEl = document.getElementById('teaser-hours');
        const minsEl = document.getElementById('teaser-minutes');
        const secsEl = document.getElementById('teaser-seconds');

        if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
        if (minsEl) minsEl.innerText = String(minutes).padStart(2, '0');
        if (secsEl) secsEl.innerText = String(seconds).padStart(2, '0');
    }

    if (teaserCountdownInterval) clearInterval(teaserCountdownInterval);
    updateTeaserCountdown();
    teaserCountdownInterval = setInterval(updateTeaserCountdown, 1000);
}

let prelaunchCountdownInterval = null;
function initPrelaunchCountdown() {
    const dateStr = cfg('prelaunchDate', '2026-07-01T20:00:00');
    const targetDate = window.parseLaunchDate ? window.parseLaunchDate(dateStr) : new Date(dateStr).getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const diff = targetDate - now;
        
        if (diff <= 0) {
            clearInterval(prelaunchCountdownInterval);
            prelaunchCountdownInterval = null;
            checkPrelaunch();
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const daysEl = document.getElementById('pl-days');
        const hoursEl = document.getElementById('pl-hours');
        const minsEl = document.getElementById('pl-minutes');
        const secsEl = document.getElementById('pl-seconds');
        
        if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
        if (minsEl) minsEl.innerText = String(minutes).padStart(2, '0');
        if (secsEl) secsEl.innerText = String(seconds).padStart(2, '0');
    }
    
    updateCountdown();
    prelaunchCountdownInterval = setInterval(updateCountdown, 1000);
}

function togglePrelaunchPasswordInput() {
    const container = document.getElementById('prelaunchPasswordContainer');
    if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
}

function handlePrelaunchBypass(e) {
    e.preventDefault();
    const passInput = document.getElementById('prelaunchBypassPass');
    if (!passInput) return;
    const enteredPass = passInput.value.trim();
    const correctPass = cfg('bypassPassword', 'majarah2026');
    
    if (enteredPass === correctPass) {
        localStorage.setItem('mjr_bypass_prelaunch', 'true');
        checkPrelaunch();
    } else {
        const errEl = document.getElementById('prelaunchBypassError');
        if (errEl) {
            errEl.style.display = 'block';
            setTimeout(() => { errEl.style.display = 'none'; }, 3000);
        }
    }
}

async function handlePrelaunchNotify(e) {
    e.preventDefault();
    const emailInput = document.getElementById('prelaunchEmail');
    if (!emailInput) return;
    const email = emailInput.value.trim().toLowerCase();
    if (!email) return;
    
    const btn = e.target.querySelector('button');
    if (btn) btn.disabled = true;
    emailInput.disabled = true;
    
    try {
        const res = await fetch('/api/register-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        if (res.ok) {
            document.getElementById('prelaunchSubscription').style.display = 'none';
            document.getElementById('prelaunchSubSuccess').style.display = 'block';
        } else {
            const data = await res.json().catch(() => ({}));
            alert(data.error || 'Failed to register email. Please try again.');
            if (btn) btn.disabled = false;
            emailInput.disabled = false;
        }
    } catch (err) {
        console.error("Failed to register prelaunch email:", err);
        alert('Failed to connect to the email signup server.');
        if (btn) btn.disabled = false;
        emailInput.disabled = false;
    }
}

function toggleTheme() {
    if (!DOM.body) initDOMCache();
    const body = DOM.body;
    body.classList.remove('theme-rippling');
    void body.offsetWidth; // trigger reflow
    
    const nextLight = !body.classList.contains('light-mode');
    body.style.setProperty('--ripple-color', nextLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)');
    body.classList.add('theme-rippling');
    
    const path = document.getElementById('themeTogglePath');
    const icon = document.getElementById('themeToggleIcon');
    
    const isLight = body.classList.toggle('light-mode');
    
    // Spin icon 360 degrees on toggle
    if (icon) {
        icon.style.transform = isLight ? 'rotate(360deg)' : 'rotate(0deg)';
    }
    
    // Update path to Moon or Sun
    if (path) {
        if (isLight) {
            // Sun icon path
            path.setAttribute('d', 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42');
        } else {
            // Moon icon path
            path.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
        }
    }
    
    // Save preference
    localStorage.setItem('mjr_theme', isLight ? 'light' : 'dark');
}

// --- COOKIE HELPERS ---
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// --- CUSTOMER AUTHENTICATION & COOKIE PERSISTENCE ---
let activeCustomerSession = null;

function initUserSession() {
    const session = getCookie('mjr_customer_session');
    const authLink = document.getElementById('navAuthLink');
    const authLi = document.getElementById('navAuthLi');
    
    // Toggle visibility based on dynamic settings
    if (window.applyDynamicSettings) window.applyDynamicSettings();
    
    if (session) {
        try {
            activeCustomerSession = JSON.parse(decodeURIComponent(session));
            if (authLink) {
                authLink.innerText = `Hi, ${activeCustomerSession.username.toUpperCase()}`;
            }
        } catch(e) {
            console.error("Failed to parse customer session:", e);
            activeCustomerSession = null;
            eraseCookie('mjr_customer_session');
        }
    } else {
        activeCustomerSession = null;
        if (authLink) {
            authLink.innerText = "Sign In";
        }
    }
}

function openAuthModal() {
    document.getElementById('authModal').classList.add('open');
    lockBodyScroll();
    if (activeCustomerSession) {
        switchAuthTab('profile');
    } else {
        switchAuthTab('login');
    }
}

function closeAuthModal(e) {
    if (!e || e.target.classList.contains("overlay") || e.target.classList.contains("modal-x")) {
        document.getElementById('authModal').classList.remove('open');
        unlockBodyScroll();
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = '#444';
    });
    document.querySelectorAll('.auth-pane').forEach(p => p.style.display = 'none');
    
    const loginBtn = document.getElementById('tabLoginBtn');
    const signupBtn = document.getElementById('tabSignupBtn');
    const profileBtn = document.getElementById('tabProfileBtn');
    
    if (tab === 'login') {
        loginBtn.classList.add('active');
        loginBtn.style.color = '#fff';
        document.getElementById('paneLogin').style.display = 'block';
        document.getElementById('authLoginError').style.display = 'none';
    } else if (tab === 'signup') {
        signupBtn.classList.add('active');
        signupBtn.style.color = '#fff';
        document.getElementById('paneSignup').style.display = 'block';
        document.getElementById('authSignupError').style.display = 'none';
    } else if (tab === 'profile') {
        profileBtn.classList.add('active');
        profileBtn.style.color = '#fff';
        profileBtn.style.display = 'block';
        
        // Hide login and signup tabs when logged in
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        
        document.getElementById('paneProfile').style.display = 'block';
        loadCustomerProfile();
    } else if (tab === 'forgot') {
        document.getElementById('paneForgot').style.display = 'block';
        document.getElementById('authForgotError').style.display = 'none';
    }
}

async function submitAuthSignup() {
    const username = document.getElementById('authSignupUser').value.trim();
    const email = document.getElementById('authSignupEmail').value.trim();
    const password = document.getElementById('authSignupPass').value;
    const confirm = document.getElementById('authSignupConfirm').value;
    const errEl = document.getElementById('authSignupError');
    
    if (errEl) errEl.style.display = 'none';
    
    if (!username || !email || !password || !confirm) {
        if (errEl) {
            errEl.innerText = "All fields are required.";
            errEl.style.display = 'block';
        }
        return;
    }
    
    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
    if (!emailRegex.test(email)) {
        if (errEl) {
            errEl.innerText = "Please enter a valid email address.";
            errEl.style.display = 'block';
        }
        return;
    }
    
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        if (errEl) {
            errEl.innerText = "Username must be 3-20 characters long and contain only letters, numbers, or underscores.";
            errEl.style.display = 'block';
        }
        return;
    }
    
    if (password !== confirm) {
        if (errEl) {
            errEl.innerText = "Passwords do not match.";
            errEl.style.display = 'block';
        }
        return;
    }
    
    if (password.length < 6) {
        if (errEl) {
            errEl.innerText = "Password must be at least 6 characters.";
            errEl.style.display = 'block';
        }
        return;
    }
    
    let success = false;
    
    // 1. Try Proxy
    try {
        // Check if user already exists
        const checkRes = await fetch(`/api/proxy?table=users&select=id&or=(username.eq.${encodeURIComponent(username)},email.eq.${encodeURIComponent(email)})`);
        
        if (checkRes.ok) {
            const existing = await checkRes.json();
            if (existing && existing.length > 0) {
                if (errEl) {
                    errEl.innerText = "Username or Email already registered.";
                    errEl.style.display = 'block';
                }
                return;
            }
        }
        
        // Insert new user
        const createRes = await fetch(`/api/proxy?table=users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        if (createRes.ok) {
            success = true;
        } else {
            console.error("Supabase user signup failed:", await createRes.text());
        }
    } catch(e) {
        console.error("Database connection down during signup:", e);
    }
    
    // 2. Local Storage Fallback if DB offline or failed
    if (!success) {
        const localUsers = JSON.parse(localStorage.getItem('mjr_local_users')) || [];
        const exists = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
        
        if (exists) {
            if (errEl) {
                errEl.innerText = "Username or Email already registered.";
                errEl.style.display = 'block';
            }
            return;
        }
        
        localUsers.push({ username, email, password });
        localStorage.setItem('mjr_local_users', JSON.stringify(localUsers));
        success = true;
    }
    
    if (success) {
        // Log in the user
        const sessionVal = encodeURIComponent(JSON.stringify({ username, email }));
        setCookie('mjr_customer_session', sessionVal, 30);
        showToast("Account created and signed in successfully!", "success");
        initUserSession();
        switchAuthTab('profile');
        
        // Clear fields
        document.getElementById('authSignupUser').value = '';
        document.getElementById('authSignupEmail').value = '';
        document.getElementById('authSignupPass').value = '';
        document.getElementById('authSignupConfirm').value = '';
    } else {
        if (errEl) {
            errEl.innerText = "Signup failed. Please try again.";
            errEl.style.display = 'block';
        }
    }
}

async function submitAuthLogin() {
    const identifier = document.getElementById('authLoginEmail').value.trim();
    const password = document.getElementById('authLoginPass').value;
    const errEl = document.getElementById('authLoginError');
    
    if (errEl) errEl.style.display = 'none';
    
    if (!identifier || !password) {
        if (errEl) {
            errEl.innerText = "Both fields are required.";
            errEl.style.display = 'block';
        }
        return;
    }
    
    let loggedUser = null;
    
    // 1. Try Proxy
    try {
        // Check username or email matching password
        const loginRes = await fetch(`/api/proxy?table=users&select=username,email&password=eq.${encodeURIComponent(password)}&or=(username.eq.${encodeURIComponent(identifier)},email.eq.${encodeURIComponent(identifier)})`);
        
        if (loginRes.ok) {
            const data = await loginRes.json();
            if (data && data.length > 0) {
                loggedUser = data[0];
            }
        }
    } catch(e) {
        console.error("Database connection down during login:", e);
    }
    
    // 2. Local Storage Fallback if DB offline or failed
    if (!loggedUser) {
        const localUsers = JSON.parse(localStorage.getItem('mjr_local_users')) || [];
        const found = localUsers.find(u => 
            (u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase()) && 
            u.password === password
        );
        if (found) {
            loggedUser = { username: found.username, email: found.email };
        }
    }
    
    if (loggedUser) {
        const sessionVal = encodeURIComponent(JSON.stringify(loggedUser));
        setCookie('mjr_customer_session', sessionVal, 30);
        showToast(`Welcome back, ${loggedUser.username}!`, "success");
        initUserSession();
        switchAuthTab('profile');
        
        // Clear fields
        document.getElementById('authLoginEmail').value = '';
        document.getElementById('authLoginPass').value = '';
    } else {
        if (errEl) {
            errEl.innerText = "Invalid credentials. Please try again.";
            errEl.style.display = 'block';
        }
    }
}

async function submitAuthForgot() {
    const identifier = document.getElementById('authForgotIdentifier').value.trim();
    const newPass = document.getElementById('authForgotNewPass').value;
    const confirmPass = document.getElementById('authForgotConfirmNewPass').value;
    const errEl = document.getElementById('authForgotError');
    
    if (errEl) errEl.style.display = 'none';
    
    if (!identifier || !newPass || !confirmPass) {
        if (errEl) {
            errEl.innerText = "All fields are required.";
            errEl.style.display = 'block';
        }
        return;
    }
    
    if (newPass !== confirmPass) {
        if (errEl) {
            errEl.innerText = "Passwords do not match.";
            errEl.style.display = 'block';
        }
        return;
    }
    
    if (newPass.length < 6) {
        if (errEl) {
            errEl.innerText = "Password must be at least 6 characters.";
            errEl.style.display = 'block';
        }
        return;
    }
    
    let success = false;
    
    // 1. Try Proxy
    try {
        // Check if user exists
        const checkRes = await fetch(`/api/proxy?table=users&select=id&or=(username.eq.${encodeURIComponent(identifier)},email.eq.${encodeURIComponent(identifier)})`);
        
        if (checkRes.ok) {
            const data = await checkRes.json();
            if (data && data.length > 0) {
                const userId = data[0].id;
                // Update user's password
                const updateRes = await fetch(`/api/proxy?table=users&id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ password: newPass })
                });
                if (updateRes.ok) {
                    success = true;
                }
            } else {
                if (errEl) {
                    errEl.innerText = "User not found with matching username/email.";
                    errEl.style.display = 'block';
                }
                return;
            }
        }
    } catch(e) {
        console.error("Database connection down during password reset:", e);
    }
    
    // 2. Local Storage Fallback if DB offline or failed
    if (!success) {
        const localUsers = JSON.parse(localStorage.getItem('mjr_local_users')) || [];
        const index = localUsers.findIndex(u => u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase());
        
        if (index !== -1) {
            localUsers[index].password = newPass;
            localStorage.setItem('mjr_local_users', JSON.stringify(localUsers));
            success = true;
        }
    }
    
    if (success) {
        showToast("Password reset successfully! Please log in.", "success");
        switchAuthTab('login');
        document.getElementById('authForgotIdentifier').value = '';
        document.getElementById('authForgotNewPass').value = '';
        document.getElementById('authForgotConfirmNewPass').value = '';
    } else {
        if (errEl) {
            errEl.innerText = "User not found or reset failed. Try again.";
            errEl.style.display = 'block';
        }
    }
}

function submitAuthLogout() {
    eraseCookie('mjr_customer_session');
    showToast("Signed out successfully.", "success");
    initUserSession();
    
    // Reset modal tabs display
    document.getElementById('tabLoginBtn').style.display = 'block';
    document.getElementById('tabSignupBtn').style.display = 'block';
    document.getElementById('tabProfileBtn').style.display = 'none';
    
    switchAuthTab('login');
    closeAuthModal();
}
async function loadCustomerProfile() {
    if (!activeCustomerSession) return;
    
    const summaryEl = document.getElementById('authProfileSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <h3 style="font-size: 15px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; color:#fff;">${activeCustomerSession.username}</h3>
            <p style="font-size: 11px; color: #555; text-transform: none;">${activeCustomerSession.email}</p>
        `;
    }
    
    const ordersContainer = document.getElementById('authProfileOrders');
    if (!ordersContainer) return;
    
    ordersContainer.innerHTML = `<p style="font-size: 11px; color: #555;">Loading order history...</p>`;
    
    let ordersList = [];
    
    // 1. Fetch from Proxy
    try {
        const res = await fetch(`/api/proxy?table=orders&select=*&email=eq.${encodeURIComponent(activeCustomerSession.email)}&order=id.desc`);
        if (res.ok) {
            ordersList = await res.json();
        }
    } catch(e) {
        console.error("Failed to load customer orders from DB:", e);
    }
    
    // 2. Fetch from Local Storage Fallback
    let localOrders = [];
    try {
        localOrders = JSON.parse(localStorage.getItem('storeOrders')) || [];
    } catch(e) {
        console.error("Failed to parse storeOrders in loadCustomerProfile:", e);
    }
    const matchedLocal = localOrders.filter(o => o.email && o.email.toLowerCase() === activeCustomerSession.email.toLowerCase());
    
    // Combine arrays ensuring no duplicates (by ID)
    matchedLocal.forEach(lo => {
        if (!ordersList.some(o => String(o.id) === String(lo.id))) {
            ordersList.push({
                id: lo.id,
                created_at: lo.date ? parseLocalDate(lo.date).toISOString() : new Date().toISOString(),
                product_name: lo.product_name || (lo.itemPrice ? (lo.product_name || 'Alabaster Graphic Tee') : 'Onyx Graphic Tee'),
                size: lo.size || (lo.date && lo.date.includes('(') ? lo.date.substring(lo.date.indexOf('(')+1, lo.date.indexOf(' -')) : 'M'),
                subtotal: lo.subtotal || lo.itemPrice || 520,
                shipping_cost: lo.shipping_cost || lo.shippingFee || 60,
                status: lo.status ? lo.status.toLowerCase() : 'pending'
            });
        }
    });
    
    if (ordersList.length === 0) {
        ordersContainer.innerHTML = `<p style="font-size: 11px; color: #444;">No orders placed yet.</p>`;
        return;
    }
    
    ordersContainer.innerHTML = ordersList.map(o => {
        const orderDate = o.created_at ? new Date(o.created_at).toLocaleDateString() : '—';
        const total = (Number(o.subtotal) || 0) + (Number(o.shipping_cost) || 0);
        let badgeClass = 'status-pending';
        if (o.status === 'confirmed' || o.status === 'delivered' || o.status === 'shipped') badgeClass = 'status-confirmed';
        if (o.status === 'cancelled') badgeClass = 'status-cancelled';
        if (o.status === 'refund_requested') badgeClass = 'status-refund_requested';
        if (o.status === 'refunded') badgeClass = 'status-refunded';
        if (o.status === 'refund_denied') badgeClass = 'status-refund_denied';
        
        return `
            <div style="background: #0d0d0d; border: 1px solid #141414; padding: 12px 15px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <div style="font-size: 12px; font-weight: 700; color: #fff;">Order #${o.id}</div>
                    <div style="font-size: 11px; color: #555; margin-top: 4px;">${o.product_name} (${o.size}) · ${orderDate}</div>
                    <div style="font-size: 11px; color: #aaa; margin-top: 2px;">Total: EGP ${total}.00</div>
                </div>
                <span class="status-badge ${badgeClass}" style="font-size: 9px; padding: 2px 8px;">${o.status}</span>
            </div>
        `;
    }).join('');
}

// --- NEWSLETTER SIGNUP ---
function submitNewsletter() {
    const emailInput = document.getElementById('newsletterEmail');
    if (!emailInput || !emailInput.value.trim()) {
        showToast("Please enter a valid email address.", "error");
        return;
    }
    
    const email = emailInput.value.trim();
    
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast("Please enter a valid email address.", "error");
        return;
    }
    
    showToast("Thank you for subscribing! Check your email for future drops.", "success");
    emailInput.value = '';
}

// --- SUPPORT CHAT ---
function toggleChatWidget(event) {
    if (event) {
        event.stopPropagation();
    }
    const chatWin = document.getElementById('chatWindow');
    if (chatWin) {
        if (chatWin.style.display === 'none') {
            chatWin.style.display = 'block';
            const badge = document.querySelector('.widget-chat-badge');
            if (badge) badge.style.display = 'none';
        } else {
            chatWin.style.display = 'none';
        }
    }
}

function triggerFooterContact() {
    const chatWin = document.getElementById('chatWindow');
    if (chatWin) {
        chatWin.style.display = 'block';
        // Scroll to bottom of page so chat widget is visible
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        showToast(currentLang === 'ar' ? 'تواصل معانا عبر واتساب أو انستجرام 👇' : 'Chat with us via WhatsApp or Instagram 👇', 'info');
    }
}

// Close chat window on click outside
document.addEventListener('click', (e) => {
    const chatWin = document.getElementById('chatWindow');
    const chatWidget = document.querySelector('.support-chat-widget');
    if (chatWin && chatWin.style.display === 'block') {
        if (!chatWin.contains(e.target) && !chatWidget.contains(e.target)) {
            chatWin.style.display = 'none';
        }
    }
});

// --- MOBILE TOUCH FLIP FOR PRODUCT CARDS ---
// On mobile, a single tap flips the card to show the back image
// A second tap opens the product page
let mobileFlippedCard = null;
document.addEventListener('touchstart', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) {
        // Tap outside a card — unflip
        if (mobileFlippedCard) {
            mobileFlippedCard.classList.remove('mobile-flipped');
            mobileFlippedCard = null;
        }
        return;
    }
    // On mobile, if card is not flipped, flip it first
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) {
        if (mobileFlippedCard && mobileFlippedCard !== card) {
            mobileFlippedCard.classList.remove('mobile-flipped');
            mobileFlippedCard = null;
        }
        if (!card.classList.contains('mobile-flipped')) {
            e.preventDefault();
            card.classList.add('mobile-flipped');
            mobileFlippedCard = card;
        }
        // If already flipped, let the onclick through to openProduct
    }
}, { passive: false });

// --- DYNAMIC HINTS: hide hover hint on mobile ---
(function updateMobileHint() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const hintEl = document.querySelector('[data-t="tap_explore"]');
    if (hintEl && isTouchDevice) {
        const isAr = currentLang === 'ar';
        hintEl.textContent = isAr ? 'اضغط على أي قطعة للاستكشاف · اضغط مرتين لرؤية الظهر' : 'Tap to explore · Tap again to see the back';
    }
})();

// Run Application Bootstrap Setup Loop
initApp();
