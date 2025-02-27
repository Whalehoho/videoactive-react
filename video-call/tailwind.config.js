/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",  // ✅ Include App Router files
    "./components/**/*.{js,ts,jsx,tsx}", // ✅ Include Components folder
    "./pages/**/*.{js,ts,jsx,tsx}", // ✅ Include Pages folder (for hybrid Next.js projects)
    "./src/**/*.{js,ts,jsx,tsx}",  // ✅ Include src if using it
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

