const API_URL = "/api";

export interface QuizQuestion {
  key: string;
  question: string;
  options: string[];
}

export interface QuizConfig {
  questions: QuizQuestion[];
}

export interface QuizAnswers {
  roast: string;
  flavor_profile: string;
  brew_method: string;
  origin: string;
  process: string;
}

export interface Recommendation {
  product_name: string;
  description: string;
  description_bullets: string[];
  match_reason: string;
  price: string;
  image_url: string;
  shopify_url: string;
}

export async function getQuizConfig(): Promise<QuizConfig> {
  const res = await fetch(`${API_URL}/quiz-config`);
  if (!res.ok) throw new Error("Impossibile caricare il quiz");
  return res.json();
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
