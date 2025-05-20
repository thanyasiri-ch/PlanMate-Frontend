import { defineStore } from 'pinia';

export const useSignupStore = defineStore('signupStore', {
  state: () => ({
    displayName: '',
    email: '',
    password: '',
  }),
  actions: {
    setUserData(displayName: string, email: string, password: string) {
      this.displayName = displayName;
      this.email = email;
      this.password = password;
    },
    clear() {
      this.displayName = '';
      this.email = '';
      this.password = '';
    },
  },
});
