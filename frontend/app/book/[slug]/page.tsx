import BookingClient from "./BookingClient";

export async function generateStaticParams() {
    // In a static export, Next.js needs to know which slugs to pre-render.
    // Ideally, fetch all slugs from your API here.
    return [{ slug: 'salon' }]; 
}


export default function BookingPage({ params }: { params: { slug: string } }) {
    return <BookingClient params={params} />;
}
