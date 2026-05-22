import { useAuth } from '../context/AuthContext';
import BedrockAgentChat from './BedrockAgentChat';

export default function ChatbotWidget() {
  const { user } = useAuth();
  const roleMap = {
    'Customer Portal User': 'customer',
    'Support Agent': 'support_agent',
    'Team Manager': 'team_manager',
    'Business Executive': 'business_executive',
  };

  return <BedrockAgentChat role={roleMap[user?.role] || 'customer'} mode="floating" />;
}
