importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyA9wMXgKFN35o_YQAHpXpcWoaMwTxdO45U',
  authDomain: 'planmate-3a16a.firebaseapp.com',
  projectId: 'planmate-3a16a',
  storageBucket: 'planmate-3a16a.appspot.com',
  messagingSenderId: '26375668622',
  appId: '1:26375668622:web:b474d94765a3f89d459adf',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload)

  const notificationTitle = payload.data?.title || payload.notification?.title
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body,
    icon: '/firebase-logo.png',
  }

  if (notificationTitle) {
    return self.registration.showNotification(notificationTitle, notificationOptions)
  } else {
    console.warn('Received background message without a title, not showing notification.', payload)
  }
})
