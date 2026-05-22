import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, ShieldCheck, UserCheck, UserCog, Clock, ArrowLeft } from 'lucide-react';
import { ViewType } from '../App';
import SearchHeader from '../components/SearchHeader';

interface Props {
  onNavigate: (view: ViewType) => void;
}

const sections = [
  {
    icon: <Receipt className="w-6 h-6" />,
    color: 'bg-blue-100 text-blue-600',
    title: '📌 1. أحكام عامة',
    content: [
      'منصتنا هي وسيط رقمي فقط يربط بين المشتري والكساب (توفير أرقام الهواتف وموقع GPS).',
      'لا نتدخل في عملية البيع، الشراء، تحديد الأسعار، أو معاينة الأضاحي.',
      'عدم الاتفاق بين الطرفين لا يمنح الحق في استرداد رسوم المنصة.',
    ],
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    color: 'bg-red-100 text-red-600',
    title: '🛡️ 2. حالات النصب والتعاون مع السلطات',
    content: [
      'في حال تعرض المشتري للنصب أو الاحتيال من قِبل أي كساب، تلتزم المنصة بتزويد المشتري بجميع بيانات الكساب المتوفرة لدينا (الاسم، الهاتف، الموقع).',
      'يتم تقديم هذه البيانات للمشتري لتمكينه من تقديم شكاية رسمية لدى السلطات الأمنية والقضائية.',
      'لا تتحمل المنصة أي مسؤولية مالية أو تعويض عن عمليات النصب التي تتم خارج إطارها.',
    ],
  },
  {
    icon: <UserCheck className="w-6 h-6" />,
    color: 'bg-amber-100 text-amber-600',
    title: '👤 3. شروط الاسترداد للمشترين',
    content: [
      'الخدمة رقمية وتُستهلك فوراً، لذا الرسوم غير قابلة للاسترداد إلا في حالتين:',
      '1️⃣ حدوث خلل تقني (خصم المبلغ دون ظهور معلومات الكساب).',
      '2️⃣ تبين أن رقم الهاتف أو الموقع الجغرافي المعروض خاطئ تماماً أو خارج الخدمة بشكل دائم.',
    ],
  },
  {
    icon: <UserCog className="w-6 h-6" />,
    color: 'bg-green-100 text-green-600',
    title: '👨‍🌾 4. شروط الاسترداد للكسابة',
    content: [
      'يحق للكساب استرجاع مبلغ الاشتراك كاملاً بشرط استيفاء الشروط التالية معاً:',
      '1️⃣ عدم تلقي أي اتصال أو تواصل من أي مشتري عبر المنصة طوال فترة الإعلان.',
      '2️⃣ تقديم طلب الاسترداد بشكل إلكتروني حصرياً عبر الخانة المخصصة لذلك داخل المنصة (لا تقبل الطلبات عبر الهاتف أو الواتساب).',
      '3️⃣ إرسال الطلب قبل حلول يوم عيد الأضحى بـ 24 ساعة على الأقل.',
      '⚠️ أي طلب بعد هذه المهلة يُعتبر ملغياً تلقائياً.',
    ],
  },
  {
    icon: <Clock className="w-6 h-6" />,
    color: 'bg-purple-100 text-purple-600',
    title: '⏱️ 5. معالجة الطلبات',
    content: [
      'تخضع الطلبات للمراجعة والتحقق التقني من قِبل إدارة الموقع، ويتم الرد وإعادة الأموال في غضون أيام عمل قليلة عبر نفس طريقة الدفع الأصلية.',
    ],
  },
];

export default function RefundPolicyPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] antialiased" dir="rtl">
      <SearchHeader onNavigate={onNavigate} />
      
      <div className="max-w-4xl mx-auto pt-28 pb-16 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] font-headline mb-4">
            سياسة شروط استرداد الأموال في منصة kessabcom.ma 🟢
          </h1>
          <p className="text-[#4A4A4A] text-lg">
            أهلاً بكم في منصتنا. لتوضيح شروط وأحكام استرداد الأموال، يرجى قراءة النقاط التالية بعناية:
          </p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-8 rounded-[32px] border border-outline-variant/10"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${section.color}`}>
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold text-[#1A1A1A]">{section.title}</h2>
              </div>
              <div className="text-[#4A4A4A] leading-relaxed space-y-3">
                {section.content.map((item, i) => (
                  <p key={i} className={item.startsWith('⚠️') ? 'text-amber-700 font-medium' : ''}>{item}</p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

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
