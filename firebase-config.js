// Firebase configuration for ¿Por qué?
const firebaseConfig = {
  apiKey: "AIzaSyAaOmk8HPr50UOfG1MiDWPcPWickKdfWW8",
  authDomain: "por-que-app.firebaseapp.com",
  projectId: "por-que-app",
  storageBucket: "por-que-app.firebasestorage.app",
  messagingSenderId: "1010999944266",
  appId: "1:1010999944266:web:ab2ff188be72f2140db2b3"
};

firebase.initializeApp(firebaseConfig);
window.pqFirebaseAuth = firebase.auth();
