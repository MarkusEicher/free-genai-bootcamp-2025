import Image from "next/image";

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Welcome to LangPortal</h1>
      <nav className="mt-4 space-y-2">
        <p>
          <a href="/words" className="text-blue-500 hover:text-blue-600">
            Words Management
          </a>
        </p>
        <p>
          <a href="/groups" className="text-blue-500 hover:text-blue-600">
            Groups Management
          </a>
        </p>
        <p>
          <a href="/activities" className="text-blue-500 hover:text-blue-600">
            Activities & Practice
          </a>
        </p>
      </nav>
    </main>
  );
}
