// components/AlertModal.tsx
import { FC } from "react";
import { Button } from "./ui/button";

interface AlertModalProps {
  title?: string;
  message: string;
  onClose: () => void;
}

export const AlertModal: FC<AlertModalProps> = ({ title, message, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-lg p-6 w-80 max-w-full text-center">
        {title && <h2 className="text-lg font-bold mb-2">{title}</h2>}
        <p className="text-gray-300 mb-4">{message}</p>
        <Button onClick={onClose} className="bg-pink text-black hover:bg-[#5b0426]">
          OK
        </Button>
      </div>
    </div>
  );
};
