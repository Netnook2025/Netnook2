import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Record<string, string>;
  isRTL: boolean;
}

const translations = {
  en: {
    appName: "NetNook",
    subTitle: "Global Offline Cache",
    connecting: "CONNECTING TO NODE",
    login: "Sign In",
    signup: "Sign Up",
    createAccount: "Create Account",
    welcomeBack: "Welcome Back",
    joinNetwork: "Join the global network",
    signInAccess: "Sign in to access your cloud sync",
    fullName: "Full Name",
    email: "Email Address",
    password: "Password",
    forgotPass: "Forgot Password?",
    sendReset: "Send Reset Link",
    cancel: "Cancel",
    orContinue: "OR CONTINUE WITH",
    google: "Google",
    alreadyHave: "Already have an account?",
    dontHave: "Don't have an account?",
    checkInbox: "Check your inbox",
    sentLink: "We've sent a password reset link to",
    backToSignIn: "Back to Sign In",
    localShare: "Local Share",
    shareDesc: "Share directly to nearby devices",
    generating: "Generating QR...",
    cidLabel: "Content ID (CID)",
    openShare: "AirDrop / Nearby Share",
    shareNote: "Works offline via Bluetooth/WiFi Direct on mobile devices.",
    editPost: "Edit Post",
    whatsMind: "What's on your mind?",
    saveChanges: "Save Changes",
    backFeed: "Back to Feed",
    posts: "Posts",
    likes: "Likes Received",
    myPosts: "My Posts",
    noPosts: "You haven't posted anything yet.",
    editProfile: "Edit Profile",
    updateInfo: "Update your public information.",
    displayName: "Display Name",
    profession: "Profession / Title",
    networkStatus: "Network Status",
    connected: "Connected Online",
    offline: "Currently Offline",
    secureConn: "You are securely connected to the NetNook Global Network.",
    noConn: "No internet connection detected. You are viewing cached data.",
    close: "Close",
    reply: "Reply",
    addComment: "Add a comment...",
    connectToComment: "Connect to network to comment",
    copyId: "Copy ID",
    report: "Report",
    deletePost: "Delete Post",
    search: "Search cache...",
    myProfile: "My Profile",
    signOut: "Sign Out",
    all: "All",
    education: "Education",
    news: "News",
    entertainment: "Entertainment",
    postTo: "Post to:",
    caption: "Write a caption for",
    anonymous: "Anonymous",
    attach: "Attach File",
    public: "Public",
    local: "Local",
    posting: "Posting...",
    post: "Post",
    youOffline: "You are currently offline",
    connectSee: "Connect to see the latest global posts.",
    settings: "Network Settings",
    noContent: "No content found",
    startConv: "Start the conversation in",
    showLess: "Show less",
    readMore: "Read more",
    justNow: "Just now",
    ago: "ago",
    retry: "Retry",
    uploadFailed: "Upload failed. Click to retry.",
    synced: "Synced to Global Network",
    cidCopied: "CID Copied!",
    reported: "Reported for review.",
    savePrivate: "Saved to Private",
    folder: "folder!",
    itemExists: "Item already in your Private Cache.",
    uploadSuccess: "Upload Successful! Your post is now global.",
    deleteConfirm: "Are you sure you want to delete this post?",
    fillFields: "Please fill in all fields",
    enterName: "Please enter your name",
    enterEmail: "Please enter your email address"
  },
  ar: {
    appName: "نت-نوك",
    subTitle: "ذاكرة التخزين المؤقت العالمية",
    connecting: "جاري الاتصال بالعقدة",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    createAccount: "إنشاء حساب جديد",
    welcomeBack: "مرحبًا بعودتك",
    joinNetwork: "انضم إلى الشبكة العالمية",
    signInAccess: "سجل الدخول للوصول إلى المزامنة السحابية",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgotPass: "نسيت كلمة المرور؟",
    sendReset: "إرسال رابط إعادة التعيين",
    cancel: "إلغاء",
    orContinue: "أو الاستمرار باستخدام",
    google: "جوجل",
    alreadyHave: "لديك حساب بالفعل؟",
    dontHave: "ليس لديك حساب؟",
    checkInbox: "تحقق من بريدك الوارد",
    sentLink: "لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى",
    backToSignIn: "العودة لتسجيل الدخول",
    localShare: "مشاركة محلية",
    shareDesc: "شارك مباشرة مع الأجهزة القريبة",
    generating: "جاري إنشاء الرمز...",
    cidLabel: "معرف المحتوى (CID)",
    openShare: "المشاركة القريبة / AirDrop",
    shareNote: "يعمل دون اتصال عبر البلوتوث/الواي فاي المباشر.",
    editPost: "تعديل المنشور",
    whatsMind: "بماذا تفكر؟",
    saveChanges: "حفظ التغييرات",
    backFeed: "العودة للرئيسية",
    posts: "منشورات",
    likes: "الإعجابات",
    myPosts: "منشوراتي",
    noPosts: "لم تقم بنشر أي شيء بعد.",
    editProfile: "تعديل الملف الشخصي",
    updateInfo: "تحديث معلوماتك العامة.",
    displayName: "اسم العرض",
    profession: "المهنة / اللقب",
    networkStatus: "حالة الشبكة",
    connected: "متصل بالإنترنت",
    offline: "غير متصل حالياً",
    secureConn: "أنت متصل بشكل آمن بشبكة نت-نوك العالمية.",
    noConn: "لا يوجد اتصال بالإنترنت. أنت تشاهد البيانات المخزنة مؤقتاً.",
    close: "إغلاق",
    reply: "رد",
    addComment: "أضف تعليقاً...",
    connectToComment: "اتصل بالشبكة للتعليق",
    copyId: "نسخ المعرف",
    report: "إبلاغ",
    deletePost: "حذف المنشور",
    search: "بحث في الذاكرة...",
    myProfile: "ملفي الشخصي",
    signOut: "تسجيل الخروج",
    all: "الكل",
    education: "تعليم",
    news: "أخبار",
    entertainment: "ترفيه",
    postTo: "نشر في:",
    caption: "اكتب وصفاً لـ",
    anonymous: "مجهول",
    attach: "إرفاق ملف",
    public: "عام",
    local: "محلي",
    posting: "جاري النشر...",
    post: "نشر",
    youOffline: "أنت غير متصل حالياً",
    connectSee: "اتصل لرؤية أحدث المنشورات العالمية.",
    settings: "إعدادات الشبكة",
    noContent: "لا يوجد محتوى",
    startConv: "ابدأ المحادثة في",
    showLess: "عرض أقل",
    readMore: "قراءة المزيد",
    justNow: "الآن",
    ago: "مضت",
    retry: "إعادة المحاولة",
    uploadFailed: "فشل الرفع. انقر للمحاولة.",
    synced: "تمت المزامنة مع الشبكة العالمية",
    cidCopied: "تم نسخ المعرف!",
    reported: "تم الإبلاغ للمراجعة.",
    savePrivate: "تم الحفظ في الخاص",
    folder: "مجلد!",
    itemExists: "العنصر موجود بالفعل في الذاكرة الخاصة.",
    uploadSuccess: "تم الرفع بنجاح! منشورك الآن عالمي.",
    deleteConfirm: "هل أنت متأكد من حذف هذا المنشور؟",
    fillFields: "يرجى ملء جميع الحقول",
    enterName: "يرجى إدخال اسمك",
    enterEmail: "يرجى إدخال بريدك الإلكتروني"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('netnook_lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('netnook_lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language],
    isRTL: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
