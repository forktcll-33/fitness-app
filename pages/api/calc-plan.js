// pages/api/calc-plan.js
export default function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { weight, height, age, gender, activityLevel, goal } = req.body;
  
    if (!weight || !height || !age || !gender) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    // ✅ حساب السعرات (Mifflin-St Jeor)
    let bmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
  
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };
  
    const multiplier = activityLevel ? activityMultipliers[activityLevel] : 1.2;
    let calories = bmr * multiplier;
  
    if (goal === "lose") calories -= 400;
    if (goal === "gain") calories += 400;
  
    calories = Math.round(calories);
  
    // ✅ الماكروز
    const protein = Math.round(weight * 2);
    const fat = Math.round(weight * 0.6);
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const carbs = Math.round((calories - (proteinCalories + fatCalories)) / 4);
  
    const meals = [
      "فطور: 3 بيض + 2 توست أسمر + 20جم لوز",
      "غداء: 150جم دجاج + 200جم رز + خضار",
      "وجبة خفيفة: زبادي يوناني + موز",
      "عشاء: 120جم تونة + 150جم بطاطس",
      "قبل التمرين: قهوة سادة",
    ];
  
    res.status(200).json({ calories, protein, fat, carbs, meals });
  }