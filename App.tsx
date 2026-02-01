import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  UploadCloud, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Globe,
  MoreHorizontal,
  WifiOff,
  Wifi,
  Search,
  CheckCircle2,
  Database,
  Cloud,
  LogOut,
  Server,
  Smartphone,
  X,
  MessageCircle,
  Heart,
  User as UserIcon,
  Send,
  Paperclip,
  Tag,
  RefreshCw,
  LogIn,
  Trash2,
  Copy,
  Flag,
  Briefcase,
  Edit3,
  Camera,
  Share2,
  ArrowLeft,
  LayoutGrid,
  List as ListIcon,
  Maximize2,
  Mail,
  Lock,
  UserPlus,
  Languages
} from 'lucide-react';
import { Category, AppState, ContentItem, FirebaseConfig, Comment, UserProfile } from './types';
import * as StorageService from './services/storageService';
import * as FirebaseService from './services/firebase';
import { DEFAULT_CONFIG } from './defaultConfig';
import { useLanguage } from './LanguageContext';

// --- Helpers for Unicode Base64 ---
const encodeBase64 = (str: string) => {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
          return String.fromCharCode(parseInt(p1, 16));
  }));
};

const decodeBase64 = (str: string) => {
  try {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error("Decoding error", e);
    return atob(str); // Fallback for legacy ASCII only data
  }
};

// --- Expandable Text Component ---
const ExpandableText = ({ text, className }: { text: string, className?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();
  const limit = 150; // Character limit before truncation

  if (!text) return null;

  if (text.length <= limit) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className={className}>
      <span>
        {isExpanded ? text : text.substring(0, limit) + '... '}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="text-indigo-600 font-bold hover:underline text-xs ms-1 whitespace-nowrap"
      >
        {isExpanded ? t.showLess : t.readMore}
      </button>
    </div>
  );
};

// --- Media Lightbox Component (Fullscreen Viewer) ---
const MediaLightbox = ({ 
  src, 
  type, 
  onClose 
}: { 
  src: string; 
  type: 'image' | 'video'; 
  onClose: () => void 
}) => {
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" 
      onClick={onClose}
    >
       <button 
         onClick={onClose} 
         className="absolute top-4 right-4 text-white hover:text-slate-300 bg-white/10 p-2 rounded-full backdrop-blur-md z-50 transition-colors"
       >
         <X size={24} />
       </button>
       
       <div 
         className="relative max-w-full max-h-full flex items-center justify-center w-full h-full" 
         onClick={(e) => e.stopPropagation()}
       >
          {type === 'image' ? (
            <img 
              src={src} 
              alt="Fullscreen" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            />
          ) : (
            <video 
              src={src} 
              controls 
              autoPlay 
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl bg-black" 
            />
          )}
       </div>
    </div>
  );
}

// --- Splash Screen Component ---
const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const { t } = useLanguage();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-center p-4 text-white" dir="ltr">
      <div className="bg-indigo-600 p-6 rounded-full mb-6 animate-bounce shadow-2xl shadow-indigo-500/50">
        <Globe size={64} className="text-white" />
      </div>
      <h1 className="text-4xl font-bold mb-2 tracking-tight">{t.appName}</h1>
      <p className="text-lg text-indigo-200 font-light mb-8">{t.subTitle}</p>
      
      <div className="flex flex-col items-center gap-2">
         <span className="text-xs text-indigo-400 font-mono tracking-widest">{t.connecting}</span>
         <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
         </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

