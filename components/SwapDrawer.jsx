// components/SwapDrawer.jsx
import React, { useEffect, useState } from "react";
import { foodSwaps } from "../data/food-swaps"; // تأكد أن الملف موجود

export default function SwapDrawer({ open, onClose, mealTitle, onConfirm }) {
  const [proteinSel, setProteinSel] = useState(null);
  const [carbSel, setCarbSel] = useState(null);
  const [fatSel, setFatSel] = useState(null);

  useEffect(() => {
    if (open) {
      setProteinSel(null);
      setCarbSel(null);
      setFatSel(null);
    }
  }, [open]);

  if (!open) return null;

  const Block = ({ title, items, value, onChange }) => (
    <div className="border rounded-lg p-3">
      <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
      <ul className="space-y-2 text-sm max-h-44 overflow-auto pr-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name={title}
                checked={value === i}
                onChange={() => onChange(i)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">
                  {it.name} <span className="text-gray-500">({it.grams}غ)</span>
                </div>
                {it.note ? (
                  <div className="text-gray-500 text-xs">{it.note}</div>
                ) : null}
              </div>
            </label>
            <div className="text-xs text-gray-600 shrink-0 text-right">
              {it.protein != null ? <>بروتين: <b>{it.protein}</b>غ<br/></> : null}
              {it.carbs != null ? <>كارب: <b>{it.carbs}</b>غ<br/></> : null}
              {it.fat != null ? <>دهون: <b>{it.fat}</b>غ<br/></> : null}
              سعرات: <b>{it.calories}</b>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const handleConfirm = () => {
    const payload = {
      protein: proteinSel != null ? foodSwaps.protein[proteinSel] : null,
      carb: carbSel != null ? foodSwaps.carbs[carbSel] : null,
      fat: fatSel != null ? foodSwaps.fats[fatSel] : null,
    };
    onConfirm(payload);
  };

  const disabled = proteinSel == null && carbSel == null && fatSel == null;

  return (
    <>
      {/* خلفية داكنة */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose}></div>

      {/* الدرج الجانبي */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-green-700">
            استبدال الوجبة {mealTitle ? `— ${mealTitle}` : ""}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-black">إغلاق ✕</button>
        </div>

        <div className="p-4 space-y-4 overflow-auto">
          <p className="text-xs text-gray-500 -mt-2">
            اختر بديلاً واحدًا على الأقل (بروتين/كارب/دهون). القيم تقريبية.
          </p>

          <div className="grid grid-cols-1 gap-3">
            <Block title="🍗 بروتين" items={foodSwaps.protein} value={proteinSel} onChange={setProteinSel} />
            <Block title="🥔 كارب" items={foodSwaps.carbs} value={carbSel} onChange={setCarbSel} />
            <Block title="🥑 دهون" items={foodSwaps.fats} value={fatSel} onChange={setFatSel} />
          </div>
        </div>

        <div className="p-4 border-t flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded border">إلغاء</button>
          <button
            onClick={handleConfirm}
            disabled={disabled}
            className={`px-4 py-2 rounded text-white ${disabled ? "bg-green-400/60 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
          >
            اعتماد الاستبدال
          </button>
        </div>
      </aside>
    </>
  );
}