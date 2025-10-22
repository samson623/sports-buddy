'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

interface QuestionFABProps {
  remaining: number
  onClick: () => void
}

/**
 * Floating action button for mobile with remaining questions badge
 */
export function QuestionFAB({ remaining, onClick }: QuestionFABProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-110 flex items-center justify-center transition-transform z-40"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      aria-label="Ask question"
    >
      <MessageCircle className="w-6 h-6" />

      {/* Badge showing remaining questions */}
      {remaining > 0 && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {remaining}
        </motion.div>
      )}

      {/* Pulse effect when questions available */}
      {remaining > 0 && (
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-400 dark:bg-blue-600 opacity-20"
          animate={{
            scale: [1, 1.3],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      )}
    </motion.button>
  )
}
