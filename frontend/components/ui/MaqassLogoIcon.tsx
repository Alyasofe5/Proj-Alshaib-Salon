// MaqassLogoIcon — uses the official Maqass brand SVG logo
// Usage: <MaqassLogoIcon size={20} />
import Image from "next/image";

export default function MaqassLogoIcon({ size = 20 }: { size?: number }) {
    return (
        <Image
            src="/logo.svg"
            alt="Maqass Logo"
            width={size}
            height={size}
            style={{ objectFit: "contain" }}
            priority
        />
    );
}
