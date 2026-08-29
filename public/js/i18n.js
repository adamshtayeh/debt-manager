const translations = {
  en: {
    app_name: 'Debt Manager',
    app_subtitle: 'Track balances, payments, and progress in one clean workspace.',
    auth_subtitle: 'Track your debts and payments securely',
    sign_in: 'Sign in',
    sign_in_button: 'Sign in',
    create_account: 'Create account',
    create_account_button: 'Create account',
    email: 'Email',
    password: 'Password',
    confirm_password: 'Confirm password',
    no_account: "Don't have an account?",
    have_account: 'Already have an account?',
    sign_out: 'Sign out',
    total_debt: 'Total Debt',
    total_paid: 'Total Paid',
    remaining: 'Remaining',
    active_debts: 'Active Debts',
    export_data: 'Export data',
    import_data: 'Import data',
    all_debts: 'All Customers',
    add_debt: 'Add Customer',
    analytics: 'Analytics',
    customer_name: 'Customer name',
    debt_amount: 'Debt amount',
    notes: 'Notes',
    add_debt_button: 'Add Debt',
    add_another: 'Save & Add Another',
    confirm_delete_title: 'Delete Customer?',
    confirm_delete_message: 'Are you sure you want to delete {name}? This action cannot be undone.',
    delete_customer_message: '⚠ You are about to delete {name}. Their debt, payment history ({paid} paid so far), and all records will be permanently removed. This cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Delete',
    paid_off: 'Paid off',
    in_progress: 'In progress',
    original_amount: 'Original Amount',
    paid_so_far: 'Paid So Far',
    remaining_label: 'Remaining',
    payoff_progress: 'Payoff progress',
    add_payment: 'Add Payment',
    add_more_debt: 'Add Debt',
    added_debt: 'Debt Added',
    customer_since: 'Customer since {date}',
    history: 'History',
    delete: 'Delete',
    payment_history: 'Payment history',
    no_payments: 'No payments yet.',
    no_debts: 'No debts yet',
    no_debts_desc: 'Add your first debt to see balances, payoff progress, and payment history.',
    debt_breakdown: 'Debt breakdown',
    payment_progress: 'Payment progress',
    paid_legend: 'Paid',
    remaining_legend: 'Remaining',
    cumulative_payments: 'Cumulative payments',
    debt_data_table: 'Debt data table',
    creditor: 'Customer',
    original: 'Original',
    paid: 'Paid',
    payments: 'Payments',
    record_payment: 'Record payment',
    payment_amount: 'Payment amount',
    payment_date: 'Payment date',
    payment_note: 'Payment note',
    cancel: 'Cancel',
    record_payment_button: 'Record payment',
    not_set: 'Not set',
    no_note: 'No note',
    debt_added: 'Customer and debt added.',
    charge_added: 'Debt added to customer.',
    payment_recorded: 'Payment recorded.',
    invalid_amount: 'Enter a valid amount.',
    debts_migrated: 'Moved {count} saved debt(s) from this browser to the server.',
    debt_deleted: 'Debt deleted.',
    data_exported: 'Debt data exported.',
    data_imported: 'Debt data imported.',
    delete_confirm: 'Delete {creditor}? This cannot be undone.',
    import_confirm: 'This will replace all current data. Continue?',
    debts_tracked: '{count} debt tracked with {amount} remaining.',
    debts_tracked_plural: '{count} debts tracked with {amount} remaining.',
    payments_recorded: '{count} payment recorded totaling {amount}.',
    payments_recorded_plural: '{count} payments recorded totaling {amount}.',
    no_debt_data: 'No debt data to display',
    no_payment_history: 'No payment history yet',
    required: 'required'
  },
  ar: {
    app_name: 'مدير الديون',
    app_subtitle: 'تتبع الأرصدة والمدفوعات والتقدم في مساحة عمل واحدة.',
    auth_subtitle: 'تتبع ديونك ومدفوعاتك بشكل آمن',
    sign_in: 'تسجيل الدخول',
    sign_in_button: 'تسجيل الدخول',
    create_account: 'إنشاء حساب',
    create_account_button: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirm_password: 'تأكيد كلمة المرور',
    no_account: 'ليس لديك حساب؟',
    have_account: 'لديك حساب بالفعل؟',
    sign_out: 'تسجيل الخروج',
    total_debt: 'إجمالي الديون',
    total_paid: 'إجمالي المدفوع',
    remaining: 'المتبقي',
    active_debts: 'الديون النشطة',
    export_data: 'تصدير البيانات',
    import_data: 'استيراد البيانات',
    all_debts: 'جميع العملاء',
    add_debt: 'إضافة عميل',
    analytics: 'التحليلات',
    customer_name: 'اسم العميل',
    debt_amount: 'مبلغ الدين',
    notes: 'ملاحظات',
    add_debt_button: 'إضافة دين',
    add_another: 'حفظ وإضافة آخر',
    confirm_delete_title: 'حذف العميل؟',
    confirm_delete_message: 'هل أنت متأكد من حذف {name}؟ لا يمكن التراجع عن هذا الإجراء.',
    delete_customer_message: '⚠ أنت على وشك حذف {name}. سيتم حذف دينه وسجل مدفوعاته ({paid} مدفوعة حتى الآن) وجميع بياناته نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
    cancel: 'إلغاء',
    confirm: 'حذف',
    paid_off: 'مسدد بالكامل',
    in_progress: 'قيد السداد',
    original_amount: 'المبلغ الأصلي',
    paid_so_far: 'المدفوع حتى الآن',
    remaining_label: 'المتبقي',
    payoff_progress: 'تقدم السداد',
    add_payment: 'إضافة دفعة',
    add_more_debt: 'إضافة دين',
    added_debt: 'دين مضاف',
    customer_since: 'عميل منذ {date}',
    history: 'السجل',
    delete: 'حذف',
    payment_history: 'سجل الدفعات',
    no_payments: 'لا توجد دفعات بعد.',
    no_debts: 'لا توجد ديون بعد',
    no_debts_desc: 'أضف أول دين لرؤية الأرصدة وتقدم السداد وسجل الدفعات.',
    debt_breakdown: 'تفصيل الديون',
    payment_progress: 'تقدم الدفعات',
    paid_legend: 'مدفوع',
    remaining_legend: 'متبقي',
    cumulative_payments: 'الدفعات التراكمية',
    debt_data_table: 'جدول بيانات الديون',
    creditor: 'العميل',
    original: 'الأصلي',
    paid: 'مدفوع',
    payments: 'الدفعات',
    record_payment: 'تسجيل دفعة',
    payment_amount: 'مبلغ الدفعة',
    payment_date: 'تاريخ الدفعة',
    payment_note: 'ملاحظة الدفعة',
    cancel: 'إلغاء',
    record_payment_button: 'تسجيل دفعة',
    not_set: 'غير محدد',
    no_note: 'لا توجد ملاحظة',
    debt_added: 'تمت إضافة العميل والدين.',
    charge_added: 'تمت إضافة الدين إلى العميل.',
    payment_recorded: 'تم تسجيل الدفعة.',
    invalid_amount: 'أدخل مبلغًا صالحًا.',
    debts_migrated: 'تم نقل {count} دين/ديون محفوظة من المتصفح إلى الخادم.',
    debt_deleted: 'تم حذف الدين.',
    data_exported: 'تم تصدير بيانات الديون.',
    data_imported: 'تم استيراد بيانات الديون.',
    delete_confirm: 'حذف {creditor}؟ لا يمكن التراجع عن هذا.',
    import_confirm: 'سيؤدي هذا إلى استبدال جميع البيانات الحالية. هل تريد المتابعة؟',
    debts_tracked: 'تم تتبع {count} دين بمبلغ متبقي {amount}.',
    debts_tracked_plural: 'تم تتبع {count} دين بمبلغ متبقي {amount}.',
    payments_recorded: 'تم تسجيل {count} دفعة بإجمالي {amount}.',
    payments_recorded_plural: 'تم تسجيل {count} دفعة بإجمالي {amount}.',
    no_debt_data: 'لا توجد بيانات ديون للعرض',
    no_payment_history: 'لا يوجد سجل دفعات بعد',
    required: 'مطلوب'
  }
};

