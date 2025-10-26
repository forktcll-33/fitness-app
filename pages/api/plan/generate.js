//pages/api/generate.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

/* =============== Helpers =============== */
const round = (n) => Math.max(0, Math.round(n));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function activityFactor(level) {
  return (
    {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    }[level] || 1.2
  );
}

function calcBMR({ weight, height, age, gender }) {
  const w = Number(weight);
  const h = Number(height);
  const a = Number(age);
  const male = gender === "male";
  return male ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
}

/* =============== Nutrition DB (per 100g unless noted) =============== */
// Protein (p g / 100g)
const PROTEINS = {
  eggWhole: { name: "بيض كامل", p: 13, note: "القيمة لكل 100غ (~2 بيضات)" },
  chicken: { name: "صدور دجاج", p: 31 },
  fish: { name: "سمك", p: 26 },
  beef: { name: "لحم", p: 25 },
  tuna: { name: "تونة", p: 28 },
  greekYogurt: { name: "زبادي يوناني", p: 10 },
};

// Carbs (c g / 100g)
const CARBS = {
  oats: { name: "شوفان", c: 60 },
  brownToast: { name: "توست أسمر", c: 40 },
  rice: { name: "رز مطبوخ", c: 28 },
  potato: { name: "بطاطس", c: 20 },
  strawberry: { name: "فراولة", c: 8 },
  watermelon: { name: "حبحب", c: 8 },
  banana: { name: "موز", c: 23 },
};

// Fat sources — بالجرام (f100 = غ دهون/100غ)
const FATS = {
  nuts: { name: "مكسرات", f100: 50 },
  pb: { name: "زبدة فول سوداني", f100: 50 },
  oliveOil: { name: "زيت زيتون", f100: 100 },
};

function gramsForProtein(targetP, proteinItem) {
  return round((targetP / proteinItem.p) * 100);
}
function gramsForCarb(targetC, carbItem) {
  return round((targetC / carbItem.c) * 100);
}
function gramsForFat(targetF, fatItem) {
  return round((targetF / fatItem.f100) * 100);
}

