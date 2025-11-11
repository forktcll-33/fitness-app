// data/food-db.js
export const FOOD_DB = {
    protein: {
      egg_large: { label: "بيض", unit: "piece", gramsPerUnit: 60, macrosPerUnit: { protein: 6, carbs: 0.4, fat: 5, calories: 72 } },
      chicken_breast_100: { label: "صدور دجاج", per100g: true, macros100: { protein: 31, carbs: 0, fat: 3.6, calories: 165 } },
      lentils_cooked_100: { label: "عدس مطبوخ", per100g: true, macros100: { protein: 9, carbs: 20, fat: 0.4, calories: 116 } },
      tuna_100: { label: "تونة مصفّاة", per100g: true, macros100: { protein: 26, carbs: 0, fat: 1, calories: 120 } },
    },
    carbs: {
      oats_dry_100: { label: "شوفان", per100g: true, macros100: { protein: 13, carbs: 66, fat: 7, calories: 389 } },
      rice_cooked_100: { label: "أرز مطبوخ", per100g: true, macros100: { protein: 2.7, carbs: 28, fat: 0.3, calories: 130 } },
      bread_100: { label: "خبز", per100g: true, macros100: { protein: 9, carbs: 49, fat: 3.2, calories: 265 } },
    },
    fats: {
      mixed_nuts_100: { label: "مكسرات", per100g: true, macros100: { protein: 15, carbs: 21, fat: 49, calories: 607 } },
      olive_oil_100: { label: "زيت زيتون", per100g: true, macros100: { protein: 0, carbs: 0, fat: 100, calories: 884 } },
    },
  };
  
  // خرائط أسماء بسيطة (تقديرية) لمطابقة أسماء الخطة
  export const NAME_MAP = {
    "بيض": "egg_large",
    "بيضة": "egg_large",
    "بياض بيض": "egg_large", // تبسيط
    "صدور دجاج": "chicken_breast_100",
    "دجاج": "chicken_breast_100",
    "عدس": "lentils_cooked_100",
    "عدس مطبوخ": "lentils_cooked_100",
    "شوفان": "oats_dry_100",
    "أرز": "rice_cooked_100",
    "خبز": "bread_100",
    "مكسرات": "mixed_nuts_100",
    "زيت زيتون": "olive_oil_100",
  };