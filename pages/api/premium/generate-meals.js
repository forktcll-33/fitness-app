// pages/api/premium/generate-meals.js
import { getUserFromRequest } from "../../../middleware/auth";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const userJwt = getUserFromRequest(req);
    if (!userJwt?.id)
      return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: Number(userJwt.id) },
      select: { plan: true, subscriptionTier: true },
    });

    if (!user)
      return res.status(404).json({ error: "User not found" });

    if ((user.subscriptionTier || "").toLowerCase() !== "premium") {
      return res.status(403).json({ error: "Not premium" });
    }

    if (!user.plan)
      return res.status(400).json({ error: "No plan available" });

    let basePlan = null;
    try {
      basePlan =
        typeof user.plan === "string"
          ? JSON.parse(user.plan)
          : user.plan;
    } catch {}

    if (!basePlan?.calories)
      return res.status(400).json({ error: "Invalid plan" });

    const calories = basePlan.calories;

    const mealTemplates = {
      breakfast: [
        "بيض + خبز بر + خضار",
        "شوفان + موز + قرفة",
        "زبادي يوناني + عسل + توت",
      ],
      lunch: [
        "صدر دجاج + رز + سلطة",
        "لحم قليل الدهن + بطاط + خضار",
        "تونة + مكرونة + خضار",
      ],
      dinner: [
        "تونة + خبز بر",
        "بيض + خضار",
        "جبن قليل الدسم + شوفان",
      ],
      snack: [
        "زبادي + مكسرات",
        "فاكهة",
        "بروتين بار",
      ],
    };

    // توزيع السعرات
    const meals = [
      {
        type: "فطور",
        kcals: Math.round(calories * 0.25),
        choice:
          mealTemplates.breakfast[
            Math.floor(Math.random() * mealTemplates.breakfast.length)
          ],
      },
      {
        type: "غداء",
        kcals: Math.round(calories * 0.4),
        choice:
          mealTemplates.lunch[
            Math.floor(Math.random() * mealTemplates.lunch.length)
          ],
      },
      {
        type: "عشاء",
        kcals: Math.round(calories * 0.25),
        choice:
          mealTemplates.dinner[
            Math.floor(Math.random() * mealTemplates.dinner.length)
          ],
      },
      {
        type: "سناك",
        kcals: Math.round(calories * 0.1),
        choice:
          mealTemplates.snack[
            Math.floor(Math.random() * mealTemplates.snack.length)
          ],
      },
    ];

    return res.status(200).json({ ok: true, meals });
  } catch (err) {
    console.error("Meal generator error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}