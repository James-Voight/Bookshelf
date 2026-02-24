import { Book } from '../types/book';
import { RecommendedBook } from '../types/recommendation';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface RecommendationRequest {
  books: {
    title: string;
    authors: string[];
    genres: string[];
  }[];
}

interface RecommendationResponse {
  recommendations: RecommendedBook[];
  error?: string;
}

export async function fetchRecommendations(
  userBooks: Book[],
  excludeIds: Set<string>
): Promise<RecommendedBook[]> {
  const requestBody: RecommendationRequest = {
    books: userBooks.map(b => ({
      title: b.title,
      authors: b.authors,
      genres: b.genres,
    })),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RecommendationResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Filter out books the user has already swiped on
    return data.recommendations.filter(book => !excludeIds.has(book.id));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}
