export interface Messages {
  app: {
    title: string;
    subtitle: string;
  };
  common: {
    logout: string;
    language: string;
  };
  nav: {
    section: {
      overview: string;
      sales: string;
      warehouse: string;
      procurement: string;
      system: string;
    };
    item: {
      dashboard: string;
      reports: string;
      pos: string;
      invoices: string;
      customers: string;
      products: string;
      categories: string;
      inventory: string;
      adjustments: string;
      suppliers: string;
      purchaseOrders: string;
      users: string;
      rbac: string;
      settings: string;
      auditLogs: string;
      notifications: string;
    };
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    email: string;
    password: string;
    signIn: string;
    signingIn: string;
    noAccount: string;
    signUpLink: string;
    loginFailed: string;
    signupTitle: string;
    signupSubtitle: string;
    storeName: string;
    username: string;
    confirmPassword: string;
    createAccount: string;
    creating: string;
    hasAccount: string;
    loginLink: string;
    passwordMismatch: string;
    signupFailed: string;
    storePlaceholder: string;
    usernamePlaceholder: string;
    emailPlaceholder: string;
  };
}
