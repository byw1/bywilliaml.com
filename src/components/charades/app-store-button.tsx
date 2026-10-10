import { APP_STORE_URL } from './data'

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.72-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.19-.02 1.94-1.08 2.66-2.14.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.34-3.53zM14.2 6.1c.61-.74 1.02-1.76.91-2.78-.88.04-1.94.59-2.57 1.32-.56.65-1.06 1.69-.93 2.69.98.08 1.98-.5 2.59-1.23z" />
    </svg>
  )
}

/** The public TestFlight link. Anyone with an iPhone can join until the listing is live. */
const BETA_URL = 'https://testflight.apple.com/join/vkRTAMK8'

/** A real App Store link once the listing is live, the TestFlight beta until then. */
export function AppStoreButton() {
  if (APP_STORE_URL) {
    return (
      <a href={APP_STORE_URL} className="cr-btn cr-btn-primary">
        <AppleMark />
        Get it on the App Store
      </a>
    )
  }
  return (
    <a href={BETA_URL} target="_blank" rel="noreferrer" className="cr-btn cr-btn-primary">
      <AppleMark />
      Join the iPhone beta
    </a>
  )
}
