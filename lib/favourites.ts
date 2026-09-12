import { Listing } from "./types";

function storageKey(email: string) {
    return `ivy_favourites_${email}`;
}

export function getSavedListings(email: string): Listing[] {
    try {
        const raw = localStorage.getItem(storageKey(email));
        if (!raw) return [];

        const listings = JSON.parse(raw);

        return Array.isArray(listings) ? listings : [];
    } catch {
        return [];
    }
}

export function isListingSaved(email: string, listingId: string): boolean {
    return getSavedListings(email).some(
        (listing) => listing.listing_id === listingId
    );
}

export function saveListing(email: string, listing: Listing) {
    const listings = getSavedListings(email);

    if (listings.some((x) => x.listing_id === listing.listing_id)) {
        return;
    }

    localStorage.setItem(
        storageKey(email),
        JSON.stringify([...listings, listing])
    );
}

export function removeSavedListing(email: string, listingId: string) {
    const listings = getSavedListings(email);

    const updated = listings.filter(
        (listing) => listing.listing_id !== listingId
    );

    localStorage.setItem(storageKey(email), JSON.stringify(updated));
}