"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "fluenceos_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(CONSENT_KEY);

    if (consent !== "accepted" && consent !== "declined") {
      setVisible(true);
    }
  }, []);

  function setConsent(value: "accepted" | "declined") {
    window.localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new Event("fluenceos-consent-changed"));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie preferences">
      <div className="cookie-banner-content">
        <div>
          <p className="cookie-banner-title">Your privacy matters</p>

          <p className="cookie-banner-text">
            FluenceOS uses optional analytics and advertising technologies to
            understand how this Audit is used and help us reach the right
            audience. You can accept or decline optional tracking.
          </p>

          <a
            href="https://fluenceos.io/cookie-policy/"
            className="cookie-banner-link"
          >
            Cookie Policy
          </a>
        </div>

        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-button secondary"
            onClick={() => setConsent("declined")}
          >
            Decline
          </button>

          <button
            type="button"
            className="cookie-button primary"
            onClick={() => setConsent("accepted")}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
