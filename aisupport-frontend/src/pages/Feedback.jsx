import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, CheckCircle } from 'lucide-react';
import ChatbotWidget from '../components/ChatbotWidget';

export default function Feedback() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0d1a, #1a1035)' }}>
      <div className="text-center card-glass rounded-2xl p-12 max-w-sm">
        <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Thank You!</h2>
        <p className="text-slate-400 text-sm mb-6">Your feedback helps us improve our service.</p>
        <button onClick={() => navigate('/customer')} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold">Back to Home</button>
      </div>
      <ChatbotWidget />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0f0d1a, #1a1035)' }}>
      <div className="max-w-md w-full">
        <button onClick={() => navigate('/customer')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="card-glass rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white mb-2 text-center">Rate Your Experience</h1>
          <p className="text-sm text-slate-400 text-center mb-8">How satisfied are you with our support?</p>

          <div className="flex justify-center gap-2 mb-6">
            {[1,2,3,4,5].map(s => (
              <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}>
                <Star size={32} className={`transition-colors ${s <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>

          <div className="text-center text-sm text-slate-400 mb-6">
            {rating === 0 ? 'Click to rate' : ['','Very Poor','Poor','Neutral','Good','Excellent'][rating]}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Ticket Reference (optional)</label>
              <input placeholder="e.g. TKT-10245" className="w-full px-3 py-2.5 text-sm rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Your Comments</label>
              <textarea rows={4} placeholder="Tell us about your experience..." className="w-full px-3 py-2.5 text-sm rounded-lg resize-none" />
            </div>
            <button onClick={() => setSubmitted(true)} disabled={!rating} className="btn-primary w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
}
