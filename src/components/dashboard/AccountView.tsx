import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Shield, Calendar, Info, 
  Lock, Smartphone, Globe, Languages, Camera, Loader2, 
  CheckCircle2, AlertCircle, ChevronLeft, Bell, Settings,
  CreditCard, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { compressImage } from '../../lib/imageUtils';
import { useAuth } from '../../contexts/AuthContext';
import { updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface AccountViewProps {
  user: any;
  profile: any;
  settings: any;
  cities: string[];
}

const AccountView = ({ user, profile, settings, cities }: AccountViewProps) => {
  const { refreshProfile } = useAuth();
  const [activeAccountTab, setActiveAccountTab] = useState<'profile' | 'notifications' | 'security' | 'settings' | 'payment'>('profile');
  
  // Profile states
  const [newDisplayName, setNewDisplayName] = useState(profile?.fullName || profile?.displayName || '');
  const [newPhotoURL, setNewPhotoURL] = useState(profile?.photoURL || '');
  const [newPhoneNumber, setNewPhoneNumber] = useState(profile?.phoneNumber || '');
  const [newLocation, setNewLocation] = useState(profile?.location || '');
  
  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNewDisplayName(profile.fullName || profile.displayName || '');
      setNewPhotoURL(profile.photoURL || '');
      setNewPhoneNumber(profile.phoneNumber || '');
      setNewLocation(profile.location || '');
    }
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsPhotoUploading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 400, 400, 0.7);
          await firestoreService.updateProfile({ photoURL: compressed });
          setNewPhotoURL(compressed);
          await refreshProfile();
          setSuccess('تم تحديث الصورة الشخصية بنجاح!');
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError('فشل في رفع الصورة.');
        } finally {
          setIsPhotoUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsPhotoUploading(false);
      setError('فشل في معالجة الصورة.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: newDisplayName,
        photoURL: newPhotoURL
      });

      // Update Firestore profile via API
      await firestoreService.updateProfile({
        fullName: newDisplayName,
        displayName: newDisplayName,
        photoURL: newPhotoURL,
        phoneNumber: newPhoneNumber,
        location: newLocation
      });

      await refreshProfile();
      setSuccess('تم تحديث الملف الشخصي بنجاح!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('فشل في تحديث الملف الشخصي. المرجو المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('تم تغيير كلمة المرور بنجاح!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating password:', err);
      if (err.code === 'auth/wrong-password') {
        setError('كلمة المرور الحالية غير صحيحة.');
      } else {
        setError('فشل في تغيير كلمة المرور. المرجو المحاولة لاحقاً.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderProfileForm = () => (
    <form onSubmit={handleUpdateProfile} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider px-1">الاسم الكامل</label>
          <div className="relative">
            <input 
              type="text" 
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="مثلا: أحمد بناني"
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider px-1">رقم الهاتف</label>
          <div className="relative">
            <input 
              type="tel" 
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="06********"
              dir="ltr"
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider px-1">المدينة</label>
          <div className="relative">
            <select 
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-primary appearance-none transition-all"
            >
              <option value="">اختار المدينة</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 pointer-events-none" />
          </div>
        </div>
      </div>
      <button 
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        حفظ التغييرات
      </button>
    </form>
  );

  const renderSecurityForm = () => (
    <form onSubmit={handleUpdatePassword} className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <p className="text-xs text-orange-800 font-medium leading-relaxed">لتغيير كلمة المرور، يجب عليك إدخال كلمة المرور الحالية أولاً لدواعي أمنية.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider px-1">كلمة المرور الحالية</label>
          <div className="relative">
            <input 
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <button 
              type="button" 
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
            >
              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider px-1">كلمة المرور الجديدة</label>
            <div className="relative">
              <input 
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider px-1">تأكيد كلمة المرور</label>
            <div className="relative">
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
            </div>
          </div>
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading || !currentPassword || !newPassword}
        className="w-full py-4 bg-on-surface text-surface rounded-2xl font-black text-lg shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        تحديث كلمة المرور
      </button>
    </form>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">حسابي الشخصي</h2>
            <p className="text-on-surface-variant text-sm mt-1">إدارة معلوماتك الشخصية وتفضيلاتك في المنصة.</p>
          </div>
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <User className="w-6 h-6" />
          </div>
        </div>

        {(success || error) && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-200 ${success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="font-bold text-sm">{success || error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar / Profile Card */}
          <div className="space-y-6">
            <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 -z-10" />
              
              <div className="relative group mt-4">
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-surface-container-low ring-1 ring-outline-variant/10">
                  {newPhotoURL ? (
                    <img src={newPhotoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                      <User className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                  {isPhotoUploading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 left-0 p-2.5 bg-primary text-on-primary rounded-2xl shadow-lg cursor-pointer transform transition-transform hover:scale-110 active:scale-95 border-2 border-white">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isPhotoUploading} />
                </label>
              </div>

              <h3 className="mt-6 font-black text-xl text-on-surface">{newDisplayName || 'مستخدم كسابكوم'}</h3>
              <p className="text-on-surface-variant text-xs font-bold mt-1">{user?.email}</p>
              
              <div className="mt-6 w-full space-y-2">
                <button 
                  onClick={() => setActiveAccountTab('profile')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeAccountTab === 'profile' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <span className="font-bold text-sm">المعلومات الشخصية</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveAccountTab('security')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeAccountTab === 'security' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold text-sm">الأمان وكلمة السر</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveAccountTab('notifications')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeAccountTab === 'notifications' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5" />
                    <span className="font-bold text-sm">إعدادات التنبيهات</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-surface rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
              <h4 className="font-black text-sm text-on-surface mb-6 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                تفاصيل الحساب
              </h4>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase">البريد</p>
                    <p className="text-xs font-bold text-on-surface truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase">الدور</p>
                    <p className="text-xs font-bold text-on-surface">{profile?.role === 'seller' ? 'كساب (بائع)' : 'مشتري'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase">انضم في</p>
                    <p className="text-xs font-bold text-on-surface">
                      {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ar-MA') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm min-h-[400px]">
              {activeAccountTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <h4 className="text-xl font-black text-on-surface mb-8 flex items-center gap-3">
                    <Settings className="w-6 h-6 text-primary" />
                    المعلومات الشخصية
                  </h4>
                  {renderProfileForm()}
                </div>
              )}

              {activeAccountTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <h4 className="text-xl font-black text-on-surface mb-8 flex items-center gap-3">
                    <Lock className="w-6 h-6 text-primary" />
                    الأمان وكلمة السر
                  </h4>
                  {renderSecurityForm()}
                </div>
              )}

              {activeAccountTab === 'notifications' && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <h4 className="text-xl font-black text-on-surface mb-8 flex items-center gap-3">
                    <Bell className="w-6 h-6 text-primary" />
                    إعدادات التنبيهات
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: 'تنبيهات العروض الجديدة', desc: 'توصل بإشعار فاش شي كساب يصيفط ليك عرض', enabled: true },
                      { label: 'تنبيهات الرسائل', desc: 'إشعارات فاش يجاوبك شي كساب', enabled: true },
                      { label: 'تنبيهات التطبيق', desc: 'إشعارات حول التحديثات والعروض الخاصة', enabled: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10 group hover:border-primary/30 transition-all">
                        <div className="text-right">
                          <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{item.label}</p>
                          <p className="text-xs text-on-surface-variant font-medium mt-1">{item.desc}</p>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${item.enabled ? 'bg-primary' : 'bg-surface-container-high'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.enabled ? 'left-1' : 'right-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Tip */}
            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-start gap-5">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10 shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-black text-on-surface mb-1">نصيحة أمنية</h5>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  تأكد من اختيار كلمة مرور قوية وتغييرها بشكل دوري لضمان حماية حسابك ومعلوماتك الشخصية في منصة كسابكوم.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountView;