//* =============== Workout Links (Direct YouTube URLs) =============== */
/* تطابق حرفي مع buildWorkout — لا تغيّر غير هذا الكائن */
const YT = {
    // Push (Gym)
    bench:                 { name: "Bench Press",                   url: "https://youtube.com/shorts/vENMjPI-piM?si=H7NrNcHK8Ln2IOj8" },
    inclineDb:             { name: "Incline DB Press",              url: "https://youtube.com/shorts/8fXfwG4ftaQ?si=enytE4sWtNsIlqBh" },
    chestFly:              { name: "Chest Fly",                      url: "https://youtube.com/shorts/rk8YayRoTRQ?si=KpSZuezANIHFJ-er" },
    overhead:              { name: "Overhead Press",                 url: "https://youtube.com/shorts/k6tzKisR3NY?si=kfQbMHdDke6K5z85" },
    lateralRaise:          { name: "Lateral Raise",                  url: "https://youtube.com/shorts/Kl3LEzQ5Zqs?si=LVNYMgzB6ffqTyL1" },
    tricepsExt:            { name: "Triceps Extension",              url: "https://youtube.com/shorts/b_r_LW4HEcM?si=sTnFUTuV1GYj2Tlk" },
    cablePressdown:        { name: "Cable Pressdown",                url: "https://youtube.com/shorts/1FjkhpZsaxc?si=Pl-6011Emo_c-ABl" },
    
    // Pull (Gym)
    barbellRow:            { name: "Barbell Row",                    url: "https://youtube.com/shorts/phVtqawIgbk?si=W74X4ObpNn0Afd1F" },
    latPulldown:           { name: "Lat Pulldown",                   url: "https://youtube.com/shorts/bNmvKpJSWKM?si=wTQMZpQCba5bKb_B" },
    seatedCableRow:        { name: "Seated Cable Row",               url: "https://youtube.com/shorts/qD1WZ5pSuvk?si=0YZMlcSgdr3GALXZ" },
    ezBarCurl:             { name: "EZ-Bar Curl",                    url: "https://youtube.com/shorts/54x2WF1_Suc?si=4wcY2C-kkkVUrc_z" },
    inclineDbCurl:         { name: "Incline DB Curl",                url: "https://youtube.com/shorts/fXFN8_1Bh6k?si=9bmo0QQkeXgHJ9QM" },
    rearDeltFly:           { name: "Rear Delt Fly",                  url: "https://youtube.com/shorts/LsT-bR_zxLo?si=n140duj-e2T6_fLc" },
    facePull:              { name: "Face Pull",                      url: "https://youtube.com/shorts/IeOqdw9WI90?si=U5tDPE-KbJNS2I9J" },
    
  
    // Legs (Gym)
    backSquat:             { name: "Back Squat",                     url: "https://youtube.com/shorts/iKCJCydYYrE?si=VKNPstEgM8A98bGp" },
    frontSquat:            { name: "Front Squat",                    url: "https://youtube.com/shorts/_qv0m3tPd3s?si=zPWFr7KzD_-Ysrjk" },
    gobletSquat:           { name: "Goblet Squat",                   url: "https://youtube.com/shorts/lRYBbchqxtI?si=g_B5dVoGoWXJjEGk" },
    rdl:                   { name: "Romanian Deadlift",              url: "https://youtube.com/shorts/g5u75sgpn04?si=KRm_lwlMqQvzr3yR" },
    legPress:              { name: "Leg Press",                      url: "https://youtube.com/shorts/EotSw18oR9w?si=rrGYhxOoSuNkgMZL" },
    walkingLunges:         { name: "Walking Lunges",                 url: "https://youtu.be/tQNktxPkSeE?si=d1kpqN-qoKGncBoV" },
    standingCalfRaise:     { name: "Standing Calf Raise",            url: "https://youtube.com/shorts/haHcBAd637E?si=Oq6f1etETlGC7QX6" },
    seatedCalfRaise:       { name: "Seated Calf Raise",              url: "https://youtube.com/shorts/60XGTGOjdXA?si=N-gkasl7G9d2tdfo" },
    legExtension:          { name: "Leg Extension",                  url: "https://youtube.com/shorts/iQ92TuvBqRo?si=ACfzQvGMvsjA6Hy1" },
    legCurl:               { name: "Leg Curl",                       url: "https://youtube.com/shorts/lGNeJsdqJwg?si=ngCnoQJ08Tcg1uUE" },
    hipThrustGym:          { name: "Hip Thrust",                     url: "https://youtube.com/shorts/-Be-IO1C2JQ?si=CzeLYu05470oEejq" },
  
    // Upper (Gym)
    flatDbPress:           { name: "Flat DB Press",                  url: "https://youtube.com/shorts/WbCEvFA0NJs?si=KE4LdSZXxmSyO4Vn" },
    chestSupportedRow:     { name: "Chest-Supported Row",            url: "https://youtube.com/shorts/WkFX6_GxAs8?si=CA2TnM7hAOmnXzN_" },
    dbCurl:                { name: "DB Curl",                        url: "https://youtube.com/shorts/MKWBV29S6c0?si=cGeH3vN3VETkezV0" },
  
    // Home (Push/Pull/Upper)
    pushUp:                { name: "Push-Up",                        url: "https://youtube.com/shorts/4Bc1tPaYkOo?si=_X4wGdB55qNCnuPy" },
    inclinePushUp:         { name: "Incline Push-Up",                url: "https://youtube.com/shorts/KbzJKobVQaM?si=OBxrlZvfet0cBOyH" },
    kneePushUp:            { name: "Knee Push-Up",                   url: "https://youtube.com/shorts/rrVwNeIpy-k?si=DXdHuUqWfep6itqU" },
    chairDips:             { name: "Chair Dips",                     url: "https://youtube.com/shorts/4ua3MzaU0QU?si=7B0lG_8xmzY4nxS_" },
    pikePushUp:            { name: "Pike Push-Up",                   url: "https://youtube.com/shorts/eG20L9cl81w?si=ocihjDJNQ0PT2aox" },
    bandRow:               { name: "Band Row",                       url: "https://youtube.com/shorts/DWl-WW3ScEM?si=OlYKtp6IJ-f-nd0A" },
    invertedRow:           { name: "Inverted Row",                   url: "https://youtube.com/shorts/doy6jGYHx2k?si=23XLz0ygcWInzZgI" },
    pulldownBand:          { name: "Pulldown (مطاط)",                url: "https://youtu.be/_97pmOC2tzE?si=jJub3r9R83gR88Af" },
    curlBand:              { name: "Curl (مطاط)",                    url: "https://youtube.com/shorts/20xtfGZ37nw?si=sXDs4e1SNcvpwij-" },
    
    hammerCurl:            { name: "Hammer Curl",                    url: "https://youtube.com/shorts/20xtfGZ37nw?si=C57n3Y2WhgJOubPk" },
    lateralRaiseBand:      { name: "Lateral Raise (مطاط)",           url: "https://youtube.com/shorts/YuOhl4-Ppq4?si=XJX6jA8Pw23UCgWp" },
    
    tricepsExtBand:        { name: "Triceps Extension (مطاط)",       url: "https://youtube.com/shorts/0Oy0sLgEx4c?si=JNMUWlhfXFf4SnlB" },
    tricepsExtBandShort:   { name: "Triceps Ext (مطاط)",             url: "https://youtube.com/shorts/GHEIbsVKvR8?si=_qL3m2n8UKkYGIXt" },
    facePullBand:          { name: "Face Pull (مطاط)",               url: "https://youtube.com/shorts/aPiYMB9YFLI?si=g5_koxheZQO0IiML" },
  
    // Home (Legs)
    squatHome:             { name: "Squat",                          url: "https://youtube.com/shorts/-5LhNSMBrEs?si=Yt8T8Q3D7QNkge4I" },
    hipHingeBandDb:        { name: "Hip Hinge (مطاط/دمبل)",          url: "https://youtube.com/shorts/rGPFleutSTQ?si=1n_3z8Qjjp_oq4Pu" },
    reverseLunge:          { name: "Reverse Lunge",                  url: "https://youtube.com/shorts/b_2qgdXT_QQ?si=hiDrc0Vw5bKNqTQn" },
    gluteBridge:           { name: "Glute Bridge",                   url: "https://www.youtube.com/watch?v=m2Zx-57cSok" },
    calfRaiseHome:         { name: "Calf Raise",                     url: "https://youtube.com/shorts/MOSLpqQoqZs?si=V9nBuJN-k1efntFF" },
    bulgarianSplitSquat:   { name: "Bulgarian Split Squat",          url: "https://youtube.com/shorts/or1frhkjBDc?si=divT99FOrpPBtDPD" },
    
    stepUps:               { name: "Step-Ups",                       url: "https://youtube.com/shorts/3LrzsE3clIs?si=JUe0A7cmxKHg1ZEJ" },
    legCurlSlider:         { name: "Leg Curl (منزلق/منشفة)",         url: "https://youtube.com/shorts/xGikxedQERc?si=eh6hNIakq55FRvop" },
  
    // General
    plank:                 { name: "Plank",                          url: "https://youtube.com/shorts/xe2MXatLTUw?si=VypVzEitqJa_8Nyq" },
    hiit:                  { name: "HIIT 20–25 min",                 url: "https://www.youtube.com/watch?v=ml6cT4AZdqI" },
  };
