import Navbar from "../components/LoginNavbar";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div>
      <Navbar activePage="about" />
      <main className="text-center">
        {/* Hero Section */}
        <section className="relative w-full h-[400px]">
          <img 
            src="/landing3.jpg" 
            alt="About ViMeet" 
            className="w-full h-full object-cover opacity-70" 
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <h1 className="text-4xl font-bold text-white">
              About <span className="text-pink-500">ViMeet</span>
            </h1>
          </div>
        </section>

        {/* About Us Content */}
        <section className="p-10 max-w-3xl mx-auto text-left">
          <p className="text-lg text-gray-700">
            <span className="text-pink-600 font-bold">ViMeet</span> was born from a simple question:
            <i> "What if connecting with new people was as easy as picking up your phone?"</i> 
            We wanted to create a space where anyone could experience the joy of a chance encounter.
            We’re passionate about fostering meaningful connections and we’re excited to have you join our community.
          </p>

          <p className="text-lg text-gray-700 mt-4">
            ViMeet is on a mission to bring the world closer, one conversation at a time.
            We believe in the power of human connection and have built a platform to make that easy.
            Whether you’re looking to expand your social circle, practice a new language, or brighten your day with a friendly chat, 
            ViMeet is here for you. Start connecting today and discover the world of possibilities.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
