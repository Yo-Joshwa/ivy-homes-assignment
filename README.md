# Ivy Homes — Software Engineering Internship Assignment

A working property-browsing application built for the Ivy Homes Software Engineering Internship assignment.

## Stack

- Next.js 14
- React 18
- TypeScript
- Native `fetch`
- Node/tsx for API investigation
- Local browser storage for user-scoped saved listings
- No API key committed to source control

## Features

The application implements the required frontend workflows:

- Login with the supplied demo account
- Authenticated session persisted across page refreshes
- Property listings browsing
- Pagination using the API's working offset-based behaviour
- Listing filters
  - Locality
  - Bedrooms
  - Price
  - Furnishing
- Listing detail pages
- Saved listings scoped to the logged-in user
- Rentals browsing
- Projects browsing
- Project prices and areas displayed with the appropriate units
- Dashboard with Chennai property statistics
- Insights page with market statistics and independently calculated aggregates
- Loading and error handling for API failures

## Setup

```bash
cp .env.example .env.local