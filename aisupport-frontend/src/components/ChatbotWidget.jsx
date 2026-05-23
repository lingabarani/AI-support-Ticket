import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import BedrockAgentChat from './BedrockAgentChat';

export default function ChatbotWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const roleMap = {
    'Customer Portal User': 'customer',
    'Support Agent': 'support_agent',
    'Team Manager': 'team_manager',
    'Business Executive': 'business_executive',
  };
  const placement = location.pathname.includes('/quicksight') ? 'bottom-left' : 'bottom-right';

  return <BedrockAgentChat role={roleMap[user?.role] || 'customer'} mode="floating" placement={placement} />;
}
