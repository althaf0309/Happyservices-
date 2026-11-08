import { LinkButton } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="container-x py-20 text-center lg:py-28">
      <p className="eyebrow">404</p>
      <h1 className="h1 mt-3">We couldn’t find that page</h1>
      <p className="lead mx-auto mt-4 max-w-lg">It may have moved, or the service isn’t listed for that town yet.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/services">See all services</LinkButton>
        <LinkButton href="/locations" variant="outline">
          Find your area
        </LinkButton>
      </div>
    </section>
  );
}
