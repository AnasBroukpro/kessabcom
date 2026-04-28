import React from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Heart, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { ViewType } from '../App';
import SearchHeader from '../components/SearchHeader';

interface Props {
  onNavigate: (view: ViewType) => void;
}

export default function TipsPage({ onNavigate }: Props) {
  const tips = [
    {
      title: "كيفاش تختار أضحية العيد؟",
      icon: <Search className="w-6 h-6" />,
      color: "bg-blue-100 text-blue-600",
      content: "تعرف على أهم العلامات اللي كتدل على صحة الحولي، بحال العينين اللي خصهم يكونو صافيين، والصوف اللي خاصو يكون نقي ومجموع، والحركة ديالو فالضيعة باش تضمن أضحية سليمة وخالية من الأمراض."
    },
    {
      title: "نصائح عند الشراء من المنصة",
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "bg-green-100 text-green-600",
      content: "دائماً تواصل مع الكساب عبر الهاتف أو الواتساب، واسأل على الموقع بالضبط. من الأحسن تمشي للضيعة وتشوف الحولي مباشرة قبل ما تعطي العربون."
    },
    {
      title: "طرق حفظ لحم الأضحية",
      icon: <Heart className="w-6 h-6" />,
      color: "bg-rose-100 text-rose-600",
      content: "أحسن الطرق باش تخزن اللحم فالثلاجة والمجمد باش يبقى طري وصحي لمدة أطول بلا ما يفقد المذاق ديالو أو يتعرض للتلف. قسم اللحم فميكات صغار على قد كل وجبة."
    }
  ];

  const guidelines = [
    "تأكد من وجود 'الحلقة' في أذن الأضحية لضمان مراقبة ONSSA.",
    "تجنب شراء الأضاحي التي تظهر عليها علامات العياء أو الكحة.",
    "اتفق مع الكساب على ثمن التوصيل مسبقاً إذا كان متوفراً.",
    "افحص أسنان الأضحية لمعرفة عمرها (سنان الحليب، ثني، إلخ)."
  ];

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
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] font-headline mb-4">نصائح وإرشادات</h1>
          <p className="text-[#4A4A4A] text-lg max-w-2xl mx-auto">
            من دبح الأضحية حتى للتخزين، جمعنا ليك أحسن النصائح باش تدوز عيدك فظروف زينة وصحية.
          </p>
        </motion.div>

        <div className="grid gap-8 mb-16">
          {tips.map((tip, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10 flex flex-col md:flex-row gap-6 items-start"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${tip.color}`}>
                {tip.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">{tip.title}</h2>
                <p className="text-[#4A4A4A] leading-relaxed">{tip.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-[#2E7D32] p-8 md:p-12 rounded-[40px] text-white relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8" />
              إرشادات صحية سريعة
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
              {guidelines.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-white mt-2 shrink-0"></div>
                  <p className="text-lg opacity-90">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-yellow-300 shrink-0" />
              <p className="text-sm font-medium">
                تنبيه: في حالة الشك بوجود تلاعب أو مرض في الأضحية، المرجو الاتصال ببيطري أو أقرب مصلحة لـ ONSSA.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
