export type Currency = 'THB';

/** Integer MINOR units (satang). ฿1,990 === { amount: 199000, currency: 'THB' }. */
export type Money = {
  amount: number; // integer minor units, never a float
  currency: Currency;
};
