const API_URL = "/api";

// --- Quiz types ---

export interface QuizQuestion {
  key: string;
  question: string;
  options: string[];
}

export interface QuizConfig {
  questions: QuizQuestion[];
}

export interface QuizAnswers {
  flavor_profile: string;
  brew_method: string;
  has_grinder: string;
  process: string;
  roast: string;
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

// --- Product / Storefront types ---

export interface EnrichedData {
  roast: string | null;
  process: string | null;
  origin_country: string | null;
  origin_region: string | null;
  flavor_notes: string[] | null;
  brew_compatibility: string[] | null;
  sca_score: number | null;
  bullets: string[] | null;
}

export interface Product {
  title: string;
  handle: string;
  description: string;
  price: string;
  tags: string;
  image_url: string;
  product_type: string;
  vendor: string;
  category: "coffee" | "capsule" | "accessory";
  enriched: EnrichedData;
}

// --- Quiz API ---

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

// --- Storefront API ---

export async function getProducts(category?: string): Promise<Product[]> {
  const url = category ? `${API_URL}/products?category=${category}` : `${API_URL}/products`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Impossibile caricare i prodotti");
  return res.json();
}
