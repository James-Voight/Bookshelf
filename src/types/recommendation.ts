export interface RecommendedBook {
  id: string;
  title: string;
  authors: string[];
  coverURL?: string;
  synopsis: string;
  genres?: string[];
}

export interface SwipedBook {
  id: string;
  title: string;
  liked: boolean;
  swipedAt: string;
}
