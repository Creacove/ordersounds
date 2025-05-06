
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Create the zod schema for validation
const WalletSchema = z.object({
  walletAddress: z.string().min(32, {
    message: "Wallet address must be at least 32 characters.",
  }).max(44, {
    message: "Wallet address cannot exceed 44 characters.",
  }),
});

type WalletFormValues = z.infer<typeof WalletSchema>;

interface ProducerWalletDetailsFormProps {
  producerId: string;
  walletAddress?: string;
  onSuccess: () => void;
}

export function ProducerWalletDetailsForm({ producerId, walletAddress, onSuccess }: ProducerWalletDetailsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(WalletSchema),
    defaultValues: {
      walletAddress: walletAddress || '',
    },
  });

  async function onSubmit(values: WalletFormValues) {
    try {
      setIsSubmitting(true);
      
      // Update the producer's wallet address in the database
      const { error } = await supabase
        .from('users')
        .update({ wallet_address: values.walletAddress })
        .eq('id', producerId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Wallet address updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating wallet address:', error);
      toast.error('Failed to update wallet address');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="walletAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solana Wallet Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your Solana wallet address"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This is the Solana wallet address where you'll receive payments for your beat sales.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Wallet Address'}
        </Button>
      </form>
    </Form>
  );
}
