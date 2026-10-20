export interface HelpTopic {
  id: string;
  title: string;
  category: 'shipping' | 'payment' | 'orders' | 'support' | string;
  icon?: string;
  content: string;
  displayOrder?: number;
  display_order?: number;
  isActive?: boolean;
  is_active?: boolean;
}

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}