// --- Helper: Time Ago ---
const formatTimeAgo = (timestamp: number, t: Record<string, string>) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return t.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${t.ago}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${t.ago}`;
  return new Date(timestamp).toLocaleDateString();
};

// --- Helper: Convert Base64 to File for Sharing ---
const dataURLtoFile = (dataurl: string, filename: string) => {
  try {
    const arr = dataurl.split(',');
    const match = arr[0].match(/:(.*?);/);
    if (!match) return null;
    const mime = match[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  } catch (e) {
    console.error("Conversion error", e);
    return null;
  }
};

// --- Auth Modal Component ---
const AuthModal = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  allowClose = true
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onLoginSuccess: (user: UserProfile) => void;
  allowClose?: boolean;
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { t, isRTL } = useLanguage();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const { user, error } = await FirebaseService.loginWithGoogle();
    setIsLoading(false);
    
    if (user) {
      onLoginSuccess(user);
      onClose();
    } else if (error) {
      setError(error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t.fillFields);
      return;
    }
    if (isSignUp && !name) {
      setError(t.enterName);
      return;
    }

    setIsLoading(true);
    setError(null);

    let result;
    if (isSignUp) {
      result = await FirebaseService.registerWithEmail(email, password, name);
    } else {
      result = await FirebaseService.loginWithEmail(email, password);
    }

    setIsLoading(false);

    if (result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setError(result.error || "Authentication failed");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t.enterEmail);
      return;
    }
    setIsLoading(true);
    setError(null);

    const result = await FirebaseService.resetPassword(email);
    setIsLoading(false);

    if (result.success) {
      setResetSent(true);
      setError(null);
    } else {
      setError(result.error || "Failed to send reset email");
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm ${!allowClose ? 'bg-slate-900/90' : ''}`}>
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
        {allowClose && (
          <button 
            onClick={onClose} 
            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full`}
          >
            <X size={20} />
          </button>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {isForgotPassword ? "Reset Password" : (isSignUp ? t.createAccount : t.welcomeBack)}
          </h2>
          <p className="text-slate-500 text-sm">
            {isForgotPassword 
               ? (resetSent ? t.checkInbox : "Enter your email to receive instructions") 
               : (isSignUp ? t.joinNetwork : t.signInAccess)}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium mb-4 flex items-center gap-2">
            <span className="block w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            {error}
          </div>
        )}

        {isForgotPassword && resetSent ? (
           <div className="text-center animate-in fade-in">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <Mail size={32} />
             </div>
             <p className="text-slate-700 font-medium mb-2">{t.checkInbox}</p>
             <p className="text-slate-500 text-sm mb-6">{t.sentLink} <strong>{email}</strong>.</p>
             <button 
                onClick={() => { setIsForgotPassword(false); setResetSent(false); }}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
             >
                {t.backToSignIn}
             </button>
           </div>
        ) : (
          <form onSubmit={isForgotPassword ? handlePasswordReset : handleEmailAuth} className="space-y-4">
            {isSignUp && !isForgotPassword && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t.fullName}</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <UserIcon size={18} className="text-slate-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-transparent w-full outline-none text-sm text-slate-800"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">{t.email}</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <Mail size={18} className="text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-transparent w-full outline-none text-sm text-slate-800"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                   <label className="text-xs font-bold text-slate-500 uppercase">{t.password}</label>
                   {!isSignUp && (
                     <button 
                       type="button" 
                       onClick={() => { setIsForgotPassword(true); setError(null); }}
                       className="text-xs text-indigo-600 font-bold hover:underline"
                     >
                       {t.forgotPass}
                     </button>
                   )}
                </div>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <Lock size={18} className="text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent w-full outline-none text-sm text-slate-800"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                 isForgotPassword ? t.sendReset : (isSignUp ? t.signup : t.login)
              )}
            </button>
            
            {isForgotPassword && (
              <button 
                type="button" 
                onClick={() => { setIsForgotPassword(false); setError(null); }}
                className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                {t.cancel}
              </button>
            )}
          </form>
        )}

        {/* Footer for Switch Mode & Social - Hide if in Forgot Password */}
        {!isForgotPassword && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400 font-medium">{t.orContinue}</span>
              </div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              type="button"
              disabled={isLoading}
              className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t.google}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                {isSignUp ? t.alreadyHave : t.dontHave}
                <button 
                  onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                  className="text-indigo-600 font-bold ms-1 hover:underline"
                >
                  {isSignUp ? t.login : t.signup}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Share Modal Component ---
const ShareModal = ({ 
  item, 
  onClose 
}: { 
  item: ContentItem | null; 
  onClose: () => void 
}) => {
  const [qrUrl, setQrUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    if (item) {
      QRCode.toDataURL(item.cid)
        .then((url: string) => setQrUrl(url))
        .catch((err: any) => console.error(err));
    }
  }, [item]);

  if (!item) return null;

  const handleNativeShare = async () => {
    setIsSharing(true);
    const file = dataURLtoFile(item.data, item.fileName);
    
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: item.fileName,
          text: `Check out this content (CID: ${item.cid})`
        });
      } catch (error) {
        console.log("Share cancelled or failed", error);
      }
    } else {
      if (navigator.share) {
         navigator.share({
            title: item.fileName,
            text: `CID: ${item.cid}`,
            url: window.location.href
         }).catch(console.error);
      } else {
         alert("System sharing not supported on this device/browser. Use the QR code.");
      }
    }
    setIsSharing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center relative animate-in slide-in-from-bottom-10 duration-300">
        <button 
          onClick={onClose} 
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full`}
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-slate-800 mb-1">{t.localShare}</h3>
        <p className="text-slate-500 text-sm text-center mb-6">
          {t.shareDesc}
        </p>

        <div className="bg-white p-2 border-2 border-slate-100 rounded-xl mb-6 shadow-inner">
           {qrUrl ? (
             <img src={qrUrl} alt="CID QR Code" className="w-48 h-48" />
           ) : (
             <div className="w-48 h-48 bg-slate-100 animate-pulse rounded flex items-center justify-center text-slate-400">
               {t.generating}
             </div>
           )}
        </div>
        
        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 mb-6 text-center w-full">
           <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">{t.cidLabel}</span>
           <code className="text-xs font-mono text-slate-700 break-all select-all">{item.cid}</code>
        </div>

        <button 
          onClick={handleNativeShare}
          disabled={isSharing}
          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          {isSharing ? (
            <span className="animate-pulse">Opening Share Menu...</span>
          ) : (
            <>
              <Smartphone size={20} />
              <span>{t.openShare}</span>
            </>
          )}
        </button>
        <p className="text-[10px] text-slate-400 mt-3 text-center">
           {t.shareNote}
        </p>
      </div>
    </div>
  );
};

