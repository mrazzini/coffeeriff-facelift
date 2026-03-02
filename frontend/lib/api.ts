const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface QuizAnswers {
  roast: string;
  flavors: string;
  brew_method: string;
  intensity: string;
  adventure: string;
}

export interface Recommendation {
  product_name: string;
  description: string;
  match_reason: string;
  price: string;
  image_url: string;
  shopify_url: string;
}

export async function getRecommendations(
  answers: QuizAnswers
): Promise<Recommendation[]> {
  const res = await fetch(`${API_URL}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answers),
  });

  if (!res.ok) {
    throw new Error("Errore nel recupero delle raccomandazioni");
  }

  return res.json();
}
