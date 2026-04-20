import { CheckoutStatusToast } from "@/components/checkout-status-toast";
import { CheckoutStatusCard } from "@/components/checkout-status-card";

export const metadata = {
  title: "Payment Successful",
};

type SuccessPageProps = {
  searchParams: Promise<{
    mode?: string;
    order?: string;
    payment?: string;
  }>;
};

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const isRazorpay = params.mode !== "whatsapp";

  return (
    <>
      <CheckoutStatusToast
        variant="success"
        title={isRazorpay ? "Payment successful" : "WhatsApp order ready"}
        description={
          isRazorpay
            ? "Your AahaFood payment has been verified."
            : "Your order summary is ready to send on WhatsApp."
        }
      />
      <CheckoutStatusCard
        eyebrow={isRazorpay ? "Payment Successful" : "Order Request Sent"}
        title={
          isRazorpay
            ? "Your AahaFood order is confirmed."
            : "Your AahaFood order details are ready on WhatsApp."
        }
        description={
          isRazorpay
            ? "We have received your payment and your order is now in our kitchen queue. You will hear from us shortly with packing and dispatch updates."
            : "We opened WhatsApp with your filled order summary so you can send it to the team. Once the message is sent, we will confirm the order manually."
        }
        tone="success"
        details={[
          ...(params.order ? [{ label: "Order Reference", value: params.order }] : []),
          ...(params.payment && isRazorpay ? [{ label: "Payment ID", value: params.payment }] : []),
        ]}
        primaryHref="/products"
        primaryLabel={isRazorpay ? "Continue Shopping" : "Shop More"}
        secondaryHref="/"
        secondaryLabel="Back to Home"
      />
    </>
  );
}
