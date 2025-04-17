export interface ProducerBankDetails {
  bank_code: string;
  account_number: string;
  account_name?: string; // Optional on input, required on output from resolve
}

export interface SubaccountResponse {
  subaccount_code: string;
  split_code: string;
  account_name: string; // Name verified by Paystack
  bank_name: string; // Name of the bank
}

export interface PaystackBank {
  name: string;
  code: string;
  id: number;
}
