import { LegalPage } from '@/components/layout/LegalPage';
import { api } from '@/lib/api';
import { CONTACT } from '@/lib/config';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Terms',
  description: 'Terms for booking a Happy Services technician visit.',
  path: '/terms',
});

export const revalidate = 3600;

export default async function TermsPage() {
  const content = await api.legal('terms');
  return (
    <LegalPage title="Terms" path="/terms" content={content}>
      <h2>Booking requests</h2>
      <p>
        Sending the form, a WhatsApp message or calling us is a request for a visit. A booking is confirmed once we agree a visit
        time with you.
      </p>

      <h2>Quotes</h2>
      <p>
        The technician inspects the problem and shares the cost before any work starts. Work only begins once you approve the
        quote. [Inspection/visit charge, if any, to be confirmed by Happy Services.]
      </p>

      <h2>Payment, warranty and cancellations</h2>
      <p>[Payment methods, service warranty and cancellation terms to be supplied by Happy Services.]</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: {CONTACT.phoneDisplay} or{' '}
        <a href={`mailto:${CONTACT.email}`} className="text-happy underline">
          {CONTACT.email}
        </a>
        .
      </p>
    </LegalPage>
  );
}