const STORAGE_KEYS = {
  theme: 'debt_manager_theme',
  lang: 'debt_manager_lang',
  user: 'debt_manager_user'
};

let currentTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
let currentLang = localStorage.getItem(STORAGE_KEYS.lang) || 'en';

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icons = document.querySelectorAll('#themeIcon');
  icons.forEach(icon => {
    if (currentTheme === 'dark') {
      icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
  });
}

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem(STORAGE_KEYS.lang, lang);
  updateLangIcon();
  updateTranslations();
}

function updateLangIcon() {
  const icons = document.querySelectorAll('#langIcon');
  icons.forEach(icon => {
    icon.textContent = currentLang === 'ar' ? 'EN' : 'ع';
  });
}

function updateTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = translations[currentLang][key];
    if (text) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else if (el.tagName === 'OPTION') {
        el.textContent = text;
      } else {
        el.textContent = text;
      }
    }
  });
}

function t(key, params = {}) {
  let text = translations[currentLang][key] || key;
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  return text;
}

function money(value) {
  return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-IL' : 'he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value) {
  if (!value) return t('not_set');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? t('not_set') : date.toLocaleDateString(currentLang === 'ar' ? 'ar-IL' : 'he-IL');
}

function setupThemeToggle() {
  const toggles = document.querySelectorAll('#themeToggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });
  });
}

function setupLangToggle() {
  const toggles = document.querySelectorAll('#langToggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      applyLanguage(currentLang === 'en' ? 'ar' : 'en');
    });
  });
}

function initializePreferences() {
  applyTheme(currentTheme);
  applyLanguage(currentLang);
  setupThemeToggle();
  setupLangToggle();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translations, t, money, formatDate, currentLang, currentTheme, initializePreferences };
}
