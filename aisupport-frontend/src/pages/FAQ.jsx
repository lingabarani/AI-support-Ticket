import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Search } from 'lucide-react';
import ChatbotWidget from '../components/ChatbotWidget';

const faqs = [
  { q: 'How do I reset my password?', a: 'Go to the login page and click "Forgot Password". Enter your email address and we will send you a password reset link within 5 minutes.' },
  { q: 'How long does a refund take?', a: 'Refunds are typically processed within 5-7 business days. The time it appears in your account depends on your bank or payment provider.' },
  { q: 'How do I track my order?', a: 'You can track your order by logging into your account and navigating to "My Orders". Click on your order to see the tracking details.' },
  { q: 'How do I contact support?', a: 'You can raise a support ticket or email us at support@aisupport.com. Our team responds within 2 hours.' },
  { q: 'What are your support hours?', a: 'Ticket and email responses are handled Monday-Saturday, 9 AM to 8 PM IST.' },
];

export default function FAQ() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f0d1a, #1a1035)' }}>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/customer')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={15} /> Back
        </button>
        <h1 className="text-2xl font-bold text-white mb-2">FAQ & Knowledge Base</h1>
        <p className="text-slate-400 text-sm mb-6">Find answers to commonly asked questions</p>

        <div className="relative mb-6">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input placeholder="Search FAQs..." className="pl-11 pr-4 py-3 text-sm w-full rounded-xl" />
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="card-glass rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between px-5 py-4 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-sm font-medium text-white">{faq.q}</span>
                {open === i ? <ChevronDown size={15} className="text-purple-400 flex-shrink-0" /> : <ChevronRight size={15} className="text-slate-500 flex-shrink-0" />}
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-slate-400 border-t border-purple-900/20 pt-3">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
}
