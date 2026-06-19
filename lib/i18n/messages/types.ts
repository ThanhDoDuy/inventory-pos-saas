export interface Messages {
  app: {
    title: string;
    subtitle: string;
  };
  common: {
    logout: string;
    language: string;
    loading: string;
    cancel: string;
    close: string;
    save: string;
    saving: string;
    add: string;
    creating: string;
    update: string;
    search: string;
    status: string;
    actions: string;
    all: string;
    active: string;
    disabled: string;
    noData: string;
    backToList: string;
    disable: string;
    edit: string;
    email: string;
    phone: string;
    address: string;
    confirm: string;
    processing: string;
    remove: string;
    name: string;
    total: string;
    date: string;
    none: string;
    required: string;
    optional: string;
    error: {
      loadFailed: string;
      actionFailed: string;
    };
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
      posRetail: string;
      posBusiness: string;
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
    empty: {
      noAccess: string;
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
    forgotPasswordLink: string;
    forgotPasswordTitle: string;
    forgotPasswordSubtitle: string;
    sendResetLink: string;
    sendingResetLink: string;
    resetLinkSent: string;
    backToLogin: string;
    resetPasswordTitle: string;
    resetPasswordSubtitle: string;
    newPassword: string;
    confirmNewPassword: string;
    resetPasswordSubmit: string;
    resettingPassword: string;
    resetPasswordSuccess: string;
    invalidResetToken: string;
    passwordResetFailed: string;
  };
  dashboard: {
    greeting: string;
    subtitle: string;
    subtitleWithTenant: string;
    loading: string;
    topProducts: string;
    quickActions: string;
    monthlyRevenue: string;
    sold: string;
    stats: {
      revenueToday: string;
      ordersToday: string;
      productsSoldToday: string;
      lowStock: string;
    };
    actions: {
      sell: string;
      manageProducts: string;
      viewReports: string;
    };
    empty: {
      noSalesData: string;
    };
    error: {
      loadFailed: string;
    };
  };
  reports: {
    title: string;
    subtitle: string;
    dateRange: string;
    salesOverview: string;
    inventory: string;
    revenueTrend: string;
    topProductsByRevenue: string;
    recentTransactions: string;
    revenue: string;
    orders: string;
    avgPerOrder: string;
    lowStock: string;
    productsSoldToday: string;
    revenueToday: string;
    exportCsv: string;
    exporting: string;
    preset: {
      week: string;
      month: string;
      quarter: string;
      year: string;
    };
    table: {
      date: string;
      invoiceCode: string;
      payment: string;
      amount: string;
      status: string;
    };
    empty: {
      noTransactions: string;
    };
    error: {
      exportFailed: string;
    };
    deadStock: {
      title: string;
      subtitle: string;
      days30: string;
      days60: string;
      days90: string;
      itemCount: string;
      totalValue: string;
      empty: string;
      table: {
        sku: string;
        product: string;
        quantity: string;
        value: string;
      };
    };
  };
  pos: {
    title: string;
    subtitle: string;
    addProduct: string;
    quickSearch: string;
    category: string;
    selectProduct: string;
    quantity: string;
    searchProduct: string;
    stock: string;
    productCount: string;
    productCountInCategory: string;
    allCategories: string;
    addToCart: string;
    checkout: string;
    loadingCategories: string;
    loadingProducts: string;
    selectProductPlaceholder: string;
    noMatchingProducts: string;
    searchPlaceholder: string;
    decreaseQty: string;
    increaseQty: string;
    clearSearch: string;
    alert: {
      lowStock: string;
      emptyCart: string;
    };
    error: {
      loadProducts: string;
    };
    payment: {
      title: string;
      productCount: string;
      total: string;
      discount: string;
      method: string;
      cash: string;
      transfer: string;
      amountPaid: string;
      exactAmount: string;
      change: string;
      changeToCustomer: string;
      shortfall: string;
      transferConfirm: string;
      pay: string;
      success: string;
      successDesc: string;
      invoiceCode: string;
      print: string;
      newOrder: string;
      insufficientPaid: string;
      emptyCart: string;
      failed: string;
      printFailed: string;
      close: string;
    };
    cart: {
      title: string;
      empty: string;
      subtotal: string;
      discount: string;
      tax: string;
      grandTotal: string;
      discountPct: string;
      discountFixed: string;
      taxPct: string;
      notes: string;
      notesPlaceholder: string;
      clear: string;
    };
    priceTier: {
      title: string;
      qty: string;
      close: string;
    };
    retail: {
      title: string;
      subtitle: string;
      confirmTitle: string;
      confirmPay: string;
      successDesc: string;
    };
    business: {
      title: string;
      subtitle: string;
      customerTitle: string;
      customerSubtitle: string;
      customerRequired: string;
      selectExisting: string;
      createNew: string;
      searchCustomer: string;
      searchPlaceholder: string;
      noCustomers: string;
      typeCompany: string;
      typeGroup: string;
      sellingTo: string;
      changeCustomer: string;
      saveAndSelect: string;
      createFailed: string;
    };
  };
  invoices: {
    title: string;
    subtitle: string;
    totalCount: string;
    print: string;
    printTitle: string;
    table: {
      invoiceCode: string;
      date: string;
      payment: string;
      total: string;
      status: string;
      actions: string;
    };
    empty: {
      noInvoices: string;
    };
    error: {
      loadFailed: string;
      printFailed: string;
      cancelFailed: string;
      refundFailed: string;
    };
    cancel: {
      title: string;
      description: string;
      reason: string;
      reasonPlaceholder: string;
      submit: string;
    };
    refund: {
      title: string;
      reason: string;
      reasonPlaceholder: string;
      remaining: string;
      total: string;
      submit: string;
      noItems: string;
    };
  };
  customers: {
    title: string;
    subtitle: string;
    add: string;
    searchPlaceholder: string;
    filter: {
      all: string;
      active: string;
      disabled: string;
      typeAll: string;
      typeIndividual: string;
      typeCompany: string;
      typeGroup: string;
    };
    type: {
      label: string;
      individual: string;
      company: string;
      group: string;
    };
    table: {
      customer: string;
      type: string;
      contact: string;
      status: string;
      lastPurchase: string;
      actions: string;
    };
    form: {
      name: string;
      phone: string;
      email: string;
      address: string;
      taxCode: string;
      contactPerson: string;
    };
    modal: {
      add: string;
      edit: string;
    };
    history: {
      title: string;
      orderCount: string;
      totalSpent: string;
      lastPurchase: string;
      noData: string;
    };
    tooltip: {
      history: string;
      edit: string;
      disable: string;
      activate: string;
    };
    empty: {
      noCustomers: string;
    };
    confirm: {
      disable: string;
      activate: string;
    };
    error: {
      loadFailed: string;
      requiredFields: string;
      taxCodeRequired: string;
      actionFailed: string;
      disableFailed: string;
      activateFailed: string;
    };
  };
  suppliers: {
    title: string;
    subtitle: string;
    add: string;
    searchPlaceholder: string;
    filter: {
      all: string;
      active: string;
      disabled: string;
    };
    table: {
      supplier: string;
      contact: string;
      taxCode: string;
      status: string;
      actions: string;
    };
    form: {
      name: string;
      phone: string;
      email: string;
      address: string;
      taxCode: string;
    };
    modal: {
      add: string;
      edit: string;
    };
    history: {
      title: string;
      orderCount: string;
      totalAmount: string;
      lastOrder: string;
      noData: string;
    };
    tooltip: {
      history: string;
      edit: string;
      disable: string;
      activate: string;
    };
    empty: {
      noSuppliers: string;
    };
    confirm: {
      disable: string;
      activate: string;
    };
    error: {
      loadFailed: string;
      requiredFields: string;
      actionFailed: string;
      disableFailed: string;
      activateFailed: string;
    };
  };
  products: {
    title: string;
    subtitle: string;
    add: string;
    searchPlaceholder: string;
    stats: {
      total: string;
      lowStock: string;
      outOfStock: string;
    };
    table: {
      product: string;
      sku: string;
      category: string;
      stock: string;
      minStock: string;
      price: string;
      status: string;
      actions: string;
    };
    form: {
      name: string;
      sku: string;
      skuHint: string;
      category: string;
      costPrice: string;
      sellingPrice: string;
      minStock: string;
      minStockHint: string;
      tierPrices: string;
    };
    modal: {
      add: string;
    };
    placeholders: {
      name: string;
      sku: string;
      cost: string;
      price: string;
      minStock: string;
      categoryNone: string;
    };
    empty: {
      noProducts: string;
    };
    confirm: {
      deactivate: string;
    };
    error: {
      loadFailed: string;
      requiredFields: string;
      createFailed: string;
      deactivateFailed: string;
    };
    detail: {
      productInfo: string;
      pricing: string;
      inventory: string;
      stockStatus: string;
      actions: string;
      sku: string;
      category: string;
      status: string;
      productStatus: string;
      costPrice: string;
      sellingPrice: string;
      profitMargin: string;
      currentStock: string;
      stockValue: string;
      minStock: string;
      stockLevel: string;
      unitsWithMin: string;
      deactivate: string;
      loading: string;
      hint: {
        stockAdjustment: string;
      };
      form: {
        name: string;
        sku: string;
        costPrice: string;
        sellingPrice: string;
        minStock: string;
      };
      error: {
        invalidId: string;
        loadFailed: string;
        notFound: string;
        updateFailed: string;
        deactivateFailed: string;
      };
      confirm: {
        deactivate: string;
      };
    };
  };
  categories: {
    title: string;
    subtitle: string;
    add: string;
    form: {
      name: string;
      description: string;
    };
    modal: {
      add: string;
      edit: string;
    };
    placeholders: {
      name: string;
      description: string;
    };
    tooltip: {
      edit: string;
      delete: string;
    };
    empty: {
      noCategories: string;
    };
    confirm: {
      delete: string;
    };
    error: {
      loadFailed: string;
      nameRequired: string;
      createFailed: string;
      updateFailed: string;
      deleteFailed: string;
    };
  };
  inventory: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    stats: {
      totalValue: string;
      lowStock: string;
      outOfStock: string;
    };
    table: {
      product: string;
      sku: string;
      available: string;
      min: string;
      value: string;
      status: string;
    };
    hint: {
      stockChanges: string;
    };
    empty: {
      noData: string;
    };
    error: {
      loadFailed: string;
    };
    redirect: {
      invalidId: string;
      redirecting: string;
      viewProduct: string;
    };
  };
  adjustments: {
    title: string;
    subtitle: string;
    create: string;
    modal: {
      title: string;
    };
    table: {
      time: string;
      product: string;
      type: string;
      quantity: string;
      balanceAfter: string;
      note: string;
    };
    form: {
      product: string;
      quantity: string;
      quantityHint: string;
      reason: string;
      note: string;
    };
    placeholders: {
      productSelect: string;
      quantity: string;
      note: string;
      stockInOption: string;
    };
    empty: {
      noAdjustments: string;
    };
    error: {
      loadFailed: string;
      productRequired: string;
      quantityInvalid: string;
      submitFailed: string;
    };
  };
  purchaseOrders: {
    title: string;
    subtitle: string;
    create: string;
    creating: string;
    approve: string;
    receive: string;
    cancelOrder: string;
    addLine: string;
    remove: string;
    total: string;
    filter: {
      status: string;
    };
    status: {
      all: string;
    };
    table: {
      poNumber: string;
      supplier: string;
      status: string;
      total: string;
      createdAt: string;
      actions: string;
    };
    form: {
      supplier: string;
      expectedDate: string;
      products: string;
      quantity: string;
      costPrice: string;
    };
    detail: {
      orderedQty: string;
      receivedQty: string;
      costPrice: string;
      receiveThisTime: string;
      loading: string;
    };
    modal: {
      create: string;
    };
    placeholders: {
      supplierSelect: string;
      productSelect: string;
      quantity: string;
      costPrice: string;
    };
    tooltip: {
      detail: string;
    };
    empty: {
      noOrders: string;
    };
    confirm: {
      approve: string;
    };
    prompt: {
      cancelReason: string;
    };
    error: {
      loadList: string;
      supplierRequired: string;
      itemsRequired: string;
      quantityMin: string;
      createFailed: string;
      approveFailed: string;
      receiveQtyRequired: string;
      receiveFailed: string;
      cancelFailed: string;
    };
  };
  users: {
    title: string;
    subtitle: string;
    add: string;
    role: string;
    searchPlaceholder: string;
    stats: {
      total: string;
      active: string;
      admins: string;
    };
    filter: {
      all: string;
      admin: string;
      manager: string;
      staff: string;
    };
    table: {
      user: string;
      email: string;
      role: string;
      status: string;
      lastLogin: string;
      actions: string;
    };
    form: {
      username: string;
      email: string;
      role: string;
      password: string;
      newPassword: string;
      passwordHint: string;
      ownerRoleLocked: string;
    };
    modal: {
      add: string;
      edit: string;
      resetPassword: string;
    };
    resetPasswordFor: string;
    resetPasswordSubmit: string;
    placeholders: {
      username: string;
      email: string;
      password: string;
      roleSelect: string;
    };
    status: {
      active: string;
    };
    badge: {
      owner: string;
    };
    tooltip: {
      disable: string;
      edit: string;
      resetPassword: string;
      activate: string;
    };
    empty: {
      noUsers: string;
    };
    confirm: {
      disable: string;
      activate: string;
    };
    error: {
      loadFailed: string;
      requiredFields: string;
      createFailed: string;
      updateFailed: string;
      disableFailed: string;
      activateFailed: string;
      resetPasswordFailed: string;
      passwordTooShort: string;
    };
  };
  rbac: {
    title: string;
    subtitle: string;
    tabs: {
      overview: string;
      matrix: string;
      custom: string;
    };
    stats: {
      roles: string;
      permissions: string;
      systemRoles: string;
      customSuffix: string;
    };
    rolesInStore: string;
    rolePermissions: string;
    permissionMatrix: string;
    system: string;
    custom: string;
    fullAccess: string;
    permissionsCount: string;
    permissionsOfRole: string;
    wildcardDesc: string;
    wildcardGranted: string;
    matrixDesc: string;
    table: {
      permission: string;
    };
    loading: string;
    empty: {
      noRoles: string;
    };
    error: {
      loadFailed: string;
    };
  };
  notifications: {
    title: string;
    description: string;
    markAllRead: string;
    markRead: string;
    filter: {
      show: string;
      all: string;
      unread: string;
      type: string;
    };
    types: {
      LOW_STOCK: string;
      PO_RECEIVED: string;
      INVOICE_PAID: string;
    };
    empty: {
      all: string;
      unread: string;
    };
    unreadCount: string;
    error: {
      loadFailed: string;
      markReadFailed: string;
      markAllFailed: string;
    };
  };
  auditLogs: {
    title: string;
    description: string;
    exportCsv: string;
    filter: {
      module: string;
      action: string;
      dateRange: string;
      all: string;
    };
    table: {
      time: string;
      user: string;
      action: string;
      module: string;
      entity: string;
      status: string;
      actions: string;
    };
    detail: {
      title: string;
      ip: string;
      oldValue: string;
      newValue: string;
      metadata: string;
    };
    empty: string;
    totalCount: string;
    error: {
      loadFailed: string;
      exportFailed: string;
      detailFailed: string;
    };
  };
  settings: {
    title: string;
    subtitle: string;
    tabs: {
      business: string;
      billing: string;
      notifications: string;
      security: string;
    };
    business: {
      title: string;
      name: string;
      address: string;
      phone: string;
      city: string;
      state: string;
      saved: string;
      error: string;
      saving: string;
    };
    policies: {
      title: string;
      allowNegativeStock: string;
      lowStockThreshold: string;
      maxDiscountStaff: string;
      maxDiscountManager: string;
      saved: string;
      error: string;
      saving: string;
    };
    features: {
      enable_low_stock_alert: { label: string; desc: string };
      enable_refund: { label: string; desc: string };
      enable_partial_payment: { label: string; desc: string };
    };
    priceTiers: {
      title: string;
      subtitle: string;
      code: string;
      label: string;
      system: string;
      custom: string;
      addCustom: string;
      codePlaceholder: string;
      labelPlaceholder: string;
      limitReached: string;
      save: string;
      saved: string;
      error: string;
    };
    billing: {
      title: string;
      currentPlan: string;
      paymentMethod: string;
      planDetail: string;
      cardInfo: string;
      notAvailable: string;
    };
    notifications: {
      title: string;
      saved: string;
      error: string;
      lowStock: {
        label: string;
        desc: string;
      };
      salesReports: {
        label: string;
        desc: string;
      };
      systemUpdates: {
        label: string;
        desc: string;
      };
      securityAlerts: {
        label: string;
        desc: string;
      };
    };
    security: {
      title: string;
      password: string;
      twoFactor: string;
      deleteAccount: string;
      passwordLastChanged: string;
      twoFactorDisabled: string;
      deleteWarning: string;
      changePasswordTitle: string;
      oldPassword: string;
      newPassword: string;
      confirmPassword: string;
      passwordChanged: string;
      passwordMismatch: string;
      passwordMinLength: string;
      changePasswordError: string;
      comingSoon: string;
    };
    signOut: {
      title: string;
      description: string;
    };
    placeholders: {
      address: string;
      phone: string;
    };
    buttons: {
      saveChanges: string;
      updatePayment: string;
      downloadInvoice: string;
      changePassword: string;
      enable2FA: string;
      delete: string;
      logout: string;
    };
  };
  importExport: {
    exportCsv: string;
    exportSummary: string;
    exportDetail: string;
    exportBalances: string;
    exportTransactions: string;
    downloadTemplate: string;
    importCsv: string;
    error: {
      exportFailed: string;
      templateFailed: string;
      previewFailed: string;
      importFailed: string;
      invalidFileType: string;
    };
    products: {
      title: string;
      mode: string;
      modeUpsert: string;
      modeCreateOnly: string;
      selectFile: string;
      categoryHint: string;
      preview: string;
      confirm: string;
      done: string;
      created: string;
      updated: string;
      skipped: string;
      failed: string;
      total: string;
      valid: string;
      errors: string;
      newCategories: string;
      colName: string;
      colCategory: string;
    };
    suppliers: {
      title: string;
      mode: string;
      modeUpsert: string;
      modeCreateOnly: string;
      selectFile: string;
      preview: string;
      confirm: string;
      done: string;
      created: string;
      updated: string;
      skipped: string;
      failed: string;
      total: string;
      valid: string;
      errors: string;
      colName: string;
      colPhone: string;
    };
    customers: {
      title: string;
      mode: string;
      modeUpsert: string;
      modeCreateOnly: string;
      selectFile: string;
      preview: string;
      confirm: string;
      done: string;
      created: string;
      updated: string;
      skipped: string;
      failed: string;
      total: string;
      valid: string;
      errors: string;
      colType: string;
      colName: string;
      colPhone: string;
      colTaxCode: string;
    };
    purchaseOrders: {
      title: string;
      selectFile: string;
      hint: string;
      preview: string;
      confirm: string;
      done: string;
      created: string;
      skipped: string;
      failed: string;
      total: string;
      valid: string;
      errors: string;
      ordersToCreate: string;
      colGroup: string;
      colPhone: string;
      colSku: string;
      colQty: string;
    };
  };
  status: {
    po: {
      DRAFT: string;
      APPROVED: string;
      PARTIALLY_RECEIVED: string;
      RECEIVED: string;
      CANCELLED: string;
    };
    party: {
      ACTIVE: string;
      DISABLED: string;
    };
    adjustment: {
      DAMAGE: string;
      LOSS: string;
      EXPIRED: string;
      CORRECTION: string;
    };
    transaction: {
      IN: string;
      OUT: string;
      ADJUST: string;
    };
    stock: {
      in: string;
      low: string;
      out: string;
    };
  };
}
