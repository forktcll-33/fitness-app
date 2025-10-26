// pages/smart-plan.js
import { useState } from "react";

export default function SmartPlan() {
  const [form, setForm] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "",
    activityLevel: "",
    goal: "",
  });
  const [calories, setCalories] = useState(null);
  const [loading, setLoading] = useState(false);

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const calc = (e) => {
    e.preventDefault();
    const w = parseFloat(form.weight);
    const h = parseFloat(form.height);
    const a = parseFloat(form.age);
    const g = form.gender;
    const lvl = form.activityLevel;
    const goal = form.goal;

    if (!w || !h || !a || !g || !lvl || !goal) {
      alert("املأ جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      // Mifflin–St Jeor
      let bmr =
        g === "male"
          ? 10 * w + 6.25 * h - 5 * a + 5
          : 10 * w + 6.25 * h - 5 * a - 161;

      let cal = bmr * (activityMultipliers[lvl] || 1.2);
      if (goal === "lose") cal -= 400;
      if (goal === "gain") cal += 400;

      setCalories(Math.round(cal));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-green-700 text-center mb-2">
            حاسبة السعرات الحرارية
          </h1>
          <p className="text-center text-gray-600 mb-8">
            أدخل بياناتك لمعرفة احتياجك اليومي من السعرات (لا يتم حفظ أي بيانات).
          </p>

          <form onSubmit={calc} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="number"
                name="weight"
                placeholder="الوزن (كجم)"
                value={form.weight}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="number"
                name="height"
                placeholder="الطول (سم)"
                value={form.height}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="number"
                name="age"
                placeholder="العمر"
                value={form.age}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              >
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>

              <select
                name="activityLevel"
                value={form.activityLevel}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              >
                <option value="">مستوى النشاط</option>
                <option value="sedentary">قليل جدًا</option>
                <option value="light">خفيف</option>
                <option value="moderate">متوسط</option>
                <option value="active">نشط</option>
                <option value="veryActive">عالي جدًا</option>
              </select>

              <select
                name="goal"
                value={form.goal}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              >
                <option value="">الهدف</option>
                <option value="lose">نزول وزن</option>
                <option value="maintain">الحفاظ على الوزن</option>
                <option value="gain">زيادة وزن</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition"
            >
              {loading ? "جارٍ الحساب..." : "احسب السعرات"}
            </button>
          </form>

          {calories !== null && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="text-lg text-gray-700">احتياجك اليومي التقريبي:</p>
              <p className="text-3xl font-extrabold text-green-700 mt-2">
                {calories} كالوري
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}