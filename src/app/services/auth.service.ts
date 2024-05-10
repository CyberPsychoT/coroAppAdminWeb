import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user = new BehaviorSubject<User | null>(null);
  user$ = this.user.asObservable();
  private userName = new BehaviorSubject<string | null>(null);
  userName$ = this.userName.asObservable();
  private userCargo = new BehaviorSubject<string | null>(null);
  userCargo$ = this.userCargo.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, (user) => {
      this.user.next(user);
      if (user) {
        this.loadUserData(user.uid);
      } else {
        this.userName.next(null); // Clear username if no user
        this.userCargo.next(null); // Clear userCargo if no user
      }
    });
  }

  private loadUserData(uid: string) {
    const docRef = doc(this.firestore, 'Admins', uid);
    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          this.userName.next(userData['Name']); // Assume 'name' is the field for the user's name
          this.userCargo.next(userData['Cargo']); // Assume 'Cargo' is the field for the user's cargo
        } else {
          console.log('No such document!');
          this.userName.next('No Name'); // Handle case where no data exists
          this.userName.next('No Cargo'); // Handle case where no data exists
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
      });
  }

  login({ email, password }: any) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }
}
