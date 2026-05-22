import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, Phone, Clock, ShieldAlert, Search, Eye, CheckCircle, AlertTriangle, Lightbulb, ArrowLeft } from 'lucide-react';
import { ViewType } from '../App';
import SearchHeader from '../components/SearchHeader';

interface Props {
  onNavigate: (view: ViewType) => void;
}

interface TipSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
}

const sellerTips: TipSection[] = [
  {
    title: '📍 حدد موقعك بدقة',
    icon: <MapPin className="w-6 h-6" />,
    color: 'bg-blue-100 text-blue-600',
    items: [
      'قم بتفعيل الجي بي إس (GPS) وأنت متواجد داخل الكوري لضمان وصول المشتري إليك مباشرة دون عناء.',
    ],
  },
  {
    title: '📸 المصداقية في الصور',
    icon: <Camera className="w-6 h-6" />,
    color: 'bg-green-100 text-green-600',
    items: [
      'التقط صوراً حقيقية وحديثة لأضاحيك، وتجنب الصور المنقولة من الإنترنت لبناء ثقة مع الزبائن.',
    ],
  },
  {
    title: '📲 طلب استرداد الاشتراك',
    icon: <Phone className="w-6 h-6" />,
    color: 'bg-amber-100 text-amber-600',
    items: [
      'إذا لم تتلقَ أي اتصال وتريد استرجاع مبلغ اشتراكك، قدم الطلب حصرياً عبر الخانة المخصصة لذلك داخل حسابك في المنصة.',
    ],
  },
  {
    title: '⏱️ احترم الوقت',
    icon: <Clock className="w-6 h-6" />,
    color: 'bg-purple-100 text-purple-600',
    items: [
      'يجب إرسال طلب استرداد الإلكتروني قبل يوم العيد بـ 24 ساعة على الأقل، وإلا يُعتبر الطلب ملغياً.',
    ],
  },
];

const buyerTips: TipSection[] = [
  {
    title: '⚠️ تحذير أمني هام جداً',
    icon: <ShieldAlert className="w-6 h-6" />,
    color: 'bg-red-100 text-red-600',
    items: [
      'لا ترسل أي تسبيق مالي أو عربون للكساب عبر وكالات تحويل الأموال أو الحسابات البنكية قبل أن تذهب بنفسك وتُعاين الأضحية على أرض الواقع!',
    ],
  },
  {
    title: '📞 تأكد قبل الانطلاق',
    icon: <Phone className="w-6 h-6" />,
    color: 'bg-teal-100 text-teal-600',
    items: [
      'اتبع مسار الـ GPS بدقة للوصول للكساب، وننصحك بالاتصال به هاتفياً قبل الانطلاق لتأكيد تواجده.',
    ],
  },
];

const inspectionTips: TipSection[] = [
  {
    title: '1️⃣ فحص مكان الكساب',
    icon: <Search className="w-6 h-6" />,
    color: 'bg-indigo-100 text-indigo-600',
    items: [
      'استكشف رائحة المكان (الكوري)؛ يجب أن تكون تهويته جيدة ولا تفوح منه روائح عفونة شديدة.',
      'تفقد نظافة المكان الذي يأكل وينام فيه الخروف؛ نظافة المعالف والمضاجع تدل على عناية الكساب بصحة قطيعه.',
    ],
  },
  {
    title: '2️⃣ مراقبة حيوية الخروف',
    icon: <Eye className="w-6 h-6" />,
    color: 'bg-blue-100 text-blue-600',
    items: [
      'لاحظ حركة الأضحية؛ يجب أن يتحرك الخروف بحيوية ونشاط، وتجنب تماماً الخروف الخامل أو المنعزل في الزاوية.',
      'تأكد أن الخروف يقف جيداً على قوائمه الأربعة بشكل متوازن ولا يعاني من عرج أو صعوبة في الوقوف والنهوض.',
    ],
  },
  {
    title: '3️⃣ فحص السن (تحديد العمر الشرعي)',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'bg-emerald-100 text-emerald-600',
    items: [
      'افتح فم الخروف بلطف لرؤية الأسنان الأمامية في الفك السفلي:',
      'جذع (أقل من سنة): تكون الأسنان كلها لبنية بيضاء وصغيرة الحجم ومتساوية.',
      'ثني (سنة إلى سنة ونصف): يسقط السنان اللبنيان في الوسط ويظهر مكانهما سنان طويلان وعريضان (وهذا السن المجزئ شرعاً وعادة ما يبحث عنه الناس).',
      'رباع (سنتان): يظهر 4 أسنان عريضة في الوسط.',
    ],
  },
  {
    title: '4️⃣ البحث الجسدي والصحي',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'bg-rose-100 text-rose-600',
    items: [
      'مرر يدك على جسم الخروف (الظهر والرقبة) لجس اللحم والتأكد من أنه ممتلئ وليس مجرد صوف وعظام.',
      'ابحث بدقة في جسمه عن وجود أي ثآليل (تآليل)، أو أورام، أو جروح، أو حشرات.',
      '⚠️ فحص الخصيتين: تأكد من وجود الخصيتين في كيس الصفن، وأن تكونا بارزتين وسليمتين من أي تضخم، أو أورام، أو جروح.',
      'تأكد من خلوه من علامات المرض (مثل: إفرازات الأنف أو الفم، الإسهال، احمرار العينين، أو السعال).',
    ],
  },
];