/* =============== Core Macros Calc =============== */
function calcMacros({ weight, height, age, gender, activityLevel, goal }) {
  const bmr = calcBMR({ weight, height, age, gender });
  const tdee = bmr * activityFactor(activityLevel);
  let calories = tdee;
  if (goal === "lose") calories -= 500;
  if (goal === "gain") calories += 300;
  calories = round(calories);

  const w = Number(weight);
  const proteinPerKg = goal === "lose" ? 2.0 : goal === "gain" ? 1.8 : 1.6;
  const protein = round(w * proteinPerKg);

  const fatByKg = w * 0.8;
  const fatByCals = (calories * 0.25) / 9;
  const fat = round(Math.max(fatByKg, fatByCals));

  let carbs = round((calories - (protein * 4 + fat * 9)) / 4);
  if (carbs < 0) carbs = 0;

  return { calories, protein, fat, carbs };
}

/* =============== Meals Builder (4 Meals, 2 options each) =============== */
function fruitForGoal(goal) {
  return goal === "gain" ? CARBS.banana : Math.random() < 0.5 ? CARBS.strawberry : CARBS.watermelon;
}

function buildMeals({ calories, protein, fat, carbs }, goal) {
  const dist = { breakfast: 0.25, lunch: 0.30, dinner: 0.25, meal4: 0.20 };

  function mealWithTwoOptions({ title, targetP, targetC, targetF, optA, optB }) {
    const pA = gramsForProtein(targetP, optA.protein);
    const cA = gramsForCarb(targetC, optA.carb);
    const fA = gramsForFat(targetF, optA.fat);
    const pB = gramsForProtein(targetP, optB.protein);
    const cB = gramsForCarb(targetC, optB.carb);
    const fB = gramsForFat(targetF, optB.fat);
    return {
      title,
      options: [
        { protein: { name: optA.protein.name, grams: pA }, carb: { name: optA.carb.name, grams: cA }, fat: { name: optA.fat.name, grams: fA } },
        { protein: { name: optB.protein.name, grams: pB }, carb: { name: optB.carb.name, grams: cB }, fat: { name: optB.fat.name, grams: fB } },
      ],
    };
  }

  const meals = {};
  // 1) الإفطار
  {
    const share = dist.breakfast, P = round(protein * share), C = round(carbs * share), F = round(fat * share);
    meals.breakfast = mealWithTwoOptions({
      title: "الإفطار",
      targetP: P, targetC: C, targetF: F,
      optA: { protein: PROTEINS.eggWhole, carb: CARBS.oats,       fat: FATS.nuts },
      optB: { protein: PROTEINS.eggWhole, carb: CARBS.brownToast, fat: FATS.pb   },
    });
  }
  // 2) الغداء
  {
    const share = dist.lunch, P = round(protein * share), C = round(carbs * share), F = round(fat * share);
    meals.lunch = mealWithTwoOptions({
      title: "الغداء",
      targetP: P, targetC: C, targetF: F,
      optA: { protein: PROTEINS.chicken, carb: CARBS.rice,   fat: FATS.oliveOil },
      optB: { protein: PROTEINS.fish,    carb: CARBS.potato, fat: FATS.oliveOil },
    });
  }
  // 3) العشاء
  {
    const share = dist.dinner, P = round(protein * share), C = round(carbs * share), F = round(fat * share);
    meals.dinner = mealWithTwoOptions({
      title: "العشاء",
      targetP: P, targetC: C, targetF: F,
      optA: { protein: PROTEINS.beef, carb: CARBS.rice,   fat: FATS.oliveOil },
      optB: { protein: PROTEINS.tuna, carb: CARBS.potato, fat: FATS.oliveOil },
    });
  }
  // 4) وجبة 4
  {
    const share = dist.meal4, P = round(protein * share), C = round(carbs * share), F = clamp(round(fat * share), 5, 20);
    const fruit = fruitForGoal(goal);
    meals.meal4 = mealWithTwoOptions({
      title: "وجبة 4",
      targetP: P, targetC: C, targetF: F,
      optA: { protein: PROTEINS.eggWhole,    carb: fruit, fat: FATS.nuts },
      optB: { protein: PROTEINS.greekYogurt, carb: fruit, fat: FATS.nuts },
    });
  }
  return meals;
}

