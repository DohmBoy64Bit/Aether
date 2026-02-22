import { LucideIcon } from "lucide-react";

export default function EmptyState({
    icon: Icon, title, description, action
}: {
    icon: LucideIcon; title: string; description: string; action?: React.ReactNode
}) {
    return (
        <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="w-16 h-16 bg-[#eff3f4] rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-secondary-text" />
            </div>
            <h3 className="text-[32px] font-extrabold text-heading mb-2">{title}</h3>
            <p className="text-secondary-text text-[15px] max-w-[340px] mb-6">{description}</p>
            {action}
        </div>
    );
}
