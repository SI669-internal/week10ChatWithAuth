
import { getAuth, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut, 
  initializeAuth, 
  getReactNativePersistence,
  onAuthStateChanged
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';

import { firebaseConfig } from './Secrets';

let app, auth;

const apps = getApps();
if (apps.length == 0) { 
  app = initializeApp(firebaseConfig);
} else {
  app = apps[0];
}

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  auth = getAuth(app); // if auth already initialized
}

const subscribeToAuthChanges = (navigation) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('signed in! user:', user);
      navigation.navigate('Home');
    } else {
      console.log('user is signed out!');
      navigation.navigate('Login');
    }
  })
}

const signIn = async (email, password) => {
  await signInWithEmailAndPassword(auth, email, password);
}

const signUp = async (displayName, email, password) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCred.user, {displayName: displayName});
}

const signOut = async () => {
  await fbSignOut(auth);
}

const getAuthUser = () => {
  return auth.currentUser;
}

export { signUp, signIn, signOut, getAuthUser, subscribeToAuthChanges };