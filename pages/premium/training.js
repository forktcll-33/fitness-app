// pages/premium/training.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import {
  Dumbbell,
  Flame,
  HeartPulse,
  Timer,
  StretchHorizontal,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

// ========== SSR: السماح فقط لمشتركي Premium ==========
export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token)
    return { redirect: { destination: "/login", permanent: false } };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
      },
    });

    if (!user)
      return { redirect: { destination: "/login", permanent: false } };

    if ((user.subscriptionTier || "").toLowerCase() !== "premium") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    return {
      props: {
        userName: user.name || "FitLife Member",
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

/* ============================================
   بيانات برنامج التدريب الأسبوعي — Pro
   ============================================ */
const weeklyTraining = [
  {
    key: "sat",
    dayName: "السبت",
    label: "Full Body Power",
    focus: "قوة شاملة للجسم + تفعيل العضلات الرئيسية",
    intensity: "متوسط – عالي",
    icon: "power",
    blocks: [
      {
        title: "إحماء (10 دقائق)",
        type: "warmup",
        exercises: [
          {
            name: "مشي سريع / نط حبل",
            detail: "5–7 دقائق",
            type: "Cardio",
            youtube: "https://www.youtube.com/results?search_query=jump+rope+warm+up",
          },
          {
            name: "Mobility للورك والكتف",
            detail: "3–5 دقائق",
            type: "Mobility",
            youtube: "https://www.youtube.com/results?search_query=hip+shoulder+mobility+routine",
          },
        ],
      },
      {
        title: "التمرين الرئيسي",
        type: "main",
        exercises: [
          {
            name: "Squat (سكوات وزن الجسم أو دمبل)",
            sets: "3",
            reps: "10–12",
            rest: "60–90 ثانية",
            type: "Strength",
            youtube: "https://www.youtube.com/results?search_query=bodyweight+squat+proper+form",
          },
          {
            name: "Push Up (ضغط أرضي)",
            sets: "3",
            reps: "8–12",
            rest: "60 ثانية",
            type: "Strength",
            youtube: "https://www.youtube.com/results?search_query=push+up+proper+form",
          },
          {
            name: "Hip Hinge / Romanian Deadlift بالدمبل",
            sets: "3",
            reps: "10–12",
            rest: "60–90 ثانية",
            type: "Strength",
            youtube: "https://www.youtube.com/results?search_query=dumbbell+romanian+deadlift",
          },
          {
            name: "Plank (بلانك)",
            sets: "3",
            reps: "30–40 ثانية",
            rest: "45–60 ثانية",
            type: "Core",
            youtube: "https://www.youtube.com/results?search_query=plank+exercise+proper+form",
          },
        ],
      },
      {
        title: "إنهاء سريعة (Finisher)",
        type: "finisher",
        exercises: [
          {
            name: "Farmer Walk (حمل دمبل والمشي)",
            detail: "3 جولات × 30–40 متر",
            type: "Conditioning",
            youtube: "https://www.youtube.com/results?search_query=farmer+walk+exercise",
          },
        ],
      },
    ],
  },
  {
    key: "sun",
    dayName: "الأحد",
    label: "Upper Body Strength",
    focus: "تقوية الصدر، الظهر، الكتف، والذراعين",
    intensity: "متوسط",
    icon: "upper",
    blocks: [
      {
        title: "إحماء علوي (5–8 دقائق)",
        type: "warmup",
        exercises: [
          {
            name: "Arm Circles + Shoulder Taps",
            detail: "2 جولات × 30 ثانية لكل تمرين",
            type: "Warmup",
            youtube: "https://www.youtube.com/results?search_query=shoulder+warm+up+routine",
          },
        ],
      },
      {
        title: "التمرين الرئيسي",
        type: "main",
        exercises: [
          {
            name: "Incline Push Up / Bench Press (حسب المتوفر)",
            sets: "3–4",
            reps: "8–12",
            rest: "60–90 ثانية",
            type: "Chest",
            youtube: "https://www.youtube.com/results?search_query=incline+push+up",
          },
          {
            name: "One Arm Row (دمبل / مطاط)",
            sets: "3",
            reps: "10–12 لكل ذراع",
            rest: "60 ثانية",
            type: "Back",
            youtube: "https://www.youtube.com/results?search_query=dumbbell+row",
          },
          {
            name: "Shoulder Press (ضغط كتف)",
            sets: "3",
            reps: "10–12",
            rest: "60–90 ثانية",
            type: "Shoulders",
            youtube: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press",
          },
          {
            name: "Biceps Curl + Triceps Extension",
            sets: "3",
            reps: "12–15",
            rest: "45–60 ثانية",
            type: "Arms",
            youtube: "https://www.youtube.com/results?search_query=dumbbell+biceps+curl",
          },
        ],
      },
    ],
  },
  {
    key: "mon",
    dayName: "الاثنين",
    label: "Cardio Day",
    focus: "تحسين اللياقة القلبية والتنفسية",
    intensity: "متوسط",
    icon: "cardio",
    blocks: [
      {
        title: "كارديو أساسي",
        type: "cardio",
        exercises: [
          {
            name: "مشي سريع / ركض خفيف / دراجة",
            detail: "25–35 دقيقة – Zone 2–3",
            type: "Cardio",
            youtube: "https://www.youtube.com/results?search_query=zone+2+cardio+explained",
          },
          {
            name: "Cool Down + إطالة",
            detail: "5–10 دقائق",
            type: "Mobility",
            youtube: "https://www.youtube.com/results?search_query=full+body+stretch+routine",
          },
        ],
      },
    ],
  },
  {
    key: "tue",
    dayName: "الثلاثاء",
    label: "HIIT + Core",
    focus: "رفع الـ VO2Max + حرق عالي للسعرات",
    intensity: "عالي",
    icon: "hiit",
    blocks: [
      {
        title: "بروتوكول HIIT (20 دقيقة تقريبًا)",
        type: "hiit",
        exercises: [
          {
            name: "20 ثانية Sprint / 40 ثانية مشي",
            detail: "8–10 جولات (جري أو دراجة)",
            type: "HIIT",
            youtube: "https://www.youtube.com/results?search_query=hiit+workout+beginner",
          },
        ],
      },
      {
        title: "تمارين كور",
        type: "core",
        exercises: [
          {
            name: "Mountain Climbers",
            sets: "3",
            reps: "30–40 ثانية",
            rest: "45 ثانية",
            type: "Core",
            youtube: "https://www.youtube.com/results?search_query=mountain+climbers+proper+form",
          },
          {
            name: "Dead Bug / Hollow Hold",
            sets: "3",
            reps: "20 عدّة أو 20–30 ثانية",
            rest: "45 ثانية",
            type: "Core",
            youtube: "https://www.youtube.com/results?search_query=dead+bug+exercise",
          },
        ],
      },
    ],
  },
  {
    key: "wed",
    dayName: "الأربعاء",
    label: "Lower Body Strength",
    focus: "تقوية الرجلين + Glutes + Hamstrings",
    intensity: "متوسط – عالي",
    icon: "lower",
    blocks: [
      {
        title: "تمرين الرجلين",
        type: "main",
        exercises: [
          {
            name: "Goblet Squat / Back Squat",
            sets: "3–4",
            reps: "8–10",
            rest: "90 ثانية",
            type: "Strength",
            youtube: "https://www.youtube.com/results?search_query=goblet+squat",
          },
          {
            name: "Lunges (اندفاع أمامي)",
            sets: "3",
            reps: "10–12 لكل رجل",
            rest: "60–90 ثانية",
            type: "Strength",
            youtube: "https://www.youtube.com/results?search_query=walking+lunge",
          },
          {
            name: "Glute Bridge / Hip Thrust",
            sets: "3",
            reps: "12–15",
            rest: "60 ثانية",
            type: "Glutes",
            youtube: "https://www.youtube.com/results?search_query=glute+bridge",
          },
          {
            name: "Calf Raise (ساق)",
            sets: "3",
            reps: "15–20",
            rest: "45–60 ثانية",
            type: "Calves",
            youtube: "https://www.youtube.com/results?search_query=standing+calf+raise",
          },
        ],
      },
    ],
  },
  {
    key: "thu",
    dayName: "الخميس",
    label: "Core + Mobility",
    focus: "ثبات الجذع + مرونة المفاصل",
    intensity: "خفيف – متوسط",
    icon: "core",
    blocks: [
      {
        title: "Core Focus",
        type: "core",
        exercises: [
          {
            name: "Side Plank",
            sets: "3",
            reps: "20–30 ثانية لكل جانب",
            rest: "45 ثانية",
            type: "Core",
            youtube: "https://www.youtube.com/results?search_query=side+plank",
          },
          {
            name: "Russian Twist (بدون وزن أو بوزن خفيف)",
            sets: "3",
            reps: "16–20 عدّة",
            rest: "45–60 ثانية",
            type: "Core",
            youtube: "https://www.youtube.com/results?search_query=russian+twist",
          },
        ],
      },
      {
        title: "Mobility Session",
        type: "mobility",
        exercises: [
          {
            name: "إطالة للورك + أسفل الظهر + الكتف",
            detail: "10–15 دقيقة",
            type: "Mobility",
            youtube: "https://www.youtube.com/results?search_query=full+body+mobility+routine",
          },
        ],
      },
    ],
  },
  {
    key: "fri",
    dayName: "الجمعة",
    label: "Active Recovery",
    focus: "تعافي نشط + راحة للجسم والعقل",
    intensity: "خفيف",
    icon: "recovery",
    blocks: [
      {
        title: "نشاط خفيف",
        type: "recovery",
        exercises: [
          {
            name: "مشي خفيف / تمشية خارجية",
            detail: "20–40 دقيقة",
            type: "Recovery",
            youtube: "https://www.youtube.com/results?search_query=how+to+walk+for+recovery",
          },
          {
            name: "جلسة استطالة خفيفة",
            detail: "10–15 دقيقة",
            type: "Stretch",
            youtube: "https://www.youtube.com/results?search_query=full+body+stretch+beginner",
          },
        ],
      },
    ],
  },
];

/* ============================================
   صفحة Training Premium (Hybrid)
   ============================================ */
export default function PremiumTraining({ userName }) {
  const [activeDayKey, setActiveDayKey] = useState("sat");

  const activeDay =
    weeklyTraining.find((d) => d.key === activeDayKey) || weeklyTraining[0];

  const getIcon = (icon) => {
    switch (icon) {
      case "power":
        return <Dumbbell className="w-5 h-5 text-yellow-400" />;
      case "upper":
        return <Flame className="w-5 h-5 text-red-400" />;
      case "cardio":
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case "hiit":
        return <Timer className="w-5 h-5 text-orange-400" />;
      case "lower":
        return <Dumbbell className="w-5 h-5 text-emerald-400" />;
      case "core":
        return <StretchHorizontal className="w-5 h-5 text-sky-400" />;
      case "recovery":
        return <Sparkles className="w-5 h-5 text-indigo-300" />;
      default:
        return <Dumbbell className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* HERO */}
        <header className="rounded-3xl bg-gradient-to-l from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/40 p-6 lg:p-8 shadow-xl shadow-emerald-500/10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Dumbbell className="w-9 h-9 text-emerald-300" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                    FITLIFE ELITE TRAINING
                  </p>
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
                    خطة تدريب Premium — أسبوع كامل
                  </h1>
                </div>
              </div>
              <p className="text-sm text-gray-200 max-w-xl">
                يا {userName} ✨  
                هذا برنامج تدريبي متكامل لأسبوع كامل: قوة، كارديو، HIIT،
                كور، وتعافي — مصمم ليخدم هدفك مع اشتراك Premium.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs w-full lg:w-auto">
              <div className="rounded-2xl bg-black/40 border border-emerald-400/50 px-4 py-3">
                <div className="text-[10px] text-gray-400 mb-1">
                  عدد أيام التدريب
                </div>
                <div className="text-lg font-bold text-emerald-200">
                  6 أيام
                </div>
              </div>
              <div className="rounded-2xl bg-black/40 border border-emerald-400/50 px-4 py-3">
                <div className="text-[10px] text-gray-400 mb-1">
                  نمط الأسبوع
                </div>
                <div className="text-xs font-semibold text-gray-100">
                  Strength • Cardio • HIIT • Recovery
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* شريط الأيام (Hybrid Slider) */}
        <section className="bg-[#020617] border border-emerald-500/30 rounded-2xl p-4 shadow-lg shadow-emerald-500/10 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-300" />
              <h2 className="text-sm font-semibold text-white">
                اختر اليوم لعرض تفاصيل التمرين
              </h2>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              إسحب لليمين / اليسار على الجوال أو اضغط على اليوم مباشرة.
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
            {weeklyTraining.map((day) => {
              const active = day.key === activeDayKey;
              return (
                <button
                  key={day.key}
                  onClick={() => setActiveDayKey(day.key)}
                  className={
                    "snap-center min-w-[110px] rounded-2xl px-3 py-2 text-right border transition-all " +
                    (active
                      ? "bg-emerald-500 text-black border-emerald-300 shadow-md"
                      : "bg-black/40 text-gray-100 border-gray-700 hover:border-emerald-300/70")
                  }
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold">{day.dayName}</span>
                    <span>{getIcon(day.icon)}</span>
                  </div>
                  <p
                    className={
                      "text-[10px] leading-snug " +
                      (active ? "text-black/80" : "text-gray-400")
                    }
                  >
                    {day.label}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* تفاصيل اليوم المختار */}
        <section className="grid lg:grid-cols-3 gap-6">
          {/* تفاصيل التمرين (الكبير) */}
          <div className="lg:col-span-2 bg-[#020617] border border-emerald-500/30 rounded-2xl p-5 shadow-lg shadow-emerald-500/10 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {activeDay.dayName} — {activeDay.label}
                </h2>
                <p className="text-xs text-emerald-200 mb-1">
                  التركيز: {activeDay.focus}
                </p>
                <p className="text-[11px] text-gray-400">
                  الشدة: {activeDay.intensity}
                </p>
              </div>
              <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-black/50 border border-emerald-400/50">
                {getIcon(activeDay.icon)}
              </div>
            </div>

            {activeDay.blocks.map((block, idx) => (
              <div
                key={idx}
                className="mt-3 rounded-2xl border border-gray-800 bg-black/40 p-4 space-y-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-gray-100">
                    {block.title}
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {block.type === "warmup" && "إحماء"}
                    {block.type === "main" && "تمرين رئيسي"}
                    {block.type === "hiit" && "HIIT"}
                    {block.type === "cardio" && "كارديو"}
                    {block.type === "core" && "كور"}
                    {block.type === "mobility" && "Mobility"}
                    {block.type === "recovery" && "تعافي"}
                    {block.type === "finisher" && "Finisher"}
                  </span>
                </div>

                <div className="space-y-2">
                  {block.exercises.map((ex, i2) => (
                    <div
                      key={i2}
                      className="rounded-xl border border-gray-700 bg-[#020617] px-3 py-2 text-[11px] flex flex-col gap-1"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-gray-100">
                          {ex.name}
                        </span>
                        {ex.type && (
                          <span className="px-2 py-[1px] rounded-full text-[10px] bg-emerald-500/10 border border-emerald-400/40 text-emerald-200">
                            {ex.type}
                          </span>
                        )}
                      </div>

                      {(ex.sets || ex.reps || ex.rest) && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-300">
                          {ex.sets && <span>المجموعات: {ex.sets}</span>}
                          {ex.reps && <span>التكرارات: {ex.reps}</span>}
                          {ex.rest && <span>الراحة: {ex.rest}</span>}
                        </div>
                      )}

                      {ex.detail && (
                        <div className="text-gray-400">{ex.detail}</div>
                      )}

                      {ex.youtube && (
                        <a
                          href={ex.youtube}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-300 hover:text-emerald-200 underline mt-1 self-start"
                        >
                          مشاهدة شرح التمرين على يوتيوب
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* بطاقة ملخص / Tips */}
          <aside className="space-y-4">
            <div className="bg-[#020617] border border-emerald-500/30 rounded-2xl p-4 shadow-md shadow-emerald-500/10">
              <h3 className="text-sm font-bold text-white mb-2">
                كيف تستخدم خطة التدريب؟
              </h3>
              <ul className="text-[11px] text-gray-300 space-y-1.5">
                <li>• اختر اليوم من الشريط العلوي.</li>
                <li>• نفّذ الإحماء أولاً قبل التمرين الرئيسي.</li>
                <li>• التزم بالمجموعات والتكرارات المذكورة قدر الإمكان.</li>
                <li>• استخدم روابط يوتيوب للتأكد من الأداء الصحيح.</li>
                <li>• عدّل الشدة حسب مستواك (خفّف أو زد الوزن).</li>
              </ul>
            </div>

            <div className="bg-[#020617] border border-emerald-500/30 rounded-2xl p-4 shadow-md shadow-emerald-500/10">
              <h3 className="text-sm font-bold text-white mb-2">
                ملاحظات مهمة
              </h3>
              <ul className="text-[11px] text-gray-300 space-y-1.5">
                <li>• إذا شعرت بألم غير طبيعي، أوقف التمرين فورًا.</li>
                <li>• احرص على شرب الماء أثناء التمرين.</li>
                <li>• حاول الربط بين هذه الخطة وخطتك الغذائية في FitLife.</li>
                <li>• يمكنك تدوين تقدمك يوميًا (أوزان، شعور، طاقة).</li>
              </ul>
            </div>

            <div className="bg-[#020617] border border-emerald-500/30 rounded-2xl p-4 shadow-md shadow-emerald-500/10">
              <h3 className="text-sm font-bold text-white mb-2">
                تريد تطوير الخطة لاحقًا؟
              </h3>
              <p className="text-[11px] text-gray-300">
                لاحقًا نقدر نربط هذه الصفحة مع:
                <br />
                • تتبع أوزان التمارين  
                • عداد RPE (درجة الجهد)  
                • حفظ تاريخ كل جلسة في قاعدة البيانات.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}