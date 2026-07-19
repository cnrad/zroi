/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  compiler: {
    // hand styled-components to the SWC transform so SSR class names match
    styledComponents: true,
  },
}
