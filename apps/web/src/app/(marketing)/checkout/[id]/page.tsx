import CheckoutForm from '@/features/checkout/CheckoutForm';

export default function CheckoutPage(): React.ReactElement {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground mt-2">
          Complete your purchase securely with crypto.
        </p>
      </div>

      <CheckoutForm />
    </div>
  );
}
