import BookingClient from "./BookingClient";

export async function generateStaticParams() {
    // Return an empty slug to allow the default /book route
    return [{ slug: [] }]; 
}

export default function BookingPage({ params }: { params: { slug?: string[] } }) {
    // Correctly extract slug from the catch-all array
    const slug = params.slug && params.slug.length > 0 ? params.slug[0] : undefined;
    
    return <BookingClient params={{ slug: slug || "" }} />;
}
