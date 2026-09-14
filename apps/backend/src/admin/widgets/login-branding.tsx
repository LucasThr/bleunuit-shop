import { defineWidgetConfig } from "@medusajs/admin-sdk"

const LOGO_URL = "/static/bleunuit-logo.png"

/**
 * The login page renders a hardcoded Medusa logo (AvatarBox) that the Admin SDK
 * exposes no API to change. This widget injects CSS to swap it for the Bleunuit
 * logo: the avatar keeps its rounded frame, but gets a light background, the
 * dark gradient overlay is removed, and the Medusa SVG is replaced by the logo.
 */
const LoginBranding = () => (
  <style>{`
    .bg-ui-button-neutral.shadow-buttons-neutral {
      background: #ffffff;
    }
    .bg-ui-button-neutral.shadow-buttons-neutral::after {
      display: none;
    }
    .bg-ui-button-neutral.shadow-buttons-neutral > div {
      background-color: #ffffff;
      background-image: url("${LOGO_URL}");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .bg-ui-button-neutral.shadow-buttons-neutral > div > svg {
      display: none;
    }
  `}</style>
)

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginBranding
