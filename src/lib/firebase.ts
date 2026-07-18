import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCFrLoVD9mJnwxhdV7AlCGxojWfGpYdpAk",
  authDomain: "isentropic-forcaster-rd2jw.firebaseapp.com",
  projectId: "isentropic-forcaster-rd2jw",
  storageBucket: "isentropic-forcaster-rd2jw.firebasestorage.app",
  messagingSenderId: "338176183572",
  appId: "1:338176183572:web:c8c985320e0a9c3561c601"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-propertynrealest-a366a56b-05b0-4ca9-9769-c63579d84978");
