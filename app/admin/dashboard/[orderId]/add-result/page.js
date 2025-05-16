// app/admin/dashboard/[orderId]/add-result/page.js
import AddResultClient from './page.client';

export default function AddResultPage({ params }) {
  return <AddResultClient orderId={params.orderId} />;
}