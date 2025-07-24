
import { useState, useEffect } from "react";

const themes = {
  black: "black",
  white: "white",
  bluewhite: "bluewhite",
  yellowblack: "yellowblack",
};

export default function App() {
  const [works, setWorks] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "white");

  useEffect(() => {
    fetch("/api/works").then((res) => res.json()).then(setWorks);
  }, []);

  useEffect(() => {
    document.body.className = themes[theme];
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-5xl font-bold">Anukwu Chekwube Immanuel</h1>
        <p className="text-lg sm:text-xl mb-4">Graphics Designer Portfolio</p>
        <select
          className="p-2 rounded border"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="white">White</option>
          <option value="black">Black</option>
          <option value="bluewhite">Blue & White</option>
          <option value="yellowblack">Yellow & Black</option>
        </select>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {works.map((w) => (
          <div key={w.id} className="border rounded shadow overflow-hidden">
            {w.type && w.type.startsWith("video") ? (
              <video controls className="w-full">
                <source src={w.url} type={w.type} />
              </video>
            ) : (
              <img src={w.url} alt={w.title} className="w-full" />
            )}
            <div className="p-4">
              <h2 className="text-lg font-bold">{w.title}</h2>
              <p className="text-sm">{w.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-10 text-center">
        <a href="/admin/login" className="underline">Admin Login</a>
      </footer>
    </div>
  );
}
