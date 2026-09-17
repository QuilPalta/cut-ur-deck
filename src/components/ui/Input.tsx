interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export default function Input({ icon, className = "", ...props }: InputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a7b6b]">
          {icon}
        </div>
      )}
      <input
        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-black/60 border border-[#8a7b6b]/40 rounded-sm text-sm text-[#e8e0d5] placeholder:text-stone-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans ${className}`}
        {...props}
      />
    </div>
  );
}