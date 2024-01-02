import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import "dotenv/config"

const firebaseConfig = {

  apiKey: process.env.FIREBASE_API_KEY,

  authDomain: process.env.FIREBASE_AUTH_DOMAIN,

  projectId: process.env.FIREBASE_PROJECT_ID,

  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,

  messagingSenderId: process.env.FIREBASE_SENDER_ID,

  appId: process.env.FIREBASE_APP_ID

};

const app = initializeApp(firebaseConfig);
const database = getFirestore(app)
const storage = getStorage(app)

export { app, database, storage }