export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-indigo-600">
          Network Simulator
        </h1>

        <ul className="flex gap-8 text-sm font-medium">
          <li className="cursor-pointer hover:text-indigo-600">Home</li>
          <li className="cursor-pointer hover:text-indigo-600">Graph</li>
          <li className="cursor-pointer hover:text-indigo-600">
            Network Graph
          </li>
        </ul>
      </div>
    </nav>
  );
}
