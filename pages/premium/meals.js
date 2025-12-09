// pages/premium/meals.js
import { useState, useEffect } from "react";
import { RefreshCcw, Flame, Utensils } from "lucide-react";
import axios from "axios";

export default function Meals() {
  const [mealCount, setMealCount] = useState(3);
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMealIndex, setSelectedMealIndex] = useState(null);

  const generateDay = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/premium/generate-meals", { mealCount });
      if (res.data.ok) {
        setMeals(res.data.meals);
        setSummary(res.data.summary);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAlternativeClick = async (slot, currentKey, mealIndex) => {
    try {
      const res = await axios.get(`/api/premium/generate-meals?slot=${slot}&currentKey=${currentKey}`);
      if (res.data.ok) {
        setAlternatives(res.data.foods);
        setSelectedSlot(slot);
        setSelectedMealIndex(mealIndex);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const applyAlternative = (food) => {
    const meal = meals[selectedMealIndex];
    const item = meal.items.find((i) => i.slot === selectedSlot);

    const oldProtein = item.protein;
    const oldCarbs = item.carbs;
    const oldFat = item.fat;

    let target = selectedSlot === "protein" ? oldProtein : selectedSlot === "carb" ? oldCarbs : oldFat;
    const perUnit = selectedSlot === "protein" ? food.protein : selectedSlot === "carb" ? food.carbs : food.fat;
    let amount = perUnit === 0 ? 0 : target / perUnit;

    if (["حبة", "شريحة", "سكوب"].includes(food.unit)) {
      amount = Math.max(1, Math.round(amount));
    } else {
      amount = Math.max(10, Math.round((amount * food.baseAmount) / 5) * 5);
      amount = amount / food.baseAmount;
    }

    const updatedItems = meal.items.map((i) =>
      i.slot === selectedSlot
        ? {
            ...i,
            foodKey: food.key,
            name: food.name,
            unit: food.unit,
            baseAmount: food.baseAmount,
            factor: amount,
            protein: Math.round(food.protein * amount),
            carbs: Math.round(food.carbs * amount),
            fat: Math.round(food.fat * amount),
            amountText:
              ["حبة", "شريحة", "سكوب"].includes(food.unit)
                ? `${Math.round(amount)} ${food.unit}`
                : `${Math.round(amount * food.baseAmount)} ${food.unit}`,
          }
        : i
    );

    const newProtein = updatedItems.reduce((a, x) => a + x.protein, 0);
    const newCarbs = updatedItems.reduce((a, x) => a + x.carbs, 0);
    const newFat = updatedItems.reduce((a, x) => a + x.fat, 0);
    const newKcals = newProtein * 4 + newCarbs * 4 + newFat * 9;

    const updatedMeal = {
      ...meal,
      items: updatedItems,
      name: updatedItems.map((i) => i.name).join(" + "),
      amount: updatedItems.map((i) => i.amountText).join(" + "),
      protein: newProtein,
      carbs: newCarbs,
      fat: newFat,
      kcals: Math.round(newKcals),
    };

    const updatedMeals = [...meals];
    updatedMeals[selectedMealIndex] = updatedMeal;

    const newSummary = updatedMeals.reduce(
      (acc, m) => {
        acc.totalCalories += m.kcals;
        acc.totalProtein += m.protein;
        acc.totalCarbs += m.carbs;
        acc.totalFat += m.fat;
        return acc;
      },
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    );

    setMeals(updatedMeals);
    setSummary(newSummary);
    setAlternatives([]);
    setSelectedSlot(null);
    setSelectedMealIndex(null);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between mb-4">
        <button
          onClick={generateDay}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <RefreshCcw size={18} /> توليد خطة اليوم
        </button>

        <div className="flex items-center gap-2">
          <span>عدد الوجبات:</span>
          <select value={mealCount} onChange={(e) => setMealCount(e.target.value)} className="p-2 border rounded">
            <option value={2}>٢</option>
            <option value={3}>٣</option>
            <option value={4}>٤</option>
          </select>
        </div>
      </div>

      {meals.map((meal, idx) => (
        <div key={meal.key} className="border rounded-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Utensils size={18} /> {meal.type}
          </h2>

          <div className="text-gray-700 mb-2">{meal.name}</div>
          <div className="text-sm text-gray-500 mb-3">{meal.amount}</div>

          {meal.items.map((it) => (
            <div
              key={it.slot}
              className="cursor-pointer bg-gray-100 p-2 rounded mb-2"
              onClick={() => handleAlternativeClick(it.slot, it.foodKey, idx)}
            >
              {it.name} — {it.amountText}
            </div>
          ))}

          <div className="mt-2 text-sm text-gray-600 flex gap-4">
            <span>🔥 {meal.kcals} kcal</span>
            <span>بروتين: {meal.protein}g</span>
            <span>كارب: {meal.carbs}g</span>
            <span>دهون: {meal.fat}g</span>
          </div>
        </div>
      ))}

      {summary && (
        <div className="mt-6 border p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Flame size={18} /> مجموع اليوم
          </h3>

          <div>السعرات: {summary.totalCalories}</div>
          <div>البروتين: {summary.totalProtein}</div>
          <div>الكارب: {summary.totalCarbs}</div>
          <div>الدهون: {summary.totalFat}</div>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 border-t">
          <div className="font-semibold mb-2">اختر بديل:</div>

          <div className="grid grid-cols-2 gap-2">
            {alternatives.map((food) => (
              <div
                key={food.key}
                onClick={() => applyAlternative(food)}
                className="p-2 border rounded cursor-pointer hover:bg-gray-100 text-sm"
              >
                {food.name}
              </div>
            ))}
          </div>

          <button className="mt-3 bg-gray-300 py-1 px-4 rounded" onClick={() => setAlternatives([])}>
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
}