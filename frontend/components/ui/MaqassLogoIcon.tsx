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
            className="w-full h-full object-cover rounded-full filter invert-[0.95] brightness-[1.5] contrast-[1.2] grayscale-[0.2] scale-110"
            style={{ filter: "invert(0.95) brightness(1.5) contrast(1.2) grayscale(0.2)" }}
            priority
        />
    );
}
