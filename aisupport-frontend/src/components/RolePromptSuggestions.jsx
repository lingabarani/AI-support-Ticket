import { promptSuggestions } from '../services/localIntelligenceService';

export default function RolePromptSuggestions({ role = 'support_agent', onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(promptSuggestions[role] || promptSuggestions.support_agent).map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect?.(prompt)}
          className="rounded-full border border-purple-400/30 px-3 py-1 text-xs text-purple-200 transition-colors hover:border-purple-300 hover:bg-purple-500/15"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
