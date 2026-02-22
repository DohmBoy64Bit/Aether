import { LucideIcon } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon: LucideIcon;
    id: string;
}

export default function AuthInput({ label, icon: Icon, id, ...props }: AuthInputProps) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-semibold text-secondary-text">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                <input
                    id={id}
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-[#0f1419] placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-[#0085ff] focus:border-transparent pl-10"
                    {...props}
                />
            </div>
        </div>
    );
}