// --- Edit Post Modal ---
const EditPostModal = ({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: ContentItem; 
  onSave: (newText: string) => void; 
  onCancel: () => void 
}) => {
  // Extract initial text
  const initialText = item.fileType === 'text/plain' 
    ? decodeBase64(item.data.split(',')[1]) 
    : item.fileName;

  const [text, setText] = useState(initialText);
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Edit3 size={20} className="text-indigo-600" />
          {t.editPost}
        </h3>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm mb-4 resize-none"
          placeholder={t.whatsMind}
        />

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            {t.cancel}
          </button>
          <button 
            onClick={() => onSave(text)}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- User Profile View Component ---
const UserProfileView = ({ 
  user, 
  posts, 
  onEditProfile,
  onBack,
  renderPost 
}: { 
  user: UserProfile; 
  posts: ContentItem[]; 
  onEditProfile: () => void;
  onBack: () => void;
  renderPost: (item: ContentItem) => React.ReactNode;
}) => {
  const { t, isRTL } = useLanguage();
  const userPosts = posts.filter(p => p.authorId === user.uid);
  const totalLikes = userPosts.reduce((acc, post) => acc + (post.likes ? Object.keys(post.likes).length : 0), 0);

  return (
    <div className={`animate-in ${isRTL ? 'slide-in-from-left' : 'slide-in-from-right'} duration-300 bg-slate-100 min-h-screen`}>
      {/* Profile Header */}
      <div className="bg-white shadow-sm pb-6">
        <div className="max-w-2xl mx-auto pt-6 px-4">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-2 font-bold text-sm">
            {isRTL ? <ArrowLeft size={18} className="rotate-180" /> : <ArrowLeft size={18} />} {t.backFeed}
          </button>
          
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full p-1 border-4 border-indigo-50 shadow-xl mb-4 relative group">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={48} className="text-slate-400" />
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-1">{user.displayName}</h1>
            
            {user.profession && (
               <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                 <Briefcase size={12} />
                 {user.profession}
               </div>
            )}
            
            <button 
              onClick={onEditProfile}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Edit3 size={14} />
              {t.editProfile}
            </button>
          </div>

          <div className="flex justify-center gap-8 mt-8 border-t border-slate-100 pt-6">
            <div className="text-center">
               <div className="text-xl font-bold text-slate-900">{userPosts.length}</div>
               <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">{t.posts}</div>
            </div>
            <div className="text-center">
               <div className="text-xl font-bold text-slate-900">{totalLikes}</div>
               <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">{t.likes}</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts Grid */}
      <div className="max-w-2xl mx-auto p-4">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
           <LayoutGrid size={18} />
           {t.myPosts}
        </h2>
        {userPosts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400">
            <p>{t.noPosts}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map(post => renderPost(post))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Profile Setup Component ---
const ProfileSetup = ({ 
  user, 
  onSave 
}: { 
  user: UserProfile; 
  onSave: (p: { displayName: string; profession: string; photoURL?: string }) => void 
}) => {
  const [name, setName] = useState(user.displayName || '');
  const [profession, setProfession] = useState(user.profession || '');
  const [photo, setPhoto] = useState<string | undefined>(user.photoURL || undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await StorageService.fileToBase64(e.target.files[0]);
        setPhoto(base64);
      } catch (err) {
        console.error("Photo Error", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => fileRef.current?.click()}>
              {photo ? (
                <img src={photo} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={32} className="text-indigo-600" />
              )}
            </div>
            <button 
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md hover:bg-indigo-700"
            >
              <Camera size={14} />
            </button>
          </div>
          <input 
            type="file" 
            ref={fileRef} 
            onChange={handlePhotoSelect} 
            className="hidden" 
            accept="image/*"
          />
          <h2 className="text-2xl font-bold text-slate-800">{t.editProfile}</h2>
          <p className="text-slate-500 text-sm">{t.updateInfo}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.displayName}</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <UserIcon size={18} className="text-slate-400" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent w-full outline-none text-slate-800 font-medium"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.profession}</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <Briefcase size={18} className="text-slate-400" />
              <input 
                type="text" 
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="bg-transparent w-full outline-none text-slate-800 font-medium"
                placeholder="e.g. Developer, Student, Artist"
              />
            </div>
          </div>

          <button 
            onClick={() => {
              if (name.trim() && profession.trim()) {
                onSave({ displayName: name, profession, photoURL: photo });
              } else {
                alert("Please fill in both name and profession.");
              }
            }}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all mt-4"
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Network Settings Modal (Read-Only) ---
const NetworkSettings = ({ 
  isOpen, 
  onClose, 
  isConnected
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  isConnected: boolean;
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
             <Database className="text-indigo-600" />
             {t.networkStatus}
           </h2>
           <button onClick={onClose} className="text-slate-400 hover:text-red-500">✕</button>
        </div>

        <div className="text-center py-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isConnected ? 'bg-green-100 text-green-600 shadow-green-100' : 'bg-red-100 text-red-600 shadow-red-100'} shadow-xl`}>
             {isConnected ? <Wifi size={36} /> : <WifiOff size={36} />}
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {isConnected ? t.connected : t.offline}
          </h3>
          
          <p className="text-slate-500 text-sm mb-6 px-2">
            {isConnected 
              ? t.secureConn
              : t.noConn}
          </p>
          
          <button 
            onClick={onClose}
            className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Action Section Component (Updated) ---
const ActionSection = ({ 
  item, 
  userId, 
  isOnline, 
  onShare,
  onSave
}: { 
  item: ContentItem; 
  userId: string; 
  isOnline: boolean;
  onShare: () => void;
  onSave: () => void;
}) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const commentsList = item.comments ? Object.values(item.comments) : [];
  const { t } = useLanguage();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!commentText.trim() || !isOnline) return;
    const newComment: Comment = {
      id: '', // Generated by push
      text: commentText,
      userId: userId,
      userName: 'NetNooker',
      timestamp: Date.now()
    };
    await FirebaseService.addComment(item.cid, newComment);
    setCommentText('');
  };

  const handleReply = (userName: string) => {
    setCommentText(`@${userName} `);
    inputRef.current?.focus();
  };

  return (
    <div className="px-3 pb-3">
      {/* Unified Interaction Buttons */}
      <div className="flex items-center justify-between py-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <button 
            disabled={!isOnline}
            onClick={() => {
              if (isOnline) {
                const liked = item.likes?.[userId];
                FirebaseService.toggleLike(item.cid, userId, !!liked);
              } else {
                alert("Go online to like posts.");
              }
            }}
            className={`flex items-center gap-1.5 text-sm transition-colors ${item.likes?.[userId] ? 'text-red-500 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Heart size={18} fill={item.likes?.[userId] ? "currentColor" : "none"} />
            <span>{Object.keys(item.likes || {}).length}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <MessageCircle size={18} />
            <span>{commentsList.length}</span>
          </button>

          <button 
            onClick={onShare}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Share2 size={18} />
          </button>
        </div>

        <button 
           onClick={onSave}
           className="text-slate-400 hover:text-indigo-600 transition-colors"
           title="Save to Private"
        >
           <Download size={18} />
        </button>
      </div>

      {/* Comments List */}
      {showComments && (
        <div className="bg-slate-50 rounded-lg p-3 mt-1 animate-in fade-in slide-in-from-top-2">
           <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
             {commentsList.length === 0 ? (
               <p className="text-xs text-slate-400 text-center italic">No comments yet. Be the first!</p>
             ) : (
               commentsList.map((c, i) => (
                 <div key={i} className="flex gap-2 items-start group">
                   <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">
                     {c.userName.charAt(0)}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                         <span className="text-xs font-bold text-slate-700">{c.userName}</span>
                         <span className="text-[10px] text-slate-400">{formatTimeAgo(c.timestamp, t)}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 break-words">{c.text}</p>
                      
                      {/* Reply Button */}
                      {isOnline && (
                        <button 
                          onClick={() => handleReply(c.userName)}
                          className="text-[10px] text-indigo-500 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                        >
                          {t.reply}
                        </button>
                      )}
                   </div>
                 </div>
               ))
             )}
           </div>

           {/* Add Comment */}
           {isOnline ? (
             <div className="flex gap-2">
               <input 
                 ref={inputRef}
                 type="text" 
                 value={commentText}
                 onChange={(e) => setCommentText(e.target.value)}
                 placeholder={t.addComment}
                 className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400"
               />
               <button 
                 onClick={handleSubmit}
                 className={`bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors`}
               >
                 <Send size={14} className="rtl:rotate-180" />
               </button>
             </div>
           ) : (
             <p className="text-xs text-center text-slate-400 py-1">{t.connectToComment}</p>
           )}
        </div>
      )}
    </div>
  );
};

// --- Post Menu Component ---
const PostMenu = ({ 
  isOpen, 
  onClose, 
  onDelete, 
  onEdit,
  isAuthor, 
  cid 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onDelete: () => void; 
  onEdit: () => void;
  isAuthor: boolean; 
  cid: string;
}) => {
  const { t, isRTL } = useLanguage();
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose}></div>
      <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-8 bg-white rounded-lg shadow-xl border border-slate-100 w-40 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100`}>
        {isAuthor && (
          <>
            <button 
              onClick={() => { onEdit(); onClose(); }}
              className="w-full text-start px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
            >
              <Edit3 size={14} />
              {t.editPost}
            </button>
            <button 
              onClick={() => { onDelete(); onClose(); }}
              className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={14} />
              {t.deletePost}
            </button>
          </>
        )}
        <button 
          onClick={() => { navigator.clipboard.writeText(cid); onClose(); alert(t.cidCopied); }}
          className="w-full text-start px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        >
          <Copy size={14} />
          {t.copyId}
        </button>
        <button 
          onClick={() => { alert(t.reported); onClose(); }}
          className="w-full text-start px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        >
          <Flag size={14} />
          {t.report}
        </button>
      </div>
    </>
  );
};


// --- Main App Component ---
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Category | 'global'>('global');
  const [viewMode, setViewMode] = useState<'feed' | 'profile'>('feed'); // New view mode state

  const [data, setData] = useState<AppState>({ education: [], news: [], entertainment: [] });
  const [globalPosts, setGlobalPosts] = useState<ContentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // New State: Post Category Selection
  const [postCategory, setPostCategory] = useState<Category>('education');

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Sharing & Network
  const [showSettings, setShowSettings] = useState(false);
  const [shareItem, setShareItem] = useState<ContentItem | null>(null);
  
  // Editing State
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  
  // Media Viewing State (Fullscreen)
  const [viewingMedia, setViewingMedia] = useState<{ type: 'image' | 'video', src: string } | null>(null);

  const [isOnline, setIsOnline] = useState(false);

  // Auth State
  const [authInitialized, setAuthInitialized] = useState(false); // Track if Firebase checked session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false); // Controls the "Onboarding" modal
  const [showAuthModal, setShowAuthModal] = useState(false); // New: Auth Modal
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null); // For Three Dots menu
  
  // Local Identity & Unified Input
  const [localUserId] = useState(() => {
    let id = localStorage.getItem('netnook_local_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('netnook_local_user_id', id);
    }
    return id;
  });
  
  const [textPostContent, setTextPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t, language, setLanguage, isRTL } = useLanguage();

  // Initialize Data & Network
  useEffect(() => {
    const init = async () => {
      // 1. Load Local Content
      const loadedData = StorageService.loadData();
      setData(loadedData);

      // 2. Network Initialization (Always use default)
      await initDefaultNetwork();
    };
    init();
  }, []);

  const initDefaultNetwork = async () => {
    if (DEFAULT_CONFIG.apiKey === "PASTE_YOUR_API_KEY_HERE") {
       console.warn("Default Config not set by developer.");
       return;
    }
    const success = await FirebaseService.initFirebase(DEFAULT_CONFIG);
    if (success) {
      setIsOnline(true);
    }
  };

  useEffect(() => {
    let unsubscribePosts: (() => void) | undefined;
    let unsubscribeAuth: (() => void) | undefined;

    // Subscribe to global feed and Auth regardless of tab
    if (isOnline) {
      unsubscribePosts = FirebaseService.subscribeToGlobalFeed((posts) => {
        setGlobalPosts(posts);
      });
      
      unsubscribeAuth = FirebaseService.subscribeToAuth((user) => {
        // Mark auth as initialized once we get a response (either user or null)
        setAuthInitialized(true);
        
        if (user) {
           // Check if we have local extended profile info
           const storedProf = localStorage.getItem(`netnook_profile_${user.uid}`);
           if (storedProf) {
             const extended = JSON.parse(storedProf);
             setCurrentUser({ ...user, ...extended });
           } else {
             // No profession set? Trigger setup if strictly needed, or just set user
             setCurrentUser(user);
             if (!user.displayName) setShowProfileSetup(true);
           }
        } else {
          setCurrentUser(null);
        }
      });
    } else {
      // If offline or initialization failed, we still mark initialization as done 
      // so we don't block the screen forever (fallback to local mode in a real offline scenario, 
      // but here we enforce login for "netnook" vibe if connection works).
      // For now, let's assume if it fails, we default to no user.
      setTimeout(() => setAuthInitialized(true), 1000);
    }
    return () => {
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [isOnline]);

  // Sync Post Category with Tab if not Global
  useEffect(() => {
    if (activeTab !== 'global') {
      setPostCategory(activeTab as Category);
    }
  }, [activeTab]);

  const handleLoginSuccess = async (user: UserProfile) => {
    const storedProf = localStorage.getItem(`netnook_profile_${user.uid}`);
    let profession = '';
    if (storedProf) {
       profession = JSON.parse(storedProf).profession;
    }
    
    setCurrentUser({ ...user, profession: profession || user.profession });
    
    if ((!profession && !user.profession) || !user.displayName) {
       setShowProfileSetup(true);
    }
    
    setShowProfileMenu(false);
  };

  const handleLogout = async () => {
    await FirebaseService.logout();
    setCurrentUser(null); // Explicitly clear state (needed for Mock Mode)
    setViewMode('feed');
    setShowProfileMenu(false);
  };

  const handleProfileSave = async (profileData: { displayName: string; profession: string; photoURL?: string }) => {
     if (!currentUser) return;
     
     // Update Firebase Auth Profile (for online persistence)
     await FirebaseService.updateUserProfile(profileData.displayName, profileData.photoURL);

     const updatedUser = { ...currentUser, ...profileData };
     setCurrentUser(updatedUser);
     
     // Save profession locally as it's not a standard Firebase Auth field
     localStorage.setItem(`netnook_profile_${currentUser.uid}`, JSON.stringify({
       profession: profileData.profession
     }));
     
     setShowProfileSetup(false);
  };

  const handleRetryUpload = async (item: ContentItem) => {
    if (!isOnline) {
      alert("Please connect to the internet (Network Settings) to retry upload.");
      return;
    }
    
    try {
      // Attempt upload
      const result = await FirebaseService.uploadToCloud(item);
      
      if (result.success) {
         // Manually update local state to reflect synced status
         const cat = item.category as Category;
         const categoryList = data[cat] || [];
         const updatedList = categoryList.map(i => 
           i.cid === item.cid ? { ...i, isSynced: true } : i
         );
         const newData = { ...data, [cat]: updatedList };
         setData(newData);
         StorageService.saveData(newData);
         alert(t.uploadSuccess);
      } else {
         alert(`Retry Failed: ${result.error}\n\nPlease check your Network Settings.`);
      }
    } catch (error) {
       console.error("Critical error during retry:", error);
       alert("An unexpected error occurred while retrying. Please restart the app if this persists.");
    }
  };

  // --- Unified Upload Handler ---
  const handleUnifiedSubmit = async () => {
    if (!textPostContent.trim() && !selectedFile) return;
    setIsUploading(true);

    try {
      // Use selected Post Category
      const targetCategory: Category = postCategory;
      let cid, base64Data, fileName, fileType;

      if (selectedFile) {
        // Handle File Post (Image/Video)
        base64Data = await StorageService.fileToBase64(selectedFile);
        fileName = textPostContent.trim(); // Caption
        fileType = selectedFile.type;
      } else {
        // Handle Text Only Post
        base64Data = `data:text/plain;base64,${encodeBase64(textPostContent)}`;
        fileName = textPostContent.substring(0, 30) + (textPostContent.length > 30 ? '...' : '');
        fileType = 'text/plain';
      }

      cid = await StorageService.generateCID(base64Data);

      // User details logic
      const authorName = currentUser?.displayName || 'Anonymous';
      const authorId = currentUser?.uid || localUserId;
      const authorPhoto = currentUser?.photoURL || undefined;
      const authorProfession = currentUser?.profession || ''; // Include profession

      const newItem: ContentItem = {
        cid,
        fileName, // Now used as caption for media
        fileType,
        data: base64Data,
        timestamp: Date.now(),
        category: targetCategory,
        author: authorName,
        authorId: authorId,
        authorPhoto: authorPhoto,
        authorProfession: authorProfession,
        isSynced: false
      };

      // 1. UPDATE LOCAL STATE IMMEDIATELY (Optimistic UI)
      const prevCatData = data[targetCategory] || [];
      const updatedData = { ...data, [targetCategory]: [newItem, ...prevCatData] };
      setData(updatedData);
      StorageService.saveData(updatedData);

      // Reset Input
      setTextPostContent('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // 2. ATTEMPT UPLOAD TO GLOBAL
      if (isOnline) {
        try {
          const result = await FirebaseService.uploadToCloud(newItem);
          if (result.success) {
             // Update local item to be synced
             newItem.isSynced = true;
             const finalData = { 
               ...updatedData, 
               [targetCategory]: [newItem, ...updatedData[targetCategory].slice(1)]
             };
             setData(finalData);
             StorageService.saveData(finalData);
          } else {
            console.error("Upload failure:", result.error);
            alert(`Warning: Post saved LOCALLY ONLY.\nUpload failed: ${result.error}\nCheck Database Rules.`);
          }
        } catch (uploadError) {
          console.error("Crash prevention: Upload logic failed", uploadError);
          alert("Network error during upload. Post saved locally.");
        }
      } else {
         // Offline logic handled by isSynced: false
      }

    } catch (error) {
      console.error("Critical Post Creation Error:", error);
      alert('Error creating post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePost = async (cid: string) => {
    if(!window.confirm(t.deleteConfirm)) return;
    
    // Optimistic Delete
    const success = await FirebaseService.deletePost(cid);
    if (success) {
      // Remove from local data as well if exists
      const newData = { ...data };
      (['education', 'news', 'entertainment'] as Category[]).forEach(cat => {
         newData[cat] = newData[cat].filter(item => item.cid !== cid);
      });
      setData(newData);
      StorageService.saveData(newData);
      
      // Also update global posts state
      setGlobalPosts(prev => prev.filter(p => p.cid !== cid));
    } else {
      alert("Could not delete post (Check permissions or connection).");
    }
  };

  const handleUpdatePost = async (newText: string) => {
    if (!editingItem) return;
    
    // Logic: If it's a Text Post, we update 'data' (base64) and 'fileName' (truncated title).
    // If it's a Media Post, we update 'fileName' (which acts as the caption).
    const updates: Partial<ContentItem> = {};
    
    if (editingItem.fileType === 'text/plain') {
       updates.data = `data:text/plain;base64,${encodeBase64(newText)}`;
       updates.fileName = newText.substring(0, 30) + (newText.length > 30 ? '...' : '');
    } else {
       updates.fileName = newText;
    }
    
    // 1. Update Global
    if (isOnline) {
      const success = await FirebaseService.updatePost(editingItem.cid, updates);
      if (!success) {
        alert("Update failed. Check connection.");
        return;
      }
    } else {
       alert("You must be online to edit global posts.");
       return;
    }
    
    // 2. Update Local State (Optimistic or standard update)
    const newData = { ...data };
    const cat = editingItem.category as Category;
    if (newData[cat]) {
      newData[cat] = newData[cat].map(item => 
        item.cid === editingItem.cid ? { ...item, ...updates } : item
      );
      setData(newData);
      StorageService.saveData(newData);
    }

    setEditingItem(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveToPrivate = (item: ContentItem) => {
     const cat = item.category as Category || 'education';
     const catList = data[cat] || [];
     const exists = catList.some(i => i.cid === item.cid);
     if (exists) {
        alert(t.itemExists);
        return;
     }
     const updatedData = { ...data, [cat]: [item, ...catList] };
     setData(updatedData);
     StorageService.saveData(updatedData);
     alert(`${t.savePrivate} ${cat} ${t.folder}`);
  };

  // --- MERGE LOGIC ---
  const getMergedItems = () => {
    // 1. Flatten all local items
    const localItems = [
      ...(data.education || []),
      ...(data.news || []),
      ...(data.entertainment || [])
    ];

    // 2. Use a Map to dedup by CID
    const itemMap = new Map<string, ContentItem>();

    // Add global posts first (source of truth for likes/comments/synced status)
    globalPosts.forEach(item => {
      itemMap.set(item.cid, { ...item, isSynced: true });
    });

    // Add local items if they don't exist, OR if we need to show them.
    localItems.forEach(item => {
      if (!itemMap.has(item.cid)) {
        itemMap.set(item.cid, item);
      }
    });

    // Convert to array and sort by timestamp (newest first)
    return Array.from(itemMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  };

  // --- Render Helpers ---
  const allMergedItems = getMergedItems();
  
  const getDisplayItems = () => {
    if (activeTab === 'global') return allMergedItems;
    return allMergedItems.filter(i => i.category === activeTab);
  };

  const currentItems = getDisplayItems().filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const inTitle = item.fileName?.toLowerCase().includes(term);
    let inContent = false;
    if (item.fileType === 'text/plain') {
       try {
         const decoded = decodeBase64(item.data.split(',')[1]).toLowerCase();
         inContent = decoded.includes(term);
       } catch(e) {}
    }
    return inTitle || inContent;
  });

  // Reusable Post Renderer
  const renderPostCard = (item: ContentItem) => (
    <article key={item.cid} className="bg-white sm:rounded-xl shadow-sm border-y sm:border border-slate-200 overflow-hidden mb-4">
      <div className="p-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-100">
                {item.authorPhoto ? (
                  <img src={item.authorPhoto} alt="Author" className="w-full h-full object-cover" />
                ) : (
                  item.author ? item.author.charAt(0).toUpperCase() : '?'
                )}
            </div>
            <div>
                <div className="flex items-center gap-2">
                   <h4 className="font-bold text-slate-900 text-sm leading-tight">
                     {item.author || t.anonymous}
                   </h4>
                   {item.authorProfession && (
                     <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                       {item.authorProfession}
                     </span>
                   )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>{formatTimeAgo(item.timestamp, t)}</span>
                  <span>•</span>
                  <span className="uppercase text-[10px] bg-slate-100 px-1 rounded">{t[item.category] || item.category}</span>
                  
                  {item.isSynced ? (
                    <span className="text-green-500 ms-1 flex items-center" title={t.synced}>
                      <CheckCircle2 size={12} />
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleRetryUpload(item)}
                      className="text-amber-500 ms-1 flex items-center hover:bg-amber-100 rounded px-1 cursor-pointer transition-colors" 
                      title={t.uploadFailed}
                    >
                      <WifiOff size={12} />
                      <span className="text-[10px] ms-1 font-bold flex items-center gap-0.5">
                        {t.retry} <RefreshCw size={8} />
                      </span>
                    </button>
                  )}
                </div>
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setActiveMenuId(activeMenuId === item.cid ? null : item.cid)}
              className="text-slate-400 hover:bg-slate-50 p-1 rounded-full transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
            <PostMenu 
              isOpen={activeMenuId === item.cid}
              onClose={() => setActiveMenuId(null)}
              onDelete={() => handleDeletePost(item.cid)}
              onEdit={() => setEditingItem(item)}
              cid={item.cid}
              isAuthor={currentUser?.uid === item.authorId || item.authorId === localUserId}
            />
          </div>
      </div>

      <div className="w-full bg-slate-50 relative flex flex-col">
          <div className="px-4 py-2 bg-white text-start">
            {item.fileType === 'text/plain' ? (
              <ExpandableText 
                text={decodeBase64(item.data.split(',')[1])} 
                className="text-base text-slate-800 whitespace-pre-wrap leading-relaxed" 
              />
            ) : (
              item.fileName && item.fileName.length > 0 && (
                <ExpandableText 
                  text={item.fileName} 
                  className="text-sm text-slate-800 font-medium" 
                />
              )
            )}
          </div>

          {/* Media Rendering with Click-to-Fullscreen */}
          {item.fileType && item.fileType.startsWith('image/') && (
            <div 
              className="relative cursor-pointer group"
              onClick={() => setViewingMedia({ type: 'image', src: item.data })}
            >
              <img src={item.data} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" loading="lazy" />
              <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
                 <Maximize2 size={16} />
              </div>
            </div>
          )}
          
          {item.fileType && item.fileType.startsWith('video/') && (
            <div className="relative group">
              <video src={item.data} controls className="w-full max-h-[500px] bg-black" />
              <button 
                onClick={() => setViewingMedia({ type: 'video', src: item.data })}
                className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/80`}
                title="Full Screen"
              >
                 <Maximize2 size={16} />
              </button>
            </div>
          )}
      </div>

      <ActionSection 
        item={item} 
        userId={currentUser?.uid || localUserId} 
        isOnline={isOnline} 
        onShare={() => setShareItem(item)}
        onSave={() => handleSaveToPrivate(item)}
      />
    </article>
  );

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // --- Mandatory Login Screen Logic ---
  // If splash is done, but we are waiting for auth init, keep showing splash or loading
  // If auth initialized and no user, show mandatory login
  if (!authInitialized) {
     return <SplashScreen onFinish={() => {}} />; // Keep showing splash while initializing auth
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-slate-900 relative flex items-center justify-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        
        <div className="absolute top-4 right-4 z-50">
           <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-white/20 transition-colors"
           >
              <Languages size={14} />
              {language === 'en' ? 'العربية' : 'English'}
           </button>
        </div>

        <div className="relative z-10 w-full max-w-md px-4">
           <AuthModal 
             isOpen={true} 
             onClose={() => {}} 
             onLoginSuccess={handleLoginSuccess}
             allowClose={false}
           />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 font-sans">
      
      {/* Auth Modal (For additional security or re-auth if needed later, though usually handled by mandatory screen) */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
        allowClose={true}
      />
      
      {/* Profile Setup Modal */}
      {showProfileSetup && currentUser && (
        <ProfileSetup user={currentUser} onSave={handleProfileSave} />
      )}
      
      {/* Edit Post Modal */}
      {editingItem && (
        <EditPostModal 
          item={editingItem} 
          onSave={handleUpdatePost} 
          onCancel={() => setEditingItem(null)} 
        />
      )}

      {/* Fullscreen Media Viewer */}
      {viewingMedia && (
        <MediaLightbox 
          src={viewingMedia.src} 
          type={viewingMedia.type} 
          onClose={() => setViewingMedia(null)} 
        />
      )}

      {/* Modals */}
      <NetworkSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        isConnected={isOnline}
      />

      {shareItem && (
        <ShareModal 
          item={shareItem} 
          onClose={() => setShareItem(null)} 
        />
      )}

      {/* Main Content Area */}
      {viewMode === 'profile' && currentUser ? (
        <UserProfileView 
          user={currentUser} 
          posts={allMergedItems}
          onEditProfile={() => setShowProfileSetup(true)}
          onBack={() => setViewMode('feed')}
          renderPost={renderPostCard}
        />
      ) : (
        <>
          {/* AppBar */}
          <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-200">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                   <Globe size={20} className="text-white" />
                </div>
                <span className="font-bold text-xl text-slate-900 tracking-tight hidden sm:block">{t.appName}</span>
                <span className="font-bold text-xl text-slate-900 tracking-tight sm:hidden">NN</span>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-xs relative hidden sm:block">
                 <div className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-slate-400`}>
                    <Search size={14} />
                 </div>
                 <input 
                   type="text" 
                   placeholder={t.search} 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className={`w-full bg-slate-100 border-none rounded-full py-1.5 ${isRTL ? 'pr-8 pl-4' : 'pl-8 pr-4'} text-sm focus:ring-2 focus:ring-indigo-200 outline-none transition-all`}
                 />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                 {/* Language Toggle */}
                 <button 
                    onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                    className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors hidden sm:block"
                    title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                 >
                    <Languages size={20} />
                 </button>

                 {/* Profile / Auth Menu */}
                 <div className="relative">
                    {currentUser ? (
                      <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {currentUser.displayName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setShowAuthModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <LogIn size={14} />
                        <span className="hidden sm:inline">{t.login}</span>
                      </button>
                    )}

                    {/* Profile Dropdown */}
                    {showProfileMenu && currentUser && (
                      <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 z-50`}>
                        <div className="px-4 py-2 border-b border-slate-50 mb-1">
                          <p className="font-bold text-slate-800 text-sm truncate">{currentUser.displayName}</p>
                          <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                          {currentUser.profession && (
                            <p className="text-[10px] text-indigo-600 font-bold uppercase mt-1 tracking-wide">{currentUser.profession}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => { setViewMode('profile'); setShowProfileMenu(false); }}
                          className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                          <UserIcon size={14} />
                          {t.myProfile}
                        </button>
                        <button 
                           onClick={() => { setLanguage(language === 'en' ? 'ar' : 'en'); setShowProfileMenu(false); }}
                           className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors sm:hidden"
                        >
                           <Languages size={14} />
                           {language === 'en' ? 'العربية' : 'English'}
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={14} />
                          {t.signOut}
                        </button>
                      </div>
                    )}
                 </div>

                 <button 
                    onClick={() => setShowSettings(true)}
                    className={`p-2 rounded-full transition-colors ${isOnline ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                 >
                    {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                 </button>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="bg-white border-b border-slate-200">
               <div className="max-w-2xl mx-auto flex overflow-x-auto no-scrollbar">
                <button
                   onClick={() => setActiveTab('global')}
                   className={`flex-1 min-w-[80px] py-3 text-center text-xs sm:text-sm font-bold uppercase tracking-wider relative transition-colors flex items-center justify-center gap-1 ${
                   activeTab === 'global' ? 'text-purple-600 bg-purple-50/50' : 'text-slate-400 hover:text-purple-500'
                   }`}
                >
                   <Globe size={14} />
                   {t.all}
                   {activeTab === 'global' && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full" />
                   )}
                </button>
                {(['education', 'news', 'entertainment'] as Category[]).map((tab) => (
                   <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 min-w-[80px] py-3 text-center text-xs sm:text-sm font-semibold capitalize relative transition-colors ${
                      activeTab === tab ? 'text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                   >
                      {t[tab] || tab}
                      {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                      )}
                   </button>
                ))}
               </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto p-0 sm:p-4 space-y-4 mt-2 sm:mt-0">
            {/* Create Post Box */}
            <div className="bg-white sm:rounded-xl p-4 shadow-sm border-y sm:border border-slate-200">
              
              {activeTab === 'global' && (
                <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
                    <Tag size={12}/> {t.postTo}
                  </span>
                  {(['education', 'news', 'entertainment'] as Category[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setPostCategory(cat)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all whitespace-nowrap capitalize ${
                        postCategory === cat
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-200'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {t[cat] || cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                    {currentUser?.photoURL ? (
                       <img src={currentUser.photoURL} alt="Me" className="w-full h-full object-cover" />
                    ) : (
                       <UserIcon size={20} className="text-slate-400" />
                    )}
                </div>
                
                <div className="flex-1">
                    <textarea
                      value={textPostContent}
                      onChange={(e) => setTextPostContent(e.target.value)}
                      placeholder={
                        currentUser 
                        ? `${currentUser.displayName?.split(' ')[0]}, ${t.whatsMind}`
                        : selectedFile 
                          ? `${t.caption} ${selectedFile.name}...` 
                          : `${t.postTo} ${t[postCategory] || postCategory} (${t.anonymous})...`
                      }
                      className="w-full bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[60px] resize-none"
                    />
                    
                    {selectedFile && (
                      <div className="mt-2 flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium">
                        <ImageIcon size={14} />
                        <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                        <button onClick={() => setSelectedFile(null)} className="ms-auto hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 px-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*,video/*"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                    title={t.attach}
                  >
                      <Paperclip size={20} />
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-1"></div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                      {isOnline ? (
                        <span className="text-green-600 flex items-center gap-1"><Globe size={12}/> {t.public}</span>
                      ) : (
                        <span className="flex items-center gap-1"><WifiOff size={12}/> {t.local}</span>
                      )}
                  </div>
                </div>

                <button 
                    onClick={handleUnifiedSubmit}
                    disabled={isUploading || (!textPostContent.trim() && !selectedFile)}
                    className="bg-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    {isUploading ? t.posting : (
                      <>
                        <Send size={14} className="rtl:rotate-180" />
                        {t.post}
                      </>
                    )}
                </button>
              </div>
            </div>

            {!isOnline && (
              <div className="bg-amber-50 border border-amber-100 text-amber-600 p-4 rounded-xl text-center flex flex-col items-center">
                  <Cloud size={32} className="mb-2 opacity-50" />
                  <p className="font-bold">{t.youOffline}</p>
                  <p className="text-sm opacity-80 mb-2">{t.connectSee}</p>
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="text-xs bg-white border border-amber-200 px-3 py-1 rounded-full shadow-sm"
                  >
                    {t.settings}
                  </button>
              </div>
            )}

            {currentItems.length === 0 ? (
              <div className="bg-white sm:rounded-xl p-8 text-center border-y sm:border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">{t.noContent}</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {t.startConv} <b>{activeTab === 'global' ? t.all : (t[activeTab as Category] || activeTab)}</b>!
                </p>
              </div>
            ) : (
              currentItems.map((item) => renderPostCard(item))
            )}
          </main>
        </>
      )}
    </div>
  );
}