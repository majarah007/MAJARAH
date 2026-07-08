module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { key } = req.query;
  if (!key) {
    res.status(400).json({ error: 'Missing key parameter.' });
    return;
  }

  const content = {
    brand: {
      en: '<strong>Majarrah — مَجَرَّة</strong> is an Egyptian streetwear collective founded to construct high-concept garments that act as blank canvases for cosmic identity architecture. Crafted in Cairo, scaled for the infinite.',
      ar: '<strong>مَجَرَّة — مَجَرَّة</strong> هي علامة تجارية مصرية لملابس الشارع تأسست لتصميم ملابس ذات طابع خاص تعبر عن الهوية الكونية. صُنعت في القاهرة، وصُممت لتلائم اللانهائية.'
    },
    how: {
      en: [
        { n: '01', title: 'Pick Your Piece', desc: 'Tap any garment to view its high-definition specs, artwork prints, dimensions, and sizing configurations.' },
        { n: '02', title: 'Checkout Instantly', desc: 'Provide your delivery metrics securely directly inside the Shopify-style application checkout interface panel.' },
        { n: '03', title: 'Dispatch Order', desc: 'The system automatically registers and maps your manifest details seamlessly to complete fulfillment loops quickly.' }
      ],
      ar: [
        { n: '01', title: 'اختر قطعتك', desc: 'اضغط على أي تصميم لعرض تفاصيله الدقيقة ومقاساته وألوانه.' },
        { n: '02', title: 'الدفع الفوري', desc: 'أدخل بيانات الشحن بأمان داخل صفحة الدفع المصممة خصيصاً.' },
        { n: '03', title: 'تأكيد وإرسال الطلب', desc: 'يقوم النظام تلقائياً بتسجيل بياناتك وتجهيز طلبك للشحن الفوري.' }
      ]
    },
    size: {
      headers: {
        en: ['Size', 'Chest', 'Length', 'Weight', 'Height'],
        ar: ['المقاس', 'الصدر', 'الطول', 'الوزن', 'الطول']
      },
      rows: [
        ['S', '55 cm', '69 cm', '55 - 65 kg', '160 - 170 cm'],
        ['M', '57 cm', '70 cm', '65 - 75 kg', '165 - 175 cm'],
        ['L', '61 cm', '73 cm', '75 - 85 kg', '170 - 180 cm'],
        ['XL', '64 cm', '77 cm', '85 - 100 kg', '175 - 190 cm']
      ],
      note: {
        en: '<strong>Fit is oversized.</strong> Garment patterns are cut loose. Size down if you prefer a standard, closer-to-body look.',
        ar: '<strong>المقاس واسع (Oversized).</strong> القصات واسعة ومريحة. اختر مقاساً أصغر إذا كنت تفضل المظهر المعتاد.'
      }
    },
    washing: {
      en: [
        { title: 'Hand Wash Cold', desc: 'Wash in cold water to keep fabric structured and soft.' },
        { title: 'Wash Inside Out', desc: 'Turn your piece inside out before washing to protect prints.' },
        { title: 'Do Not Tumble Dry', desc: 'Air dry naturally. Tumble drying will shrink or warp cotton.' },
        { title: 'Wash with Similar Colors', desc: 'Wash dark and light garments separately to avoid dye bleeding.' }
      ],
      ar: [
        { title: 'غسيل يدوي بارد', desc: 'اغسل في ماء بارد للحفاظ على هيكل القماش ونعومته.' },
        { title: 'الغسيل بالمقلوب', desc: 'اقلب القطعة للداخل قبل الغسيل لحماية الطبعات.' },
        { title: 'تجنب المجفف الحراري', desc: 'يجفف طبيعياً في الهواء. التجفيف الحراري قد يقلص القطن.' },
        { title: 'الغسيل مع ألوان مماثلة', desc: 'اغسل الملابس الداكنة والفاتحة بشكل منفصل لتجنب بهتان الألوان.' }
      ]
    },
    garment: {
      en: [
        { title: 'Iron Low Heat', desc: 'Iron on a low setting. Never run the iron directly over printed graphics.' },
        { title: 'Do Not Bleach', desc: 'Bleaching agents destroy organic cotton fibers and ruin prints.' },
        { title: 'Dry in Shade', desc: 'Direct sunlight fades intense dyes. Dry indoors or in shaded areas.' },
        { title: 'Store Folded', desc: 'Hangers can stretch heavy cotton shoulder seams. Fold to store.' }
      ],
      ar: [
        { title: 'الكي بدرجة حرارة منخفضة', desc: 'يكوى على درجة حرارة منخفضة. لا تمرر المكواة مباشرة على الطبعات.' },
        { title: 'تجنب استخدام المبيضات', desc: 'المبيضات تتلف ألياف القطن العضوي وتفسد الألوان والطبعات.' },
        { title: 'التجفيف في الظل', desc: 'أشعة الشمس المباشرة تبهت الصبغات. يجفف في الداخل أو الظل.' },
        { title: 'التخزين مطوياً', desc: 'العلاقات قد تمدد أكتاف القطن الثقيل. يطوى للحفظ.' }
      ]
    },
    policies: {
      en: [
        'Exchange & Return is valid within 14 days of receiving your order.',
        'Items must be in original condition, unworn, unwashed, and with all tags attached.',
        'Return shipping fees are covered by the customer unless the item is defective or incorrect.',
        'Refunds are processed within 5-7 business days after inspect approval.',
        'Sale/customized items are not eligible for refund unless defective.'
      ],
      ar: [
        'الاستبدال والاسترجاع متاح خلال 14 يوماً من استلام الطلب.',
        'يجب أن تكون المنتجات بحالتها الأصلية، غير مستعملة، غير مغسولة، ومع كافة الملصقات.',
        "يتحمل العميل مصاريف شحن المرتجعات إلا إذا كان المنتج معيباً أو غير صحيح.",
        'تتم معالجة المستردات المالية خلال 5-7 أيام عمل بعد فحص المرتجعات وقبولها.',
        'المنتجات المخفضة أو المخصصة غير قابلة للاسترجاع إلا في حالة وجود عيب مصنعي.'
      ]
    }
  };

  if (!content[key]) {
    res.status(404).json({ error: 'Content key not found.' });
    return;
  }

  res.status(200).json(content[key]);
};
