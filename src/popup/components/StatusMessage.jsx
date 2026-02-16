import { useEffect, useState, useRef } from 'react';

export default function StatusMessage({ message, type }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const prevMessage = useRef('');

  useEffect(() => {
    if (message && message !== prevMessage.current) {
      prevMessage.current = message;
      setExiting(false);
      setVisible(true);

      const exitTimer = setTimeout(() => setExiting(true), 2200);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 2500);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
    if (!message) setVisible(false);
  }, [message]);

  if (!visible) return null;

  const colors = type === 'success'
    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';

  return (
    <div className={`fixed bottom-[60px] left-3 right-3 z-20 p-2.5 rounded-lg text-xs text-center font-medium border ${colors} ${exiting ? 'animate-toast-out' : 'animate-toast-in'}`}>
      {message}
    </div>
  );
}
