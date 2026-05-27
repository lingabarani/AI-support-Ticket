import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAgentQuestionSample } from '../data/agentQuestionBank';

export default function RolePromptSuggestions({ role = 'support_agent', onSelect }) {
  const [page, setPage] = useState(0);
  const prompts = getAgentQuestionSample(role, page, 4);

  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect?.(prompt)}
          className="rounded-full border border-purple-400/30 px-3 py-1 text-xs text-purple-200 transition-colors hover:border-purple-300 hover:bg-purple-500/15"
        >
          {prompt}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setPage((current) => current + 1)}
        className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-cyan-500/15"
      >
        <RefreshCw size={12} />
        More prompts
      </button>
    </div>
  );
}
