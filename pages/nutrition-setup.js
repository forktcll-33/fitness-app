// pages/nutrition-setup.js
import { useState } from "react";

export default function NutritionSetup() {
  const [form, setForm] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "male",
    activity: "light",
    goal: "lose",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ التحقق من أن الحقول المطلوبة معبأة
    if (!form.weight || !form.height || !form.age) {
      alert("يرجى تعبئة جميع الحقول المطلوبة ❌");
      return;
    }

    console.log("Nutrition Data:", form);
    alert("تم حفظ بياناتك ✅");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      dir="rtl"
    >
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-6">
          إعداد الخطة الغذائية
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          {/* الوزن */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              الوزن (كجم) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="weight"
              placeholder="أدخل وزنك"
              value={form.weight}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-gray-800 text-right"
              required
            />
          </div>

          {/* الطول */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              الطول (سم) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="height"
              placeholder="أدخل طولك"
              value={form.height}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-gray-800 text-right"
              required
            />
          </div>

          {/* العمر */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              العمر <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="age"
              placeholder="أدخل عمرك"
              value={form.age}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-gray-800 text-right"
              required
            />
          </div>

          {/* الجنس */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              الجنس
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-gray-800 text-right"
            >
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>

          {/* النشاط */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              مستوى النشاط
            </label>
            <select
              name="activity"
              value={form.activity}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-gray-800 text-right"
            >
              <option value="light">نشاط خفيف</option>
              <option value="moderate">نشاط متوسط</option>
              <option value="high">نشاط عالي</option>
            </select>
          </div>

          {/* الهدف */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              الهدف
            </label>
            <select
              name="goal"
              value={form.goal}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-gray-800 text-right"
            >
              <option value="lose">خسارة وزن</option>
              <option value="maintain">الحفاظ على الوزن</option>
              <option value="gain">زيادة الوزن</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
          >
            حفظ
          </button>
        </form>
      </div>
    </div>
  );
}