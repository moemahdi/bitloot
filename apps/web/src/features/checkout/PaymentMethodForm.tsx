'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/design-system/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { RadioGroup, RadioGroupItem } from '@/design-system/primitives/radio-group';
import { Label } from '@/design-system/primitives/label';

// Define Zod schema for validation
const paymentMethodSchema = z.object({
  payCurrency: z.enum(['btc', 'eth', 'usdttrc20', 'ltc'], {
    required_error: 'Please select a cryptocurrency',
  }),
});

export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  onSubmit: (data: PaymentMethodFormData) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentMethodForm({ onSubmit, isLoading = false }: PaymentMethodFormProps): React.ReactElement {
  const {
    register: _register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      payCurrency: 'btc',
    },
  });

  const selectedCurrency = watch('payCurrency');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Payment Method</CardTitle>
        <CardDescription>Choose your preferred cryptocurrency</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-6">
          <RadioGroup
            defaultValue="btc"
            value={selectedCurrency}
            onValueChange={(value) => setValue('payCurrency', value as 'btc' | 'eth' | 'usdttrc20' | 'ltc')}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <RadioGroupItem value="btc" id="btc" className="peer sr-only" />
              <Label
                htmlFor="btc"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span className="mb-2 text-lg font-bold">Bitcoin</span>
                <span className="text-sm text-muted-foreground">BTC</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="eth" id="eth" className="peer sr-only" />
              <Label
                htmlFor="eth"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span className="mb-2 text-lg font-bold">Ethereum</span>
                <span className="text-sm text-muted-foreground">ETH</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="usdttrc20" id="usdttrc20" className="peer sr-only" />
              <Label
                htmlFor="usdttrc20"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span className="mb-2 text-lg font-bold">Tether</span>
                <span className="text-sm text-muted-foreground">USDT (TRC20)</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="ltc" id="ltc" className="peer sr-only" />
              <Label
                htmlFor="ltc"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span className="mb-2 text-lg font-bold">Litecoin</span>
                <span className="text-sm text-muted-foreground">LTC</span>
              </Label>
            </div>
          </RadioGroup>

          {errors.payCurrency != null && (
            <p className="text-sm text-destructive">{errors.payCurrency.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
