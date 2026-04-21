import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SubscriptionViewProps {
  settings: any;
}

export default function SubscriptionView({ settings }: SubscriptionViewProps) {
  return (
    <div className="space-y-8" dir="rtl">
      <h2 className="text-2xl font-black text-on-surface font-headline">الاشتراك</h2>

      <div className="bg-primary/5 rounded-3xl border border-primary/20 p-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-4 text-center md:text-right">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary text-on-primary rounded-full text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>حساب مفعل</span>
          </div>
          <h3 className="text-3xl font-black text-on-surface">باقة الكساب المحترف</h3>
          <p className="text-on-surface-variant">صالحة لغاية: 15 يونيو 2026</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-on-surface-variant font-bold">الاستهلاك</p>
          <div className="w-48 h-3 bg-surface-container-high rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-primary"></div>
          </div>
          <p className="text-xs font-bold text-on-surface">15 من أصل 20 إعلان</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'الباقة العادية', price: 'مجانية', features: ['5 إعلانات', 'صور فقط', 'دعم عادي'], isFree: true },
          { name: 'باقة المحترف', price: '199 درهم/شهر', features: ['20 إعلان', 'صور وفيديو', 'دعم سريع', 'إحصائيات متقدمة'], active: true },
          { name: 'باقة الضيعة الكبيرة', price: '499 درهم/شهر', features: ['إعلانات غير محدودة', 'ترويج الإعلان', 'مدير حساب خاص', 'تصوير احترافي'] },
        ].filter(plan => !settings.paymentSystemEnabled || !plan.isFree).map((plan, i) => (
          <div key={i} className={`bg-surface p-8 rounded-3xl border shadow-sm flex flex-col justify-between ${plan.active ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/30'}`}>
            <div>
              <h4 className="text-xl font-black text-on-surface mb-2">{plan.name}</h4>
              <p className="text-2xl font-black text-primary mb-6">{plan.price}</p>
              <ul className="space-y-4 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button className={`w-full py-3 rounded-xl font-bold transition-all ${plan.active ? 'bg-surface-container-high text-on-surface cursor-default' : 'bg-primary text-on-primary hover:bg-primary/90'}`}>
              {plan.active ? 'باقتك الحالية' : 'ترقية الآن'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
