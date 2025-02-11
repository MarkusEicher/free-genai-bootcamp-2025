'use client'

import Link from 'next/link'
import { DocumentDuplicateIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

export default function StudyPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Choose Study Mode</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Link
          href="/study/flashcards"
          className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors group"
        >
          <div className="flex items-center gap-4 mb-4">
            <DocumentDuplicateIcon className="w-8 h-8 text-blue-500 group-hover:text-blue-400" />
            <h2 className="text-xl font-semibold">Flashcards</h2>
          </div>
          <p className="text-gray-400">
            Practice your vocabulary with interactive flashcards. Test your knowledge
            of German words and their English translations.
          </p>
        </Link>

        <div className="bg-gray-800 rounded-lg p-6 opacity-75">
          <div className="flex items-center gap-4 mb-4">
            <AcademicCapIcon className="w-8 h-8 text-yellow-500" />
            <div className="flex justify-between items-center flex-1">
              <h2 className="text-xl font-semibold">Quiz</h2>
              <span className="text-sm bg-yellow-600 text-white px-2 py-1 rounded">
                Coming Soon
              </span>
            </div>
          </div>
          <p className="text-gray-400">
            Test your knowledge with multiple choice questions and written answers.
            Challenge yourself with timed quizzes and track your progress.
          </p>
        </div>
      </div>
    </div>
  )
} 