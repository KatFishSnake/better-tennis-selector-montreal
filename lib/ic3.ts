export const IC3_BASE = "https://loisirs.montreal.ca/IC3";

export const IC3_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "fr",
  origin: "https://loisirs.montreal.ca",
  referer: "https://loisirs.montreal.ca/IC3/",
  "x-tenant-id": "1",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
};

export type FacilityType = {
  id: number;
  name: string;
  description: string;
};

export type Site = {
  id: number;
  name: string;
};

export type Borough = {
  id: number;
  name: string;
  externalId: string | null;
};

export type InitResponse = {
  result: {
    facilityTypes: FacilityType[];
    sites: Site[];
    boroughs: Borough[];
  };
};

export type SearchResult = {
  facility: {
    id: number;
    name: string;
    isMembershipRequired: boolean;
    site: {
      id: number;
      name: string;
      boroughs: Borough[];
    };
    facilityType: FacilityType;
  };
  startDateTime: string;
  endDateTime: string;
  priorNoticeDelayInMinutes: number;
  facilityScheduleId: number;
  totalPrice: number;
  canReserve: { value: boolean; validationResult: unknown };
  facilityPricingId: number;
};

export type SearchResponse = {
  recordCount: number;
  warningRecordCountClipped: boolean;
  results: SearchResult[];
};

export type SearchPayload = {
  limit: number;
  offset: number;
  sortColumn: string;
  isSortOrderAsc: boolean;
  facilityTypeIds: string | null;
  boroughIds: string | null;
  siteId: number | null;
  dates: string[];
  startTime: string | null;
  endTime: string | null;
};

export const DEFAULT_SITE_ID = 1734;
export const TENNIS_OUTDOOR_TYPE_ID = 175;
export const TENNIS_INDOOR_TYPE_ID = 114;
export const PICKLEBALL_TYPE_ID = 203;

export function dateForIC3(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T00:00:00.000-04:00`;
}
