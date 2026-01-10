import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import storage from '@react-native-firebase/storage';

// React Native Firebase auto-initializes from google-services.json
// No need to manually call initializeApp()

// Export Firebase services directly
export const firebaseAuth = auth();
export const firebaseFirestore = firestore();
export const firebaseFunctions = functions();
export const firebaseStorage = storage();
