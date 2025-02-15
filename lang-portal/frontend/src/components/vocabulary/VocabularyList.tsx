import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface Vocabulary {
  id: number;
  word: string;
  translation: string;
  success_rate: number;
  mastered: boolean;
}

export default function VocabularyList() {
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVocabulary = async () => {
      try {
        const response = await apiClient.get<Vocabulary[]>('/vocabulary');
        setVocabulary(response.data as Vocabulary[]);
      } catch (error) {
        console.error('Error fetching vocabulary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Vocabulary List</h2>
      <div className="grid gap-4">
        {vocabulary.map((word) => (
          <div key={word.id} className="border p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{word.word}</h3>
                <p className="text-gray-600">{word.translation}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  Success rate: {word.success_rate}%
                </span>
                {word.mastered && (
                  <span className="ml-2 text-green-500">✓ Mastered</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 