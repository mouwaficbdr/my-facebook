import ModernToast from './ModernToast';
import { useToastContext } from '../context/ToastContext';

export default function ToastGlobal() {
  const { toasts, removeToast } = useToastContext();
  return <ModernToast toasts={toasts} onRemove={removeToast} />;
}