export default function TipsPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] antialiased" dir="rtl">
      <SearchHeader onNavigate={onNavigate} />
      
      <div className="max-w-4xl mx-auto py-12 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-6">
            <Lightbulb className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] font-headline mb-4">دليل النصائح والإرشادات لمستخدمي منصة kessabcom.ma 💡</h1>
          <p className="text-[#4A4A4A] text-lg max-w-2xl mx-auto">
            مرحباً بكم في منصتكم كسابكم. لضمان تجربة آمنة وموثوقة للجميع خلال موسم عيد الأضحى، نرجو اتباع الإرشادات التالية:
          </p>
        </motion.div>

        {/* Seller Tips */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-[#1A1A1A] mb-8 text-right">👨‍🌾 أولاً: للكساب (البائع)</h2>
          <div className="grid gap-6">
            {sellerTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tip.color}`}>
                    {tip.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">{tip.title}</h3>
                </div>
                <ul className="text-[#4A4A4A] leading-relaxed space-y-2 list-disc pr-6">
                  {tip.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Buyer Tips */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-[#1A1A1A] mb-8 text-right">👤 ثانياً: للمشتري (الزبون)</h2>
          <div className="grid gap-6">
            {buyerTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-[32px] shadow-sm border ${tip.title.includes('تحذير') ? 'bg-red-50 border-red-200' : 'bg-white border-outline-variant/10'}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tip.color}`}>
                    {tip.icon}
                  </div>
                  <h3 className={`text-xl font-bold ${tip.title.includes('تحذير') ? 'text-red-700' : 'text-[#1A1A1A]'}`}>{tip.title}</h3>
                </div>
                <ul className={`leading-relaxed space-y-2 list-disc pr-6 ${tip.title.includes('تحذير') ? 'text-red-600' : 'text-[#4A4A4A]'}`}>
                  {tip.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Inspection Guide */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-[#1A1A1A] mb-8 text-right">🧐 ثالثاً: دليل المشتري لفحص الأضحية والمكان (عند الزيارة)</h2>
          <div className="grid gap-6">
            {inspectionTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tip.color}`}>
                    {tip.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">{tip.title}</h3>
                </div>
                <ul className="text-[#4A4A4A] leading-relaxed space-y-2 list-disc pr-6">
                  {tip.items.map((item, i) => (
                    <li key={i} className={item.startsWith('⚠️') ? 'text-amber-700 font-medium' : ''}>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Report Button Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-[#2E7D32] p-8 md:p-12 rounded-[40px] text-white relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-300" />
              🚨 رابعاً: استخدام زر التبليغ وحالات النصب
            </h2>
            <p className="text-lg opacity-90 leading-relaxed">
              إذا وجدت معلومات خاطئة، أو صور مضللة، أو أي اشتباه في النصب، يمكنك استخدام زر التبليغ الموجود في إعلان الكساب. سنقوم باتخاذ الإجراءات اللازمة فوراً.
            </p>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-[#2E7D32] font-bold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
