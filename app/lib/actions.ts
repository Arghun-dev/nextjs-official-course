'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateAndUpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const result = CreateAndUpdateInvoice.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (result.success) {
    const { amount, customerId, status } = result.data;
    const amountInCent = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
      INSERT INTO Invoices (customerId, amount, status, date)
      VALUES (${customerId}, ${amountInCent}, ${status}, ${date})
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } else {
    console.log('something went wrong!');
  }
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = CreateAndUpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}
