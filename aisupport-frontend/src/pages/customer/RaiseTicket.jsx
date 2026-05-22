import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CheckCircle, Clock3, FileUp, Lightbulb, Paperclip, Send, ShieldCheck, Sparkles } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { createTicket } from '../../services/ticketService';
import GlassCard from '../../components/premium/GlassCard';
import GlowButton from '../../components/premium/GlowButton';
import GradientBadge from '../../components/premium/GradientBadge';

const steps = ['Issue profile', 'Business impact', 'Review & submit'];

export default function RaiseTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState('');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: '', affected_product: '', subject: '', email: user?.email || '',
    account_company: '', description: '', tags: '', priority: 'Medium',
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const completion = useMemo(() => {
    const required = ['category', 'affected_product', 'subject', 'email', 'description'];
    return Math.round((required.filter((field) => Boolean(form[field])).length / required.length) * 100);
  }, [form]);

  const sla = form.priority === 'Urgent' ? '15 min response' : form.priority === 'High' ? '30 min response' : form.priority === 'Medium' ? '4 hour response' : '1 business day';
  const ready = form.category && form.affected_product && form.subject && form.email && form.description;

  const submit = async (event) => {
    event.preventDefault();
    if (!ready) return;
    setSubmitting(true);
    try {
      const response = await createTicket({
        ...form,
        customer_email: form.email,
        customer_name: user?.name || form.email.split('@')[0],
        source: 'customer_portal',
      });
      setTicketId(response.ticket.ticket_id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Raise Ticket">
      <div className="mx-auto max-w-7xl">
        {ticketId ? (
          <GlassCard className="p-10 text-center">
            <CheckCircle className="mx-auto text-emerald-300" size={52} />
            <h1 className="mt-5 text-3xl font-black text-white">Ticket submitted</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">Your ticket is now available in the AWS support intelligence workflow with AI triage and SLA tracking enabled.</p>
            <p className="mt-5 font-mono text-lg font-bold text-cyan-200">{ticketId}</p>
            <GlowButton onClick={() => navigate(`/customer/tickets/${ticketId}`)} className="mt-7">View Ticket</GlowButton>
          </GlassCard>
        ) : (
          <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <GlassCard className="overflow-hidden">
              <div className="border-b border-white/10 p-6 lg:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <GradientBadge icon={Sparkles} tone="purple">Premium Support Center</GradientBadge>
                    <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Raise a Support Ticket</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Create a structured request with AI suggestions, SLA estimation, and knowledge base recommendations before submission.</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-right">
                    <p className="text-xs text-cyan-100">Form readiness</p>
                    <p className="text-2xl font-black text-white">{completion}%</p>
                  </div>
                </div>
                <div className="mt-7 grid gap-3 md:grid-cols-3">
                  {steps.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setStep(index)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${step === index ? 'border-cyan-300/50 bg-cyan-400/12 text-white' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20'}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.16em]">Step {index + 1}</span>
                      <span className="mt-1 block text-sm font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 lg:p-8">
                {step === 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <select required value={form.category} onChange={(e) => update('category', e.target.value)} className="px-4 py-3.5 text-sm"><option value="">Category</option><option>Login Issues</option><option>Payment Issues</option><option>Product Defect</option><option>Refunds</option><option>Feature Request</option></select>
                    <input required value={form.affected_product} onChange={(e) => update('affected_product', e.target.value)} className="px-4 py-3.5 text-sm" placeholder="Affected product or service" />
                    <input required value={form.subject} onChange={(e) => update('subject', e.target.value)} className="px-4 py-3.5 text-sm md:col-span-2" placeholder="Concise issue summary" />
                    <textarea required rows={7} value={form.description} onChange={(e) => update('description', e.target.value)} className="px-4 py-3.5 text-sm md:col-span-2" placeholder="Describe what happened, expected result, error messages, and business impact." />
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="px-4 py-3.5 text-sm" placeholder="Contact email" />
                    <input value={form.account_company} onChange={(e) => update('account_company', e.target.value)} className="px-4 py-3.5 text-sm" placeholder="Account / company" />
                    <input value={form.tags} onChange={(e) => update('tags', e.target.value)} className="px-4 py-3.5 text-sm" placeholder="Tags, comma separated" />
                    <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className="px-4 py-3.5 text-sm"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
                    <label className="flex min-h-[120px] items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-300/30 bg-cyan-400/5 px-4 py-5 text-sm text-slate-300 md:col-span-2">
                      <FileUp size={20} className="text-cyan-200" />
                      Upload attachment, logs, screenshots, or diagnostics
                    </label>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                      <h3 className="font-bold text-white">Ticket Review</h3>
                      <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                        <p><span className="text-slate-500">Category:</span> {form.category || 'Not selected'}</p>
                        <p><span className="text-slate-500">Priority:</span> {form.priority}</p>
                        <p><span className="text-slate-500">Product:</span> {form.affected_product || 'Missing'}</p>
                        <p><span className="text-slate-500">SLA:</span> {sla}</p>
                      </div>
                    </div>
                    {!ready ? <p className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Complete the required ticket details before submitting.</p> : null}
                  </div>
                ) : null}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep((value) => Math.max(value - 1, 0))} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5" disabled={step === 0}>Back</button>
                  {step < 2 ? (
                    <GlowButton type="button" onClick={() => setStep((value) => Math.min(value + 1, 2))}>Continue</GlowButton>
                  ) : (
                    <GlowButton disabled={!ready || submitting} icon={Send}>{submitting ? 'Submitting...' : 'Submit Ticket'}</GlowButton>
                  )}
                </div>
              </div>
            </GlassCard>

            <aside className="space-y-5">
              <GlassCard className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-200"><Bot size={21} /></span>
                  <div>
                    <h2 className="font-bold text-white">AI Suggestions</h2>
                    <p className="text-xs text-slate-400">Generated from your issue context</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  <p className="rounded-xl bg-white/[0.04] p-3">Add the exact error message and the timestamp of the failed action.</p>
                  <p className="rounded-xl bg-white/[0.04] p-3">Mention affected users, regions, and urgency to improve routing.</p>
                </div>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="flex items-center gap-3 text-emerald-100"><Clock3 size={20} /><h2 className="font-bold text-white">SLA Estimation</h2></div>
                <p className="mt-4 text-3xl font-black gradient-text">{sla}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Estimated response time updates as priority and category change.</p>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="flex items-center gap-3 text-amber-100"><Lightbulb size={20} /><h2 className="font-bold text-white">Knowledge Base</h2></div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 text-cyan-200" /> Authentication recovery checklist</p>
                  <p className="flex gap-2"><Paperclip size={16} className="mt-0.5 text-cyan-200" /> Payment diagnostic log guide</p>
                </div>
              </GlassCard>
            </aside>
          </form>
        )}
      </div>
    </Layout>
  );
}
