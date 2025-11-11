// components/SwapModal.jsx
import React from "react";
import { foodSwaps } from "../data/food-swaps";

export default function SwapModal({ open, onClose, mealTitle, onSwap }) {
  if (!open) return null;

  const Block = ({ title, items }) => (
    <div className="border rounded-lg p-3">
      <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">
                {it.name} <span className="text-gray-500">({it.grams}غ)</span>
              </div>
              {it.note ? <div className="text-gray-500 text-xs">{it.note}</div> : null}
            </div>

            <div className="text-xs text-gray-600 shrink-0 text-right">
              {it.protein != null ? <>بروتين: <b>{it.protein}</b>غ<br/></> : null}
              {it.carbs != null ? <>كارب: <b>{it.carbs}</b>غ<br/></> : null}
              {it.fat != null ? <>دهون: <b>{it.fat}</b>غ<br/></> : null}
              سعرات: <b>{it.calories}</b>
              {/* زر الاختيار */}
              <button
                onClick={() => onSwap && onSwap(it)}
                className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                اختيار ↻
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl p-5 space-y-4" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-green-700">
            بدائل الوجبة {mealTitle ? `— ${mealTitle}` : ""}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-black">إغلاق ✕</button>
        </div>

        <p className="text-xs text-gray-500 -mt-2">
          بدائل مكافئة تقريبًا لنفس السعرات/الماكروز. يمكنك اختيار الأنسب لك.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Block title="🍗 بدائل البروتين" items={foodSwaps.protein} />
          <Block title="🥔 بدائل الكارب" items={foodSwaps.carbs} />
          <Block title="🥑 بدائل الدهون" items={foodSwaps.fats} />
        </div>

        <div className="text-xs text-gray-500">
          ملاحظة: القيم تقريبية. إذا أردت دقة أعلى، اختر أقرب بديل ووازن الكمية يدويًا (+/− 10%).
        </div>
      </div>
    </div>
  );
}