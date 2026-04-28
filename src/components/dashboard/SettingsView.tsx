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
  const [settingsPhones, setSettingsPhones] = useState<string[]>(['', '', '']);
  const [settingsWhatsapps, setSettingsWhatsapps] = useState<string[]>(['', '', '']);
  const [settingsPseudo, setSettingsPseudo] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (profile) {
      setSettingsName(profile.displayName || profile.fullName || '');
      setSettingsCity(profile.location || '');
      
      const p = profile.phones || [profile.phoneNumber || '', '', ''];
      setSettingsPhones(Array.isArray(p) ? [...p, '', '', ''].slice(0, 3) : [profile.phoneNumber || '', '', '']);
      
      const w = profile.whatsapps || [profile.whatsappNumber || '', '', ''];
      setSettingsWhatsapps(Array.isArray(w) ? [...w, '', '', ''].slice(0, 3) : [profile.whatsappNumber || '', '', '']);
      
      setSettingsPseudo(profile.pseudo || '');
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
        phoneNumber: settingsPhones[0], // Primary for backward compatibility
        whatsappNumber: settingsWhatsapps[0], // Primary
        phones: settingsPhones.filter(p => p.trim() !== ''),
        whatsapps: settingsWhatsapps.filter(w => w.trim() !== ''),
        pseudo: settingsPseudo
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

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...settingsPhones];
    newPhones[index] = value;
    setSettingsPhones(newPhones);
  };

  const handleWhatsappChange = (index: number, value: string) => {
    const newWhatsapps = [...settingsWhatsapps];
    newWhatsapps[index] = value;
    setSettingsWhatsapps(newWhatsapps);
  };

  return (
    <div className="space-y-8" dir="rtl">
      <h2 className="text-2xl font-black text-on-surface font-headline">الإعدادات</h2>

      <div className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        {/* Cover Image */}
        <div className="h-48 bg-surface-variant relative group">
          {profile?.coverURL ? (
            <img src={profile.coverURL} className="w-full h-full object-cover" alt="Cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#2E7D32]/10 to-[#2E7D32]/5 flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-[#2E7D32]/40" />
            </div>
          )}
          <label className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-[#1A1A1A]">
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
          <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-xl relative group">
            {profile?.photoURL ? (
              <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
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
                      await refreshProfile();
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
          <div className="pt-10">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-[#1A1A1A]">{profile?.displayName || profile?.fullName || 'سي محمد'}</h3>
              <span className="px-2 py-0.5 bg-[#2E7D32]/10 text-[#2E7D32] text-[10px] font-bold rounded-full uppercase">
                {profile?.role === 'admin' ? 'مدير' : profile?.role === 'seller' ? 'كساب' : 'مشتري'}
              </span>
            </div>
            <p className="text-[#757575] text-sm">{profile?.phoneNumber}</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <form onSubmit={handleUpdateProfile} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#4A4A4A]">الاسم أو اللقب</label>
                <input 
                  type="text" 
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full p-4 bg-[#F9F9F6] border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all" 
                />
              </div>
              {profile?.role === 'seller' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#4A4A4A]">اللقب (ضيعة)</label>
                  <input 
                    type="text" 
                    value={settingsPseudo}
                    onChange={(e) => setSettingsPseudo(e.target.value)}
                    placeholder="مثلا: الحاج التهامي"
                    className="w-full p-4 bg-[#F9F9F6] border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all" 
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#4A4A4A]">المدينة</label>
                <select 
                  value={settingsCity}
                  onChange={(e) => setSettingsCity(e.target.value)}
                  className="w-full p-4 bg-[#F9F9F6] border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all"
                >
                  {moroccanCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multiple Phone Numbers Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
              <div className="space-y-4">
                <h4 className="font-black text-[#1A1A1A] flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#2E7D32] rounded-full"></div>
                  أرقام الهاتف (GSM)
                </h4>
                <div className="space-y-4">
                  {settingsPhones.map((phone, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-[10px] font-bold text-[#757575] mr-2">
                        {idx === 0 ? 'الرقم الرئيسي (سيظهر أولاً)' : `رقم إضافي ${idx}`}
                      </label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => handlePhoneChange(idx, e.target.value)}
                        placeholder="06XXXXXXXX"
                        className={`w-full p-4 bg-[#F9F9F6] border rounded-2xl focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all ${idx === 0 ? 'border-[#2E7D32]/30 ring-1 ring-[#2E7D32]/5' : 'border-outline-variant/20'}`} 
                        dir="ltr" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-[#1A1A1A] flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#25D366] rounded-full"></div>
                  أرقام الواتساب (WhatsApp)
                </h4>
                <div className="space-y-4">
                  {settingsWhatsapps.map((whatsapp, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-[10px] font-bold text-[#757575] mr-2">
                        {idx === 0 ? 'الواتساب الرئيسي (سيظهر أولاً)' : `واتساب إضافي ${idx}`}
                      </label>
                      <input 
                        type="tel" 
                        value={whatsapp}
                        onChange={(e) => handleWhatsappChange(idx, e.target.value)}
                        placeholder="06XXXXXXXX"
                        className={`w-full p-4 bg-[#F9F9F6] border rounded-2xl focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] outline-none transition-all ${idx === 0 ? 'border-[#25D366]/30 ring-1 ring-[#25D366]/5' : 'border-outline-variant/20'}`} 
                        dir="ltr" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row gap-4">
              <button 
                type="submit"
                disabled={isUpdatingProfile}
                className="px-10 py-4 bg-[#2E7D32] text-white rounded-2xl font-bold hover:bg-[#2E7D32]/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#2E7D32]/20"
              >
                {isUpdatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ التغييرات'}
                {updateSuccess && <CheckCircle2 className="w-5 h-5" />}
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (profile) {
                    setSettingsName(profile.displayName || profile.fullName || '');
                    setSettingsCity(profile.location || '');
                    const p = profile.phones || [profile.phoneNumber || '', '', ''];
                    setSettingsPhones([...p, '', '', ''].slice(0, 3));
                    const w = profile.whatsapps || [profile.whatsappNumber || '', '', ''];
                    setSettingsWhatsapps([...w, '', '', ''].slice(0, 3));
                    setSettingsPseudo(profile.pseudo || '');
                  }
                }}
                className="px-10 py-4 bg-[#F9F9F6] text-[#4A4A4A] rounded-2xl font-bold hover:bg-gray-100 transition-all border border-outline-variant/10"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-error/5 rounded-[10px] border border-error/20 p-8">
        <h3 className="text-lg font-bold text-error mb-2">منطقة الخطر</h3>
        <p className="text-sm text-on-surface-variant mb-4">بمجرد حذف حسابك، سيتم مسح جميع بياناتك وإعلاناتك بشكل نهائي. هاد العملية مايمكنش ترجع فيها.</p>
        <button className="px-6 py-2 bg-error text-on-error rounded-[10px] font-bold text-sm hover:bg-error/90 transition-all">حذف الحساب نهائياً</button>
      </div>
    </div>
  );
}
