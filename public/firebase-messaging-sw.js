// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Cấu hình phải khớp với trong src/config/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyCxKArkNcWvNMM-vBWozzKeqnY-2GCuWVI",
  authDomain: "chat-app-1c887.firebaseapp.com",
  projectId: "chat-app-1c887",
  storageBucket: "chat-app-1c887.firebasestorage.app",
  messagingSenderId: "886800477638",
  appId: "1:886800477638:web:391aecc92a9d383cf216c7",
  measurementId: "G-CWKN5EMDZ6"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Xử lý khi nhận tin nhắn background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const { data } = payload;
  
  // Nếu là lệnh hủy cuộc gọi
  if (data && data.type === 'cancel_call') {
    // Tìm tất cả các thông báo đang hiển thị và đóng chúng
    self.registration.getNotifications().then((notifications) => {
      notifications.forEach((notification) => {
        // Kiểm tra xem có đúng là thông báo cuộc gọi từ người này không (dựa vào callerId lưu trong data)
        if (notification.data && notification.data.callerId === data.callerId) {
          notification.close();
        }
      });
    });
    return; // Không hiển thị thông báo mới khi là lệnh hủy
  }

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: data.callerAvatar || '/vite.svg', // Dùng avatar nếu có, nếu không dùng icon mặc định
    tag: data.callerId, // Dùng tag để định danh thông báo của người gọi này
    data: data,
    renotify: true, // Luôn báo rung/chuông kể cả khi tag trùng
    actions: [
      {
        action: 'answer',
        title: 'Bắt máy',
      },
      {
        action: 'decline',
        title: 'Từ chối',
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// Xử lý khi người dùng NHẤN vào thông báo hoặc NÚT BẤM
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Đóng thông báo ngay lập tức

  const action = event.action;

  // Nếu người dùng chọn "Từ chối", chỉ đóng thông báo (chúng ta chưa có kết nối socket ở SW để gửi lệnh decline)
  // Việc từ chối chính thức sẽ do server tự timeout hoặc nếu bạn muốn làm sâu hơn thì cần gọi 1 API lên server ở đây
  if (action === 'decline') {
    return;
  }

  // Nếu chọn "Bắt máy" hoặc nhấn trực tiếp vào thông báo
  const urlToOpen = new URL('/', self.location.origin).href;
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;
    // Tìm xem có tab nào đang mở ứng dụng của mình không
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen || windowClient.url.includes(self.location.origin)) {
        matchingClient = windowClient;
        break;
      }
    }
    // Nếu thấy tab đang mở thì tập trung vào đó, nếu không thì mở tab mới
    if (matchingClient) {
      // Có thể dùng postMessage để truyền lệnh "answer" xuống Client để nó tự nhận cuộc gọi
      matchingClient.postMessage({ type: 'AUTO_ANSWER', callerId: event.notification.data.callerId });
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });
  event.waitUntil(promiseChain);
});
