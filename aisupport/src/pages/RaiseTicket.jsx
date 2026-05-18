import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { pipelineApi } from '../services/api';
import ChatbotWidget from '../components/ChatbotWidget';

export default function RaiseTicket() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [form, setForm] = useState({ category: '', subject: '', description: '', priority: 'Medium', email: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await pipelineApi.createTicket({
        customer_email: form.email || 'frontend.user@example.com',
        category: form.category,
        product: 'Web Portal',
        priority: form.priority,
        issue_description: `${form.subject}\n\n${form.description}`,
        customer_segment: 'Customer Portal',
        channel: 'Web',
        region: 'India',
      });
      setTicketId(result.ticket.ticket_id);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0d1a, #1a1035)' }}>
      <div className="text-center card-glass rounded-2xl p-12 max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Ticket Submitted!</h2>
        <p className="text-slate-400 text-sm mb-2">Your ticket was sent to the AWS pipeline.</p>
        <p className="text-purple-400 font-mono text-sm mb-6">Ticket ID: {ticketId}</p>
        <button onClick={() => navigate('/customer/tickets')} className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold">
          View My Tickets
        </button>
      </div>
      <ChatbotWidget />
    </div>
  );

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f0d1a, #1a1035)' }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/customer')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={15} /> Back to Home
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="card-glass rounded-2xl p-6">
              <h1 className="text-xl font-bold text-white mb-1">Raise a New Ticket</h1>
              <p className="text-sm text-slate-400 mb-6">Please provide details about your issue</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg">
                    <option value="">Select Category</option>
                    <option>Login Issues</option>
                    <option>Payment Issues</option>
                    <option>Order & Delivery</option>
                    <option>Refunds</option>
                    <option>Product Defect</option>
                    <option>Feature Request</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Subject *</label>
                  <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Enter subject" className="w-full px-3 py-2.5 text-sm rounded-lg" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" className="w-full px-3 py-2.5 text-sm rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Description *</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={5} placeholder="Describe your issue in detail..." className="w-full px-3 py-2.5 text-sm rounded-lg resize-none" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Attachment (optional)</label>
                  <div className="flex items-center gap-3 p-4 rounded-lg cursor-pointer" style={{ border: '2px dashed rgba(139,92,246,0.2)' }}>
                    <Upload size={16} className="text-slate-500" />
                    <span className="text-sm text-slate-400">Choose File</span>
                    <span className="text-xs text-slate-600 ml-auto">No file chosen</span>
                  </div>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3 rounded-xl font-semibold text-sm">
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-4">
            <div className="card-glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Before you submit</h3>
              <div className="space-y-2">
                {['Search knowledge base to find similar issues','Check existing tickets for duplicates','Provide detailed description to help us resolve faster'].map((tip, i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-400">
                    <CheckCircle size={12} className="text-green-400 flex-shrink-0 mt-0.5" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
            <div className="card-glow rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-white mb-1">Need help now?</p>
              <p className="text-xs text-slate-400 mb-3">Check common answers before submitting.</p>
              <button onClick={() => navigate('/customer/faq')} className="btn-primary w-full py-2 rounded-lg text-xs font-semibold">Open FAQ</button>
            </div>
            <div className="card-glass rounded-xl p-4">
              <a href="#" className="text-sm text-purple-400 hover:text-purple-300">Read our guidelines →</a>
            </div>
          </div>
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
}
