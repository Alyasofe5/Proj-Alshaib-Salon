import BookingClient from "./BookingClient";

export const dynamic = 'force-dynamic';

export default function BookingPage({ params }: { params: { slug: string } }) {
    return <BookingClient params={params} />;
}
