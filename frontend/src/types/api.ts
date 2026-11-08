// Mirrors the backend REST contract (camelCase on the wire).
// `npm run gen:types` writes the full generated OpenAPI types to src/types/openapi.d.ts.

export interface Image {
  url: string;
  alt: string;
}

export interface Service {
  slug: string;
  name: string;
  shortDescription: string;
  icon: string;
  image: Image | null;
  isPopular: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface Town {
  slug: string;
  name: string;
  blurb: string;
  district: string;
  districtName: string;
}

export type DistrictSlug = 'kannur' | 'thrissur' | 'kochi';

export interface District {
  slug: DistrictSlug;
  name: string;
  tagline: string;
  summary: string;
  image: Image | null;
  towns: Town[];
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
}

export interface Review {
  id: number;
  name: string;
  text: string;
  service: string;
  town: string;
  source: string;
  rating?: number | null;
}

export interface SubService {
  name: string;
  description: string;
}

export interface CommonProblem {
  title: string;
  cause: string;
}

export interface ServiceDetail extends Service {
  description: string;
  subServices: SubService[];
  commonProblems: CommonProblem[];
  faqs: Faq[];
  towns: Town[];
}

export interface PageRef {
  town: string;
  service: string;
}

export interface DistrictHub {
  district: District & { intro: string };
  popularServices: Service[];
  services: Service[];
  faqs: Faq[];
  otherDistricts: District[];
  pages: PageRef[];
}

export interface TownPage {
  district: District;
  town: Town;
  services: Service[];
  faqs: Faq[];
}

export interface PublishedPage {
  district: string;
  town: string;
  service: string;
  updatedAt: string;
}

export interface LandingPage {
  district: District;
  town: Town;
  service: Service;
  title: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  heroImage: Image | null;
  subServices: SubService[];
  commonProblems: CommonProblem[];
  types: string[];
  brands: string[]; // hide block when empty
  areasCovered: string[];
  faqs: Faq[];
  nearby: { sameServiceTowns: Town[]; otherServices: Service[] };
}

/** Uploaded photos for fixed slots; a missing key means "show the placeholder". */
export type SitePhotos = Partial<Record<'homeHero' | 'homeWhyUs', Image>>;

export interface LegalPageContent {
  slug: 'privacy' | 'terms';
  title: string;
  body: string;
  updatedAt: string;
}

export interface BookingCreated {
  id: string;
  reference: string;
  status: string;
}

export interface ApiValidationError {
  errors: Record<string, string[]>;
}
