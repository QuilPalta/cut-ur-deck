import { X } from "lucide-react";

interface CardPreviewModalProps {
  cardName: string;
  onClose: () => void;
}

export default function CardPreviewModal({ cardName, onClose }: CardPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 bg-red-950/80 border border-red-500 rounded-full text-red-400 hover:bg-red-900 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <img 
          src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image`} 
          alt={cardName}
          className="max-w-[300px] md:max-w-[400px] rounded-[4.5%] shadow-2xl border-2 border-[#1c1611]"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            alert("No se encontró la imagen en el archivo de Scryfall.");
            onClose();
          }}
        />
      </div>
    </div>
  );
}