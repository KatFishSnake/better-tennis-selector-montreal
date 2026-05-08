// Slim shape stored client-side. Fields kept short on purpose so the
// base64 payload that ships in the bookmarklet redirect URL stays small.
export type StoredBooking = {
  id: number;
  d: string; // description, e.g. "Terrain de tennis #5, La Fontaine 2026-05-08 17:00"
  s: string; // saleDateTime ISO, e.g. "2026-05-07T23:14:58.000Z"
  t: number; // total price (CAD)
  x: string; // status description, e.g. "Réservée"
  c: boolean; // cancellation allowed
};

export type BookingPayload = {
  v: 1;
  ts: number;
  items: StoredBooking[];
};

export const BOOKINGS_STORAGE_KEY = "tennismtl.bookings.v1";

const HEX_DATE = /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/;

// Description format from the City: "Terrain de tennis #5, La Fontaine 2026-05-08 17:00".
// The trailing date is wall-clock Montréal time (no timezone), so reconstruct an
// ISO with -04:00 (EDT) — close enough for sorting and conflict detection.
export function parseBookingStart(b: StoredBooking): Date | null {
  const m = b.d.match(HEX_DATE);
  if (!m) return null;
  const iso = `${m[1]}T${m[2]}:00.000-04:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function bookingCourtName(b: StoredBooking): string {
  // Strip trailing date and split on first comma.
  const noDate = b.d
    .replace(HEX_DATE, "")
    .trim()
    .replace(/[,\s]+$/, "");
  return noDate;
}

export function bookingTimeKey(b: StoredBooking): string | null {
  // Match home page's bucketKey: "<weekday>-HH:MM" in Montréal time.
  const start = parseBookingStart(b);
  if (!start) return null;
  const day = start
    .toLocaleDateString("en-US", { weekday: "long", timeZone: "America/Toronto" })
    .toLowerCase();
  const time = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Toronto",
  });
  return `${day}-${time}`;
}

function decodeUtf8Base64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function parsePayload(b64: string): BookingPayload | null {
  try {
    const json = decodeUtf8Base64(b64);
    const data = JSON.parse(json) as unknown;
    if (
      typeof data !== "object" ||
      data === null ||
      (data as { v: unknown }).v !== 1 ||
      !Array.isArray((data as { items: unknown }).items)
    ) {
      return null;
    }
    return data as BookingPayload;
  } catch {
    return null;
  }
}

export function loadBookings(): BookingPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as BookingPayload;
    if (data.v !== 1 || !Array.isArray(data.items)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveBookings(payload: BookingPayload): void {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function clearBookings(): void {
  try {
    localStorage.removeItem(BOOKINGS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Bookmarklet source. Runs on loisirs.montreal.ca, harvests the user's
// reservations using their existing session cookies, and redirects to
// tennismtl.com/me#b=<base64> where the data is decoded and persisted.
//
// Kept readable here; minified by `getBookmarkletHref()` below.
const BOOKMARKLET_BODY = `(function(){
  var DEST='https://tennismtl.com/me';
  if(location.hostname!=='loisirs.montreal.ca'){
    alert('Tennis MTL: open this bookmarklet from loisirs.montreal.ca after signing in.');
    return;
  }
  function go(frag){location.href=DEST+frag;throw 0;}
  function findToken(){
    var stores=[localStorage,sessionStorage];
    for(var si=0;si<stores.length;si++){
      var s=stores[si];
      try{
        for(var i=0;i<s.length;i++){
          var k=s.key(i);if(!k)continue;
          var v=s.getItem(k);if(!v||v.charAt(0)!=='{')continue;
          try{var o=JSON.parse(v);if(o){
            if(typeof o.access_token==='string')return{tok:o.access_token,key:k};
            if(o.tokens&&typeof o.tokens.access_token==='string')return{tok:o.tokens.access_token,key:k};
            if(o.body&&typeof o.body.access_token==='string')return{tok:o.body.access_token,key:k};
          }}catch(_){}
        }
      }catch(_){}
    }
    return null;
  }
  function probe(tokSrc){
    try{
      var ck=document.cookie?document.cookie.split(';').map(function(s){return s.trim().split('=')[0];}).filter(Boolean):[];
      var ls=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k)ls.push(k);}}catch(_){}
      return 'ck['+ck.length+']:'+ck.slice(0,6).join(',')+' | ls['+ls.length+']:'+ls.slice(0,6).join(',')+' | tok:'+(tokSrc||'none');
    }catch(_){return 'probe-fail';}
  }
  var TOKEN=findToken();
  function fail(code,detail){go('#err='+code+'&msg='+encodeURIComponent((String(detail||'')+' | '+probe(TOKEN&&TOKEN.key)).slice(0,400)));}
  var H={'x-tenant-id':'1','accept':'application/json, text/plain, */*'};
  if(TOKEN&&TOKEN.tok)H['Authorization']='Bearer '+TOKEN.tok;
  fetch('/IC3/api/U3000/member/authentication/currentmember/?_='+Date.now(),{headers:H,credentials:'include'})
    .then(function(r){
      if(r.status===401||r.status===403)fail('auth','member status '+r.status);
      if(!r.ok)fail('fetch','member HTTP '+r.status);
      return r.text().then(function(t){
        var d;try{d=JSON.parse(t);}catch(_){fail('auth','member non-JSON: '+t.slice(0,160));}
        return d;
      });
    })
    .then(function(d){
      var id=d&&d.result&&d.result.id;
      if(!id){
        var snippet=JSON.stringify(d).slice(0,160);
        fail('auth','no member id; got '+snippet);
      }
      return fetch('/IC3/api/U3100/saleitem/member/view/'+id+'?_='+Date.now(),{
        method:'POST',
        credentials:'include',
        headers:Object.assign({'content-type':'application/json;charset=UTF-8'},H),
        body:JSON.stringify({isSortOrderAsc:false,limit:50,offset:0,searchString:null,sortColumn:'saleDateTime',lblAccessPackage:'Forfait de passages',lblDropInRegistration:'Inscription libre',lblItemSale:'Item de vente',lblRegistration:'Inscription',lblRegistrationByActivitySession:'Inscription à la séance',lblReservation:'Réservation',lblSubscription:'Adhésion'})
      });
    })
    .then(function(r){
      if(r.status===401||r.status===403)fail('auth','sale status '+r.status);
      if(!r.ok)fail('fetch','sale HTTP '+r.status);
      return r.json();
    })
    .then(function(d){
      var items=(d&&d.results)||[];
      var slim=items.filter(function(it){return it.saleItemType===2;}).map(function(it){
        return {id:it.id,d:it.description,s:it.saleDateTime,t:it.total,x:it.saleItemStatusDesc,c:!!(it.isCancellationAllowed||it.isMemberCancellationAllowed)};
      });
      var json=JSON.stringify({v:1,ts:Date.now(),items:slim});
      var bytes=new TextEncoder().encode(json);
      var bin='';for(var i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);
      var b64=btoa(bin).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
      location.href=DEST+'#b='+b64;
    })
    .catch(function(e){
      if(e===0)return;
      location.href=DEST+'#err=fetch&msg='+encodeURIComponent(((e&&e.message)||'Network error').slice(0,200));
    });
})();`;

export function getBookmarkletHref(): string {
  // Collapse whitespace / newlines so the href stays compact.
  const minified = BOOKMARKLET_BODY.replace(/\s*\n\s*/g, "").replace(/\s{2,}/g, " ");
  return `javascript:${encodeURIComponent(minified)}`;
}

// URL-safe base64 (used by the bookmarklet) → standard for atob.
export function parseUrlSafePayload(b64Url: string): BookingPayload | null {
  const pad = "=".repeat((4 - (b64Url.length % 4)) % 4);
  const standard = b64Url.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return parsePayload(standard);
}
