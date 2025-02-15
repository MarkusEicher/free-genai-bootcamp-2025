import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div onClick={onClick} className={`bg-white rounded-lg shadow ${className}`}>
      {children}
    </div>
  )
} 