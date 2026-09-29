"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

const META_PIXEL_ID = "843409005465041";
const CONSENT_KEY = "fluenceos_cookie_consent";

export default function GoogleAnalytics() {
  const [trackingAllowed, setTrackingAllowed] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(CONSENT_KEY);

    if (consent === "accepted") {
      setTrackingAllowed(true);
    }

    const handleConsentChange = () => {
      const updatedConsent = window.localStorage.getItem(CONSENT_KEY);
      setTrackingAllowed(updatedConsent === "accepted");
    };

    window.addEventListener(
      "fluenceos-consent-changed",
      handleConsentChange
    );

    return () => {
      window.removeEventListener(
        "fluenceos-consent-changed",
        handleConsentChange
      );
    };
  }, []);

  if (!trackingAllowed) return null;

  return (
    <>
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />

          <Script id="fluenceos-audit-ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: true
              });
            `}
          </Script>
        </>
      )}

      <Script id="fluenceos-audit-meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {
            if(f.fbq)return;
            n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;
            n.push=n;
            n.loaded=!0;
            n.version='2.0';
            n.queue=[];
            t=b.createElement(e);
            t.async=!0;
            t.src=v;
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
          }(
            window,
            document,
            'script',
            'https://connect.facebook.net/en_US/fbevents.js'
          );

          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
    </>
  );
}
