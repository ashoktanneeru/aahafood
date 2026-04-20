import { CheckoutStatusToast } from "@/components/checkout-status-toast";
import { CheckoutStatusCard } from "@/components/checkout-status-card";

export const metadata = {
  title: "Payment Failed",
};

type FailedPageProps = {
  searchParams: Promise<{
    order?: string;
    reason?: string;
  }>;
};

export default async function CheckoutFailedPage({ searchParams }: FailedPageProps) {
  const params = await searchParams;

  return (
    <>
      <CheckoutStatusToast
        variant="error"
        title="Payment not completed"
        description={params.reason ?? "The payment was cancelled or failed before confirmation."}
      />
      <CheckoutStatusCard
        eyebrow="Payment Not Completed"
        title="Your payment did not go through."
        description={
          params.reason
            ? `Razorpay returned: ${params.reason}. You can retry the payment or go back to checkout and try a different method.`
            : "The payment was cancelled or failed before confirmation. Your cart is still available, so you can retry without starting over."
        }
        tone="failure"
        details={params.order ? [{ label: "Order Reference", value: params.order }] : []}
        primaryHref="/checkout"
        primaryLabel="Try Payment Again"
        secondaryHref="/cart"
        secondaryLabel="Review Cart"
      />
    </>
  );
}
