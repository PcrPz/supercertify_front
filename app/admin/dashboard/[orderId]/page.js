import OrderDetailsClient from './page.client';

export default function OrderDetailsPage({ params }) {
  return <OrderDetailsClient orderId={params.orderId} />;
}