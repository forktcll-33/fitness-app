// components/charts/WeightChart.jsx
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
  } from "chart.js";
  import { Line } from "react-chartjs-2";
  
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);
  
  export default function WeightChart({ data }) {
    if (!data?.logs?.length) {
      return <p className="text-sm text-gray-500">لا يوجد سجل أوزان كافٍ للرسم البياني بعد.</p>;
    }
  
    const labels = data.logs.map((x) => new Date(x.date).toLocaleDateString("ar-SA"));
    const weights = data.logs.map((x) => x.weight);
  
    return (
      <div className="bg-white shadow p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-green-700">تغير الوزن عبر الأسابيع</h3>
        <Line
          data={{
            labels,
            datasets: [
                {
                  label: "الوزن (كجم)",
                  data: weights,
                  borderColor: "#16a34a",
                  backgroundColor: "rgba(22,163,74,0.2)",
                  tension: 0.4,
                  borderWidth: 3,
                },
                {
                  label: "الوزن المتوقع",
                  data: data.projected,
                  borderColor: "#6d28d9",
                  backgroundColor: "rgba(109,40,217,0.2)",
                  borderDash: [6, 6],
                  tension: 0.3,
                  borderWidth: 2,
                }
              ]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
            },
            scales: {
              x: {
                grid: { display: false },
              },
              y: {
                grid: { color: "rgba(0,0,0,0.05)" },
              },
            },
          }}
        />
      </div>
    );
  }