importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA9wMXgKFN35o_YQAHpXpcWoaMwTxdO45U",
  authDomain: "planmate-3a16a.firebaseapp.com",
  databaseURL: "https://planmate-3a16a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "planmate-3a16a",
  storageBucket: "planmate-3a16a.firebasestorage.app",
  messagingSenderId: "26375668622",
  appId: "1:26375668622:web:b474d94765a3f89d459adf",
  measurementId: "G-JP5C0PH02X"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