/* =============== Workout Builder (Push, Pull, Legs, Upper, Legs) =============== */
function buildWorkout({ gender, goal }) {
    const isFemale = gender !== "male";
    const postStrengthCardioMins = goal === "lose" ? 45 : goal === "gain" ? 15 : 25;
    const D = (name) => {
        // نحاول نلقى الرابط من كائن YT حسب الاسم
        const found = Object.values(YT).find((ex) => name.includes(ex.name));
        return { name, url: found ? found.url : "" };
      };
    // --- رجال
    const maleDays = [
      {
        day: "الأحد", title: "Push",
        gymExercises: [
          D("Bench Press — 4×8–10"),
          D("Incline DB Press — 3×8–12"),
          D("Chest Fly — 3×12–15"),
          D("Overhead Press — 3×6–10"),
          D("Lateral Raise — 3×12–15"),
          D("Triceps Extension — 3×10–12"),
          D("Cable Pressdown — 3×12–15"),
        ],
        homeExercises: [
          D("Push-Up — 4×AMRAP"),
          D("Incline Push-Up — 3×12–15"),
          D("Chair Dips — 3×8–12"),
          D("Pike Push-Up — 3×10–12"),
          D("Lateral Raise (مطاط/دمبل) — 3×15"),
          D("Triceps Extension (مطاط) — 3×12–15"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: postStrengthCardioMins },
      },
      {
        day: "الاثنين", title: "Pull",
        gymExercises: [
          D("Barbell Row — 4×6–10"),
          D("Lat Pulldown — 3×8–12"),
          D("Seated Cable Row — 3×10–12"),
          D("EZ-Bar Curl — 3×10–12"),
          D("Incline DB Curl — 3×10–12"),
          D("Rear Delt Fly / Face Pull — 3×12–15"),
        ],
        homeExercises: [
          D("Inverted Row — 4×10–12"),
          D("Band Row — 3×12–15"),
          D("Pulldown (مطاط) — 3×12–15"),
          D("Curl (مطاط/دمبل) — 3×10–12"),
          D("Hammer Curl — 3×10–12"),
          D("Face Pull (مطاط) — 3×15"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: postStrengthCardioMins },
      },
      {
        day: "الأربعاء", title: "Legs A",
        gymExercises: [
          D("Back Squat — 4×6–10"),
          D("Romanian Deadlift — 4×8–10"),
          D("Leg Press — 3×10–12"),
          D("Walking Lunges — 3×10–12/رجل"),
          D("Standing Calf Raise — 4×12–20"),
        ],
        homeExercises: [
          D("Squat — 4×12–15"),
          D("Hip Hinge (مطاط/دمبل) — 4×10–12"),
          D("Reverse Lunge — 3×10–12/رجل"),
          D("Glute Bridge — 4×12–15"),
          D("Calf Raise — 4×15–20"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: postStrengthCardioMins },
      },
      {
        day: "الخميس", title: "Upper",
        gymExercises: [
          D("Flat DB Press — 4×8–12"),
          D("Chest-Supported Row — 4×8–12"),
          D("Overhead Press — 3×8–12"),
          D("Lateral Raise — 3×12–15"),
          D("DB Curl — 3×10–12"),
          D("Rope Triceps Pressdown — 3×10–12"),
        ],
        homeExercises: [
          D("Push-Up — 3×AMRAP"),
          D("Band Row — 4×12–15"),
          D("Pike Push-Up — 3×10–12"),
          D("Lateral Raise (مطاط) — 3×15"),
          D("Curl (مطاط) — 3×10–12"),
          D("Triceps Extension (مطاط) — 3×10–12"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: postStrengthCardioMins },
      },
      {
        day: "الجمعة", title: "Legs B",
        gymExercises: [
          D("Front Squat — 4×6–10"),
          D("Romanian Deadlift — 4×8–10"),
          D("Hip Thrust — 4×10–12"),
          D("Leg Extension — 3×12–15"),
          D("Leg Curl — 3×12–15"),
          D("Seated Calf Raise — 4×15–20"),
        ],
        homeExercises: [
          D("Bulgarian Split Squat — 4×8–12/رجل"),
          D("Single-Leg RDL — 4×10/رجل"),
          D("Hip Thrust — 4×10–12"),
          D("Step-Ups — 3×10–12/رجل"),
          D("Leg Curl (منزلق/منشفة) — 3×12–15"),
          D("Calf Raise — 4×15–20"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: postStrengthCardioMins },
      },
    ];
  
    // --- إناث (تركيز سفلي، حجم علوي معتدل)
    const femaleDays = [
      {
        day: "الأحد", title: "Push (حجم معتدل)",
        gymExercises: [
          D("Incline DB Press — 3×8–12"),
          D("Chest Fly — 2×12–15"),
          D("Overhead Press — 2×8–12"),
          D("Lateral Raise — 3×12–20"),
          D("Triceps Rope Pressdown — 2×12–15"),
        ],
        homeExercises: [
          D("Knee Push-Up — 3×10–15"),
          D("Incline Push-Up — 2×12–15"),
          D("Pike Push-Up — 2×8–12"),
          D("Lateral Raise (مطاط) — 3×15–20"),
          D("Triceps Extension (مطاط) — 2×12–15"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: Math.max(20, postStrengthCardioMins - 10) },
      },
      {
        day: "الاثنين", title: "Pull + Rear Delt",
        gymExercises: [
          D("Lat Pulldown — 3×10–12"),
          D("Chest-Supported Row — 3×10–12"),
          D("Cable Row — 2×12–15"),
          D("Face Pull / Rear Delt Fly — 3×15"),
          D("DB Curl — 2×10–12"),
        ],
        homeExercises: [
          D("Band Row — 3×12–15"),
          D("Pulldown (مطاط) — 3×12–15"),
          D("Rear Delt Fly (مطاط) — 3×15"),
          D("Curl (مطاط) — 2×10–12"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: Math.max(20, postStrengthCardioMins - 10) },
      },
      {
        day: "الأربعاء", title: "Lower A (Glutes/Quads)",
        gymExercises: [
          D("Back Squat — 4×6–10"),
          D("Hip Thrust — 4×10–12"),
          D("Leg Press — 3×10–12"),
          D("Walking Lunges — 3×10–12/رجل"),
          D("Standing Calf Raise — 4×12–20"),
        ],
        homeExercises: [
          D("Squat — 4×12–15"),
          D("Hip Thrust — 4×12"),
          D("Reverse Lunge — 3×10–12/رجل"),
          D("Step-Ups — 3×10–12/رجل"),
          D("Calf Raise — 4×15–20"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: postStrengthCardioMins },
      },
      {
        day: "الخميس", title: "Upper (خفيف/توازُن)",
        gymExercises: [
          D("Flat DB Press — 3×8–12"),
          D("Chest-Supported Row — 3×8–12"),
          D("Lateral Raise — 3×12–20"),
          D("Face Pull — 2×15"),
          D("Triceps Pressdown — 2×12–15"),
        ],
        homeExercises: [
          D("Push-Up — 2×AMRAP"),
          D("Band Row — 3×12–15"),
          D("Lateral Raise (مطاط) — 3×15–20"),
          D("Face Pull (مطاط) — 2×15"),
          D("Triceps Ext (مطاط) — 2×12–15"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: Math.max(20, postStrengthCardioMins - 10) },
      },
      {
        day: "الجمعة", title: "Lower B (Glutes/Hams)",
        gymExercises: [
          D("Front Squat أو Goblet — 3×8–12"),
          D("Romanian Deadlift — 4×8–10"),
          D("Hip Thrust — 3×10–12"),
          D("Leg Curl — 3×12–15"),
          D("Seated Calf Raise — 4×15–20"),
        ],
        homeExercises: [
          D("Bulgarian Split Squat — 3×8–12/رجل"),
          D("Single-Leg RDL — 3×10/رجل"),
          D("Hip Thrust — 3×12"),
          D("Leg Curl (منزلق/منشفة) — 3×12–15"),
          D("Calf Raise — 4×15–20"),
        ],
        cardio: { type: "ثابت معتدل", durationMin: postStrengthCardioMins },
      },
    ];
  
    const base = isFemale ? femaleDays : maleDays;
    if (goal === "lose") {
      base.push({ day: "السبت", title: "HIIT", gymExercises: [D("HIIT 20–25 min")], homeExercises: [D("HIIT 20–25 min")], cardio: { type: "HIIT", durationMin: 20 } });
    } else {
      base.push({ day: "السبت", title: "راحة/تعافي", gymExercises: [], homeExercises: [] });
    }
  
    return { days: base };
  }
/* =============== Master Plan Builder =============== */
function buildPlan(user) {
  const { calories, protein, fat, carbs } = calcMacros(user);
  const meals = buildMeals({ calories, protein, fat, carbs }, user.goal);
  const workout = buildWorkout(user);
  return { calories, protein, fat, carbs, meals, workout };
}

/* =============== API Handler =============== */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const userPayload = getUserFromRequest(req);
  if (!userPayload) return res.status(401).json({ message: "غير مصرح" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userPayload.id) },
      select: {
        id: true,
        isSubscribed: true,
        weight: true,
        height: true,
        age: true,
        gender: true,
        activityLevel: true,
        goal: true,
      },
    });

    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    const required = [user.weight, user.height, user.age, user.gender, user.activityLevel, user.goal];
    if (required.some((v) => v == null || v === "")) {
      return res.status(400).json({ message: "أكمل بياناتك أولًا" });
    }

    const plan = buildPlan(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { plan }, // Json field
    });

    return res.status(200).json({ ok: true, plan });
  } catch (e) {
    console.error("plan.generate error:", e);
    return res.status(500).json({ message: "خطأ غير متوقع" });
  }
}