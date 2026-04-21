import React, { useState, useEffect } from 'react';
import { Camera, User, CheckCircle2, Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { compressImage } from '../../lib/imageUtils';
import { cityCoords } from '../../constants/cityMapping';

const moroccanCities = Object.keys(cityCoords);

interface SettingsViewProps {
  profile: any;
  user: any;
}

export default function SettingsView({ profile, user }: SettingsViewProps) {
  const [settingsName, setSettingsName] = useState('');
  const [settingsCity, setSettingsCity] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsWhatsapp, setSettingsWhatsapp] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (profile) {
      setSettingsName(profile.displayName || profile.fullName || '');
      setSettingsCity(profile.location || 'سطات');
      setSettingsPhone(profile.phoneNumber || '');
      setSettingsWhatsapp(profile.whatsappNumber || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await firestoreService.updateProfile({
        displayName: settingsName,
        fullName: settingsName,
        location: settingsCity,
        phoneNumber: settingsPhone,
        whatsappNumber: settingsWhatsapp
      });
      await refreshProfile();
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <h2 className="text-2xl font-black text-on-surface font-headline">الإعدادات</h2>

      <div className="bg-surface rounded-3xl border border-outline-variant/30 overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-surface-variant relative group">
          {profile?.coverURL ? (
            <img src={profile.coverURL} className="w-full h-full object-cover" alt="Cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-primary/40" />
            </div>
          )}
          <label className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-on-surface">
              <Camera className="w-4 h-4" />
              <span>تغيير غلاف الضيعة</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && user) {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const compressed = await compressImage(reader.result as string, 1200, 400, 0.7);
                    await firestoreService.updateProfile({ coverURL: compressed });
                    await refreshProfile();
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>

        <div className="p-8 border-b border-outline-variant/20 flex items-center gap-6 -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-surface flex items-center justify-center overflow-hidden border-4 border-surface shadow-xl relative group">
            {profile?.photoURL ? (
              <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-10 h-10 text-on-surface-variant" />
            )}
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && user) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const compressed = await compressImage(reader.result as string, 400, 400, 0.7);
                      await firestoreService.updateProfile({ photoURL: compressed });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
          <div className="pt-10">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-on-surface">{profile?.displayName || profile?.fullName || 'سي محمد'}</h3>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">
                {profile?.role === 'admin' ? 'مدير' : profile?.role === 'seller' ? 'كساب' : 'مشتري'}
              </span>
            </div>
            <p className="text-on-surface-variant text-sm">{profile?.phoneNumber}</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">الاسم أو اللقب</label>
                <input 
                  type="text" 
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">المدينة</label>
                <select 
                  value={settingsCity}
                  onChange={(e) => setSettingsCity(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                >
                  {moroccanCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">رقم الهاتف</label>
                <input 
                  type="tel" 
                  value={settingsPhone}
                  onChange={(e) => setSettingsPhone(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                  dir="ltr" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">واتساب</label>
                <input 
                  type="tel" 
                  value={settingsWhatsapp}
                  onChange={(e) => setSettingsWhatsapp(e.target.value)}
                  placeholder="مثلا: 0600880088"
                  className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                  dir="ltr" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row gap-4">
              <button 
                type="submit"
                disabled={isUpdatingProfile}
                className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التغييرات'}
                {updateSuccess && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (profile) {
                    setSettingsName(profile.displayName || profile.fullName || '');
                    setSettingsCity(profile.location || 'سطات');
                    setSettingsPhone(profile.phoneNumber || '');
                    setSettingsWhatsapp(profile.whatsappNumber || '');
                  }
                }}
                className="px-8 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold hover:bg-surface-variant transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-error/5 rounded-3xl border border-error/20 p-8">
        <h3 className="text-lg font-bold text-error mb-2">منطقة الخطر</h3>
        <p className="text-sm text-on-surface-variant mb-4">بمجرد حذف حسابك، سيتم مسح جميع بياناتك وإعلاناتك بشكل نهائي. هاد العملية مايمكنش ترجع فيها.</p>
        <button className="px-6 py-2 bg-error text-on-error rounded-lg font-bold text-sm hover:bg-error/90 transition-all">حذف الحساب نهائياً</button>
      </div>
    </div>
  );
}
