// data/food-db.js
export const FOOD_DB = {
    protein: {
      // قطع/حبات
      egg_large: { label: "بيض", unit: "piece", gramsPerUnit: 60, macrosPerUnit: { protein: 6, carbs: 0.4, fat: 5, calories: 72 } },
  
      // لحوم ودواجن وأسماك (لكل 100غ)
      chicken_breast_100:         { label: "صدور دجاج", per100g: true, macros100: { protein: 31, carbs: 0,  fat: 3.6, calories: 165 } },
      chicken_thigh_skinless_100: { label: "ورك دجاج منزوع الجلد", per100g: true, macros100: { protein: 26, carbs: 0,  fat: 9,   calories: 209 } },
      beef_lean_90_100:           { label: "لحم بقري قليل الدهن (90%)", per100g: true, macros100: { protein: 26, carbs: 0,  fat: 10,  calories: 217 } },
      veal_lean_100:              { label: "لحم عجل/حاشي", per100g: true, macros100: { protein: 31, carbs: 0,  fat: 8,   calories: 215 } },
      lamb_lean_100:              { label: "لحم غنم قليل الدهن", per100g: true, macros100: { protein: 25, carbs: 0,  fat: 17,  calories: 282 } },
      white_fish_100:             { label: "سمك أبيض", per100g: true, macros100: { protein: 22, carbs: 0,  fat: 2,   calories: 110 } },
      salmon_100:                 { label: "سلمون", per100g: true, macros100: { protein: 20, carbs: 0,  fat: 13,  calories: 208 } },
      tuna_100:                   { label: "تونة مصفّاة", per100g: true, macros100: { protein: 26, carbs: 0,  fat: 1,   calories: 120 } },
      shrimp_100:                 { label: "روبيان/جمبري", per100g: true, macros100: { protein: 24, carbs: 0,  fat: 0.3, calories: 99 } },
  
      // ألبان
      labneh_lowfat_100:          { label: "لبنة قليلة الدسم", per100g: true, macros100: { protein: 10, carbs: 6,  fat: 2,   calories: 82 } },
      greek_yogurt_fatfree_100:   { label: "زبادي يوناني خالي الدسم", per100g: true, macros100: { protein: 10, carbs: 4,  fat: 0,   calories: 59 } },
      cottage_cheese_lowfat_100:  { label: "جبن قريش قليل الدسم", per100g: true, macros100: { protein: 11, carbs: 3,  fat: 4,   calories: 98 } },
  
      // بقوليات مطبوخة
      lentils_cooked_100:         { label: "عدس مطبوخ", per100g: true, macros100: { protein: 9,  carbs: 20, fat: 0.4, calories: 116 } },
      fava_beans_cooked_100:      { label: "فول مطبوخ", per100g: true, macros100: { protein: 7.6, carbs: 19, fat: 0.6, calories: 110 } },
      chickpeas_cooked_100:       { label: "حمص مسلوق", per100g: true, macros100: { protein: 8.9, carbs: 27, fat: 2.6, calories: 164 } },
    },
  
    carbs: {
      // أرز/مكرونة/حبوب مطبوخة (لكل 100غ)
      rice_cooked_100:            { label: "رز أبيض مطبوخ", per100g: true, macros100: { protein: 2.7, carbs: 28, fat: 0.3, calories: 130 } },
      rice_basmati_cooked_100:    { label: "رز بسمتي مطبوخ", per100g: true, macros100: { protein: 2.9, carbs: 29, fat: 0.4, calories: 135 } },
      rice_brown_cooked_100:      { label: "رز بني مطبوخ", per100g: true, macros100: { protein: 2.6, carbs: 23, fat: 0.9, calories: 112 } },
      pasta_durum_cooked_100:     { label: "مكرونة قمح صلب مطبوخة", per100g: true, macros100: { protein: 3.9, carbs: 30, fat: 1.2, calories: 157 } },
      bulgur_cooked_100:          { label: "برغل مطبوخ", per100g: true, macros100: { protein: 3.1, carbs: 18.6, fat: 0.2, calories: 83 } },
      couscous_cooked_100:        { label: "كسكس مطبوخ", per100g: true, macros100: { protein: 3.8, carbs: 23,  fat: 0.2, calories: 112 } },
      quinoa_cooked_100:          { label: "كينوا مطبوخة", per100g: true, macros100: { protein: 4.4, carbs: 21.3, fat: 1.9, calories: 120 } },
  
      // مصادر كارب أخرى
      oats_dry_100:               { label: "شوفان جاف", per100g: true, macros100: { protein: 13, carbs: 66, fat: 7,   calories: 389 } },
      arabic_bread_whole_100:     { label: "خبز عربي/صاج أسمر", per100g: true, macros100: { protein: 8.5, carbs: 55, fat: 1.5, calories: 275 } },
      toast_whole_100:            { label: "توست أسمر", per100g: true, macros100: { protein: 9,  carbs: 49, fat: 3.2, calories: 265 } },
      potato_baked_100:           { label: "بطاطس مسلوقة/مخبوزة", per100g: true, macros100: { protein: 2,  carbs: 23, fat: 0.1, calories: 100 } },
      sweet_potato_baked_100:     { label: "بطاطا حلوة مشوية", per100g: true, macros100: { protein: 1.6, carbs: 20, fat: 0.1, calories: 90 } },
      corn_boiled_100:            { label: "ذرة مسلوقة", per100g: true, macros100: { protein: 3.4, carbs: 19, fat: 1.5, calories: 96 } },
      dates_100:                  { label: "تمر", per100g: true, macros100: { protein: 2,  carbs: 75, fat: 0.4, calories: 282 } },
      fruit_mixed_100:            { label: "فواكه (تفاح/موز/برتقال)", per100g: true, macros100: { protein: 0.6, carbs: 14, fat: 0.2, calories: 57 } },
  
      // تسمية عامة للخبز
      bread_100:                  { label: "خبز", per100g: true, macros100: { protein: 9, carbs: 49, fat: 3.2, calories: 265 } },
    },
  
    fats: {
      olive_oil_100:              { label: "زيت زيتون", per100g: true, macros100: { protein: 0, carbs: 0,  fat: 100, calories: 884 } },
      avocado_oil_100:            { label: "زيت أفوكادو", per100g: true, macros100: { protein: 0, carbs: 0,  fat: 100, calories: 884 } },
      coconut_oil_100:            { label: "زيت جوز الهند", per100g: true, macros100: { protein: 0, carbs: 0,  fat: 100, calories: 892 } },
  
      avocado_100:                { label: "أفوكادو", per100g: true, macros100: { protein: 2, carbs: 9,   fat: 15,  calories: 160 } },
      almonds_100:                { label: "لوز", per100g: true, macros100: { protein: 21, carbs: 22,  fat: 50,  calories: 579 } },
      walnuts_100:                { label: "جوز (عين الجمل)", per100g: true, macros100: { protein: 15, carbs: 14,  fat: 65,  calories: 654 } },
      cashews_100:                { label: "كاجو", per100g: true, macros100: { protein: 18, carbs: 30,  fat: 44,  calories: 553 } },
      peanut_butter_100:          { label: "زبدة فول سوداني", per100g: true, macros100: { protein: 25, carbs: 20,  fat: 50,  calories: 588 } },
      almond_butter_100:          { label: "زبدة لوز", per100g: true, macros100: { protein: 21, carbs: 19,  fat: 55,  calories: 614 } },
      tahini_100:                 { label: "طحينة", per100g: true, macros100: { protein: 17, carbs: 23,  fat: 53,  calories: 595 } },
  
      // موجود من قبل
      mixed_nuts_100:             { label: "مكسرات", per100g: true, macros100: { protein: 15, carbs: 21,  fat: 49,  calories: 607 } },
    },
  };
  
  // خرائط أسماء لمطابقة نصوص الخطة بأكبر قدر ممكن
  export const NAME_MAP = {
    // بيض
    "بيض": "egg_large",
    "بيضة": "egg_large",
    "بياض بيض": "egg_large",
  
    // دجاج/لحوم
    "صدور دجاج": "chicken_breast_100",
    "دجاج": "chicken_breast_100",
    "ورك دجاج": "chicken_thigh_skinless_100",
    "لحم بقري": "beef_lean_90_100",
    "لحم بقري مفروم قليل الدهن (90%)": "beef_lean_90_100",
    "لحم عجل": "veal_lean_100",
    "حاشي": "veal_lean_100",
    "لحم غنم قليل الدهن": "lamb_lean_100",
  
    // أسماك/روبيان
    "سمك أبيض": "white_fish_100",
    "سلمون": "salmon_100",
    "تونة": "tuna_100",
    "تونة مصفّاة": "tuna_100",
    "روبيان": "shrimp_100",
    "جمبري": "shrimp_100",
  
    // ألبان
    "لبنة": "labneh_lowfat_100",
    "لبنة قليلة الدسم": "labneh_lowfat_100",
    "زبادي يوناني": "greek_yogurt_fatfree_100",
    "زبادي يوناني خالي الدسم": "greek_yogurt_fatfree_100",
    "جبن قريش": "cottage_cheese_lowfat_100",
    "قريش": "cottage_cheese_lowfat_100",
  
    // بقوليات
    "عدس": "lentils_cooked_100",
    "عدس مطبوخ": "lentils_cooked_100",
    "فول": "fava_beans_cooked_100",
    "حمص": "chickpeas_cooked_100",
    "حمص مسلوق": "chickpeas_cooked_100",
  
    // كارب
    "رز أبيض مطبوخ": "rice_cooked_100",
    "أرز مطبوخ": "rice_cooked_100",
    "رز بسمتي مطبوخ": "rice_basmati_cooked_100",
    "رز بني مطبوخ": "rice_brown_cooked_100",
    "مكرونة قمح صلب مطبوخة": "pasta_durum_cooked_100",
    "برغل مطبوخ": "bulgur_cooked_100",
    "كسكس مطبوخ": "couscous_cooked_100",
    "كينوا مطبوخة": "quinoa_cooked_100",
    "شوفان": "oats_dry_100",
    "شوفان جاف": "oats_dry_100",
    "خبز": "bread_100",
    "خبز عربي": "arabic_bread_whole_100",
    "خبز عربي/صاج أسمر": "arabic_bread_whole_100",
    "توست أسمر": "toast_whole_100",
    "بطاطس": "potato_baked_100",
    "بطاطس مسلوقة/مخبوزة": "potato_baked_100",
    "بطاطا حلوة": "sweet_potato_baked_100",
    "بطاطا حلوة مشوية": "sweet_potato_baked_100",
    "ذرة مسلوقة": "corn_boiled_100",
    "تمر": "dates_100",
    "فواكه": "fruit_mixed_100",
  
    // دهون
    "زيت زيتون": "olive_oil_100",
    "زيت أفوكادو": "avocado_oil_100",
    "زيت جوز الهند": "coconut_oil_100",
    "أفوكادو": "avocado_100",
    "لوز": "almonds_100",
    "جوز": "walnuts_100",
    "عين الجمل": "walnuts_100",
    "كاجو": "cashews_100",
    "زبدة فول سوداني": "peanut_butter_100",
    "زبدة لوز": "almond_butter_100",
    "طحينة": "tahini_100",
    "مكسرات": "mixed_nuts_100",
  };