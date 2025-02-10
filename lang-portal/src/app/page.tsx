import Image from "next/image";

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Welcome to LangPortal</h1>
      <p className="mt-4">
        <a href="/words" className="text-blue-500 hover:text-blue-600">
          Go to Words Management
        </a>
      </p>
    </main>
  );
}
