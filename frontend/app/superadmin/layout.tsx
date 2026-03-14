import { BrandUIProvider } from "@/components/ui/BrandUI";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    return <BrandUIProvider>{children}</BrandUIProvider>;
}
