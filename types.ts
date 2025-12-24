
export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  audioData?: string;
}

export interface ArticleSegment {
  id: string;
  text: string;
  translation?: string;
  audioData?: string;
}

export interface Article {
  id: string;
  title: string;
  segments: ArticleSegment[];
  keyVocabulary: VocabularyItem[];
  author: string;
  createdAt: number;
  tags: string[];
  viewCount: number;
  isPublished: boolean; // 是否上架
  coverImage?: string; // 文章封面 (Base64)
}
