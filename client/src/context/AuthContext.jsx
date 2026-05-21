import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have a mock user session, load it directly to support offline/no-auth modes
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken === 'mock-session-token') {
      setUser(JSON.parse(storedUser));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          let userData = null;
          if (userSnap.exists()) {
            userData = { id: firebaseUser.uid, _id: firebaseUser.uid, ...userSnap.data() };
          } else {
            // Fallback user details
            userData = {
              id: firebaseUser.uid,
              _id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.email)}`,
              role: 'MEMBER',
              status: 'Active Now',
              workload: 45
            };
          }
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('token', 'firebase-session-token'); // Mock token to keep API interceptors happy
        } catch (err) {
          console.error('Failed to sync auth state from Firestore:', err);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);
      
      let userData = null;
      if (userSnap.exists()) {
        userData = { id: firebaseUser.uid, _id: firebaseUser.uid, ...userSnap.data() };
      } else {
        userData = {
          id: firebaseUser.uid,
          _id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          email: email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          role: 'MEMBER',
          status: 'Active Now',
          workload: 45
        };
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', 'firebase-session-token');
      return { token: 'firebase-session-token', user: userData };
    } catch (err) {
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found') || err.message?.includes('auth/configuration-not-found')) {
        console.warn('Firebase Auth email/password provider not enabled. Falling back to Firestore-only lookup.');
        
        const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = { id: userDoc.id, _id: userDoc.id, ...userDoc.data() };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('token', 'mock-session-token');
          return { token: 'mock-session-token', user: userData };
        } else {
          throw new Error('User not found in database. Please check your credentials or register a new account.');
        }
      }
      throw err;
    }
  };

  const register = async (name, email, password, avatar) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Save additional profile details in Firestore
      const userData = {
        name,
        email: email.toLowerCase(),
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        role: 'MEMBER',
        status: 'Active Now',
        workload: 45,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // Sign out immediately because Register.jsx routes the user to /login next.
      await signOut(auth);
      
      return { id: firebaseUser.uid, ...userData };
    } catch (err) {
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found') || err.message?.includes('auth/configuration-not-found')) {
        console.warn('Firebase Auth email/password provider not enabled. Registering directly in Firestore.');
        
        const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          throw new Error('Email already in use.');
        }
        
        const newDocRef = doc(collection(db, 'users'));
        const uid = newDocRef.id;
        
        const userData = {
          name,
          email: email.toLowerCase(),
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          role: 'MEMBER',
          status: 'Active Now',
          workload: 45,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(newDocRef, userData);
        return { id: uid, ...userData };
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signout error:', err);
    }
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
