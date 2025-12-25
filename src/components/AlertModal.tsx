// components/AlertWidget.tsx
import { FC, useEffect, useState } from "react";

interface AlertWidgetProps {
  title?: string;
  message: string;
  duration?: number; // otomatik kaybolma süresi
}

export const AlertWidget: FC<AlertWidgetProps> = ({ title, message, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white rounded-lg shadow-lg p-4 max-w-xs w-full animate-slide-in">
      {title && <h4 className="font-semibold mb-1">{title}</h4>}
      <p className="text-sm">{message}</p>
    </div>
  );
};
