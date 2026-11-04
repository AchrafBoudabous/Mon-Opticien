import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@next/third-parties/google'

/**
 * Vercel Web Analytics + Speed Insights: cookieless. Their scripts are served by Vercel at
 * /_vercel/*, so they are only rendered when deployed there (VERCEL=1); elsewhere they would
 * 404 on every page. Turn on "Analytics" in the Vercel project dashboard.
 *
 * Optional GA4: set NEXT_PUBLIC_GA_ID. GA sets cookies, so add a consent banner and update the
 * privacy policy before enabling it.
 */
export default function Analytics() {
  const onVercel = process.env.VERCEL === '1'
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  return (
    <>
      {onVercel && <VercelAnalytics />}
      {onVercel && <SpeedInsights />}
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </>
  )
}
