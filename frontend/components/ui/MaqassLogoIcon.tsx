// MaqassLogoIcon — uses the official Maqass brand SVG logo
// Usage: <MaqassLogoIcon size={20} />
import Image from "next/image";

export default function MaqassLogoIcon({ size = 20 }: { size?: number }) {
    return (
        <Image
            src="/images/logo_new.png"
            alt="Maqass Logo"
            width={size}
            height={size}
            className="w-full h-full object-cover rounded-full"
            priority
        />
    );
}
