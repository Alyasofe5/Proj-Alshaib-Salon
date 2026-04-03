import BookingClient from "./BookingClient";

export async function generateStaticParams() {
    // Return an empty slug to allow the default /book route
    // Also include common slugs to prevent missing param errors during Next.js 'output: export'
    return [
        { slug: [] },
        { slug: ['alshayeb'] },
        { slug: ['alshaib'] },
        { slug: ['alhasan'] }
    ]; 
}

export default function BookingPage({ params }: { params: { slug?: string[] } }) {
    // Correctly extract slug from the catch-all array
    const slug = params.slug && params.slug.length > 0 ? params.slug[0] : undefined;
    
    return <BookingClient params={{ slug: slug || "" }} />;
}
