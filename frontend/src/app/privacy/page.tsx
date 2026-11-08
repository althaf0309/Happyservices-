import { LegalPage } from '@/components/layout/LegalPage';
import { api } from '@/lib/api';
import { CONTACT } from '@/lib/config';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'How Happy Services uses the details you send when you book a service.',
  path: '/privacy',
});

export const revalidate = 3600;

export default async function PrivacyPage() {
  const content = await api.legal('privacy');
  return (
    <LegalPage title="Privacy Policy" path="/privacy" content={content}>
      <p>We use your details only to arrange your service. This page explains what we collect and why.</p>

      <h2>What we collect</h2>
      <ul>
        <li>The details you enter in the booking form: name, mobile number, service, location, problem description and preferred visit time.</li>
        <li>The page you booked from and any campaign tags in its link (for example, utm_source), so we know how you found us.</li>
        <li>A one-way, salted hash of your IP address and your browser’s user agent, used only to stop spam and abuse.</li>
      </ul>

      <h2>How we use it</h2>
      <p>
        To contact you, confirm a visit, send a technician and follow up on the job. We don’t sell your details or use them for
        unrelated marketing.
      </p>

      <h2>Who sees it</h2>
      <p>
        The Happy Services team, and the email and hosting providers we use to receive and store booking requests. If you
        message us on WhatsApp, WhatsApp’s own privacy policy also applies.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Requests flagged as spam are deleted after 30 days. Genuine booking records are kept for [retention period to be
        confirmed by Happy Services].
      </p>

      <h2>Analytics</h2>
      <p>We use Google Analytics to understand which pages help people book. It records page views and button clicks, not form contents.</p>

      <h2>Your choices</h2>
      <p>
        To see, correct or delete the details we hold about you, email{' '}
        <a href={`mailto:${CONTACT.email}`} className="text-happy underline">
          {CONTACT.email}
        </a>{' '}
        or call {CONTACT.phoneDisplay}.
      </p>
    </LegalPage>
  );
}
