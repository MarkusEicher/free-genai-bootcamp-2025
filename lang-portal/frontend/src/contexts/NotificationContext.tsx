import { createContext, useContext, useState, ReactNode } from 'react'
import Notification from '../components/Notification'

type NotificationType = 'success' | 'error' | 'info'

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<{
    message: string
    type: NotificationType
  } | null>(null)

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type })
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Notification
          {...notification}
          onClose={() => setNotification(null)}
        />
      )}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
} 