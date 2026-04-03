// MaqassLogoIcon — uses the official Maqass brand SVG logo
// Usage: <MaqassLogoIcon size={20} />
import Image from "next/image";

interface MaqassLogoIconProps {
  size?: number;
  className?: string; // Allow external layout classes
}

export default function MaqassLogoIcon({ size = 40, className = "" }: MaqassLogoIconProps) {
    return (
        <div 
          className={`relative overflow-hidden rounded-full bg-black border-2 border-[#C3D809] flex items-center justify-center shadow-[0_0_15px_rgba(195,216,9,0.3)] ${className}`}
          style={{ width: size, height: size }}
        >
            <Image
                src="/images/logo_new.png"
                alt="Maqass Logo"
                width={size}
                height={size}
                className="w-full h-full object-cover"
                priority
            />
        </div>
    );
}
