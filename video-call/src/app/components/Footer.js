export default function Footer() {
    return (
      <footer className="bg-gray-100 p-6  mx-2">
        <img src="/logos/logo.svg" alt="logo" className="rounded-lg" /><h2 className="text-pink-600 text-lg font-bold">ViMeet</h2>
        <p className="text-gray-700">A platform that provides opportunity for people to connect</p>
        <p className="text-gray-500">&copy; 2025 ViMeet, Inc</p>
        <div className="flex justify-end space-x-4 mt-2">
            <a href="https://www.X.com" >
            <img src="/logos/X.svg" alt="X" className="w-6 h-6" />
            </a>
            <a href="https://www.instagram.com" >
            <img src="/logos/Instagram.svg" alt="Instagram" className="w-6 h-6" />
            </a>
            <a href="https://www.Youtube.com" >
            <img src="/logos/Youtube.svg" alt="Youtube" className="w-6 h-6" />
            </a>
            <a href="https://www.LinkedIn.com" >
            <img src="/logos/LinkedIn.svg" alt="LinkedIn" className="w-6 h-6" />
            </a>
        </div>
      </footer>
    );
  }
  