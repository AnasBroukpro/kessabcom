import React, { useState } from 'react';
import { ArrowLeft, Calculator, Truck, BadgeCheck, Camera, Info, ShieldCheck } from 'lucide-react';

interface ToolsViewProps {
  // Add props if needed, but for now we'll move state inside if it's local
}

const ToolsView = ({}: ToolsViewProps) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [transportDist, setTransportDist] = useState('50');
  const [breed, setBreed] = useState('سردي');

  const getTransportCost = () => {
    const dist = parseInt(transportDist);
    if (dist <= 20) return 150;
    if (dist <= 50) return 300;
    return 300 + (dist - 50) * 5;
  };

  const getEstimatedPrice = () => {
    const basePrice = breed === 'سردي' ? 65 : breed === 'بركي' ? 62 : 60;
    return 50 * basePrice; // Default weight 50 for estimation
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-on-surface font-headline mb-2">أدوات المشتري</h2>
        <p className="text-on-surface-variant mb-8 text-lg">مجموعة من الأدوات باش تعاونك تختار وتشري أحسن حولي.</p>

        {activeTool === 'calculator' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">حاسبة الأثمنة التقديرية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">السلالة</label>
                  <select 
                    value={breed} 
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="سردي">سردي</option>
                    <option value="بركي">بركي</option>
                    <option value="تيمحضيت">تيمحضيت</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">الوزن التقديري (كلم)</label>
                  <input type="range" min="30" max="100" step="5" className="w-full" />
                  <div className="flex justify-between text-xs text-on-surface-variant font-bold">
                    <span>30 كلم</span>
                    <span>100 كلم</span>
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-primary font-bold mb-2">الثمن التقديري</p>
                <p className="text-5xl font-black text-primary">{getEstimatedPrice()} درهم</p>
                <p className="text-[10px] text-on-surface-variant mt-4 leading-relaxed">* هاد الثمن تقديري كايتغير حسب الجودة والمنطقة والسن ديال الحولي.</p>
              </div>
            </div>
          </div>
        ) : activeTool === 'transport' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">تقدير تكلفة النقل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">المسافة (كلم): {transportDist} كلم</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="500" 
                    value={transportDist}
                    onChange={(e) => setTransportDist(e.target.value)}
                    className="w-full" 
                  />
                  <div className="flex justify-between text-xs text-on-surface-variant font-bold">
                    <span>1 كلم</span>
                    <span>500 كلم</span>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold">نقل مهني ومؤمن</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold">ضمان وصول الحولي فصحة جيدة</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-blue-600 font-bold mb-2">تكلفة النقل التقريبية</p>
                <p className="text-4xl font-black text-blue-800">{getTransportCost()} درهم</p>
                <p className="text-[10px] text-blue-600 mt-2">* التكلفة كاتشمل التوصيل حتى لباب الدار مع المساعدة فالتفريغ</p>
              </div>
            </div>
          </div>
        ) : activeTool === 'delivery' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">تأكيد الاستلام والضمان</h3>
            <div className="space-y-6">
              <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                <h4 className="font-bold text-green-800 mb-2">كيفاش تأكد الطلب ديالك؟</h4>
                <p className="text-sm text-green-700 leading-relaxed">فاش يوصلك الحولي للدار، تأكد من الحالة ديالو ومن الأوراق (إلا كاينين). من بعد، دخل لهنا وكليكي على "تأكيد الاستلام" باش الكساب يتوصل بالخلاص ديالو.</p>
              </div>
              <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 text-center">
                <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-on-surface-variant font-bold mb-4">ما عندك حتى طلب حالياً فطور التوصيل</p>
                <button className="px-6 py-3 bg-primary/10 text-primary rounded-xl font-bold opacity-50 cursor-not-allowed">تأكيد الاستلام</button>
              </div>
            </div>
          </div>
        ) : activeTool === 'camera' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">تقدير الوزن بالذكاء الاصطناعي</h3>
            <div className="space-y-6">
              <div className="aspect-video bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-variant/50 transition-all group">
                <Camera className="w-12 h-12 text-on-surface-variant mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-on-surface">صور الحولي من الجنب</p>
                <p className="text-xs text-on-surface-variant mt-1">غادي نعطيوك وزن تقريبي بناءً على الصورة</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700 leading-relaxed">هاد الأداة كتعطي غير وزن تقديري. الوزن الحقيقي كيكون فالميزان فاش كيشري الواحد.</p>
              </div>
            </div>
          </div>
        ) : activeTool === 'guide' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">كيفاش تختار أحسن حولي؟</h3>
            <div className="space-y-6 text-on-surface">
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-primary">1. الحالة الصحية العامة</h4>
                <p className="text-sm leading-relaxed">تأكد بلي الحولي كايتحرك مزيان، عينيه صافيين ومافيهمش دموع، ونيف ديالو ناشف ومافيهش سيلان.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-primary">2. الصوف والجلد</h4>
                <p className="text-sm leading-relaxed">الصوف خاصها تكون نقية وماكاتطيحش بسهولة. الجلد خاصو يكون خالي من الجروح أو الحبوب.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-primary">3. الأسنان (السن)</h4>
                <p className="text-sm leading-relaxed">قلب السنان باش تعرف السن ديال الحولي (ثني، رباعي، سداسي...). الثني هو المفضل للأضحية.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-primary">4. التغذية</h4>
                <p className="text-sm leading-relaxed">سول الكساب على العلف اللي كايعطي للحوالا. العلف الطبيعي (شعير، تبن، فصة) هو الأحسن للجودة ديال اللحم.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { id: 'calculator', title: 'حاسبة الأثمنة', desc: 'قارن الأثمنة حسب السلالة والوز', icon: Calculator, color: 'bg-orange-100 text-orange-700' },
              { id: 'transport', title: 'تقدير النقل', desc: 'حسب تكلفة توصيل الحولي لدارك', icon: Truck, color: 'bg-blue-100 text-blue-700' },
              { id: 'delivery', title: 'تأكيد الاستلام', desc: 'أكد بلي وصلك الحولي فالموعد', icon: BadgeCheck, color: 'bg-green-100 text-green-700' },
              { id: 'guide', title: 'دليل السلالات', desc: 'تعرف على مميزات كل سلالة مغربية', icon: Info, color: 'bg-purple-100 text-purple-700' },
              { id: 'camera', title: 'تقدير الوزن بالصورة', desc: 'صور الحولي ونعطيوك وزن تقريبي', icon: Camera, color: 'bg-pink-100 text-pink-700' },
            ].map((tool, i) => (
              <button 
                key={i} 
                onClick={() => setActiveTool(tool.id)}
                className="flex items-center gap-6 p-6 bg-surface rounded-3xl border border-outline-variant/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-right group shadow-sm"
              >
                <div className={`w-16 h-16 rounded-2xl ${tool.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface mb-1">{tool.title}</p>
                  <p className="text-sm text-on-surface-variant">{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsView;
