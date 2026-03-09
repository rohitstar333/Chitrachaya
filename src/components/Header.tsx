import { Camera, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export type NavLink = {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    active?: boolean;
};

interface HeaderProps {
    userName: string;
    role: string;
    onSignOut: () => void;
    navLinks?: NavLink[];
}

export function Header({ userName, role, onSignOut, navLinks }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
                {/* Logo Section */}
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                        <Camera className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold leading-none tracking-tight text-white flex items-center gap-2">
                            CHITRACHAYA
                            <span className="text-[10px] uppercase font-bold text-red-500 tracking-widest hidden sm:inline-block">Photography Club</span>
                        </span>
                    </div>
                </div>

                {/* Navigation Section */}
                {navLinks && navLinks.length > 0 && (
                    <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
                        {navLinks.map((link, idx) => (
                            <button
                                key={idx}
                                onClick={link.onClick}
                                className={`flex items-center transition-all ${link.active
                                        ? "bg-red-950/40 text-red-500 border border-red-900/50 rounded-md px-4 py-2"
                                        : "text-neutral-400 hover:text-white px-4 py-2"
                                    }`}
                            >
                                {link.icon && <span className="mr-2">{link.icon}</span>}
                                {link.label}
                            </button>
                        ))}
                    </nav>
                )}

                {/* Profile Section */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-medium text-white">{userName}</span>
                        <span className="text-xs text-neutral-500">{role}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSignOut}
                        className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-full"
                        title="Sign Out"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
