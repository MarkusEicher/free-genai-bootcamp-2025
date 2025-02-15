export function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission()
  }
}

export function showNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options)
  }
}

export function setupNotificationListeners(onNotification: (notification: Notification) => void) {
  const eventSource = new EventSource('/api/notifications/stream')
  
  eventSource.onmessage = (event) => {
    const notification = JSON.parse(event.data)
    onNotification(notification)
    showNotification(notification.title, {
      body: notification.message,
      icon: '/logo.png'
    })
  }

  return () => eventSource.close()
} 